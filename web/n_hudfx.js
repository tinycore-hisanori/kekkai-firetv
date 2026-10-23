// ============================================================
//  HUD / text
// ============================================================
// DOM writes are skipped when nothing changed (the HUD refreshes every frame)
function setW(el, v) { if (el._w !== v) { el._w = v; el.style.width = v; } }
function setT(el, v) { v = String(v); if (el._t !== v) { el._t = v; el.textContent = v; } }
function setH(el, v) { if (el._h !== v) { el._h = v; el.innerHTML = v; } }
function updateHud() {
  for (const f of foes) {
    const pc = (Math.round(f.hp / f.max * 1000) / 10) + "%";
    setW(f.el.querySelector(".hp"), pc); setW(f.el.querySelector(".lag"), pc);
    setT(f.el.querySelector(".hpTxt"), `${Math.ceil(f.hp)}/${f.max}`);
  }
  setW($("lifeFill"), life + "%"); setT($("lifeTxt"), Math.ceil(life));
  setW($("reiFill"), rei + "%"); setT($("reiTxt"), Math.floor(rei));
  const b = rei < COST_BIND, pg = rei < COST_PURGE;
  if ($("bindBtn").disabled !== b) $("bindBtn").disabled = b;
  if ($("purgeBtn").disabled !== pg) $("purgeBtn").disabled = pg;
}
let toastTm = 0;
function showToast(msg, ms) { const t = $("toast"); t.innerHTML = msg; t.classList.add("show"); clearTimeout(toastTm); toastTm = setTimeout(hideToast, ms); }
function hideToast() { $("toast").classList.remove("show"); }
function banner(txt) { const b = $("banner"); b.textContent = txt; b.classList.remove("show"); void b.offsetWidth; b.classList.add("show"); }
function floatText(txt, x, y, cls) {
  const d = document.createElement("div");
  d.className = "dmg " + (cls || ""); d.textContent = txt; d.style.left = x + "px"; d.style.top = y + "px";
  document.body.appendChild(d); setTimeout(() => d.remove(), 950);
}

// ============================================================
//  FX (page-level canvas): shikigami & particles
// ============================================================
function cellPage(cell, r) { return [r.left + (pad + (X(cell) + .5) * cellPx) * r.width / boardPx, r.top + (pad + (Y(cell) + .5) * cellPx) * r.height / (boardPx + gateH)]; }
function burstAtCell(cell, color, n) { const [x, y] = cellPage(cell, cv.getBoundingClientRect()); burst(x, y, color, n); }
function burst(x, y, color, n) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * 6.28, s = 1.5 + Math.random() * 4;
    parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t0: performance.now(), life: 500 + Math.random() * 400, color });
  }
}
function sparkleBoss(n, fi) {
  const f = foes[fi] || foes[0]; if (!f) return;
  const r = f.img.getBoundingClientRect();
  for (let i = 0; i < n; i++) burst(r.left + r.width * (.2 + Math.random() * .6), r.top + r.height * (.2 + Math.random() * .6), Math.random() < .5 ? "#ffe27a" : "#fff", 1);
}
function drawShikigami(x, y, ang, color, s) {
  fctx.save(); fctx.translate(x, y); fctx.rotate(ang + Math.PI / 2); fctx.scale(s, s);
  fctx.shadowColor = color; fctx.shadowBlur = 16;
  fctx.fillStyle = "#fbf6e8";
  fctx.beginPath();  // paper doll
  fctx.arc(0, -9, 4.5, 0, 7);
  fctx.moveTo(-9, -3); fctx.lineTo(9, -3); fctx.lineTo(5, 2); fctx.lineTo(5, 12); fctx.lineTo(1, 12); fctx.lineTo(0, 6);
  fctx.lineTo(-1, 12); fctx.lineTo(-5, 12); fctx.lineTo(-5, 2); fctx.closePath(); fctx.fill();
  fctx.shadowBlur = 0; fctx.fillStyle = color; fctx.fillRect(-1.5, -1, 3, 6);
  fctx.restore();
}
function drawFx(now) {
  const W = innerWidth, H = innerHeight, d = Math.min(devicePixelRatio || 1, 2);
  if (fxc.width !== W * d || fxc.height !== H * d) { fxc.width = W * d; fxc.height = H * d; fxc.style.width = W + "px"; fxc.style.height = H + "px"; }
  fctx.setTransform(d, 0, 0, d, 0, 0); fctx.clearRect(0, 0, W, H);
  for (const s of shots) {
    const tf = targetFoe(s.foe);
    const br = tf ? tf.img.getBoundingClientRect() : { left: innerWidth / 2, top: 0, width: 0, height: 0 };
    const tx = br.left + br.width / 2, ty = br.top + br.height * .45;
    const t = (now - s.t0) / s.dur;
    if (t < 0) continue;
    if (t >= 1) { s.dead = true; burst(tx + (Math.random() - .5) * 40, ty + (Math.random() - .5) * 40, s.color, s.big ? 10 : 5); if (s.dmg) damageBoss(s.dmg, s.big, s.foe); continue; }
    const e = t * t * (3 - 2 * t);
    const mx = (s.x0 + tx) / 2 + s.bend, my = (s.y0 + ty) / 2 - 60;
    const x = (1 - e) * (1 - e) * s.x0 + 2 * (1 - e) * e * mx + e * e * tx;
    const y = (1 - e) * (1 - e) * s.y0 + 2 * (1 - e) * e * my + e * e * ty;
    const dx = 2 * (1 - e) * (mx - s.x0) + 2 * e * (tx - mx), dy = 2 * (1 - e) * (my - s.y0) + 2 * e * (ty - my);
    fctx.globalAlpha = .35; fctx.strokeStyle = s.color; fctx.lineWidth = s.big ? 6 : 3;
    fctx.beginPath(); fctx.moveTo(x - dx * .06, y - dy * .06); fctx.lineTo(x, y); fctx.stroke();
    fctx.globalAlpha = 1;
    drawShikigami(x, y, Math.atan2(dy, dx), s.color, s.big ? 1.6 : 1.1);
  }
  shots = shots.filter(s => !s.dead);
  for (const p of parts) {
    const t = (now - p.t0) / p.life; if (t >= 1) { p.dead = true; continue; }
    p.x += p.vx; p.y += p.vy; if (p.float) { p.x += Math.sin((now - p.t0) / 400) * .4; } else { p.vx *= .95; p.vy *= .95; p.vy += .05; }
    fctx.globalAlpha = 1 - t; fctx.fillStyle = p.color;
    fctx.beginPath(); fctx.arc(p.x, p.y, (p.r || 3) * (1 - t * .5), 0, 7); fctx.fill();
  }
  fctx.globalAlpha = 1;
  parts = parts.filter(p => !p.dead);
  if (shards.length) drawShards(now);
}


