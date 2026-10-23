const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim()+'/playwright');
(async()=>{
  const b=await chromium.launch(); const p=await b.newPage({viewport:{width:960,height:540},deviceScaleFactor:2});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+__dirname+'/kekkai.html?tv=1'); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
  await p.evaluate(()=>{ closeSelect(false); KK.jump(2); }); await p.waitForTimeout(9000);
  await p.screenshot({path:__dirname+'/tvshots/telegraph.png'});
  // telegraph accuracy: predicted vs actual over a few steps
  const acc=await p.evaluate(async()=>{ let ok=0,tot=0; for(let k=0;k<25;k++){ const pl=minions.filter(m=>!m.dead&&m.fake===undefined).map(m=>({m,p:planStep(m),cell:m.cell,at:m.moveAt})); await new Promise(r=>setTimeout(r,350)); for(const o of pl){ if(o.m.moveAt!==o.at && !o.m.dead){ tot++; const exp=o.p.kind==='wait'?o.cell:o.p.to; if(o.m.cell===exp) ok++; } } } return {ok,tot}; });
  console.log('telegraph predicted correctly', acc);
  // seal: knock boss below 66%
  await p.evaluate(()=>{ KK.jump(4); }); await p.waitForTimeout(800);
  const hp0=await p.evaluate(()=>{ damageBoss(Math.ceil(foes[0].max*.36), true, 0); return foes[0].hp; });
  await p.waitForTimeout(400); let ph=await p.evaluate(()=>phase); console.log('after hp->64%: phase', ph, 'hp', hp0, 'N', await p.evaluate(()=>N));
  await p.waitForTimeout(600); await p.screenshot({path:__dirname+'/tvshots/seal_start.png'});
  // solve with the remote
  const sol=await p.evaluate(()=>seal.sol), n=await p.evaluate(()=>N);
  const dirKey=(a,c)=>{ const d=c-a; return d===1?'ArrowRight':d===-1?'ArrowLeft':d===n?'ArrowDown':'ArrowUp'; };
  for(const [si,seg] of sol.entries()){
    await p.evaluate(c=>{ cur=c; }, seg[0]); await p.keyboard.press('Enter'); await p.waitForTimeout(30);
    for(let i=1;i<seg.length;i++){ await p.keyboard.press(dirKey(seg[i-1],seg[i])); await p.waitForTimeout(25); }
    if(si===sol.length-2){ await p.waitForTimeout(100); await p.screenshot({path:__dirname+'/tvshots/seal_mid.png'}); }
  }
  await p.waitForTimeout(300); await p.screenshot({path:__dirname+'/tvshots/seal_done.png'});
  await p.waitForTimeout(2600);
  const r=await p.evaluate(()=>({phase, N, hp:foes[0].hp, max:foes[0].max, minions:minions.length}));
  console.log('after solving:', r, 'damage dealt', hp0-r.hp);
  // second threshold → fail by timeout
  await p.evaluate(()=>{ damageBoss(Math.ceil(foes[0].hp - foes[0].max*.3), true, 0); }); await p.waitForTimeout(500);
  console.log('2nd seal phase', await p.evaluate(()=>phase));
  await p.evaluate(()=>{ seal.until=performance.now(); }); await p.waitForTimeout(1200);
  console.log('after timeout:', await p.evaluate(()=>({phase, N, sealsDone})));
  console.log('errors', errs); await b.close();
})();
