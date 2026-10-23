
// ============================================================
//  ① Telegraphed minions: every minion follows fixed rules and
//     shows its next step, so lines can be used to herd them.
//  ② Seal formation (封印の陣): at 2/3 and 1/3 boss HP the fight
//     pauses for a pure Flow puzzle — link every pair, fill every cell.
// ============================================================

// ---------- ① deterministic stepping ----------
//  down if free · hoppers jump one blocked cell · else sidestep in its current
//  direction (initially toward the centre), turning around only when blocked
function planStep(m) {
  const def = MINION[m.type], x = X(m.cell), y = Y(m.cell);
  if (y === N - 1) return { kind: "invade" };
  const down = m.cell + N;
  if (canEnter(down)) return { kind: "down", to: down };
  if (def.hop) {
    if (y === N - 2) return { kind: "hopInvade" };
    const d2 = m.cell + 2 * N;
    if (!blocked[down] && canEnter(d2)) return { kind: "hop", to: d2 };
  }
  if (!m.dir) m.dir = x < (N - 1) / 2 ? 1 : -1;
  for (const dir of [m.dir, -m.dir]) {
    const nx = x + dir;
    if (nx < 0 || nx >= N) continue;
    if (canEnter(m.cell + dir)) return { kind: "side", to: m.cell + dir, dir };
  }
  return { kind: "wait" };
}
stepMinion = function (m, now) {
  const p = planStep(m);
  const moveTo = c => { m.prev = m.cell; m.cell = c; m.stepT = now; };
  if (p.kind === "invade") return invade(m, now);
  if (p.kind === "hopInvade") { m.hopT = now; return invade(m, now); }
  if (p.kind === "down") return moveTo(p.to);
  if (p.kind === "hop") { m.hopT = now; return moveTo(p.to); }
  if (p.kind === "side") { m.dir = p.dir; return moveTo(p.to); }
};

// arrows: where each minion steps next (brighter as the step approaches)
function drawTelegraph(now) {
  if (phase !== "fight" || now < frozenUntil || rotating()) return;
  const cx = c => pad + (X(c) + .5) * cellPx, cy = c => pad + (Y(c) + .5) * cellPx;
  ctx.save(); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  for (const m of minions) {
    if (m.dead || m.fake !== undefined || (m.stunUntil && now < m.stunUntil) || now - m.born < 300) continue;
    const p = planStep(m);
    if (p.kind === "wait") continue;
    const soon = Math.max(0, Math.min(1, 1 - (m.moveAt - now) / 900));
    const danger = p.kind === "invade" || p.kind === "hopInvade";
    const col = danger ? "255,70,80" : "255,214,120";
    const x0 = cx(m.cell), y0 = cy(m.cell);
    let x1, y1, dx = 0, dy = 1;
    if (danger) { x1 = x0; y1 = y0 + cellPx * (p.kind === "hopInvade" ? 1.5 : .95); }
    else { x1 = cx(p.to); y1 = cy(p.to); dx = Math.sign(x1 - x0); dy = Math.sign(y1 - y0); }
    ctx.globalAlpha = .35 + .6 * soon;
    // chevron in the target cell
    const s = cellPx * (.16 + .05 * soon), tx = danger ? x1 : x0 + (x1 - x0) * .62, ty = danger ? y1 - cellPx * .25 : y0 + (y1 - y0) * .62;
    ctx.strokeStyle = `rgba(${col},1)`; ctx.lineWidth = Math.max(2, cellPx * .07);
    for (const off of [0, -s * .9]) {
      const bx = tx + dx * off, by = ty + dy * off;
      ctx.beginPath();
      ctx.moveTo(bx - dx * s - dy * s, by - dy * s - dx * s);
      ctx.lineTo(bx, by);
      ctx.lineTo(bx - dx * s + dy * s, by - dy * s + dx * s);
      ctx.stroke();
    }
    if (p.kind === "hop") {   // a small arc for a jump over a barrier
      ctx.setLineDash([cellPx * .08, cellPx * .1]); ctx.lineWidth = Math.max(1.5, cellPx * .04);
      ctx.beginPath(); ctx.moveTo(x0 + cellPx * .3, y0); ctx.quadraticCurveTo(x0 + cellPx * .75, (y0 + y1) / 2, x1 + cellPx * .3, y1 - cellPx * .1); ctx.stroke();
      ctx.setLineDash([]);
    }
  }
  ctx.restore();
}

