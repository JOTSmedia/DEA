import {Browser} from '/Users/bethrooney/.codex/skills/design-taste-frontend/scripts/lib/cdp.mjs';
const browser=await Browser.launch();
try{
 const page=await browser.newPage({width:1200,height:630});
 await page.goto('file:///Users/bethrooney/Desktop/DEA/research/share-card.html',{settleMs:400});
 await page.eval(async()=>{await Promise.all([...document.images].map(i=>i.decode()));});
 const image=await page.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
 const {writeFileSync}=await import('node:fs');writeFileSync('assets/share-dea-purple-wide-v1.png',Buffer.from(image.data,'base64'));
 console.log('Rendered 1200 × 630 share card from original assets.');
}finally{await browser.close();}
