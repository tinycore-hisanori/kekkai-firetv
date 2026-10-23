// ============================================================
//  Boss flow
// ============================================================
const aliveFoes = () => foes.filter(f => !f.dead);
const foeHpFrac = () => foes.reduce((a, f) => a + f.hp, 0) / foes.reduce((a, f) => a + f.max, 0);
function stageName(i = stageIdx) { return STAGES[i].foes.map(bossName).join(" & "); }
function stageIntro() { const S = STAGES[stageIdx]; return S.duo != null ? L().duo[S.duo] : L().b[S.foes[0]].intro; }
function buildFoes() {
  const S = STAGES[stageIdx], D = stageDef();
  const box = $("foes"); box.innerHTML = "";
  box.className = S.foes.length > 1 ? "duo" : "";
  foes = S.foes.map((bi, i) => {
    const B = BOSSES[bi], max = Math.round(B.hp * D.hpMul);
    const el = document.createElement("div"); el.className = "foe";
    el.innerHTML = `<div class="foeBar"><div class="foeName"><span class="jp">${B.jp}</span> <span class="nm">${bossName(bi)}</span><span class="hpTxt"></span></div>
      <div class="bar"><div class="lag"></div><div class="hp"></div></div></div><img alt="">`;
    box.appendChild(el);
    const img = el.querySelector("img");
    img.src = SPRITES[B.key];
    img.className = "enter"; img.style.animationDelay = (i * .25) + "s";
    return { bi, hp: max, max, el, img, dead: false, quake: B.quake || 0 };
  });
}
function startStage() {
  const S = STAGES[stageIdx];
  stageToken++;
  $("select").style.display = "none"; $("finalSeal").style.display = "none";
  pausedPhase = null; dragging = -1; respawns = []; minions = []; fading = []; cellFx = []; shards = [];
  hideEnding(); $("gogo").classList.remove("show");
  life = 100; rei = S.tutorial || stageIdx === 1 ? 0 : 40;
  shots = []; frozenUntil = 0; links = 0; kills = 0;
  buildFoes();
  $("bossNum").textContent = S.tutorial ? L().training : `${stageIdx} / ${STAGES.length - 1}`;
  makeBoard();
  phase = "fight";
  const now = performance.now();
  stageStart = now;
  tut = null; hideTutor(); $("overlay").style.display = "none";
  spawnAt = S.tutorial ? 1e15 : now + 2500;             // training: minions are scripted
  const qf = foes.find(f => f.quake);
  quakeAt = qf ? now + qf.quake : 0;
  if (S.tutorial) tutStart(); else showToast(stageIntro(), 7000);
  endFinalMood();
  if (isFinal()) { stopBgm(); hideToast(); finalIntro(); updateHud(); return; }
  playBgm("game");
  banner(stageName().toUpperCase());
  sndTaiko(); sndTaiko(.2);
  updateHud();
}

function rotateBoard() {
  const rot = c => idx(N - 1 - Y(c), X(c));   // 90° clockwise
  for (const d of dots) if (d) { d.a = rot(d.a); d.b = rot(d.b); }
  paths = paths.map(p => p.map(rot));
  const nb = new Uint8Array(N * N);
  for (let c = 0; c < N * N; c++) if (blocked[c]) nb[rot(c)] = 1;
  blocked = nb;
  walls = walls.map(w => ({ x: N - w.y - w.h, y: w.x, w: w.h, h: w.w }));
  for (const m of minions) { m.cell = rot(m.cell); m.prev = m.cell; }
  dragging = -1;
  rebuildMaps();
  rotT = performance.now();
  shake = 14; sndQuake();
}

