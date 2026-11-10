import type {Design,ResolvedModel} from '../schema/types';
import {convexHull} from '../analysis/kinematics';
import {assertProductionReady,polygonCutGroups,ROLE_NAMES,type ProductionPackage,type ProductionPart} from './productionModel';
import { ACCESS_STATUS_LABEL, accessMeasurement, accessSequence, accessWarnings } from '../analysis/functionalAccess';

type P=[number,number];
export type DrawingElement=
  |{kind:'line';a:P;b:P;color:string;width:number;dash?:boolean}
  |{kind:'polygon';points:P[];color:string;fill:string;width:number;dash?:boolean;partCode?:string}
  |{kind:'text';at:P;text:string;size:number;color:string;align?:'left'|'center'|'right';rotation?:number};
export interface TechnicalSheet {id:string;title:string;widthMm:420;heightMm:297;scale?:number;elements:DrawingElement[];partCodes:string[]}
const ink='#172d41',blue='#155e75',muted='#526779';
export const PRINT_SCALE_GUIDANCE = 'Sayfayı %100 yazdırın. Pafta ölçeği ayrıdır. Ölçü rakamlarını kullanın. Fiziksel 1:1 şablon değildir.';
export const formatMm=(n:number)=>Number.isInteger(n)?String(n):n.toFixed(1);
const xml=(v:unknown)=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;');
export function wrapText(text:string,maxWidth:number,size=3):string[] {
  const max=Math.max(4,Math.floor(maxWidth/(size*.55))),lines:string[]=[];
  for(const paragraph of text.split('\n')){let line='';for(const word of paragraph.split(/\s+/)){if(line.length+word.length+1>max&&line){lines.push(line);line='';}if(word.length>max){if(line){lines.push(line);line='';}for(let i=0;i<word.length;i+=max)lines.push(word.slice(i,i+max));}else line+=(line?' ':'')+word;}if(line)lines.push(line);if(!paragraph)lines.push('');}return lines;
}
function text(s:TechnicalSheet,x:number,y:number,value:string,size=3,color=ink,align?:'left'|'center'|'right'){s.elements.push({kind:'text',at:[x,y],text:value.replaceAll('→','->'),size,color,align});}
function line(s:TechnicalSheet,a:P,b:P,color=ink,width=.22,dash=false){s.elements.push({kind:'line',a,b,color,width,dash});}
function polygon(s:TechnicalSheet,points:P[],fill='#eef3f5',color=ink,width=.2,dash=false,partCode?:string){s.elements.push({kind:'polygon',points,fill,color,width,dash,partCode});}
function para(s:TechnicalSheet,x:number,y:number,value:string,width:number,size=3,color=ink){const lines=wrapText(value,width,size);for(const [i,t]of lines.entries())text(s,x,y+i*size*1.5,t,size,color);return y+lines.length*size*1.5;}
function base(pkg:ProductionPackage,id:string,title:string):TechnicalSheet {
  const s:TechnicalSheet={id,title,widthMm:420,heightMm:297,elements:[],partCodes:[]};
  line(s,[12,12],[408,12],blue,.8);text(s,12,22,'WARDROBE STUDIO / TEKNİK ÜRETİM PAKETİ',4.2,blue);text(s,12,31,title,4.8);
  text(s,408,21,`Rev. ${pkg.revision} · ${pkg.generatedAt.slice(0,10)}`,2.8,muted,'right');text(s,408,29,pkg.statusLabel,2.9,pkg.status==='blocked'||pkg.accessStatus==='blocked'?'#a21d25':'#925400','right');
  line(s,[12,278],[408,278],muted,.2);
  text(s,12,284,wrapText(`${pkg.designName} · ${pkg.versionName}`,270,2.8)[0] ?? '',2.8,muted);
  text(s,408,284,`${id} · mm · A3 yatay`,2.8,muted,'right');
  text(s,12,291,PRINT_SCALE_GUIDANCE,2.8,muted);
  line(s,[326,292],[376,292],blue,.3);line(s,[326,290],[326,294],blue,.3);line(s,[376,290],[376,294],blue,.3);
  text(s,351,290,'50 mm baskı kontrolü',2.6,blue,'center');
  return s;
}
interface Fit {at:(p:P)=>P;scale:number}
function fit(points:P[],box={x:23,y:52,w:264,h:196}):Fit {
  const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  const needed=Math.max((maxX-minX)/box.w,(maxY-minY)/box.h,1),scale=[1,2,5,10,15,20,25,30,40,50,75,100,150,200,300,500].find(x=>x>=needed)??Math.ceil(needed);
  const ox=box.x+(box.w-(maxX-minX)/scale)/2,oy=box.y+(box.h-(maxY-minY)/scale)/2;
  return {scale,at:p=>[ox+(p[0]-minX)/scale,oy+(p[1]-minY)/scale]};
}
function dim(s:TechnicalSheet,a:P,b:P,label:string,vertical=false,offset=8){
  const da:P=vertical?[a[0]-offset,a[1]]:[a[0],a[1]+offset],db:P=vertical?[b[0]-offset,b[1]]:[b[0],b[1]+offset];
  line(s,a,da,muted,.13);line(s,b,db,muted,.13);line(s,da,db,blue,.18);
  for(const p of [da,db])line(s,[p[0]-1,p[1]+1],[p[0]+1,p[1]-1],blue,.22);
  if(vertical)s.elements.push({kind:'text',at:[da[0]-2,(da[1]+db[1])/2],text:label,size:3.4,color:blue,align:'center',rotation:-90});
  else text(s,(da[0]+db[0])/2,(da[1]+db[1])/2+4.5,label,3.4,blue,'center');
}
function labelBox(s:TechnicalSheet,lines:string[],scale:number){let y=50;text(s,298,y,`PAFTA ÖLÇEĞİ 1:${scale}`,3.7,blue);y+=9;for(const t of lines){const h=wrapText(t,107,3.15).length*3.15*1.5+3;if(y+h>254){para(s,298,y,'Ek ölçüler ilgili modül tablolarında.',107,3.15,muted);break;}y=para(s,298,y,t,107,3.15,muted)+3;}}
function color(p:ProductionPart){return p.shape==='assembly'?'#dbeef2':p.role==='backPanel'||p.role==='cornerBackPanel'?'#f4f5f5':p.role==='doorLeaf'||p.role==='cornerAngledDoor'?'#e9ddd0':p.role.startsWith('drawer')?'#f7ead1':'#e3ebef';}
function corners(p:ProductionPart):[number,number,number][] {
  if(p.verticesMm&&p.originWorldMm)return [0,p.thicknessMm].flatMap(y=>p.verticesMm!.map(v=>[p.originWorldMm![0]+v.xMm,p.worldCenterMm[1]+y,p.originWorldMm![1]+v.zMm] as [number,number,number]));
  const [w,h,d]=p.worldSizeMm,[x,y,z]=p.worldCenterMm,c=Math.cos(p.rotationYRad),s=Math.sin(p.rotationYRad);
  return [-1,1].flatMap(a=>[-1,1].flatMap(b=>[-1,1].map(k=>[x+c*a*w/2+s*k*d/2,y+b*h/2,z-s*a*w/2+c*k*d/2] as [number,number,number])));
}
function hull(points:P[]):P[]{return convexHull(points.map(p=>({xMm:p[0],zMm:p[1]}))).map(p=>[p.xMm,p.zMm]);}
type WorldPoint = [number, number, number];
const iso = (p: WorldPoint): P => [(p[0]-p[2])*.707, (p[0]+p[2])*.289-p[1]*.816];
const isBack = (part: ProductionPart) => part.role === 'backPanel' || part.role === 'cornerBackPanel';
const facadeLayer = (part: ProductionPart) => {
  if (part.role === 'doorLeaf' || part.role === 'cornerAngledDoor') return 2;
  return part.role === 'drawerFront' ? 1 : 0;
};
function projected(
  s: TechnicalSheet, parts: ProductionPart[], project: (p: WorldPoint) => P,
  depth: (p: WorldPoint) => number, layer: (part: ProductionPart) => number = () => 0
): Fit {
  const shapes=parts.map(p=>({p,points:hull(corners(p).map(project))}));
  const f=fit(shapes.flatMap(p=>p.points));s.scale=f.scale;s.partCodes=parts.map(p=>p.code);
  for (const { p, points } of shapes.sort((a, b) => {
    return layer(a.p) - layer(b.p) || depth(a.p.worldCenterMm) - depth(b.p.worldCenterMm);
  })) {
    polygon(s, points.map(f.at), color(p), ink, .18, isBack(p), p.code);
  }
  return f;
}
export interface TableColumn {title:string;width:number}
function tableSheets(pkg:ProductionPackage,id:string,title:string,columns:TableColumn[],rows:string[][],notes?:string):TechnicalSheet[] {
  const pages: TechnicalSheet[] = [];
  const bodySize = 3.25, lineStep = 4.55, bottom = 270;
  const headers = columns.map(col => wrapText(col.title,col.width-5,3.2));
  const headerHeight = Math.max(10, Math.max(...headers.map(lines => lines.length))*lineStep+4);
  const pageStart = 43 + headerHeight;
  let s: TechnicalSheet, y = 0, rowIndex = 0;
  const page = () => {
    s = base(pkg,`${id}-${pages.length+1}`,title);
    pages.push(s);
    let x = 12;
    columns.forEach((col,index) => {
      polygon(s,[[x,43],[x+col.width,43],[x+col.width,pageStart],[x,pageStart]],'#dceaf0',muted,.15);
      headers[index].forEach((label,i)=>text(s,x+2.5,49+i*lineStep,label,3.2,blue));
      x += col.width;
    });
    y = pageStart;
  };
  page();
  const maxLines = Math.floor((bottom-pageStart-4)/lineStep);
  for (const row of rows) {
    const wrapped = row.map((cell,i)=>wrapText(cell,columns[i].width-5,bodySize));
    const lines = Math.max(1,...wrapped.map(value => value.length));
    const codes = row.flatMap(cell => cell.match(/\bP-[0-9A-F]{8}\b/g) ?? []);
    for (let start=0;start<lines;start+=maxLines) {
      const h=Math.max(10, Math.min(lines-start,maxLines)*lineStep+4);
      if (y+h>bottom) page();
      let x=12;
      columns.forEach((col,i) => {
        polygon(s!,[[x,y],[x+col.width,y],[x+col.width,y+h],[x,y+h]],rowIndex%2?'#f1f6f8':'#ffffff',muted,.12);
        wrapped[i].slice(start,start+maxLines).forEach((value,k)=>text(s!,x+2.5,y+5+k*lineStep,value,bodySize));
        x+=col.width;
      });
      s!.partCodes.push(...codes.filter(code => !s!.partCodes.includes(code)));
      y+=h;
    }
    rowIndex++;
  }
  if (notes) {
    const height=wrapText(notes,394,3).length*4.5+6;
    if (y+height>bottom) page();
    para(s!,12,y+6,notes,394,3,muted);
  }
  return pages;
}
function moduleParts(pkg:ProductionPackage,id:string){return pkg.parts.filter(p=>p.moduleIds.includes(id));}

