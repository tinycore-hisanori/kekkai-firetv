
// ============================================================
//  Main loop
// ============================================================
function loop(now) {
  if (phase === "fight") {
    for (const r of respawns) if (now >= r.at) { r.done = true; spawnPair(r.c, false); }
    respawns = respawns.filter(r => !r.done);
    updateMinions(now);
    if (isTutorial()) tutUpdate(now);
    if (isFinal()) { heartbeat(now); }
    const qf = foes.find(f => f.quake && !f.dead);
    const qOn = quakeAt && qf;
    setH($("atkName"), qOn ? `<b>${L().quake}</b>` : `${L().march}: <b>${minions.length}</b>`);
    setW($("atkBar"), (qOn ? Math.round(Math.max(0, Math.min(100, 100 - (quakeAt - now) / qf.quake * 100))) : Math.round(Math.min(100, minions.length / (N + 2) * 100))) + "%");
    if (qf) qf.img.classList.toggle("windup", quakeAt - now < QUAKE_WARN);
  }
  if (phase !== "title") { draw(now); updateHud(); }
  if (isFinal() && (phase === "fight" || phase === "intro")) finalAmbience(now);
  drawFx(now);
  requestAnimationFrame(loop);
}

function bossName(i) { return L().b[i].name; }
function onLangChange() {
  if (phase === "title") return;
  for (const f of foes) f.el.querySelector(".nm").textContent = bossName(f.bi);
}
document.querySelectorAll(".langBtn").forEach(b => b.addEventListener("click", cycleLang));
applyLang();

// debug hook for automated tests
window.KK = { jump(i) { stageIdx = i; startStage(); }, freeze() { frozenUntil = 1e15; }, get s() { return { tut: tut && tut.step, phase, bossIdx: stageIdx, bossHp: foes.reduce((a, f) => a + f.hp, 0), foes: foes.map(f => f.hp), life, rei, N, links, dots: dots.map(d => d && { a: d.a, b: d.b, color: d.color }),
  kills, minions: minions.map(m => m.cell), fakes: minions.filter(m => m.fake !== undefined).map(m => ({ cell: m.cell, color: m.fake })),
  free: Array.from({ length: N * N }, (_, c) => !blocked[c] && dotAt[c] === -1) }; } };

$("titleImg").src = SPRITES.kitsune;
// debug: tap the version 10 times on the title screen to play the ending only
let verTaps = 0, verTimer = 0;
$("ver").addEventListener("click", () => {
  verTaps++; clearTimeout(verTimer); verTimer = setTimeout(() => verTaps = 0, 2500);
  if (verTaps >= 10) {
    verTaps = 0;
    try { ac().resume(); } catch (e) {}
    $("title").style.display = "none";
    stageIdx = STAGES.length - 1;
    showEnding(0);
  }
});
$("startBtn").addEventListener("click", () => {
  $("title").style.display = "none";
  try { ac().resume(); } catch (e) {}
  runStart = performance.now();
  if (!prog.cleared[0] && !prog.cleared[1]) { stageIdx = 0; startStage(); }   // first visit: straight into training
  else { phase = "menu"; openSelect(); }
});
requestAnimationFrame(loop);
