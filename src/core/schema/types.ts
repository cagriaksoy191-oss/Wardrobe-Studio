export type SizeSpec =
  | { kind: 'fixed'; mm: number }
  | { kind: 'flex'; weight: number; minMm?: number; maxMm?: number };

export type OwnerType = 'anne' | 'baba' | 'ortak';

export type GrainAxis = 'vertical' | 'horizontal';

export type InsertType =
  | 'shelfStack'
  | 'hangingRod'
  | 'doubleHanging'
  | 'drawerBank'
  | 'shoeRack'
  | 'serviceNiche'
  | 'beddingYukluk'
  | 'empty';

export type MaterialId =
  | 'warmOak'
  | 'lightNordicOak'
  | 'smokedOak'
  | 'naturalWalnut'
  | 'darkWalnut'
  | 'matteWhite'
  | 'creamAlabaster'
  | 'linenBeige'
  | 'sageGreen'
  | 'softAnthracite'
  | 'glossWhiteLacquer'
  | 'glossCreamLacquer'
  | 'clearGlass'
  | 'smokedGlass'
  | 'clearMirror'
  | 'bronzeMirror'
  | 'brushedMetal';

export type HandleStyleId =
  | 'barModern'
  | 'knobMinimal'
  | 'profileVertical'
  | 'classicCurve'
  | 'recessedJ'
  | 'edgeLip';

export type HandleFinishId =
  | 'matteBlack'
  | 'brushedInox'
  | 'antiqueBronze'
  | 'warmGold'
  | 'bodyMatch';

export interface HandleConfig {
  styleId: HandleStyleId;
  finishId: HandleFinishId;
  lengthMm: number;
  placement: 'middle' | 'top' | 'bottom' | 'verticalEdge';
  orientation?: 'vertical' | 'horizontal';
  offsetFromEdgeMm?: number;
  verticalOffsetMm?: number;
}

export type InteriorItemPreset =
  | 'auto'
  | 'shirts'
  | 'jackets'
  | 'trousers'
  | 'longDresses'
  | 'foldedClothes'
  | 'shoes'
  | 'bags'
  | 'storageBoxes'
  | 'hurc'
  | 'suitcases'
  | 'none';

export interface ServiceItemSpec {
  id: string;
  name: string;
  widthMm: number;
  depthMm: number;
  heightMm: number;
  liftClearanceMm?: number;
}

export interface InsertConfig {
  type: InsertType;
  shelfCount?: number;
  adjustable?: boolean;
  /** Alt referanstan rafın alt yüzüne 32 mm adımlı satır numaraları. */
  shelfPinRows?: number[];
  rodHeightType?: 'short' | 'medium' | 'long';
  drawerCount?: number;
  drawerSlide?: 'partial' | 'full';
  isInternalDrawer?: boolean;
  drawerFrontHeightsMm?: number[];
  drawerFrontMaterialId?: MaterialId;
  frontMaterialId?: MaterialId;
  handleConfig?: HandleConfig;
  shoeTiers?: number;
  serviceItems?: ServiceItemSpec[];
  handClearanceMm?: number;
  itemPreset?: InteriorItemPreset;
  itemCountOverride?: number;
  ledEnabled?: boolean;
  /** Boru ekseninin hücre tabanından yüksekliği; yoksa mevcut üstten yerleşim. */
  rodHeightMm?: number;
  storageTemplate?: StorageTemplateId;
}

export type SplitNode =
  | {
      kind: 'split';
      id: string;
      direction: 'horizontal' | 'vertical';
      dividerThicknessMm?: number;
      children: {
        id: string;
        size: SizeSpec;
        locked?: boolean;
        node: SplitNode;
      }[];
    }
  | {
      kind: 'leaf';
      id: string;
      label?: string;
      owner?: OwnerType;
      insert: InsertConfig | null;
    };

export type BayFrontMode = 'auto' | 'singleLeft' | 'singleRight' | 'double' | 'open' | 'sliding';

