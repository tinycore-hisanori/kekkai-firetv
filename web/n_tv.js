
// ============================================================
//  TV remote (D-pad) controls — Fire TV
//  D-pad moves a cursor, OK grabs / releases a talisman line,
//  Back pauses, ◀◀ / ▶▶ cast spells. Menus use spatial focus.
// ============================================================
const TV = /[?&]tv=1/.test(location.search) || /AFT|Fire TV|KFTV/i.test(navigator.userAgent) || !!window.KekkaiTV;
let cur = 0, keyMode = TV, tvFocus = null, demoTaps = 0, demoTm = 0;
if (TV) document.body.classList.add("tv", "kbd");

// ---------- TV "lite" rendering: Fire TV GPUs are weak ----------
//  · canvases at 1x (the WebView reports dpr 2 at 1080p → 4x the pixels)
//  · no canvas shadowBlur glows · no CSS drop-shadow / backdrop blur on animated elements
const LITE = TV || /[?&]lite=1/.test(location.search);
if (LITE) {
  try { Object.defineProperty(window, "devicePixelRatio", { get: () => 1, configurable: true }); } catch (e) {}
  try {
    const P = CanvasRenderingContext2D.prototype, d = Object.getOwnPropertyDescriptor(P, "shadowBlur");
    if (d && d.set) Object.defineProperty(P, "shadowBlur", { get: d.get, set() { d.set.call(this, 0); }, configurable: true });
  } catch (e) {}
  const st = document.createElement("style");
  st.textContent = `
    *, *::before, *::after { backdrop-filter:none !important; -webkit-backdrop-filter:none !important; }
    .foe img, .foe img.windup, body.final .foe img, #title img, .card img, .card .cimgs img, #selInfo .iFoes img { filter:none !important; }
    .foe img.hit { filter:brightness(2) !important; }
    .foe img.awake { filter:saturate(1.4) brightness(1.15) !important; }
    .foe img.crumble { filter:brightness(1.3) !important; }
    .foe::before { content:""; position:absolute; left:50%; top:52%; width:70%; aspect-ratio:1; transform:translate(-50%,-50%);
      background:radial-gradient(circle, rgba(170,60,255,.32) 0%, rgba(170,60,255,0) 65%); pointer-events:none; }
    body.final .foe::before { background:radial-gradient(circle, rgba(255,40,60,.32) 0%, rgba(255,40,60,0) 65%); }
    #jmap .edge.lit { filter:none; }
    @keyframes dead { 0% { opacity:1; } 100% { opacity:0; transform:scale(.4) translateY(-40px); } }
  `;
  document.head.appendChild(st);
  if (typeof layout === "function" && phase !== "title") layout();
}

