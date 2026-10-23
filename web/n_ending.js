
// ============================================================
//  Final collapse ("ゴゴゴゴ…") → purified yokai festival parade
//  Parade idea & purified art from "妖怪の封印を解こうぜ" (TinyLabo)
// ============================================================
let shards = [];

// the last evil yokai rumbles, cracks and crumbles to pieces
function finalCollapse(f, done) {
  stopDrone();
  const tok = stageToken;
  const img = f.img;
  img.className = "crumble";
  const go = $("gogo");
  go.textContent = "ゴゴゴゴゴゴ…";
  const r0 = img.getBoundingClientRect();
  go.style.left = (r0.left + r0.width / 2) + "px"; go.style.top = (r0.top + r0.height * .1) + "px";
  go.classList.remove("show"); void go.offsetWidth; go.classList.add("show");
  // rumble
  noise(2.4, .16, 40); tone(38, 2.4, .3, "sawtooth", 0, .7); tone(52, 2.2, .18, "square", .2, .6);
  const smoke = setInterval(() => {
    const r = img.getBoundingClientRect();
    for (let i = 0; i < 6; i++) parts.push({ x: r.left + Math.random() * r.width, y: r.top + r.height * (.3 + Math.random() * .7),
      vx: (Math.random() - .5) * 2, vy: -1 - Math.random() * 2, t0: performance.now(), life: 900, color: Math.random() < .5 ? "#7a2aa0" : "#ff4060", r: 4, float: true });
    shake = 10;
  }, 90);
  setTimeout(() => {
    clearInterval(smoke);
    if (tok !== stageToken) return;
    shatter(img);
    img.style.visibility = "hidden";
    go.classList.remove("show");
    tone(90, .8, .35, "sine", 0, .3); noise(.8, .25, 200); shake = 22;
  }, 2000);
  setTimeout(() => { if (tok === stageToken) flash("#fff", 1800); }, 3000);
  setTimeout(() => { if (tok === stageToken) done(); }, 3400);
}
function shatter(img) {
  const r = img.getBoundingClientRect(), nw = img.naturalWidth, nh = img.naturalHeight;
  // the image is object-fit:contain inside its box
  const sc = Math.min(r.width / nw, r.height / nh), dw = nw * sc, dh = nh * sc;
  const ox = r.left + (r.width - dw) / 2, oy = r.top + (r.height - dh) / 2;
  const cols = 9, rows = 11, now = performance.now();
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const sw = nw / cols, sh = nh / rows;
    const x = ox + (i + .5) * dw / cols, y = oy + (j + .5) * dh / rows;
    shards.push({ img, sx: i * sw, sy: j * sh, sw, sh, w: dw / cols, h: dh / rows, x, y,
      vx: (i - cols / 2) * .5 + (Math.random() - .5) * 2.5, vy: -2 - Math.random() * 3 + j * .15,
      rot: 0, vr: (Math.random() - .5) * .2, t0: now + (rows - j) * 25, life: 1600 + Math.random() * 600 });
  }
}
function drawShards(now) {
  for (const s of shards) {
    const t = (now - s.t0) / s.life;
    if (t < 0) { fctx.drawImage(s.img, s.sx, s.sy, s.sw, s.sh, s.x - s.w / 2, s.y - s.h / 2, s.w, s.h); continue; }
    if (t >= 1) { s.dead = true; continue; }
    s.x += s.vx; s.y += s.vy; s.vy += .22; s.rot += s.vr;
    fctx.save(); fctx.globalAlpha = 1 - t; fctx.translate(s.x, s.y); fctx.rotate(s.rot);
    fctx.filter = `brightness(${1.3 + t * 2.5}) saturate(${1 - t * .8})`;
    fctx.shadowColor = t < .5 ? "#c060ff" : "#ffffff"; fctx.shadowBlur = 14;
    fctx.drawImage(s.img, s.sx, s.sy, s.sw, s.sh, -s.w / 2, -s.h / 2, s.w, s.h);
    fctx.shadowBlur = 0;
    fctx.restore();
    if (Math.random() < .08) parts.push({ x: s.x, y: s.y, vx: 0, vy: -1, t0: now, life: 600, color: "#e8d0ff", float: true, r: 2 });
  }
  fctx.filter = "none";
  shards = shards.filter(s => !s.dead);
}

// ------------------------------------------------------------
//  Festival ending
// ------------------------------------------------------------
const PARADE = [
  // the five sealed bosses, back to their true (liberated) selves from Crossy Yokai Kaido
  { k: "p_kappa", boss: 0 }, { k: "p_karakasa", boss: 1 }, { k: "p_yuki", boss: 2 }, { k: "p_nurikabe", boss: 3 }, { k: "p_kyubi", boss: 4, vip: 1 },
  // followed by the minions you fought, purified too
  { k: "p_hitotsume" }, { k: "p_karakasa", small: 1 }, { k: "p_fox" }, { k: "p_hitotsume", small: 1 }, { k: "p_kappa", small: 1 }, { k: "p_fox", small: 1 },
];
const END = { on: false, t0: 0, fw: [], bubble: null, nextBubble: 0, nextFw: 0, finished: false, audio: null, raf: 0, sec: 0, imgs: {} };
const ecv = $("endCv"), ectx = ecv.getContext("2d");

