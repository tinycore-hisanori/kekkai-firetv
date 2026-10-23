
// ============================================================
//  Board rendering
// ============================================================
function layout() {
  const wrap = $("boardWrap");
  const size = Math.min(wrap.clientWidth - 4, (wrap.clientHeight - 4) / (1 + GATE_RATIO / N), 600);
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  boardPx = Math.max(200, size);
  pad = Math.round(boardPx * 0.025);
  cellPx = (boardPx - pad * 2) / N;
  gateH = Math.round(cellPx * GATE_RATIO);
  cv.style.width = boardPx + "px"; cv.style.height = (boardPx + gateH) + "px";
  cv.width = boardPx * dpr; cv.height = (boardPx + gateH) * dpr;
}
window.addEventListener("resize", () => { if (phase !== "title") layout(); });
function rr(c, x, y, w, h, r) {
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
function hash(c) { let h = c * 374761393; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
const IMGS = {};
for (const k in SPRITES) { const im = new Image(); im.src = SPRITES[k]; IMGS[k] = im; }

function strokePath(p, cx, cy) {
  ctx.beginPath(); ctx.moveTo(cx(p[0]), cy(p[0])); for (let i = 1; i < p.length; i++) ctx.lineTo(cx(p[i]), cy(p[i]));
}
function draw(now) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, boardPx, boardPx + gateH);
  let sx = 0, sy = 0;
  if (shake > 0) { sx = (Math.random() - .5) * shake; sy = (Math.random() - .5) * shake; }
  drawGate(now, sx, sy);
  ctx.save();
  if (shake > 0) { ctx.translate((Math.random() - .5) * shake, (Math.random() - .5) * shake); shake *= .86; if (shake < .3) shake = 0; }
  const rk = (now - rotT) / 500;
  if (rk < 1) {
    const e = 1 - Math.pow(1 - rk, 3);
    ctx.translate(boardPx / 2, boardPx / 2); ctx.rotate(-(1 - e) * Math.PI / 2); ctx.translate(-boardPx / 2, -boardPx / 2);
  }
  ctx.fillStyle = "#15121f"; rr(ctx, 0, 0, boardPx, boardPx, 12); ctx.fill();
  ctx.strokeStyle = isFinal() && phase !== "title" ? `rgba(255,${40 + 30 * Math.sin(now / 250) | 0},40,${.7 + .3 * Math.sin(now / 250)})` : "#8a2a2a"; ctx.lineWidth = isFinal() ? 4 : 3; rr(ctx, 1.5, 1.5, boardPx - 3, boardPx - 3, 11); ctx.stroke();
  const cx = c => pad + (X(c) + .5) * cellPx, cy = c => pad + (Y(c) + .5) * cellPx;

  // tiles
  for (let c = 0; c < N * N; c++) {
    if (blocked[c]) continue;
    const x = pad + X(c) * cellPx, y = pad + Y(c) * cellPx, h = hash(c + N * 97);
    ctx.fillStyle = `rgb(${30 + h * 10 | 0},${26 + h * 8 | 0},${40 + h * 12 | 0})`;
    rr(ctx, x + 1.5, y + 1.5, cellPx - 3, cellPx - 3, cellPx * .12); ctx.fill();
  }
  // walls
  for (const w of walls) {
    const x = pad + w.x * cellPx, y = pad + w.y * cellPx, ww = w.w * cellPx, hh = w.h * cellPx;
    ctx.fillStyle = "#0c0a12"; rr(ctx, x + 2, y + 2, ww - 4, hh - 4, cellPx * .15); ctx.fill();
    const im = IMGS.nurikabe;
    if (im.complete) { const s = Math.min(ww, hh) * .9; ctx.globalAlpha = .7; ctx.drawImage(im, x + (ww - s) / 2, y + (hh - s) / 2, s, s); ctx.globalAlpha = 1; }
  }
  // gate zone: bottom row glows red, torii marks at the edge
  {
    const y0 = pad + (N - 1) * cellPx;
    const g = ctx.createLinearGradient(0, y0, 0, y0 + cellPx + pad);
    g.addColorStop(0, "rgba(255,40,60,0)"); g.addColorStop(1, `rgba(255,40,60,${.22 + .08 * Math.sin(now / 300)})`);
    ctx.fillStyle = g; ctx.fillRect(pad, y0, boardPx - pad * 2, cellPx + pad);
    ctx.strokeStyle = "#e0442e"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(pad, boardPx - pad + 1); ctx.lineTo(boardPx - pad, boardPx - pad + 1); ctx.stroke();
    // spawn zone: top row faint purple
    const g2 = ctx.createLinearGradient(0, pad, 0, pad + cellPx);
    g2.addColorStop(0, "rgba(160,60,255,.22)"); g2.addColorStop(1, "rgba(160,60,255,0)");
    ctx.fillStyle = g2; ctx.fillRect(pad, pad, boardPx - pad * 2, cellPx);
  }

  // tutorial hint: the suggested route
  {
    const seg = tutHintPath();
    if (seg) {
      ctx.save(); ctx.globalAlpha = .55 + .25 * Math.sin(now / 200);
      ctx.setLineDash([cellPx * .2, cellPx * .2]); ctx.lineDashOffset = -now / 30;
      ctx.strokeStyle = "#ffe27a"; ctx.lineWidth = cellPx * .12; ctx.lineCap = "round"; ctx.lineJoin = "round";
      strokePath(seg, cx, cy); ctx.stroke(); ctx.restore();
      if (dragging < 0) {
        const i = Math.min(seg.length - 1, Math.floor(((now / 1400) % 1) * seg.length));
        ctx.font = `${Math.round(cellPx * .5)}px system-ui, sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("👆", cx(seg[i]) + cellPx * .15, cy(seg[i]) + cellPx * .2);
      }
    }
  }
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  // vanishing links: flash white-gold, then fade
  for (const f of fading) {
    const t = (now - f.t0) / 550; if (t >= 1) { f.dead = true; continue; }
    strokePath(f.path, cx, cy);
    ctx.shadowColor = "#fff2b0"; ctx.shadowBlur = cellPx * .8 * (1 - t);
    ctx.strokeStyle = t < .25 ? "#fffbe8" : PALETTE[f.color];
    ctx.globalAlpha = 1 - t; ctx.lineWidth = cellPx * (.34 + t * .3); ctx.stroke();
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
  }
  fading = fading.filter(f => !f.dead);
  // links being drawn
  for (let c = 0; c < paths.length; c++) {
    const p = paths[c]; if (p.length < 2) continue;
    const col = PALETTE[c];
    strokePath(p, cx, cy);
    ctx.shadowColor = col; ctx.shadowBlur = cellPx * .25;
    ctx.strokeStyle = col; ctx.lineWidth = cellPx * .3; ctx.stroke(); ctx.shadowBlur = 0;
    if (phase !== "seal") {   // marching dashes inside a line; skipped in the seal puzzle (a board full of them shimmers on TV)
      ctx.strokeStyle = "rgba(0,0,0,.25)"; ctx.lineWidth = cellPx * .26;
      ctx.setLineDash([cellPx * .06, cellPx * .12]); ctx.lineDashOffset = -now / 60; ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = cellPx * .07; ctx.stroke();
  }
  // talismans (pop in)
  for (const d of dots) {
    if (!d) continue;
    const k = Math.min(1, (now - d.born) / 300), s = k < 1 ? 1.4 - .4 * k : 1;
    for (const cell of [d.a, d.b]) {
      ctx.save(); ctx.translate(cx(cell), cy(cell)); ctx.scale(s * k, s * k); ctx.translate(-cx(cell), -cy(cell));
      drawOfuda(cx(cell), cy(cell), d.color, dragging === d.color, now, false);
      ctx.restore();
    }
  }
  // minions
  for (const m of minions) drawMinion(m, now, cx, cy);
  // cell fx
  for (const f of cellFx) {
    const t = (now - f.t0) / f.life; if (t >= 1) { f.dead = true; continue; }
    const x = cx(f.cell), y = cy(f.cell);
    if (f.kind === "slash") {
      ctx.strokeStyle = `rgba(255,40,70,${1 - t})`; ctx.lineWidth = cellPx * .12;
      const s = cellPx * .45 * Math.min(1, t * 4);
      ctx.beginPath(); ctx.moveTo(x - s, y - s); ctx.lineTo(x + s, y + s); ctx.moveTo(x + s, y - s); ctx.lineTo(x - s, y + s); ctx.stroke();
    } else if (f.kind === "guard") {
      ctx.strokeStyle = `rgba(255,226,122,${1 - t})`; ctx.lineWidth = cellPx * .1;
      ctx.beginPath(); ctx.arc(x, y, cellPx * (.3 + t * .9), 0, 7); ctx.stroke();
    } else if (f.kind === "puff") {
      ctx.fillStyle = `rgba(200,140,255,${(1 - t) * .6})`;
      ctx.beginPath(); ctx.arc(x, y, cellPx * (.2 + t * .5), 0, 7); ctx.fill();
    }
  }
  cellFx = cellFx.filter(f => !f.dead);
  if (now < frozenUntil) { ctx.fillStyle = "rgba(120,200,255,.12)"; rr(ctx, 0, 0, boardPx, boardPx, 12); ctx.fill(); }
  if (quakeAt && quakeAt - now < QUAKE_WARN) { ctx.fillStyle = `rgba(255,120,40,${.1 + .1 * Math.sin(now / 50)})`; rr(ctx, 0, 0, boardPx, boardPx, 12); ctx.fill(); }
  ctx.restore();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}


// ============================================================
//  The gate: what the minions must not reach
// ============================================================
function drawGate(now, sx, sy) {
  const top = boardPx, H = gateH, W = boardPx;
  const hitK = Math.max(0, 1 - (now - gateHitT) / 600);
  const danger = minions.some(m => Y(m.cell) === N - 1);
  ctx.save();
  ctx.translate(sx + (hitK > 0 ? (Math.random() - .5) * 10 * hitK : 0), sy);
  // stone approach
  const g = ctx.createLinearGradient(0, top, 0, top + H);
  g.addColorStop(0, "#2a1c24"); g.addColorStop(1, "#120c14");
  ctx.fillStyle = g; rr(ctx, 0, top + 2, W, H - 2, 12); ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.05)"; ctx.lineWidth = 1;
  for (let k = 1; k < 4; k++) { const y = top + H * k / 4; ctx.beginPath(); ctx.moveTo(W * .5 - W * .12 * k, y); ctx.lineTo(W * .5 + W * .12 * k, y); ctx.stroke(); }
  // warning glow when a minion is at the doorstep / was just let in
  const warn = Math.max(hitK, danger ? .35 + .25 * Math.sin(now / 90) : 0);
  if (warn > 0) {
    const rg = ctx.createRadialGradient(W / 2, top + H * .55, 0, W / 2, top + H * .55, W * .6);
    rg.addColorStop(0, `rgba(255,30,50,${.55 * warn})`); rg.addColorStop(1, "rgba(255,30,50,0)");
    ctx.fillStyle = rg; ctx.fillRect(0, top, W, H);
  }
  // stone lanterns
  for (const lx of [W * .12, W * .88]) drawLantern(lx, top + H * .22, H * .72, now);
  // the torii
  const th = H * .9, tw = Math.min(W * .62, th * 2.1);
  drawTorii(W / 2, top + H * .06, tw, th, now);
  // impact flash where the minion broke through
  if (hitK > 0) {
    ctx.strokeStyle = `rgba(255,80,90,${hitK})`; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(gateHitX, top + H * .15, (1 - hitK) * H * 1.2 + 6, 0, 7); ctx.stroke();
  }
  ctx.restore();
}
function drawTorii(cx, top, W, H, now) {
  const red = "#d8382a", dark = "#1c1014";
  const dmg = 1 - life / 100;
  const pillarW = W * .075, px = W * .34;
  // glow
  ctx.shadowColor = "rgba(255,90,60,.6)"; ctx.shadowBlur = 16;
  // pillars
  ctx.fillStyle = red;
  for (const s of [-1, 1]) ctx.fillRect(cx + s * px - pillarW / 2, top + H * .16, pillarW, H * .84);
  ctx.shadowBlur = 0;
  // pillar base stones
  ctx.fillStyle = dark;
  for (const s of [-1, 1]) ctx.fillRect(cx + s * px - pillarW * .75, top + H * .92, pillarW * 1.5, H * .08);
  // nuki (lower beam)
  ctx.fillStyle = red; ctx.fillRect(cx - W * .45, top + H * .33, W * .9, H * .08);
  // kasagi (curved top beam) + black cap
  ctx.beginPath();
  ctx.moveTo(cx - W * .54, top + H * .02);
  ctx.quadraticCurveTo(cx, top + H * .12, cx + W * .54, top + H * .02);
  ctx.lineTo(cx + W * .5, top + H * .15);
  ctx.quadraticCurveTo(cx, top + H * .22, cx - W * .5, top + H * .15);
  ctx.closePath(); ctx.fillStyle = red; ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx - W * .56, top);
  ctx.quadraticCurveTo(cx, top + H * .1, cx + W * .56, top);
  ctx.lineTo(cx + W * .54, top + H * .05);
  ctx.quadraticCurveTo(cx, top + H * .14, cx - W * .54, top + H * .05);
  ctx.closePath(); ctx.fillStyle = dark; ctx.fill();
  // plaque
  const pw = W * .12, ph = H * .16;
  ctx.fillStyle = dark; ctx.fillRect(cx - pw / 2, top + H * .17, pw, ph);
  ctx.strokeStyle = "#e8b04a"; ctx.lineWidth = 1.5; ctx.strokeRect(cx - pw / 2 + 2, top + H * .17 + 2, pw - 4, ph - 4);
  ctx.fillStyle = "#e8b04a"; ctx.font = `bold ${Math.round(ph * .42)}px "Yu Mincho","Noto Serif JP",serif`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("結界", cx, top + H * .17 + ph / 2 + 1);
  // shimenawa rope between the pillars with shide
  ctx.strokeStyle = "#e9d9a6"; ctx.lineWidth = H * .05;
  ctx.beginPath(); ctx.moveTo(cx - px, top + H * .5); ctx.quadraticCurveTo(cx, top + H * .62, cx + px, top + H * .5); ctx.stroke();
  for (let i = 1; i < 4; i++) {
    const t = i / 4, x = cx - px + 2 * px * t, y = top + H * .5 + Math.sin(t * Math.PI) * H * .06;
    ctx.fillStyle = "#fbf6e8"; ctx.fillRect(x - H * .025, y, H * .05, H * .14 + Math.sin(now / 400 + i) * 2);
  }
  // cracks as the gate weakens
  if (dmg > .3) {
    ctx.strokeStyle = "rgba(20,5,5,.85)"; ctx.lineWidth = 2;
    const n = dmg > .65 ? 3 : dmg > .45 ? 2 : 1;
    for (let k = 0; k < n; k++) for (const s of [-1, 1]) {
      const x0 = cx + s * px, y0 = top + H * (.45 + k * .15);
      ctx.beginPath(); ctx.moveTo(x0 - pillarW * .4, y0); ctx.lineTo(x0, y0 + H * .05); ctx.lineTo(x0 - pillarW * .1, y0 + H * .1); ctx.lineTo(x0 + pillarW * .4, y0 + H * .14); ctx.stroke();
    }
  }
  if (dmg > .65) {   // barely holding: flicker
    ctx.fillStyle = `rgba(255,60,40,${.12 + .1 * Math.sin(now / 70)})`;
    ctx.fillRect(cx - W * .56, top, W * 1.12, H);
  }
}
function drawLantern(x, top, H, now) {
  const w = H * .32, stone = "#6a6070";
  ctx.fillStyle = stone;
  ctx.beginPath(); ctx.moveTo(x - w * .6, top + H * .2); ctx.lineTo(x, top); ctx.lineTo(x + w * .6, top + H * .2); ctx.closePath(); ctx.fill();
  const fl = .7 + .3 * Math.sin(now / 130 + x);
  ctx.fillStyle = `rgba(255,190,90,${fl})`; ctx.shadowColor = "#ffb050"; ctx.shadowBlur = 14 * fl;
  ctx.fillRect(x - w * .3, top + H * .22, w * .6, H * .2); ctx.shadowBlur = 0;
  ctx.fillStyle = stone;
  ctx.fillRect(x - w * .4, top + H * .42, w * .8, H * .06);
  ctx.fillRect(x - w * .12, top + H * .48, w * .24, H * .38);
  ctx.fillRect(x - w * .45, top + H * .86, w * .9, H * .1);
}
