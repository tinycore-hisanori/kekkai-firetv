// minion art is filtered + downscaled once into small canvases (ctx.filter every frame is slow on TV GPUs)
const MCACHE = {};
function minionSprite(key, frozen) {   // frozen: false | true | "stun"
  const k = key + (frozen === "stun" ? ":s" : frozen ? ":f" : ":n");
  if (MCACHE[k]) return MCACHE[k];
  const im = IMGS[key];
  if (!im || !im.complete || !im.naturalWidth) return null;
  const H = 160, W = Math.max(1, Math.round(H * im.naturalWidth / im.naturalHeight));
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const x = c.getContext("2d");
  x.filter = frozen === "stun" ? "sepia(1) saturate(3.5) hue-rotate(5deg) brightness(1.35)" : frozen ? "hue-rotate(160deg) brightness(1.2)" : "saturate(.75) hue-rotate(230deg) brightness(.92)";
  x.drawImage(im, 0, 0, W, H);
  return (MCACHE[k] = c);
}
function minionAlpha(m, now) {
  return 1;
  const t = ((now - m.born) % 4200) / 4200;
  if (t < .5) return 1;
  if (t < .6) return 1 - (t - .5) / .1 * .9;
  if (t > .9) return .1 + (t - .9) / .1 * .9;
  return .1;
}
function drawMinion(m, now, cx, cy) {
  const def = MINION[m.type];
  const k = Math.min(1, (now - m.stepT) / 240);
  const tx = cx(m.cell), ty = cy(m.cell);
  const px = m.prev >= 0 ? cx(m.prev) : tx, py = m.prev >= 0 ? cy(m.prev) : ty - cellPx;
  const jump = (m.hopT && now - m.hopT < 300) ? 2.2 : 1;
  const x = px + (tx - px) * k;
  const y = py + (ty - py) * k - Math.sin(k * Math.PI) * cellPx * .14 * jump;
  if (m.fake !== undefined) {           // disguised as a talisman (slightly wrong crest)
    drawOfuda(x, y + (py === ty ? 0 : 0), m.fake, false, now, false, FAKE_CRESTS[m.fake]);
    return;
  }
  const im = IMGS[def.img];
  const danger = Y(m.cell) >= N - 2;
  const stun = m.stunUntil && now < m.stunUntil;
  ctx.save();
  ctx.globalAlpha = minionAlpha(m, now) * Math.min(1, (now - m.born) / 250);
  const g = ctx.createRadialGradient(x, y, 0, x, y, cellPx * .5);
  g.addColorStop(0, stun ? "rgba(255,230,60,.65)" : danger ? "rgba(255,40,60,.6)" : "rgba(170,60,255,.5)"); g.addColorStop(1, stun ? "rgba(255,200,40,0)" : "rgba(120,30,200,0)");
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, cellPx * .5, 0, 7); ctx.fill();
  if (im && im.complete) {
    const h = cellPx * .84 * (def.scale || 1), w = h * im.naturalWidth / im.naturalHeight;
    const bob = Math.sin(now / 180 + m.born) * cellPx * .03;
    const spr = minionSprite(def.img, stun ? "stun" : now < frozenUntil) || im;
    const jx = stun ? (Math.random() - .5) * cellPx * .06 : 0;
    ctx.drawImage(spr, x - w / 2 + jx, y - h * .55 + (stun ? 0 : bob), w, h);
  }
  if (stun) drawSparks(x, y, now, m.stunUntil - now);
  if (Y(m.cell) === N - 1) {   // at the doorstep of the gate
    const s = cellPx * (.2 + .03 * Math.sin(now / 80));
    ctx.fillStyle = "#ff2a40"; ctx.beginPath(); ctx.arc(x, y - cellPx * .55, s, 0, 7); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.font = `bold ${Math.round(s * 1.5)}px system-ui,sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("!", x, y - cellPx * .55 + 1);
  }
  ctx.restore();
}

// crackling lightning around a paralysed minion; a ring shows the time left
function drawSparks(x, y, now, left) {
  const r = cellPx * .46;
  ctx.save();
  ctx.strokeStyle = "rgba(255,240,120,.95)"; ctx.lineWidth = Math.max(1.5, cellPx * .035); ctx.lineJoin = "round";
  const seed = Math.floor(now / 70);
  for (let b = 0; b < 3; b++) {
    const a0 = (seed * 1.7 + b * 2.1) % 6.283;
    ctx.beginPath();
    for (let i = 0; i <= 4; i++) {
      const a = a0 + i * .32, rr2 = r * (.55 + ((seed * 13 + b * 7 + i * 5) % 9) / 18);
      const px = x + Math.cos(a) * rr2, py = y + Math.sin(a) * rr2;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.stroke();
  }
  const f = Math.max(0, Math.min(1, left / STUN_MS));
  ctx.strokeStyle = "rgba(255,220,60,.8)"; ctx.lineWidth = Math.max(2, cellPx * .05);
  ctx.beginPath(); ctx.arc(x, y, r * 1.02, -Math.PI / 2, -Math.PI / 2 + f * 6.283); ctx.stroke();
  ctx.restore();
}