const TVS = {
  en: { intro0: "Press <b>OK</b> on a talisman and steer the line to its <b>twin</b>. The link <b>strikes</b> the yokai!",
        tut1: "Move the cursor with the <b>D-pad</b>, press <b>OK</b> on a talisman, then steer the line to its <b>twin</b>. When linked, the line <b>vanishes and strikes</b> the yokai!",
        tut5: "Linking and purifying fills your <b>SPIRIT</b>. Press <b>◀◀ (Rewind)</b> for <b>縛 BIND</b> — every minion freezes for 4 seconds.",
        tut5b: "Now press <b>▶▶ (Fast-forward)</b> for <b>祓 PURGE</b> — it purifies <b>every</b> minion and heals the gate.",
        bindSub: "◀◀ freeze 4s", purgeSub: "▶▶ purify all · heal", tapFireworks: "Press OK to launch fireworks!",
        tvLegend: "<b>OK</b> grab / release · <b>BACK</b> pause · <b>☰</b> reset board", tvSkip: "SKIP TRAINING" },
  ja: { intro0: "札の上で<b>決定</b>して、同じ札まで線をのばそう。つないだ線が妖怪を<b>攻撃</b>する！",
        tut1: "<b>十字キー</b>でカーソルを動かし、札の上で<b>決定</b>。そのまま同じ札まで線をのばそう。つなぐと線が<b>消えて妖怪を攻撃</b>する！",
        tut5: "つないだり倒したりすると<b>霊力</b>が溜まる。<b>◀◀（巻き戻し）</b>で<b>縛の印</b>：手下を4秒間止めてみよう。",
        tut5b: "次は<b>▶▶（早送り）</b>で<b>祓の印</b>。盤面の手下を<b>すべて浄化</b>して、鳥居も少し回復する。",
        bindSub: "◀◀ 4秒停止", purgeSub: "▶▶ 全浄化・回復", tapFireworks: "決定ボタンで花火を打ち上げよう！",
        tvLegend: "<b>決定</b> つかむ／はなす · <b>戻る</b> ポーズ · <b>☰</b> 盤面リセット", tvSkip: "修行をとばす" },
  es: { intro0: "Pulsa <b>OK</b> sobre un talismán y guía la línea hasta su <b>gemelo</b>. ¡El enlace <b>golpea</b> al yokai!",
        tut1: "Mueve el cursor con la <b>cruceta</b>, pulsa <b>OK</b> sobre un talismán y guía la línea hasta su <b>gemelo</b>. Al unirlos, la línea <b>desaparece y golpea</b> al yokai.",
        tut5: "Unir y purificar llena tu <b>ESPÍRITU</b>. Pulsa <b>◀◀ (Retroceder)</b> para <b>縛 ATAR</b>: todos los esbirros se congelan 4 segundos.",
        tut5b: "Ahora pulsa <b>▶▶ (Avanzar)</b> para <b>祓 PURGAR</b>: purifica a <b>todos</b> los esbirros y cura la puerta.",
        bindSub: "◀◀ congela 4 s", purgeSub: "▶▶ purifica todo · cura", tapFireworks: "¡Pulsa OK para lanzar fuegos artificiales!",
        tvLegend: "<b>OK</b> agarrar / soltar · <b>ATRÁS</b> pausa · <b>☰</b> reiniciar tablero", tvSkip: "SALTAR ENTRENAMIENTO" },
  de: { intro0: "Drücke <b>OK</b> auf einem Talisman und führe die Linie zu seinem <b>Zwilling</b>. Die Linie <b>trifft</b> den Yokai!",
        tut1: "Bewege den Cursor mit dem <b>Steuerkreuz</b>, drücke <b>OK</b> auf einem Talisman und führe die Linie zu seinem <b>Zwilling</b>. Verbunden <b>verschwindet</b> die Linie und <b>trifft</b> den Yokai!",
        tut5: "Verbinden und Läutern füllt deinen <b>GEIST</b>. Drücke <b>◀◀ (Zurückspulen)</b> für <b>縛 BANN</b> — alle Schergen erstarren 4 Sekunden.",
        tut5b: "Jetzt <b>▶▶ (Vorspulen)</b> für <b>祓 LÄUTERN</b> — es läutert <b>alle</b> Schergen und heilt das Tor.",
        bindSub: "◀◀ 4 s einfrieren", purgeSub: "▶▶ alle läutern · heilen", tapFireworks: "Drücke OK für ein Feuerwerk!",
        tvLegend: "<b>OK</b> greifen / loslassen · <b>ZURÜCK</b> Pause · <b>☰</b> Brett zurücksetzen", tvSkip: "TRAINING ÜBERSPRINGEN" },
  ru: { intro0: "Нажми <b>OK</b> на талисмане и веди линию к его <b>двойнику</b>. Линия <b>бьёт</b> ёкая!",
        tut1: "Двигай курсор <b>крестовиной</b>, нажми <b>OK</b> на талисмане и веди линию к его <b>близнецу</b>. Соединённая линия <b>исчезает и бьёт</b> ёкая!",
        tut5: "Связи и очищение копят <b>ДУХ</b>. Нажми <b>◀◀ (назад)</b> — <b>縛 ОКОВЫ</b> заморозят всех приспешников на 4 секунды.",
        tut5b: "Теперь <b>▶▶ (вперёд)</b> — <b>祓 ОЧИЩЕНИЕ</b> очистит <b>всех</b> приспешников и подлечит врата.",
        bindSub: "◀◀ заморозка 4 с", purgeSub: "▶▶ очистить всё · лечение", tapFireworks: "Нажми OK, чтобы запустить фейерверк!",
        tvLegend: "<b>OK</b> взять / отпустить · <b>НАЗАД</b> пауза · <b>☰</b> сброс поля", tvSkip: "ПРОПУСТИТЬ ОБУЧЕНИЕ" },
};
for (const l of LANGS) { if (TV) { const { intro0, ...rest } = TVS[l]; Object.assign(I18N[l], rest); I18N[l].b[0].intro = intro0; } else { I18N[l].tvLegend = TVS[l].tvLegend; I18N[l].tvSkip = TVS[l].tvSkip; } }

