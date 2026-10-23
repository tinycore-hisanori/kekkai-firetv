
// ============================================================
//  Journey across Japan: ring the islands with a barrier,
//  close it at Mount Fuji. Stage select is a map of Japan.
// ============================================================
const JAPAN = /*JAPAN*/null;
const MAP_X0 = -74;   // viewBox left edge (room for the Okinawa inset south-west of Kyushu)
const REGIONS = {
  kyoto:     { en: ["Kyoto · Seimei Shrine", "Home of the great onmyoji Abe no Seimei. Your training begins here."],
               ja: ["京都・晴明神社", "大陰陽師・安倍晴明ゆかりの地。ここから修行が始まる。"],
               es: ["Kioto · Santuario Seimei", "Hogar del gran onmyoji Abe no Seimei. Aquí empieza tu entrenamiento."],
               de: ["Kyōto · Seimei-Schrein", "Heimat des großen Onmyōji Abe no Seimei. Hier beginnt dein Training."],
               ru: ["Киото · святилище Сэймэй", "Дом великого оммёдзи Абэ-но Сэймэя. Здесь начинается обучение."] },
  tono:      { en: ["Tōno, Iwate", "Land of the Tōno Monogatari — kappa haunt its rivers."],
               ja: ["岩手・遠野", "遠野物語の里。川には河童が棲む。"],
               es: ["Tōno, Iwate", "Tierra del Tōno Monogatari: los kappa acechan en sus ríos."],
               de: ["Tōno, Iwate", "Land der Tōno Monogatari – in den Flüssen lauern Kappa."],
               ru: ["Тоно, Иватэ", "Край «Легенд Тоно» — в реках водятся каппы."] },
  echigo:    { en: ["Echigo, Niigata", "Deep snow country. On winter nights, the Snow Woman walks."],
               ja: ["新潟・越後", "豪雪の国。冬の夜には雪女が現れる。"],
               es: ["Echigo, Niigata", "País de nieve profunda. En las noches de invierno camina la Mujer de las Nieves."],
               de: ["Echigo, Niigata", "Tiefes Schneeland. In Winternächten geht die Schneefrau um."],
               ru: ["Этиго, Ниигата", "Снежный край. Зимними ночами бродит Снежная дева."] },
  daisetsu:  { en: ["Daisetsuzan, Hokkaido", "The northern mountains of the gods, sealed in ice."],
               ja: ["北海道・大雪山", "氷に閉ざされた、北の神々の山。"],
               es: ["Daisetsuzan, Hokkaido", "Las montañas de los dioses del norte, selladas en hielo."],
               de: ["Daisetsuzan, Hokkaidō", "Die nördlichen Götterberge, in Eis versiegelt."],
               ru: ["Дайсэцудзан, Хоккайдо", "Северные горы богов, скованные льдом."] },
  kanazawa:  { en: ["Kanazawa, Ishikawa", "City of rain and paper umbrellas."],
               ja: ["石川・金沢", "雨と和傘の城下町。"],
               es: ["Kanazawa, Ishikawa", "Ciudad de lluvia y paraguas de papel."],
               de: ["Kanazawa, Ishikawa", "Stadt des Regens und der Papierschirme."],
               ru: ["Канадзава, Исикава", "Город дождей и бумажных зонтиков."] },
  izumo:     { en: ["Izumo, Shimane", "Where all the gods of Japan gather each autumn."],
               ja: ["島根・出雲", "八百万の神々が集う、神在月の地。"],
               es: ["Izumo, Shimane", "Donde se reúnen cada otoño todos los dioses de Japón."],
               de: ["Izumo, Shimane", "Wo sich jeden Herbst alle Götter Japans versammeln."],
               ru: ["Идзумо, Симанэ", "Где каждую осень собираются все боги Японии."] },
  onga:      { en: ["Onga, Fukuoka", "Birthplace of the Nurikabe legend — a wall that blocks the night road."],
               ja: ["福岡・遠賀", "ぬりかべ伝承の地。夜道をふさぐ見えない壁。"],
               es: ["Onga, Fukuoka", "Cuna de la leyenda del Nurikabe: un muro que bloquea el camino nocturno."],
               de: ["Onga, Fukuoka", "Heimat der Nurikabe-Legende – eine Mauer, die den Nachtweg versperrt."],
               ru: ["Онга, Фукуока", "Родина легенды о Нурикабэ — стене, что преграждает ночную дорогу."] },
  shuri:     { en: ["Shuri, Okinawa", "Southern islands under the typhoon. A wide board, a big swarm."],
               ja: ["沖縄・首里", "台風が渡る南の島。広い盤面に大群が押し寄せる。"],
               es: ["Shuri, Okinawa", "Islas del sur bajo el tifón. Tablero amplio, gran enjambre."],
               de: ["Shuri, Okinawa", "Südinseln im Taifun. Großes Brett, großer Schwarm."],
               ru: ["Сюри, Окинава", "Южные острова под тайфуном. Большое поле, огромный рой."] },
  shimanto:  { en: ["Shimanto, Kōchi", "Japan's last clear river — now the ground itself shakes."],
               ja: ["高知・四万十", "日本最後の清流。大地そのものが揺れる。"],
               es: ["Shimanto, Kōchi", "El último río cristalino de Japón; ahora tiembla la tierra."],
               de: ["Shimanto, Kōchi", "Japans letzter klarer Fluss – nun bebt der Boden selbst."],
               ru: ["Симанто, Коти", "Последняя чистая река Японии — теперь дрожит сама земля."] },
  nasu:      { en: ["Nasu, Tochigi", "The Killing Stone, where the nine-tailed fox was once sealed."],
               ja: ["栃木・那須", "かつて九尾の狐が封じられた殺生石。"],
               es: ["Nasu, Tochigi", "La Piedra Asesina, donde una vez se selló al zorro de nueve colas."],
               de: ["Nasu, Tochigi", "Der Tötungsstein, in dem einst der neunschwänzige Fuchs gebannt wurde."],
               ru: ["Насу, Тотиги", "Камень-убийца, где некогда запечатали девятихвостую лису."] },
  togakushi: { en: ["Togakushi, Nagano", "Sacred peaks of the mountain hermits. The barrier is almost closed."],
               ja: ["長野・戸隠", "修験者が籠もる霊峰。結界はもうすぐ閉じる。"],
               es: ["Togakushi, Nagano", "Picos sagrados de los ermitaños. La barrera casi está cerrada."],
               de: ["Togakushi, Nagano", "Heilige Gipfel der Bergeremiten. Die Barriere ist fast geschlossen."],
               ru: ["Тогакуси, Нагано", "Священные вершины горных отшельников. Барьер почти замкнут."] },
  fuji:      { en: ["Mount Fuji", "Close the great barrier at the heart of Japan."],
               ja: ["富士山", "日本の真ん中で、大結界を閉じよ。"],
               es: ["Monte Fuji", "Cierra la gran barrera en el corazón de Japón."],
               de: ["Berg Fuji", "Schließe die große Barriere im Herzen Japans."],
               ru: ["Гора Фудзи", "Замкни великий барьер в сердце Японии."] },
};
const regionOf = (i = stageIdx) => (REGIONS[STAGES[i].region] || REGIONS.kyoto)[lang] || REGIONS.kyoto.en;
// the barrier's route: north arc, south arc, and both arcs closing on Fuji
const MAP_EDGES = [[0, 1], [1, 2], [2, 3], [0, 4], [4, 5], [5, 6], [6, 7], [7, 8], [3, 9], [9, 10], [10, 11], [8, 11]];