function showEnding(sec) {
  document.body.classList.remove("final");
  phase = "win";
  END.on = true; END.finished = false; END.t0 = performance.now(); END.fw = []; END.bubble = null;
  END.nextBubble = 3.5; END.nextFw = .6; END.sec = sec;
  for (const p of PARADE) if (!END.imgs[p.k]) { const im = new Image(); im.src = SPRITES[p.k]; END.imgs[p.k] = im; }
  if (!END.bg) { END.bg = new Image(); END.bg.src = SPRITES.bg_fest; }
  $("ending").style.display = "block";
  $("endCard").classList.remove("show");
  $("endSkip").textContent = L().skip;
  $("endHint").textContent = L().tapFireworks;
  playBgm("ending", { loop: false, vol: .6 });
  cancelAnimationFrame(END.raf);
  END.raf = requestAnimationFrame(endLoop);
}
function hideEnding() {
  END.on = false; cancelAnimationFrame(END.raf);
  $("ending").style.display = "none";
  if (bgmWant === "ending") stopBgm();
}
function endFinish() {
  if (END.finished) return;
  END.finished = true;
  for (let i = 0; i < 6; i++) setTimeout(() => endFirework(true), i * 160);
  const c = $("endCard");
  c.querySelector(".et").textContent = L().safe;
  c.querySelector(".em").innerHTML = L().endMsg;
  c.querySelector(".etime").textContent = `⏱ ${fmtTime(END.sec)}`;
  c.querySelector(".ethanks").textContent = L().thanks;
  $("endStages").textContent = L().stages;
  $("endTitle").textContent = L().toTitle;
  c.classList.add("show");
}
function endFirework(big, x, y) {
  const W = innerWidth, H = innerHeight;
  const cols = ["#ffd27a", "#ff9d9d", "#9ffcff", "#d3a8ff", "#b6ffb0", "#ffffff"];
  const n = big ? 46 : 30, parts = [];
  for (let i = 0; i < n; i++) parts.push({ a: i / n * 6.283 + Math.random() * .2, sp: (big ? 1 : .75) * (.6 + Math.random() * .5) });
  END.fw.push({ x: x ?? W * (.12 + Math.random() * .76), y: y ?? H * (.1 + Math.random() * .32), col: cols[(Math.random() * cols.length) | 0],
                parts, t: 0, dur: 1.3, size: Math.min(W, H) * (big ? .24 : .17) });
  if (!muted) { noise(.25, .08, 900); tone(160 + Math.random() * 80, .35, .06, "sine", 0, .4); }
}
function endLoop(nowMs) {
  if (!END.on) return;
  const dprE = Math.min(window.devicePixelRatio || 1, 2);
  const W = innerWidth, H = innerHeight;
  if (ecv.width !== W * dprE || ecv.height !== H * dprE) { ecv.width = W * dprE; ecv.height = H * dprE; ecv.style.width = W + "px"; ecv.style.height = H + "px"; }
  const c = ectx; c.setTransform(dprE, 0, 0, dprE, 0, 0);
  const t = (nowMs - END.t0) / 1000;
  // background: festival night, slow pan, fade in from white
  c.fillStyle = "#120a1c"; c.fillRect(0, 0, W, H);
  const bg = END.bg;
  if (bg && bg.complete && bg.naturalWidth) {
    const sc = Math.max(W / bg.naturalWidth, H / bg.naturalHeight) * 1.08;
    const dw = bg.naturalWidth * sc, dh = bg.naturalHeight * sc;
    const pan = (dw - W) * (.5 + .5 * Math.sin(t / 18));
    c.drawImage(bg, -pan, (H - dh) * .45, dw, dh);
  }
  const g = c.createLinearGradient(0, H * .6, 0, H);
  g.addColorStop(0, "rgba(10,5,18,0)"); g.addColorStop(1, "rgba(10,5,18,.6)");
  c.fillStyle = g; c.fillRect(0, H * .6, W, H * .4);
  // parade
  const TH = Math.min(H * .3, 240), GROUND = H * .9, SP = TH * .95, SPEED = Math.max(110, W / 9);
  const headX = W + TH - SPEED * t;
  let allGone = true, center = -1, centerD = 1e9;
  if (!END.finished) PARADE.forEach((p, i) => {
    const x = headX + i * SP;
    if (x > -TH) allGone = false;
    if (x < -TH || x > W + TH) return;
    const im = END.imgs[p.k]; if (!im.complete || !im.naturalWidth) return;
    const h = TH * (p.boss != null ? 1.12 : 1) * (p.vip ? 1.15 : 1) * (p.small ? .72 : 1), w = h * im.naturalWidth / im.naturalHeight;
    const bob = Math.abs(Math.sin(t * 3.2 + i)) * TH * .06;
    let y = p.fly ? GROUND - TH * .55 + Math.sin(t * 1.4 + i) * 10 : GROUND - bob;
    let rot = Math.sin(t * 3.2 + i) * .06;
    const spin = (Math.floor(t / 4 + i * .37) % 5 === 0) ? ((t / 4 + i * .37) % 1) : -1;   // an occasional happy jump
    if (spin >= 0 && spin < .3) y -= Math.sin(spin / .3 * Math.PI) * TH * .35;
    // soft golden aura for the purified bosses
    if (p.boss != null) {
      const ag = c.createRadialGradient(x, y - h / 2, 4, x, y - h / 2, h * .62);
      ag.addColorStop(0, p.vip ? "rgba(255,210,120,.55)" : "rgba(255,240,190,.38)"); ag.addColorStop(1, "rgba(0,0,0,0)");
      c.save(); c.globalCompositeOperation = "lighter"; c.fillStyle = ag; c.beginPath(); c.arc(x, y - h / 2, h * .62, 0, 7); c.fill(); c.restore();
    }
    c.save(); c.translate(x, y); c.rotate(rot);
    c.fillStyle = "rgba(0,0,0,.35)"; c.beginPath(); c.ellipse(0, (p.fly ? GROUND - y : bob) + 4, w * .3, 9, 0, 0, 7); c.fill();
    c.imageSmoothingEnabled = false;   // crisp pixel art
    c.drawImage(im, -w / 2, -h, w, h);
    c.imageSmoothingEnabled = true;
    c.restore();
    const d = Math.abs(x - W / 2); if (d < centerD) { centerD = d; center = i; p._x = x; p._h = h; }
    p._x = x; p._h = h;
  });
  // speech bubbles: thanks from whoever is near the centre
  if (!END.finished && t > END.nextBubble && center >= 0 && centerD < W * .25) {
    const lines = L().endLines;
    END.bubble = { i: center, text: lines[(Math.random() * lines.length) | 0], until: t + 2.6 };
    END.nextBubble = t + 3 + Math.random() * 1.5;
  }
  if (END.bubble && (t > END.bubble.until || END.finished)) END.bubble = null;
  if (END.bubble) {
    const p = PARADE[END.bubble.i];
    if (p._x > -50 && p._x < W + 50) {
      c.font = `bold ${Math.round(Math.max(15, TH * .09))}px "Hiragino Maru Gothic ProN","Yu Gothic",system-ui,sans-serif`;
      const tw = c.measureText(END.bubble.text).width + 32, bh = Math.max(34, TH * .17);
      const bx = Math.max(tw / 2 + 8, Math.min(W - tw / 2 - 8, p._x)), by = GROUND - p._h - bh * .9 + Math.sin(t * 2.4) * 3;
      c.fillStyle = "rgba(255,250,238,.96)"; rr(c, bx - tw / 2, by - bh / 2, tw, bh, bh / 2); c.fill();
      c.beginPath(); c.moveTo(p._x - 8, by + bh / 2 - 2); c.lineTo(p._x, by + bh / 2 + 12); c.lineTo(p._x + 8, by + bh / 2 - 2); c.fill();
      c.fillStyle = "#3a2417"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(END.bubble.text, bx, by + 1);
    }
  }
  if (!END.finished && allGone && t > 3) endFinish();
  // fireworks
  if (t > END.nextFw) { endFirework(END.finished); END.nextFw = t + (END.finished ? .9 : 1.6) + Math.random() * .9; }
  c.save(); c.globalCompositeOperation = "lighter";
  const dt = 1 / 60;
  for (const f of END.fw) {
    f.t += dt; const p = f.t / f.dur;
    c.globalAlpha = Math.max(0, 1 - p); c.fillStyle = f.col;
    for (const q of f.parts) {
      const dd = f.size * q.sp * p * (2 - p);
      c.beginPath(); c.arc(f.x + Math.cos(q.a) * dd, f.y + Math.sin(q.a) * dd + f.size * .3 * p * p, 2.8 * (1 - p * .5), 0, 7); c.fill();
    }
  }
  c.restore();
  END.fw = END.fw.filter(f => f.t < f.dur);
  // fade in from white
  if (t < 1.4) { c.fillStyle = `rgba(255,255,255,${1 - t / 1.4})`; c.fillRect(0, 0, W, H); }
  END.raf = requestAnimationFrame(endLoop);
}
ecv.addEventListener("pointerdown", e => { if (!END.on) return; endFirework(false, e.clientX, e.clientY); });
$("endSkip").addEventListener("click", endFinish);
$("endStages").addEventListener("click", () => { hideEnding(); phase = "menu"; openSelect(); });
$("endTitle").addEventListener("click", () => { hideEnding(); goTitle(); });