export interface Bay {
  id: string;
  label: string;
  width: SizeSpec;
  locked: boolean;
  owner: OwnerType;
  autoFront: boolean;
  frontMode?: BayFrontMode;
  hingeAngleDeg?: 110 | 155 | 165;
  frontMaterialId?: MaterialId;
  doorMaterialId?: MaterialId;
  handleConfig?: HandleConfig;
  root: SplitNode;
}

export type WallAxis = 'A' | 'B' | 'C';

export type LayoutKind = 'straight' | 'l-shape';

export interface Run {
  id: string;
  label: string;
  wallAxis: WallAxis;
  lengthMm: number;
  depthMm: number;
  /** Arkalığın oda duvarından uzaklığı. Eski belgelerde duvar hizasındadır. */
  rearOffsetMm?: number;
  heightMm: number;
  plinthHeightMm: number;
  topFillerHeightMm: number;
  startFillerMm: number;
  endFillerMm: number;
  panelThicknessMm: number;
  backPanelThicknessMm: number;
  /** Eksik alan, eski JSON dosyalarındaki bağımsız gövdeleri korur. */
  constructionMode?: 'shared' | 'separate';
  bays: Bay[];
}

export type JunctionType = 'blind' | 'diagonal';

export interface Junction {
  id: string;
  runAId: string;
  runBId: string;
  type: JunctionType;
  /** Kör köşede köşeye kadar uzanan öncelikli kol ('run-A' veya 'run-B') */
  priorityRunId: string;
  /** Kör köşede dik kesişen kapak/çekmece kulp çakışmasını önleyen kör klapa genişliği (mm) */
  fillerWidthMm: number;
  /** Beşgen/diyagonal köşede A duvarı boyunca kol uzunluğu (mm) */
  diagonalArmAMm: number;
  /** Beşgen/diyagonal köşede B duvarı boyunca kol uzunluğu (mm) */
  diagonalArmBMm: number;
  /** Köşe modülü içindeki ara raf adedi */
  shelvesCount: number;
  /** Beşgen köşe modülü içindeki raf aralıklarının özel net yükseklikleri (mm, alttan üste) */
  intervalHeightsMm?: number[];
  /** Köşe modülü içinde askı borusu var mı? */
  hasHangingRod: boolean;
  /** Köşe kapağı menteşe yönü ('left' | 'right' | 'open') */
  doorMode?: 'left' | 'right' | 'open';
  /** Köşe kapağı özel malzemesi */
  doorMaterialId?: MaterialId;
  /** Köşe kapağı özel kulp yapılandırması */
  handleConfig?: HandleConfig;
  owner?: OwnerType;
}

export type FrontType = 'hinged' | 'sliding' | 'drawerFront' | 'open';

export interface SlidingFrontConfig {
  trackCount: 2 | 3;
  leafCount: number;
  overlapMm: number;
  /** Ray sistemi gövdenin önüne eklenir; net iç derinliği değiştirmez. */
  trackDepthMm: number;
  trackSpacingMm: number;
  verticalGapMm?: number;
  startClearanceMm?: number;
  endClearanceMm?: number;
  /** İsteğe bağlı sabit kanat genişlikleri. Toplam = açıklık + bindirmeler. */
  leafWidthsMm?: number[];
  trackIndices?: (0 | 1 | 2)[];
}

export interface Front {
  id: string;
  label?: string;
  runId: string;
  bayIds: string[];
  type: FrontType;
  /** Without an anchor these are legacy absolute world elevations. With one, they are offsets. */
  yStartMm: number;
  yEndMm: number;
  yStartAnchor?: 'carcass' | 'drawers' | 'top';
  yEndAnchor?: 'top';
  hingeSide?: 'auto' | 'left' | 'right' | 'double';
  hingeMount?: 'overlay' | 'inset';
  openingAngleDeg?: 110 | 155 | 165;
  /** Eski tek-ray seçimi korunur; sistem ayarı yoksa iki ray varsayılır. */
  trackIndex?: 0 | 1 | 2;
  slideOffsetMm?: number;
  sliding?: SlidingFrontConfig;
  materialId?: MaterialId;
  handleConfig?: HandleConfig;
}