const DUO_MORE = {
  en: ["TAG TEAM! Kappa swarms <b>and</b> splitting snow giants on a bigger board.",
       "TAG TEAM on a <b>wide</b> board! Swarms and leaping umbrellas — catch them in long links.",
       "TAG TEAM! The Wall <b>turns the board</b> while umbrellas <b>leap</b> over your barriers.",
       "TAG TEAM! Splitting giants <b>and</b> fake talismans. Trust nothing on the board!"],
  ja: ["コンビ戦！河童の群れと<b>分裂する雪の大物</b>が、広い盤面で押し寄せる。",
       "<b>広い</b>盤面のコンビ戦！大群と跳ぶ唐傘を、長い線でまとめて巻き込め。",
       "コンビ戦！塗壁が<b>盤面を回し</b>、唐傘が結界を<b>跳び越える</b>。",
       "コンビ戦！<b>分裂する大物</b>と<b>偽札</b>。盤面の何も信じるな！"],
  es: ["¡EQUIPO! Enjambres de kappa <b>y</b> gigantes de nieve que se dividen en un tablero mayor.",
       "¡EQUIPO en un tablero <b>amplio</b>! Enjambres y paraguas saltarines: atrápalos con enlaces largos.",
       "¡EQUIPO! El Muro <b>gira el tablero</b> mientras los paraguas <b>saltan</b> tus barreras.",
       "¡EQUIPO! Gigantes que se dividen <b>y</b> talismanes falsos. ¡No te fíes de nada!"],
  de: ["TAG-TEAM! Kappa-Schwärme <b>und</b> sich teilende Schneeriesen auf einem größeren Brett.",
       "TAG-TEAM auf einem <b>großen</b> Brett! Schwärme und hüpfende Schirme – fang sie mit langen Linien.",
       "TAG-TEAM! Die Mauer <b>dreht das Brett</b>, während Schirme über deine Barrieren <b>springen</b>.",
       "TAG-TEAM! Sich teilende Riesen <b>und</b> falsche Talismane. Trau nichts auf dem Brett!"],
  ru: ["ДУЭТ! Стаи капп <b>и</b> делящиеся снежные великаны на большом поле.",
       "ДУЭТ на <b>широком</b> поле! Рои и прыгающие зонтики — лови их длинными линиями.",
       "ДУЭТ! Стена <b>вращает поле</b>, а зонтики <b>перепрыгивают</b> барьеры.",
       "ДУЭТ! Делящиеся великаны <b>и</b> фальшивые талисманы. Не верь ничему на поле!"],
};
const MAP_UI = {
  en: { journey: "THE GREAT BARRIER", start: "OK / click to begin", locked: "Clear the previous stage to unlock", rec: "Start here", best: "Best", final: "FINAL" },
  ja: { journey: "大結界の旅", start: "決定／クリックで開始", locked: "前のステージをクリアすると解放", rec: "ここから", best: "ベスト", final: "最終決戦" },
  es: { journey: "LA GRAN BARRERA", start: "OK / clic para empezar", locked: "Supera la fase anterior para desbloquear", rec: "Empieza aquí", best: "Mejor", final: "FINAL" },
  de: { journey: "DIE GROSSE BARRIERE", start: "OK / Klick zum Starten", locked: "Schließe die vorige Stufe ab", rec: "Hier beginnen", best: "Bestzeit", final: "FINALE" },
  ru: { journey: "ВЕЛИКИЙ БАРЬЕР", start: "OK / клик — начать", locked: "Пройди предыдущий этап", rec: "Начни здесь", best: "Рекорд", final: "ФИНАЛ" },
};
for (const l of LANGS) { I18N[l].duo = I18N[l].duo.slice(0, 2).concat(DUO_MORE[l]); I18N[l].map = MAP_UI[l]; }