// paralysis (しびれ): a line touching a minion stops it for a few seconds
const STUN_TXT = {
  en: { stunned: "ZAP! Paralysed", tut2: "A <b>minion</b>! Steer your line <b>onto it</b> — a line that touches a minion <b>paralyses</b> it for a few seconds. Then finish the link to <b>destroy</b> it." },
  ja: { stunned: "しびれた！", tut2: "<b>手下</b>が来た！線を手下の<b>上に通す</b>と、数秒間<b>しびれて動けなくなる</b>。そのまま札をつなげば<b>倒せる</b>。" },
  es: { stunned: "¡Paralizado!", tut2: "¡Un <b>esbirro</b>! Lleva la línea <b>sobre él</b>: una línea que lo toca lo <b>paraliza</b> unos segundos. Luego completa el enlace para <b>destruirlo</b>." },
  de: { stunned: "Gelähmt!", tut2: "Ein <b>Scherge</b>! Führe die Linie <b>über ihn</b> – eine Linie, die ihn berührt, <b>lähmt</b> ihn einige Sekunden. Dann schließe die Verbindung, um ihn zu <b>vernichten</b>." },
  ru: { stunned: "Парализован!", tut2: "<b>Прислужник</b>! Проведи линию <b>через него</b> — коснувшись, линия <b>парализует</b> его на несколько секунд. Затем замкни связь и <b>уничтожь</b> его." },
};
for (const l of LANGS) Object.assign(I18N[l], STUN_TXT[l]);

// extra UI: legend + pause-menu "skip training"
(() => {
  const lg = document.createElement("div"); lg.id = "tvLegend"; lg.dataset.i = "tvLegend"; document.body.appendChild(lg);
  const sk = document.createElement("button"); sk.id = "tvSkip"; sk.className = "ctrl"; sk.dataset.i = "tvSkip";
  $("selClose").insertAdjacentElement("beforebegin", sk);
  sk.addEventListener("click", () => { closeSelect(false); $("skipTut").click(); });
  const st = document.createElement("style");
  st.textContent = `
    #tvLegend { position:fixed; left:12px; bottom:8px; font-size:12px; color:#cbb8d8; background:rgba(10,6,18,.72);
      padding:3px 12px; border-radius:12px; z-index:5; display:none; white-space:nowrap; pointer-events:none; }
    #tvLegend b { color:#ffd65a; }
    .dmg.stun { color:#fff27a; font-size:22px; text-shadow:0 0 10px #ffb400, 0 2px 0 #000; }
    body.kbd.fighting #tvLegend { display:block; }
    #tvSkip { display:none; margin-right:8px; }
    body.kbd .tvf { outline:3px solid #ffd76a !important; outline-offset:3px; box-shadow:0 0 22px rgba(255,190,70,.85) !important; transform:scale(1.06); z-index:3; position:relative; }
    body.kbd .card.tvf { transform:scale(1.08); }
    body.tv { cursor:none; }
  `;
  document.head.appendChild(st);
})();
applyLang();

