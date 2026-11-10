import { ZodError } from 'zod';
import { parseDesignJson } from '../schema/designSchema';
import type { Design, ResolvedModel } from '../schema/types';
import { solveDesign } from '../solver/carcassSolver';
import { closedEnvelope, extractProduction } from '../production/productionModel';

export interface ImportPreview {design?:Design;resolved?:ResolvedModel;errors:string[];warnings:string[]}
export const designSignature=(d:Design)=>JSON.stringify(d,(_k,v:unknown)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);

/** JSON dışında kod çalıştırılmaz. Önizleme çalışma kopyasını hiçbir zaman değiştirmez. */
export function previewDesignJson(text:string):ImportPreview {
  try {
    const design = parseDesignJson(text);
    const resolved=solveDesign(design),production=extractProduction(design,resolved);
    return {design,resolved,errors:production.issues.filter(i=>i.severity==='error').map(i=>`${i.code}: ${i.description}`),warnings:production.issues.filter(i=>i.severity==='warning'||i.severity==='expert').map(i=>`${i.title}: ${i.description}`)};
  } catch(error) {
    const errors=error instanceof ZodError?error.issues.map(i=>`${i.path.join('.')||'tasarım'}: ${i.message}`):[error instanceof Error?error.message:'Geçersiz JSON.'];
    return {errors,warnings:[]};
  }
}
export function buildExternalAiPrompt(design:Design,request:string) {
  return `Wardrobe Studio tasarımını iyileştir. İstek: ${request.trim()||'Net depolamayı ve erişimi iyileştir; oda ölçülerini koru.'}

Yanıtın yalnızca tam ve geçerli bir JSON Design nesnesi olsun (Markdown, açıklama veya yama kullanma). Başlangıç nesnesinin tüm gerekli alanlarını ve mevcut kimliklerini koru. schemaVersion 1. Her mm değeri pozitif/tutarlı tamsayı, sıfıra izin veren boşluklar negatif olmayan tamsayı olmalı. Esnek ağırlıklar pozitif sayıdır. Aşağıdaki tam nesne şema ve mevcut proje örneğidir.

Kurallar:
- Design kullanıcı niyetidir: çözülmüş koordinat, kesim listesi veya 3D mesh ekleme. Yeni nesnelere benzersiz kimlik ver.
- runs[].wallAxis A/B; L tasarımında junction.runAId/runBId mevcut A/B kollarına bağlanır. Oda ölçüleri ve engelleri izinsiz değiştirme.
- panelThicknessMm ve backPanelThicknessMm her koldan okunur. constructionMode shared: N bölmede N+1 dikme, separate: bağımsız gövdeler. Eksik constructionMode eski separate anlamındadır; kendiliğinden değiştirme.
- Bay.width: {kind:"fixed",mm:...} veya {kind:"flex",weight:...,minMm?:...,maxMm?:...}; sabitler + dikmeler toplamı kolun kullanılabilir açıklığını aşmasın.
- SplitNode horizontal alt-üst raf, vertical sol-sağ dikmedir. split.children öğesi id,size,node alanlarını taşır; leaf insert veya null taşır. Hücre ölçüleri çözücüden türetilir.
- front türleri hinged/sliding/open; runId ve yalnız o koldaki bitişik bayIds gerekir. Çekmece önleri insert drawerBank içinden türetilir; bağımsız drawerFront kaydı üretme. yStartMm < yEndMm, gövde yüksekliği içinde olmalı. Aynı bölme ve düşey aralıkta çakışan kapak sistemleri kurma.
- Menteşeli: hingeSide auto/left/right/double, openingAngleDeg 110/155/165. hingeMount inset yalnız tek net bölme için kullanılabilir. Kısmi yükseklikte farklı aralıklar karma cephe oluşturabilir.
- Front düşey sınırları: yStartMm/yEndMm varsayılan olarak mutlak kottur. yStartAnchor carcass/drawers ile ilgili alt referanstan yukarı, top ile üst gövde kotundan aşağı ofsettir. yEndAnchor top, üst gövde kotundan aşağı ofsettir. Kanat kesim ölçüsü üretme.
- Sürgülü: sliding {trackCount:2|3,leafCount:2..6,overlapMm:0..100,trackDepthMm:50..250,trackSpacingMm:15..80,verticalGapMm:0..60,leafWidthsMm?:[...],trackIndices?:[0|1|2,...]}. Ray gövdenin önüne eklenir. spacing >= panelThickness+2; depth >= 8+panelThickness+(trackCount-1)*spacing+10. Genişlik toplamı açıklık+(N-1)*overlap; komşu örtüşen kanatlar farklı raylarda. Özel genişlikten emin değilsen leafWidthsMm alanını kaldır. Gömme recessedJ kulp tercih et, erişim ve iç çekmeceleri denetle.
- materialId yalnız başlangıçtaki katalog değerlerinden veya warmOak/lightNordicOak/smokedOak/naturalWalnut/darkWalnut/matteWhite/creamAlabaster/linenBeige/sageGreen/softAnthracite/glossWhiteLacquer/glossCreamLacquer/clearGlass/smokedGlass/clearMirror/bronzeMirror/brushedMetal olabilir.
- Beşgen köşe ön açıklığı sqrt((ArmA-DB)^2+(ArmB-DA)^2). Kör köşe fillerWidthMm en az 45. Mevcut ergonomi/envanter/LED/bitiş/eşya alanlarını koru.
- Montaj deliği, CNC veya kesin donanım onayı uydurma. Kullanıcı içe aktarmadan önce yerel doğrulama yapacak.

TAM BAŞLANGIÇ DESIGN JSON:
${JSON.stringify(design,null,2)}`;
}
export interface DesignMetrics {parts:number;panelsAreaM2:number;physicalShelfAreaM2:number;hangingMm:number;shelfAreaM2:number;drawerLitres:number;storageLitres:number;doors:number;drawers:number;errors:number;warnings:number;inventoryShortfall:number}
export function designMetrics(design:Design,model=solveDesign(design)):DesignMetrics {
  const p=extractProduction(design,model),metrics=Object.values(model.analysis?.metrics??{});
  return {parts:p.parts.length,panelsAreaM2:p.surfaceAreasMm2.material/1e6,physicalShelfAreaM2:p.surfaceAreasMm2.physicalShelf/1e6,hangingMm:model.summary.totalHangingLengthMm,shelfAreaM2:model.summary.totalShelfAreaM2,drawerLitres:metrics.reduce((s,m)=>s+m.drawerVolumeMm3,0)/1e6,storageLitres:metrics.reduce((s,m)=>s+m.storageVolumeMm3,0)/1e6,doors:model.doors.length+(model.slidingDoors?.length??0),drawers:model.drawers.length,errors:p.issues.filter(i=>i.severity==='error').length,warnings:p.issues.filter(i=>i.severity==='warning'||i.severity==='expert').length,inventoryShortfall:model.analysis?.inventory.reduce((s,i)=>s+i.shortfall,0)??0};
}

export function designDimensions(design: Design, model = solveDesign(design)) {
  const a = design.runs.find(run => run.wallAxis === 'A');
  const b = design.runs.find(run => run.wallAxis === 'B');
  return {
    layout: design.layoutKind === 'l-shape' ? 'L' : 'Düz',
    depthRelation: !b ? 'Tek kol' : a?.depthMm === b.depthMm ? 'Eşit derinlik' : 'Asimetrik derinlik',
    lengthA: a?.lengthMm, lengthB: b?.lengthMm,
    depthA: a?.depthMm, depthB: b?.depthMm,
    rearA: a ? a.rearOffsetMm ?? 0 : undefined, rearB: b ? b.rearOffsetMm ?? 0 : undefined,
    height: Math.max(0, ...design.runs.map(run => run.heightMm)),
    outer: closedEnvelope(model),
  };
}