function assemblySheet(pkg: ProductionPackage, id: string, label: string, parts: ProductionPart[], axis: string) {
  const s = base(pkg, '14-MONTAJ-' + id, 'Patlatılmış gövde montajı / ' + label);
  const wallB = axis === 'B';
  const sides = parts.filter(part => ['sidePanel', 'verticalDivider', 'cornerSidePanel'].includes(part.role))
    .sort((a, b) => a.worldCenterMm[wallB ? 2 : 0] - b.worldCenterMm[wallB ? 2 : 0]);
  const pieces: { part: ProductionPart; shift: WorldPoint }[] = [];
  const add = (part: ProductionPart | undefined, shift: WorldPoint) => { if (part) pieces.push({ part, shift }); };
  add(sides[0], wallB ? [0, 0, -320] : [-520, 0, 0]);
  add(sides.length > 1 ? sides.at(-1) : undefined, wallB ? [0, 0, 320] : [520, 0, 0]);
  add(parts.find(p => p.role === 'topPanel'), [0, 290, 0]);
  add(parts.find(p => p.role === 'bottomPanel'), [0, -260, 0]);
  const backs = parts.filter(isBack);
  add(backs[0], wallB ? [-620, 0, 0] : [0, 0, -620]);
  add(backs[1], [-620, 0, 0]);
  add(parts.find(p => p.role === 'shelf' || p.role === 'cornerPolygonShelf'), wallB ? [420, 0, 0] : [0, 0, 420]);
  if (!pieces.length) return;
  const shapes = pieces.map(({ part, shift }) => {
    const installed = corners(part);
    const points = hull(installed.map(p => iso([p[0]+shift[0], p[1]+shift[1], p[2]+shift[2]])));
    const average = (points: P[]): P => [
      points.reduce((sum, p) => sum+p[0], 0)/points.length,
      points.reduce((sum, p) => sum+p[1], 0)/points.length,
    ];
    return { part, points, anchor: average(points), home: average(hull(installed.map(iso))) };
  });
  const f = fit(shapes.flatMap(shape => shape.points), { x: 25, y: 51, w: 250, h: 196 });
  for (const shape of [...shapes].sort((a, b) => Number(isBack(b.part)) - Number(isBack(a.part)))) {
    polygon(s, shape.points.map(f.at), color(shape.part), ink, .2, isBack(shape.part), shape.part.code);
  }
  for (const [index, shape] of shapes.entries()) {
    const at = f.at(shape.anchor);
    line(s, f.at(shape.home), at, muted, .18, true);
    polygon(s, [[at[0]-3,at[1]-3],[at[0]+3,at[1]-3],[at[0]+3,at[1]+3],[at[0]-3,at[1]+3]], '#ffffff', blue);
    text(s,at[0],at[1]+1.2,String(index+1),3.1,blue,'center');
  }
  s.partCodes = shapes.map(shape => shape.part.code);
  let y = para(s, 298, 49, 'Şematik ayırma. Kesim ve kurulum ölçüleri modül, cephe ve kesit paftalarında.', 106, 3.2, blue) + 6;
  for (const [index, shape] of shapes.entries()) {
    y = para(s, 298, y, `${index+1}  ${shape.part.code} · ${shape.part.label}`, 106, 3) + 3;
  }
  para(s, 298, y+3, 'Kesikli çizgiler montaj yönünü gösterir. Bağlantı yöntemi ve delik koordinatları usta ve katalog onayı bekliyor.', 106, 2.9, muted);
  return s;
}

