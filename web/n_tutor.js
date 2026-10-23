
// ============================================================
//  Training stage: a scripted, do-it-yourself tutorial
// ============================================================
let tut = null;   // { step, sub, t0 }
const isTutorial = () => phase !== "title" && STAGES[stageIdx] && STAGES[stageIdx].tutorial;

function tutStart() { tut = { step: 0, sub: 0 }; tutGo(1); }
function tutGo(step, sub = 0) {
  const now = performance.now();
  tut.step = step; tut.sub = sub; tut.t0 = now; tut.busy = false;
  const topMid = idx(N >> 1, 0);
  if (step === 2) tutSpawn([topMid], 2600);
  if (step === 3) tutSpawn([idx(1, 1), idx(2, 1), idx(3, 1)], 2800);
  if (step === 4) tutSpawn([idx(N >> 1, N - 3)], 1100);
  if (step === 5 && sub === 0) { rei = 100; tutSpawn([idx(1, 0), idx(N - 2, 0)], 1900); }
  if (step === 5 && sub === 1) rei = Math.max(rei, COST_PURGE);
  if (step === 6) { spawnAt = now + 1500; setTimeout(() => { if (tut && tut.step === 6) hideTutor(); }, 7000); }
  showTutor();
}
// place scripted minions (slow, so the player has time to act)
function tutSpawn(cells, move) {
  const now = performance.now();
  for (let c of cells) {
    if (!canEnter(c)) {
      const alt = neighbors(c).concat([c + 1, c - 1]).find(k => k >= 0 && k < N * N && canEnter(k));
      if (alt == null) continue;
      c = alt;
    }
    const m = spawnMinion(now, "imp", c, 0);
    if (m) { m.slowMove = move; m.moveAt = now + move; m.prev = c; }
  }
}
function tutEvent(kind, n) {
  if (!isTutorial() || !tut || tut.busy) return;
  const s = tut.step, later = (fn, ms) => { tut.busy = true; setTimeout(() => { if (tut) fn(); }, ms); };
  if (s === 1 && kind === "link") later(() => tutGo(2), 900);
  else if (s === 2 && kind === "kill") later(() => tutGo(3), 1200);
  else if (s === 2 && kind === "invade") later(() => { tutGo(2); tutSay(L().tutRetry); }, 900);
  else if (s === 3 && kind === "kill" && n >= 2) later(() => tutGo(4), 1500);
  else if (s === 3 && (kind === "kill" || kind === "invade") && minions.length < 2) later(() => { minions.forEach(m => m.dead = true); minions = []; tutGo(3); tutSay(L().tut3again); }, 900);
  else if (s === 4 && (kind === "invade" || kind === "kill")) later(() => tutGo(5), kind === "invade" ? 2200 : 1200);
  else if (s === 5 && tut.sub === 0 && kind === "bind") later(() => tutGo(5, 1), 700);
  else if (s === 5 && tut.sub === 1 && kind === "purge") later(() => tutGo(6), 900);
}
function tutUpdate(now) {
  if (!tut) return;
  // scripted steps never run out of minions
  if (tut.step === 5 && tut.sub === 1 && !minions.length && !tut.busy) tutSpawn([idx(1, 0), idx(N - 2, 0)], 1900);
  if (tut.step === 4 && !minions.length && !tut.busy) tutSpawn([idx(N >> 1, N - 3)], 1100);
}
// the path the tutorial suggests: through the step's minions
function tutHintPath() {
  if (!tut || !isTutorial() || tut.busy) return null;
  const pass = c => !blocked[c] && dotAt[c] === -1;
  if (tut.step === 1) { const d = dots.find(Boolean); return d ? bfsPath(d.a, d.b, pass) : null; }
  if (tut.step === 2 || tut.step === 3) {
    const targets = minions.filter(m => !m.dead).map(m => m.cell).sort((a, b) => X(a) - X(b));
    if (!targets.length) return null;
    let best = null;
    for (const d of dots) {
      if (!d) continue;
      for (const [a, b] of [[d.a, d.b], [d.b, d.a]]) {
        let path = [a], ok = true, used = new Set([a]);
        const stops = targets.concat([b]);
        for (const t of stops) {
          const seg = bfsPath(path[path.length - 1], t, c => pass(c) && !used.has(c));
          if (!seg) { ok = false; break; }
          for (const c of seg.slice(1)) { path.push(c); used.add(c); }
        }
        if (ok && (!best || path.length < best.length)) best = path;
      }
    }
    return best;
  }
  return null;
}
function showTutor() {
  const t = $("tutor"), s = tut.step;
  const text = s === 5 ? (tut.sub ? L().tut5b : L().tut5) : L()["tut" + s];
  t.querySelector(".tstep").textContent = `${L().training} ${Math.min(s, 6)} / 6`;
  t.querySelector(".ttext").innerHTML = text;
  t.classList.add("show");
  hideToast();
}
function tutSay(html) { const t = $("tutor"); t.querySelector(".ttext").innerHTML = html; t.classList.add("show"); }
function hideTutor() { $("tutor").classList.remove("show"); }
$("skipTut").addEventListener("click", () => {
  if (!isTutorial()) return;
  tut = null; hideTutor();
  markCleared(0, 0, true);
  stageIdx = 1; startStage();
});

