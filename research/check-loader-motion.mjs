import {Browser,sleep} from '/Users/bethrooney/.codex/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import {writeFileSync} from 'node:fs';
const browser=await Browser.launch();
try{
 const page=await browser.newPage({width:1440,height:900});
 await page.goto('http://127.0.0.1:4187/',{settleMs:1200});
 const sample=()=>page.eval(()=>({time:performance.now(),ready:document.documentElement.classList.contains('ready'),percent:document.getElementById('load-progress').textContent,topName:document.querySelector('.loader-top .name-case').innerText,portraitOpacity:Number(getComputedStyle(document.querySelector('.loader-portrait')).opacity),caption:document.querySelector('.loader-bottom>span').textContent,letters:[...document.querySelectorAll('.loader-word>span')].map(n=>{const s=getComputedStyle(n),m=new DOMMatrixReadOnly(s.transform);return{text:n.textContent,x:m.m41,y:m.m42,a:m.a,b:m.b,c:m.c,d:m.d,playState:s.animationPlayState}})}));
 const first=await sample();await page.screenshot({path:'loader-preview.jpg',quality:95});
 await sleep(Math.max(0,3800-first.time));
 const during=await sample();
 await sleep(550);
 let completed=await sample();
 for(let i=0;!completed.ready&&i<32;i++){await sleep(250);completed=await sample();}
 const verticalOnly=[first,during].every(s=>s.letters.every(l=>l.x===0&&l.a===1&&l.b===0&&l.c===0&&l.d===1));
 const opacityMatchesProgress=[first,during,completed].every(s=>Math.abs(s.portraitOpacity-parseInt(s.percent)/100)<.001);
 const moving=first.letters.some((l,i)=>Math.abs(l.y-during.letters[i].y)>.05);
 if(!opacityMatchesProgress||completed.portraitOpacity!==1||first.caption!=='LOADING THE NEW YOU.'||!verticalOnly||!moving||during.ready||first.topName!=='DÉA'||completed.percent!=='100%'||!completed.ready||completed.letters.some(l=>l.playState!=='paused')) throw Error(JSON.stringify({first,during,completed,verticalOnly,moving}));
 const report={pass:true,opacityMatchesProgress,verticalOnly,moving,first,during,completed};
 writeFileSync('research/loader-motion-verification.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify({pass:true,opacityMatchesProgress,verticalOnly,moving,heldAt:during.time,percentage:completed.percent,stoppedAt100:true}));
}finally{await browser.close();}
