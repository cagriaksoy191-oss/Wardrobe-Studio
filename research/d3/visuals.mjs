import {DISCLAIMER} from './prototype.mjs';
import {cellPolygon,aperture,worldPoint} from './access.mjs';
import {footprintPolygons} from './metrics.mjs';
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const points=p=>p.map(v=>`${v.xMm.toFixed(2)},${v.zMm.toFixed(2)}`).join(' ');
const polygon=(p,fill,stroke='#334155',extra='')=>`<polygon points="${points(p)}" fill="${fill}" stroke="${stroke}" stroke-width="5" ${extra}/>`;
const text=(x,y,s,size=17,color='#172554')=>`<text x="${x}" y="${y}" font-size="${size}" fill="${color}">${esc(s)}</text>`;
export function makeSheet(api,p,s) {
  const {model,scene}=p,fp=p.footprints??footprintPolygons(p.context,model),h1=p.mechanism==='H1';
  const plan=(open)=>{
    const pos=open?s.sequence?.openPositions??{}:{};
    return fp.map(f=>polygon(f,'#e2e8f0')).join('')+
      (p.parameters?polygon(fp[0],'#fecaca','#b91c1c'):'')+
      model.cells.filter(c=>c.isLeaf).map(c=>polygon(cellPolygon(c),'none','#94a3b8')).join('')+
      scene.parts.flatMap(part=>part.volumes(pos[part.id]??part.home)).map(v=>polygon(v.polygon,'#fcd34d','#92400e')).join('')+
      (p.placements??[]).map((r,i)=>text(i?100:r.startMm+30,i?r.startMm+90:280,`${r.axis}: ${r.moduleWidthsMm.join(' + ')} mm`,60)).join('');
  };
  const selected=s.reach.filter(r=>r.kind==='hanging'||r.id.endsWith('sub-0')).slice(0,8);
  const access=fp.map(f=>polygon(f,'#f1f5f9')).join('')+selected.map(r=>{
    const c=model.cells.find(c=>c.id===r.id),a=aperture(p.context,c),u=a.width/2;
    const from=worldPoint({xMm:u,zMm:-150},a),to=worldPoint({xMm:u,zMm:r.specimenMm[1]},a);
    return r.accessiblePolygons.map(poly=>polygon(poly,r.kind==='hanging'?'#a5f3fc':'#bbf7d0','#059669','fill-opacity=".22"')).join('')+
      (h1?'':`<path d="M ${from.xMm} ${from.zMm} L ${to.xMm} ${to.zMm}" stroke="${r.kind==='hanging'?'#0891b2':'#059669'}" stroke-width="16" marker-end="url(#arrow)"/>`);
  }).join('');
  const sweeps=h1?'':api.resolveMotions(model).filter(m=>m.kind==='hinged').flatMap(m=>m.sweepPolygonsMm).map(f=>polygon(f,'#fde68a','#f59e0b','fill-opacity=".025" stroke-opacity=".05"')).join('');
  const elevation=axis=>{
    const a=axis==='B'?2:0,parts=model.panels.filter(v=>p.context.runs.find(r=>r.id===v.runId)?.wallAxis===axis);
    let out=parts.map(v=>`<rect x="${v.worldPositionMm[a]-v.boxSizeMm[a]/2}" y="${2400-v.worldPositionMm[1]-v.boxSizeMm[1]/2}" width="${v.boxSizeMm[a]}" height="${v.boxSizeMm[1]}" fill="${v.role==='hangingRod'?'#06b6d4':'#cbd5e1'}" stroke="#64748b" stroke-width="3"/>`).join('');
    out+=model.drawers.filter(v=>v.wallAxis===axis).map(v=>`<rect x="${v.frontWorldPositionMm[a]-v.frontBoxSizeMm[a]/2}" y="${2400-v.frontWorldPositionMm[1]-v.frontBoxSizeMm[1]/2}" width="${v.frontBoxSizeMm[a]}" height="${v.frontBoxSizeMm[1]}" fill="#fdba74" stroke="#9a3412" stroke-width="4"/>`).join('');
    out+=model.doors.filter(v=>p.context.runs.find(r=>r.id===v.runId)?.wallAxis===axis).map(v=>{
      const poly=api.hingedVolumes(v,0)[0].polygon,lo=Math.min(...poly.map(q=>a===0?q.xMm:q.zMm));
      return `<rect x="${lo}" y="${2400-v.yEndMm}" width="${v.widthMm}" height="${v.heightMm}" fill="#fef3c7" fill-opacity=".18" stroke="#d97706" stroke-dasharray="15 10" stroke-width="6"/>`;
    }).join('');
    return out;
  };
  const metric=s.metrics,fn=(v,u)=>v===null?'UNKNOWN':(v/u).toFixed(3);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="1460" style="max-width:100%;height:auto" viewBox="0 0 1500 1460"><defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#059669"/></marker></defs><rect width="1500" height="1460" fill="#fff"/><g font-family="Arial,sans-serif">
${text(35,35,DISCLAIMER,22,'#b91c1c')}${text(35,65,p.id,18)}
${text(35,92,`${s.simulation} · HARDWARE_KINEMATICS_UNVERIFIED`,15)}
${text(35,122,'Kapalı plan · tüm dış cepheler; kırmızı: kapalı servis kutusu',16)}
<g transform="translate(40 140) scale(.19)">${plan(false)}</g>
${text(760,122,h1?'H1 açık hareket: NOT_MODELED':'Açık plan · toplu deneme; sarı: erişilen gerçek duruş',16)}
<g transform="translate(765 140) scale(.16)">${h1?fp.map(f=>polygon(f,'#e2e8f0')).join(''):plan(true)}</g>
${text(35,695,'A kolu cephe / iç düzen · kesikli: kapalı kapak izdüşümü',16)}
<g transform="translate(40 715) scale(.19)">${elevation('A')}</g>
${text(760,695,'B kolu cephe / iç düzen · turkuaz: askı borusu',16)}
<g transform="translate(765 715) scale(.19)">${elevation('B')}</g>
${text(35,1210,'Hareket / erişim planı · yeşil: örnek raf erişimi; turkuaz: askı zarfı',15)}
<g transform="translate(40 1230) scale(.065)">${sweeps}${access}</g>
${text(300,1250,`Raf: ${fn(metric.shelfMm2,1e6)} m² / erişilebilir alt sınır: ${fn(metric.accessibleShelfMm2,1e6)} m²`,16)}
${text(300,1280,`Askı kullanılabilir: ${metric.rodUsableMm} mm / düz çıkarma merkez aralığı: ${fn(metric.accessibleRodCenterMm,1)} mm`,16)}
${text(300,1310,`Net iç hacim: ${fn(metric.netStorageMm3,1e9)} m³ · geometrik erişim fiziksel kullanıcı onayı değildir.`,16)}
${text(300,1340,'Sarı zarf: bağımsız hedef açıların 1° poligonlaştırılmış oda zarfı; eşzamanlı açılma garantisi yok.',14)}
${text(300,1370,'Gerçek menteşe ekseni, bağlantı, yüklü sehim ve oda engelleri: UNVERIFIED.',14)}
${text(35,1430,DISCLAIMER,20,'#b91c1c')}
</g></svg>`;
}
export function indexHtml(summaries) {
 return `<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>D3 Deneysel CAD</title><style>body{font:16px system-ui;background:#eef2f6;color:#172554;margin:24px}h1{color:#b91c1c}nav{display:flex;flex-wrap:wrap;gap:8px}a{color:#134e4a}article{background:white;padding:16px;margin:24px 0;border-radius:12px}img{width:100%;max-width:1500px}table{border-collapse:collapse}td,th{padding:8px;border:1px solid #cbd5e1}</style><h1>${DISCLAIMER}</h1><p>Salt okunur araştırma. Kayıt, imalat CSV/ZIP ve uygulamaya içe aktarma yok. H5 ideal menteşe; H1 hareketi modellenmedi.</p><nav>${summaries.map(s=>`<a href="#${s.id}">${s.id}</a>`).join('')}</nav>${summaries.map(s=>`<article id="${s.id}"><h2>${s.id}</h2><p>${Object.values(s.classifications).join(' · ')}</p><a href="${s.id}.cad.json">Deneysel geometri JSON</a> · <a href="${s.id}.svg">SVG pafta</a><img alt="${s.id} deneysel geometri, hareket ve erişim paftası" src="${s.id}.svg"></article>`).join('')}</html>`;
}