// ============================================================
//  Progress (per browser) + stage select
// ============================================================
let prog = { cleared: {}, best: {} };
try { const p = JSON.parse(localStorage.getItem("kekkai_progress_v2") || "null"); if (p && p.cleared) prog = p; } catch (e) {}
function saveProg() { try { localStorage.setItem("kekkai_progress_v2", JSON.stringify(prog)); } catch (e) {} }
function markCleared(i, sec, skipped) {
  prog.cleared[i] = true;
  if (!skipped && sec > 0 && (!prog.best[i] || sec < prog.best[i])) prog.best[i] = sec;
  saveProg();
}
const unlocked = i => i <= 1 || !!prog.cleared[i - 1];
const fmtTime = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
let pausedAt = 0, pausedPhase = null;
function openSelect() {
  if (phase === "fight") { pausedPhase = "fight"; pausedAt = performance.now(); phase = "menu"; }
  const g = $("selGrid"); g.innerHTML = "";
  STAGES.forEach((S, i) => {
    const card = document.createElement("button");
    const open = unlocked(i), done = !!prog.cleared[i];
    card.className = "card" + (open ? "" : " locked") + (done ? " done" : "") + (S.tutorial ? " tut" : "");
    const imgs = S.foes.map(bi => `<img src="${SPRITES[BOSSES[bi].key]}" alt="">`).join("");
    const label = S.tutorial ? L().training : `${L().stage} ${i}`;
    const status = !open ? "🔒" : done ? `✓ ${prog.best[i] ? fmtTime(prog.best[i]) : ""}` : (S.tutorial ? L().recommended : "");
    card.innerHTML = `<div class="cimgs">${imgs}</div><div class="cnum">${label}</div><div class="cname">${S.tutorial ? "" : stageName(i)}</div><div class="cstat">${status}</div>`;
    if (open) card.addEventListener("click", () => { closeSelect(false); stageIdx = i; startStage(); });
    g.appendChild(card);
  });
  $("select").style.display = "flex";
}
function closeSelect(resume) {
  $("select").style.display = "none";
  if (resume && pausedPhase === "fight") {
    const dt = performance.now() - pausedAt;
    spawnAt += dt; if (quakeAt) quakeAt += dt; frozenUntil += dt; stageStart += dt;
    for (const m of minions) { m.moveAt += dt; m.stepT += dt; }
    for (const r of respawns) r.at += dt;
    phase = "fight";
  }
  pausedPhase = null;
}
$("selBtn").addEventListener("click", openSelect);
$("selClose").addEventListener("click", () => {
  const canResume = pausedPhase === "fight";
  closeSelect(true);
  if (!canResume) goTitle();      // nothing to go back to: return to the title instead of a dead board
});
function goTitle() {
  stageToken++;
  endFinalMood(); hideTutor(); hideToast(); tut = null; hideEnding();
  $("overlay").style.display = "none"; $("select").style.display = "none";
  phase = "title"; dragging = -1;
  $("title").style.display = "flex";
  playBgm("title");
}
