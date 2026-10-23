
// ============================================================
//  Board: talisman pairs that vanish when linked and respawn
// ============================================================
const man = (a, b) => Math.abs(X(a) - X(b)) + Math.abs(Y(a) - Y(b));
const pickOne = a => a[(Math.random() * a.length) | 0];
const minionAtCell = c => minions.find(m => m.cell === c && !m.dead);

function makeBoard() {
  const B = stageDef();
  N = B.N;
  buildNei();
  blocked = new Uint8Array(N * N); walls = [];
  for (let k = 0; k < B.walls; k++) {
    for (let t = 0; t < 50; t++) {
      const x = 1 + ((Math.random() * (N - 3)) | 0), y = 1 + ((Math.random() * (N - 3)) | 0);
      let ok = true;
      for (let dy = -1; dy <= 2 && ok; dy++) for (let dx = -1; dx <= 2 && ok; dx++) {
        const cx = x + dx, cy = y + dy;
        if (cx >= 0 && cy >= 0 && cx < N && cy < N && blocked[idx(cx, cy)]) ok = false;
      }
      if (!ok) continue;
      for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) blocked[idx(x + dx, y + dy)] = 1;
      walls.push({ x, y, w: 2, h: 2 });
      break;
    }
  }
  dots = []; paths = [];
  for (let c = 0; c < B.pairs; c++) { dots.push(null); paths.push([]); }
  rebuildMaps();
  for (let c = 0; c < B.pairs; c++) spawnPair(c, true);
  minions = []; respawns = []; fading = [];
  dragging = -1; combo = 0;
  layout();
}
function rebuildMaps() {
  owner = new Array(N * N).fill(-1); dotAt = new Array(N * N).fill(-1);
  for (const d of dots) if (d) { dotAt[d.a] = d.color; dotAt[d.b] = d.color; }
  for (let c = 0; c < paths.length; c++) for (const cell of paths[c]) owner[cell] = c;
}
const freeCell = c => !blocked[c] && dotAt[c] === -1 && owner[c] === -1;
// shortest path between two cells through free cells (endpoints allowed)
function bfsPath(a, b, pass) {
  const prev = new Int32Array(N * N).fill(-1), q = [a]; prev[a] = a;
  while (q.length) {
    const cur = q.shift();
    if (cur === b) break;
    for (const nb of neighbors(cur)) {
      if (prev[nb] !== -1) continue;
      if (nb !== b && !pass(nb)) continue;
      prev[nb] = cur; q.push(nb);
    }
  }
  if (prev[b] === -1) return null;
  const out = [b]; let s = b;
  while (s !== a) { s = prev[s]; out.push(s); }
  return out.reverse();
}
function spawnPair(c, quiet) {
  const pool = [];
  for (let i = 0; i < N * N; i++) if (freeCell(i) && !minionAtCell(i) && Y(i) > 0) pool.push(i);
  for (let minD = MIN_PAIR_DIST; minD >= 1; minD--) {
    for (let t = 0; t < 120; t++) {
      const a = pickOne(pool), b = pickOne(pool);
      if (a == null || a === b) continue;
      const d = man(a, b);
      if (d < minD || d > N + 2) continue;
      if (!bfsPath(a, b, freeCell)) continue;
      dots[c] = { color: c, a, b, born: performance.now() };
      paths[c] = [a];
      rebuildMaps();
      if (!quiet) { tone(1320, .12, .04, "triangle"); tone(1760, .12, .03, "triangle", .06); }
      return true;
    }
  }
  respawns.push({ c, at: performance.now() + 500 });   // no room right now: try again soon
  return false;
}
function isComplete(c) {
  const p = paths[c], d = dots[c];
  if (!d || p.length < 2) return false;
  const h = p[p.length - 1], s = p[0];
  return (s === d.a && h === d.b) || (s === d.b && h === d.a);
}

