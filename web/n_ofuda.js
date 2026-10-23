function drawOfuda(x, y, color, done, now, cursed, crest) {
  const w = cellPx * .5, h = cellPx * .74, col = cursed ? "#7a3aa0" : PALETTE[color];
  ctx.save(); ctx.translate(x, y);
  ctx.rotate(Math.sin(now / 800 + color) * .04 + (cursed ? Math.sin(now / 50) * .05 : 0));
  ctx.shadowColor = col; ctx.shadowBlur = done ? cellPx * .6 : cellPx * .2;
  ctx.fillStyle = cursed ? "#5a4a60" : "#f4ead0"; rr(ctx, -w / 2, -h / 2, w, h, cellPx * .05); ctx.fill(); ctx.shadowBlur = 0;
  ctx.strokeStyle = col; ctx.lineWidth = cellPx * .05;
  rr(ctx, -w / 2 + cellPx * .04, -h / 2 + cellPx * .04, w - cellPx * .08, h - cellPx * .08, cellPx * .03); ctx.stroke();
  ctx.fillStyle = cursed ? "#c080ff" : done ? col : "#2a1f18";
  ctx.font = `bold ${Math.round(cellPx * .34)}px "Yu Mincho","Hiragino Mincho ProN","Noto Serif JP",serif`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(crest || (cursed ? "呪" : CRESTS[color]), 0, cellPx * .02);
  ctx.fillStyle = "#c0282d"; ctx.beginPath(); ctx.arc(0, h / 2 - cellPx * .1, cellPx * .045, 0, 7); ctx.fill();
  ctx.restore();
}
