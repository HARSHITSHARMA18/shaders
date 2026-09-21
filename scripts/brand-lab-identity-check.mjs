import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.BRAND_LAB_PLAYWRIGHT_PATH || 'playwright');
const registry=JSON.parse(await readFile('registry.json','utf8'));
const base=process.env.BRAND_LAB_URL || 'http://127.0.0.1:3004/brand-lab';
const browser=await chromium.launch({headless:true,...(process.env.BRAND_LAB_BROWSER?{executablePath:process.env.BRAND_LAB_BROWSER}:{})});
const context=await browser.newContext({viewport:{width:1745,height:828},permissions:['clipboard-read','clipboard-write']});
const page=await context.newPage(),errors=[],results=[];
page.on('pageerror',e=>errors.push(e.message));
const ready=async()=>{await page.locator('.bl-id-signature').scrollIntoViewIfNeeded();await page.locator('canvas[data-material="identity-mark"][data-ready="true"]').waitFor();};
try {
 await page.goto(base);await page.getByRole('button',{name:'Identity02',exact:true}).click();await ready();
 const before=await page.locator('.bl-id-signature').boundingBox();
 for(const shader of registry.items){
  await page.getByRole('button',{name:shader.title,exact:true}).click();await ready();await page.waitForTimeout(shader.name==='particle-assembly'?3500:350);
  const colors=await page.locator('canvas[data-material="identity-mark"]').evaluate(c=>{const a=c.getContext('2d').getImageData(0,0,c.width,c.height).data,s=new Set();for(let i=0;i<a.length;i+=160)s.add(a[i]+','+a[i+1]+','+a[i+2]);return s.size;});
  assert.ok(colors>8,shader.name+' blank material');assert.equal(await page.locator('.bl-source canvas').count(),1);
  assert.equal((await page.locator('.bl-id-signature').boundingBox()).width,before.width);
  if(shader.name==='particle-assembly') { await page.getByRole('button',{name:'Select Signature mark',exact:true}).click();await page.getByRole('button',{name:'Placement: Background',exact:true}).click();assert.equal(await page.getByRole('option').count(),1);await page.getByRole('option').press('Escape');await page.getByRole('button',{name:'Close surface controls'}).click(); }
  results.push({id:shader.name,colors});console.log('PASS Identity '+shader.name);
 }
 await page.getByRole('button',{name:'Viscous Cursor Dye',exact:true}).click();await ready();
 await page.getByRole('button',{name:'Select Signature mark',exact:true}).press('Enter');
 await page.getByRole('region',{name:'Signature mark controls',exact:true}).waitFor();
 await page.getByRole('button',{name:'Placement: Mask',exact:true}).click();await page.getByRole('option',{name:/Background/}).click();
 await page.getByRole('button',{name:'Close surface controls'}).click();
 await page.getByRole('button',{name:'Campaign01',exact:true}).click();
 await page.locator('.bl-study').scrollIntoViewIfNeeded();await page.locator('canvas[data-material="study"][data-ready="true"]').waitFor();
 await page.getByRole('button',{name:'Identity02',exact:true}).click();await ready();
 assert.equal(await page.locator('.bl-id-signature').getAttribute('data-placement'),'Background');
 await page.getByRole('button',{name:'Select Signature mark',exact:true}).click();await page.getByRole('button',{name:'Placement: Background',exact:true}).click();await page.getByRole('option',{name:/Mask/}).click();await page.getByRole('button',{name:'Close surface controls'}).click();
 await page.getByRole('button',{name:'Tune shader',exact:true}).click();await page.getByRole('slider',{name:'Distortion',exact:true}).press('ArrowRight');await page.getByRole('button',{name:'Close shader controls'}).click();
 await page.getByRole('button',{name:'Copy setup link',exact:true}).click();const shared=await page.evaluate(()=>navigator.clipboard.readText());
 assert.equal(JSON.parse(new URL(shared).searchParams.get('brandLab')).scene,'identity');
 await page.goto(shared);await ready();
 await page.screenshot({path:'outputs/brand-lab/identity-desktop.png',fullPage:true});
 await page.locator('.bl-footer a').click();await page.locator('.stage canvas').waitFor();
 await page.getByRole('link',{name:'Use tuning in Identity ↗'}).click();await ready();
 await page.getByRole('button',{name:'Use your brand ↗'}).click();await page.getByLabel('Brand name',{exact:true}).fill('SOL');
 await page.getByLabel('Upload logo',{exact:true}).setInputFiles({name:'mark.svg',mimeType:'image/svg+xml',buffer:Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><circle cx="100" cy="100" r="80" fill="black"/></svg>')});
 await page.waitForFunction(()=>document.querySelector('.bl-upload-error').textContent==='');await page.getByRole('button',{name:'Back to canvas ↗'}).click();await ready();
 assert.equal(await page.locator('.bl-id-type img').getAttribute('alt'),'SOL');
 const mobile=await context.newPage();await mobile.setViewportSize({width:390,height:844});await mobile.goto(shared);
 await mobile.locator('.bl-id-signature').scrollIntoViewIfNeeded();await mobile.locator('canvas[data-material="identity-mark"][data-ready="true"]').waitFor();
 assert.ok(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await mobile.screenshot({path:'outputs/brand-lab/identity-mobile.png',fullPage:true});await mobile.close();
 const reduced=await browser.newPage({reducedMotion:'reduce'});await reduced.goto(shared);await reduced.locator('.bl-id-signature').scrollIntoViewIfNeeded();await reduced.locator('canvas[data-material="identity-mark"][data-ready="true"]').waitFor();await reduced.waitForTimeout(1800);assert.equal(await reduced.locator('.bl-source canvas').count(),0);await reduced.getByRole('button',{name:'Campaign01',exact:true}).click();await reduced.locator('.bl-study').scrollIntoViewIfNeeded();await reduced.locator('canvas[data-material="study"][data-ready="true"]').waitFor();await reduced.close();
 assert.deepEqual(errors,[]);await writeFile('outputs/brand-lab/identity-report.json',JSON.stringify({results,setup:true,transfer:true,logo:true,mobile:true,reducedMotion:true,errors},null,2));console.log('PASS Identity treatments, setup, native transfer, brand/logo, responsive bounds, reduced motion');
}finally{await browser.close();}
