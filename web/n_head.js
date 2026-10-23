"use strict";
// ============================================================
//  KEKKAI — Flow-link puzzle × Yokai boss battle
//  Link matching talismans: the link vanishes and strikes the yokai.
//  Anything the link passes over (target marks, minions) is swept away too.
//  Link-drawing logic adapted from WIRE LINK (TinyLabo)
// ============================================================
const $ = id => document.getElementById(id);
const cv = $("cv"), ctx = cv.getContext("2d");
const fxc = $("fx"), fctx = fxc.getContext("2d");

const PALETTE = ["#ff5a3c", "#3cb4ff", "#5fe07a", "#ffd23c", "#ff6ec7", "#f2f2f2", "#ff9a2e", "#3ef0e0"];
const CRESTS  = ["火", "水", "木", "金", "月", "風", "雷", "星"];
const FAKE_CRESTS = ["大", "氷", "本", "全", "用", "凧", "電", "皇"];   // look-alikes used by fox disguises

// Minions march from the top (boss side) to the gate at the bottom.
//  imp: plain · hopper: jumps 2 rows (over barriers) · big: splits into 2 imps · fox: disguises itself as a fake talisman
const BOSSES = [
  { key: "kappa",    jp: "河童", hp: 130, N: 6, pairs: 3, walls: 0, spawnEvery: 3400, move: 1350, types: ["imp"] },
  { key: "karakasa", jp: "唐傘", hp: 170, N: 6, pairs: 3, walls: 0, spawnEvery: 3100, move: 1250, types: ["imp", "hopper"] },
  { key: "yukionna", jp: "雪女", hp: 190, N: 6, pairs: 4, walls: 0, spawnEvery: 3400, move: 1300, types: ["imp", "imp", "imp", "big"] },
  { key: "nurikabe", jp: "塗壁", hp: 230, N: 7, pairs: 4, walls: 1, spawnEvery: 2800, move: 1150, types: ["imp", "hopper", "big"], quake: 15000 },
  { key: "kitsune",  jp: "妖狐", hp: 290, N: 7, pairs: 5, walls: 1, spawnEvery: 2400, move: 1050, types: ["imp", "fox", "fox", "hopper"] },
];
// Stages: a pilgrimage that rings Japan with a barrier and closes it at Mount Fuji.
//  region: key into REGIONS (n_map.js) · duo: index into L().duo
const STAGES = [
  { foes: [0], tutorial: true, N: 6, pairs: 2, hpMul: .45, region: "kyoto" },
  { foes: [0], region: "tono" },
  { foes: [2], region: "echigo" },
  { foes: [0, 2], N: 7, pairs: 4, walls: 0, spawnEvery: 3000, move: 1250, hpMul: .75, duo: 2, region: "daisetsu" },
  { foes: [1], region: "kanazawa" },
  { foes: [1, 2], N: 7, pairs: 4, walls: 0, spawnEvery: 2700, move: 1200, hpMul: .8, duo: 0, region: "izumo" },
  { foes: [3], region: "onga" },
  { foes: [0, 1], N: 8, pairs: 5, walls: 0, spawnEvery: 2300, move: 1150, hpMul: .85, duo: 3, region: "shuri" },
  { foes: [1, 3], N: 7, pairs: 4, walls: 1, spawnEvery: 2500, move: 1100, hpMul: .75, duo: 4, region: "shimanto" },
  { foes: [4], region: "nasu" },
  { foes: [2, 4], N: 7, pairs: 5, walls: 1, spawnEvery: 2300, move: 1050, hpMul: .75, duo: 5, region: "togakushi" },
  { foes: [3, 4], N: 7, pairs: 5, walls: 1, spawnEvery: 2300, move: 1050, hpMul: .75, duo: 1, region: "fuji" },
];
function stageDef(i = stageIdx) {
  const S = STAGES[i], B0 = BOSSES[S.foes[0]];
  return { N: S.N || B0.N, pairs: S.pairs || B0.pairs, walls: S.walls ?? B0.walls,
           spawnEvery: S.spawnEvery || B0.spawnEvery, move: S.move || B0.move, hpMul: S.hpMul || 1 };
}
const MINION = {
  imp:    { img: "m_hitotsume", speed: 1 },
  hopper: { img: "m_karakasa",  speed: 1.25, hop: true },
  big:    { img: "kappa",       speed: 1.35, split: true, scale: 1.15 },
  fox:    { img: "m_kitsune",   speed: 1.15, disguise: true },
};

// ---------- tunables ----------
const DMG_PER_CELL = .8, KILL_DMG = 7, MULTI_STEP = .5, COMBO_WINDOW = 2600, COMBO_STEP = .15, COMBO_MAX = 4;
const REI_LINK = 8, REI_KILL = 6;
const COST_BIND = 50, COST_PURGE = 60, INVADE_DMG = 10;
const STUN_MS = 4000;   // a line touching a minion paralyses it this long
const RESPAWN_MS = 650, MIN_PAIR_DIST = 3, QUAKE_WARN = 2200;

// ---------- state ----------
let stageIdx = 0, N = 6;
let foes = [];   // {bi, hp, max, el, img, dead}
let dots = [], paths = [], owner = [], dotAt = [];   // dots[c] = {color,a,b} or null while respawning
let blocked = new Uint8Array(0), walls = [];
let dragging = -1;
let cellPx = 0, boardPx = 0, pad = 0, dpr = 1;
let life = 100, rei = 0;
let frozenUntil = 0, rotT = -1e9, quakeAt = 0, spawnAt = 0, kills = 0;
let minions = [], respawns = [], fading = [];
let combo = 0, lastLinkT = -1e9, links = 0, stageStart = 0;
let phase = "title";  // title | fight | bossdown | over | win
let shots = [], parts = [], cellFx = [], shake = 0, tutorialStep = 0;
let runStart = 0, muted = false;
let stageToken = 0;   // bumps on every stage start; stale timers compare against it
let rnd = Math.random;
let gateH = 0, gateHitT = -1e9, gateHitX = 0;
const GATE_RATIO = 1.45;   // gate area height in cells