export interface MaterialPalette {
  carcassMaterialId: MaterialId;
  frontMaterialId: MaterialId;
  drawerFrontMaterialId?: MaterialId;
  shelfMaterialId?: MaterialId;
  doorHandleConfig?: HandleConfig;
  drawerHandleConfig?: HandleConfig;
}

export type LedColorTempId =
  | 'warm2700K'
  | 'warm3000K'
  | 'natural3000K'
  | 'neutral4000K'
  | 'cool5000K';

export interface LedLightingConfig {
  enabled: boolean;
  shelfUnder: boolean;
  verticalSides: boolean;
  hangingRod: boolean;
  openBays: boolean;
  cornerModule: boolean;
  onlyWhenOpenOrGlass?: boolean;
  colorTempId: LedColorTempId;
  intensity: number;
}

export type ExteriorFinishPresetId =
  | 'builtInMinimal'
  | 'standardModern'
  | 'classicFramed'
  | 'freestandingModern'
  | 'classicTrimmed'
  | 'classicCrown'
  | 'modernFlush'
  | 'freestandingFeet'
  | 'custom';

export type TopFinishStyle = 'flushCeiling' | 'flatFiller' | 'classicCrown' | 'none';
export type BaseFinishStyle =
  | 'lowMinimalPlinth'
  | 'recessedHiddenPlinth'
  | 'highClassicPlinth'
  | 'adjustableFeet';
export type SideFinishStyle =
  | 'flushClean'
  | 'thinWallFiller'
  | 'decorativeSideTrim'
  | 'wallRevealPanel';

export interface ExteriorFinishConfig {
  presetId: ExteriorFinishPresetId;
  topStyle: TopFinishStyle;
  baseStyle: BaseFinishStyle;
  leftSideStyle: SideFinishStyle;
  rightSideStyle: SideFinishStyle;
  ceilingShadowGapMm: number;
  plinthRecessMm: number;
}

export interface InteriorItemsConfig {
  enabled: boolean;
  density: 'low' | 'medium' | 'full';
  showHangingClothes?: boolean;
  showFoldedClothes?: boolean;
  showShoesAndBags?: boolean;
  showStorageBoxesAndLuggage?: boolean;
  showServiceItems?: boolean;
}

export interface Design {
  schemaVersion: 1;
  id: string;
  name: string;
  layoutKind: 'straight' | 'l-shape';
  roomHeightMm: number;
  /** Kullanıcı tarafından ölçülmüş montaj boşluğu. */
  ceilingClearanceMm?: number;
  runs: Run[];
  junctions: Junction[];
  fronts: Front[];
  materials: MaterialPalette;
  ledLighting?: LedLightingConfig;
  exteriorFinish?: ExteriorFinishConfig;
  interiorItems?: InteriorItemsConfig;
  ergonomics?: ErgonomicsConfig;
  inventory?: InventoryTarget[];
  obstacles?: RoomObstacle[];
}

export type StorageTemplateId = 'deepYukluk' | 'steppedLHanging' | 'blindLuggage' | 'jewelryDrawer' | 'trouserRack' | 'laundryBasket';
export interface PersonProfile {
  heightMm: number;
  dailyReachMm?: number;
  upperReachMm?: number;
}
export interface ErgonomicsConfig { anne: PersonProfile; baba: PersonProfile }
export type InventoryItemKind = 'shirts' | 'jackets' | 'trousers' | 'longClothes' | 'foldedClothes' | 'shoes' | 'bags' | 'suitcases' | 'hurc' | 'bedding' | 'boxes' | 'accessories';
export interface InventoryTarget {
  id: string;
  owner: OwnerType;
  kind: InventoryItemKind;
  quantity: number;
  widthMm?: number;
  depthMm?: number;
  heightMm?: number;
  hangerPitchMm?: number;
}
export type RoomObstacleKind = 'bed' | 'roomDoor' | 'window' | 'radiator' | 'socket' | 'pillar' | 'beam' | 'skirting' | 'other';
export interface RoomObstacle {
  id: string;
  label: string;
  kind: RoomObstacleKind;
  /** Sol-alt-arka köşe, gardırobun dünya koordinatlarında mm. */
  positionMm: [number, number, number];
  sizeMm: [number, number, number];
  rotationDeg: number;
  openingAngleDeg?: number;
  hingeSide?: 'left' | 'right';
}
export type QuickFix =
  | { kind: 'hinge155'; label: string; bayId: string }
  | { kind: 'lowerRod'; label: string; cellId: string; heightMm: number }
  | { kind: 'moveObstacle'; label: string; obstacleId: string; positionMm: [number, number, number] }
  | { kind: 'shelfCount'; label: string; cellId: string; count: number };
