import {Browser,sleep} from '/Users/bethrooney/.codex/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import {writeFileSync,mkdirSync,readFileSync} from 'node:fs';
const out='.taste-skill/speaking';mkdirSync(out,{recursive:true});
const browser=await Browser.launch();
try{
 const reports=[];
 for(const width of [1440,390,768,3840]){
  const height=width===3840?2160:width===390?844:900;
  const page=await browser.newPage({width,height});
  await page.send('Page.addScriptToEvaluateOnNewDocument',{source:`addEventListener('DOMContentLoaded',()=>{window.loaderSamples=[];const l=document.querySelector('.loader');const sample=()=>{const pct=Number(document.getElementById('load-progress').textContent.replace('%',''));window.loaderSamples.push({time:performance.now(),railWidth:l.querySelector('.loader-track').getBoundingClientRect().width,railX:l.querySelector('.loader-track').getBoundingClientRect().x,percent:pct,photo:Number(getComputedStyle(l.querySelector('img')).opacity),outline:Number(getComputedStyle(l.querySelector('svg')).opacity),dash:parseFloat(getComputedStyle(l.querySelector('path')).strokeDashoffset.replace('calc(','')),ready:document.documentElement.classList.contains('ready'),letters:[...document.querySelectorAll('.loader-word>span')].map(n=>{const s=getComputedStyle(n),m=new DOMMatrixReadOnly(s.transform);return{x:m.m41,y:m.m42,b:m.b,c:m.c,playState:s.animationPlayState}})});};sample();new MutationObserver(sample).observe(l,{attributes:true,attributeFilter:['style'],subtree:false});});`});
  await page.goto('http://127.0.0.1:4187/',{settleMs:1700});
  if(width===1440||width===390)await page.screenshot({path:`${out}/loader-outline-${width}.jpg`,quality:95});
  await sleep(1300);
  if(width===1440||width===390)await page.screenshot({path:`${out}/loader-photo-${width}.jpg`,quality:95});
  await page.eval(()=>new Promise(resolve=>{const check=()=>getComputedStyle(document.querySelector('.loader')).display==='none'?resolve():requestAnimationFrame(check);check();}));
  await page.screenshot({path:`${out}/hero-${width}.jpg`,quality:95});
  const data=await page.eval(()=>{
   const q=s=>document.querySelector(s),box=s=>{const r=q(s).getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right}};
   const ids=[...document.querySelectorAll('[id]')].map(n=>n.id);
   const options=[...q('#enquiry-topic').options].map(o=>o.value);
   const samples=window.loaderSamples;
   const results={width:innerWidth,height:innerHeight,overflow:document.documentElement.scrollWidth>innerWidth,brand:q('.wordmark').innerText,brandBox:box('.wordmark'),navBox:box('.site-header'),railBox:box('.loader-track'),paths:document.querySelectorAll('.loader-outline path').length,duplicateIds:ids.filter((v,i)=>ids.indexOf(v)!==i),brokenAnchors:[...document.querySelectorAll('a[href^="#"]')].map(a=>a.getAttribute('href')).filter(h=>h.length>1&&!document.getElementById(h.slice(1))),badTopics:[...document.querySelectorAll('[data-topic]')].map(a=>a.dataset.topic).filter(t=>!options.includes(t)),privateOffers:/private coaching|one-to-one|consultation|90 minutes|45 minutes/i.test(document.body.innerText),nameBare:/(?<!COACH )DÉA/i.test(document.body.innerText.replace(/COACH\s+D\s+É\s+A/gi,'COACH DÉA')),ready:document.documentElement.classList.contains('ready'),samples};
   results.photoMapping=samples.every(s=>Math.abs(s.photo-Math.max(0,(s.percent-50)/50))<.001);
   results.outlineMapping=samples.every(s=>Math.abs(s.outline-(1-s.photo))<.001&&Math.abs(s.dash-(1-Math.min(1,s.percent/50)))<.001);
   results.heldFor4Seconds=samples.filter(s=>s.time<4000).every(s=>!s.ready)&&samples.some(s=>s.percent===100&&s.time>=4200);
   results.verticalOnly=samples.every(s=>s.letters.every(l=>l.x===0&&l.b===0&&l.c===0));
   results.visibleAt100=samples.some(s=>s.percent===100&&s.photo===1&&s.outline===0);
   results.railRatio=samples[0].railWidth/innerWidth;results.railCentered=Math.abs(samples[0].railX-innerWidth/6)<.5;
   results.allTopicsWork=[...document.querySelectorAll('.path-choice')].map(b=>{b.click();const href=q('#path-link').getAttribute('href'),topic=q('#enquiry-topic').value;return{key:b.dataset.path,href,topic,matches:!!topic&&q('#path-link').dataset.topic===topic}});
   return results;
  });
  if(width===390){await page.eval(()=>{document.querySelector('.menu-toggle').click()});await page.screenshot({path:`${out}/menu-390.jpg`,quality:95});await page.eval(()=>{document.querySelector('.menu-toggle').click()});}
  await page.eval(()=>{document.querySelector('#speaking').scrollIntoView({behavior:'instant'});});await sleep(400);await page.screenshot({path:`${out}/speaking-${width}.jpg`,quality:95});
  await page.eval(()=>{document.querySelector('.site-footer').scrollIntoView({behavior:'instant'});});await sleep(400);await page.screenshot({path:`${out}/footer-${width}.jpg`,quality:95});
  data.pass=!data.overflow&&!data.duplicateIds.length&&!data.brokenAnchors.length&&!data.badTopics.length&&!data.privateOffers&&!data.nameBare&&data.photoMapping&&data.outlineMapping&&data.heldFor4Seconds&&data.verticalOnly&&data.visibleAt100&&data.allTopicsWork.every(t=>t.matches)&&data.paths>0&&Math.abs(data.railRatio-2/3)<.001&&data.railCentered;
  reports.push(data);console.log(JSON.stringify({...data,samples:undefined}));
 }
 writeFileSync('research/speaking-loader-verification.json',JSON.stringify(reports,null,2));
 if(reports.some(r=>!r.pass))process.exitCode=1;
}finally{await browser.close();}
