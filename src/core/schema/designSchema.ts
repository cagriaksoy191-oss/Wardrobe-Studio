import { assertDesignStructure } from './designConstraints';
import { z } from 'zod';
import type { Design } from './types';

const IntMm = z.number().int();
const PositiveIntMm = z.number().int().positive();
const NonNegativeIntMm = z.number().int().min(0);

export const SizeSpecSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('fixed'),
    mm: PositiveIntMm,
  }),
  z.object({
    kind: z.literal('flex'),
    weight: z.number().positive(),
    minMm: PositiveIntMm.optional(),
    maxMm: PositiveIntMm.optional(),
  }),
]);

export const OwnerTypeSchema = z.enum(['anne', 'baba', 'ortak']);

export const MaterialIdSchema = z.enum([
  'warmOak',
  'lightNordicOak',
  'smokedOak',
  'naturalWalnut',
  'darkWalnut',
  'matteWhite',
  'creamAlabaster',
  'linenBeige',
  'sageGreen',
  'softAnthracite',
  'glossWhiteLacquer',
  'glossCreamLacquer',
  'clearGlass',
  'smokedGlass',
  'clearMirror',
  'bronzeMirror',
  'brushedMetal',
]);

export const HandleConfigSchema = z.object({
  styleId: z.enum([
    'barModern',
    'knobMinimal',
    'profileVertical',
    'classicCurve',
    'recessedJ',
    'edgeLip',
  ]),
  finishId: z.enum(['matteBlack', 'brushedInox', 'antiqueBronze', 'warmGold', 'bodyMatch']),
  lengthMm: PositiveIntMm.min(30).max(1600),
  placement: z.enum(['middle', 'top', 'bottom', 'verticalEdge']),
  orientation: z.enum(['vertical', 'horizontal']).optional(),
  offsetFromEdgeMm: PositiveIntMm.min(10).max(150).optional(),
  verticalOffsetMm: IntMm.min(-600).max(600).optional(),
});

export const InteriorItemPresetSchema = z.enum([
  'auto',
  'shirts',
  'jackets',
  'trousers',
  'longDresses',
  'foldedClothes',
  'shoes',
  'bags',
  'storageBoxes',
  'hurc',
  'suitcases',
  'none',
]);

export const ServiceItemSpecSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  widthMm: PositiveIntMm,
  depthMm: PositiveIntMm,
  heightMm: PositiveIntMm,
  liftClearanceMm: NonNegativeIntMm.max(500).optional(),
});

export const InsertConfigSchema = z.object({
  type: z.enum([
    'shelfStack',
    'hangingRod',
    'doubleHanging',
    'drawerBank',
    'shoeRack',
    'serviceNiche',
    'beddingYukluk',
    'empty',
  ]),
  shelfCount: z.number().int().min(1).max(12).optional(),
  adjustable: z.boolean().optional(),
  shelfPinRows: z.array(PositiveIntMm).min(1).max(12).optional(),
  rodHeightType: z.enum(['short', 'medium', 'long']).optional(),
  drawerCount: z.number().int().min(1).max(8).optional(),
  drawerSlide: z.enum(['partial', 'full']).optional(),
  isInternalDrawer: z.boolean().optional(),
  drawerFrontHeightsMm: z.array(PositiveIntMm).optional(),
  drawerFrontMaterialId: MaterialIdSchema.optional(),
  frontMaterialId: MaterialIdSchema.optional(),
  handleConfig: HandleConfigSchema.optional(),
  shoeTiers: z.number().int().min(1).max(10).optional(),
  serviceItems: z.array(ServiceItemSpecSchema).optional(),
  handClearanceMm: NonNegativeIntMm.optional(),
  itemPreset: InteriorItemPresetSchema.optional(),
  itemCountOverride: z.number().int().min(0).max(40).optional(),
  ledEnabled: z.boolean().optional(),
  rodHeightMm: PositiveIntMm.optional(),
  storageTemplate: z.enum(['deepYukluk', 'steppedLHanging', 'blindLuggage', 'jewelryDrawer', 'trouserRack', 'laundryBasket']).optional(),
});