export type ReachZone = 'low' | 'comfortable' | 'high' | 'assisted';
export interface ResolvedReach {
  cellId: string;
  owner: OwnerType;
  zone: ReachZone;
  accessHeightMm: number;
  dailyReachMm: number;
  upperReachMm: number;
  explanation: string;
}
export interface ResolvedMotion {
  id: string;
  label: string;
  kind: 'hinged' | 'linear' | 'sliding';
  runId: string;
  yStartMm: number;
  yEndMm: number;
  sweepPolygonsMm: Point2DMm[][];
  maxAngleDeg?: number;
  travelMm?: number;
}
export interface InventoryResult {
  target: InventoryTarget;
  capacity: number;
  allocated: number;
  shortfall: number;
  spaceLabels: string[];
  suggestion: string;
}
export interface StorageMetrics {
  hangingLengthMm: number;
  shelfAreaMm2: number;
  drawerVolumeMm3: number;
  storageVolumeMm3: number;
  shoePairs: number;
}
export type FunctionalAccessStatus = 'usable' | 'blocked' | 'unverified';
export interface ResolvedFunctionalAccess {
  id: string;
  bayId: string;
  label: string;
  kind: 'shelf' | 'hanging' | 'drawer' | 'service';
  status: FunctionalAccessStatus;
  /** Ön düzleme dik, tek parça olarak kullanılabilen aralık. */
  clearWidthMm: number;
  openingWidthMm: number;
  requiredWidthMm: number;
  reference: string;
  travel?: { availableMm: number; requiredMm: number };
  blockerLabel?: string;
  coveringIds: string[];
  steps: { partId: string; label: string; position: number; unit: 'deg' | 'mm' }[];
}
export interface StudioAnalysis {
  reach: ResolvedReach[];
  inventory: InventoryResult[];
  metrics: Record<OwnerType, StorageMetrics>;
  motions: ResolvedMotion[];
  collidingObstacleIds: string[];
  functionalAccess: ResolvedFunctionalAccess[];
}

// ============================================================================
// ÇÖZÜLMÜŞ MODEL (RESOLVED MODEL) — 3D, 2D, ANİMASYON VE PARÇA LİSTESİ KAYNAĞI
// ============================================================================

export interface Point2DMm {
  xMm: number;
  zMm: number;
}

export type PanelRole =
  | 'sidePanel'
  | 'topPanel'
  | 'bottomPanel'
  | 'backPanel'
  | 'plinth'
  | 'cabinetFoot'
  | 'topFiller'
  | 'crownMolding'
  | 'wallFiller'
  | 'decorativeSideTrim'
  | 'cornerFiller'
  | 'shelf'
  | 'verticalDivider'
  | 'drawerBox'
  | 'drawerFront'
  | 'hangingRod'
  | 'cornerPolygonShelf'
  | 'cornerSidePanel'
  | 'cornerBackPanel'
  | 'doorLeaf'
  | 'cornerAngledDoor';

