import {createRequire} from 'node:module';
import {writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.BRAND_LAB_PLAYWRIGHT_PATH || 'playwright');
const browser=await chromium.launch({headless:true,...(process.env.BRAND_LAB_BROWSER?{executablePath:process.env.BRAND_LAB_BROWSER}:{})});
const results=[],errors=[];
try {
for (const mobile of [false,true]) {
 const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1745,height:828},deviceScaleFactor:mobile?2:1});
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.BRAND_LAB_URL || 'http://127.0.0.1:3004/brand-lab');
 for (const media of ['image',...(process.env.BRAND_LAB_VIDEO_FIXTURE?['video']:[])]) {
  if(media==='video') {
   await page.getByRole('button',{name:'Use your brand ↗'}).click();
   await page.getByLabel('Upload campaign media').setInputFiles(process.env.BRAND_LAB_VIDEO_FIXTURE);
   await page.waitForFunction(()=>document.querySelector('.bl-upload-error').textContent==='');
   await page.getByRole('button',{name:'Back to canvas ↗'}).click();
  }
  for (const name of ['Viscous Cursor Dye','Exposure Grid','Fluid Distortion']) {
   const start=Date.now();await page.getByRole('button',{name,exact:true}).click();
   await page.locator('.bl-study').scrollIntoViewIfNeeded();
   await page.locator('canvas[data-material="study"][data-ready="true"]').waitFor();
   const firstFrameMs=Date.now()-start;
   await page.waitForTimeout(350);
   const sample=await page.evaluate(()=>new Promise(resolve=>{
    const counts={},timings=[],original=CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage=function(...args){
     if(this.canvas.dataset.material){const t=performance.now();original.apply(this,args);timings.push(performance.now()-t);const key=this.canvas.dataset.material;counts[key]=(counts[key]||0)+1;}else original.apply(this,args);
    };
    const started=performance.now();setTimeout(()=>{
     CanvasRenderingContext2D.prototype.drawImage=original;
     const elapsed=performance.now()-started;
     resolve({elapsedMs:elapsed,viewport:{width:innerWidth,height:innerHeight},copyCalls:counts,copyCpuMs:timings.reduce((a,b)=>a+b,0),canvas:[...document.querySelectorAll('canvas[data-material]')].map(c=>{const r=c.getBoundingClientRect();return {role:c.dataset.material,visible:r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth,ready:c.dataset.ready==='true'};}),sources:document.querySelectorAll('.bl-source canvas').length});
    },2000);
   }));
   assert.equal(sample.sources,1);
   if(process.env.BRAND_LAB_PROFILE_PHASE==='after') for(const c of sample.canvas) if(!c.visible) assert.equal(sample.copyCalls[c.role]||0,0,'offscreen '+c.role+' keeps copying');
   results.push({device:mobile?'mobile emulation DPR2':'desktop DPR1',media,name,firstFrameMs,...sample});console.log(JSON.stringify(results.at(-1)));
  }
 }
 // Scroll into a previously offscreen Surface and verify that it resumes copying.
 await page.locator('.bl-wordmark').scrollIntoViewIfNeeded();
 await page.waitForFunction(()=>document.querySelector('canvas[data-material="wordmark"]').dataset.ready==='true');
 const frame=await page.locator('canvas[data-material="wordmark"]').getAttribute('data-frame');await page.waitForTimeout(250);
 assert.notEqual(await page.locator('canvas[data-material="wordmark"]').getAttribute('data-frame'),frame);
 await page.evaluate(()=>scrollTo(0,document.body.scrollHeight));await page.waitForTimeout(300);
 await page.close();
}
assert.deepEqual(errors,[]);await mkdir('outputs/brand-lab',{recursive:true});await writeFile('outputs/brand-lab/performance-'+(process.env.BRAND_LAB_PROFILE_PHASE || 'before')+'.json',JSON.stringify({results,errors},null,2));
} finally {await browser.close();}
