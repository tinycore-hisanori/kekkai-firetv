
// ============================================================
//  BGM (tracks from "妖怪の封印を解こうぜ", TinyLabo)
// ============================================================
const bgmEls = {};
let bgmCur = null, bgmWant = "title", bgmOpts = {};
function playBgm(name, opts = {}) {
  bgmWant = name; bgmOpts = opts;
  if (bgmCur && bgmCur.name === name && !bgmCur.el.paused) return;
  stopBgm(true);
  if (muted || !BGM[name]) return;
  try {
    const el = bgmEls[name] || (bgmEls[name] = new Audio(BGM[name]));
    el.loop = opts.loop !== false; el.volume = opts.vol ?? .45; el.currentTime = 0;
    const p = el.play(); if (p) p.catch(() => {});
    bgmCur = { name, el };
  } catch (e) {}
}
function stopBgm(keepWant) {
  if (bgmCur) { try { bgmCur.el.pause(); } catch (e) {} bgmCur = null; }
  if (!keepWant) bgmWant = null;
}
// browsers only allow audio after a user gesture: start the title theme on the first tap
document.addEventListener("pointerdown", () => { if (bgmWant && !bgmCur && !muted) playBgm(bgmWant, bgmOpts); }, { capture: true });