export interface ResolvedPanel {
  id: string;
  label: string;
  runId: string;
  bayId?: string;
  cellId?: string;
  role: PanelRole;
  shapeKind: 'box' | 'extrudedPolygon' | 'cylinderRod';
  /** Parçanın üretim/kesim listesindeki net genişlik, yükseklik ve kalınlığı (tamsayı mm) */
  cutWidthMm: number;
  cutHeightMm: number;
  cutThicknessMm: number;
  /** Kutu paneller için kendi yerel eksenlerinde 3D boyutları (X, Y, Z mm) */
  boxSizeMm: [number, number, number];
  /** Dünya koordinatlarında (X, Y, Z mm) merkez noktası (poligon panellerde alt-sol köşe referansı) */
  worldPositionMm: [number, number, number];
  /** Dünya ekseninde Y etrafında dönüş açısı (radyan) */
  rotationYRad: number;
  /** Poligon paneller (beşgen köşe tablaları ve rafları) için XZ düzlemindeki 2D köşe noktaları */
  polygonXZMm?: Point2DMm[];
  grainAxis: GrainAxis;
  materialSlot: 'carcass' | 'front' | 'back' | 'metal' | 'shelf';
  /** Özel malzeme kimliği (varsa materialSlot yerine doğrudan bu malzeme kullanılır) */
  materialIdOverride?: MaterialId;
  /** Bu parça yapısal taşıyıcı değil, dekoratif bir bitiş parçası mı? */
  isDecorativeTrim?: boolean;
  /** Eğer bu panel kinematik bir kapak veya çekmeceye aitse ilgili birim kimliği */
  animatedUnitId?: string;
  /** Paylaşımlı fiziksel panelin hizmet verdiği bölmeler. */
  bayIds?: string[];
}

/**
 * Kinematik olarak menteşe ekseni etrafında açılıp kapanabilen kapak kanadı.
 */
export interface ResolvedDoorLeaf {
  id: string;
  /** Eğer bu kapak bağımsız `design.fronts` dizisindeki bir kayıttan üretildiyse ilgili Front kimliği */
  frontId?: string;
  label: string;
  runId: string;
  bayId?: string;
  bayIds: string[];
  isCornerDoor?: boolean;
  isPartialHeight?: boolean;
  hingeSide: 'left' | 'right';
  maxAngleDeg: 110 | 155 | 165;
  widthMm: number;
  heightMm: number;
  thicknessMm: number;
  yStartMm: number;
  yEndMm: number;
  /** Kapak kanadı için çözülmüş malzeme kimliği */
  materialId?: MaterialId;
  /** Kapak kanadı için çözülmüş kulp yapılandırması */
  handleConfig?: HandleConfig;
  /** Menteşe dönme ekseninin dünya koordinatlarındaki (X, Y, Z mm) konumu */
  pivotWorldMm: [number, number, number];
  /** Kapalı durumdaki Y ekseni açısı (radyan) */
  closedRotationYRad: number;
  /** Açılırken Y ekseni etrafındaki dönüş yönü (+1 veya -1) */
  openRotationDirection: 1 | -1;
  /** Pivot noktasından kapak merkezine yerel X/Z ofseti (mm) */
  leafCenterOffsetMm: [number, number, number];
  /** Pivot noktasından kulp merkezine yerel ofset (mm) */
  handleOffsetMm: [number, number, number];
  handleLengthMm: number;
  /** Kapalı açıklıkta modellenen, açılma yönünden bağımsız kenar boşlukları. */
  clearanceMm?: { spanStart: number; spanEnd: number; bottom: number; top: number; centerSeam?: number };
  /** Nominal planning profile. A catalogue linkage is not implied by an angle. */
  hingeProfile?: 'exterior-axis' | 'diagonal-rear-axis';
  mounting?: 'overlay' | 'shared-overlay' | 'inset' | 'diagonal' | 'needs-support';
  hingeSupportPanelId?: string;
  opening?: ResolvedHingeOpening;
}

export interface ResolvedHingeOpening {
  safeAngleDeg: number;
  blockerId?: string;
  blockerLabel?: string;
  alternative?: { side: 'left' | 'right'; safeAngleDeg: number };
}

export interface ResolvedSlidingLeaf {
  id: string;
  frontId: string;
  label: string;
  runId: string;
  bayId: string;
  bayIds: string[];
  wallAxis: WallAxis;
  leafIndex: number;
  trackIndex: 0 | 1 | 2;
  widthMm: number;
  heightMm: number;
  thicknessMm: number;
  yStartMm: number;
  yEndMm: number;
  closedWorldPositionMm: [number, number, number];
  boxSizeMm: [number, number, number];
  slideDirectionWorld: [number, number, number];
  minOffsetMm: number;
  maxOffsetMm: number;
  initialOffsetMm: number;
  openOffsetMm: number;
  materialId: MaterialId;
  handleConfig: HandleConfig;
  handleSurfaceWorldMm: [number, number, number];
  /** Kulp yerel +Z doğrultusunun dünya açısı. */
  handleRotationYRad: number;
}