const DIRS = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
function keyAction(e) {
  const k = e.key;
  if (DIRS[k]) return k;
  if (k === "Enter" || k === " " || k === "Select") return "ok";
  if (k === "Escape" || k === "Backspace" || k === "GoBack" || k === "BrowserBack") return "back";
  if (k === "MediaRewind" || k === "MediaTrackPrevious" || k === "[") return "bind";
  if (k === "MediaFastForward" || k === "MediaTrackNext" || k === "]") return "purge";
  if (k === "MediaPlayPause" || k === "MediaPlay" || k === "MediaPause" || k === "p" || k === "P") return "pause";
  if (k === "ContextMenu" || k === "r" || k === "R") return "menu";
  return null;
}
window.addEventListener("keydown", e => {
  const a = keyAction(e);
  if (!a) return;
  e.preventDefault(); e.stopPropagation();
  if (e.repeat && (a === "ok" || a === "back" || a === "pause" || a === "menu")) return;
  tvAction(a);
}, true);
window.tvKey = a => tvAction(a);          // called by the Android wrapper for keys the WebView never sees
window.addEventListener("pointerdown", () => { if (!TV) { keyMode = false; document.body.classList.remove("kbd"); } }, true);

function tvAction(a) {
  if (!keyMode) { keyMode = true; document.body.classList.add("kbd"); }
  try { ac().resume(); } catch (e) {}
  if (bgmWant && !bgmCur && !muted) playBgm(bgmWant, bgmOpts);   // keys count as the first gesture too
  if (a === "bind") { if (phase === "fight") castBind(); return; }
  if (a === "purge") { if (phase === "fight") castPurge(); return; }
  const layer = activeLayer();
  if (layer) { menuKey(layer, a); return; }
  if (phase === "fight" || (phase === "seal" && seal && !seal.solved)) boardKey(a);
}

// ---------- menus ----------
const shown = el => el && getComputedStyle(el).display !== "none";
function activeLayer() {
  if (shown($("ending"))) return $("endCard").classList.contains("show") ? $("endCard") : $("ending");
  if (shown($("select"))) return $("select");
  if (shown($("overlay"))) return $("overlay");
  if (shown($("title"))) return $("title");
  return null;
}
function focusables(layer) {
  return [...layer.querySelectorAll("button")].filter(b => b.getClientRects().length && !b.classList.contains("locked") && getComputedStyle(b).visibility !== "hidden");
}
function defaultFocus(layer, list) {
  const id = { title: "startBtn", overlay: "ovBtn", endCard: "endStages" }[layer.id];
  if (id && list.includes($(id))) return $(id);
  if (layer.id === "select") {
    if (pausedPhase === "fight") return $("selClose");
    const cards = list.filter(b => b.classList.contains("card"));
    return cards.find(b => !b.classList.contains("done")) || cards[cards.length - 1] || list[0];
  }
  return list[0];
}
function pickDir(list, from, dx, dy) {
  const r0 = from.getBoundingClientRect(), x0 = r0.left + r0.width / 2, y0 = r0.top + r0.height / 2;
  let best = null, bs = 1e9;
  for (const b of list) {
    if (b === from) continue;
    const r = b.getBoundingClientRect(), vx = r.left + r.width / 2 - x0, vy = r.top + r.height / 2 - y0;
    const along = vx * dx + vy * dy; if (along <= 4) continue;
    const s = along + Math.abs(vx * dy - vy * dx) * 2.5;
    if (s < bs) { bs = s; best = b; }
  }
  return best;
}
function setFocus(el) {
  if (tvFocus && tvFocus !== el) tvFocus.classList.remove("tvf");
  tvFocus = el;
  if (el) { el.classList.add("tvf"); try { el.focus({ preventScroll: true }); } catch (e) {} el.scrollIntoView({ block: "nearest" }); }
}
function refreshFocus() {
  document.body.classList.toggle("fighting", (phase === "fight" || phase === "seal") && !activeLayer());
  $("tvSkip").style.display = pausedPhase === "fight" && STAGES[stageIdx].tutorial ? "inline-block" : "none";
  if (!keyMode) { if (tvFocus) { tvFocus.classList.remove("tvf"); tvFocus = null; } return; }
  const layer = activeLayer();
  if (!layer || layer.id === "ending") { setFocus(null); return; }
  const list = focusables(layer);
  if (!list.includes(tvFocus)) setFocus(defaultFocus(layer, list));
}
setInterval(refreshFocus, 120);

