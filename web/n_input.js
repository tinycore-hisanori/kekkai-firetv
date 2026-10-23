// ============================================================
//  Input (Wire Link style dragging)
// ============================================================
function cellFromEvent(e) {
  const r = cv.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width * boardPx, y = (e.clientY - r.top) / r.height * (boardPx + gateH);
  const gx = Math.floor((x - pad) / cellPx), gy = Math.floor((y - pad) / cellPx);
  if (gx < 0 || gy < 0 || gx >= N || gy >= N) return -1;
  return idx(gx, gy);
}
function tryStep(cell) {
  const c = dragging, p = paths[c], head = p[p.length - 1];
  if (cell === head || !adjacent(head, cell) || blocked[cell]) return;
  const bi = p.indexOf(cell);
  if (bi >= 0) { p.length = bi + 1; rebuildMaps(); sndTick(); return; }
  if (dotAt[cell] !== -1 && dotAt[cell] !== c) return;
  const fk = minions.find(m => m.cell === cell && m.fake !== undefined && !m.dead);
  if (fk) revealFox(fk, performance.now());       // a link passing over a fake talisman reveals the fox
  const oc = owner[cell];
  if (oc !== -1 && oc !== c) { const i = paths[oc].indexOf(cell); paths[oc].length = Math.max(1, i); }
  p.push(cell); rebuildMaps();
  if (isComplete(c)) { if (phase === "seal") sealLinked(c); else onComplete(c); return; }
  const now = performance.now();
  for (const m of minions) if (m.cell === cell && !m.dead && m.fake === undefined) stunMinion(m, now);
  sndTick();
}
function walkTo(target) {
  let guard = N * 2;
  while (guard-- > 0 && dragging >= 0) {
    const head = paths[dragging][paths[dragging].length - 1];
    if (head === target) break;
    const hx = X(head), hy = Y(head), tx = X(target), ty = Y(target);
    let next;
    if (hx !== tx) next = idx(hx + Math.sign(tx - hx), hy);
    else if (hy !== ty) next = idx(hx, hy + Math.sign(ty - hy));
    else break;
    const before = paths[dragging].length;
    tryStep(next);
    if (dragging < 0) break;
    if (paths[dragging][paths[dragging].length - 1] === head && paths[dragging].length === before) break;
  }
}
const rotating = () => performance.now() - rotT < 500;
cv.addEventListener("pointerdown", e => {
  e.preventDefault();
  if (!(phase === "fight" || (phase === "seal" && seal && !seal.solved)) || rotating()) return;
  cv.setPointerCapture(e.pointerId);
  const cell = cellFromEvent(e);
  if (cell < 0 || blocked[cell]) return;
  if (dotAt[cell] !== -1) {
    const c = dotAt[cell];
    paths[c] = [cell]; dragging = c; rebuildMaps(); return;
  }
  if (owner[cell] !== -1) { const c = owner[cell]; paths[c].length = paths[c].indexOf(cell) + 1; dragging = c; rebuildMaps(); }
});
cv.addEventListener("pointermove", e => {
  if (dragging < 0 || (phase !== "fight" && phase !== "seal") || rotating()) return;
  e.preventDefault();
  const cell = cellFromEvent(e); if (cell < 0) return;
  walkTo(cell);
});
function endDrag() { dragging = -1; }
cv.addEventListener("pointerup", endDrag);
cv.addEventListener("pointercancel", endDrag);

// ---------- spells ----------
function castBind() {
  if (phase !== "fight" || rei < COST_BIND) { sndBlock(); return; }
  rei -= COST_BIND; sndBind(); banner(L().bindB);
  tutEvent("bind");
  const now = performance.now();
  frozenUntil = now + 4000;
  for (const m of minions) m.moveAt += 4000;
  spawnAt += 4000; if (quakeAt) quakeAt += 4000;
  updateHud();
}
function castPurge() {
  if (phase !== "fight" || rei < COST_PURGE) { sndBlock(); return; }
  rei -= COST_PURGE; sndPurge(); banner(L().purgeB);
  tutEvent("purge");
  const now = performance.now();
  life = Math.min(100, life + 10);
  for (const m of minions) purifyMinion(m, now);
  minions = [];
  updateHud();
}
$("bindBtn").addEventListener("click", castBind);
$("purgeBtn").addEventListener("click", castPurge);
$("resetBtn").addEventListener("click", () => {
  if (phase !== "fight" && phase !== "seal") return;
  paths = dots.map(d => d ? [d.a] : []); rebuildMaps(); dragging = -1;
});
$("muteBtn").addEventListener("click", () => { muted = !muted; $("muteBtn").textContent = muted ? "✕" : "♪"; if (muted) { stopDrone(); stopBgm(true); } else { if (isFinal() && phase === "fight") startDrone(); if (bgmWant) playBgm(bgmWant, bgmOpts); } });
window.addEventListener("keydown", e => {
  if (e.key === "1" || e.key === "q" || e.key === "Q") castBind();
  if (e.key === "2" || e.key === "w" || e.key === "W") castPurge();
});