export interface ResolvedSlidingSystem {
  frontId: string;
  runId: string;
  bayIds: string[];
  trackCount: 2 | 3;
  overlapMm: number;
  openingWidthMm: number;
  trackDepthMm: number;
  trackSpacingMm: number;
  railStartMm: number;
  railEndMm: number;
  yStartMm: number;
  yEndMm: number;
  /** Alt/üst profilin parametrik yerleşim zarfları; üretici profil kesiti değildir. */
  railBoxes: { centerMm: [number, number, number]; sizeMm: [number, number, number] }[];
}

/**
 * Kinematik olarak teleskopik ray ekseni boyunca kayarak açılıp kapanabilen çekmece birimi.
 */
export interface ResolvedDrawerUnit {
  id: string;
  label: string;
  cellId: string;
  bayId: string;
  runId: string;
  wallAxis: WallAxis;
  rotationYRad: number;
  drawerIndex: number;
  totalDrawersInBank: number;
  parentBankHeightMm: number;
  isInternalDrawer: boolean;
  /** Bu çekmeceyi örten menteşeli kapakların kimlikleri (iç çekmece sıralaması için) */
  coveringDoorIds: string[];
  widthMm: number;
  heightMm: number;
  depthMm: number;
  /** Çekmece ön yüzü için çözülmüş malzeme kimliği */
  frontMaterialId?: MaterialId;
  /** Çekmece için çözülmüş kulp yapılandırması */
  handleConfig?: HandleConfig;
  /** Çekmece yan panel (kasa) kalınlığı ve alt taban kalınlığı (mm) */
  sideThicknessMm: number;
  bottomThicknessMm: number;
  /** Üstü açık çekmece kasasının net iç kullanılabilir genişlik, derinlik ve yüksekliği (mm) */
  innerWidthMm: number;
  innerDepthMm: number;
  innerHeightMm: number;
  yStartMm: number;
  yEndMm: number;
  maxSlideMm: number;
  slideRatio: number;
  /** Çekmecenin açılma yönü birim vektörü (Dünya XZ düzleminde) */
  slideDirectionWorld: [number, number, number];
  frontWorldPositionMm: [number, number, number];
  frontBoxSizeMm: [number, number, number];
  boxWorldPositionMm: [number, number, number];
  boxSizeMm: [number, number, number];
  /** İçi boş gerçekçi çekmece kasasının 4 bileşen paneli (Sol Yan, Sağ Yan, Arka Panel, Alt Taban) */
  leftSideWorldPositionMm: [number, number, number];
  leftSideBoxSizeMm: [number, number, number];
  rightSideWorldPositionMm: [number, number, number];
  rightSideBoxSizeMm: [number, number, number];
  backPanelWorldPositionMm: [number, number, number];
  backPanelBoxSizeMm: [number, number, number];
  bottomPanelWorldPositionMm: [number, number, number];
  bottomPanelBoxSizeMm: [number, number, number];
  handleWorldPositionMm: [number, number, number];
  handleBoxSizeMm: [number, number, number];
  organizerPanels?: ResolvedPanel[];
  organizerSlots?: { columnWidthsMm: number[]; rowDepthsMm: number[]; heightMm: number };
}