function menuKey(layer, a) {
  if (layer.id === "title" && a === "menu") {   // demo/recording helper: ☰ ×5 on the title unlocks every stage (this session only)
    demoTaps = (demoTaps || 0) + 1; clearTimeout(demoTm); demoTm = setTimeout(() => demoTaps = 0, 3000);
    if (demoTaps >= 5) { demoTaps = 0; STAGES.forEach((S, i) => { if (!prog.cleared[i - 1] && i > 0) prog.cleared[i - 1] = prog.cleared[i - 1] || "demo"; }); banner("DEMO: ALL STAGES"); }
    return;
  }
  if (layer.id === "ending") {          // parade: OK = fireworks, BACK = skip
    if (a === "ok") endFirework(false, innerWidth * (.15 + .7 * Math.random()), innerHeight * (.15 + .35 * Math.random()));
    else if (a === "back" || a === "pause") endFinish();
    return;
  }
  const list = focusables(layer);
  if (!list.length) return;
  if (!list.includes(tvFocus)) { setFocus(defaultFocus(layer, list)); if (DIRS[a]) return; }
  if (DIRS[a]) { const n = pickDir(list, tvFocus, ...DIRS[a]); if (n) { setFocus(n); sndTick(); } return; }
  if (a === "ok") { const el = tvFocus; el.click(); setTimeout(refreshFocus, 0); return; }
  if (a === "back" || a === "pause") {
    if (layer.id === "select") $("selClose").click();
    else if (layer.id === "endCard") $("endTitle").click();
    else if (layer.id === "title" && window.KekkaiTV && KekkaiTV.exit) KekkaiTV.exit();
    setTimeout(refreshFocus, 0);
  }
}

// ---------- board ----------
let keyQueue = [], keyQueueTm = 0;
function boardKey(a) {
  if (rotating()) {                              // keys pressed while the board turns are played right after
    if (keyQueue.length < 6) keyQueue.push(a);
    clearTimeout(keyQueueTm);
    keyQueueTm = setTimeout(() => { const q = keyQueue; keyQueue = []; for (const k of q) if (phase === "fight" && !activeLayer()) boardKey(k); }, Math.max(0, 520 - (performance.now() - rotT)));
    return;
  }
  if (DIRS[a]) {
    const [dx, dy] = DIRS[a];
    if (dragging >= 0) {
      const x = X(cur) + dx, y = Y(cur) + dy;
      if (x < 0 || y < 0 || x >= N || y >= N) { sndBlock(); return; }
      const nc = idx(x, y);
      tryStep(nc);
      if (dragging < 0) { cur = nc; return; }                  // link completed
      const p = paths[dragging], head = p[p.length - 1];
      if (head !== nc) sndBlock();
      cur = head;
      return;
    }
    // free cursor: hop over walls
    let x = X(cur), y = Y(cur);
    for (;;) {
      x += dx; y += dy;
      if (x < 0 || y < 0 || x >= N || y >= N) return;
      if (!blocked[idx(x, y)]) { cur = idx(x, y); return; }
    }
  }
  if (a === "ok") {
    if (dragging >= 0) { endDrag(); sndTick(); return; }     // release: a half-drawn line stays as a barricade
    if (blocked[cur]) return;
    if (dotAt[cur] !== -1) { const c = dotAt[cur]; paths[c] = [cur]; dragging = c; rebuildMaps(); sndTick(); return; }
    if (owner[cur] !== -1) { const c = owner[cur]; paths[c].length = paths[c].indexOf(cur) + 1; dragging = c; rebuildMaps(); sndTick(); return; }
    sndBlock(); return;
  }
  if (phase === "seal" && (a === "back" || a === "pause")) {   // no pausing inside the formation: Back just lets go
    if (dragging >= 0) { const c = dragging; paths[c] = [paths[c][0]]; dragging = -1; rebuildMaps(); sealCheck(); }
    return;
  }
  if (a === "back" || a === "pause") {
    if (dragging >= 0 && a === "back") { const c = dragging; paths[c] = [paths[c][0]]; dragging = -1; rebuildMaps(); return; }
    dragging = -1; openSelect(); return;
  }
  if (a === "menu") $("resetBtn").click();
}