// ---------- ② seal formation ----------
const SEAL_AT = [.66, .33], SEAL_MS = 60000;
let seal = null, sealsDone = 0, sealHowShown = false;

// a random full-cover Flow puzzle: random Hamiltonian path (backbite moves) cut into k segments
function genFlow(n, k) {
  const nb = c => { const x = c % n, y = (c / n) | 0, o = []; if (x > 0) o.push(c - 1); if (x < n - 1) o.push(c + 1); if (y > 0) o.push(c - n); if (y < n - 1) o.push(c + n); return o; };
  let p = [];
  for (let y = 0; y < n; y++) for (let i = 0; i < n; i++) p.push(y * n + (y % 2 ? n - 1 - i : i));
  const pos = new Int32Array(n * n), reidx = () => { for (let i = 0; i < p.length; i++) pos[p[i]] = i; };
  reidx();
  for (let it = 0; it < n * n * 80; it++) {
    if (Math.random() < .5) { p.reverse(); reidx(); }
    const cand = nb(p[0]).filter(c => pos[c] !== 1);
    if (!cand.length) continue;
    const i = pos[cand[(Math.random() * cand.length) | 0]];
    p = p.slice(0, i).reverse().concat(p.slice(i));
    for (let j = 0; j < i; j++) pos[p[j]] = j;
  }
  const L = p.length, maxLen = Math.max(6, Math.ceil(L * .38));
  for (let t = 0; t < 400; t++) {
    const cuts = new Set();
    while (cuts.size < k - 1) cuts.add(3 + ((Math.random() * (L - 5)) | 0));
    const cs = [...cuts].sort((a, b) => a - b).concat([L]);
    const segs = []; let prev = 0, ok = true;
    for (const c of cs) { if (c - prev < 3 || c - prev > maxLen) { ok = false; break; } segs.push(p.slice(prev, c)); prev = c; }
    if (ok) return segs;
  }
  const segs = [], step = Math.floor(L / k);
  for (let i = 0; i < k; i++) segs.push(p.slice(i * step, i === k - 1 ? L : (i + 1) * step));
  return segs;
}
function sealSize() { const i = stageIdx; return i <= 3 ? [5, 4] : i <= 7 ? [6, 5] : [7, 6]; }

