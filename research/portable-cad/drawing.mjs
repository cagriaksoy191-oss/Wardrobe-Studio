import {aperture,worldPoint} from '../d3/access.mjs';
import {rect} from '../d3/geometry.mjs';
import {footprintPolygons} from '../d3/metrics.mjs';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
export const PAGE={width:1200,height:840};
export const WARNING='DENEYSEL CAD — ÜRETİM ONAYI YOK';
export const PHYSICAL_WARNING='DENEYSEL CAD — FİZİKSEL ÜRETİM ONAYI YOK';
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
export const txt=(x,y,text,size=12,color='#18334b')=>({type:'text',x,y,text:String(text),size,color});
export const poly=(points,fill='#e2e8f0',stroke='#5f7080',width=.6,opacity=1)=>({type:'polygon',points,fill,stroke,width,opacity});
export const line=(a,b,color='#6b7280',width=1)=>({type:'line',a,b,color,width});
export function frame(id,title,pageLabel='') {
  return [poly([[0,0],[1200,0],[1200,840],[0,840]],'#ffffff','none'),txt(36,29,WARNING,13,'#a6202b'),
    txt(36,59,title,20),txt(36,82,id,10.5),line([36,97],[1164,97],'#ced8df'),
    txt(36,793,PHYSICAL_WARNING,12,'#a6202b'),txt(36,816,'Ideal geometri; gerçek donanım, oda ve insan kabulü tamamlanmadı.',10.5),txt(1000,816,pageLabel,10.5)];
}
function fit(points,slot,pad=15) {
  const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
  const scale=Math.min((slot.w-2*pad)/Math.max(1,x1-x0),(slot.h-2*pad)/Math.max(1,y1-y0));
  return p=>[slot.x+(slot.w-(x1-x0)*scale)/2+(p[0]-x0)*scale,slot.y+(slot.h-(y1-y0)*scale)/2+(p[1]-y0)*scale];
}
function accessPose(api,p,s) {
  const positions={};
  const reach=s.reach.find(r=>r.kind==='hanging')??s.reach.find(r=>r.steps?.length);
  if(!reach)return positions;
  for(const step of reach.steps??[]) {
    const part=p.scene.parts.find(q=>q.id===step.partId);if(!part)continue;
    const target=step.unit==='deg'?step.position*Math.PI/180/Math.abs(part.radiansPerUnit):step.position;
    positions[part.id]=api.constrainMotion(p.scene,positions,part.id,target).position;
  }
  for(const part of p.scene.parts.filter(q=>q.kind==='drawer'))positions[part.id]=api.constrainMotion(p.scene,positions,part.id,1).position;
  return positions;
}
export function sceneVolumes(api,p,s,open=false) {
  const pos=open?accessPose(api,p,s):{};
  return [...p.scene.staticVolumes.map(v=>({...v,fill:v.id?.includes('service')?'#efc9cd':v.id?.includes('Rod')||v.id?.includes('rod')?'#68c6cd':'#d9c9ad'})),
    ...p.scene.parts.flatMap(part=>part.volumes(pos[part.id]??part.home).map((v,i)=>({...v,id:part.id,fill:part.kind==='drawer'?(i===0?'#d8a45c':'#ead7b8'):i===0?'#d0a76d':'#52687a'})))];
}
export function drawIso(api,p,s,slot,open=false) {
  if(open&&p.mechanism==='H1')return [txt(slot.x+20,slot.y+60,'H1 katlanır hareket: NOT_MODELED',16,'#a6202b'),txt(slot.x+20,slot.y+85,'Kapalı gövde boyutları yalnız ön elemedir.',11)];
  const id=p.id+'__'+(open?'open':'closed');
  const bytes=readFileSync(resolve('artifacts/portable-cad/renders',id+'.png'));
  const scale=Math.min(slot.w/2400,slot.h/1520),w=2400*scale,h=1520*scale;
  return [{type:'image',x:slot.x+(slot.w-w)/2,y:slot.y+(slot.h-h)/2,w,h,data:bytes.toString('base64'),mime:'image/png',source:'Three.js depth-buffer verified capture',sceneId:id}];
}
export function drawPlan(api,p,s,slot,{open=false,access=false,reservations=false}={}) {
  const groups=[];
  const fp=p.footprints??footprintPolygons(p.context,p.model);
  groups.push(...fp.map(p=>({p,fill:'#e9eef2',stroke:'#7c8e9d'})));
  if(p.parameters?.serviceW)groups.push({p:fp[0],fill:'#efc9cd',stroke:'#a6202b'});
  if(p.kind==='blind')groups.push({p:rect(18,8,652,592),fill:'#ead7e3',stroke:'#9e497f'});
  if(!access)groups.push(...sceneVolumes(api,p,s,open).map(v=>({p:v.polygon,fill:v.fill,stroke:'#718399'})));
  if(access&&p.mechanism!=='H1') {
    for(const r of s.reach)for(const a of r.accessiblePolygons??[])groups.push({p:a,fill:r.kind==='hanging'?'#79d3dc':'#8fd5b2',stroke:'none',opacity:.2});
    for(const z of s.approachZones??[])groups.push({p:z.polygon,fill:'#dceefc',stroke:'#3c87a8',opacity:.6});
    const r=s.reach.find(r=>r.kind==='hanging'&&r.accessibleRodCenterMm>0),c=r&&p.model.cells.find(c=>c.id===r.id);
    if(r&&c) {
      const a=aperture(p.context,c),u=r.rodIntervals?.length?(r.rodIntervals[0][0]+r.rodIntervals[0][1])/2:a.width/2;
      const rod=p.model.panels.find(p=>p.cellId===c.id&&p.role==='hangingRod'),z=rod?(rod.worldPositionMm[2]-a.origin.zMm)*a.outward.zMm+(rod.worldPositionMm[0]-a.origin.xMm)*a.outward.xMm:-280;
      groups.push({p:rect(u-240,z-275,480,550).map(q=>worldPoint(q,a)),fill:'#b9d9f4',stroke:'#287ab0',opacity:.6});
      groups.push({p:rect(u-240,30,480,550).map(q=>worldPoint(q,a)),fill:'none',stroke:'#287ab0'});
      groups.push({arrow:[worldPoint({xMm:u,zMm:z},a),worldPoint({xMm:u,zMm:305},a)],stroke:'#287ab0'});
    }
  }
  if(reservations)for(const r of p.reservations??[])groups.push({p:rect(r.worldCenterMm[0]-r.boxSizeMm[0]/2,r.worldCenterMm[2]-r.boxSizeMm[2]/2,r.boxSizeMm[0],r.boxSizeMm[2]),fill:'none',stroke:'#7c3aed'});
  const xy=q=>[q.xMm,q.zMm],map=fit(groups.flatMap(g=>(g.p??g.arrow).map(xy)),slot,16);
  const result=groups.flatMap(g=>g.p?[poly(g.p.map(q=>map(xy(q))),g.fill,g.stroke,.6,g.opacity??1)]:[line(map(xy(g.arrow[0])),map(xy(g.arrow[1])),g.stroke,2)]);
  for(const b of p.model.bays) {
    const a=map([b.worldCenterMm[0],b.worldCenterMm[2]]);
    result.push(txt(a[0]-28,a[1],`${b.label.startsWith('A')?'A':b.label.startsWith('B')?'B':b.runId.endsWith('B')?'B':'A'} ${b.outerWidthMm} mm`,9));
  }
  return result;
}
export function drawFront(api,p,s,slot,axis='A') {
  const index=axis==='B'?2:0,items=[];
  if(p.parameters?.serviceW)items.push({p:[[0,0],[axis==='A'?p.parameters.serviceW:p.parameters.serviceD,0],[axis==='A'?p.parameters.serviceW:p.parameters.serviceD,2400],[0,2400]],fill:'#efc9cd'});
  for(const v of sceneVolumes(api,p,s,false)) {
    const src=p.model.panels.find(q=>q.id===v.id),part=p.scene.parts.find(q=>q.id===v.id);
    const run=p.context.runs.find(r=>r.id===(src?.runId??p.model.doors.find(d=>d.id===part?.id)?.runId??p.model.drawers.find(d=>d.id===part?.id)?.runId));
    if(!run||run.wallAxis!==axis)continue;
    const xs=v.polygon.map(q=>index===0?q.xMm:q.zMm),lo=Math.min(...xs),hi=Math.max(...xs);
    const depth=v.polygon.reduce((sum,q)=>sum+(axis==='A'?q.zMm:q.xMm),0)/v.polygon.length;
    items.push({p:[[lo,2400-v.y1],[hi,2400-v.y1],[hi,2400-v.y0],[lo,2400-v.y0]],fill:v.fill,depth});
  }
  const map=fit(items.flatMap(v=>v.p),slot,15);
  // Front faces and handles must occlude the inner drawer box in a closed elevation.
  return items.sort((a,b)=>(a.depth??0)-(b.depth??0)).map(v=>poly(v.p.map(map),v.fill,'#60778a',.5));
}
const fmt=(v,u=1,d=3)=>v===null||v===undefined?'UNKNOWN':(v/u).toFixed(d);
export function notes(s) {
  const m=s.metrics;
  return [
    `Net geometrik iç: ${fmt(m.netStorageMm3,1e9)} m³ | Raf destek: ${fmt(m.shelfMm2,1e6)} m²`,
    `Raf erişim alt sınırı: ${fmt(m.accessibleShelfMm2,1e6)} m² | Fiziksel erişilebilir hacim: UNKNOWN`,
    `Askı borusu ham/kullanılabilir: ${m.rodRawMm}/${m.rodUsableMm} mm | Düz çıkarma merkez aralığı: ${fmt(m.accessibleRodCenterMm)} mm`,
    `Çekmece: ${s.drawerCount} adet | Net iç: ${fmt(m.drawerMm3,1e6,1)} litre | Model hareketi: ${m.strokeMm?.join('/')??'UNKNOWN'} mm`,
    `Kapalı servis iç: ${fmt(m.sealedNetMm3,1e9)} m³ | Ek kapak oda zarfı: ~${fmt(m.doorSweepExtraMm2,1e6)} m²`,
  ];
}
export function variantPages(api,p,s) {
  const title=p.id.startsWith('ORIGINAL')?'Orijinal referans / değişmedi':p.id.includes('UNLIMITED')?'Sınırsız tam boy kapak / elenen karşı örnek':'Deneysel gövde ve hareket geometrisi';
  const a=frame(p.id,title,'Geometri');
  a.push(txt(36,120,'Kapalı 3D / gerçek model katıları',12),...drawIso(api,p,s,{x:36,y:133,w:540,h:292}),
    txt(625,120,'Açık 3D / tek askı bölümü ve çekmeceler',12),...drawIso(api,p,s,{x:625,y:133,w:540,h:292},true),
    txt(36,454,'Kapalı üst plan / modül dağılımı',12),...drawPlan(api,p,s,{x:36,y:465,w:540,h:290}),
    txt(625,454,p.mechanism==='H1'?'H1 hareketi NOT_MODELED':'Açık üst plan / ulaşılan güvenli duruş',12),...drawPlan(api,p,s,{x:625,y:465,w:540,h:290},{open:p.mechanism!=='H1'}));
  const b=frame(p.id,'Cephe, erişim ve kapasite kanıtı','Erişim');
  b.push(txt(36,122,'A cephesi / kapalı yüz',12),...drawFront(api,p,s,{x:36,y:138,w:350,h:300},'A'),
    txt(425,122,'B cephesi / kapalı yüz',12),...drawFront(api,p,s,{x:425,y:138,w:350,h:300},'B'),
    txt(815,122,'Erişim ve araştırma rezervleri',12),...drawPlan(api,p,s,{x:815,y:138,w:350,h:300},{access:true,reservations:true}));
  b.push(txt(36,468,`Durum: ${Object.values(s.classifications).join(' / ')}`,10.5));
  notes(s).forEach((n,i)=>b.push(txt(36,502+i*27,n,12)));
  const cautions=[
    'Yeşil: 310×390×70 mm raf zarfı için güvenli destek yüzeyi alt sınırı. Turkuaz/mavi: 480×550×850 mm askı senaryosu.',
    'Askı kancasını kaldırma, ayırma ve döndürme NOT_MODELED. Boru yüksekliği ve insan erişimi UNVERIFIED_PHYSICAL.',
    p.kind==='blind'?'Mor köşe alanı bağlantılı kör depolamadır; kapalı servis kutusu değildir. Mor çizgiler donanım rezervi, gerçek ürün CAD’i değildir.':p.parameters?.serviceW?'Kırmızı köşe hacmi kapalı servis kutusudur; net depolamaya eklenmez.':'Orijinal köşe bağlantılı depolamadır; deneysel kapalı servis kutusuyla aynı değildir.',
    s.reservations?.length?'MOVENTO kutu yanı15 mm, taban8 mm, SKW=LW-42 iç genişlik, SKL=490 mm. 451 mm karşılaştırma hareketi katalog garantisi değildir.':'H5 hareketi ideal sabit pivot; H1 hareketi modellenmedi. Gerçek montaj/kinematik doğrulanmadı.',
  ];
  if(p.id==='ORIGINAL_asymmetric')cautions.push('Orijinal002 NO_GO işareti nominal0,5mm yerleşim örtüşmesidir; yeni fiziksel P0 kanıtı değildir. Kesim ölçüleri değişmedi.');
  if(p.id.includes('UNLIMITED'))cautions.push('NO_GO: komşular155° sırasında ilk kolon ~10,675 mm’de durdu; çekmece-önce ters sıra başlangıca dönemedi.');
  else if(p.variant)cautions.push('Koşul: tam boy kapaklar92° analitik sınır; üst askı155° ideal pivot. Birlikte tüm kapaklar155° açılamaz.');
  cautions.forEach((n,i)=>b.push(txt(36,664+i*24,n,10.5)));
  return [a,b];
}
export function standaloneViews(api,p,s) {
  const views={};
  for(const [id,title,draw]of [
    ['iso-closed','Kapalı üç boyutlu görünüm',slot=>drawIso(api,p,s,slot)],['iso-open','Açık üç boyutlu görünüm',slot=>drawIso(api,p,s,slot,true)],
    ['plan-closed','Kapalı üst plan / modül dağılımı',slot=>drawPlan(api,p,s,slot)],['plan-open','Açık üst plan',slot=>drawPlan(api,p,s,slot,{open:p.mechanism!=='H1'})],
    ['front-a','A ön cephesi',slot=>drawFront(api,p,s,slot,'A')],['front-b','B ön cephesi',slot=>drawFront(api,p,s,slot,'B')],
    ['access','Raf, askılık ve boşluk rezervleri',slot=>drawPlan(api,p,s,slot,{access:true,reservations:true})],
  ]) {
    const c=frame(p.id,title);
    if(id==='plan-open'&&p.mechanism==='H1')c.push(txt(120,350,'H1 hareketi NOT_MODELED',24,'#a6202b'));
    else c.push(...draw({x:45,y:115,w:1110,h:565}));
    c.push(txt(45,717,notes(s)[0],12),txt(45,742,notes(s)[2],12));views[id]=c;
  }
  return views;
}
export function svg(commands) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="2400" height="1680" viewBox="0 0 1200 840" role="img"><title>${esc(commands.find(c=>c.type==='text'&&c.size===20)?.text??WARNING)}</title><g font-family="Arial, sans-serif">${commands.map(c=>c.type==='text'?`<text x="${c.x}" y="${c.y}" font-size="${c.size}" fill="${c.color}">${esc(c.text)}</text>`:c.type==='line'?`<line x1="${c.a[0]}" y1="${c.a[1]}" x2="${c.b[0]}" y2="${c.b[1]}" stroke="${c.color}" stroke-width="${c.width}"/>`:c.type==='image'?`<image x="${c.x}" y="${c.y}" width="${c.w}" height="${c.h}" href="data:${c.mime};base64,${c.data}"/>`:`<polygon points="${c.points.map(p=>p.map(v=>v.toFixed(3)).join(',')).join(' ')}" fill="${c.fill}" stroke="${c.stroke}" stroke-width="${c.width}" opacity="${c.opacity}"/>`).join('')}</g></svg>`;
}
export function overviewPage(api,cases,name) {
  const out=frame(name,'Bütün varyantlar / karşılaştırmalı genel bakış','Genel bakış');
  const cols=4,rows=Math.ceil(cases.length/cols),h=Math.min(145,640/rows);
  for(const [i,{p,s}]of cases.entries()) {
    const x=36+(i%cols)*285,y=118+Math.floor(i/cols)*h;
    out.push(txt(x,y,p.id.replace('EXPERIMENTAL_','').replace('ORIGINAL_','REF '),9),...drawIso(api,p,s,{x,y:y+9,w:270,h:h-42}));
    out.push(txt(x,y+h-13,`İç ${fmt(s.metrics.netStorageMm3,1e9)}m³ | askı ${s.metrics.rodUsableMm}mm`,9));
  }
  return out;
}