// stage intro toast carries the place
stageIntro = function () {
  const S = STAGES[stageIdx], [rn, lore] = regionOf();
  const body = S.duo != null ? L().duo[S.duo] : L().b[S.foes[0]].intro;
  return `<div class="rgn">⛩ ${rn}</div>${S.tutorial ? "" : `<div class="rgnLore">${lore}</div>`}${body}`;
};

// ---------- map screen ----------
(() => {
  const st = document.createElement("style");
  st.textContent = `
    .selPanel.map { width:min(96vw,1100px); max-width:none; padding:10px 18px 12px; }
    .selPanel.map h2 { font-size:clamp(18px,3vw,26px); }
    .selPanel.map h2 { margin-bottom:6px; }
    #selBody { display:flex; gap:28px; align-items:stretch; justify-content:center; }
    #selInfo { flex:1 1 0; min-width:220px; max-width:420px; display:flex; flex-direction:column; justify-content:center; text-align:left; gap:8px; padding:6px 4px; }
    #selInfo .iStage { font-size:12px; letter-spacing:4px; color:#b08a9a; }
    #selInfo .iRegion { font-family:"Yu Mincho","Noto Serif JP",serif; font-size:clamp(20px,3.2vw,30px); color:#ffd65a; text-shadow:0 0 14px rgba(255,190,60,.45); line-height:1.15; }
    #selInfo .iFoes { display:flex; gap:10px; align-items:flex-end; min-height:96px; }
    #selInfo .iFoes img { height:96px; filter:drop-shadow(0 0 10px rgba(170,60,255,.6)); }
    #selInfo .iNames { font-size:15px; color:#f2e6ff; }
    #selInfo .iLore { font-size:14px; color:#d9c7b0; line-height:1.5; font-style:italic; }
    #selInfo .iStat { font-size:13px; color:#9ffcff; }
    #selInfo .iStat.lock { color:#a08a9a; }
    #selInfo .iGo { font-size:12px; color:#b08a9a; letter-spacing:1px; }
    #jmap { position:relative; height:min(80vh,640px); aspect-ratio:var(--ar); flex:0 0 auto; }
    #jmap svg { position:absolute; inset:0; width:100%; height:100%; overflow:visible; }
    #jmap .land { fill:#352848; stroke:#8a6a9a; stroke-width:1; }
    #jmap .inset { fill:none; stroke:#4a3560; stroke-dasharray:3 3; }
    #jmap .edge { stroke:#5a4470; stroke-width:2.2; stroke-dasharray:4 5; fill:none; }
    #jmap .edge.lit { stroke:#ffcf5a; stroke-width:3; stroke-dasharray:none; filter:drop-shadow(0 0 4px #ffb02e); }
    #jmap .edge.next { stroke:#ff8a5a; stroke-dasharray:6 4; animation:edgeMarch 1s linear infinite; }
    @keyframes edgeMarch { to { stroke-dashoffset:-20; } }
    #selGrid.mapNodes { position:absolute; inset:0; display:block; }
    #selGrid.mapNodes .card { position:absolute; width:36px; height:36px; padding:0; border-radius:50%; transform:translate(-50%,-50%);
      background:#1d1428; border:2px solid #6a4a80; overflow:visible; gap:0; justify-content:center; }
    #selGrid.mapNodes .card img { width:31px; height:31px; object-fit:contain; border-radius:50%; }
    #selGrid.mapNodes .card .nlab { position:absolute; top:100%; left:50%; transform:translateX(-50%); margin-top:2px; font-size:10px; white-space:nowrap;
      color:#e8dcc8; text-shadow:0 0 4px #000,0 0 4px #000; pointer-events:none; }
    #selGrid.mapNodes .card.done { border-color:#ffcf5a; box-shadow:0 0 12px rgba(255,190,60,.6); }
    #selGrid.mapNodes .card.done::after { content:"✓"; position:absolute; right:-6px; top:-6px; background:#ffcf5a; color:#2a1a10; border-radius:50%; width:16px; height:16px; font-size:11px; line-height:16px; font-weight:bold; }
    #selGrid.mapNodes .card.locked { filter:grayscale(1) brightness(.55); border-style:dashed; }
    #selGrid.mapNodes .card.fuji { width:46px; height:46px; border-color:#d6282d; box-shadow:0 0 16px rgba(214,40,45,.6); }
    #selGrid.mapNodes .card.fuji img { width:40px; height:40px; }
    #selGrid.mapNodes .card.next { animation:nodePulse 1.4s ease-in-out infinite; }
    @keyframes nodePulse { 50% { box-shadow:0 0 0 6px rgba(255,138,90,.25), 0 0 18px rgba(255,138,90,.7); } }
    body.kbd #selGrid.mapNodes .card.tvf { transform:translate(-50%,-50%) scale(1.25); z-index:4; }
    .rgn { font-size:12px; letter-spacing:2px; color:#ffcf5a; margin-bottom:2px; }
    .rgnLore { font-size:12px; color:#cdbba8; font-style:italic; margin-bottom:6px; }
    @media (max-width:700px) { #selBody { flex-direction:column; align-items:center; } #jmap { height:min(62vh,520px); } #selInfo { max-width:none; width:100%; min-height:0; } #selInfo .iFoes img { height:60px; } #selInfo .iFoes { min-height:60px; } }
  `;
  document.head.appendChild(st);
  // restructure the select panel: info on the left, map on the right
  const panel = document.querySelector("#select .selPanel"); panel.classList.add("map");
  const grid = $("selGrid");
  const body = document.createElement("div"); body.id = "selBody";
  body.innerHTML = `<div id="selInfo"><div class="iStage"></div><div class="iRegion"></div><div class="iFoes"></div><div class="iNames"></div><div class="iLore"></div><div class="iStat"></div><div class="iGo"></div></div><div id="jmap"><svg></svg></div>`;
  grid.replaceWith(body);
  $("jmap").appendChild(grid); grid.classList.add("mapNodes");
  $("jmap").style.setProperty("--ar", `${JAPAN.W - MAP_X0 + 10} / ${JAPAN.H + 10}`);
})();