function startSeal() {
  const now = performance.now(), [n, k] = sealSize();
  seal = { t0: now, until: now + SEAL_MS, solved: false, empty: 0,
           stash: { N, dots, paths, blocked, walls, minions, respawns, fading, cellFx, cur } };
  dragging = -1;
  N = n; buildNei();
  blocked = new Uint8Array(N * N); walls = []; minions = []; respawns = []; fading = []; cellFx = [];
  const puz = genFlow(n, k);
  seal.sol = puz;
  dots = puz.map((s, c) => ({ color: c, a: s[0], b: s[s.length - 1], born: now + 250 + c * 90 }));
  paths = dots.map(d => [d.a]);
  rebuildMaps(); layout(); draw(performance.now());   // repaint at once: resizing the canvas clears it
  cur = dots[0].a;
  phase = "seal";
  document.body.classList.add("sealing");
  if ($("tvLegend")) $("tvLegend").innerHTML = L().tvLegendSeal;
  banner(L().sealT); sndTaiko(); sndTaiko(.18); sndBell();
  showToast(L().sealHow, sealHowShown ? 3500 : 7000); sealHowShown = true;
  sealCheck();
}
function sealCheck() {
  if (!seal) return;
  let empty = 0;
  for (let i = 0; i < N * N; i++) if (owner[i] === -1 && dotAt[i] === -1) empty++;
  seal.empty = empty;
  const allLinked = dots.every((d, c) => isComplete(c));
  if (!seal.solved && allLinked && empty > 0 && seal.moreFor !== empty) {   // the classic stumble: linked, but holes left
    seal.moreFor = empty; seal.moreT = performance.now();
    showToast(L().sealMore(empty), 4500); sndBlock();
  }
  if (!seal.solved && empty === 0 && allLinked) {
    seal.solved = "ok"; seal.doneT = performance.now(); dragging = -1;
    sndSeal(); banner(L().sealOk);
    setTimeout(() => endSeal(true), 1100);
  }
}
function sealLinked(c) { dragging = -1; sndBell(); sealCheck(); }
function endSeal(ok) {
  if (!seal) return;
  const now = performance.now(), dt = now - seal.t0, st = seal.stash;
  N = st.N; buildNei();
  dots = st.dots; paths = st.paths; blocked = st.blocked; walls = st.walls;
  minions = st.minions; respawns = st.respawns; fading = st.fading; cellFx = st.cellFx;
  rebuildMaps(); layout(); dragging = -1; cur = st.cur;
  // the fight was frozen meanwhile
  spawnAt += dt; if (quakeAt) quakeAt += dt; if (frozenUntil > seal.t0) frozenUntil += dt;
  for (const m of minions) { m.moveAt += dt; m.stepT += dt; if (m.stunUntil) m.stunUntil += dt; if (m.disguiseAt) m.disguiseAt += dt; }
  for (const r of respawns) r.at += dt;
  seal = null; phase = "fight"; document.body.classList.remove("sealing");
  if ($("tvLegend")) $("tvLegend").innerHTML = L().tvLegend;
  if (ok) {   // a volley of talisman strikes: ~22% of each boss's max HP
    const r = cv.getBoundingClientRect(), x0 = r.left + r.width / 2, y0 = r.top + r.height * .4;
    aliveFoes().forEach(f => {
      const fi = foes.indexOf(f), total = Math.round(f.max * .22), n = 6;
      for (let i = 0; i < n; i++) shots.push({ x0: x0 + (Math.random() - .5) * 80, y0: y0 + (Math.random() - .5) * 80, t0: now + i * 70, dur: 700 - i * 40,
        color: PALETTE[i % PALETTE.length], dmg: i === n - 1 ? total : 0, foe: fi, bend: (Math.random() - .5) * 300, big: i === n - 1 });
    });
  } else banner(L().sealFail);
}
function sealUpdate(now) {
  if (!seal) return;
  const left = Math.max(0, seal.until - now);
  const total = N * N, filled = total - seal.empty;
  setH($("atkName"), L().sealBar(filled, total, Math.ceil(left / 1000)));
  setW($("atkBar"), Math.round(filled / total * 100) + "%");
  if (!seal.solved && left <= 0) { seal.solved = "fail"; dragging = -1; sndBlock(); setTimeout(() => endSeal(false), 700); }
}
// the formation overlay is static: drawn into an offscreen canvas only when the board changes,
// then copied each frame (per-frame dashed paths flicker on Fire TV GPUs)
let sealLayer = null, sealSig = "";
function drawSealOverlay(now) {
  if (!seal) return;
  const W = Math.round(boardPx * dpr), sig = `${W}|${N}|${seal.solved}|${owner.join(",")}`;
  if (!sealLayer || sig !== sealSig) {
    sealSig = sig;
    sealLayer = sealLayer || document.createElement("canvas");
    sealLayer.width = W; sealLayer.height = W;
    const g = sealLayer.getContext("2d");
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, boardPx, boardPx);
    g.strokeStyle = "rgba(255,210,90,.75)"; g.lineWidth = 5;
    rr(g, 2.5, 2.5, boardPx - 5, boardPx - 5, 11); g.stroke();
    if (!seal.solved) {
      for (let i = 0; i < N * N; i++) {
        if (owner[i] !== -1 || dotAt[i] !== -1) continue;
        const x = pad + X(i) * cellPx, y = pad + Y(i) * cellPx;
        g.fillStyle = "rgba(10,6,16,.5)"; rr(g, x + 3, y + 3, cellPx - 6, cellPx - 6, cellPx * .12); g.fill();
        g.setLineDash([cellPx * .1, cellPx * .08]);
        g.strokeStyle = "rgba(255,214,110,.7)"; g.lineWidth = Math.max(1.5, cellPx * .035);
        rr(g, x + 5, y + 5, cellPx - 10, cellPx - 10, cellPx * .1); g.stroke(); g.setLineDash([]);
      }
    }
  }
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(sealLayer, 0, 0);
  // the "holes left" hint: one slow orange warm-up over the holes (only for ~2.4 s after the hint)
  const wt = seal.moreT ? (now - seal.moreT) / 2400 : 1;
  if (!seal.solved && wt < 1) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = `rgba(255,140,60,${(.28 * Math.sin(wt * Math.PI)).toFixed(2)})`;
    for (let i = 0; i < N * N; i++) if (owner[i] === -1 && dotAt[i] === -1) { const x = pad + X(i) * cellPx, y = pad + Y(i) * cellPx; ctx.fillRect(x + 4, y + 4, cellPx - 8, cellPx - 8); }
  }
  ctx.restore();
}

