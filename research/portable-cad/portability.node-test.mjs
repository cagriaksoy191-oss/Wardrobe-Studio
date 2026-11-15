import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {unzipSync} from 'fflate';
const plan=JSON.parse(await readFile('artifacts/portable-cad/delivery-plan.json','utf8'));
for(const group of plan.groups) {
  test(`${group.name}: zip is self-contained and every extracted file hash matches`,async()=>{
    const bytes=await readFile(resolve(plan.delivery,group.name+'_CAD_GALLERY_PORTABLE.zip')),files=unzipSync(bytes),manifest=JSON.parse(new TextDecoder().decode(files['manifest.json']));
    assert.equal(manifest.variants,group.variants);assert.equal(manifest.pdfPages,group.pages);
    assert.ok(files['index.html']&&files['README.txt']);assert.ok(Object.keys(files).some(k=>k.endsWith('.pdf')));
    const html=new TextDecoder().decode(files['index.html']);
    for(const m of html.matchAll(/href="([^"]+)"/g))if(!m[1].startsWith('#'))assert.ok(files[m[1]],'Broken archive link: '+m[1]);
    const cases=JSON.parse(html.match(/const cases=(.*?);const initial=/s)[1]);
    for(const id of Object.keys(cases))assert.equal(JSON.parse(new TextDecoder().decode(files['data/'+id+'.cad.json'])).id,id);
    for(const [name,value]of Object.entries(manifest.files)) {assert.equal(createHash('sha256').update(files[name]).digest('hex'),value.sha256);assert.equal(files[name].length,value.bytes);}
  });
  test(`${group.name}: no network/CORS loader, every case has all seven embedded views`,async()=>{
    const html=await readFile(resolve(group.folder,'index.html'),'utf8');
    assert.ok(!/\b(fetch\s*\(|XMLHttpRequest|WebSocket)/i.test(html));assert.ok(!/<script[^>]+src=/i.test(html));
    assert.ok(!/(?:src|href)=["']https?:\/\//i.test(html));
    const data=JSON.parse(html.match(/const cases=(.*?);const initial=/s)[1]);
    assert.equal(Object.keys(data).length,group.variants);
    for(const [id,c]of Object.entries(data)) {
      assert.equal(Object.keys(c.views).length,7);
      for(const [view,value]of Object.entries(c.views)) {
        const decoded=Buffer.from(value,'base64').toString();assert.ok(decoded.includes('FİZİKSEL ÜRETİM ONAYI YOK'));assert.ok(decoded.includes(id));
        if(id.endsWith('H1')&&view==='iso-open')assert.ok(decoded.includes('NOT_MODELED'));
      }
    }
  });
}
