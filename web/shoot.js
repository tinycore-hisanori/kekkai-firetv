const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim()+'/playwright');
function bfs(N, free, a, b){ const prev=new Array(N*N).fill(-1); const q=[a]; prev[a]=a;
  while(q.length){const c=q.shift(); if(c===b)break; const x=c%N,y=(c/N)|0;
    for(const nb of [x>0?c-1:-1,x<N-1?c+1:-1,y>0?c-N:-1,y<N-1?c+N:-1]){ if(nb<0||prev[nb]!==-1)continue; if(nb!==b&&!free[nb])continue; prev[nb]=c;q.push(nb);} }
  if(prev[b]===-1)return null; const o=[b]; let s=b; while(s!==a){s=prev[s];o.push(s);} return o.reverse(); }
async function bestPath(p){
  const s=await p.evaluate(()=>KK.s); const N=s.N, free=s.free;
  const tg=s.minions.slice().sort((a,b)=>((b/N)|0)-((a/N)|0));
  let best=null,bs=-1;
  for(const d of s.dots){ if(!d)continue; const cands=[bfs(N,free,d.a,d.b)];
    for(let i=0;i<Math.min(3,tg.length);i++){ let path=[d.a],ok=true; const used=new Set([d.a]);
      for(const t of tg.slice(0,i+1).concat([d.b])){ const fr=free.slice(); for(const c of used)fr[c]=false; const q=bfs(N,fr,path[path.length-1],t); if(!q){ok=false;break;} for(const c of q.slice(1)){path.push(c);used.add(c);} }
      if(ok) cands.push(path); }
    for(const path of cands){ if(!path)continue; const k=path.filter(c=>s.minions.includes(c)).length; const sc=k*10-path.length*.15; if(sc>bs){bs=sc;best=path;} } }
  return {s,best};
}
async function draw(p, path, N, {hold=false, stepMs=3}={}){
  const box=await p.$eval('#cv',c=>{const r=c.getBoundingClientRect();return [r.left,r.top,r.width];});
  const pad=Math.round(box[2]*0.025), cell=(box[2]-2*pad)/N, cc=x=>[box[0]+pad+(x%N+.5)*cell, box[1]+pad+(((x/N)|0)+.5)*cell];
  await p.mouse.move(...cc(path[0])); await p.mouse.down();
  const n = hold ? Math.max(2, path.length-1) : path.length;
  for(const x of path.slice(0,n)) await p.mouse.move(...cc(x),{steps:stepMs});
  if(!hold) await p.mouse.up();
}
module.exports={bfs,bestPath,draw};
if (require.main===module) (async()=>{
  const b = await chromium.launch();
  const p = await b.newPage({viewport:{width:1280,height:720}, locale:'en-US'});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+__dirname+'/kekkai.html'); await p.waitForTimeout(500);
  await p.screenshot({path:'media/01_title.png'});
  await p.click('#startBtn'); await p.waitForTimeout(300);
  // stage 2 (umbrella): play until several minions on board, then capture mid-drag through minions
  await p.evaluate(()=>KK.jump(2)); await p.waitForTimeout(7000);
  for(let i=0;i<30;i++){ const {s,best}=await bestPath(p); if(best && best.filter(c=>s.minions.includes(c)).length>=2){ await draw(p,best,s.N,{hold:true}); await p.waitForTimeout(150); await p.screenshot({path:'media/02_drawing_through_minions.png'}); await p.mouse.up(); await p.waitForTimeout(350); await p.screenshot({path:'media/03_multikill.png'}); break; } await p.waitForTimeout(700); }
  // stage 3 yuki: gate danger shot
  await p.evaluate(()=>KK.jump(3)); await p.waitForTimeout(14000); await p.screenshot({path:'media/04_yuki_onna_gate.png'});
  // stage 6 duo
  await p.evaluate(()=>KK.jump(6)); await p.waitForTimeout(9000);
  { const {s,best}=await bestPath(p); if(best){ await draw(p,best,s.N,{hold:true}); await p.waitForTimeout(150);} await p.screenshot({path:'media/05_tag_team.png'}); await p.mouse.up(); }
  // final battle
  await p.evaluate(()=>KK.jump(7)); await p.waitForTimeout(900); await p.screenshot({path:'media/06_final_battle_intro.png'});
  await p.waitForTimeout(9000); { const {s,best}=await bestPath(p); if(best){ await draw(p,best,s.N,{hold:true}); await p.waitForTimeout(150);} await p.screenshot({path:'media/07_final_battle.png'}); await p.mouse.up(); }
  // ending
  await p.evaluate(()=>{ document.getElementById('select').style.display='none'; showEnding(312); }); await p.waitForTimeout(9000); await p.screenshot({path:'media/08_ending_festival.png'});
  // stage select
  await p.evaluate(()=>{ hideEnding(); phase='menu'; openSelect(); }); await p.waitForTimeout(500); await p.screenshot({path:'media/09_stage_select.png'});
  // training step 3 in Japanese (multi-language shot)
  await p.evaluate(()=>{ closeSelect(false); lang='ja'; applyLang(); KK.jump(0); }); await p.waitForTimeout(800);
  { for(let i=0;i<4;i++){ const hint=await p.evaluate(()=>tutHintPath()); const s=await p.evaluate(()=>KK.s); if(s.tut>=3) break; if(hint){ await draw(p,hint,s.N); } await p.waitForTimeout(1800);} await p.waitForTimeout(600); await p.screenshot({path:'media/10_training_ja.png'}); }
  // cover 630x500 from a 1260x1000 final battle view
  const c = await b.newPage({viewport:{width:1260,height:1000}, locale:'en-US'});
  await c.goto('file://'+__dirname+'/kekkai.html'); await c.click('#startBtn'); await c.evaluate(()=>KK.jump(7)); await c.waitForTimeout(10000);
  { const {s,best}=await bestPath(c); if(best){ await draw(c,best,s.N,{hold:true}); await c.waitForTimeout(150);} await c.screenshot({path:'media/cover_raw.png'}); }
  console.log('errors',errs); await b.close();
})();