export const SplitNodeSchema: z.ZodType<any> = z.lazy(() =>
  z.discriminatedUnion('kind', [
    z.object({
      kind: z.literal('split'),
      id: z.string().min(1),
      direction: z.enum(['horizontal', 'vertical']),
      dividerThicknessMm: PositiveIntMm.optional(),
      children: z
        .array(
          z.object({
            id: z.string().min(1),
            size: SizeSpecSchema,
            locked: z.boolean().optional(),
            node: SplitNodeSchema,
          })
        )
        .min(2),
    }),
    z.object({
      kind: z.literal('leaf'),
      id: z.string().min(1),
      label: z.string().optional(),
      owner: OwnerTypeSchema.optional(),
      insert: InsertConfigSchema.nullable(),
    }),
  ])
);

export const BayFrontModeSchema = z.enum([
  'auto',
  'singleLeft',
  'singleRight',
  'double',
  'open',
  'sliding',
]);

export const HingeAngleSchema = z.union([z.literal(110), z.literal(155), z.literal(165)]);

export const BaySchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  width: SizeSpecSchema,
  locked: z.boolean(),
  owner: OwnerTypeSchema,
  autoFront: z.boolean(),
  frontMode: BayFrontModeSchema.optional(),
  hingeAngleDeg: HingeAngleSchema.optional(),
  frontMaterialId: MaterialIdSchema.optional(),
  doorMaterialId: MaterialIdSchema.optional(),
  handleConfig: HandleConfigSchema.optional(),
  root: SplitNodeSchema,
});

export const RunSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  wallAxis: z.enum(['A', 'B', 'C']),
  lengthMm: PositiveIntMm.min(400).max(10000),
  depthMm: PositiveIntMm.min(300).max(1000),
  rearOffsetMm: NonNegativeIntMm.max(700).optional(),
  heightMm: PositiveIntMm.min(1000).max(3600),
  plinthHeightMm: NonNegativeIntMm.max(300),
  topFillerHeightMm: NonNegativeIntMm.max(400),
  startFillerMm: NonNegativeIntMm.max(300),
  endFillerMm: NonNegativeIntMm.max(300),
  panelThicknessMm: PositiveIntMm.min(12).max(36),
  backPanelThicknessMm: PositiveIntMm.min(3).max(18),
  constructionMode: z.enum(['shared', 'separate']).optional(),
  bays: z.array(BaySchema).min(1),
});

export const JunctionSchema = z.object({
  id: z.string().min(1),
  runAId: z.string().min(1),
  runBId: z.string().min(1),
  type: z.enum(['blind', 'diagonal']),
  priorityRunId: z.string().min(1),
  fillerWidthMm: NonNegativeIntMm.max(250),
  diagonalArmAMm: PositiveIntMm.min(600).max(1500),
  diagonalArmBMm: PositiveIntMm.min(600).max(1500),
  shelvesCount: z.number().int().min(0).max(8),
  intervalHeightsMm: z.array(PositiveIntMm).optional(),
  hasHangingRod: z.boolean(),
  owner: OwnerTypeSchema.optional(),
  doorMode: z.enum(['left', 'right', 'open']).optional(),
  doorMaterialId: MaterialIdSchema.optional(),
  handleConfig: HandleConfigSchema.optional(),
});

export const SlidingFrontSchema = z.object({
  trackCount: z.union([z.literal(2), z.literal(3)]),
  leafCount: z.number().int().min(2).max(6),
  overlapMm: NonNegativeIntMm.max(100),
  trackDepthMm: PositiveIntMm.min(50).max(250),
  trackSpacingMm: PositiveIntMm.min(15).max(80),
  verticalGapMm: NonNegativeIntMm.max(60).optional(),
  startClearanceMm: NonNegativeIntMm.max(200).optional(),
  endClearanceMm: NonNegativeIntMm.max(200).optional(),
  leafWidthsMm: z.array(PositiveIntMm.min(150).max(3000)).min(2).max(6).optional(),
  trackIndices: z.array(z.union([z.literal(0),z.literal(1),z.literal(2)])).min(2).max(6).optional(),
});