function nodeLabel(i) { const parts = regionOf(i)[0].split(/\s*[·・,]\s*/); return lang === "ja" ? parts[parts.length - 1] : parts[0]; }
// display positions: true locations, nudged apart where central Honshu gets crowded
const NODE_POS = { kyoto: [222, 444], kanazawa: [246, 358], togakushi: [292, 392], echigo: [342, 318], nasu: [396, 362], fuji: [338, 448], shuri: [JAPAN.nodes.shuri[0] + 6, JAPAN.nodes.shuri[1] - 14] };
function nodeXY(i) { const k = STAGES[i].region; return NODE_POS[k] || JAPAN.nodes[k]; }
function stageLabel(i) { return STAGES[i].tutorial ? L().training : i === STAGES.length - 1 ? L().map.final : `${L().stage} ${i}`; }
function showInfo(i) {
  const S = STAGES[i], [rn, lore] = regionOf(i), open = unlocked(i), done = !!prog.cleared[i], inf = $("selInfo");
  inf.querySelector(".iStage").textContent = stageLabel(i);
  inf.querySelector(".iRegion").textContent = rn;
  inf.querySelector(".iFoes").innerHTML = S.foes.map(bi => `<img src="${SPRITES[BOSSES[bi].key]}" alt="" style="${open ? "" : "filter:brightness(0) drop-shadow(0 0 6px #6a4a80)"}">`).join("");
  inf.querySelector(".iNames").textContent = open ? stageName(i) : "？？？";
  inf.querySelector(".iLore").textContent = lore;
  const stat = inf.querySelector(".iStat");
  stat.className = "iStat" + (open ? "" : " lock");
  stat.textContent = !open ? "🔒 " + L().map.locked : done ? `✓ ${prog.best[i] ? L().map.best + " " + fmtTime(prog.best[i]) : ""}` : (i === 0 ? L().map.rec : "");
  inf.querySelector(".iGo").textContent = open ? "▶ " + L().map.start : "";
}
const _openSelectOld = openSelect;
openSelect = function () {
  if (phase === "fight") { pausedPhase = "fight"; pausedAt = performance.now(); phase = "menu"; }
  $("select").querySelector("h2").textContent = L().map.journey;
  const W = JAPAN.W - MAP_X0 + 10, H = JAPAN.H + 10, ix = JAPAN.inset;
  const nextIdx = STAGES.findIndex((S, i) => unlocked(i) && !prog.cleared[i]);
  const edges = MAP_EDGES.map(([a, b]) => {
    const [x1, y1] = nodeXY(a), [x2, y2] = nodeXY(b);
    const cls = prog.cleared[b] ? "edge lit" : b === nextIdx && (prog.cleared[a] || a === 0 && prog.cleared[0]) ? "edge next" : "edge";
    // arcs bow outward a little so the ring reads as a barrier
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1, bow = Math.min(40, len * .18);
    const cx = mx + dy / len * bow, cy = my - dx / len * bow;
    return `<path class="${cls}" d="M${x1},${y1} Q${cx},${cy} ${x2},${y2}"/>`;
  }).join("");
  const svg = $("jmap").querySelector("svg");
  svg.setAttribute("viewBox", `${MAP_X0} 0 ${W} ${H}`);
  svg.innerHTML = `<rect class="inset" x="${ix.x - 6}" y="${ix.y - 8}" width="74" height="84" rx="6"/><path class="land" d="${JAPAN.main}"/><path class="land" d="${JAPAN.oki}"/>${edges}`;
  const g = $("selGrid"); g.innerHTML = "";
  STAGES.forEach((S, i) => {
    const card = document.createElement("button");
    const open = unlocked(i), done = !!prog.cleared[i], [x, y] = nodeXY(i);
    card.className = "card" + (open ? "" : " locked") + (done ? " done" : "") + (S.tutorial ? " tut" : "") + (i === STAGES.length - 1 ? " fuji" : "") + (i === nextIdx ? " next" : "");
    card.style.left = ((x - MAP_X0) / W * 100) + "%"; card.style.top = (y / H * 100) + "%";
    card.innerHTML = `<img src="${SPRITES[BOSSES[S.foes[S.foes.length - 1]].key]}" alt=""><span class="nlab">${nodeLabel(i)}</span>`;
    card.addEventListener("focus", () => showInfo(i));
    card.addEventListener("mouseenter", () => showInfo(i));
    if (open) card.addEventListener("click", () => { closeSelect(false); stageIdx = i; startStage(); });
    else card.addEventListener("click", () => { showInfo(i); sndBlock(); });
    g.appendChild(card);
  });
  showInfo(nextIdx >= 0 ? nextIdx : Math.min(stageIdx, STAGES.length - 1));
  $("select").style.display = "flex";
};

$("selBtn").removeEventListener("click", _openSelectOld);
$("selBtn").addEventListener("click", () => openSelect());
