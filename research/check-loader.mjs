import {Browser, sleep} from '/Users/bethrooney/.codex/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import {writeFileSync} from 'node:fs';
const browser=await Browser.launch();
try{
  const page=await browser.newPage({width:1440,height:900});
  await page.goto('http://127.0.0.1:4187/',{settleMs:1600});
  const opening=await page.eval(()=>{
    const rail=document.querySelector('.loader-track').getBoundingClientRect();
    const word=document.querySelector('.loader-word');
    return {timeMs:performance.now(),ready:document.documentElement.classList.contains('ready'),word:word.textContent,wordDisplay:getComputedStyle(word).display,barWidth:rail.width,viewport:innerWidth,barHeight:rail.height,barCentered:Math.abs((rail.left+rail.right)/2-innerWidth/2)<1,percentage:document.getElementById('load-progress').textContent};
  });
  await page.screenshot({path:'loader-preview.jpg',quality:95});
  await sleep(2000);
  const held=await page.eval(()=>({timeMs:performance.now(),ready:document.documentElement.classList.contains('ready')}));
  await sleep(1700);
  const completed=await page.eval(()=>({timeMs:performance.now(),ready:document.documentElement.classList.contains('ready'),loaderDisplay:getComputedStyle(document.querySelector('.loader')).display,percentage:document.getElementById('load-progress').textContent,portrait:document.querySelector('.hero-dea img').currentSrc,portraitComplete:document.querySelector('.hero-dea img').complete}));
  if(opening.word!=='CoachDÉA'||opening.wordDisplay!=='flex'||!opening.barCentered||Math.abs(opening.barWidth/opening.viewport-2/3)>.001||opening.barHeight!==22||opening.ready||held.ready||!completed.ready||completed.loaderDisplay!=='none'||completed.percentage!=='100%')throw Error('Loader verification failed: '+JSON.stringify({opening,held,completed}));
  const report={opening,held,completed,pass:true};
  writeFileSync('research/loader-verification.json',JSON.stringify(report,null,2));
  console.log(JSON.stringify(report));
} finally{await browser.close();}
