import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile,copyFile,access} from 'node:fs/promises';
import {resolve,dirname,relative,isAbsolute} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {loadEngine} from '../d3/engine.mjs';
import {buildPrototype} from '../d3/prototype.mjs';
import {summarize} from '../d3/metrics.mjs';
import {buildB3} from '../b3/prototype.mjs';
import {measureB3} from '../b3/measure.mjs';
import {auditOverlaps} from '../b3/overlap-audit.mjs';
import {frame,txt,svg,variantPages,standaloneViews,overviewPage,drawPlan,drawIso,notes,sceneVolumes,WARNING,PHYSICAL_WARNING} from './drawing.mjs';

const common=execFileSync('git',['rev-parse','--git-common-dir'],{encoding:'utf8'}).trim();
const workspace=dirname(resolve(common)),delivery=resolve(process.argv.slice(2).find(a=>!a.startsWith('--'))??resolve(workspace,'output/pdf/cad-delivery-2026-11-15'));
const rel=relative(workspace,delivery);assert.ok(rel&&!rel.startsWith('..')&&!isAbsolute(rel),'Delivery must stay inside the project workspace');
const evidence=resolve('artifacts/portable-cad');await mkdir(evidence,{recursive:true});await mkdir(delivery,{recursive:true});
const api=await loadEngine(),d3=[],b3=[];
function original(kind) {const context=api.phase5Example(kind),model=api.solveDesign(context);return {id:'ORIGINAL_'+kind,kind,context,model,scene:api.planHingeOpenings(context,model)};}
for(const kind of ['diagonal','asymmetric']) {
  const o=original(kind);d3.push({p:o,s:summarize(api,o)});
  for(const fillerMm of [40,70,100])for(const layout of ['shelf','hanging']) {const p=buildPrototype(api,{kind,fillerMm,layout});d3.push({p,s:summarize(api,p)});}
  const p=buildPrototype(api,{kind,mechanism:'H1'});d3.push({p,s:summarize(api,p)});
}
const blind=original('blind');b3.push({p:blind,s:measureB3(api,blind)});
for(const variant of ['SINGLE3','DUAL3','DUAL2']){const p=buildB3(api,{variant});b3.push({p,s:measureB3(api,p)});}
const negative=buildB3(api,{variant:'DUAL3',blindOpeningLimitDeg:155});b3.push({p:negative,s:measureB3(api,negative)});
const audit=auditOverlaps(api);await writeFile(resolve(evidence,'overlap-audit.json'),JSON.stringify(audit,null,2)+'\n');
const renderScenes=[];
for(const {p,s}of [...d3,...b3])for(const open of [false,true]) {
  if(open&&p.mechanism==='H1')continue;
  renderScenes.push({id:p.id+'__'+(open?'open':'closed'),volumes:sceneVolumes(api,p,s,open)});
}
await writeFile(resolve(evidence,'render-scenes.json'),JSON.stringify(renderScenes));
if(process.argv.includes('--prepare-renders')) {console.log(JSON.stringify({preparedScenes:renderScenes.length}));process.exit(0);}