export interface ResolvedCell {
  id: string;
  /** Eğer bu hücre bir modülün (shelfStack, shoeRack, doubleHanging) alt aralığıysa bağlı olduğu SplitNode yaprak kimliği */
  sourceLeafId?: string;
  /** Eğer bu hücre beşgen köşe modülünün bir raf aralığıysa bağlı olduğu Junction kimliği */
  cornerJunctionId?: string;
  /** Alt aralık indeksi (0 = en alt aralık) */
  subIntervalIndex?: number;
  /** Toplam alt aralık sayısı */
  subIntervalCount?: number;
  /** Alt aralık türü */
  subIntervalKind?: 'shelfInterval' | 'doubleHangInterval' | 'cornerInterval';
  parentId?: string;
  parentDirection?: 'horizontal' | 'vertical';
  childIndexInParent?: number;
  sizeSpecInParent?: SizeSpec;
  lockedInParent?: boolean;
  bayId: string;
  runId: string;
  wallAxis: WallAxis;
  label: string;
  path: string;
  owner: OwnerType;
  isLeaf: boolean;
  insert: InsertConfig | null;
  /** Bu hücrenin önünde bulunan menteşeli kapak kimlikleri */
  coveringDoorIds?: string[];
  /** Beşgen köşe bölmeleri için XZ düzlemindeki poligon köşe noktaları (mm) */
  polygonXZMm?: Point2DMm[];
  hangingZoneMm?: { xMm: number; zMm: number; widthMm: number; depthMm: number };
  /** Hücrenin tabanındaki rafın kullanılabilir derinliği; tam tabanda alan yoktur. */
  supportDepthMm?: number;
  /** Net iç temiz ölçüler (tamsayı mm) */
  netWidthMm: number;
  netHeightMm: number;
  netDepthMm: number;
  yStartMm: number;
  yEndMm: number;
  /** Dünya koordinatlarında hücre hacminin merkezi ve boyutları (mm) */
  worldCenterMm: [number, number, number];
  worldSizeMm: [number, number, number];
  rotationYRad: number;
  accessOpeningWidthMm?: number;
}

export interface ResolvedBay {
  id: string;
  runId: string;
  label: string;
  index: number;
  owner: OwnerType;
  locked: boolean;
  sizeSpec: SizeSpec;
  frontMode: BayFrontMode;
  hingeAngleDeg: 110 | 155 | 165;
  frontMaterialId?: MaterialId;
  doorMaterialId?: MaterialId;
  handleConfig?: HandleConfig;
  /** Bölmenin dış genişliği ve net iç genişliği (mm) */
  outerWidthMm: number;
  netInnerWidthMm: number;
  netInnerHeightMm: number;
  netInnerDepthMm: number;
  /** Kol boyunca başlangıç X/Z ofseti (mm) */
  startOffsetMm: number;
  worldCenterMm: [number, number, number];
  worldSizeMm: [number, number, number];
  rotationYRad: number;
}

export interface ResolvedCorner {
  id: string;
  type: JunctionType;
  consumedRunAMm: number;
  consumedRunBMm: number;
  depthAMm: number;
  depthBMm: number;
  frontOpeningWidthMm: number;
  /** Dış köşe uçları arasındaki Pisagor boyu; net açıklık dikme düşümleri sonrasıdır. */
  outerFrontSpanMm?: number;
  frontAngleDeg: number;
  polygonXZMm: Point2DMm[];
  innerPolygonXZMm: Point2DMm[];
}

export type DimensionEditTarget =
  | 'runLength'
  | 'runDepth'
  | 'runHeight'
  | 'cornerArmA'
  | 'cornerArmB'
  | 'cornerFiller'
  | 'bayOuterWidth'
  | 'bayInnerDerived';

export interface DimensionAnnotation {
  id: string;
  kind: 'runTotal' | 'bayInner' | 'bayOuter' | 'height' | 'depth' | 'cornerArm' | 'cellHeight';
  runId?: string;
  bayId?: string;
  label: string;
  valueMm: number;
  startMm: [number, number, number];
  endMm: [number, number, number];
  /** 3D sahnede etikete tıklayarak doğrudan ölçü düzenleme bilgisi */
  editTarget?: DimensionEditTarget;
  minMm?: number;
  maxMm?: number;
  /** Hesaplanmış ölçülerde (ör. Net İç) düzenlenecek kaynak parametre değeri (ör. Dış Genişlik mm) */
  sourceValueMm?: number;
}

export interface ValidationIssue {
  id: string;
  severity: 'error' | 'warning' | 'info' | 'expert';
  code: string;
  title: string;
  description: string;
  targetId?: string;
  why?: string;
  suggestions?: string[];
  quickFixes?: QuickFix[];
}

export type ResizeAxis = 'X' | 'Y' | 'Z';
export type ResizeDirection = 'left' | 'right' | 'up' | 'down' | 'front' | 'back';