// ============================================================
//  Minions (tower-defense): march from the top row to the gate
// ============================================================
const canEnter = c => !blocked[c] && dotAt[c] === -1 && owner[c] === -1 && !minionAtCell(c);
function spawnMinion(now, type, cell, owner) {
  const D = stageDef();
  if (owner == null) { const af = aliveFoes(); if (!af.length) return null; owner = foes.indexOf(pickOne(af)); }
  type = type || pickOne(BOSSES[foes[owner].bi].types);
  if (cell == null) {
    const top = [];
    for (let x = 0; x < N; x++) if (canEnter(idx(x, 0))) top.push(idx(x, 0));
    if (!top.length) return null;
    cell = pickOne(top);
  }
  const def = MINION[type];
  const m = { type, cell, owner, prev: cell - N, stepT: now, moveAt: now + D.move * def.speed * (0.9 + Math.random() * .3), born: now, hp: 1 };
  if (Y(cell) === 0) m.prev = -1;   // walks in from above the board
  if (def.disguise) m.disguiseAt = now + 700;
  minions.push(m);
  return m;
}
function stepMinion(m, now) {
  const def = MINION[m.type];
  const x = X(m.cell), y = Y(m.cell);
  const moveTo = c => { m.prev = m.cell; m.cell = c; m.stepT = now; };
  // leaving through the gate
  if (y === N - 1) { invade(m, now); return; }
  const down = m.cell + N;
  if (canEnter(down)) return moveTo(down);
  if (def.hop) {                         // hops over one blocked cell (barriers, talismans)
    if (y === N - 2) { m.hopT = now; invade(m, now); return; }
    const d2 = m.cell + 2 * N;
    if (!blocked[down] && canEnter(d2)) { m.hopT = now; return moveTo(d2); }
  }
  // sidestep: prefer the side that opens a way down, avoid stepping straight back
  const side = [];
  if (x > 0) side.push(m.cell - 1);
  if (x < N - 1) side.push(m.cell + 1);
  const opts = side.filter(canEnter);
  if (!opts.length) return;
  opts.sort((a, b) => (canEnter(b + N) - canEnter(a + N)) || ((a === m.prev) - (b === m.prev)) || (Math.random() - .5));
  if (opts[0] === m.prev && opts.length === 1 && Math.random() < .5) return;
  moveTo(opts[0]);
}
function invade(m, now) {
  m.dead = true; m.exitT = now;
  gateHitT = now; gateHitX = pad + (X(m.cell) + .5) * cellPx;
  const r = cv.getBoundingClientRect();
  const [x] = cellPage(m.cell, r);
  burst(x, r.top + (boardPx + gateH * .5) * r.height / (boardPx + gateH), "#ff3050", 22);
  banner(L().invaded);
  tutEvent("invade");
  hurt(INVADE_DMG, m.cell);
}
// a line touching a minion paralyses it (しびれ) for a few seconds
function stunMinion(m, now) {
  const fresh = !m.stunUntil || now >= m.stunUntil - STUN_MS * .5;
  m.stunUntil = now + STUN_MS; m.moveAt = Math.max(m.moveAt, m.stunUntil + 250);
  if (!fresh) return;
  m.stunT = now;
  tone(1500, .1, .05, "sawtooth", 0, .35); tone(620, .16, .04, "square", .05, .55);
  const [x, y] = cellPage(m.cell, cv.getBoundingClientRect());
  floatText(L().stunned, x, y - 18, "stun");
  tutEvent("stun");
}
// a link passing over a fake talisman turns it back into a fox
function revealFox(m, now) {
  m.fake = undefined; m.revealed = true; m.hopT = now;
  cellFx.push({ kind: "puff", cell: m.cell, t0: now, life: 500 });
  tone(700, .25, .06, "triangle", 0, 1.6);
}
function purifyMinion(m, now) {
  m.dead = true;
  const [x, y] = cellPage(m.cell, cv.getBoundingClientRect());
  burst(x, y, "#ffe27a", 14);
  tone(1760, .3, .05); tone(2637, .3, .03, "sine", .05);
}
function updateMinions(now) {
  const B = stageDef();
  // a lone survivor of a duo is enraged
  const lone = foes.length > 1 && aliveFoes().length === 1 ? (isFinal() ? .6 : .75) : 1;
  if (now >= spawnAt && now >= frozenUntil) {
    // waves speed up as the bosses weaken
    const rage = (1 - .35 * (1 - foeHpFrac())) * lone;
    spawnAt = now + B.spawnEvery * rage * (0.8 + Math.random() * .4);
    if (minions.length < N + 2) spawnMinion(now);
  }
  // foxes turn into fake talismans of a colour currently on the board
  for (const m of minions) if (m.disguiseAt && now >= m.disguiseAt && !m.revealed) {
    const alive = dots.filter(Boolean).map(d => d.color);
    if (alive.length) { m.fake = pickOne(alive); m.disguiseAt = 0; cellFx.push({ kind: "puff", cell: m.cell, t0: now, life: 500 }); tone(900, .2, .04, "triangle", 0, .6); }
  }
  if (now >= frozenUntil) for (const m of minions) {
    if (m.dead || now < m.moveAt) continue;
    if (m.stunUntil && now < m.stunUntil) { m.moveAt = m.stunUntil + 250; continue; }
    stepMinion(m, now);
    const rage = (1 - .25 * (1 - foeHpFrac())) * (lone < 1 ? .85 : 1);
    m.moveAt = now + (m.slowMove || B.move * MINION[m.type].speed * rage) * (0.85 + Math.random() * .3);
  }
  minions = minions.filter(m => !m.dead);
  // Nurikabe quake
  if (quakeAt && now >= quakeAt) {
    const qf = foes.find(f => f.quake && !f.dead);
    if (qf) { rotateBoard(); quakeAt = now + qf.quake; } else quakeAt = 0;
  }
}

