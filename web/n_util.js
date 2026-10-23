// ---------- grid utils ----------
const idx = (x, y) => y * N + x;
const X = c => c % N, Y = c => (c / N) | 0;
let NEI = null, NEI_N = 0;
function buildNei() {
  NEI = [];
  for (let c = 0; c < N * N; c++) {
    const x = X(c), y = Y(c), r = [];
    if (x > 0) r.push(c - 1); if (x < N - 1) r.push(c + 1);
    if (y > 0) r.push(c - N); if (y < N - 1) r.push(c + N);
    NEI.push(r);
  }
  NEI_N = N;
}
function neighbors(c) { if (NEI_N !== N) buildNei(); return NEI[c]; }
const adjacent = (a, b) => neighbors(a).includes(b);

// ---------- sound ----------
let AC = null;
function ac() { if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)(); return AC; }
function tone(freq, dur = 0.08, vol = 0.1, type = "sine", delay = 0, slide = 0) {
  if (muted) return;
  try {
    const A = ac(), t = A.currentTime + delay;
    const o = A.createOscillator(), g = A.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * slide), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(A.destination); o.start(t); o.stop(t + dur + 0.02);
  } catch (e) {}
}
function noise(dur = 0.1, vol = 0.08, hp = 1500, delay = 0) {
  if (muted) return;
  try {
    const A = ac(), n = (A.sampleRate * dur) | 0;
    const b = A.createBuffer(1, n, A.sampleRate), ch = b.getChannelData(0);
    for (let i = 0; i < n; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = A.createBufferSource(); s.buffer = b;
    const f = A.createBiquadFilter(); f.type = "highpass"; f.frequency.value = hp;
    const g = A.createGain(); g.gain.value = vol;
    s.connect(f).connect(g).connect(A.destination); s.start(A.currentTime + delay);
  } catch (e) {}
}
const sndTick  = () => tone(1200, .025, .03, "triangle");
const sndBell  = () => { tone(1568, .8, .08); tone(2352, .5, .035, "sine", .01); };
const sndShoot = () => { noise(.12, .05, 4000); tone(700, .15, .04, "triangle", 0, 2); };
const sndHit   = () => { tone(110, .2, .25, "sine", 0, .5); noise(.08, .12, 600); };
const sndTaiko = (d = 0) => { tone(90, .35, .35, "sine", d, .45); noise(.05, .08, 300, d); };
const sndKekkai= () => { [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, .6, .07, "triangle", i * .07)); sndTaiko(.1); sndTaiko(.35); };
const sndHurt  = () => { tone(180, .3, .15, "sawtooth", 0, .4); noise(.15, .1, 500); };
const sndWarn  = () => { tone(880, .08, .05, "square"); tone(880, .08, .05, "square", .14); };
const sndTear  = () => { noise(.2, .12, 900); tone(160, .15, .08, "sawtooth", 0, .5); };
const sndIce   = () => { [2400, 3100, 2700].forEach((f, i) => tone(f, .25, .04, "sine", i * .05)); noise(.3, .05, 5000); };
const sndBind  = () => { tone(440, .6, .1, "square", 0, .5); noise(.3, .05, 3000); };
const sndPurge = () => { [1320, 1760, 2640].forEach((f, i) => tone(f, .5, .06, "sine", i * .07)); };
const sndBlock = () => tone(120, .08, .1, "square");
const sndSeal  = () => { sndTaiko(); sndTaiko(.2); sndTaiko(.4); [880, 1175, 1568, 2093].forEach((f, i) => tone(f, .7, .07, "sine", .5 + i * .1)); };
const sndLose  = () => { tone(220, 1, .12, "sawtooth", 0, .4); tone(233, 1, .08, "sawtooth", 0, .4); };
const sndCounter = () => { [784, 1175, 1568].forEach((f, i) => tone(f, .35, .09, "square", i * .05)); sndTaiko(.05); };
const sndQuake = () => { tone(55, .8, .3, "sawtooth", 0, .6); noise(.6, .12, 120); };