/**
 * Aşama 2.3 — Yönlü yeniden boyutlandırma ve komşu bölme çakışma önizlemesi taslak durumu.
 * Geçerli `Design` ve `ResolvedModel` verilerini bozmadan 3D sahnede kırmızı çakışma
 * önizlemesi ve komşu sınır dengeleme imkanı sunar.
 */
export interface ResizeDraftState {
  axis: ResizeAxis;
  direction: ResizeDirection;
  /** Boyutlandırılan hücre veya bitişik hücre grubu kimlikleri */
  targetCellIds: string[];
  bayId: string;
  runId: string;
  /** Mevcut toplam ölçü (grup ise brüt toplam, tek hücre ise net ölçü mm) */
  currentTotalMm: number;
  /** Kullanıcının talep ettiği yeni toplam ölçü (mm) */
  requestedTotalMm: number;
  /** Değişim miktarı (requestedTotalMm - currentTotalMm) */
  deltaMm: number;
  /** Grup içindeki ara bölücülerin toplam kalınlığı ((K - 1) * 18 mm) */
  internalDividersMm: number;
  /** Sabit kalan sınır açıklaması */
  fixedBoundaryLabel: string;
  /** Hareket eden sınır açıklaması */
  movingBoundaryLabel: string;
  /** Büyüme yönünde etkilenen komşu hücre kimlikleri (3D sahnede kırmızı vurgulanır) */
  neighborCellIds: string[];
  /** Etkilenen komşu bölmenin kullanıcı dostu etiketi */
  neighborLabel: string;
  /** Etkilenen komşunun mevcut ölçüsü (mm) */
  neighborCurrentMm: number;
  /** Kullanıcının komşu bölme için onayladığı/düzenlediği taslak ölçü (başlangıçta neighborCurrentMm) */
  neighborDraftMm: number;
  /** Çakışmanın sıfırlanması için komşu bölmenin alması gereken hedef ölçü (mm) */
  requiredNeighborMm: number;
  /** Güncel çakışma / üst üste binme miktarı (mm). 0 olduğunda çakışma giderilmiştir. */
  conflictOverlapMm: number;
  /** Dolap dış gövde sınırını veya duvar sınırını aşıyor mu? */
  exceedsBoundary: boolean;
  boundaryErrorReason?: string;
  /** 3D sahnede gösterilecek çakışma hacminin dünya merkezi ve boyutları (mm) */
  conflictBoxWorldCenterMm?: [number, number, number];
  conflictBoxWorldSizeMm?: [number, number, number];
  conflictBoxRotationYRad?: number;
}

export interface ResolvedLedStrip {
  id: string;
  runId: string;
  bayId?: string;
  cellId?: string;
  kind:
    | 'shelfUnder'
    | 'verticalSide'
    | 'hangingRod'
    | 'openBay'
    | 'cornerPentagon'
    | 'corner';
  worldPositionMm: [number, number, number];
  boxSizeMm: [number, number, number];
  rotationYRad: number;
  colorHex: string;
  intensity: number;
  coveringDoorIds: string[];
}

export interface ResolvedModel {
  designId: string;
  /** Aktif ana panel kalınlığı (varsayılan 18 mm) */
  panelThicknessMm: number;
  /** Aktif arkalık ve çekmece tabanı kalınlığı (varsayılan 8 mm) */
  backPanelThicknessMm: number;
  panels: ResolvedPanel[];
  doors: ResolvedDoorLeaf[];
  slidingDoors?: ResolvedSlidingLeaf[];
  slidingSystems?: ResolvedSlidingSystem[];
  drawers: ResolvedDrawerUnit[];
  bays: ResolvedBay[];
  cells: ResolvedCell[];
  corners: ResolvedCorner[];
  ledStrips: ResolvedLedStrip[];
  dimensions: DimensionAnnotation[];
  issues: ValidationIssue[];
  analysis?: StudioAnalysis;
  summary: {
    totalPanelsCount: number;
    totalDoorsCount: number;
    totalHangingLengthMm: number;
    totalShelfAreaM2: number;
    totalDrawerCount: number;
  };
}