export const FrontSchema = z.object({
  id: z.string().min(1),
  label: z.string().optional(),
  runId: z.string().min(1),
  bayIds: z.array(z.string().min(1)).min(1),
  type: z.enum(['hinged', 'sliding', 'drawerFront', 'open']),
  yStartMm: IntMm,
  yEndMm: IntMm,
  yStartAnchor: z.enum(['carcass', 'drawers', 'top']).optional(),
  yEndAnchor: z.literal('top').optional(),
  hingeSide: z.enum(['auto', 'left', 'right', 'double']).optional(),
  hingeMount: z.enum(['overlay', 'inset']).optional(),
  openingAngleDeg: HingeAngleSchema.optional(),
  trackIndex: z.union([z.literal(0), z.literal(1), z.literal(2)]).optional(),
  slideOffsetMm: IntMm.optional(),
  sliding: SlidingFrontSchema.optional(),
  materialId: MaterialIdSchema.optional(),
  handleConfig: HandleConfigSchema.optional(),
});

export const MaterialPaletteSchema = z.object({
  carcassMaterialId: MaterialIdSchema,
  frontMaterialId: MaterialIdSchema,
  drawerFrontMaterialId: MaterialIdSchema.optional(),
  shelfMaterialId: MaterialIdSchema.optional(),
  doorHandleConfig: HandleConfigSchema.optional(),
  drawerHandleConfig: HandleConfigSchema.optional(),
});

export const LedLightingConfigSchema = z.object({
  enabled: z.boolean(),
  shelfUnder: z.boolean(),
  verticalSides: z.boolean(),
  hangingRod: z.boolean(),
  openBays: z.boolean(),
  cornerModule: z.boolean(),
  onlyWhenOpenOrGlass: z.boolean().optional(),
  colorTempId: z.enum([
    'warm2700K',
    'warm3000K',
    'natural3000K',
    'neutral4000K',
    'cool5000K',
  ]),
  intensity: z.number().min(0.1).max(2.5),
});

export const ExteriorFinishConfigSchema = z.object({
  presetId: z.enum([
    'builtInMinimal',
    'standardModern',
    'classicFramed',
    'freestandingModern',
    'classicTrimmed',
    'classicCrown',
    'modernFlush',
    'freestandingFeet',
    'custom',
  ]),
  topStyle: z.enum(['flushCeiling', 'flatFiller', 'classicCrown', 'none']),
  baseStyle: z.enum([
    'lowMinimalPlinth',
    'recessedHiddenPlinth',
    'highClassicPlinth',
    'adjustableFeet',
  ]),
  leftSideStyle: z.enum([
    'flushClean',
    'thinWallFiller',
    'decorativeSideTrim',
    'wallRevealPanel',
  ]),
  rightSideStyle: z.enum([
    'flushClean',
    'thinWallFiller',
    'decorativeSideTrim',
    'wallRevealPanel',
  ]),
  ceilingShadowGapMm: NonNegativeIntMm.max(120),
  plinthRecessMm: NonNegativeIntMm.max(150),
});

export const InteriorItemsConfigSchema = z.object({
  enabled: z.boolean(),
  density: z.enum(['low', 'medium', 'full']),
  showHangingClothes: z.boolean().optional(),
  showFoldedClothes: z.boolean().optional(),
  showShoesAndBags: z.boolean().optional(),
  showStorageBoxesAndLuggage: z.boolean().optional(),
  showServiceItems: z.boolean().optional(),
});

const PersonProfileSchema = z.object({
  heightMm: PositiveIntMm.min(1000).max(2200),
  dailyReachMm: PositiveIntMm.min(800).max(2600).optional(),
  upperReachMm: PositiveIntMm.min(1000).max(3000).optional(),
}).refine(p => (p.dailyReachMm ?? Math.round(p.heightMm * 1.05)) <= (p.upperReachMm ?? Math.round(p.heightMm * 1.25)), 'Günlük erişim üst erişimden yüksek olamaz.');