// ---------- damage ----------
function hurt(d, cell) {
  life = Math.max(isTutorial() ? 30 : 0, life - d);
  sndHurt(); shake = 12;
  $("hurtFlash").classList.add("on"); setTimeout(() => $("hurtFlash").classList.remove("on"), 180);
  const r = cv.getBoundingClientRect();
  const [x, y] = cell != null ? cellPage(cell, r) : [r.left + r.width / 2, r.top + r.height / 2];
  floatText(`-${d}`, x, y, "hurt");
  if (life <= 0) lose();
}
function lose() {
  if (phase !== "fight") return;
  phase = "over"; dragging = -1; sndLose(); endFinalMood();
  const tok = stageToken;
  setTimeout(() => { if (tok === stageToken && phase === "over") showOverlay(L().defeated, L().defeatedMsg(stageName()), L().retry); }, 900);
}
function foeDown(f) {
  f.dead = true; f.hp = 0;
  const now = performance.now();
  const fi = foes.indexOf(f);
  for (const m of minions) if (m.owner === fi) purifyMinion(m, now);   // its minions vanish with it
  minions = minions.filter(m => !m.dead);
  const last = !aliveFoes().length;
  if (last && isFinal()) { stageClear(f); return; }      // the last evil yokai crumbles instead
  f.img.className = "dead";
  sndSeal(); banner(`${L().sealedB}`);
  sparkleBoss(60, fi);
  if (last) stageClear();
  else if (isFinal()) awaken(aliveFoes()[0]);
  else showToast(L().enraged, 4000);
}
function stageClear(lastFoe) {
  phase = "bossdown"; dragging = -1;
  const now = performance.now();
  for (const m of minions) purifyMinion(m, now);
  minions = [];
  const sec = (now - stageStart) / 1000;
  markCleared(stageIdx, sec);
  tut = null; hideTutor();
  const show = () => {
    if (STAGES[stageIdx].tutorial) showOverlay(L().tutDone, L().tutDoneMsg(stageName(1)), L().next, true);
    else if (stageIdx === STAGES.length - 1) { phase = "win"; showOverlay(L().safe, L().safeMsg(fmtTime(sec)), L().stages, false); }
    else showOverlay(L().sealedT, L().sealedMsg(stageName(), stageName(stageIdx + 1)) + `<br><small>⏱ ${fmtTime(sec)}</small>`, L().next, true);
  };
  const tok = stageToken;
  const guarded = () => { if (tok === stageToken && (phase === "bossdown" || phase === "win")) show(); };
  if (isFinal()) finalCollapse(lastFoe || foes[foes.length - 1], () => showEnding(sec));
  else setTimeout(guarded, 1700);
}
function showOverlay(t, m, b, withSel = true) {
  $("ovTitle").textContent = t; $("ovMsg").innerHTML = m; $("ovBtn").textContent = b;
  $("ovSel").style.display = withSel ? "" : "none"; $("ovSel").textContent = L().stages;
  $("overlay").style.display = "flex";
}
$("ovBtn").addEventListener("click", () => {
  $("overlay").style.display = "none";
  if (phase === "win") { openSelect(); return; }
  if (phase === "bossdown") stageIdx++;
  startStage();
});
$("ovSel").addEventListener("click", () => { $("overlay").style.display = "none"; phase = "menu"; openSelect(); });

