import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,readdir,copyFile,stat} from 'node:fs/promises';
import {resolve,relative,sep} from 'node:path';
import {createHash} from 'node:crypto';
import {zipSync,unzipSync,strToU8} from 'fflate';
const plan=JSON.parse(await readFile('artifacts/portable-cad/delivery-plan.json','utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
async function walk(root,prefix='') {
  const result=[];
  for(const f of (await readdir(resolve(root,prefix),{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))) {
    const rel=prefix?prefix+'/'+f.name:f.name;
    if(f.isDirectory())result.push(...await walk(root,rel));else result.push(rel);
  }
  return result;
}
const deliveries=[],all=[];
for(const group of plan.groups) {
  const pdfName=group.name==='D3'?'D3_CAD_COMPARISON_ATLAS.pdf':'B3_ENGINEERING_COMPARISON_ATLAS.pdf';
  await copyFile(resolve(plan.delivery,pdfName),resolve(group.folder,pdfName));
  await copyFile(resolve(plan.delivery,'previews',group.name+'_OVERVIEW.svg'),resolve(group.folder,'OVERVIEW.svg'));
  const entries={};
  for(const name of (await walk(group.folder)).filter(n=>n!=='manifest.json')) {
    const bytes=await readFile(resolve(group.folder,name));entries[name]={sha256:sha(bytes),bytes:bytes.length};
  }
  const manifest={schema:'PORTABLE-CAD-1',group:group.name,taskDate:'2026-11-15',productionApproval:'NOT_APPROVED',
    offline:true,activeNetworkDependencies:[],embeddedHtmlViews:true,variants:group.variants,pdfPages:group.pages,files:entries};
  await writeFile(resolve(group.folder,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  const zipEntries={};
  for(const name of await walk(group.folder))zipEntries[name]=[new Uint8Array(await readFile(resolve(group.folder,name))),{mtime:new Date('2000-01-01T00:00:00Z')}];
  const bytes=zipSync(zipEntries,{level:6}),zipName=group.name+'_CAD_GALLERY_PORTABLE.zip',zipPath=resolve(plan.delivery,zipName);
  await writeFile(zipPath,bytes);
  // Independent extraction: different root outside the source worktree and archive staging.
  const extracted=resolve(plan.delivery,'verification-independent',group.name),rel=relative(plan.delivery,extracted);
  assert.ok(rel&&!rel.startsWith('..'));await mkdir(extracted,{recursive:true});
  const files=unzipSync(bytes);
  for(const [name,data]of Object.entries(files)) {
    assert.ok(!name.startsWith('/')&&!name.includes('..')&&!name.includes('\\'),'Unsafe ZIP path');
    const dest=resolve(extracted,name);assert.ok(dest.startsWith(extracted+sep));
    await mkdir(resolve(dest,'..'),{recursive:true});await writeFile(dest,data);
  }
  const check=JSON.parse(await readFile(resolve(extracted,'manifest.json'),'utf8'));
  for(const [name,expected]of Object.entries(check.files)) {
    const actual=await readFile(resolve(extracted,name));assert.equal(sha(actual),expected.sha256);assert.equal(actual.length,expected.bytes);
  }
  const html=await readFile(resolve(extracted,'index.html'),'utf8');
  assert.ok(!/<(?:img|script|link)[^>]+(?:src|href)=["']https?:\/\//i.test(html));
  assert.ok(!/\b(fetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon\s*\()/i.test(html));
  assert.ok(!html.includes('C:\\dev\\')&&!html.includes('C:/dev/'));
  const independentlyMoved=resolve(plan.delivery,'verification-html-only',group.name);await mkdir(independentlyMoved,{recursive:true});
  await copyFile(resolve(extracted,'index.html'),resolve(independentlyMoved,'index.html'));
  deliveries.push({group:group.name,zip:zipPath,zipBytes:bytes.length,zipSha256:sha(bytes),filesVerified:Object.keys(check.files).length,extracted,htmlOnly:resolve(independentlyMoved,'index.html'),pdf:resolve(plan.delivery,pdfName),pdfPages:group.pages,variants:group.variants});
}
for(const name of await walk(plan.delivery)) {
  if(name.startsWith('verification-')||name.includes('_GALLERY/')||name==='DELIVERY_SHA256.json')continue;
  const bytes=await readFile(resolve(plan.delivery,name));all.push({name,bytes:bytes.length,sha256:sha(bytes)});
}
await writeFile(resolve(plan.delivery,'DELIVERY_SHA256.json'),JSON.stringify({taskDate:'2026-11-15',files:all},null,2)+'\n');
await writeFile('artifacts/portable-cad/portability-verification.json',JSON.stringify({deliveries,offlineDependencyAudit:'PASS',sourceWorktreeNeeded:false},null,2)+'\n');
console.log(JSON.stringify(deliveries));
