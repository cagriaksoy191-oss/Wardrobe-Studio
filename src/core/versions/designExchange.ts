import { ZodError } from 'zod';
import { parseDesignJson } from '../schema/designSchema';
import type { Design, ResolvedModel } from '../schema/types';
import { solveDesign } from '../solver/carcassSolver';
import { closedEnvelope, extractProduction, MATERIAL_NAMES } from '../production/productionModel';

export interface ImportPreview {design?:Design;resolved?:ResolvedModel;errors:string[];warnings:string[]}
export const designSignature=(d:Design)=>JSON.stringify(d,(_k,v:unknown)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);

const TYPE_LABELS_TR: Record<string, string> = {
  string: 'metin',
  number: 'sayı',
  int: 'tam sayı',
  integer: 'tam sayı',
  boolean: 'mantıksal değer (true/false)',
  object: 'nesne',
  array: 'dizi',
  undefined: 'boş/eksik değer',
  null: 'null',
  record: 'nesne',
};

function labelTypeTr(raw?: string): string {
  if (!raw) return 'geçerli değer';
  const normalized = raw.toLowerCase();
  return TYPE_LABELS_TR[normalized] ?? raw;
}

function localizeZodIssue(issue: ZodError['issues'][number]): string {
  const path = issue.path.join('.') || 'tasarım';
  const raw = issue as unknown as Record<string, unknown>;
  const code = String(issue.code ?? '');
  const message = issue.message ?? '';

  if (code === 'invalid_type') {
    const expected = typeof raw.expected === 'string' ? raw.expected : undefined;
    const received = typeof raw.received === 'string' ? raw.received : undefined;
    if (received === 'undefined' || /received undefined/i.test(message)) {
      return `${path}: zorunlu alan eksik${expected ? ` (beklenen: ${labelTypeTr(expected)})` : ''}.`;
    }
    return `${path}: geçersiz veri türü${expected ? ` (beklenen: ${labelTypeTr(expected)})` : ''}.`;
  }

  if (code === 'invalid_value' || code === 'invalid_literal' || code === 'invalid_enum_value') {
    const values = Array.isArray(raw.values)
      ? raw.values
      : Array.isArray(raw.options)
        ? raw.options
        : raw.expected !== undefined
          ? [raw.expected]
          : [];
    if (values.length === 1) {
      return `${path}: geçersiz değer (beklenen: ${String(values[0])}).`;
    }
    if (values.length > 1) {
      return `${path}: geçersiz seçenek (izin verilenler: ${values.map(String).join(', ')}).`;
    }
    return `${path}: geçersiz seçenek değeri.`;
  }

  if (code === 'too_small') {
    const min = raw.minimum;
    const origin = String(raw.origin ?? raw.type ?? 'number');
    if (origin === 'string') return `${path}: en az ${String(min)} karakter olmalı.`;
    if (origin === 'array') return `${path}: en az ${String(min)} öğe içermeli.`;
    const inclusive = raw.inclusive !== false;
    return `${path}: ${inclusive ? `en az ${String(min)}` : `${String(min)} değerinden büyük`} olmalı.`;
  }

  if (code === 'too_big') {
    const max = raw.maximum;
    const origin = String(raw.origin ?? raw.type ?? 'number');
    if (origin === 'string') return `${path}: en fazla ${String(max)} karakter olabilir.`;
    if (origin === 'array') return `${path}: en fazla ${String(max)} öğe içerebilir.`;
    const inclusive = raw.inclusive !== false;
    return `${path}: ${inclusive ? `en fazla ${String(max)}` : `${String(max)} değerinden küçük`} olabilir.`;
  }

  if (code === 'invalid_format' || code === 'invalid_string') {
    const fmt = typeof raw.format === 'string' ? raw.format : '';
    if (fmt === 'int' || fmt === 'safeint') return `${path}: tam sayı olmalı.`;
    return `${path}: geçersiz biçim.`;
  }

  if (code === 'unrecognized_keys') {
    const keys = Array.isArray(raw.keys) ? raw.keys.map(String).join(', ') : '';
    return `${path}: tanınmayan alanlar (${keys}).`;
  }

  if (code === 'invalid_union') {
    return `${path}: geçerli tasarım şeması seçeneklerinden hiçbiriyle eşleşmiyor.`;
  }

  if (code === 'not_multiple_of') {
    return `${path}: ${String(raw.divisor ?? '')} katı olmalı.`;
  }

  if (/\b(invalid|expected|received|too small|too big|required|unrecognized)\b/i.test(message)) {
    return `${path}: geçersiz veya eksik değer.`;
  }

  return `${path}: ${message || 'geçersiz değer.'}`;
}

/** JSON dışında kod çalıştırılmaz. Önizleme çalışma kopyasını hiçbir zaman değiştirmez. */
export function previewDesignJson(text:string):ImportPreview {
  if (new TextEncoder().encode(text).length > 2_000_000) {
    return { errors: ['JSON en fazla 2 MB olabilir.'], warnings: [] };
  }
  if (/^\s*```/.test(text)) {
    return {
      errors: [
        'Markdown kod bloğu (```json) kabul edilmez. Yapay zekâ yanıtından yalnızca { ... } ile başlayan ham JSON metnini yapıştırın.',
      ],
      warnings: [],
    };
  }
  if (!text.trim()) {
    return {
      errors: ['JSON metni boş. Yapay zekâ yanıtından yalnızca { ... } ile başlayan ham JSON metnini yapıştırın.'],
      warnings: [],
    };
  }
  try {
    const design = parseDesignJson(text);
    const resolved=solveDesign(design),production=extractProduction(design,resolved);
    return {design,resolved,errors:production.issues.filter(i=>i.severity==='error').map(i=>`${i.code}: ${i.description}`),warnings:production.issues.filter(i=>i.severity==='warning'||i.severity==='expert').map(i=>`${i.title}: ${i.description}`)};
  } catch(error) {
    if (error instanceof ZodError) {
      return { errors: error.issues.map(localizeZodIssue), warnings: [] };
    }
    if (error instanceof SyntaxError) {
      return {
        errors: [
          'JSON sözdizimi geçersiz. Eksik virgül, kapanmamış süslü parantez/tırnak işareti veya JSON dışı açıklama metni olmadığından emin olun.',
        ],
        warnings: [],
      };
    }
    return { errors: [error instanceof Error ? error.message : 'Geçersiz JSON.'], warnings: [] };
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
  const height = Math.max(0, ...design.runs.map(run => run.heightMm));
  const roomHeightMm = design.roomHeightMm ?? Math.max(height + 100, 2550);
  const carcassMaterial = MATERIAL_NAMES[design.materials.carcassMaterialId] ?? design.materials.carcassMaterialId;
  const frontMaterial = MATERIAL_NAMES[design.materials.frontMaterialId] ?? design.materials.frontMaterialId;
  return {
    layout: design.layoutKind === 'l-shape' ? 'L' : 'Düz',
    depthRelation: !b ? 'Tek kol' : a?.depthMm === b.depthMm ? 'Eşit derinlik' : 'Asimetrik derinlik',
    lengthA: a?.lengthMm, lengthB: b?.lengthMm,
    depthA: a?.depthMm, depthB: b?.depthMm,
    rearA: a ? a.rearOffsetMm ?? 0 : undefined, rearB: b ? b.rearOffsetMm ?? 0 : undefined,
    height,
    roomHeightMm,
    carcassMaterial,
    frontMaterial,
    outer: closedEnvelope(model),
  };
}