// cursor follows stage changes and the Wall's quake
const _startStage = startStage;
startStage = function () {
  _startStage();
  const d = dots.find(Boolean);
  cur = d ? d.a : idx(N >> 1, N >> 1);
};
const _rotateBoard = rotateBoard;
rotateBoard = function () {
  const held = keyMode ? dragging : -1;          // the remote keeps holding its line through the Wall's quake
  _rotateBoard();
  if (held >= 0 && paths[held] && paths[held].length) { dragging = held; cur = paths[held][paths[held].length - 1]; }
  else cur = idx(N - 1 - Y(cur), X(cur));
};

// softer full-screen flashes everywhere (no pure-white strobes on a TV)
flash = function (color = "#fff", ms = 500) {
  const f = $("flash"); f.style.background = color === "#fff" ? "#fff3d6" : color; f.style.transition = "none"; f.style.opacity = ".28";
  void f.offsetWidth; f.style.transition = `opacity ${Math.max(ms, 700)}ms ease-out`; f.style.opacity = "0";
};
const _draw = draw;
draw = function (now) {
  _draw(now);
  if (keyMode && (phase === "fight" || phase === "seal") && !rotating()) drawCursor(now);
};
function drawCursor(now) {
  if (cur >= N * N) cur = 0;
  const x = pad + X(cur) * cellPx, y = pad + Y(cur) * cellPx, p = .5 + .5 * Math.sin(now / 170);
  const col = dragging >= 0 && dots[dragging] ? PALETTE[dots[dragging].color] : "#ffd76a";
  ctx.save(); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.shadowColor = col; ctx.shadowBlur = 12 + 10 * p;
  ctx.strokeStyle = col; ctx.lineWidth = dragging >= 0 ? 5 : 3 + 1.5 * p;
  rr(ctx, x + 3, y + 3, cellPx - 6, cellPx - 6, cellPx * .14); ctx.stroke();
  // corner brackets
  ctx.shadowBlur = 0; ctx.lineWidth = 2; ctx.strokeStyle = "#fff8e0";
  const k = cellPx * .22, o = -2 - 2 * p;
  for (const [sx, sy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    const cx = x + sx * cellPx + (sx ? -o : o), cy = y + sy * cellPx + (sy ? -o : o), ux = sx ? -1 : 1, uy = sy ? -1 : 1;
    ctx.beginPath(); ctx.moveTo(cx + ux * k, cy); ctx.lineTo(cx, cy); ctx.lineTo(cx, cy + uy * k); ctx.stroke();
  }
  ctx.restore();
}

// app lifecycle (Android wrapper): Home button / screensaver → pause the fight, silence audio
window.tvSuspend = () => {
  if (phase === "fight" && !activeLayer()) { dragging = -1; openSelect(); }
  try { stopDrone(); } catch (e) {}
  stopBgm(true);
};
window.tvResume = () => { if (bgmWant && !muted) playBgm(bgmWant, bgmOpts); };
