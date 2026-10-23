
// ============================================================
//  Final battle presentation
// ============================================================
const isFinal = () => stageIdx === STAGES.length - 1;
let drone = null, nextBeat = 0, awakened = false;

function startDrone() {
  if (muted || drone) return;
  try {
    const A = ac(), g = A.createGain(), f = A.createBiquadFilter();
    f.type = "lowpass"; f.frequency.value = 260;
    g.gain.setValueAtTime(0, A.currentTime); g.gain.linearRampToValueAtTime(.05, A.currentTime + 2);
    const o1 = A.createOscillator(), o2 = A.createOscillator();
    o1.type = "sawtooth"; o1.frequency.value = 55; o2.type = "sawtooth"; o2.frequency.value = 55.8;
    o1.connect(f); o2.connect(f); f.connect(g).connect(A.destination);
    o1.start(); o2.start();
    drone = { o1, o2, g };
  } catch (e) {}
}
function stopDrone() {
  if (!drone) return;
  try { const A = ac(); drone.g.gain.linearRampToValueAtTime(0, A.currentTime + .6); drone.o1.stop(A.currentTime + .7); drone.o2.stop(A.currentTime + .7); } catch (e) {}
  drone = null;
}
function heartbeat(now) {
  if (now < nextBeat) return;
  const danger = 1 - life / 100;
  nextBeat = now + 1150 - danger * 550;
  tone(62, .16, .3, "sine", 0, .6); tone(55, .14, .22, "sine", .17, .6);
}
function flash(color = "#fff", ms = 500) {
  const f = $("flash"); f.style.background = color; f.style.transition = "none"; f.style.opacity = "1";
  void f.offsetWidth; f.style.transition = `opacity ${ms}ms ease-out`; f.style.opacity = "0";
}
function thunder() { noise(1.2, .22, 60); tone(40, 1, .25, "sawtooth", 0, .5); }

// dramatic opening before the final fight
function finalIntro() {
  phase = "intro"; awakened = false;
  document.body.classList.add("final");
  const box = $("finalIntro");
  box.querySelector(".fk").textContent = L().finalKanji;
  box.querySelector(".fsub").textContent = L().finalTitle;
  box.querySelector(".fnames").innerHTML = foes.map(f => `<span>${BOSSES[f.bi].jp}</span>`).join(`<i>×</i>`);
  box.classList.remove("play"); void box.offsetWidth; box.classList.add("play");
  box.style.display = "flex";
  const T = [0, 350, 700, 1050, 1400, 1650, 1900];
  T.forEach((t, i) => setTimeout(() => sndTaiko(), t + (i > 4 ? 0 : 0)));
  const HOLD = 3800, tok = stageToken;
  setTimeout(() => { if (tok === stageToken) { thunder(); flash("#fff", 700); shake = 16; } }, 1900);
  setTimeout(() => { if (tok === stageToken && isFinal()) startDrone(); }, 2000);
  setTimeout(() => {
    if (tok !== stageToken) return;
    box.style.display = "none";
    if (phase !== "intro") return;
    const now = performance.now();
    spawnAt = now + 1800; if (quakeAt) quakeAt = now + 15000; stageStart = now;
    phase = "fight";
    banner(L().finalTitle);
  }, HOLD);
}
// one of the pair falls: the survivor awakens
function awaken(f) {
  awakened = true;
  flash("#fff", 900); thunder(); shake = 18;
  f.img.classList.add("awake");
  banner(L().awaken(bossName(f.bi)));
  showToast(L().awakenMsg, 4500);
}
// both sealed: the grand sealing
function finalSeal(done) {
  stopDrone();
  flash("#fff", 1600);
  const st = $("finalSeal");
  st.querySelector(".fs2").textContent = L().finalSealText;
  st.classList.remove("play"); void st.offsetWidth; st.classList.add("play"); st.style.display = "flex";
  [0, 250, 500, 900].forEach(t => setTimeout(sndTaiko, t));
  setTimeout(() => [523, 659, 784, 1046, 1318, 1568].forEach((f, i) => tone(f, 1.2, .07, "sine", i * .12)), 900);
  setTimeout(() => { st.style.display = "none"; document.body.classList.remove("final"); done(); }, 3400);
}
function endFinalMood() { stopDrone(); document.body.classList.remove("final"); $("finalIntro").style.display = "none"; }

// embers & foxfire drifting up the screen during the final battle
function finalAmbience(now) {
  if (Math.random() < .5) {
    const fox = Math.random() < .25;
    parts.push({ x: Math.random() * innerWidth, y: innerHeight + 10, vx: (Math.random() - .5) * .6, vy: -(0.6 + Math.random() * 1.2),
                 t0: now, life: 3500 + Math.random() * 2500, color: fox ? "#b070ff" : (Math.random() < .5 ? "#ff7a30" : "#ffb040"), float: true, r: fox ? 3.5 : 2 });
  }
}
