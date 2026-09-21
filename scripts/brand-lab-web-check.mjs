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
const selectScene=async(p,name)=>p.getByRole('group',{name:'Scene',exact:true}).getByRole('button').filter({hasText:name}).click();
const ready=async()=>{await page.locator('.bl-web-hero').scrollIntoViewIfNeeded();await page.locator('canvas[data-material="web-hero"][data-ready="true"]').waitFor();};
try {
 await page.goto(base);await selectScene(page,'Web');await ready();const width=(await page.locator('.bl-web-browser').boundingBox()).width;
 if(process.env.BRAND_LAB_SKIP_SHADER_SWEEP !== "1") for(const shader of registry.items){
  await page.getByRole('button',{name:shader.title,exact:true}).click();await ready();await page.waitForTimeout(shader.name==='particle-assembly'?3500:350);
  const colors=await page.locator('canvas[data-material="web-hero"]').evaluate(c=>{const a=c.getContext('2d').getImageData(0,0,c.width,c.height).data,s=new Set();for(let i=0;i<a.length;i+=160)s.add(a[i]+','+a[i+1]+','+a[i+2]);return s.size;});
  assert.ok(colors>8,shader.name+' blank hero');assert.equal(await page.locator('.bl-source canvas').count(),1);assert.equal((await page.locator('.bl-web-browser').boundingBox()).width,width);
  results.push({id:shader.name,colors});console.log('PASS Web '+shader.name);
 }
 await page.getByRole('button',{name:'Viscous Cursor Dye',exact:true}).click();await ready();
 await page.getByRole('button',{name:'Select Website promo',exact:true}).press('Enter');await page.getByRole('region',{name:'Website promo controls',exact:true}).waitFor();
 await page.getByRole('button',{name:'Placement: Media',exact:true}).click();await page.getByRole('option',{name:/Background/}).click();await page.getByRole('button',{name:'Close surface controls'}).click();
 await selectScene(page,'Campaign');await page.locator('.bl-study').scrollIntoViewIfNeeded();await page.locator('canvas[data-material="study"][data-ready="true"]').waitFor();
 await selectScene(page,'Identity');await page.locator('.bl-id-signature').scrollIntoViewIfNeeded();await page.locator('canvas[data-material="identity-mark"][data-ready="true"]').waitFor();
 await selectScene(page,'Web');await ready();assert.equal(await page.locator('.bl-web-hero').getAttribute('data-placement'),'Background');
 await page.getByRole('button',{name:'Select Website promo',exact:true}).click();await page.getByRole('button',{name:'Placement: Background',exact:true}).click();await page.getByRole('option',{name:/Media/}).click();await page.getByRole('button',{name:'Close surface controls'}).click();
 await page.getByRole('button',{name:'Tune shader',exact:true}).click();await page.getByRole('slider',{name:'Distortion',exact:true}).press('ArrowRight');await page.getByRole('button',{name:'Close shader controls'}).click();
 await page.getByRole('button',{name:'Copy setup link',exact:true}).click();const shared=await page.evaluate(()=>navigator.clipboard.readText());assert.equal(JSON.parse(new URL(shared).searchParams.get('brandLab')).scene,'web');
 await page.goto(shared);await ready();await page.mouse.move(0,0);await page.screenshot({path:'outputs/brand-lab/web-desktop.png',fullPage:true});
 await page.locator('.bl-footer a').click();await page.locator('.stage canvas').waitFor();await page.getByRole('link',{name:'Use tuning in Web ↗'}).click();await ready();
 await page.getByRole('button',{name:'Original / No shader',exact:true}).click();assert.equal(await page.locator('.bl-source canvas').count(),0);
 await page.getByRole('button',{name:'Exposure Grid',exact:true}).click();await ready();
 if(process.env.BRAND_LAB_VIDEO_FIXTURE){await page.getByRole('button',{name:'Use your brand ↗'}).click();await page.getByLabel('Upload campaign media').setInputFiles(process.env.BRAND_LAB_VIDEO_FIXTURE);await page.waitForFunction(()=>document.querySelector('.bl-upload-error').textContent==='');await page.getByRole('button',{name:'Back to canvas ↗'}).click();await ready();assert.equal(await page.locator('.bl-web-hero-visual video').count(),1);}
 for(const size of [390,320,768]) {const mobile=await context.newPage();await mobile.setViewportSize({width:size,height:844});await mobile.goto(shared);await mobile.locator('.bl-web-hero').scrollIntoViewIfNeeded();await mobile.locator('canvas[data-material="web-hero"][data-ready="true"]').waitFor();assert.ok(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'viewport overflow '+size);await mobile.mouse.move(0,0);await mobile.screenshot({path:'outputs/brand-lab/web-'+size+'.png',fullPage:true});await mobile.close();}
 const reduced=await browser.newPage({reducedMotion:'reduce'});await reduced.goto(shared);await reduced.locator('.bl-web-hero').scrollIntoViewIfNeeded();await reduced.locator('canvas[data-material="web-hero"][data-ready="true"]').waitFor();await reduced.waitForTimeout(1800);assert.equal(await reduced.locator('.bl-source canvas').count(),0);await reduced.close();
 assert.deepEqual(errors,[]);await writeFile('outputs/brand-lab/web-report.json',JSON.stringify({results,setup:true,transfer:true,tuning:true,sceneSwitching:true,mobile:true,original:true,video:!!process.env.BRAND_LAB_VIDEO_FIXTURE,reducedMotion:true,errors},null,2));console.log('PASS Web surface state, setup, transfer, tuning, responsive bounds, Original, reduced motion');
}catch(error){await page.screenshot({path:'outputs/brand-lab/web-failure.png',fullPage:true});throw error;}finally{await browser.close();}
