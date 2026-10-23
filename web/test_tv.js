// Keyboard-only (remote) playthrough at Fire TV CSS size 960x540
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim()+'/playwright');
const { bfs } = require('./shoot.js');
const fs = require('fs'); fs.mkdirSync(__dirname+'/tvshots', {recursive:true});
(async()=>{
  const b = await chromium.launch();
  const p = await b.newPage({viewport:{width:960,height:540}, deviceScaleFactor:2, locale:'en-US'});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); });
  await p.goto('file://'+__dirname+'/kekkai.html?tv=1');
  const S=()=>p.evaluate(()=>KK.s), cur=()=>p.evaluate('cur'), key=async(k,w=60)=>{ await p.keyboard.press(k); await p.waitForTimeout(w); };
  const shot=n=>p.screenshot({path:`${__dirname}/tvshots/${n}.png`});
  const dirKey=(a,c,N)=>{ const d=c-a; return d===1?'ArrowRight':d===-1?'ArrowLeft':d===N?'ArrowDown':'ArrowUp'; };
  async function moveTo(t){ const s=await S(); for(let g=0; g<30; g++){ const c=await cur(); if(c===t) return true; const cx=c%s.N, cy=(c/s.N)|0, tx=t%s.N, ty=(t/s.N)|0;
      await key(cx!==tx ? (tx>cx?'ArrowRight':'ArrowLeft') : (ty>cy?'ArrowDown':'ArrowUp'), 25); } return false; }
  async function link(path){ const s=await S(); if(!await moveTo(path[0])) return false; await key('Enter',40);
    for(let i=1;i<path.length;i++) await key(dirKey(path[i-1],path[i],s.N), 35); return true; }
  const log=(t,ok)=>console.log(t.padEnd(40), ok?'OK':'FAIL');

  await p.waitForTimeout(600); await shot('01_title');
  log('title focus on start', await p.$eval('#startBtn',e=>e.classList.contains('tvf')));
  await key('Enter',600);
  let s=await S(); log('Enter → training', s.phase==='fight' && s.tut===1);
  await shot('02_tut1');
  // play the training with hint paths only
  for(let t=0;t<60;t++){
    s=await S(); if(s.phase!=='fight') break;
    if(s.tut===5){ await key('[',900); await key(']',900); continue; }
    const hint=await p.evaluate(()=>{ const h=tutHintPath(); return h; });
    if(hint && hint.length>1){ await link(hint); if(t===0) await shot('03_tut_link'); }
    else if(s.tut===6 || s.tut===4){ const d=s.dots.find(Boolean); const pa=d&&bfs(s.N,s.free,d.a,d.b); if(pa) await link(pa); }
    await p.waitForTimeout(700);
  }
  await p.waitForTimeout(2200); s=await S();
  const ov=await p.$eval('#overlay',e=>getComputedStyle(e).display);
  log('training cleared by remote', ov==='flex'); await shot('04_tut_done');
  await key('Enter',800); s=await S(); log('OK on NEXT → stage 1', s.phase==='fight' && s.bossIdx===1);
  // stage 1: hold a half line, then cancel with Back
  { const d=s.dots.find(Boolean); await moveTo(d.a); await key('Enter'); await key('ArrowRight'); await shot('05_holding');
    await key('Escape'); const dr=await p.evaluate('dragging'); log('Back cancels a held line', dr===-1); }
  await key('Escape',300); log('Back → pause (select)', await p.$eval('#select',e=>getComputedStyle(e).display==='flex') && await p.$eval('#selClose',e=>e.classList.contains('tvf')));
  await shot('06_pause');
  await key('ArrowUp',200); await shot('07_pause_nav');
  await key('Escape',300); s=await S(); log('Back again → resume', s.phase==='fight');
  // play a few links
  for(let i=0;i<6;i++){ s=await S(); const d=s.dots.find(Boolean); const pa=d&&bfs(s.N,s.free,d.a,d.b); if(pa) await link(pa); await p.waitForTimeout(400); }
  s=await S(); log('links made in stage 1', s.links>=3); await shot('08_stage1');
  // quake stage: cursor survives rotation
  await p.evaluate(()=>KK.jump(6)); await p.waitForTimeout(400); s=await S();
  await p.evaluate(()=>{ quakeAt=performance.now()+50; }); await p.waitForTimeout(900);
  const c=await cur(); log('cursor valid after quake', c>=0 && c<s.N*s.N);
  await shot('09_quake');
  // ending: OK fireworks, Back → card, OK on STAGES
  await p.evaluate(()=>{ stageIdx=STAGES.length-1; showEnding(300); }); await p.waitForTimeout(3000);
  await key('Enter',100); await key('Enter',400); await shot('10_ending');
  await key('Escape',1800); log('Back → end card focus', await p.$eval('#endStages',e=>e.classList.contains('tvf')));
  await shot('11_endcard');
  await key('ArrowRight',200); log('arrow → TITLE button', await p.$eval('#endTitle',e=>e.classList.contains('tvf')));
  await key('ArrowLeft',100); await key('Enter',500); log('OK → stage select', await p.$eval('#select',e=>getComputedStyle(e).display==='flex'));
  await key('ArrowRight',150); await key('ArrowDown',150); await shot('12_select');
  const f=await p.evaluate(()=>tvFocus&&tvFocus.className); log('select has a focused card', /card/.test(f||''));
  await key('Enter',800); s=await S(); log('OK on card → stage starts', s.phase==='fight' || s.phase==='intro');
  // Japanese texts
  await p.evaluate(()=>{ lang='ja'; applyLang(); KK.jump(0); }); await p.waitForTimeout(800); await shot('13_tut_ja');
  console.log('errors', errs); await b.close();
})();