function gallery(cases,base64,group,overview) {
  const safe=JSON.stringify(Object.fromEntries(cases.map(({p,s})=>[p.id,{summary:s,views:base64[p.id]}]))).replaceAll('<','\\u003c');
  const defaultId=group==='D3'?'EXPERIMENTAL_D3_002_70_hanging_H5':'EXPERIMENTAL_B3_003_DUAL3';
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${group} taşınabilir CAD galerisi</title>
<style>body{font:16px system-ui,sans-serif;margin:0;background:#e9eef2;color:#18334b}header,main{max-width:1400px;margin:auto;padding:20px}header{background:#fff}h1{font-size:24px;color:#a6202b;margin:0 0 12px}h2{font-size:19px;overflow-wrap:anywhere}label{display:inline-flex;flex-direction:column;margin:8px 16px 8px 0;gap:6px}select{font:inherit;max-width:90vw;padding:9px;border:1px solid #8395a3;border-radius:5px}img{display:block;width:100%;height:auto;background:#fff;border:1px solid #cad6df}a{color:#07566c}p{line-height:1.5}.links{display:flex;flex-wrap:wrap;gap:18px;margin:16px 0}.status{padding:12px;background:#fff;overflow-wrap:anywhere}summary{cursor:pointer;padding:15px;background:#fff}footer{padding:20px;font-size:14px}</style></head>
<body><header><h1>${PHYSICAL_WARNING}</h1><p>Çevrimdışı deneysel inceleme. Hesap, token, CDN, API, kurulum veya üretim CSV/ZIP çıkışı yok. Görseller HTML'nin içine gömülüdür.</p>
<label>Varyant<select id="variant" aria-label="Varyant">${cases.map(({p})=>`<option value="${p.id}">${p.id}</option>`).join('')}</select></label>
<label>Görünüm<select id="view" aria-label="Görünüm"><option value="iso-closed">Kapalı 3D</option><option value="iso-open">Açık 3D</option><option value="plan-closed">Kapalı üst plan</option><option value="plan-open">Açık üst plan</option><option value="front-a">A cephesi</option><option value="front-b">B cephesi</option><option value="access">Raf / askı erişimi ve rezervler</option></select></label>
<div class="links"><a href="${group==='D3'?'D3_CAD_COMPARISON_ATLAS.pdf':'B3_ENGINEERING_COMPARISON_ATLAS.pdf'}">PDF atlası</a><a id="cad" href="#">Seçili deneysel CAD JSON</a><a href="comparison.json">Bütün ölçümler JSON</a><a href="manifest.json">SHA-256 dosya manifesti</a><a href="README.txt">Açma ve paylaşma açıklaması</a></div></header>
<main><h2 id="selected"></h2><p class="status" id="status"></p><img id="scene" alt="Seçilen deneysel CAD görünümü"><p id="loaded" role="status"></p><details><summary>Bütün varyantları birlikte göster</summary><img alt="Bütün varyantların genel bakışı" src="data:image/svg+xml;base64,${overview}"></details></main>
<footer>${WARNING}. Geometri PASS fiziksel kullanım veya üretim PASS değildir. Askı ayırma/dönme ve gerçek insan erişimi modellenmedi. ${group==='B3'?'451 mm model karşılaştırması MOVENTO katalog stroku garantisi değildir.':''}</footer>
<script>'use strict';const cases=${safe};const initial=${JSON.stringify(defaultId)};const variant=document.getElementById('variant'),view=document.getElementById('view'),scene=document.getElementById('scene');
function show(){const raw=decodeURIComponent(location.hash.slice(1));const id=Object.hasOwn(cases,raw)?raw:initial;variant.value=id;document.getElementById('selected').textContent=id;document.getElementById('status').textContent=Object.values(cases[id].summary.classifications).join(' / ');document.getElementById('cad').href='data/'+id+'.cad.json';document.getElementById('loaded').textContent='Görünüm yükleniyor';scene.src='data:image/svg+xml;base64,'+cases[id].views[view.value];scene.dataset.variant=id;scene.dataset.view=view.value;}
scene.onload=()=>{document.getElementById('loaded').textContent='Yerel vektör görünüm hazır';};variant.onchange=()=>{location.hash=variant.value;};view.onchange=show;window.addEventListener('hashchange',show);show();</script>
<noscript>Görünüm seçimi için tarayıcı JavaScript'i gerekir. PDF atlası ve views klasöründeki SVG'ler JavaScript olmadan açılır.</noscript></body></html>`;
}
async function emitGroup(name,cases) {
  const folder=resolve(delivery,name+'_GALLERY'),base64={},pages=[];await mkdir(resolve(folder,'views'),{recursive:true});await mkdir(resolve(folder,'data'),{recursive:true});await mkdir(resolve(delivery,'previews'),{recursive:true});
  const overview=overviewPage(api,cases,name),overviewSvg=svg(overview);pages.push({id:name+'_OVERVIEW',label:'Genel bakış',commands:overview});
  await writeFile(resolve(folder,'overview.svg'),overviewSvg);await writeFile(resolve(delivery,'previews',name+'_OVERVIEW.svg'),overviewSvg);
  for(const {p,s}of cases) {
    const pp=variantPages(api,p,s);pages.push(...pp.map((commands,i)=>({id:p.id,label:i?'Cephe ve erişim':'Geometri',commands})));
    await writeFile(resolve(delivery,'previews',p.id+'.svg'),svg(pp[0]));
    base64[p.id]={};
    for(const [view,commands]of Object.entries(standaloneViews(api,p,s))) {
      const value=svg(commands);await writeFile(resolve(folder,'views',p.id+'__'+view+'.svg'),value);base64[p.id][view]=Buffer.from(value).toString('base64');
    }
    const data={warning:PHYSICAL_WARNING,productionApproval:'NOT_APPROVED',importApproved:false,id:p.id,summary:s,designIntent:p.context,model:structuredClone(p.model),reservations:p.reservations??[],parameters:p.parameters??null};
    if(p.mechanism==='H1') {
      delete data.model.analysis;data.model.doors=data.model.doors.map(d=>({id:d.id,runId:d.runId,widthMm:d.widthMm,heightMm:d.heightMm,thicknessMm:d.thicknessMm,closedVolumes:api.hingedVolumes(d,0)}));
      data.designIntent=null; // no ideal hinge mechanism is attributed to WingLine L
    }
    await writeFile(resolve(folder,'data',p.id+'.cad.json'),JSON.stringify(data,null,2)+'\n');
  }
  if(name==='D3') {
    const {p,s}=cases.find(c=>c.p.id==='EXPERIMENTAL_D3_002_70_hanging_H5'),c=frame(p.id,'Seçili 25/4 - iki askılı düzenin açıklaması','Özel inceleme');
    c.push(...drawIso(api,p,s,{x:35,y:120,w:550,h:370},true),...drawPlan(api,p,s,{x:630,y:120,w:530,h:370},{access:true}),
      txt(36,525,'A: 810+810+810 mm | B: 636+636+638 mm | 6 bağımsız kutu | servis: 550×670 mm',13),
      txt(36,556,'İki boru: 760+760=1520 mm ham; uç paylarından sonra1440 mm kullanılabilir. Yükseklik1700 mm varsayım.',12),
      txt(36,586,`Düz askı zarfı merkez aralığı toplamı ${s.metrics.accessibleRodCenterMm.toFixed(3)} mm; gerçek insan erişimi UNKNOWN.`,12));
    notes(s).slice(0,2).forEach((n,i)=>c.push(txt(36,621+i*27,n,12)));
    c.push(txt(36,690,'Üç D3 çekmecesi489 mm model hareketi:25 mm yanlı eski kutu. MOVENTO donanım kabulü değildir.',12),
      txt(36,719,'Bu çizim H1 katlanır mekanizma değildir. Kapak yörüngesi ideal H5; tüm kanatların birlikte155° açılması sağlanmaz.',11),
      txt(36,748,'Raf alanı yerine askı arttırılmıştır. Kapasite kaybına kullanıcı onayı verilmedi; kalıcı tasarım seçilmedi.',11));
    pages.splice(1,0,{id:p.id+'_ANNOTATED',label:'Seçili varyant açıklaması',commands:c});
  }
  await writeFile(resolve(folder,'index.html'),gallery(cases,base64,name,Buffer.from(overviewSvg).toString('base64')));
  await writeFile(resolve(folder,'comparison.json'),JSON.stringify({schema:'CAD-COMPARISON-1',warning:PHYSICAL_WARNING,group:name,summaries:cases.map(c=>c.s)},null,2)+'\n');
  const readme=[`${name} TAŞINABİLİR DENEYSEL CAD GALERİSİ`,PHYSICAL_WARNING,'',
    '1. ZIP dosyasına sağ tıklayın ve Tümünü Ayıkla seçeneğiyle ayrı bir klasöre çıkarın.',
    '2. Çıkarılan klasörde index.html dosyasına çift tıklayın. İnternet ve yerel sunucu gerekmez.',
    '3. Varyant ve Görünüm alanlarından seçin. #EXPERIMENTAL... hash bağlantıları aynı modeli seçer.',
    '4. HTML tüm görüntüleri gömülü içerir. Tek başına başka klasöre taşınsa da görsel seçim çalışır.',
    '5. PDF, ham SVG/JSON ve manifest bağlantıları için ZIP içindeki kardeş dosyaları birlikte koruyun.',
    '6. ChatGPT/Codex ile paylaşmak için ZIP dosyasını veya PDF atlasını dosya olarak ekleyin. file:/// metnini paylaşmak gerekmez.',
    '7. Bu ZIP araştırma galerisidir; imalat CSV/ZIP paketi değildir. JSON uygulamaya import edilmemelidir.',
    '8. manifest.json her dosyanın SHA-256 ve boyutunu içerir; kendisini hashlemez. Paket SHA bilgisi teslim klasöründeki DELIVERY_SHA256.json içindedir.',
    name==='B3'?'9. 92° sınırlı tam boy kapaklar analitik modeldir. Gerçek71B7550/70T7553.09 ve MOVENTO760H5000S montajı UNVERIFIED.':'9. H5 ideal sabit pivot; H1 hareketi NOT_MODELED. Hiçbir aday fiziksel üretime onaylı değildir.',
    '', 'Lisans: yazılımın mevcut özel depo koşulları geçerlidir; üretici CAD veya üçüncü taraf tam katalog kopyası içermez.'].join('\r\n');
  await writeFile(resolve(folder,'README.txt'),readme);
  await writeFile(resolve(evidence,name.toLowerCase()+'-pages.json'),JSON.stringify({page: {width:1200,height:840},group:name,pages},null,2));
  return {name,folder,pageFile:resolve(evidence,name.toLowerCase()+'-pages.json'),pages:pages.length,variants:cases.length};
}
const groups=[];groups.push(await emitGroup('D3',d3));groups.push(await emitGroup('B3',b3));
// Preserve the entire verified prior D3 evidence, not only a new visual wrapper.
let prior=resolve(workspace,'artifacts/d3-corner-cad/worktree/artifacts/d3-cad/output');
try {await access(resolve(prior,'SHA256.json'));}catch {
  // A fresh clone has the tracked D3 generator, but not the original machine's artifacts.
  execFileSync(process.execPath,['research/d3/generate.mjs'],{stdio:'pipe'});
  prior=resolve('artifacts/d3-cad/output');
}
const priorManifest=JSON.parse(await readFile(resolve(prior,'SHA256.json'),'utf8'));
const priorDest=resolve(delivery,'D3_GALLERY/source-d3-original');await mkdir(priorDest,{recursive:true});
for(const [name,expected]of Object.entries(priorManifest)) {
  const bytes=await readFile(resolve(prior,name));assert.equal(createHash('sha256').update(bytes).digest('hex'),expected,'Prior D3 evidence changed: '+name);
  await writeFile(resolve(priorDest,name),bytes);
}
await copyFile(resolve(prior,'SHA256.json'),resolve(priorDest,'SHA256.json'));
const priorHtml=await readFile(resolve(prior,'index.html'),'utf8');
await writeFile(resolve(evidence,'existing-gallery-inspection.json'),JSON.stringify({sourceCommit:'3cc309c616ec95b382487e535ddc53d9cdcecca4',filesVerified:Object.keys(priorManifest).length,
  scriptTags:(priorHtml.match(/<script\b/gi)??[]).length,externalLoads:(priorHtml.match(/(?:src|href)=["']https?:\/\/[^"']+/gi)??[]),
  relativeSvgImages:(priorHtml.match(/src="[^"]+\.svg"/g)??[]).length,hashRouting:'native fragment links to all visible articles; no selected-model/view state',jsonLoading:'relative download links; no fetch API',
  portabilityGap:'HTML alone omitted its SVG and CAD JSON siblings; local path was not a deliverable package',newIndex:'all views embedded; relative JSON/PDF siblings are packaged'},null,2));
await writeFile(resolve(delivery,'ORIGINAL_25_4_OVERLAP_AUDIT.json'),JSON.stringify(audit,null,2)+'\n');
await writeFile(resolve(evidence,'delivery-plan.json'),JSON.stringify({workspace,delivery,groups,font:resolve('public/fonts/NotoSans-Regular.ttf')},null,2));
console.log(JSON.stringify({delivery,groups:groups.map(g=>({name:g.name,pages:g.pages,variants:g.variants}))}));