// ---------- wiring ----------
const _startStageS = startStage;
startStage = function () {
  if (seal) { seal = null; document.body.classList.remove("sealing"); }
  sealsDone = 0;
  _startStageS();
};
const _drawS = draw;
draw = function (now) {
  _drawS(now);
  if (phase === "fight") {
    drawTelegraph(now);
    const S = STAGES[stageIdx];
    if (!S.tutorial && sealsDone < SEAL_AT.length && !shots.length && aliveFoes().length && !rotating() && dragging < 0) {
      const fr = foeHpFrac();
      if (fr <= SEAL_AT[sealsDone]) { while (sealsDone < SEAL_AT.length && fr <= SEAL_AT[sealsDone]) sealsDone++; startSeal(); }
    }
  } else if (phase === "seal") { sealUpdate(now); drawSealOverlay(now); }
};
const _openSelectS = openSelect;
openSelect = function () { if (phase === "seal") return; _openSelectS(); };

const SEAL_TXT = {
  en: { tvLegendSeal: "<b>OK</b> grab / release · <b>BACK</b> let go · <b>☰</b> clear lines", sealT: "SEAL FORMATION!", sealOk: "SEALED!", sealFail: "The formation broke…",
        sealHow: "<b>SEAL FORMATION!</b> Link every pair — and <b>leave no empty cell</b>. Lines can take the long way round: <b>cover the whole board</b> to seal it.",
        sealMore: e => `All pairs linked — but <b>${e} empty cell${e > 1 ? "s" : ""}</b> left! Re-route a line the <b>long way</b> to cover them.`,
        sealBar: (f, t, s) => `<b>SEAL</b> · filled <b>${f}/${t}</b> · ${s}s`,
        tut4: "Minions march toward your <b>gate ⛩</b>. The <b>arrows</b> show each one's next step — a half-drawn line is a wall you can <b>steer them</b> with. If one gets through, the gate takes damage!" },
  ja: { tvLegendSeal: "<b>決定</b> つかむ／はなす · <b>戻る</b> 線を消す · <b>☰</b> 全部消す", sealT: "封印の陣！", sealOk: "封印成功！", sealFail: "陣が破れた…",
        sealHow: "<b>封印の陣！</b>札をすべてつなぎ、さらに<b>空きマスをゼロ</b>にせよ。線は遠回りしてOK。<b>盤面を線で埋めつくせば</b>封印成功！",
        sealMore: e => `札は全部つながった！でも<b>空きマスがあと${e}</b>。線を<b>遠回り</b>させて埋めよう。`,
        sealBar: (f, t, s) => `<b>封印の陣</b> · 埋めた <b>${f}/${t}</b> マス · 残り${s}秒`,
        tut4: "手下は下の<b>鳥居 ⛩</b> を目指す。<b>矢印</b>は次に進むマス。描きかけの線は壁になるので、手下を<b>誘導</b>できる。抜けられると鳥居にダメージ！" },
  es: { tvLegendSeal: "<b>OK</b> agarrar / soltar · <b>ATRÁS</b> borrar línea · <b>☰</b> borrar todo", sealT: "¡FORMACIÓN DE SELLO!", sealOk: "¡SELLADO!", sealFail: "La formación se rompió…",
        sealHow: "<b>¡FORMACIÓN DE SELLO!</b> Une todos los pares y <b>no dejes ninguna casilla vacía</b>. Las líneas pueden dar rodeos: <b>cubre todo el tablero</b> para sellarlo.",
        sealMore: e => `¡Todos los pares unidos, pero quedan <b>${e} casillas vacías</b>! Desvía una línea por el <b>camino largo</b> para cubrirlas.`,
        sealBar: (f, t, s) => `<b>SELLO</b> · cubiertas <b>${f}/${t}</b> · ${s} s`,
        tut4: "Los esbirros marchan hacia tu <b>puerta ⛩</b>. Las <b>flechas</b> muestran su próximo paso: una línea a medio trazar es un muro para <b>guiarlos</b>. ¡Si uno pasa, la puerta recibe daño!" },
  de: { tvLegendSeal: "<b>OK</b> greifen / loslassen · <b>ZURÜCK</b> Linie löschen · <b>☰</b> alles löschen", sealT: "BANNKREIS!", sealOk: "GEBANNT!", sealFail: "Der Bannkreis zerbrach…",
        sealHow: "<b>BANNKREIS!</b> Verbinde alle Paare – und <b>lass kein Feld leer</b>. Linien dürfen Umwege machen: <b>bedecke das ganze Brett</b>, um zu bannen.",
        sealMore: e => `Alle Paare verbunden – aber noch <b>${e} leere Felder</b>! Führe eine Linie auf einem <b>Umweg</b>, um sie zu füllen.`,
        sealBar: (f, t, s) => `<b>BANN</b> · gefüllt <b>${f}/${t}</b> · ${s} s`,
        tut4: "Die Schergen marschieren zu deinem <b>Tor ⛩</b>. Die <b>Pfeile</b> zeigen ihren nächsten Schritt – eine halbe Linie ist eine Mauer, mit der du sie <b>lenkst</b>. Kommt einer durch, nimmt das Tor Schaden!" },
  ru: { tvLegendSeal: "<b>OK</b> взять / отпустить · <b>НАЗАД</b> стереть линию · <b>☰</b> стереть всё", sealT: "КРУГ ПЕЧАТИ!", sealOk: "ЗАПЕЧАТАНО!", sealFail: "Круг разрушен…",
        sealHow: "<b>КРУГ ПЕЧАТИ!</b> Соедини все пары и <b>не оставь пустых клеток</b>. Линии могут идти в обход: <b>заполни всё поле</b>, чтобы запечатать.",
        sealMore: e => `Все пары соединены, но осталось <b>пустых клеток: ${e}</b>! Проведи линию <b>в обход</b>, чтобы их заполнить.`,
        sealBar: (f, t, s) => `<b>ПЕЧАТЬ</b> · заполнено <b>${f}/${t}</b> · ${s} с`,
        tut4: "Прислужники идут к <b>вратам ⛩</b>. <b>Стрелки</b> показывают их следующий шаг — недорисованная линия становится стеной, чтобы <b>направлять</b> их. Прорвётся — врата получат урон!" },
};
for (const l of LANGS) Object.assign(I18N[l], SEAL_TXT[l]);
