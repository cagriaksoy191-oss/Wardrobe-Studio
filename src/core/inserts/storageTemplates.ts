import type { Bay, Design, InsertConfig, ResolvedModel, SplitNode, StorageTemplateId } from '../schema/types';
import { setCellInsertInDesign } from '../solver/treeMutator';

export const STORAGE_TEMPLATE_CATALOG:Record<StorageTemplateId,{label:string;description:string}>={
  deepYukluk:{label:'Derin Türk evi yüklüğü',description:'Yorgan, nevresim ve hurç için 650 × 400 × 500 mm paket alanı; net ölçüden kapasite.'},
  steppedLHanging:{label:'Kademeli L-askı',description:'İki kolun ilk bölmelerini 200 mm farklı boru kotuyla düzenler. Mevcut iç düzenleri değiştirir.'},
  blindLuggage:{label:'Kör köşe valiz / yüklük',description:'Öncelikli kolun ilk bölmesine derin depolama; gerçek ön açıklık ve çıkarma uyarısı.'},
  jewelryDrawer:{label:'Takı ve aksesuar çekmecesi',description:'İnce bölücülü iki çekmece; 4 × 3 göz. Uygun seçili hücreye veya bölmeye uygulanır.'},
  trouserRack:{label:'Pantolonluk',description:'55 mm aralıklı gerçek metal çubuklar; en az 800 mm düşey kıyafet alanı. Donanım kontrolü gerekir.'},
  laundryBasket:{label:'Kirli çamaşır sepeti',description:'350 × 600 × 450 mm sepet için ayrılmış alan. Üst bölüm raflı kalır.'},
};
let sequence=0;
const uid=(prefix:string)=>`${prefix}-${Date.now().toString(36)}-${++sequence}`;
const leaf=(label:string,owner:Bay['owner'],insert:InsertConfig):SplitNode=>({kind:'leaf',id:uid('cell'),label,owner,insert});
function lowerModule(bay:Bay,t:number,height:number,insert:InsertConfig):SplitNode {
  return {kind:'split',id:uid('split'),direction:'horizontal',dividerThicknessMm:t,children:[
    {id:uid('child'),size:{kind:'fixed',mm:height},node:leaf(STORAGE_TEMPLATE_CATALOG[insert.storageTemplate!].label,bay.owner,insert)},
    {id:uid('child'),size:{kind:'flex',weight:1,minMm:200},node:leaf('Üst raf alanı',bay.owner,{type:'shelfStack',shelfCount:2})},
  ]};
}
export function applyStorageTemplateToDesign(draft:Design,resolved:ResolvedModel,template:StorageTemplateId,bayId:string,cellId?:string):void {
  let run=draft.runs.find(r=>r.bays.some(b=>b.id===bayId));
  let bay=run?.bays.find(b=>b.id===bayId);
  if(template==='steppedLHanging') {
    if(draft.layoutKind!=='l-shape'||draft.runs.length<2) throw new Error('Kademeli L-askı için iki kollu L yerleşim gerekir.');
    const selected=draft.runs.filter(r=>r.wallAxis==='A'||r.wallAxis==='B');
    const limits=selected.map(r=>({base:r.plinthHeightMm+r.panelThicknessMm,top:r.heightMm-r.topFillerHeightMm-r.panelThicknessMm}));
    const lower=Math.min(1550,...limits.map(l=>l.top-300));
    if(limits.some((l,i)=>lower+i*200-l.base<900)) throw new Error('Kademeli L-askı için en az 1200 mm net bölme yüksekliği gerekir.');
    selected.forEach((r,i)=>{const b=r.bays[0]; b.root=leaf(`Kademeli L-askı ${r.wallAxis}`,b.owner,{type:'hangingRod',rodHeightMm:lower+i*200-limits[i].base,itemPreset:'shirts',storageTemplate:template});});
    return;
  }
  if(template==='blindLuggage') {
    const junction=draft.junctions.find(j=>j.type==='blind');
    if(!junction) throw new Error('Kör köşe valiz şablonu için köşe tipini Kör Köşe yapın.');
    run=draft.runs.find(r=>r.id===junction.priorityRunId); bay=run?.bays[0]; cellId=undefined;
  }
  if(!run||!bay) throw new Error('Önce uygulanacak bölmeyi seçin.');
  const insert:InsertConfig=template==='deepYukluk'?{type:'beddingYukluk',shelfCount:1,itemPreset:'hurc',storageTemplate:template}:
    template==='blindLuggage'?{type:'beddingYukluk',shelfCount:1,itemPreset:'suitcases',storageTemplate:template}:
    template==='jewelryDrawer'?{type:'drawerBank',drawerCount:2,isInternalDrawer:true,storageTemplate:template}:
    template==='trouserRack'?{type:'hangingRod',rodHeightType:'short',itemPreset:'trousers',storageTemplate:template}:
    {type:'empty',itemPreset:'none',storageTemplate:template};
  if(cellId && resolved.cells.some(c=>c.id===cellId && c.bayId===bay!.id && !c.cornerJunctionId)) {
    setCellInsertInDesign(draft,cellId,insert,STORAGE_TEMPLATE_CATALOG[template].label,undefined,true);
  } else if(template==='jewelryDrawer'||template==='laundryBasket'||template==='trouserRack') {
    bay.root=lowerModule(bay,run.panelThicknessMm,template==='jewelryDrawer'?400:template==='laundryBasket'?650:950,insert);
  } else bay.root=leaf(STORAGE_TEMPLATE_CATALOG[template].label,bay.owner,insert);
}