/** SVG, yazdırma ve PDF aynı kağıt-mm çizim komutlarını kullanır. */
export function buildTechnicalSheets(design:Design,model:ResolvedModel,pkg:ProductionPackage,compactPolygons=false):TechnicalSheet[] {
  const sheets:TechnicalSheet[]=[];
  const polygonGroups = polygonCutGroups(pkg, compactPolygons);
  const polygonRefs = new Map(polygonGroups.flatMap(group => group.parts.map(part => [part.code, group.id] as const)));
  const cover=base(pkg,'00-KAPAK','Tasarım ve üretim ön kontrolü');
  const accessIssues = accessWarnings(pkg.functionalAccess);
  const errors = pkg.issues.filter(issue => issue.severity === 'error').length;
  const blockedAccess = pkg.functionalAccess.filter(entry => entry.status === 'blocked').length;
  const unknownAccess = pkg.functionalAccess.filter(entry => entry.status === 'unverified').length;
  let y=49;y=para(cover,16,y,pkg.designName,380,7,blue)+4;
  y=para(cover,16,y,`Geometri ${errors} kritik hata · İşlevsel erişim ${blockedAccess} engel / ${unknownAccess} açık kontrol`,380,4,
    errors||blockedAccess?'#a21d25':ink)+2;
  if (accessIssues.length) {
    const entry = accessIssues[0];
    const door = model.doors.find(d => entry.coveringIds.includes(d.id) && d.isCornerDoor);
    y=para(cover,16,y,`${ACCESS_STATUS_LABEL[entry.status]} · ${entry.label}. ${accessMeasurement(entry)}.${door?.opening
      ? ' Kapak ' + formatMm(door.opening.safeAngleDeg) + '° / ' + door.maxAngleDeg + '°.' : ''} Ayrıntı 13-ERISIM.`,380,3.6,blockedAccess?'#a21d25':'#925400')+3;
    if (blockedAccess) y=para(cover,16,y,'Tanısal pafta. Kesim veya imalattan önce erişim engelini giderin.',380,3.6,'#a21d25')+2;
  }
  const layout = design.layoutKind === 'straight' ? 'Düz, tek duvar' : design.junctions[0]?.type === 'blind' ? 'L, kör köşe' : 'L, beşgen köşe';
  y=para(cover,16,y,`${layout} · Sürüm ${pkg.versionName} · Kimlik ${pkg.designId}`,380,3.4)+4;
  for(const r of pkg.runDimensions)y=para(cover,16,y,`${r.label} (${r.axis}) - ${r.lengthMm} × ${r.heightMm} × ${r.depthMm} mm (G × Y × D). Arka ofset ${r.rearOffsetMm} mm, duvardan ray sınırı ${r.frontFromWallMm} mm. Panel ${r.panelMm} / arkalık ${r.backMm} mm. ${r.construction}.`,380,3.5)+3;
  y=para(cover,16,y,`Kapalı toplam dış zarf (X × Y × Z) ${pkg.outerEnvelopeMm.map(formatMm).join(' × ')} mm. Oda tavanı ${design.roomHeightMm} mm${design.ceilingClearanceMm===undefined ? ', montaj payı girilmedi' : ', bildirilen montaj payı ' + design.ceilingClearanceMm + ' mm'}.`,380,3.3)+3;
  y+=3;y=para(cover,16,y,`${pkg.parts.length} fiziksel parça · ${pkg.parts.filter(p=>p.shape==='polygon').length} özel kesim · ${pkg.parts.filter(p=>p.shape==='assembly').length} cam/ayna montajı · ${model.doors.length} menteşeli / ${model.slidingDoors?.length??0} sürgülü kanat · ${model.drawers.length} çekmece`,380,3.5)+4;
  const materials = pkg.materialSummary.slice(0,3).map(material => `${material.material} ${material.thicknessMm} mm`).join(' · ');
  if (materials) y=para(cover,16,y,`Levhalar ${materials}${pkg.materialSummary.length>3?' · diğer yüzeyler 01-MALZEME':''}.`,380,3.2)+3;
  const area = (mm2: number) => (mm2/1e6).toFixed(3) + ' m²';
  y=para(cover,16,y,`Fiziksel raf yüzeyi ${area(pkg.surfaceAreasMm2.physicalShelf)} · net depolama rafı ve tabanı ${area(pkg.surfaceAreasMm2.netStorage)} · net üretim levhası ${area(pkg.surfaceAreasMm2.material)}.`,380,3.1)+3;
  y=para(cover,16,y,'İmalat öncesi yerinde ölçü, kenar/kanal payı, bağlantı, menteşe ve ray ürünü ile erişim kontrolü. Tam malzeme, donanım ve montaj notları ilgili paftalarda.',380,3.5,blue)+4;
  sheets.push(cover);
  if (pkg.parts.length === 0) {
    sheets.push(...tableSheets(pkg,'13-UYARI','Çözüm ve üretim hataları',[
      {title:'Kod',width:100},{title:'Açıklama',width:296},
    ],pkg.issues.map(issue => [issue.code,issue.description])));
    sheets.forEach((sheet,i)=>text(sheet,408,290,`${i+1} / ${sheets.length}`,2.6,muted,'right'));
    return sheets;
  }
  sheets.push(...tableSheets(pkg,'01-MALZEME','Malzeme / kalınlık özeti',[{title:'Malzeme',width:150},{title:'Kalınlık (mm)',width:55},{title:'Fiziksel parça',width:55},{title:'Net alan (m²)',width:55},{title:'Pay',width:81}],pkg.materialSummary.map(m=>[m.material,String(m.thicknessMm),String(m.quantity),(m.areaMm2/1e6).toFixed(3),'Fire / testere payı hariç']),`Cam/ayna montajları levha alanı toplamına alınmaz. ${pkg.notes[0]}`));
  const overall=base(pkg,'02-GENEL','Genel yerleşim / aksonometrik görünüş');
  const f=projected(overall,pkg.parts,iso,p=>p[0]+p[2]+p[1]*.707,facadeLayer);labelBox(overall,['Aksonometrik izdüşüm. Ayrıntı ölçüleri cephe, plan, kesit ve modül paftalarından okunur.',...pkg.runDimensions.map(r=>`${r.axis} gövde ve ray ${r.lengthMm} × ${r.heightMm} × ${r.totalDepthMm} mm`),'Gövde, kapak ve çekmeceler kapalı konumda.'],f.scale);sheets.push(overall);
  for(const run of design.runs){const parts=pkg.parts.filter(p=>p.runId===run.id),axis=run.wallAxis;
    if(!parts.length)continue;
    const s=base(pkg,`03-CEPHE-${axis}`,`${run.label} / ${axis} cephesi (kapaklar kapalı)`),project=(p:WorldPoint):P=>[axis==='B'?p[2]:p[0],-p[1]],f=projected(s,parts,project,p=>p[axis==='B'?0:2]);
    dim(s,f.at([0,0]),f.at([run.lengthMm,0]),`${run.lengthMm} mm`);dim(s,f.at([0,-run.heightMm]),f.at([0,0]),`${run.heightMm} mm`,true);
    labelBox(s,[`${run.label}: dış ${run.lengthMm} × ${run.heightMm} mm.`,...model.bays.filter(b=>b.runId===run.id).map(b=>`${b.label}: dış ${b.outerWidthMm}; net ${b.netInnerWidthMm} × ${b.netInnerHeightMm} × ${b.netInnerDepthMm} mm.`),'Kapalı kapak görünüşü. Raf ve kasa detayları ilgili modül paftasında.'],f.scale);sheets.push(s);
    const bays=model.bays.filter(b=>b.runId===run.id),bay=bays[Math.floor(bays.length/2)];
    if(bay){const cut=axis==='B'?bay.worldCenterMm[2]:bay.worldCenterMm[0];
      const sectionParts=parts.filter(p=>{const vals=corners(p).map(c=>axis==='B'?c[2]:c[0]);return Math.min(...vals)<=cut&&Math.max(...vals)>=cut;});
      const sec=base(pkg,`05-KESIT-${axis}`,`${run.label} / düşey yan kesit S-${axis}`),sf=projected(sec,sectionParts,p=>[axis==='B'?p[0]:p[2],-p[1]],p=>p[axis==='B'?2:0]);
      const rear = run.rearOffsetMm ?? 0;
      dim(sec,sf.at([rear,0]),sf.at([rear+run.depthMm,0]),`${run.depthMm} mm gövde`);dim(sec,sf.at([rear,-run.heightMm]),sf.at([rear,0]),`${run.heightMm} mm`,true);
      if (rear > 0) dim(sec,sf.at([0,0]),sf.at([rear,0]),`Arka ofset ${rear} mm`,false,17);
      labelBox(sec,[`Kesit düzlemi: ${axis==='B'?'Z':'X'} = ${formatMm(cut)} mm; ${bay.label} içinden.`,`Arkalık ${run.backPanelThicknessMm} mm. Net derinlik ${bay.netInnerDepthMm} mm.`,`Baza ${run.plinthHeightMm} mm; üst klapa ${run.topFillerHeightMm} mm; panel ${run.panelThicknessMm} mm.`,...pkg.runDimensions.filter(r=>r.id===run.id).map(r=>`Sürgü rayı dahil toplam derinlik ${r.totalDepthMm} mm.`),'Tarama yerine katı panel sınırları gösterilir. Kesitte görünen kapak/çekmece kapalı konumdadır.'],sf.scale);sheets.push(sec);
    }
  }
  const plan=base(pkg,'04-PLAN','Üst plan / A-B kolları ve köşe');const pf=projected(plan,pkg.parts,p=>[p[0],p[2]],p=>p[1]);
  const ra=design.runs.find(r=>r.wallAxis==='A'),rb=design.runs.find(r=>r.wallAxis==='B');if(ra)dim(plan,pf.at([0,0]),pf.at([ra.lengthMm,0]),`A ${ra.lengthMm} mm`,false,-9);if(rb)dim(plan,pf.at([0,0]),pf.at([0,rb.lengthMm]),`B ${rb.lengthMm} mm`,true);
  labelBox(plan,[rb
    ? 'Dünya başlangıcı iki arka duvarın kesişimidir (X=0, Z=0). A kolu +X, B kolu +Z yönündedir.'
    : 'Dünya başlangıcı A kolunun arka başlangıcıdır (X=0, Z=0). A kolu +X yönündedir.',
    'Plan +X sağa, +Z aşağı. Kapaklar kapalı. Ray ve kulp çıkıntıları donanım zarfıdır.',
    ...model.corners.map(c=>c.type==='diagonal'
      ? `Beşgen köşe. A tüketimi ${c.consumedRunAMm} mm, B tüketimi ${c.consumedRunBMm} mm. Dış eğik kenar ${c.outerFrontSpanMm??c.frontOpeningWidthMm} mm, net ön açıklık ${c.frontOpeningWidthMm} mm. ${polygonGroups.length?'Kesim V/E özel parça paftasında.':''}`
      : `Kör köşe. A tüketimi ${c.consumedRunAMm} mm, B tüketimi ${c.consumedRunBMm} mm. Klapa ${c.frontOpeningWidthMm} mm. Klapa ve dikmeler köşe modülü parça tablosundadır.`)],pf.scale);sheets.push(plan);
  for(const bay of model.bays){const parts=moduleParts(pkg,bay.id),run=design.runs.find(r=>r.id===bay.runId)!,axis=run.wallAxis;
    if(!parts.length)continue;
    const s=base(pkg,`06-MOD-${bay.id}`,`Modül iç detayı / ${bay.label}`),interiorParts=parts.filter(p=>p.role!=='doorLeaf'&&p.role!=='cornerAngledDoor'),f=projected(s,interiorParts,p=>[axis==='B'?p[2]:p[0],-p[1]],p=>p[axis==='B'?0:2],p=>-Number(isBack(p)));
    for(const rod of model.panels.filter(p=>p.role==='hangingRod'&&p.bayId===bay.id)){const a=axis==='B'?2:0,c=rod.worldPositionMm;line(s,f.at([c[a]-rod.boxSizeMm[a]/2,-c[1]]),f.at([c[a]+rod.boxSizeMm[a]/2,-c[1]]),blue,Math.max(.3,rod.boxSizeMm[1]/f.scale));}
    const x0=bay.startOffsetMm,x1=x0+bay.outerWidthMm;dim(s,f.at([x0,0]),f.at([x1,0]),`Dış ${bay.outerWidthMm} / net ${bay.netInnerWidthMm} mm`);
    labelBox(s,[`Modül: ${bay.id} · ${run.label}`,'İç cephe: kapak kanatları bu paftada gizlenmiştir; kapak ölçüleri cephe ve parça tablolarındadır.',`Dış genişlik ${bay.outerWidthMm} mm. Net G × Y × D: ${bay.netInnerWidthMm} × ${bay.netInnerHeightMm} × ${bay.netInnerDepthMm} mm.`,`Panel ${run.panelThicknessMm} / arkalık ${run.backPanelThicknessMm} mm.`,...model.cells.filter(c=>c.bayId===bay.id).slice(0,8).map(c=>`${c.label}: Y ${c.yStartMm}–${c.yEndMm}; net ${c.netWidthMm} × ${c.netHeightMm} × ${c.netDepthMm} mm.`),'Tüm aralıklar ve parça kodları devam tablolarında. Paylaşımlı panelin kodu komşu modülde de aynı olabilir; kesim listesinde tek adettir.'],f.scale);sheets.push(s);
    sheets.push(...tableSheets(pkg,`07-PARCA-${bay.id}`,`${bay.label} / parça eşleştirmesi`,[{title:'Parça kodu',width:41},{title:'Ad / görev',width:112},{title:'G × H × T (mm)',width:60},{title:'Malzeme / damar',width:72},{title:'Kaynak / montaj',width:111}],parts.map(p=>[p.code,`${p.label} (${ROLE_NAMES[p.role]??p.role})`,`${p.widthMm} × ${p.heightMm} × ${p.thicknessMm}`,`${p.material}; ${p.grain==='vertical'?'H yönü':'W yönü'}`,`${p.sourceId}${p.unitId?`; hareket birimi ${p.unitId}`:''}`])));
    sheets.push(...tableSheets(pkg,`08-ARALIK-${bay.id}`,`${bay.label} / net aralık ve çekmece ölçüleri`,[{title:'Hücre / çekmece',width:115},{title:'Net G × Y × D (mm)',width:92},{title:'Alt / üst kot (mm)',width:70},{title:'Modül / açıklama',width:119}], [...model.cells.filter(c=>c.bayId===bay.id).map(c=>[`${c.id} · ${c.label}`,`${c.netWidthMm} × ${c.netHeightMm} × ${c.netDepthMm}`,`${c.yStartMm} / ${c.yEndMm}`,c.insert?.type??'Boş']),...model.drawers.filter(d=>d.bayId===bay.id).map(d=>[`${d.id} · ${d.label}`,`${d.innerWidthMm} × ${d.innerHeightMm} × ${d.innerDepthMm}`,`${d.yStartMm} / ${d.yEndMm}`,`Net iç kasa; çıkma ${d.maxSlideMm} mm. Ön: ${d.widthMm} × ${d.heightMm}; yan ${d.sideThicknessMm}, taban ${d.bottomThicknessMm} mm.`]) ]));
  }
  for(const junction of design.junctions){const parts=moduleParts(pkg,junction.id);if(parts.length)sheets.push(...tableSheets(pkg,`09-KOSE-${junction.id}`,'Köşe modülü / parça eşleştirmesi',[{title:'Parça kodu',width:44},{title:'Parça / kaynak',width:150},{title:'Dış sınır G × H × T',width:72},{title:'Şekil / malzeme',width:130}],parts.map(p=>[p.code,`${p.label}; ${p.sourceId}`,`${p.widthMm} × ${p.heightMm} × ${p.thicknessMm}`,`${p.verticesMm?'Poligon — özel pafta':'Dikdörtgen'}; ${p.material}`])));}
  for (const group of polygonGroups) sheets.push(...polygonDetail(pkg, group.id, group.parts));
  sheets.push(...tableSheets(pkg,'11-KESIM','Tam kesim listesi / her satır bir fiziksel parça',[{title:'Kod / adet',width:42},{title:'Parça / görev',width:79},{title:'Modül',width:48},{title:'Malzeme',width:53},{title:'G × H × T mm',width:53},{title:'Damar / kenar / not',width:121}],pkg.parts.map(p=>[`${p.code}\n1 adet`,`${p.label}\n${ROLE_NAMES[p.role]??p.role}`,p.moduleIds.join(', '),p.material,`${p.widthMm} × ${p.heightMm} × ${p.thicknessMm}`,`${p.grain==='vertical'?'H':'W'} yönü. ${p.verticesMm?'Poligon '+polygonRefs.get(p.code):p.shape==='assembly'?'CAM/AYNA MONTAJ ZARFI':'Dikdörtgen'}. ${p.banding}. ${p.notes.join(' ')}`]),pkg.notes[0]));
  sheets.push(...tableSheets(pkg,'12-DONANIM','Donanım ve aksesuar / katalog kontrolü',[{title:'Kod',width:59},{title:'Donanım',width:97},{title:'Miktar',width:36},{title:'Planlama / doğrulama notu',width:204}],pkg.hardware.map(h=>[h.code,h.label,h.quantity===null?'Belirlenmedi':`${h.quantity} ${h.unit}`,h.detail])));
  const accessDetails = pkg.functionalAccess.filter(entry => entry.status !== 'usable');
  if (accessDetails.length) sheets.push(...tableSheets(pkg,'13-ERISIM','İşlevsel erişim / imalat öncesi çözüm',[
    {title:'Bölme veya çekmece',width:91},{title:'Durum / ölçüm',width:119},{title:'Engel ve denenen konum',width:186},
  ],accessDetails.map(entry => [entry.label,`${ACCESS_STATUS_LABEL[entry.status]}\n${accessMeasurement(entry)}`,
    [entry.blockerLabel,accessSequence(entry)].filter(Boolean).join('\n') || 'Kapaklar başlangıç konumunda.']),
    'Net geçiş, referans eşyanın düz çıkarma zarfıdır. Eğerek çıkarma, esnek eşya, farklı açma sıraları ve katalog bağlantısı sahada doğrulanır. Kızak mesafesi, aynı hareket çözücüsündeki fiziksel sınırdır.'));
  sheets.push(...tableSheets(pkg,'13-UYARI','Doğrulama uyarıları / montaj notları',[{title:'Durum / kod',width:72},{title:'Başlık',width:100},{title:'Açıklama',width:224}], [...pkg.issues.filter(i=>i.severity!=='info').map(i=>[`${i.severity.toUpperCase()} / ${i.code}`,i.title,i.description]),...pkg.notes.map((n,i)=>['USTA KONTROLÜ',`Üretim ve montaj notu ${i+1}`,n])]));
  for (const run of design.runs) {
    const bay = model.bays.find(candidate => candidate.runId === run.id);
    const sheet = bay && assemblySheet(pkg, bay.id, bay.label, moduleParts(pkg, bay.id), run.wallAxis);
    if (sheet) sheets.push(sheet);
  }
  for (const corner of model.corners.filter(corner => corner.type === 'diagonal')) {
    const sheet = assemblySheet(pkg, corner.id, 'Beşgen köşe', moduleParts(pkg, corner.id), 'A');
    if (sheet) sheets.push(sheet);
  }
  const coords = (values: number[]) => values.map(formatMm).join(' / ');
  if (pkg.frontDetails.length) sheets.push(...tableSheets(pkg,'15-KAPAK','Kapak kesimi, açılma sınırı ve donanım',[
    {title:'Parça / kesim G × Y × T',width:74},{title:'Kapalı konum / eksen (mm)',width:94},
    {title:'Hedef / güvenli sınır / ray',width:128},{title:'Kulp / donanım onayı',width:100},
  ],pkg.frontDetails.map(front => {
    const motion=front.motion;
    const g=motion.kind==='hinged'?motion.clearanceMm:undefined;
    const gaps=g?`Uçlar ${coords([g.spanStart,g.spanEnd])}, alt/üst ${coords([g.bottom,g.top])} mm${g.centerSeam===undefined?'':', orta derz '+g.centerSeam+' mm'}.`:'';
    const layout = motion.kind==='hinged'
      ? `${motion.hingeSide==='left'?'Sol':'Sağ'} menteşe · nominal ${motion.openingAngleDeg}°\nGüvenli ${motion.opening ? formatMm(motion.opening.safeAngleDeg)+'°' : 'hesaplanmadı'} (komşular kapalı).${motion.opening?.blockerLabel?' Engel: '+motion.opening.blockerLabel+'.':''}\n${gaps}`
      : `Ray ${motion.track}, bindirme ${motion.overlapMm} mm, öteleme ${coords(motion.offsetsMm)} mm. Alt/üst ray boşluğu ${motion.bottomGapMm} / ${motion.topGapMm} mm.`;
    const axis = motion.kind==='hinged'
      ? `\nEksen ${coords(motion.pivotMm)}\nKapalı Y açısı ${formatMm(motion.closedAngleDeg)}° · yön ${motion.direction>0?'+':'-'}\n${motion.profile==='diagonal-rear-axis'?'Açılı arka kenar':'Dış kenar'} planlama ekseni`
      : '';
    const mass = motion.kind==='hinged' && motion.boardMassKg !== null ? `\nLevha ~${motion.boardMassKg.toFixed(1)} kg` : '';
    const access = accessWarnings(pkg.functionalAccess.filter(entry => entry.coveringIds.includes(front.unitId)))[0];
    const accessLine = access ? `\n${ACCESS_STATUS_LABEL[access.status]} · ${accessMeasurement(access)}. 13-ERISIM.` : '';
    return [`${front.partCode}\n${front.cutSizeMm.join(' × ')} mm\n${front.moduleIds.join(', ')}`,
      `Merkez ${coords(front.closedCenterMm)}\nAlt/üst Y ${coords(front.yRangeMm)}${axis}`,layout+accessLine,
      `Kulp ${coords(front.handle.surfaceMm)} mm\n${front.handle.orientation==='horizontal'?'Yatay':'Düşey'} · ${front.handle.lengthMm} mm${mass}\nKatalog onayı bekliyor\n${front.hardwareCodes.join('\n')}`];
  }),'X / Y / Z dünya eksenleridir. Sabit eksenli planlama gerçek gizli menteşe yörüngesini temsil etmez. Katalog, tas mesafesi, kenar radyüsü, adet ve delik aksları usta tarafından doğrulanır. Levha tahmini 750 kg/m³, kulp hariç.'));
  const pinRows = model.cells.filter(cell => cell.subIntervalIndex === 0 && cell.insert?.adjustable && cell.insert.shelfPinRows);
  if (pinRows.length) sheets.push(...tableSheets(pkg,'16-RAF-ADIM','Ayarlanabilir raf yerleşimi',[
    {title:'Modül / hücre',width:140},{title:'Alt referans Y (mm)',width:72},{title:'32 mm satırlar',width:70},{title:'Raf alt kotları (mm)',width:114},
  ],pinRows.map(cell => [`${cell.bayId} / ${cell.sourceLeafId}`,String(cell.yStartMm),cell.insert!.shelfPinRows!.join(' / '),
    cell.insert!.shelfPinRows!.map(row => cell.yStartMm + 32*row).join(' / ')]),'Referans modülün alt iç yüzüdür. Destek pimi delik çapı, derinliği ve yatay aksları katalog ve usta onayı bekliyor.'));
  sheets.forEach((s,i)=>text(s,408,290,`${i+1} / ${sheets.length}`,2.6,muted,'right'));return sheets;
}
function polygonDetail(pkg:ProductionPackage,id:string,parts:ProductionPart[]):TechnicalSheet[] {
  const p=parts[0];
  const s=base(pkg,id,parts.length>1?'Özel kesim / ortak beşgen şablonu':`Özel kesim / ${p.code} / ${p.label}`),vertices=p.verticesMm!,f=fit(vertices.map(v=>[v.xMm,-v.zMm]),{x:36,y:59,w:225,h:180});s.scale=f.scale;s.partCodes=parts.map(part=>part.code);
  polygon(s,vertices.map(v=>f.at([v.xMm,-v.zMm])),'#edf3f6',blue,.45);
  const grainStart=f.at([p.widthMm*.25,-p.heightMm*.36]),grainEnd=f.at(p.grain==='horizontal'?[p.widthMm*.55,-p.heightMm*.36]:[p.widthMm*.25,-p.heightMm*.66]);line(s,grainStart,grainEnd,blue,.4);line(s,grainEnd,p.grain==='horizontal'?[grainEnd[0]-2,grainEnd[1]-1]:[grainEnd[0]-1,grainEnd[1]+2],blue,.4);line(s,grainEnd,p.grain==='horizontal'?[grainEnd[0]-2,grainEnd[1]+1]:[grainEnd[0]+1,grainEnd[1]+2],blue,.4);text(s,grainStart[0],grainStart[1]+5,'DAMAR',2.8,blue);
  vertices.forEach((v,i)=>{const q=f.at([v.xMm,-v.zMm]);text(s,q[0]+2,q[1]-2,`V${i+1}`,3,blue);const b=vertices[(i+1)%vertices.length],mid=f.at([(v.xMm+b.xMm)/2,-(v.zMm+b.zMm)/2]);text(s,mid[0],mid[1]+5,`E${i+1} ${formatMm(p.edges[i].lengthMm)}`,2.8,ink,'center');});
  const origin=f.at([0,0]);line(s,origin,[origin[0]+18,origin[1]],'#aa3535',.4);line(s,origin,[origin[0],origin[1]-18],'#aa3535',.4);text(s,origin[0]+20,origin[1],'+X',3,'#aa3535');text(s,origin[0],origin[1]-21,'+Z',3,'#aa3535');
  dim(s,f.at([0,0]),f.at([p.widthMm,0]),`${p.widthMm} mm dış sınır`);dim(s,f.at([0,-p.heightMm]),f.at([0,0]),`${p.heightMm} mm`,true,14);
  labelBox(s,[`${parts.length} fiziksel parça · ${parts.map(part=>part.code).join(' / ')}`,`${p.material} · kalınlık ${p.thicknessMm} mm.`,
    'Yerel başlangıç parçanın sol arka köşesidir. Üstten bakışta +Z yukarıdır.',`Damar ${p.grain==='horizontal'?'+X':'+Z'} boyunca. Eğik kenar ön kapak açıklığına bakar.`,
    `Dış sınır ${p.widthMm} × ${p.heightMm} mm. Kesim V noktalarından okunur. Tek parça alanı ${(p.areaMm2/1e6).toFixed(4)} m².`,
    p.banding,'Her parçanın dünya ofseti ve montaj kotu koordinat paftasında.'],f.scale);
  const rows=vertices.map((v,i)=>[`V${i+1}`,`${v.xMm} / ${v.zMm}`,`E${i+1}: V${i+1} → V${(i+1)%vertices.length+1}`,formatMm(p.edges[i].lengthMm),`${formatMm(p.edges[i].interiorAngleDeg)}°`,`${formatMm(p.edges[i].turnAngleDeg)}°`,p.edges[i].orientation]);
  const coordinateSheets=tableSheets(pkg,id+'-KOORD','Beşgen köşe, kenar ve düzlem açıları',[
    {title:'Köşe',width:25},{title:'Yerel X / Z mm',width:62},{title:'Kenar / yön',width:74},{title:'Kenar boyu mm',width:54},
    {title:'Köşe iç açısı',width:49},{title:'Dış dönüş',width:45},{title:'Ön / arka referansı',width:87},
  ],rows);
  const coord=coordinateSheets[0];
  coord.partCodes=s.partCodes;
  let y = para(coord,12,119,'Dış dönüş düzlemde 180° eksi iç açıdır. Kesim hattını V koordinatları tanımlar. Testere eğimi, bant düşümü ve birleşim ayarı usta onayı bekler.',390,3,muted)+8;
  text(coord,12,y,'Tekil montaj konumları · yerel (0,0) dünya X / Z ofseti ve alt Y kotu',3.4,blue);
  for (const part of parts) {
    y+=7;
    text(coord,12,y,part.code,3.1,blue);
    text(coord,55,y,`X ${part.originWorldMm?.[0]} / Z ${part.originWorldMm?.[1]} / Y ${part.worldCenterMm[1]} mm`,3);
    text(coord,155,y,part.label,3);
  }
  return [s,...coordinateSheets];
}
export function sheetToSvg(s:TechnicalSheet) {
  const elements=s.elements.map(e=>e.kind==='text'?`<text x="${e.at[0]}" y="${e.at[1]}" font-size="${e.size}" fill="${e.color}"${e.rotation?` transform="rotate(${e.rotation} ${e.at[0]} ${e.at[1]})"`:''} text-anchor="${e.align==='right'?'end':e.align==='center'?'middle':'start'}">${xml(e.text.replace(/[\u2010-\u2015]/g,'-'))}</text>`:e.kind==='line'?`<line x1="${e.a[0]}" y1="${e.a[1]}" x2="${e.b[0]}" y2="${e.b[1]}" stroke="${e.color}" stroke-width="${e.width}"${e.dash?' stroke-dasharray="1.2 1"':''}/>`:`<polygon points="${e.points.map(p=>p.join(',')).join(' ')}" fill="${e.fill}" stroke="${e.color}" stroke-width="${e.width}"${e.dash?' stroke-dasharray="1.2 1"':''}/>`).join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="420mm" height="297mm" viewBox="0 0 420 297" role="img" aria-label="${xml(s.title)}"><title>${xml(s.title)}</title><rect width="420" height="297" fill="white"/><g font-family="Noto Sans,Arial,sans-serif">${elements}</g></svg>`;
}
export function buildPrintableReport(pkg:ProductionPackage,sheets:TechnicalSheet[]) {
  assertProductionReady(pkg);
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>${xml(pkg.designName)} — Üretim raporu</title><style>@font-face{font-family:'Noto Sans';src:url('./fonts/NotoSans-Regular.ttf')}@page{size:A3 landscape;margin:0}*{box-sizing:border-box}body{margin:0;background:#ccd5dc;font-family:Arial}header{padding:20px;color:#172d41;background:white}article{width:420mm;height:297mm;margin:10mm auto;background:white;break-after:page}svg{display:block;width:420mm;height:297mm}@media print{header{display:none}body{background:white}article{margin:0;break-after:page}article:last-child{break-after:auto}}</style></head><body><header><h1>${xml(pkg.designName)}</h1><p>${xml(pkg.statusLabel)} · A3 yatay. ${PRINT_SCALE_GUIDANCE}</p><button onclick="window.print()">Yazdır / PDF</button></header>${sheets.map(s=>`<article>${sheetToSvg(s)}</article>`).join('')}</body></html>`;
}