export const InventoryTargetSchema = z.object({
  id: z.string().min(1), owner: OwnerTypeSchema,
  kind: z.enum(['shirts','jackets','trousers','longClothes','foldedClothes','shoes','bags','suitcases','hurc','bedding','boxes','accessories']),
  quantity: z.number().int().min(0).max(1000),
  widthMm: PositiveIntMm.optional(), depthMm: PositiveIntMm.optional(), heightMm: PositiveIntMm.optional(),
  hangerPitchMm: PositiveIntMm.optional(),
});
export const RoomObstacleSchema = z.object({
  id: z.string().min(1), label: z.string().min(1),
  kind: z.enum(['bed','roomDoor','window','radiator','socket','pillar','beam','skirting','other']),
  positionMm: z.tuple([IntMm.min(-10000).max(20000), IntMm.min(0).max(5000), IntMm.min(-10000).max(20000)]),
  sizeMm: z.tuple([PositiveIntMm.max(10000), PositiveIntMm.max(5000), PositiveIntMm.max(10000)]),
  rotationDeg: z.number().int().min(-360).max(360),
  openingAngleDeg: z.number().int().min(0).max(180).optional(),
  hingeSide: z.enum(['left','right']).optional(),
});

export const DesignSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().min(1),
  name: z.string().min(1),
  layoutKind: z.enum(['straight', 'l-shape']),
  roomHeightMm: PositiveIntMm.min(1800).max(4000),
  ceilingClearanceMm: NonNegativeIntMm.max(300).optional(),
  runs: z.array(RunSchema).min(1),
  junctions: z.array(JunctionSchema),
  fronts: z.array(FrontSchema),
  materials: MaterialPaletteSchema,
  ledLighting: LedLightingConfigSchema.optional(),
  exteriorFinish: ExteriorFinishConfigSchema.optional(),
  interiorItems: InteriorItemsConfigSchema.optional(),
  ergonomics: z.object({ anne: PersonProfileSchema, baba: PersonProfileSchema }).optional(),
  inventory: z.array(InventoryTargetSchema).optional(),
  obstacles: z.array(RoomObstacleSchema).optional(),
});

/** Komut sınırında bütün mm alanlarını yuvarlar; esnek ağırlıklar ve ışık şiddeti korunur. */
export function roundDesignMeasurements<T>(value: T): T {
  const visit = (v: unknown, key: string): unknown => {
    if (typeof v === 'number' && (key === 'mm' || key.endsWith('Mm'))) return Math.round(v);
    if (Array.isArray(v)) return v.map(x => visit(x, key));
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k,x]) => [k, visit(x,k)]));
    return v;
  };
  return visit(value, '') as T;
}

/**
 * İçe aktarılan veya IndexedDB'den okunan tasarım verisini doğrular
 * ve eksik isteğe bağlı alanlar varsa güvenli varsayılanlarla tamamlar.
 */
export function normalizeAndValidateDesign(raw: unknown): Design {
  if (typeof raw === 'object' && raw !== null) {
    const rawObj = raw as Record<string, unknown>;
    const rawMat = (rawObj.materials as Record<string, unknown> | undefined) ?? {};
    const candidate = {
      schemaVersion: 1,
      fronts: [],
      junctions: [],
      ...rawObj,
      materials: {
        carcassMaterialId: 'warmOak',
        frontMaterialId: 'linenBeige',
        ...rawMat,
      },
    };
    const design = DesignSchema.parse(candidate) as Design;
    assertDesignStructure(design);
    return design;
  }
  return DesignSchema.parse(raw) as Design;
}

export function parseDesignJson(text: string): Design {
  if (new TextEncoder().encode(text).length > 2_000_000) throw new Error('JSON en fazla 2 MB olabilir.');
  const raw: unknown = JSON.parse(text);
  let nodes = 0;
  const visit = (value: unknown, depth: number) => {
    if (++nodes > 30000 || depth > 70) throw new Error('JSON çok büyük veya çok derin. Tasarımı sadeleştirin.');
    if (value && typeof value === 'object') for (const child of Object.values(value)) visit(child, depth + 1);
  };
  visit(raw, 0);
  return normalizeAndValidateDesign(raw);
}