function mirrorNode(node:SplitNode):void {
  if(node.kind==='split') {
    if(node.direction==='vertical') node.children.reverse();
    node.children.forEach(c=>mirrorNode(c.node));
  } else if(node.insert?.serviceItems) node.insert.serviceItems.reverse();
}
export function mirrorBayInDesign(draft:Design,bayId:string,resolved?:ResolvedModel):void {
  const bay=draft.runs.flatMap(r=>r.bays).find(b=>b.id===bayId);
  if(!bay) throw new Error('Bölme bulunamadı.');
  const fronts=draft.fronts.filter(f=>f.bayIds.includes(bayId));
  if(fronts.some(f=>f.bayIds.length>1)) throw new Error('Önce ortak kapağı tek bölme kapsamına ayırın; ortak cephe tek başına aynalanamaz.');
  mirrorNode(bay.root);
  const width=resolved?.bays.find(b=>b.id===bayId)?.outerWidthMm??(bay.width.kind==='fixed'?bay.width.mm:1000);
  bay.frontMode=bay.frontMode==='singleLeft'?'singleRight':bay.frontMode==='singleRight'?'singleLeft':(bay.frontMode==='auto'||(bay.frontMode===undefined&&bay.autoFront))&&width<=604?'singleRight':bay.frontMode;
  for(const f of fronts) f.hingeSide=f.hingeSide==='left'?'right':f.hingeSide==='right'?'left':f.hingeSide;
}
export function copyBayInDesign(draft:Design,resolved:ResolvedModel,sourceBayId:string,targetRunId:string,mirror=false):string {
  const sourceRun=draft.runs.find(r=>r.bays.some(b=>b.id===sourceBayId));
  const source=sourceRun?.bays.find(b=>b.id===sourceBayId),target=draft.runs.find(r=>r.id===targetRunId);
  if(!source||!sourceRun||!target) throw new Error('Kaynak bölme veya hedef kol bulunamadı.');
  const sourceFronts=draft.fronts.filter(f=>f.bayIds.includes(sourceBayId));
  if(sourceFronts.some(f=>f.bayIds.length>1)) throw new Error('Ortak kapak kapsamındaki bölme için önce kapağı tek bölmeye ayırın.');
  if(sourceFronts.length&&(sourceRun.heightMm!==target.heightMm||sourceRun.plinthHeightMm!==target.plinthHeightMm||sourceRun.topFillerHeightMm!==target.topFillerHeightMm)) throw new Error('Özel kapaklı bölme yalnızca aynı yükseklik/baza/üst bitiş ölçüsüne sahip kola kopyalanabilir.');
  const width=resolved.bays.find(b=>b.id===sourceBayId)?.outerWidthMm??600;
  if(target.lengthMm+width>10000) throw new Error('Kopyalama kolun 10000 mm sınırını aşıyor.');
  const clone=JSON.parse(JSON.stringify(source)) as Bay; clone.id=uid('bay'); clone.label=`${source.label} — Kopya`; clone.width={kind:'fixed',mm:width};
  const refresh=(n:SplitNode)=>{n.id=uid(n.kind==='leaf'?'cell':'split');if(n.kind==='split')for(const c of n.children){c.id=uid('child');refresh(c.node);}};
  refresh(clone.root); target.bays.push(clone); target.lengthMm+=width;
  for(const front of sourceFronts) draft.fronts.push({...JSON.parse(JSON.stringify(front)),id:uid('front'),runId:target.id,bayIds:[clone.id]});
  if(mirror) mirrorBayInDesign(draft,clone.id);
  return clone.id;
}
