import type { Design, FunctionalAccessStatus, GrainAxis, HandleConfig, MaterialId, Point2DMm, ResolvedDoorLeaf, ResolvedFunctionalAccess, ResolvedModel, ResolvedPanel, ValidationIssue } from '../schema/types';
import { boxVolume, drawerVolumes, hingedHandleSurface, hingedVolumes, panelVolume, polygonAreaMm2, polygonBounds, slidingVolumes } from '../analysis/kinematics';
import { assertDesignStructure, DesignConstraintError, runFrontMm } from '../schema/designConstraints';
import { staticProductionIssues } from './staticPreflight';
import { estimatedBoardMassKg } from '../fronts/frontGeometry';

export const MATERIAL_NAMES:Record<MaterialId,string>={warmOak:'Sıcak Doğal Meşe (MDFLAM)',lightNordicOak:'Açık İskandinav Meşe (MDFLAM)',smokedOak:'Füme Koyu Meşe (MDFLAM)',naturalWalnut:'Amerikan Ceviz (MDFLAM)',darkWalnut:'Koyu İtalyan Ceviz (MDFLAM)',matteWhite:'İpek Mat Beyaz (MDFLAM / Lake)',creamAlabaster:'Sıcak Krem / Alabaster (MDFLAM)',linenBeige:'Keten Bej / Kaşmir (MDFLAM)',sageGreen:'Modern Adaçayı Yeşili (Mat Lake)',softAnthracite:'Mat Antrasit Gri (MDFLAM / Lake)',glossWhiteLacquer:'Parlak Beyaz Lake (High-Gloss)',glossCreamLacquer:'Parlak İnci Krem Lake',clearGlass:'Şeffaf Temperli Cam (Alüminyum Çerçeveli)',smokedGlass:'Füme Bronz Cam (Alüminyum Çerçeveli)',clearMirror:'Gümüş Boy Aynası (Taşıyıcı Panelli)',bronzeMirror:'Füme / Bronz Ayna (Taşıyıcı Panelli)',brushedMetal:'Fırçalanmış Antrasit Metal Yüzey'};
export const ROLE_NAMES:Record<string,string>={sidePanel:'Dikme',verticalDivider:'Ara dikme',topPanel:'Üst tabla',bottomPanel:'Alt tabla',backPanel:'Arkalık',plinth:'Baza',topFiller:'Üst klapa',crownMolding:'Taç',wallFiller:'Duvar klapası',decorativeSideTrim:'Dekoratif yan çıta',cornerFiller:'Kör köşe klapası',shelf:'Raf',drawerFront:'Çekmece önü',drawerSide:'Çekmece yanı',drawerBack:'Çekmece arkası',drawerBottom:'Çekmece tabanı',drawerOrganizer:'Çekmece bölücüsü',cornerPolygonShelf:'Beşgen raf',cornerSidePanel:'Köşe dikmesi',cornerBackPanel:'Köşe arkalığı',doorLeaf:'Kapak',cornerAngledDoor:'Köşe kapağı'};
export interface CutEdge { id:string; from:number; to:number; lengthMm:number; interiorAngleDeg:number; turnAngleDeg:number; orientation:string; banding:string }
export interface ProductionPart {
  code:string; sourceId:string; label:string; role:string; runId:string; moduleIds:string[]; cellId?:string; unitId?:string;
  quantity:1; shape:'rectangle'|'polygon'|'assembly'; widthMm:number; heightMm:number; thicknessMm:number;
  materialId:MaterialId; material:string; grain:GrainAxis; areaMm2:number;
  worldCenterMm:[number,number,number]; worldSizeMm:[number,number,number]; rotationYRad:number;
  verticesMm?:Point2DMm[]; originWorldMm?:[number,number]; edges:CutEdge[];
  banding:string; rawCut:string; notes:string[];
}
export interface HardwareItem {code:string;label:string;quantity:number|null;unit:'adet'|'çift'|'mm';detail:string;confirmed:boolean}
export interface ProductionFrontDetail {
  unitId: string;
  frontId?: string;
  partCode: string;
  moduleIds: string[];
  cutSizeMm: [number, number, number];
  closedCenterMm: [number, number, number];
  yRangeMm: [number, number];
  handle: { surfaceMm: [number, number, number]; orientation: NonNullable<HandleConfig['orientation']>; lengthMm: number };
  hardwareCodes: string[];
  motion:
    | { kind: 'hinged'; hingeSide: 'left' | 'right'; pivotMm: [number, number, number]; closedAngleDeg: number; openingAngleDeg: number;
        direction: 1 | -1; clearanceMm?: ResolvedDoorLeaf['clearanceMm']; profile?: ResolvedDoorLeaf['hingeProfile'];
        mounting?: ResolvedDoorLeaf['mounting']; supportPartCode?: string; opening?: ResolvedDoorLeaf['opening'];
        boardMassKg: number | null; hardwareConfirmed: false }
    | { kind: 'sliding'; track: number; overlapMm: number; offsetsMm: [number, number]; bottomGapMm: number; topGapMm: number };
}
export interface ProductionPackage {
  revision:1; designId:string; designName:string; versionName:string; generatedAt:string;
  status:'blocked'|'review'; statusLabel:string; parts:ProductionPart[]; hardware:HardwareItem[];
  materialSummary:{materialId:MaterialId;material:string;thicknessMm:number;quantity:number;areaMm2:number}[];
  issues:ValidationIssue[]; notes:string[];
  runDimensions:{id:string;label:string;axis:string;lengthMm:number;heightMm:number;depthMm:number;rearOffsetMm:number;totalDepthMm:number;frontFromWallMm:number;panelMm:number;backMm:number;construction:string}[];
  outerEnvelopeMm: [number, number, number];
  frontDetails: ProductionFrontDetail[];
  accessStatus: FunctionalAccessStatus;
  functionalAccess: ResolvedFunctionalAccess[];
  surfaceAreasMm2: { physicalShelf: number; netStorage: number; material: number };
}
/** Kimlikte sıra veya etiket kullanılmaz; tekrar çözmede aynı fiziksel parça aynı kodu alır. */
export function partCode(id:string) {let h=2166136261;for(let i=0;i<id.length;i++){h^=id.charCodeAt(i);h=Math.imul(h,16777619);}return `P-${(h>>>0).toString(16).padStart(8,'0').toUpperCase()}`;}
export function materialForPanel(design:Design,p:ResolvedPanel):MaterialId {
  return p.materialIdOverride??(p.materialSlot==='front'?design.materials.frontMaterialId:p.materialSlot==='shelf'?design.materials.shelfMaterialId??design.materials.carcassMaterialId:p.materialSlot==='metal'?'brushedMetal':design.materials.carcassMaterialId);
}
function polygonEdges(vertices:Point2DMm[],banding:string):CutEdge[] {
  return vertices.map((a,i)=>{const b=vertices[(i+1)%vertices.length],prev=vertices[(i+vertices.length-1)%vertices.length];
    const dx=b.xMm-a.xMm,dz=b.zMm-a.zMm,px=prev.xMm-a.xMm,pz=prev.zMm-a.zMm;
    const angle=Math.acos(Math.max(-1,Math.min(1,(dx*px+dz*pz)/(Math.hypot(dx,dz)*Math.hypot(px,pz)))))*180/Math.PI;
    return {id:`E${i+1}`,from:i+1,to:(i+1)%vertices.length+1,lengthMm:Math.hypot(dx,dz),interiorAngleDeg:angle,turnAngleDeg:180-angle,
      orientation:dx!==0&&dz!==0?'Eğik ön kenar':dz===0?(a.zMm===0?'Arka / A duvarı':'Ön / X doğrultusu'):(a.xMm===0?'Arka / B duvarı':'Ön / Z doğrultusu'),banding};
  });
}
export function closedEnvelope(model: ResolvedModel): [number, number, number] {
  const volumes = [
    ...model.panels.filter(panel => !panel.animatedUnitId).map(panelVolume),
    ...model.doors.flatMap(door => hingedVolumes(door, 0)),
    ...(model.slidingDoors ?? []).flatMap(leaf => slidingVolumes(leaf, 0)),
    ...model.drawers.flatMap(drawer => drawerVolumes(drawer, 0)),
    ...(model.slidingSystems ?? []).flatMap(system => system.railBoxes.map(box => boxVolume(box.centerMm, box.sizeMm))),
  ];
  if (!volumes.length) return [0, 0, 0];
  const bounds = polygonBounds(volumes.flatMap(volume => volume.polygon));
  const minY = Math.min(...volumes.map(volume => volume.y0));
  const maxY = Math.max(...volumes.map(volume => volume.y1));
  return [bounds.maxX - bounds.minX, maxY - minY, bounds.maxZ - bounds.minZ];
}
export function extractProduction(design:Design,model:ResolvedModel,versionName='Çalışma kopyası',generatedAt=new Date().toISOString()):ProductionPackage {
  const parts:ProductionPart[]=[],hardware:HardwareItem[]=[],issues=[...model.issues];
  const frontDetails: ProductionFrontDetail[] = [];
  try {
    assertDesignStructure(design);
  } catch (error) {
    if (!(error instanceof DesignConstraintError)) throw error;
    if (!issues.some(issue => issue.code === error.code)) issues.push({
      id: 'production-design-structure', code: error.code, severity: 'error',
      title: 'Geçersiz tasarım yapısı', description: error.message,
    });
  }
  const organizers=new Set(model.drawers.flatMap(d=>(d.organizerPanels??[]).map(p=>p.id)));
  const addPanel=(p:ResolvedPanel,role=p.role as string)=>{
    const materialId=materialForPanel(design,p),isAssembly=['clearGlass','smokedGlass','clearMirror','bronzeMirror'].includes(materialId);
    const banding=['backPanel','cornerBackPanel','drawerBottom'].includes(role)?'Bant yok (montaj biçimi usta kontrolünde)':'E1–E4: bant tipi/kalınlığı ve görünür kenarlar usta onayı bekliyor';
    let vertices:Point2DMm[]|undefined,origin:[number,number]|undefined;
    if(p.polygonXZMm){const b=polygonBounds(p.polygonXZMm);vertices=p.polygonXZMm.map(v=>({xMm:v.xMm-b.minX,zMm:v.zMm-b.minZ}));origin=[b.minX+p.worldPositionMm[0],b.minZ+p.worldPositionMm[2]];}
    const rectangle:Point2DMm[]=[{xMm:0,zMm:0},{xMm:p.cutWidthMm,zMm:0},{xMm:p.cutWidthMm,zMm:p.cutHeightMm},{xMm:0,zMm:p.cutHeightMm}];
    const notes:string[]=[];
    if(p.bayIds&&p.bayIds.length>1)notes.push('Paylaşımlı fiziksel dikme: kapsadığı bölmeler için yalnız bir kez üretilir.');
    if(p.isDecorativeTrim)notes.push('Dekoratif parça: profil/kordon kesiti ve köşe birleşimi usta tarafından belirlenir.');
    if(isAssembly)notes.push('Ölçü çerçeve/taşıyıcı panelli dış montaj zarfıdır. Cam/ayna, taşıyıcı ve profilin ayrı kalınlıkları/net kesimleri üreticiye bağlıdır; bu satır levha kesim emri değildir.');
    if(p.animatedUnitId?.startsWith('slide-'))notes.push('Kanat ölçüsü planlama geometrisidir; seçilecek ray üreticisinin düşüm ve profil değerleriyle doğrulanır.');
    if(role==='drawerFront')notes.push('Bu yapıda çekmece önü kasanın ön duvarıdır; ayrıca ikinci bir iç ön panel modellenmemiştir.');
    if(vertices)notes.push('Dikdörtgen ölçü yalnız dış sınırdır. Kesim şekli V noktaları ve E kenarlarından okunur; eğik kenarı dikdörtgen kesmeyin.');
    const edges=polygonEdges(vertices??rectangle,banding);
    const hinged = p.animatedUnitId && model.doors.find(door => door.id === p.animatedUnitId);
    parts.push({code:partCode(p.id),sourceId:p.id,label:p.label,role,runId:p.runId,moduleIds:(hinged ? hinged.bayIds : p.bayIds)??(p.bayId?[p.bayId]:p.id.includes('-')?[design.junctions.find(j=>p.id.startsWith(j.id))?.id??p.runId]:[p.runId]),cellId:p.cellId,unitId:p.animatedUnitId,quantity:1,
      shape:isAssembly?'assembly':vertices?'polygon':'rectangle',widthMm:p.cutWidthMm,heightMm:p.cutHeightMm,thicknessMm:p.cutThicknessMm,materialId,material:MATERIAL_NAMES[materialId],grain:p.grainAxis,areaMm2:vertices?polygonAreaMm2(vertices):p.cutWidthMm*p.cutHeightMm,
      worldCenterMm:p.worldPositionMm,worldSizeMm:p.boxSizeMm,rotationYRad:p.rotationYRad,verticesMm:vertices,originWorldMm:origin,edges,
      banding:vertices?'E kenarları: görünür eğik ön kenar dahil bant planı usta onayı bekliyor':banding,
      rawCut:isAssembly?'Cam/profil ham kesimi belirlenmedi':'Nominal bitmiş geometri; bant payı / kanal / zıvana düşümü uygulanmadı',notes});
  };
  for(const p of model.panels) {
    if(p.role==='hangingRod'){hardware.push({code:`H-${partCode(p.id).slice(2)}`,label:p.label,quantity:p.cutWidthMm,unit:'mm',detail:`Boru ekseni yerden Y=${p.worldPositionMm[1]} mm; modül ${p.bayId??p.runId}. Kesim boyu; uç bağlantı payı katalogla doğrulanır. İki boru taşıyıcısı gerekir.`,confirmed:false});hardware.push({code:`H-BR-${partCode(p.id).slice(2)}`,label:`${p.label} taşıyıcı`,quantity:2,unit:'adet',detail:'Ürün ve montaj deliği belirlenmedi.',confirmed:false});continue;}
    if(p.role==='cabinetFoot'){hardware.push({code:`H-${partCode(p.id).slice(2)}`,label:p.label,quantity:1,unit:'adet',detail:`Yükseklik zarfı ${p.boxSizeMm[1]} mm; yük kapasitesi/ayak tipi doğrulanmalı.`,confirmed:false});continue;}
    if(p.role==='drawerBox'&&!organizers.has(p.id))continue;
    const role = organizers.has(p.id) ? 'drawerOrganizer' : p.role === 'cornerPolygonShelf'
      ? p.id.endsWith('-top-pentagon') ? 'topPanel' : p.id.endsWith('-bottom-pentagon') ? 'bottomPanel' : p.role
      : p.role;
    addPanel(p, role);
  }
  for(const d of model.drawers) {
    const local=(v:[number,number,number]):[number,number,number]=>d.wallAxis==='B'?[v[2],v[1],v[0]]:v;
    const components=[
      {suffix:'left',label:'Sol yan',role:'drawerSide',size:d.leftSideBoxSizeMm,pos:d.leftSideWorldPositionMm},
      {suffix:'right',label:'Sağ yan',role:'drawerSide',size:d.rightSideBoxSizeMm,pos:d.rightSideWorldPositionMm},
      {suffix:'back',label:'Arka',role:'drawerBack',size:d.backPanelBoxSizeMm,pos:d.backPanelWorldPositionMm},
      {suffix:'bottom',label:'Taban',role:'drawerBottom',size:d.bottomPanelBoxSizeMm,pos:d.bottomPanelWorldPositionMm},
    ];
    for(const c of components){const s=local(c.size),bottom=c.role==='drawerBottom',side=c.role==='drawerSide';
      addPanel({id:`${d.id}-part-${c.suffix}`,label:`${d.label} · ${c.label}`,runId:d.runId,bayId:d.bayId,cellId:d.cellId,role:'drawerBox',shapeKind:'box',cutWidthMm:side?s[2]:s[0],cutHeightMm:bottom?s[2]:s[1],cutThicknessMm:bottom?s[1]:side?s[0]:s[2],worldPositionMm:c.pos,boxSizeMm:c.size,rotationYRad:0,grainAxis:'horizontal',materialSlot:'carcass',animatedUnitId:d.id},c.role);
    }
    hardware.push({code:`H-RAY-${partCode(d.id).slice(2)}`,label:`${d.label} teleskopik ray`,quantity:1,unit:'çift',detail:`Planlanan çıkma ${d.maxSlideMm} mm (%${Math.round(d.slideRatio * 100)}). Kasa derinliği ${d.depthMm} mm. Ürün boyu/yükü, yan payı ve montaj delikleri katalogla doğrulanmalı.`,confirmed:false});
  }
  for(const d of [...model.doors,...(model.slidingDoors??[])]) {
    const handle=d.handleConfig??design.materials.doorHandleConfig;
    const key = partCode(d.id).slice(2);
    const handleCode = `H-KULP-${key}`;
    const handleLengthMm = 'maxAngleDeg' in d ? d.handleLengthMm : d.handleConfig.lengthMm;
    hardware.push({code:handleCode,label:`${d.label} kulp`,quantity:1,unit:'adet',detail:handle?`${handle.styleId} / ${handle.finishId} / nominal ${handleLengthMm} mm. Delik aksı katalogla doğrulanır.`:'Kulp tipi ve delik aksı katalogla doğrulanır.',confirmed:false});
    const part = parts.find(part => part.unitId === d.id);
    if (!part) continue;
    const base = {
      unitId: d.id, frontId: d.frontId, partCode: part.code, moduleIds: d.bayIds,
      cutSizeMm: [part.widthMm, part.heightMm, part.thicknessMm] as [number, number, number],
      closedCenterMm: part.worldCenterMm, yRangeMm: [d.yStartMm, d.yEndMm] as [number, number],
      handle: { surfaceMm: 'maxAngleDeg' in d ? hingedHandleSurface(d) : d.handleSurfaceWorldMm, orientation: handle?.orientation ?? 'vertical' as const, lengthMm: handleLengthMm },
    };
    if ('maxAngleDeg' in d) {
      const hingeCode = `H-MEN-${key}`;
      const boardMassKg = estimatedBoardMassKg(d.widthMm, d.heightMm, d.thicknessMm, part.materialId);
      hardware.push({code:hingeCode,label:`${d.label} menteşe`,quantity:null,unit:'adet',
        detail:`Nominal ${d.maxAngleDeg}°, ${d.hingeSide==='left'?'sol':'sağ'}. ${boardMassKg===null?'Cam/ayna montaj kütlesi belirlenmedi.':`Levha ~${boardMassKg.toFixed(1)} kg (750 kg/m³, kulp hariç).`} Ürün, menteşe adedi ve delikler doğrulanmalı.`,confirmed:false});
      frontDetails.push({ ...base, hardwareCodes: [hingeCode, handleCode], motion: {
        kind: 'hinged', hingeSide: d.hingeSide, pivotMm: d.pivotWorldMm, closedAngleDeg: d.closedRotationYRad * 180 / Math.PI,
        openingAngleDeg: d.maxAngleDeg, direction: d.openRotationDirection, clearanceMm: d.clearanceMm,
        profile: d.hingeProfile, mounting: d.mounting, opening: d.opening, boardMassKg, hardwareConfirmed: false,
        supportPartCode: d.hingeSupportPanelId ? partCode(d.hingeSupportPanelId) : undefined,
      }});
    } else {
      const system = model.slidingSystems?.find(candidate => candidate.frontId === d.frontId);
      if (!system) continue;
      const systemKey = partCode(d.frontId).slice(2);
      frontDetails.push({ ...base, hardwareCodes: [`H-SR-${systemKey}`, `H-SET-${systemKey}`, handleCode], motion: {
        kind: 'sliding', track: d.trackIndex + 1, overlapMm: system.overlapMm, offsetsMm: [d.minOffsetMm, d.maxOffsetMm],
        bottomGapMm: d.yStartMm - system.yStartMm, topGapMm: system.yEndMm - d.yEndMm,
      }});
    }
  }
  for(const d of model.drawers)hardware.push({code:`H-KULP-${partCode(d.id).slice(2)}`,label:`${d.label} kulp`,quantity:1,unit:'adet',detail:`${d.handleConfig?.styleId??'barModern'} / ${d.handleConfig?.finishId??'matteBlack'} / nominal ${d.handleConfig?.lengthMm??0} mm; montaj aksı katalogla doğrulanır.`,confirmed:false});
  for(const s of model.slidingSystems??[]) {
    hardware.push({code:`H-SR-${partCode(s.frontId).slice(2)}`,label:`${s.frontId} alt + üst ${s.trackCount} yollu ray`,quantity:2,unit:'adet',detail:`Her profil ${s.openingWidthMm} mm boy; ${s.trackDepthMm} mm derinlik zarfı, ${s.trackSpacingMm} mm eksen. Gerçek profil kesiti, kesim düşümü ve montaj delikleri belirlenmedi.`,confirmed:false});
    hardware.push({code:`H-SET-${partCode(s.frontId).slice(2)}`,label:`${s.frontId} sürgü kanat mekanizması`,quantity:model.slidingDoors?.filter(l=>l.frontId===s.frontId).length??0,unit:'adet',detail:'Her kanada bir mekanizma seti; teker/klavuz/stoper/yavaşlatıcı adedi üretici sistemine bağlı.',confirmed:false});
  }
  for(const led of model.ledStrips)hardware.push({code:`H-LED-${partCode(led.id).slice(2)}`,label:`LED ${led.kind}`,quantity:Math.max(...led.boxSizeMm),unit:'mm',detail:'Şerit boyu planlaması; profil, sürücü gücü, kablo ve kesim modülü elektrikçi/üretici kontrolünde.',confirmed:false});
  const adjustableShelves=model.panels.filter(p=>p.role==='shelf'&&model.cells.some(c=>c.id===p.cellId&&c.insert?.adjustable===true)).length;
  if(adjustableShelves)hardware.push({code:'H-RAF-PIM',label:'Ayarlanabilir raf destek pimi',quantity:adjustableShelves*4,unit:'adet',detail:`${adjustableShelves} rafta dört destek/raf varsayımı. Sistem, yük, delik çapı ve aksı usta/üreticiyle doğrulanır.`,confirmed:false});
  hardware.push({code:'H-BAGLANTI',label:'Gövde / sabit raf bağlantıları',quantity:null,unit:'adet',detail:'Vida, kavela, minifix veya köşebent yöntemi seçilmedi. Adet, kenar mesafeleri ve delik programı belirlenmedi.',confirmed:false});
  hardware.push({code:'H-DUVAR',label:'Duvara sabitleme / devrilme önleyici',quantity:null,unit:'adet',detail:'Duvar malzemesi, bağlantı ürünü, yük ve yerinde tesisat kontrolünden sonra usta tarafından seçilir.',confirmed:false});
  if(model.ledStrips.length)hardware.push({code:'H-LED-GUC',label:'LED sürücüsü / anahtar / kablo',quantity:null,unit:'adet',detail:'W/metre, şerit voltajı, güç kaynağı rezervi ve kablo güzergâhı seçilmedi. Elektrikçi/üretici kontrolü gerekir.',confirmed:false});
  const seen=new Set<string>();
  for(const p of parts){
    if(seen.has(p.code))issues.push({id:`bom-duplicate-${p.code}`,code:'PRODUCTION_DUPLICATE',severity:'error',title:'Üretim parça kimliği tekrarı',description:p.code});seen.add(p.code);
    if([p.widthMm,p.heightMm,p.thicknessMm].some(n=>!Number.isSafeInteger(n)||n<=0)||!Number.isFinite(p.areaMm2)||p.areaMm2<=0)issues.push({id:`bom-size-${p.code}`,code:'PRODUCTION_INVALID_SIZE',severity:'error',title:'Geçersiz parça ölçüsü',description:`${p.code}: ${p.label}`});
    if(p.verticesMm){const b=polygonBounds(p.verticesMm);if(b.maxX>p.widthMm+.01||b.maxZ>p.heightMm+.01)issues.push({id:`bom-polygon-${p.code}`,code:'PRODUCTION_POLYGON_BOUNDS',severity:'error',title:'Poligon dış sınırı tutarsız',description:p.code});}
  }
  const groups=new Map<string,ProductionPackage['materialSummary'][number]>();
  for(const p of parts.filter(p=>p.shape!=='assembly')){const key=`${p.materialId}:${p.thicknessMm}`,g=groups.get(key)??{materialId:p.materialId,material:p.material,thicknessMm:p.thicknessMm,quantity:0,areaMm2:0};g.quantity++;g.areaMm2+=p.areaMm2;groups.set(key,g);}
  issues.push(...staticProductionIssues(model, parts));
  if (!parts.length) issues.push({
    id: 'production-empty', code: 'PRODUCTION_EMPTY', severity: 'error',
    title: 'Fiziksel üretim parçası bulunamadı', description: 'Tasarım yapısını ve ölçüleri kontrol edin.',
  });
  const blocked=issues.some(i=>i.severity==='error');
  const functionalAccess = model.analysis?.functionalAccess ?? [];
  const accessStatus = functionalAccess.some(entry => entry.status === 'blocked') ? 'blocked'
    : !functionalAccess.length || functionalAccess.some(entry => entry.status === 'unverified') ? 'unverified' : 'usable';
  const statusLabel = blocked ? 'ÜRETİM ÇIKTISI ENGELLİ · GEOMETRİ'
    : accessStatus === 'blocked' ? 'KULLANIM ENGELİ · TANISAL PAFTA'
    : accessStatus === 'unverified' ? 'ERİŞİM VE USTA KONTROLÜ GEREKİR' : 'USTA KONTROLÜ GEREKİR';
  return {revision:1,designId:design.id,designName:design.name,versionName,generatedAt,status:blocked?'blocked':'review',statusLabel,parts,hardware,materialSummary:[...groups.values()].sort((a,b)=>a.material.localeCompare(b.material)||a.thicknessMm-b.thicknessMm),issues,accessStatus,functionalAccess,
    runDimensions:design.runs.map(r=>{
      const railMm = Math.max(0,...(model.slidingSystems??[]).filter(s=>s.runId===r.id).map(s=>s.trackDepthMm));
      return {id:r.id,label:r.label,axis:r.wallAxis,lengthMm:r.lengthMm,heightMm:r.heightMm,depthMm:r.depthMm,rearOffsetMm:r.rearOffsetMm??0,totalDepthMm:r.depthMm+railMm,frontFromWallMm:runFrontMm(r)+railMm,panelMm:r.panelThicknessMm,backMm:r.backPanelThicknessMm,construction:r.constructionMode==='shared'?'Paylaşımlı dikme':'Ayrı gövdeler (eski şema korunur)'};
    }),
    outerEnvelopeMm: closedEnvelope(model),
    frontDetails,
    surfaceAreasMm2: {
      physicalShelf: parts.filter(p => p.role === 'shelf' || p.role === 'cornerPolygonShelf').reduce((sum, part) => sum + part.areaMm2, 0),
      netStorage: Object.values(model.analysis?.metrics ?? {}).reduce((sum, owner) => sum + owner.shelfAreaMm2, 0),
      material: [...groups.values()].reduce((sum, group) => sum + group.areaMm2, 0),
    },
    notes:[
      'Tüm ölçüler mm. Tablo ölçüleri modellenen nominal bitmiş parça geometrisidir. Testere payı, bant kalınlığı, kanal/zıvana ve bağlantı düşümleri ayrıca usta tarafından belirlenir; otomatik ham kesim payı uygulanmaz.',
      'Dikdörtgen parçada W yatay kesim ekseni, H ikinci kesim eksenidir. Damar yatay ise W, dikey ise H boyunca ilerler. E1 alt, E2 sağ, E3 üst, E4 sol kenardır; yönler parçaya önden bakış içindir. Poligonda çizimdeki V/E sırası geçerlidir.',
      'Beşgen parçalar dış dikdörtgene indirgenmez: V koordinatları, tüm E boyları ve köşe iç açıları çizimlerde verilir. Koordinatlar kesimi tanımlar; eğik uzunluk/açı gösterimleri 0,1 mm / 0,1° hassasiyetle yuvarlatılır.',
      'Paylaşımlı dikme yalnız bir fiziksel parça olarak listelenir. Ayrı gövde şemasındaki komşu iki panel otomatik birleştirilmez.',
      'Çekmece: yapısal ön + sol/sağ yan + arka + taban = 5 parça; varsa organizatörler ayrıdır. Görsel dış kutu kesim listesine girmez. Kutu önü ve kapak aynı parçadır; bağımsız iç ön duvar bu modelde yoktur.',
      'Ray ve menteşe zarfları planlama verisidir. Menteşe adedi ve kulp seçimi, bağlantı elemanları, delik/kupa çapları ve aksları, raf pimleri, duvara sabitleme, taşıma kapasitesi ve güvenli montaj usta tarafından kesinleştirilir.',
      'Yerinde ölçü; duvar eğriliği/diklik, şap-kot, süpürgelik, elektrik/havalandırma, klapa alıştırması ve servis çıkarma payları kontrol edilmelidir. Yazılım fabrika üretim onayı vermez.',
      'Montaj sırası önerisi: yerinde ölçü → baza/ayak ve kot → gövdeler/ortak dikmeler → arkalık ve sabitleme → raf/askı → çekmece ve donanım → ray/kapak → klapa/taç → LED ve son açıklık kontrolü.',
    ]};
}

export function assertProductionReady(pkg:ProductionPackage) {if(pkg.status==='blocked')throw new Error('Kritik geometri hataları giderilmeden üretim CSV/PDF paketi indirilemez. Uyarı listesindeki kırmızı hataları düzeltin.');}

export function polygonCutGroups(pkg: ProductionPackage, compact: boolean) {
  const groups = new Map<string, { id: string; parts: ProductionPart[] }>();
  for (const part of pkg.parts) {
    if (!part.verticesMm) continue;
    const key = compact
      ? JSON.stringify([part.verticesMm, part.thicknessMm, part.materialId, part.grain, part.banding, part.edges.map(edge => edge.banding)])
      : part.code;
    const group = groups.get(key);
    if (group) group.parts.push(part);
    else groups.set(key, { id: '10-' + part.code, parts: [part] });
  }
  return [...groups.values()];
}