// ============================================================
//  Linking: vanish + strike + destroy every minion on the path
// ============================================================
function onComplete(c) {
  const now = performance.now();
  const p = paths[c].slice();
  const r = cv.getBoundingClientRect();
  links++;
  combo = now - lastLinkT < COMBO_WINDOW ? Math.min(COMBO_MAX, combo + 1) : 0;
  lastLinkT = now;
  const cmult = 1 + COMBO_STEP * combo;
  rei = Math.min(100, rei + REI_LINK);
  sndBell(); sndShoot();
  // the link itself strikes
  const base = Math.round(p.length * DMG_PER_CELL * cmult);
  const [lx, ly] = cellPage(p[p.length >> 1], r);
  const weakest = aliveFoes().sort((a, b) => a.hp - b.hp)[0];
  shots.push({ x0: lx, y0: ly, t0: now, dur: 520, color: PALETTE[c], dmg: base, foe: foes.indexOf(weakest), bend: (Math.random() - .5) * 240 });
  // minions caught on the link
  const onPath = new Set(p);
  const caught = minions.filter(m => onPath.has(m.cell));
  if (caught.length) {
    const n = caught.length;
    const each = Math.round(KILL_DMG * (1 + MULTI_STEP * (n - 1)) * cmult);
    caught.forEach((m, i) => {
      const [x, y] = cellPage(m.cell, r);
      purifyMinion(m, now);
      shots.push({ x0: x, y0: y, t0: now + 80 + i * 70, dur: 540, color: "#ffe27a", dmg: each, big: n > 1, foe: m.owner, bend: (Math.random() - .5) * 220 });
      if (MINION[m.type].split) {   // the big one splits in two
        const around = [m.cell, m.cell - 1, m.cell + 1, m.cell - N].filter(k => k >= 0 && k < N * N && Math.abs(X(k) - X(m.cell)) <= 1 && !blocked[k] && dotAt[k] === -1);
        around.slice(0, 2).forEach((k, j) => { const s = spawnMinion(now, "imp", k, m.owner); if (s) { s.moveAt = now + 900 + j * 200; s.prev = k; } });
      }
    });
    kills += n;
    tutEvent("kill", n);
    rei = Math.min(100, rei + REI_KILL * n);
    if (n >= 2) { banner(`${n} × ${L().multi}`); sndCounter(); }
  }
  if (combo > 0) floatText(`${L().combo} ×${cmult.toFixed(2).replace(/0$/, "")}`, lx, ly - 30, "big");
  // the link vanishes; a new pair appears shortly
  fading.push({ path: p, color: c, t0: now });
  paths[c] = []; dots[c] = null;
  if (dragging === c) dragging = -1;
  minions = minions.filter(m => !m.dead);
  rebuildMaps();
  respawns.push({ c, at: now + RESPAWN_MS });
  tutEvent("link");
}
function targetFoe(fi) {
  let f = foes[fi];
  if (!f || f.dead) f = aliveFoes()[0];
  return f;
}
function damageBoss(d, big, fi) {
  if (phase !== "fight") return;
  const f = targetFoe(fi);
  if (!f) return;
  f.hp = Math.max(isTutorial() && tut && tut.step < 6 ? Math.round(f.max * .5) : 0, f.hp - d);   // training: boss holds until the last step
  sndHit();
  const img = f.img;
  img.classList.remove("hit"); void img.offsetWidth; img.classList.add("hit");
  const br = img.getBoundingClientRect();
  floatText(big ? `${d}!` : `${d}`, br.left + br.width * (.35 + Math.random() * .3), br.top + br.height * .35, big ? "big" : "");
  sparkleBoss(big ? 30 : 12, foes.indexOf(f));
  updateHud();
  if (f.hp <= 0) foeDown(f);
}

