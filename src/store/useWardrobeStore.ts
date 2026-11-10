import { get as idbGet, set as idbSet } from 'idb-keyval';
import { produce } from 'immer';
import { create } from 'zustand';
import { ZodError } from 'zod';
import {
  type BlankDesignOptions,
  createBlankDesign,
  SAMPLE_DESIGNS,
} from '../core/presets/sampleDesigns';
import { normalizeAndValidateDesign, parseDesignJson, roundDesignMeasurements } from '../core/schema/designSchema';
import type {
  BayFrontMode,
  Design,
  ExteriorFinishConfig,
  ExteriorFinishPresetId,
  HandleConfig,
  InsertConfig,
  InteriorItemPreset,
  InteriorItemsConfig,
  JunctionType,
  LedLightingConfig,
  MaterialId,
  MaterialPalette,
  OwnerType,
  ResizeAxis,
  ResizeDirection,
  ResizeDraftState,
  ResolvedModel,
  SizeSpec,
  SplitNode,
} from '../core/schema/types';
import { solveDesign } from '../core/solver/carcassSolver';
import { validationConfig } from '../core/solver/validationConfig';
import {
  buildResizeDraftState,
  commitDirectionalResizeInDesign,
  divideCellIntoNInDesign,
  equalizeContiguousCellsInDesign,
  equalizeDrawerBankInDesign,
  mergeAndResplitSelectedGroupsInDesign,
  realizeSubIntervalInDesign,
  setCellInsertInDesign,
  setContiguousGroupIntervalCountInDesign,
  splitLeafInDesign,
  type SplitPresetKind,
  unsplitParentOfLeafInDesign,
  updateDrawerFrontHeightInDesign,
  updateLeafSizeInParent,
} from '../core/solver/treeMutator';
import { STANDARD_SERVICE_ITEMS } from '../core/inserts/insertRegistry';
import { applyStorageTemplateToDesign, copyBayInDesign, mirrorBayInDesign } from '../core/inserts/storageTemplates';
import { DEFAULT_PROFILES } from '../core/analysis/studioAnalysis';
import { automaticBayFront, configureFrontInDesign, splitFrontRangeInDesign } from '../core/fronts/frontCommands';
import { changeAccessLayout, type AccessRemedy } from '../core/fronts/accessRemedies';
import { frontVerticalRange, retainLegacyBodyAnchors } from '../core/fronts/frontGeometry';
import { defaultSlidingConfig } from '../core/solver/slidingSolver';
import type { Front, FrontType, SlidingFrontConfig } from '../core/schema/types';
import type { InventoryTarget, PersonProfile, QuickFix, RoomObstacle, RoomObstacleKind, StorageTemplateId } from '../core/schema/types';

const IDB_SESSION_KEY = 'wardrobe-studio:session:v2';
const LEGACY_IDB_KEY = 'wardrobe-studio:active-design:v1';
const LOCAL_STORAGE_SESSION_KEY = 'wardrobe-studio:session-sync:v2';
const MAX_HISTORY_STEPS = 50;
const designFingerprint = (value:Design) => JSON.stringify(value, (_key,v:unknown) => v && typeof v==='object' && !Array.isArray(v)
  ? Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))) : v);
const sameDesign = (a: Design, b: Design) => a === b || designFingerprint(a) === designFingerprint(b);

export type StudioViewMode = '3d-perspective' | '2d-front-A' | '2d-front-B' | '2d-plan-top';
export type StudioWorkflowStep = 'room-carcass' | 'interior-fronts' | 'view-export';
export type DoorVisibilityMode = 'normal' | 'xray' | 'hidden';
export type SurfaceMaterialSlot = 'carcass' | 'door' | 'drawerFront' | 'shelf';
const SURFACE_MATERIAL_FIELDS = {
  carcass: 'carcassMaterialId', door: 'frontMaterialId',
  drawerFront: 'drawerFrontMaterialId', shelf: 'shelfMaterialId',
} as const;
export type NewBayStarterKind =
  | 'shelves'
  | 'hanging'
  | 'longHanging'
  | 'doubleHanging'
  | 'drawers'
  | 'shoes'
  | 'serviceNiche'
  | 'empty';

export type NewBayStarterPreset = NewBayStarterKind;

export interface AddBayAtRunEndOptions {
  starterKind?: NewBayStarterKind;
  starterPreset?: NewBayStarterKind;
  widthMode: 'fixed' | 'flex';
  widthMm?: number;
  owner?: OwnerType;
  frontMode?: BayFrontMode;
  autoExtendRunLength?: boolean;
}

export interface HistoryEntry {
  label: string;
  snapshot: Design;
  timestampMs?: number;
}

export interface PersistedStudioSession {
  version: 2;
  checkpointDesign: Design;
  workingDesign: Design;
  historyPast: HistoryEntry[];
  historyFuture: HistoryEntry[];
  lastCheckpointAt: string | null;
  lastAutoSavedAt: string | null;
  savedAtMs?: number;
  recoveryJson?: string;
}

interface WardrobeState {
  openNamedVersion:(design:Design,name:string)=>boolean;
  setCornerHangingRod: (junctionId: string, enabled: boolean) => void;
  adjustShelfGrid: (cellId: string, direction: -1 | 0 | 1) => void;
  setSurfaceMaterial: (slot: SurfaceMaterialSlot, materialId: MaterialId) => void;
  updateRoomHeight: (field: 'roomHeightMm' | 'ceilingClearanceMm', valueMm: number) => void;
  isPartDragging: boolean;
  motionRevision: number;
  motionNotice: {id:string;reason:string;blockerId?:string}|null;
  setPartDragging: (active:boolean)=>void;
  notifyMotion: (notice:{id:string;reason:string;blockerId?:string}|null)=>void;
  refreshMotion: ()=>void;
  configureFrontSystem: (bayId:string,frontId:string|undefined,type:FrontType,sliding?:SlidingFrontConfig)=>void;
  patchFrontSystem: (frontId:string,patch:Partial<Front>)=>void;
  splitFrontSystem: (frontId:string)=>void;
  removeFrontSystem: (frontId:string)=>void;
  analysisOverlay: 'none' | 'ergonomics' | 'ownership';
  showRoomObstacles: boolean;
  showMotionSweeps: boolean;
  eyeLevelOwner: 'anne' | 'baba' | null;
  eyeCameraTick: number;
  selectedObstacleId: string | null;
  setAnalysisOverlay: (mode: 'none' | 'ergonomics' | 'ownership') => void;
  setShowRoomObstacles: (show:boolean) => void;
  setShowMotionSweeps: (show:boolean) => void;
  setEyeLevelCamera: (owner:'anne'|'baba'|null) => void;
  setPersonProfile: (owner:'anne'|'baba',patch:Partial<PersonProfile>) => void;
  setRunConstructionMode: (runId:string,mode:'shared'|'separate') => void;
  upsertInventoryTarget: (target:InventoryTarget) => void;
  removeInventoryTarget: (id:string) => void;
  addRoomObstacle: (kind:RoomObstacleKind) => void;
  updateRoomObstacle: (id:string,patch:Partial<RoomObstacle>) => void;
  removeRoomObstacle: (id:string) => void;
  selectRoomObstacle: (id:string|null) => void;
  setCornerOwner: (id:string,owner:OwnerType) => void;
  applyQuickFix: (fix:QuickFix) => boolean;
  applyAccessRemedy: (expectedDesign: Design, remedy: AccessRemedy) => boolean;
  applyStorageTemplate: (kind:StorageTemplateId,bayId:string,cellId?:string) => void;
  copyBay: (bayId:string,targetRunId:string,mirror?:boolean) => void;
  mirrorBay: (bayId:string) => void;
  commandError: string | null;
  clearCommandError: () => void;
  beginHistoryTransaction: () => void;
  endHistoryTransaction: () => void;
  design: Design;
  checkpointDesign: Design;
  resolved: ResolvedModel;
  viewMode: StudioViewMode;
  activeStep: StudioWorkflowStep;
  doorVisibilityMode: DoorVisibilityMode;
  renderQualityMode: 'edit' | 'presentation';
  openDoorIds: Record<string, boolean>;
  openDrawerIds: Record<string, boolean>;
  showDimensions: boolean;
  wireframeMode: boolean;
  selectedBayId: string | null;
  selectedCellId: string | null;
  /** Aşama 2.3: Çoklu seçilmiş hücre kimlikleri */
  selectedCellIds: string[];
  /** Aşama 2.4: Bağımsız seçilmiş çekmece kimlikleri */
  selectedDrawerId: string | null;
  selectedDrawerIds: string[];
  /** Aşama 2.4: Bağımsız Kapak Düzenleme Modu (Kapak Düzenle) ve seçili kapak kimlikleri */
  doorEditorMode: boolean;
  selectedDoorId: string | null;
  selectedDoorIds: string[];
  /** Aşama 2.4: 3D Kamera görünümü sıfırlama sayacı */
  cameraResetTick: number;
  /** Aşama 2.3: Dikdörtgen seçim çerçevesi sürüklenirken canlı vurgulanan hücreler */
  hoveredMarqueeCellIds: string[];
  /** Aşama 2.3: Açık Çoklu Seçim Aracı (tek sürüklemede dikdörtgen seçim) aktif mi? */
  multiSelectToolActive: boolean;
  /** Aşama 2.3: Yönlü yeniden boyutlandırma ve komşu bölme çakışma önizlemesi taslağı */
  resizeDraft: ResizeDraftState | null;
  historyPast: HistoryEntry[];
  historyFuture: HistoryEntry[];
  hasUnsavedChanges: boolean;
  persistenceStatus: 'idle' | 'saving' | 'saved' | 'partial' | 'restored' | 'error';
  recoveryJson: string | null;
  lastSavedAt: string | null;
  lastCheckpointAt: string | null;

  // Görünüm, İş Akışı ve Seçim Eylemleri
  setViewMode: (mode: StudioViewMode) => void;
  triggerCameraReset: () => void;
  setActiveStep: (step: StudioWorkflowStep) => void;
  setDoorVisibilityMode: (mode: DoorVisibilityMode) => void;
  setRenderQualityMode: (mode: 'edit' | 'presentation') => void;
  setShowDimensions: (show: boolean) => void;
  setWireframeMode: (wireframe: boolean) => void;
  selectBay: (bayId: string | null) => void;
  selectCell: (cellId: string | null, bayId?: string | null, additive?: boolean) => void;
  setSelectedCells: (cellIds: string[], bayId?: string | null) => void;
  selectDrawer: (
    drawerId: string | null,
    additiveOrCellId?: boolean | string,
    bayId?: string,
    additive?: boolean
  ) => void;
  clearDrawerSelection: () => void;
  setDoorEditorMode: (active: boolean) => void;
  selectDoor: (doorId: string | null, bayId?: string | null, additive?: boolean) => void;
  setHoveredMarqueeCells: (cellIds: string[]) => void;
  setMultiSelectToolActive: (active: boolean) => void;
  clearCellSelection: () => void;

  // Kapak ve Çekmece Kinematik Açma/Kapatma Eylemleri
  toggleDoor: (doorId: string) => void;
  toggleDrawer: (drawerId: string) => void;
  setAllDoorsOpen: (open: boolean) => void;
  setAllDrawersOpen: (open: boolean) => void;

  // Tasarım Komutları (Kalıcı Undo/Redo + Otomatik Kurtarma + Manuel Checkpoint)
  loadPreset: (presetId: string) => void;
  startBlankDesign: (options: BlankDesignOptions) => void;
  saveCheckpoint: () => void;
  updateRunDimension: (
    runId: string,
    field: 'lengthMm' | 'depthMm' | 'heightMm' | 'plinthHeightMm' | 'topFillerHeightMm',
    valueMm: number
  ) => void;
  updateMaterialThicknesses: (panelThicknessMm?: number, backPanelThicknessMm?: number) => void;
  setCornerType: (type: JunctionType) => void;
  updateCornerParam: (
    field: 'diagonalArmAMm' | 'diagonalArmBMm' | 'fillerWidthMm' | 'shelvesCount',
    value: number
  ) => void;
  setCornerDoorMode: (doorMode: 'left' | 'right' | 'open') => void;

  // Bölme (Bay) ve Kapak Editörü Komutları
  addBay: (runId: string) => void;
  addBayAtRunEnd: (
    runId: string,
    positionOrOptions: 'start' | 'end' | AddBayAtRunEndOptions,
    maybeOptions?: AddBayAtRunEndOptions
  ) => boolean;
  removeBay: (runId: string, bayId: string) => void;
  setBaySize: (runId: string, bayId: string, size: SizeSpec) => void;
  toggleBayLock: (runId: string, bayId: string) => void;
  setBayOwner: (runId: string, bayId: string, owner: OwnerType) => void;
  setBayFrontConfig: (
    runId: string,
    bayId: string,
    frontMode: BayFrontMode,
    hingeAngleDeg?: 110 | 155 | 165
  ) => void;
  updateDoorFrontConfig: (
    bayId: string,
    frontId: string | undefined,
    frontMode: BayFrontMode,
    hingeAngleDeg?: 110 | 155 | 165
  ) => void;
  splitBayDoorHorizontally: (bayId: string, splitAtYMm?: number) => void;
  mergeBayDoors: (bayId: string) => void;
  updateFrontVerticalBounds: (frontId: string, yStartMm: number, yEndMm: number) => void;
  setFrontBaySpan: (bayId: string, targetBayIds: string[]) => void;

  // Hücre Ağacı (SplitNode), Çekmece ve İç Modül (InsertRegistry) Komutları
  splitCell: (
    cellId: string,
    direction: 'horizontal' | 'vertical',
    preset?: SplitPresetKind
  ) => void;
  unsplitCell: (cellId: string) => void;
  isolateSubInterval: (cellId: string) => void;
  updateCellSizeInSplit: (cellId: string, size: SizeSpec, locked?: boolean) => void;
  setCellInsert: (
    cellId: string,
    insert: InsertConfig | null,
    label?: string,
    owner?: OwnerType,
    isolateSubInterval?: boolean
  ) => void;
  updateSelectedDrawerHeight: (drawerId: string, newHeightMm: number) => void;
  equalizeDrawerBankHeights: (cellId: string) => void;

  // Aşama 2.3 & 2.4: Çoklu Seçim, Toplu Bölme, Eşit Dağıtma, Çoklu Raf Grubu Birleştirme ve Yönlü Çakışma Önizlemesi
  divideCellIntoN: (
    cellId: string,
    direction: 'horizontal' | 'vertical',
    count: number
  ) => void;
  setContiguousGroupIntervalCount: (targetIntervalCount: number) => void;
  equalizeSelectedCells: () => void;
  mergeAndResplitSelectedGroups: (targetIntervalCount: number) => void;
  batchSplitSelectedCells: (direction: 'horizontal' | 'vertical') => void;
  batchSetSelectedCellsInsert: (insert: InsertConfig) => void;
  startOrUpdateResizeDraft: (
    axis: ResizeAxis,
    direction: ResizeDirection,
    requestedTotalMm: number,
    customNeighborDraftMm?: number
  ) => void;
  updateResizeDraftNeighborMm: (neighborDraftMm: number) => void;
  autoBalanceResizeDraftNeighbor: () => void;
  cancelResizeDraft: () => void;
  commitResizeDraft: () => boolean;

  setMaterials: (palette: Partial<MaterialPalette>) => void;
  setGlobalDoorHandle: (patch: Partial<HandleConfig>) => void;
  setGlobalDrawerHandle: (patch: Partial<HandleConfig>) => void;
  setDoorMaterialAndHandle: (
    bayId: string,
    frontId: string | undefined,
    materialId?: MaterialId | null,
    handlePatch?: Partial<HandleConfig> | null
  ) => void;
  setDrawerMaterialAndHandle: (
    cellId: string,
    materialId?: MaterialId | null,
    handlePatch?: Partial<HandleConfig> | null
  ) => void;
  setLedLighting: (patch: Partial<LedLightingConfig>) => void;
  applyExteriorFinishPreset: (presetId: ExteriorFinishPresetId) => void;
  setExteriorFinish: (patch: Partial<ExteriorFinishConfig>) => void;
  setInteriorItemsConfig: (patch: Partial<InteriorItemsConfig>) => void;
  setCellItemPreset: (
    cellId: string,
    itemPreset: InteriorItemPreset,
    itemCountOverride?: number
  ) => void;

  // Geçmiş ve Kalıcılık
  undo: () => void;
  undoSteps: (stepCount: number) => void;
  revertToCheckpoint: () => void;
  redo: () => void;
  exportJsonString: () => string;
  importJsonString: (rawJson: string) => { ok: boolean; error?: string };
  hydrateFromIndexedDB: () => Promise<void>;
}

const defaultInitialDesign = structuredClone(SAMPLE_DESIGNS['l-diagonal-asymmetric']);

function formatNowTime(): string {
  return new Date().toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function validateSessionEnvelope(raw: unknown): PersistedStudioSession | null {
  if (!raw || typeof raw !== 'object') return null;
  const candidate = raw as Partial<PersistedStudioSession>;
  if (candidate.version !== 2 || !candidate.workingDesign || !candidate.checkpointDesign) {
    return null;
  }
  try {
    const workingDesign = normalizeAndValidateDesign(candidate.workingDesign);
    const checkpointDesign = normalizeAndValidateDesign(candidate.checkpointDesign);
    const historyPast: HistoryEntry[] = Array.isArray(candidate.historyPast)
      ? candidate.historyPast
          .filter((item) => item && typeof item.label === 'string' && item.snapshot)
          .map((item) => ({
            label: item.label,
            snapshot: normalizeAndValidateDesign(item.snapshot),
            timestampMs: item.timestampMs,
          }))
      : [];
    const historyFuture: HistoryEntry[] = Array.isArray(candidate.historyFuture)
      ? candidate.historyFuture
          .filter((item) => item && typeof item.label === 'string' && item.snapshot)
          .map((item) => ({
            label: item.label,
            snapshot: normalizeAndValidateDesign(item.snapshot),
            timestampMs: item.timestampMs,
          }))
      : [];

    return {
      version: 2,
      workingDesign,
      checkpointDesign,
      historyPast,
      historyFuture,
      lastCheckpointAt: candidate.lastCheckpointAt ?? null,
      lastAutoSavedAt: candidate.lastAutoSavedAt ?? null,
      savedAtMs: typeof candidate.savedAtMs === 'number' && Number.isFinite(candidate.savedAtMs)
        ? candidate.savedAtMs : undefined,
      recoveryJson: typeof candidate.recoveryJson === 'string' ? candidate.recoveryJson : undefined,
    };
  } catch {
    return null;
  }
}

function readSyncSessionFromLocalStorage(): { session: PersistedStudioSession | null; recoveryJson?: string } {
  let raw: string | null = null;
  try {
    raw = (globalThis.window?.localStorage ?? globalThis.localStorage)?.getItem(LOCAL_STORAGE_SESSION_KEY) ?? null;
    if (!raw) return { session: null };
    const session = validateSessionEnvelope(JSON.parse(raw));
    return { session, recoveryJson: session ? session.recoveryJson : raw };
  } catch {
    return { session: null, recoveryJson: raw ?? undefined };
  }
}

export const useWardrobeStore = create<WardrobeState>((set, get) => {
  let transactionActive = false;
  let transactionRecorded = false;
  let sessionRevision = 0;
  let hydrationRequest = 0;
  let indexedWrites = Promise.resolve();
  const boot = readSyncSessionFromLocalStorage();
  const syncRestored = boot.session;
  let savedAtMs = syncRestored?.savedAtMs ?? 0;
  const bootWorkingDesign = syncRestored?.workingDesign ?? defaultInitialDesign;
  const bootCheckpointDesign = syncRestored?.checkpointDesign ?? structuredClone(bootWorkingDesign);
  const bootResolved = solveDesign(bootWorkingDesign);
  const bootPast = syncRestored?.historyPast ?? [];
  const bootFuture = syncRestored?.historyFuture ?? [];

  const saveCurrentStateToStorage = (
    nextDesign: Design,
    nextCheckpoint: Design,
    nextPast: HistoryEntry[],
    nextFuture: HistoryEntry[],
    nextCheckpointAt: string | null
  ) => {
    const now = formatNowTime();
    const revision = ++sessionRevision;
    savedAtMs = Math.max(Date.now(), savedAtMs + 1);
    const envelope: PersistedStudioSession = {
      version: 2,
      workingDesign: nextDesign,
      checkpointDesign: nextCheckpoint,
      historyPast: nextPast,
      historyFuture: nextFuture,
      lastCheckpointAt: nextCheckpointAt,
      lastAutoSavedAt: now,
      savedAtMs,
      recoveryJson: get().recoveryJson ?? undefined,
    };
    let syncSaved = false;
    try {
      const storage = globalThis.window?.localStorage ?? globalThis.localStorage;
      if (storage) {
        storage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(envelope));
        syncSaved = true;
      }
    } catch {
      // IndexedDB is attempted independently.
    }
    const canWriteIndexed = typeof indexedDB !== 'undefined';
    set({
      persistenceStatus: canWriteIndexed ? 'saving' : syncSaved ? 'partial' : 'error',
      ...(syncSaved ? { lastSavedAt: now } : {}),
    });
    if (!canWriteIndexed) return;
    indexedWrites = indexedWrites.then(async () => {
      if (revision !== sessionRevision) return;
      let indexedSaved = false;
      try {
        await idbSet(IDB_SESSION_KEY, envelope);
        indexedSaved = true;
      } catch {
        // Keep the result of the synchronous write.
      }
      if (revision !== sessionRevision) return;
      const durable = indexedSaved || syncSaved;
      set({
        persistenceStatus: indexedSaved && syncSaved ? 'saved' : durable ? 'partial' : 'error',
        ...(durable ? { lastSavedAt: now } : {}),
      });
    });
  };

  const applyCommand = (label: string, mutator: (draft: Design) => void, keepLegacyAnchors = true) => {
    const currentDesign = get().design;
    let nextDesign: Design;
    try {
      const draft = roundDesignMeasurements(produce(currentDesign, mutator));
      if (keepLegacyAnchors) retainLegacyBodyAnchors(currentDesign, draft);
      nextDesign = normalizeAndValidateDesign(draft);
    } catch (error) {
      set({ commandError: error instanceof Error ? error.message : 'Ölçü veya tasarım geçersiz.' });
      return false;
    }
    const nextResolved = solveDesign(nextDesign);
    const allocationError = nextResolved.issues.find(i => i.code === 'DIMENSION_ALLOCATION_INVALID');
    if (allocationError) { set({ commandError: allocationError.description }); return false; }
    if (sameDesign(currentDesign, nextDesign)) return true;
    const nowMs = Date.now();
    const past = get().historyPast;

    const nextPast: HistoryEntry[] = transactionActive && transactionRecorded ? past : [
      ...past.slice(-(MAX_HISTORY_STEPS - 1)),
      {
        label,
        snapshot: currentDesign,
        timestampMs: nowMs,
      },
    ];
    if (transactionActive) transactionRecorded = true;
    const nextFuture: HistoryEntry[] = [];

    const validSelectedIds = get().selectedCellIds.filter((id) =>
      nextResolved.cells.some((c) => c.id === id)
    );
    const validDrawerIds = get().selectedDrawerIds.filter((id) =>
      nextResolved.drawers.some((d) => d.id === id)
    );
    const validDoorIds = get().selectedDoorIds.filter((id) =>
      nextResolved.doors.some((d) => d.id === id) || nextResolved.slidingDoors?.some(d=>d.id===id)
    );
    const doorIds = new Set([...nextResolved.doors, ...(nextResolved.slidingDoors ?? [])].map(door => door.id));
    const drawerIds = new Set(nextResolved.drawers.map(drawer => drawer.id));

    set({
      design: nextDesign,
      resolved: nextResolved,
      historyPast: nextPast,
      historyFuture: nextFuture,
      hasUnsavedChanges: !sameDesign(nextDesign, get().checkpointDesign),
      commandError: null,
      selectedCellIds: validSelectedIds,
      selectedCellId: validSelectedIds[0] ?? null,
      selectedDrawerIds: validDrawerIds,
      selectedDrawerId: validDrawerIds[0] ?? null,
      selectedDoorIds: validDoorIds,
      selectedDoorId: validDoorIds[0] ?? null,
      openDoorIds: Object.fromEntries(Object.entries(get().openDoorIds).filter(([id]) => doorIds.has(id))),
      openDrawerIds: Object.fromEntries(Object.entries(get().openDrawerIds).filter(([id]) => drawerIds.has(id))),
      resizeDraft: null,
    });

    saveCurrentStateToStorage(
      nextDesign,
      get().checkpointDesign,
      nextPast,
      nextFuture,
      get().lastCheckpointAt
    );
    return true;
  };

  return {
    applyAccessRemedy: (expectedDesign, remedy) => {
      if (get().design !== expectedDesign) return false;
      return applyCommand('İşlevsel erişim düzeni uygulandı', draft => changeAccessLayout(draft, remedy));
    },
    openNamedVersion:(design,name)=>{
      if (!applyCommand(`Sürüm açıldı: ${name}`,()=>structuredClone(design),false)) return false;
      set({selectedBayId:design.runs[0]?.bays[0]?.id??null,selectedCellId:null,selectedCellIds:[],selectedDrawerId:null,selectedDrawerIds:[],selectedDoorId:null,selectedDoorIds:[],openDoorIds:{},openDrawerIds:{},motionNotice:null});
      return true;
    },
    updateRoomHeight: (field, valueMm) => {
      applyCommand('Oda tavanı ve montaj boşluğu güncellendi', draft => { draft[field] = Math.round(valueMm); });
    },
    isPartDragging:false,motionRevision:0,motionNotice:null,
    setPartDragging:isPartDragging=>set({isPartDragging}),
    refreshMotion:()=>set(s=>({motionRevision:s.motionRevision+1})),
    notifyMotion:motionNotice=>{const current=get().motionNotice;if(current?.id!==motionNotice?.id||current?.reason!==motionNotice?.reason)set({motionNotice});},
    configureFrontSystem:(bayId,frontId,type,sliding)=>{const model=get().resolved;applyCommand('Kapak sistemi değiştirildi',draft=>{configureFrontInDesign(draft,model,bayId,frontId,type,sliding);});},
    patchFrontSystem:(frontId,patch)=>{applyCommand('Kapak kapsamı ve ray ayarları',draft=>{const front=draft.fronts.find(f=>f.id===frontId);if(!front)throw new Error('Kapak aralığı bulunamadı.');Object.assign(front,patch);});},
    splitFrontSystem:frontId=>{applyCommand('Kapak üst/alt sisteme ayrıldı',draft=>splitFrontRangeInDesign(draft,frontId));},
    removeFrontSystem:frontId=>{applyCommand('Kapak aralığı açıldı',draft=>{const f=draft.fronts.find(f=>f.id===frontId);if(f){f.type='open';delete f.sliding;}});},
    analysisOverlay:'none',showRoomObstacles:true,showMotionSweeps:false,eyeLevelOwner:null,eyeCameraTick:0,selectedObstacleId:null,
    setAnalysisOverlay: analysisOverlay => set({analysisOverlay}),
    setShowRoomObstacles: showRoomObstacles => set({showRoomObstacles}),
    setShowMotionSweeps: showMotionSweeps => set({showMotionSweeps}),
    setEyeLevelCamera: owner => set(s=>({eyeLevelOwner:owner,viewMode:'3d-perspective',eyeCameraTick:s.eyeCameraTick+1})),
    selectRoomObstacle: selectedObstacleId => set({selectedObstacleId}),
    setPersonProfile: (owner,patch) => {
      applyCommand(`${owner==='anne'?'Anne':'Baba'} ergonomi profili`,draft=>{
        draft.ergonomics??=JSON.parse(JSON.stringify(DEFAULT_PROFILES));
        Object.assign(draft.ergonomics![owner],patch);
      });
      if(get().eyeLevelOwner===owner) set(s=>({eyeCameraTick:s.eyeCameraTick+1}));
    },
    setRunConstructionMode: (id,mode) => { applyCommand(`${id}: ${mode==='shared'?'Paylaşımlı dikme':'Ayrı gövdeler'}`,draft=>{const run=draft.runs.find(r=>r.id===id);if(run)run.constructionMode=mode;}); },
    setCornerOwner: (id,owner) => {applyCommand('Köşe sahipliği',draft=>{const j=draft.junctions.find(j=>j.id===id);if(j)j.owner=owner;});},
    setCornerHangingRod: (junctionId, enabled) => {
      applyCommand('Beşgen köşe askı borusu', draft => {
        const corner = draft.junctions.find(junction => junction.id === junctionId && junction.type === 'diagonal');
        if (corner) corner.hasHangingRod = enabled;
      });
    },
    upsertInventoryTarget: target => {applyCommand('Envanter hedefi',draft=>{draft.inventory??=[];const i=draft.inventory.findIndex(t=>t.id===target.id);const clean={...target,quantity:Math.max(0,Math.round(target.quantity))};if(i<0)draft.inventory.push(clean);else draft.inventory[i]=clean;});},
    removeInventoryTarget: id => {applyCommand('Envanter hedefi kaldırıldı',draft=>{draft.inventory=(draft.inventory??[]).filter(t=>t.id!==id);});},
    addRoomObstacle: kind => {
      const defaults:Record<RoomObstacleKind,{label:string;size:[number,number,number];y?:number}>={
        bed:{label:'Yatak',size:[1600,550,2000]},roomDoor:{label:'Oda kapısı',size:[900,2100,40]},window:{label:'Pencere',size:[1200,1200,60],y:900},
        radiator:{label:'Radyatör',size:[1000,600,150],y:100},socket:{label:'Priz / anahtar',size:[90,90,35],y:350},pillar:{label:'Kolon',size:[300,2550,300]},
        beam:{label:'Kiriş',size:[1200,300,400],y:2200},skirting:{label:'Süpürgelik',size:[1500,100,20]},other:{label:'Diğer engel',size:[600,800,500]},
      };
      const preset=defaults[kind], id=`obstacle-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
      const obstacle:RoomObstacle={id,label:preset.label,kind,sizeMm:preset.size,positionMm:[400,preset.y??0,kind==='bed'?900:0],rotationDeg:0,...(kind==='roomDoor'?{openingAngleDeg:90,hingeSide:'left' as const}:{})};
      if(applyCommand(`${preset.label} eklendi`,draft=>{draft.obstacles??=[];draft.obstacles.push(obstacle);}))set({selectedObstacleId:id,showRoomObstacles:true,showMotionSweeps:true});
    },
    updateRoomObstacle: (id,patch) => {applyCommand('Oda engeli düzenlendi',draft=>{const o=draft.obstacles?.find(o=>o.id===id);if(o)Object.assign(o,patch);});},
    removeRoomObstacle: id => {applyCommand('Oda engeli kaldırıldı',draft=>{draft.obstacles=(draft.obstacles??[]).filter(o=>o.id!==id);});if(get().selectedObstacleId===id)set({selectedObstacleId:null});},
    applyQuickFix: fix => {
      const current=get().resolved;
      return applyCommand(`Hızlı düzeltme: ${fix.label}`,draft=>{
        if(fix.kind==='hinge155') {for(const r of draft.runs)for(const b of r.bays)if(b.id===fix.bayId)b.hingeAngleDeg=155;for(const f of draft.fronts)if(f.bayIds.includes(fix.bayId))f.openingAngleDeg=155;}
        else if(fix.kind==='moveObstacle') {const o=draft.obstacles?.find(o=>o.id===fix.obstacleId);if(!o)throw new Error('Engel artık mevcut değil.');o.positionMm=[...fix.positionMm];}
        else {
          const c=current.cells.find(c=>c.id===fix.cellId||c.sourceLeafId===fix.cellId);
          if(!c)throw new Error('Hedef hücre artık mevcut değil.');
          const actual=fix.kind==='lowerRod'&&c.id.includes('::sub-')?realizeSubIntervalInDesign(draft,c.id):(c.sourceLeafId??c.id);
          const visit=(node:SplitNode):void=>{if(node.kind==='leaf'&&node.id===actual&&node.insert){if(fix.kind==='lowerRod')node.insert.rodHeightMm=fix.heightMm;else node.insert.shelfCount=fix.count;}else if(node.kind==='split')node.children.forEach(ch=>visit(ch.node));};
          draft.runs.forEach(r=>r.bays.forEach(b=>visit(b.root)));
        }
      });
    },
    applyStorageTemplate: (kind,bayId,cellId) => {
      const current=get().resolved;
      if(applyCommand('Özel depolama şablonu',draft=>applyStorageTemplateToDesign(draft,current,kind,bayId,cellId)))get().selectBay(bayId);
    },
    copyBay: (bayId,targetRunId,mirror=false) => {
      const current=get().resolved; let copied='';
      if(applyCommand(mirror?'Bölme aynalanarak kopyalandı':'Bölme kopyalandı',draft=>{copied=copyBayInDesign(draft,current,bayId,targetRunId,mirror);}))get().selectBay(copied);
    },
    mirrorBay: bayId => {const current=get().resolved;applyCommand('Bölme simetrik aynalandı',draft=>mirrorBayInDesign(draft,bayId,current));},
    commandError: null,
    clearCommandError: () => set({ commandError: null }),
    beginHistoryTransaction: () => { if(!transactionActive) {transactionActive = true; transactionRecorded = false;} },
    endHistoryTransaction: () => { transactionActive = false; transactionRecorded = false; },
    design: bootWorkingDesign,
    checkpointDesign: bootCheckpointDesign,
    resolved: bootResolved,
    viewMode: '3d-perspective',
    activeStep: 'room-carcass',
    doorVisibilityMode: 'normal',
    renderQualityMode: 'edit',
    openDoorIds: {},
    openDrawerIds: {},
    showDimensions: true,
    wireframeMode: false,
    selectedBayId: bootResolved.bays[0]?.id ?? 'bay-A1',
    selectedCellId: null,
    selectedCellIds: [],
    selectedDrawerId: null,
    selectedDrawerIds: [],
    doorEditorMode: false,
    selectedDoorId: null,
    selectedDoorIds: [],
    cameraResetTick: 0,
    hoveredMarqueeCellIds: [],
    multiSelectToolActive: false,
    resizeDraft: null,
    historyPast: bootPast,
    historyFuture: bootFuture,
    hasUnsavedChanges: !sameDesign(bootWorkingDesign, bootCheckpointDesign),
    persistenceStatus: syncRestored ? 'restored' : boot.recoveryJson ? 'error' : 'idle',
    recoveryJson: boot.recoveryJson ?? null,
    lastSavedAt: syncRestored?.lastAutoSavedAt ?? null,
    lastCheckpointAt: syncRestored?.lastCheckpointAt ?? null,

    setViewMode: (viewMode) => set({ viewMode }),
    triggerCameraReset: () => set((s) => ({ cameraResetTick: s.cameraResetTick + 1, eyeLevelOwner:null })),
    setActiveStep: (activeStep) => set(activeStep === 'view-export'
      ? { activeStep, doorEditorMode: false, selectedDoorId: null, selectedDoorIds: [],
        selectedCellId: null, selectedCellIds: [], selectedDrawerId: null, selectedDrawerIds: [], resizeDraft: null }
      : { activeStep }),
    setDoorVisibilityMode: (doorVisibilityMode) => set({ doorVisibilityMode }),
    setRenderQualityMode: (renderQualityMode) => set({ renderQualityMode }),
    setShowDimensions: (showDimensions) => set({ showDimensions }),
    setWireframeMode: (wireframeMode) => set({ wireframeMode }),
    selectBay: (selectedBayId) => {
      const firstCell = get().resolved.cells.find((c) => c.bayId === selectedBayId);
      const nextCellId = firstCell ? firstCell.id : null;
      set({
        selectedBayId,
        selectedCellId: nextCellId,
        selectedCellIds: nextCellId ? [nextCellId] : [],
        selectedDrawerId: null,
        selectedDrawerIds: [],
        selectedDoorId: null,
        selectedDoorIds: [],
        resizeDraft: null,
      });
    },
    selectCell: (selectedCellId, bayId, additive = false) =>
      set((s) => {
        if (selectedCellId === null) {
          return {
            selectedCellId: null,
            selectedCellIds: [],
            selectedDrawerId: null,
            selectedDrawerIds: [],
            selectedDoorId: null,
            selectedDoorIds: [],
            selectedBayId: bayId !== undefined ? bayId : s.selectedBayId,
            resizeDraft: null,
          };
        }
        if (additive) {
          const exists = s.selectedCellIds.includes(selectedCellId);
          const nextIds = exists
            ? s.selectedCellIds.filter((id) => id !== selectedCellId)
            : [...s.selectedCellIds, selectedCellId];
          const primaryId = nextIds[0] ?? null;
          const primaryCell = s.resolved.cells.find((c) => c.id === primaryId);
          return {
            selectedCellId: primaryId,
            selectedCellIds: nextIds,
            selectedDrawerId: null,
            selectedDrawerIds: [],
            selectedDoorId: null,
            selectedDoorIds: [],
            selectedBayId: primaryCell?.bayId ?? (bayId !== undefined ? bayId : s.selectedBayId),
            resizeDraft: null,
          };
        }
        return {
          selectedCellId,
          selectedCellIds: [selectedCellId],
          selectedDrawerId: null,
          selectedDrawerIds: [],
          selectedDoorId: null,
          selectedDoorIds: [],
          selectedBayId: bayId !== undefined ? bayId : s.selectedBayId,
          resizeDraft: null,
        };
      }),

    setSelectedCells: (cellIds, bayId) =>
      set((s) => {
        const unique = Array.from(
          new Set(cellIds.filter((id) => s.resolved.cells.some((c) => c.id === id)))
        );
        const primaryId = unique[0] ?? null;
        const primaryCell = primaryId ? s.resolved.cells.find((c) => c.id === primaryId) : null;
        return {
          selectedCellIds: unique,
          selectedCellId: primaryId,
          selectedDrawerId: null,
          selectedDrawerIds: [],
          selectedDoorId: null,
          selectedDoorIds: [],
          selectedBayId: primaryCell?.bayId ?? (bayId !== undefined ? bayId : s.selectedBayId),
          hoveredMarqueeCellIds: [],
          resizeDraft: null,
        };
      }),

    selectDrawer: (drawerId, additiveOrCellId = false, _bayId, additive) =>
      set((s) => {
        if (!drawerId) {
          return {
            selectedDrawerId: null,
            selectedDrawerIds: [],
            resizeDraft: null,
          };
        }
        const drw = s.resolved.drawers.find((d) => d.id === drawerId);
        if (!drw) return {};

        const isAdditive =
          typeof additiveOrCellId === 'boolean' ? additiveOrCellId : Boolean(additive);

        if (isAdditive) {
          const exists = s.selectedDrawerIds.includes(drawerId);
          const nextIds = exists
            ? s.selectedDrawerIds.filter((id) => id !== drawerId)
            : [...s.selectedDrawerIds, drawerId];
          const primaryId = nextIds[0] ?? null;
          const primaryDrw = s.resolved.drawers.find((d) => d.id === primaryId);
          return {
            selectedDrawerId: primaryId,
            selectedDrawerIds: nextIds,
            selectedCellId: null,
            selectedCellIds: [],
            selectedDoorId: null,
            selectedDoorIds: [],
            selectedBayId: primaryDrw?.bayId ?? drw.bayId,
            resizeDraft: null,
          };
        }

        return {
          selectedDrawerId: drawerId,
          selectedDrawerIds: [drawerId],
          selectedCellId: null,
          selectedCellIds: [],
          selectedDoorId: null,
          selectedDoorIds: [],
          selectedBayId: drw.bayId,
          resizeDraft: null,
        };
      }),

    clearDrawerSelection: () =>
      set({
        selectedDrawerId: null,
        selectedDrawerIds: [],
      }),

    setDoorEditorMode: (doorEditorMode) =>
      set((s) => {
        if (!doorEditorMode) {
          return {
            doorEditorMode: false,
            selectedDoorId: null,
            selectedDoorIds: [],
          };
        }
        const firstDoorInBay =
          s.resolved.doors.find((d) => d.bayId === s.selectedBayId) ?? s.resolved.doors[0];
        return {
          doorEditorMode: true,
          multiSelectToolActive: false,
          doorVisibilityMode: s.doorVisibilityMode === 'hidden' ? 'normal' : s.doorVisibilityMode,
          selectedDoorId: firstDoorInBay?.id ?? null,
          selectedDoorIds: firstDoorInBay ? [firstDoorInBay.id] : [],
          selectedCellId: null,
          selectedCellIds: [],
          selectedDrawerId: null,
          selectedDrawerIds: [],
          resizeDraft: null,
        };
      }),

    selectDoor: (doorId, bayId, additive = false) =>
      set((s) => {
        if (!doorId) {
          return {
            selectedDoorId: null,
            selectedDoorIds: [],
            selectedBayId: bayId !== undefined ? bayId : s.selectedBayId,
          };
        }
        const door = s.resolved.doors.find((d) => d.id === doorId) ?? s.resolved.slidingDoors?.find(d=>d.id===doorId);
        if (additive) {
          const exists = s.selectedDoorIds.includes(doorId);
          const nextIds = exists
            ? s.selectedDoorIds.filter((id) => id !== doorId)
            : [...s.selectedDoorIds, doorId];
          const primaryId = nextIds[0] ?? null;
          const primaryDoor = s.resolved.doors.find((d) => d.id === primaryId) ?? s.resolved.slidingDoors?.find(d=>d.id===primaryId);
          return {
            selectedDoorId: primaryId,
            selectedDoorIds: nextIds,
            selectedCellId: null,
            selectedCellIds: [],
            selectedDrawerId: null,
            selectedDrawerIds: [],
            selectedBayId: primaryDoor?.bayId ?? door?.bayId ?? bayId ?? s.selectedBayId,
          };
        }
        return {
          selectedDoorId: doorId,
          selectedDoorIds: [doorId],
          selectedCellId: null,
          selectedCellIds: [],
          selectedDrawerId: null,
          selectedDrawerIds: [],
          selectedBayId: door?.bayId ?? bayId ?? s.selectedBayId,
        };
      }),

    setHoveredMarqueeCells: (hoveredMarqueeCellIds) => set({ hoveredMarqueeCellIds }),

    setMultiSelectToolActive: (multiSelectToolActive) =>
      set((s) => ({
        multiSelectToolActive,
        doorEditorMode: multiSelectToolActive ? false : s.doorEditorMode,
        hoveredMarqueeCellIds: [],
      })),

    clearCellSelection: () =>
      set({
        selectedCellId: null,
        selectedCellIds: [],
        selectedDrawerId: null,
        selectedDrawerIds: [],
        selectedDoorId: null,
        selectedDoorIds: [],
        hoveredMarqueeCellIds: [],
        resizeDraft: null,
      }),

    toggleDoor: (doorId) => {
      set((state) => {
        const isCurrentlyOpen = Boolean(state.openDoorIds[doorId]);
        const nextOpen = !isCurrentlyOpen;
        const nextDoorMap = {
          ...state.openDoorIds,
          [doorId]: nextOpen,
        };
        const nextDrawerMap = { ...state.openDrawerIds };

        if (!nextOpen && state.resolved.doors.some(d=>d.id===doorId)) {
          for (const drawer of state.resolved.drawers) {
            if (drawer.coveringDoorIds.includes(doorId) && nextDrawerMap[drawer.id]) {
              nextDrawerMap[drawer.id] = false;
            }
          }
        }

        return {
          openDoorIds: nextDoorMap,
          openDrawerIds: nextDrawerMap,
        };
      });
    },

    toggleDrawer: (drawerId) => {
      set((state) => {
        const isCurrentlyOpen = Boolean(state.openDrawerIds[drawerId]);
        const nextOpen = !isCurrentlyOpen;
        const nextDrawerMap = {
          ...state.openDrawerIds,
          [drawerId]: nextOpen,
        };
        const nextDoorMap = { ...state.openDoorIds };

        if (nextOpen) {
          const targetDrawer = state.resolved.drawers.find((d) => d.id === drawerId);
          if (targetDrawer && targetDrawer.coveringDoorIds.length > 0) {
            for (const coveringDoorId of targetDrawer.coveringDoorIds) {
              if(state.resolved.doors.some(d=>d.id===coveringDoorId))nextDoorMap[coveringDoorId] = true;
            }
          }
        }

        return {
          openDoorIds: nextDoorMap,
          openDrawerIds: nextDrawerMap,
        };
      });
    },

    setAllDoorsOpen: (open) => {
      set((state) => {
        const nextDoors: Record<string, boolean> = {};
        for (const door of state.resolved.doors) {
          nextDoors[door.id] = open;
        }
        for (const door of state.resolved.slidingDoors??[])nextDoors[door.id]=open;
        const nextDrawers = { ...state.openDrawerIds };
        if (!open) {
          for (const drw of state.resolved.drawers) {
            if (drw.coveringDoorIds.length > 0) {
              nextDrawers[drw.id] = false;
            }
          }
        }
        return {
          openDoorIds: nextDoors,
          openDrawerIds: nextDrawers,
        };
      });
    },

    setAllDrawersOpen: (open) => {
      set((state) => {
        const nextDrawers: Record<string, boolean> = {};
        const nextDoors = { ...state.openDoorIds };
        for (const drw of state.resolved.drawers) {
          nextDrawers[drw.id] = open;
          if (open && drw.coveringDoorIds.length > 0) {
            for (const doorId of drw.coveringDoorIds) {
              if(state.resolved.doors.some(d=>d.id===doorId))nextDoors[doorId] = true;
            }
          }
        }
        return {
          openDrawerIds: nextDrawers,
          openDoorIds: nextDoors,
        };
      });
    },

    loadPreset: (presetId) => {
      const target = SAMPLE_DESIGNS[presetId];
      if (!target) return;
      const cloned = structuredClone(target);
      const nextResolved = solveDesign(cloned);
      const firstBay = nextResolved.bays[0]?.id ?? null;
      const firstCell = nextResolved.cells.find((c) => c.bayId === firstBay)?.id ?? null;
      const now = formatNowTime();

      set({
        design: cloned,
        checkpointDesign: structuredClone(cloned),
        resolved: nextResolved,
        selectedBayId: firstBay,
        selectedCellId: firstCell,
        selectedCellIds: firstCell ? [firstCell] : [],
        hoveredMarqueeCellIds: [],
        resizeDraft: null,
        openDoorIds: {},
        openDrawerIds: {},
        historyPast: [],
        historyFuture: [],
        hasUnsavedChanges: false,
        lastCheckpointAt: now,
      });

      saveCurrentStateToStorage(cloned, structuredClone(cloned), [], [], now);
    },

    startBlankDesign: (options) => {
      const blank = createBlankDesign(options);
      if (!applyCommand(`Sıfırdan Boş Tasarım: ${blank.name}`, () => blank)) return;
      const firstBay = get().resolved.bays[0]?.id ?? null;
      set({
        selectedBayId: firstBay,
        selectedCellId: null,
        selectedCellIds: [],
        hoveredMarqueeCellIds: [],
        resizeDraft: null,
        openDoorIds: {},
        openDrawerIds: {},
      });
    },

    saveCheckpoint: () => {
      const currentDesign = structuredClone(get().design);
      const now = formatNowTime();
      set({
        checkpointDesign: currentDesign,
        historyPast: [],
        historyFuture: [],
        hasUnsavedChanges: false,
        lastCheckpointAt: now,
      });

      saveCurrentStateToStorage(currentDesign, currentDesign, [], [], now);
    },

    updateRunDimension: (runId, field, valueMm) => {
      const cleanInt = Math.round(valueMm);
      applyCommand(`${runId} ${field} = ${cleanInt} mm`, (draft) => {
        const run = draft.runs.find((r) => r.id === runId);
        if (!run) return;
        run[field] = cleanInt;
        if (field === 'heightMm') {
          for (const other of draft.runs) {
            other.heightMm = cleanInt;
          }
        }
      });
    },

    updateMaterialThicknesses: (panelThicknessMm, backPanelThicknessMm) => {
      const currentResolved = get().resolved;
      const cleanPanelT = Math.max(
        12,
        Math.min(36, Math.round(panelThicknessMm ?? currentResolved.panelThicknessMm))
      );
      const cleanBackT = Math.max(
        3,
        Math.min(18, Math.round(backPanelThicknessMm ?? currentResolved.backPanelThicknessMm))
      );
      applyCommand(
        `Malzeme Kalınlıkları Güncellendi (Ana: ${cleanPanelT} mm, İnce/Arkalık: ${cleanBackT} mm)`,
        (draft) => {
          for (const r of draft.runs) {
            for (const front of draft.fronts) {
              const rails = front.sliding;
              if (front.runId !== r.id || front.type !== 'sliding' || !rails) continue;
              const before = defaultSlidingConfig(r.panelThicknessMm, rails.trackCount);
              const next = defaultSlidingConfig(cleanPanelT, rails.trackCount);
              if (rails.trackSpacingMm === before.trackSpacingMm) rails.trackSpacingMm = next.trackSpacingMm;
              if (rails.trackDepthMm === before.trackDepthMm) rails.trackDepthMm = Math.max(next.trackDepthMm,
                18 + cleanPanelT + (rails.trackCount - 1) * rails.trackSpacingMm);
            }
            r.panelThicknessMm = cleanPanelT;
            r.backPanelThicknessMm = cleanBackT;
          }
        }
      );
    },

    setCornerType: (type) => {
      applyCommand(`Köşe Tipi: ${type === 'diagonal' ? 'Beşgen Köşe' : 'Kör Köşe'}`, (draft) => {
        if (draft.junctions.length > 0) {
          draft.junctions[0].type = type;
        }
      });
    },

    updateCornerParam: (field, value) => {
      const cleanInt = Math.round(value);
      applyCommand(`Köşe Parametresi (${field}: ${cleanInt})`, (draft) => {
        if (draft.junctions.length > 0) {
          draft.junctions[0][field] = cleanInt;
          if (field === 'shelvesCount') delete draft.junctions[0].intervalHeightsMm;
        }
      });
    },

    setCornerDoorMode: (doorMode) => {
      applyCommand(`Köşe Kapak Yönü: ${doorMode}`, (draft) => {
        if (draft.junctions.length > 0) {
          draft.junctions[0].doorMode = doorMode;
        }
      });
    },

    addBay: (runId) => {
      let createdBayId: string | null = null;
      let createdCellId: string | null = null;

      applyCommand(`Yeni Bölme Eklendi (${runId})`, (draft) => {
        const run = draft.runs.find((r) => r.id === runId);
        if (!run) return;
        const idx = run.bays.length + 1;
        const suffix = `${run.wallAxis}${idx}-${Math.random().toString(36).slice(2, 5)}`;
        createdBayId = `bay-${suffix}`;
        createdCellId = `cell-${suffix}-root`;
        run.bays.push({
          id: createdBayId,
          label: `${run.wallAxis}${idx} — Yeni Bölme`,
          owner: 'ortak',
          width: { kind: 'flex', weight: 1 },
          locked: false,
          autoFront: true,
          frontMode: 'auto',
          hingeAngleDeg: 110,
          root: {
            kind: 'leaf',
            id: createdCellId,
            label: `${run.wallAxis}${idx} İç Hacim`,
            owner: 'ortak',
            insert: { type: 'shelfStack', shelfCount: 4 },
          },
        });
      });

      if (createdBayId) {
        const nextResolved = get().resolved;
        const firstNewCell =
          nextResolved.cells.find((c) => c.bayId === createdBayId)?.id ?? createdCellId;
        set({
          selectedBayId: createdBayId,
          selectedCellId: firstNewCell,
          selectedCellIds: firstNewCell ? [firstNewCell] : [],
        });
      }
    },

    addBayAtRunEnd: (runId, positionOrOptions, maybeOptions) => {
      const position: 'start' | 'end' =
        positionOrOptions === 'start' || positionOrOptions === 'end' ? positionOrOptions : 'end';
      const options: AddBayAtRunEndOptions =
        positionOrOptions === 'start' || positionOrOptions === 'end'
          ? (maybeOptions ?? { starterKind: 'shelves', widthMode: 'fixed', widthMm: 600 })
          : positionOrOptions;

      const starterKind: NewBayStarterKind =
        options.starterKind ?? options.starterPreset ?? 'shelves';

      let createdBayId: string | null = null;
      let createdCellId: string | null = null;

      const starterLabels: Record<NewBayStarterKind, string> = {
        shelves: 'Raflı Bölme',
        hanging: 'Uzun Askılı Bölme',
        longHanging: 'Uzun Askılı Bölme',
        doubleHanging: 'Çift Kat Askılı Bölme',
        drawers: 'Çekmeceli Bölme',
        shoes: 'Ayakkabılıklı Bölme',
        serviceNiche: 'Servis Nişi Bölmesi',
        empty: 'Boş Bölme',
      };

      const createStarterInsert = (kind: NewBayStarterKind): InsertConfig => {
        switch (kind) {
          case 'shelves':
            return { type: 'shelfStack', shelfCount: 4, adjustable: true };
          case 'hanging':
          case 'longHanging':
            return { type: 'hangingRod', rodHeightType: 'long' };
          case 'doubleHanging':
            return { type: 'doubleHanging' };
          case 'drawers':
            return { type: 'drawerBank', drawerCount: 4, drawerSlide: 'partial', isInternalDrawer: false };
          case 'shoes':
            return { type: 'shoeRack', shoeTiers: 5 };
          case 'serviceNiche':
            return {
              type: 'serviceNiche',
              handClearanceMm: 30,
              serviceItems: [
                structuredClone(STANDARD_SERVICE_ITEMS[0]),
                structuredClone(STANDARD_SERVICE_ITEMS[1]),
              ],
            };
          case 'empty':
          default:
            return { type: 'empty' };
        }
      };

      const applied = applyCommand(
        `3D Uçtan Yeni Bölme Eklendi (${runId} - ${starterLabels[starterKind]})`,
        (draft) => {
          const run = draft.runs.find((r) => r.id === runId);
          if (!run) return;
          const idx = run.bays.length + 1;
          const suffix = `${run.wallAxis}${idx}-${Math.random().toString(36).slice(2, 5)}`;
          createdBayId = `bay-${suffix}`;
          createdCellId = `cell-${suffix}-root`;

          const targetWidthMm = Math.max(250, Math.min(1200, Math.round(options.widthMm ?? 600)));
          const widthSpec: SizeSpec =
            options.widthMode === 'fixed'
              ? { kind: 'fixed', mm: targetWidthMm }
              : { kind: 'flex', weight: 1 };

          if (options.autoExtendRunLength) {
            run.lengthMm = Math.min(6000, run.lengthMm + targetWidthMm);
          }

          const newBay = {
            id: createdBayId,
            label: `${run.wallAxis}${idx} — ${starterLabels[starterKind]}`,
            owner: options.owner ?? 'ortak',
            width: widthSpec,
            locked: options.widthMode === 'fixed',
            autoFront: (options.frontMode ?? 'auto') !== 'open',
            frontMode: options.frontMode ?? 'auto',
            hingeAngleDeg: 110 as const,
            root: {
              kind: 'leaf' as const,
              id: createdCellId,
              label: `${run.wallAxis}${idx} ${starterLabels[starterKind]}`,
              owner: options.owner ?? 'ortak',
              insert: createStarterInsert(starterKind),
            },
          };

          if (position === 'start') {
            run.bays.unshift(newBay);
          } else {
            run.bays.push(newBay);
          }
        }
      );

      if (applied && createdBayId) {
        const nextResolved = get().resolved;
        const firstNewCell =
          nextResolved.cells.find((c) => c.bayId === createdBayId)?.id ?? createdCellId;
        set({
          selectedBayId: createdBayId,
          selectedCellId: firstNewCell,
          selectedCellIds: firstNewCell ? [firstNewCell] : [],
          selectedDrawerId: null,
          selectedDrawerIds: [],
        });
      }
      return applied && Boolean(createdBayId);
    },

    removeBay: (runId, bayId) => {
      const run = get().design.runs.find((r) => r.id === runId);
      if (!run || run.bays.length <= 1) return;

      applyCommand(`Bölme Silindi (${bayId})`, (draft) => {
        const targetRun = draft.runs.find((r) => r.id === runId);
        if (!targetRun || targetRun.bays.length <= 1) return;
        targetRun.bays = targetRun.bays.filter((b) => b.id !== bayId);
        for (const front of draft.fronts) front.bayIds = front.bayIds.filter(id => id !== bayId);
        draft.fronts = draft.fronts.filter(front => front.bayIds.length > 0);
      });

      const nextResolved = get().resolved;
      const fallbackBay = nextResolved.bays[0]?.id ?? null;
      const fallbackCell = nextResolved.cells.find((c) => c.bayId === fallbackBay)?.id ?? null;
      set({
        selectedBayId: fallbackBay,
        selectedCellId: fallbackCell,
        selectedCellIds: fallbackCell ? [fallbackCell] : [],
      });
    },

    setBaySize: (runId, bayId, size) => {
      applyCommand(
        `Bölme Ölçüsü (${bayId}: ${size.kind === 'fixed' ? `${size.mm}mm Sabit` : `Esnek x${size.weight}`})`,
        (draft) => {
          const run = draft.runs.find((r) => r.id === runId);
          const bay = run?.bays.find((b) => b.id === bayId);
          if (bay) {
            bay.width = size;
          }
        }
      );
    },

    toggleBayLock: (runId, bayId) => {
      applyCommand(`Bölme Kilidi Değiştirildi (${bayId})`, (draft) => {
        const run = draft.runs.find((r) => r.id === runId);
        const bay = run?.bays.find((b) => b.id === bayId);
        if (bay) {
          const nextLocked = !bay.locked;
          if (nextLocked && bay.width.kind === 'flex') {
            const widthMm = get().resolved.bays.find(b => b.id === bayId)?.outerWidthMm;
            if (widthMm) bay.width = { kind:'fixed', mm:widthMm };
          }
          bay.locked = nextLocked;
        }
      });
    },

    setBayOwner: (runId, bayId, owner) => {
      applyCommand(`Bölme Sahibi Güncellendi (${bayId} -> ${owner})`, (draft) => {
        const run = draft.runs.find((r) => r.id === runId);
        const bay = run?.bays.find((b) => b.id === bayId);
        if (bay) {
          bay.owner = owner;
          const setOwner = (node: SplitNode) => {
            if (node.kind === 'leaf') node.owner = owner;
            else node.children.forEach(child => setOwner(child.node));
          };
          setOwner(bay.root);
        }
      });
    },

    setBayFrontConfig: (runId, bayId, frontMode, hingeAngleDeg) => {
      applyCommand(`Kapak Ayarı Güncellendi (${bayId}: ${frontMode})`, (draft) => {
        const run = draft.runs.find((r) => r.id === runId);
        const bay = run?.bays.find((b) => b.id === bayId);
        if (bay) {
          bay.frontMode = frontMode;
          if (hingeAngleDeg !== undefined) {
            bay.hingeAngleDeg = hingeAngleDeg;
          }
        }
      });
    },

    updateDoorFrontConfig: (bayId, frontId, frontMode, hingeAngleDeg) => {
      const currentResolved = get().resolved;
      const resolvedBay = currentResolved.bays.find((b) => b.id === bayId);
      if (!resolvedBay) return;

      applyCommand(`Kapak Editörü Ayarı (${resolvedBay.label} -> ${frontMode})`, (draft) => {
        if (frontId) {
          const explicitFront = (draft.fronts ?? []).find((f) => f.id === frontId);
          if (explicitFront) {
            if (frontMode === 'open') {
              explicitFront.type = 'open';
            } else {
              explicitFront.type = 'hinged';
              explicitFront.hingeSide =
                frontMode === 'double'
                  ? 'double'
                  : frontMode === 'singleRight'
                    ? 'right'
                    : frontMode === 'singleLeft'
                      ? 'left'
                      : 'auto';
            }
            if (hingeAngleDeg !== undefined) {
              explicitFront.openingAngleDeg = hingeAngleDeg;
            }
            return;
          }
        }

        const run = draft.runs.find((r) => r.id === resolvedBay.runId);
        const bay = run?.bays.find((b) => b.id === bayId);
        if (bay) {
          bay.frontMode = frontMode;
          if (hingeAngleDeg !== undefined) {
            bay.hingeAngleDeg = hingeAngleDeg;
          }
        }
      });

      const nextDoors = get().resolved.doors.filter((d) => d.bayId === bayId);
      set({
        selectedDoorId: nextDoors[0]?.id ?? null,
        selectedDoorIds: nextDoors[0] ? [nextDoors[0].id] : [],
      });
    },

    splitBayDoorHorizontally: (bayId, splitAtYMm) => {
      const currentResolved = get().resolved;
      const resolvedBay = currentResolved.bays.find((b) => b.id === bayId);
      const run = get().design.runs.find((r) => r.id === resolvedBay?.runId);
      if (!resolvedBay || !run) return;

      const bayDoors = currentResolved.doors.filter((d) => d.bayId === bayId);
      const minY =
        bayDoors.length > 0
          ? Math.min(...bayDoors.map((d) => d.yStartMm))
          : run.plinthHeightMm + 2;
      const maxY =
        bayDoors.length > 0
          ? Math.max(...bayDoors.map((d) => d.yEndMm))
          : run.heightMm - run.topFillerHeightMm - 2;

      const bayCells = currentResolved.cells
        .filter((c) => c.bayId === bayId)
        .sort((a, b) => b.yStartMm - a.yStartMm);
      const topCell = bayCells[0];
      const smartSplitY =
        splitAtYMm ??
        (topCell && topCell.yStartMm > minY + 300 && topCell.yStartMm < maxY - 220
          ? topCell.yStartMm - Math.round(run.panelThicknessMm / 2)
          : Math.round(maxY - 420));

      const clampedSplitY = Math.max(minY + 220, Math.min(maxY - 200, Math.round(smartSplitY)));
      applyCommand(
        `Kapak Yatay Bölündü: Üst Yüklük + Alt Gövde (${resolvedBay.label})`,
        (draft) => {
          const existing = draft.fronts.filter(f => f.bayIds.includes(bayId));
          if (existing.length > 1) throw new Error('Önce düzenlemek istediğiniz cephe aralığını seçin.');
          const currentRun = draft.runs.find(r => r.id === resolvedBay.runId)!;
          const bay = currentRun.bays.find(b => b.id === bayId)!;
          const front = existing[0] ?? automaticBayFront(currentRun, bay, `front-${bayId}-lower`);
          if (!existing.length) draft.fronts.push(front);
          splitFrontRangeInDesign(draft, front.id, clampedSplitY - 2);
        }
      );

      const nextDoors = get().resolved.doors.filter((d) => d.bayId === bayId);
      set({
        selectedDoorId: nextDoors[0]?.id ?? null,
        selectedDoorIds: nextDoors.map((d) => d.id),
      });
    },

    mergeBayDoors: (bayId) => {
      const currentResolved = get().resolved;
      const resolvedBay = currentResolved.bays.find((b) => b.id === bayId);
      if (!resolvedBay) return;

      applyCommand(`Bölünmüş Kapaklar Tek Kapakta Birleştirildi (${resolvedBay.label})`, (draft) => {
        const run = draft.runs.find(r => r.id === resolvedBay.runId)!;
        const fronts = draft.fronts.filter(f => f.bayIds.includes(bayId))
          .sort((a, b) => frontVerticalRange(run, a).start - frontVerticalRange(run, b).start);
        if (fronts.length < 2) return;
        const lower = fronts[0];
        const upper = fronts[fronts.length - 1];
        if (fronts.some(f => f.type !== 'hinged' || [...f.bayIds].sort().join() !== [...lower.bayIds].sort().join())) {
          throw new Error('Birleştirme için aynı bölmeleri kapsayan menteşeli aralıkları seçin.');
        }
        lower.yEndMm = upper.yEndMm;
        lower.yEndAnchor = upper.yEndAnchor;
        const removed = new Set(fronts.slice(1).map(f => f.id));
        draft.fronts = draft.fronts.filter(f => !removed.has(f.id));
      });

      const nextDoors = get().resolved.doors.filter((d) => d.bayId === bayId);
      set({
        selectedDoorId: nextDoors[0]?.id ?? null,
        selectedDoorIds: nextDoors[0] ? [nextDoors[0].id] : [],
      });
    },

    updateFrontVerticalBounds: (frontId, yStartMm, yEndMm) => {
      const cleanStart = Math.round(yStartMm);
      const cleanEnd = Math.max(cleanStart + 160, Math.round(yEndMm));
      applyCommand(`Kapak Dikey Sınırları Güncellendi (${cleanStart}–${cleanEnd} mm)`, (draft) => {
        const front = (draft.fronts ?? []).find((f) => f.id === frontId);
        if (front) {
          front.yStartMm = cleanStart;
          front.yEndMm = cleanEnd;
          delete front.yStartAnchor;
          delete front.yEndAnchor;
        }
      });
    },

    setFrontBaySpan: (bayId, targetBayIds) => {
      const currentResolved = get().resolved;
      const primaryBay = currentResolved.bays.find((b) => b.id === bayId);
      const run = get().design.runs.find((r) => r.id === primaryBay?.runId);
      if (!primaryBay || !run || targetBayIds.length === 0) return;

      applyCommand(
        `Kapak Bölme Kapsamı Güncellendi (${targetBayIds.join(' + ')})`,
        (draft) => {
          draft.fronts = (draft.fronts ?? []).filter(
            (f) => !f.bayIds.some((bid) => targetBayIds.includes(bid))
          );
          if (targetBayIds.length > 1) {
            draft.fronts.push({
              id: `front-span-${targetBayIds.join('-')}`,
              label: `${primaryBay.label} Birleşik Kapak`,
              runId: primaryBay.runId,
              bayIds: targetBayIds,
              type: 'hinged',
              hingeSide: 'auto',
              openingAngleDeg: primaryBay.hingeAngleDeg,
              yStartMm: 0,
              yStartAnchor: 'drawers',
              yEndMm: 2,
              yEndAnchor: 'top',
            });
          }
        }
      );
    },

    splitCell: (cellId, direction, preset = 'equal') => {
      const dirLabel = direction === 'vertical' ? 'Dikey' : 'Yatay';
      let createdCellId: string | null = null;
      applyCommand(`Hücre ${dirLabel} Bölündü (${cellId})`, (draft) => {
        const res = splitLeafInDesign(draft, cellId, direction, preset);
        createdCellId = res.newPrimaryCellId;
      });

      if (createdCellId) {
        const nextResolved = get().resolved;
        const found =
          nextResolved.cells.find((c) => c.id === createdCellId) ??
          nextResolved.cells.find((c) => c.sourceLeafId === createdCellId);
        if (found) {
          set({
            selectedCellId: found.id,
            selectedCellIds: [found.id],
            selectedBayId: found.bayId,
          });
        }
      }
    },

    unsplitCell: (cellId) => {
      let mergedCellId: string | null = null;
      applyCommand(`Hücre Bölünmesi Birleştirildi (${cellId})`, (draft) => {
        const res = unsplitParentOfLeafInDesign(draft, cellId);
        mergedCellId = res.mergedCellId;
      });
      if (mergedCellId) {
        const nextResolved = get().resolved;
        const found =
          nextResolved.cells.find((c) => c.id === mergedCellId) ??
          nextResolved.cells.find((c) => c.sourceLeafId === mergedCellId);
        if (found) {
          set({ selectedCellId: found.id, selectedCellIds: [found.id] });
        }
      }
    },

    isolateSubInterval: (cellId) => {
      if (!cellId.includes('::sub-')) return;
      let realizedId = cellId;
      applyCommand(`Raf/Askı Aralığı Bağımsız Hücreye Ayrıldı (${cellId})`, (draft) => {
        realizedId = realizeSubIntervalInDesign(draft, cellId);
      });
      const nextResolved = get().resolved;
      const found =
        nextResolved.cells.find((c) => c.id === realizedId) ??
        nextResolved.cells.find((c) => c.sourceLeafId === realizedId);
      if (found) {
        set({
          selectedCellId: found.id,
          selectedCellIds: [found.id],
          selectedBayId: found.bayId,
        });
      }
    },

    updateCellSizeInSplit: (cellId, size, locked) => {
      applyCommand(`Alt Hücre Ölçüsü Güncellendi (${cellId})`, (draft) => {
        updateLeafSizeInParent(draft, cellId, size, locked);
      });
    },

    adjustShelfGrid: (cellId, direction) => {
      const { cells } = get().resolved;
      const cell = cells.find(candidate => candidate.id === cellId);
      if (!cell?.sourceLeafId || cell.insert?.type !== 'shelfStack' || !cell.insert.adjustable) return;
      const leafId = cell.sourceLeafId;
      const intervals = cells.filter(candidate => candidate.sourceLeafId === leafId)
        .sort((a, b) => a.yStartMm - b.yStartMm);
      const base = intervals[0].yStartMm;
      const pitch = validationConfig.adjustableShelfPitchMm;
      const rows = cell.insert.shelfPinRows?.slice()
        ?? intervals.slice(0, -1).map(interval => Math.round((interval.yEndMm - base) / pitch));
      const index = cell.subIntervalIndex;
      if (direction !== 0) {
        if (!cell.insert.shelfPinRows || index === undefined || index >= rows.length) return;
        rows[index] += direction;
      }
      const insert = { ...cell.insert, shelfPinRows: rows };
      applyCommand(direction === 0 ? '32 mm raf düzeni etkinleştirildi' : 'Raf 32 mm taşındı', draft => {
        setCellInsertInDesign(draft, leafId, insert);
      });
    },

    setCellInsert: (cellId, insert, label, owner, isolateSubInterval = false) => {
      let updatedLeafId = cellId;
      applyCommand(`Modül Atandı (${cellId}: ${insert ? insert.type : 'Boş'})`, (draft) => {
        updatedLeafId = setCellInsertInDesign(
          draft,
          cellId,
          insert,
          label,
          owner,
          isolateSubInterval
        );
      });
      const nextResolved = get().resolved;
      const currentSel = get().selectedCellId;
      if (!currentSel || !nextResolved.cells.some((c) => c.id === currentSel)) {
        const match =
          nextResolved.cells.find((c) => c.id === updatedLeafId) ??
          nextResolved.cells.find((c) => c.sourceLeafId === updatedLeafId);
        if (match) {
          set({
            selectedCellId: match.id,
            selectedCellIds: [match.id],
            selectedBayId: match.bayId,
          });
        }
      }
    },

    updateSelectedDrawerHeight: (drawerId, newHeightMm) => {
      const currentResolved = get().resolved;
      const drw = currentResolved.drawers.find((d) => d.id === drawerId);
      if (!drw) return;

      applyCommand(
        `Çekmece Ön Yüksekliği Güncellendi (${drw.label}: ${Math.round(newHeightMm)} mm)`,
        (draft) => {
          updateDrawerFrontHeightInDesign(draft, drawerId, newHeightMm, currentResolved);
        }
      );
    },

    equalizeDrawerBankHeights: (cellId) => {
      applyCommand(`Çekmece Grubu Eşit Yüksekliğe Dağıtıldı (${cellId})`, (draft) => {
        equalizeDrawerBankInDesign(draft, cellId);
      });
    },

    divideCellIntoN: (cellId, direction, count) => {
      const dirLabel = direction === 'vertical' ? 'Dikey' : 'Yatay';
      let createdIds: string[] = [];
      applyCommand(`Hücre ${count} Eşit ${dirLabel} Bölmeye Ayrıldı (${cellId})`, (draft) => {
        const res = divideCellIntoNInDesign(draft, cellId, direction, count);
        createdIds = res.createdCellIds;
      });
      const nextResolved = get().resolved;
      const validIds = createdIds.filter((id) => nextResolved.cells.some((c) => c.id === id));
      if (validIds.length > 0) {
        const firstCell = nextResolved.cells.find((c) => c.id === validIds[0]);
        set({
          selectedCellIds: validIds,
          selectedCellId: validIds[0],
          selectedBayId: firstCell?.bayId ?? get().selectedBayId,
        });
      }
    },

    setContiguousGroupIntervalCount: (targetIntervalCount) => {
      const currentSelected = get().selectedCellIds.length > 0
        ? get().selectedCellIds
        : get().selectedCellId
          ? [get().selectedCellId!]
          : [];
      if (currentSelected.length === 0) return;

      const currentResolved = get().resolved;
      let nextIds: string[] = [];
      applyCommand(
        `Grup Aralık Sayısı ${currentSelected.length} → ${targetIntervalCount} Eşit Aralığa Dönüştürüldü`,
        (draft) => {
          const res = setContiguousGroupIntervalCountInDesign(
            draft,
            currentSelected,
            targetIntervalCount,
            currentResolved
          );
          nextIds = res.newSelectedCellIds;
        }
      );

      const updatedResolved = get().resolved;
      const validIds = nextIds.filter((id) => updatedResolved.cells.some((c) => c.id === id));
      if (validIds.length > 0) {
        set({
          selectedCellIds: validIds,
          selectedCellId: validIds[0],
        });
      }
    },

    equalizeSelectedCells: () => {
      const currentSelected = get().selectedCellIds;
      if (currentSelected.length < 2) return;
      const currentResolved = get().resolved;
      let nextIds: string[] = [];
      applyCommand(
        `Seçili ${currentSelected.length} Bölme Eşit Ölçüye Dağıtıldı`,
        (draft) => {
          const res = equalizeContiguousCellsInDesign(draft, currentSelected, currentResolved);
          nextIds = res.newSelectedCellIds;
        }
      );
      const updatedResolved = get().resolved;
      const validIds = nextIds.filter((id) => updatedResolved.cells.some((c) => c.id === id));
      if (validIds.length > 0) {
        set({
          selectedCellIds: validIds,
          selectedCellId: validIds[0],
        });
      }
    },

    mergeAndResplitSelectedGroups: (targetIntervalCount) => {
      const currentSelected = get().selectedCellIds;
      if (currentSelected.length < 2) return;
      const currentResolved = get().resolved;
      let nextIds: string[] = [];
      applyCommand(
        `Seçili Raf Grupları Birleştirildi ve ${targetIntervalCount} Eşit Aralığa Bölündü`,
        (draft) => {
          const res = mergeAndResplitSelectedGroupsInDesign(
            draft,
            currentSelected,
            targetIntervalCount,
            currentResolved
          );
          nextIds = res.newSelectedCellIds;
        }
      );
      const updatedResolved = get().resolved;
      const validIds = nextIds.filter((id) => updatedResolved.cells.some((c) => c.id === id));
      if (validIds.length > 0) {
        set({
          selectedCellIds: validIds,
          selectedCellId: validIds[0],
        });
      }
    },

    batchSplitSelectedCells: (direction) => {
      const currentSelected = get().selectedCellIds.length > 0
        ? get().selectedCellIds
        : get().selectedCellId
          ? [get().selectedCellId!]
          : [];
      const nonCornerIds = currentSelected.filter((id) => !id.includes('::corner-sub-'));
      if (nonCornerIds.length === 0) return;

      const dirLabel = direction === 'vertical' ? 'Dikey' : 'Yatay';
      const createdIds: string[] = [];
      applyCommand(
        `Toplu ${dirLabel} Bölme (${nonCornerIds.length} Hücre)`,
        (draft) => {
          for (const cid of nonCornerIds) {
            const res = splitLeafInDesign(draft, cid, direction, 'equal');
            if (res.newPrimaryCellId) {
              createdIds.push(res.newPrimaryCellId);
            }
          }
        }
      );

      const updatedResolved = get().resolved;
      const validIds = createdIds.filter((id) => updatedResolved.cells.some((c) => c.id === id));
      if (validIds.length > 0) {
        set({
          selectedCellIds: validIds,
          selectedCellId: validIds[0],
        });
      }
    },

    batchSetSelectedCellsInsert: (insert) => {
      const currentSelected = get().selectedCellIds.length > 0
        ? get().selectedCellIds
        : get().selectedCellId
          ? [get().selectedCellId!]
          : [];
      const nonCornerIds = currentSelected.filter((id) => !id.includes('::corner-sub-'));
      if (nonCornerIds.length === 0) return;

      const updatedLeafIds: string[] = [];
      applyCommand(
        `Toplu Modül Atama (${nonCornerIds.length} Hücre → ${insert.type})`,
        (draft) => {
          for (const cid of nonCornerIds) {
            const lid = setCellInsertInDesign(
              draft,
              cid,
              structuredClone(insert),
              undefined,
              undefined,
              cid.includes('::sub-')
            );
            updatedLeafIds.push(lid);
          }
        }
      );

      const updatedResolved = get().resolved;
      const nextSelection: string[] = [];
      for (const lid of updatedLeafIds) {
        const matching = updatedResolved.cells.filter(
          (c) => c.id === lid || c.sourceLeafId === lid
        );
        for (const m of matching) {
          if (!nextSelection.includes(m.id)) {
            nextSelection.push(m.id);
          }
        }
      }
      if (nextSelection.length > 0) {
        set({
          selectedCellIds: nextSelection,
          selectedCellId: nextSelection[0],
        });
      }
    },

    startOrUpdateResizeDraft: (axis, direction, requestedTotalMm, customNeighborDraftMm) => {
      const state = get();
      const targetIds =
        state.selectedCellIds.length > 0
          ? state.selectedCellIds
          : state.selectedCellId
            ? [state.selectedCellId]
            : [];
      if (targetIds.length === 0) return;
      if (axis === 'Y' && state.resolved.cells.some(cell => targetIds.includes(cell.id) && cell.insert?.shelfPinRows)) {
        set({ resizeDraft: null, commandError: 'Bu raf 32 mm düzenine bağlı. Raf adımı düğmelerini kullanın veya aralığı bağımsız hücreye ayırın.' });
        return;
      }

      const draftState = buildResizeDraftState(
        state.resolved,
        targetIds,
        axis,
        direction,
        requestedTotalMm,
        customNeighborDraftMm
      );
      set({ resizeDraft: draftState });
    },

    updateResizeDraftNeighborMm: (neighborDraftMm) => {
      const currentDraft = get().resizeDraft;
      if (!currentDraft) return;
      const updated = buildResizeDraftState(
        get().resolved,
        currentDraft.targetCellIds,
        currentDraft.axis,
        currentDraft.direction,
        currentDraft.requestedTotalMm,
        neighborDraftMm
      );
      set({ resizeDraft: updated });
    },

    autoBalanceResizeDraftNeighbor: () => {
      const currentDraft = get().resizeDraft;
      if (!currentDraft) return;
      const updated = buildResizeDraftState(
        get().resolved,
        currentDraft.targetCellIds,
        currentDraft.axis,
        currentDraft.direction,
        currentDraft.requestedTotalMm,
        currentDraft.requiredNeighborMm
      );
      set({ resizeDraft: updated });
    },

    cancelResizeDraft: () => {
      set({ resizeDraft: null });
    },

    commitResizeDraft: () => {
      const currentDraft = get().resizeDraft;
      if (!currentDraft) return false;
      if (currentDraft.conflictOverlapMm > 0 || currentDraft.exceedsBoundary) {
        return false;
      }

      const currentResolved = get().resolved;
      let updatedIds: string[] = [];
      const committed = applyCommand(
        `Yönlü Boyutlandırma (${currentDraft.axis}: ${currentDraft.currentTotalMm} → ${currentDraft.requestedTotalMm} mm)`,
        (draft) => {
          const res = commitDirectionalResizeInDesign(draft, currentDraft, currentResolved);
          updatedIds = res.updatedTargetCellIds;
        }
      );
      if (!committed) return false;

      const nextResolved = get().resolved;
      const validIds = updatedIds.filter((id) => nextResolved.cells.some((c) => c.id === id));
      set({
        resizeDraft: null,
        selectedCellIds: validIds.length > 0 ? validIds : get().selectedCellIds,
        selectedCellId: validIds[0] ?? get().selectedCellId,
      });
      return true;
    },

    setSurfaceMaterial: (slot, materialId) => {
      get().setMaterials({ [SURFACE_MATERIAL_FIELDS[slot]]: materialId });
    },

    setMaterials: (palette) => {
      applyCommand('Malzeme Paleti Güncellendi', (draft) => {
        Object.assign(draft.materials, palette);
      });
    },

    setGlobalDoorHandle: (patch) => {
      applyCommand('Kapak Kulp Ayarları Güncellendi', (draft) => {
        const current: HandleConfig = draft.materials.doorHandleConfig ?? {
          styleId: 'barModern',
          finishId: 'matteBlack',
          lengthMm: 220,
          placement: 'middle',
          orientation: 'vertical',
          offsetFromEdgeMm: 38,
          verticalOffsetMm: 0,
        };
        draft.materials.doorHandleConfig = {
          ...current,
          ...patch,
        };
      });
    },

    setGlobalDrawerHandle: (patch) => {
      applyCommand('Çekmece Kulp Ayarları Güncellendi', (draft) => {
        const current: HandleConfig = draft.materials.drawerHandleConfig ?? {
          styleId: 'barModern',
          finishId: 'matteBlack',
          lengthMm: 160,
          placement: 'middle',
          orientation: 'horizontal',
          offsetFromEdgeMm: 38,
          verticalOffsetMm: 0,
        };
        draft.materials.drawerHandleConfig = {
          ...current,
          ...patch,
        };
      });
    },

    setDoorMaterialAndHandle: (bayId, frontId, materialId, handlePatch) => {
      applyCommand('Kapak Malzeme ve Kulp Özelleştirildi', (draft) => {
        const baseDoorHandle: HandleConfig = draft.materials.doorHandleConfig ?? {
          styleId: 'barModern',
          finishId: 'matteBlack',
          lengthMm: 220,
          placement: 'middle',
          orientation: 'vertical',
          offsetFromEdgeMm: 38,
          verticalOffsetMm: 0,
        };

        if (frontId) {
          const front = draft.fronts.find((f) => f.id === frontId);
          if (front) {
            if (materialId !== undefined) {
              front.materialId = materialId ?? undefined;
            }
            if (handlePatch !== undefined) {
              front.handleConfig =
                handlePatch === null
                  ? undefined
                  : { ...(front.handleConfig ?? baseDoorHandle), ...handlePatch };
            }
            return;
          }
        }

        for (const run of draft.runs) {
          const bay = run.bays.find((b) => b.id === bayId);
          if (bay) {
            if (materialId !== undefined) {
              bay.doorMaterialId = materialId ?? undefined;
            }
            if (handlePatch !== undefined) {
              bay.handleConfig =
                handlePatch === null
                  ? undefined
                  : { ...(bay.handleConfig ?? baseDoorHandle), ...handlePatch };
            }
            return;
          }
        }
      });
    },

    setDrawerMaterialAndHandle: (cellId, materialId, handlePatch) => {
      applyCommand('Çekmece Ön Yüz ve Kulp Özelleştirildi', (draft) => {
        const baseDrawerHandle: HandleConfig = draft.materials.drawerHandleConfig ?? {
          styleId: 'barModern',
          finishId: 'matteBlack',
          lengthMm: 160,
          placement: 'middle',
          orientation: 'horizontal',
          offsetFromEdgeMm: 38,
          verticalOffsetMm: 0,
        };
        const sourceId = cellId.split('::')[0];
        const visitNode = (node: SplitNode): boolean => {
          if (node.id === sourceId && node.kind === 'leaf' && node.insert) {
            if (materialId !== undefined) {
              node.insert.frontMaterialId = materialId ?? undefined;
            }
            if (handlePatch !== undefined) {
              node.insert.handleConfig =
                handlePatch === null
                  ? undefined
                  : { ...(node.insert.handleConfig ?? baseDrawerHandle), ...handlePatch };
            }
            return true;
          }
          if (node.kind === 'split') {
            for (const ch of node.children) {
              if (visitNode(ch.node)) return true;
            }
          }
          return false;
        };
        for (const run of draft.runs) {
          for (const bay of run.bays) {
            if (visitNode(bay.root)) return;
          }
        }
      });
    },

    setLedLighting: (patch) => {
      applyCommand('Dolap İçi LED Aydınlatma Güncellendi', (draft) => {
        const current: LedLightingConfig = draft.ledLighting ?? {
          enabled: true,
          shelfUnder: true,
          verticalSides: false,
          hangingRod: true,
          openBays: true,
          cornerModule: true,
          colorTempId: 'warm3000K',
          intensity: 1.0,
        };
        draft.ledLighting = {
          ...current,
          ...patch,
        };
      });
    },

    applyExteriorFinishPreset: (presetId) => {
      applyCommand(
        presetId === 'builtInMinimal'
          ? 'Düz Gömme / Minimal Bitiş Uygulandı'
          : presetId === 'freestandingModern'
            ? 'Modern Bağımsız Dolap Bitişi Uygulandı'
            : 'Klasik Taçlı & Klapalı Bitiş Uygulandı',
        (draft) => {
          if (presetId === 'builtInMinimal') {
            draft.exteriorFinish = {
              presetId: 'builtInMinimal',
              topStyle: 'flushCeiling',
              baseStyle: 'recessedHiddenPlinth',
              leftSideStyle: 'flushClean',
              rightSideStyle: 'flushClean',
              ceilingShadowGapMm: 15,
              plinthRecessMm: 50,
            };
            for (const run of draft.runs) {
              run.startFillerMm = 0;
              run.endFillerMm = 0;
              run.topFillerHeightMm = 20;
              run.plinthHeightMm = 40;
            }
          } else if (presetId === 'freestandingModern') {
            draft.exteriorFinish = {
              presetId: 'freestandingModern',
              topStyle: 'none',
              baseStyle: 'adjustableFeet',
              leftSideStyle: 'flushClean',
              rightSideStyle: 'flushClean',
              ceilingShadowGapMm: 0,
              plinthRecessMm: 35,
            };
            for (const run of draft.runs) {
              run.startFillerMm = 0;
              run.endFillerMm = 0;
              run.topFillerHeightMm = 0;
              run.plinthHeightMm = 70;
            }
          } else {
            draft.exteriorFinish = {
              presetId: 'classicTrimmed',
              topStyle: 'classicCrown',
              baseStyle: 'highClassicPlinth',
              leftSideStyle: 'decorativeSideTrim',
              rightSideStyle: 'decorativeSideTrim',
              ceilingShadowGapMm: 15,
              plinthRecessMm: 25,
            };
            for (const run of draft.runs) {
              run.startFillerMm = 36;
              run.endFillerMm = 36;
              run.topFillerHeightMm = 50;
              run.plinthHeightMm = 90;
            }
          }
        }
      );
    },

    setExteriorFinish: (patch) => {
      applyCommand('Dış Bitiş ve Baza Ayarı Güncellendi', (draft) => {
        const current: ExteriorFinishConfig = draft.exteriorFinish ?? {
          presetId: 'builtInMinimal',
          topStyle: 'flushCeiling',
          baseStyle: 'recessedHiddenPlinth',
          leftSideStyle: 'flushClean',
          rightSideStyle: 'flushClean',
          ceilingShadowGapMm: 15,
          plinthRecessMm: 45,
        };
        const next: ExteriorFinishConfig = {
          ...current,
          ...patch,
        };
        draft.exteriorFinish = next;

        if (patch.topStyle) {
          for (const run of draft.runs) {
            if (patch.topStyle === 'none') {
              run.topFillerHeightMm = 0;
            } else if (patch.topStyle === 'flushCeiling') {
              run.topFillerHeightMm = Math.max(15, Math.min(25, run.topFillerHeightMm || 20));
            } else if (patch.topStyle === 'classicCrown' && run.topFillerHeightMm < 40) {
              run.topFillerHeightMm = 50;
            } else if (patch.topStyle === 'flatFiller' && run.topFillerHeightMm === 0) {
              run.topFillerHeightMm = 35;
            }
          }
        }

        if (patch.baseStyle) {
          for (const run of draft.runs) {
            if (patch.baseStyle === 'recessedHiddenPlinth') {
              run.plinthHeightMm = 40;
            } else if (patch.baseStyle === 'lowMinimalPlinth') {
              run.plinthHeightMm = 50;
            } else if (patch.baseStyle === 'highClassicPlinth') {
              run.plinthHeightMm = 90;
            } else if (patch.baseStyle === 'adjustableFeet') {
              run.plinthHeightMm = 70;
            }
          }
        }

        if (patch.leftSideStyle) {
          for (const run of draft.runs) {
            run.startFillerMm =
              patch.leftSideStyle === 'flushClean'
                ? 0
                : patch.leftSideStyle === 'thinWallFiller'
                  ? 20
                  : patch.leftSideStyle === 'wallRevealPanel'
                    ? 18
                    : 36;
          }
        }

        if (patch.rightSideStyle) {
          for (const run of draft.runs) {
            run.endFillerMm =
              patch.rightSideStyle === 'flushClean'
                ? 0
                : patch.rightSideStyle === 'thinWallFiller'
                  ? 20
                  : patch.rightSideStyle === 'wallRevealPanel'
                    ? 18
                    : 36;
          }
        }
      });
    },

    setInteriorItemsConfig: (patch) => {
      applyCommand('3D İç Eşya Görünümü Güncellendi', (draft) => {
        const current: InteriorItemsConfig = draft.interiorItems ?? {
          enabled: true,
          density: 'medium',
        };
        draft.interiorItems = {
          ...current,
          ...patch,
        };
      });
    },

    setCellItemPreset: (cellId, itemPreset, itemCountOverride) => {
      applyCommand('Bölme 3D Eşya Şablonu Güncellendi', (draft) => {
        const sourceId = cellId.includes('::sub-') ? realizeSubIntervalInDesign(draft, cellId) : cellId;
        const visitNode = (node: SplitNode): boolean => {
          if (node.id === sourceId && node.kind === 'leaf') {
            if (!node.insert) {
              node.insert = { type: 'shelfStack', shelfCount: 1 };
            }
            node.insert.itemPreset = itemPreset;
            if (itemCountOverride !== undefined) {
              node.insert.itemCountOverride = itemCountOverride;
            }
            return true;
          }
          if (node.kind === 'split') {
            for (const ch of node.children) {
              if (visitNode(ch.node)) return true;
            }
          }
          return false;
        };
        for (const run of draft.runs) {
          for (const bay of run.bays) {
            if (visitNode(bay.root)) return;
          }
        }
      });
    },

    undo: () => {
      get().undoSteps(1);
    },

    undoSteps: (stepCount) => {
      const { historyPast, historyFuture, design, checkpointDesign, lastCheckpointAt } = get();
      const count = Math.min(Math.max(1, Math.round(stepCount)), historyPast.length);
      if (count <= 0) return;

      let cursorDesign = design;
      let cursorPast = [...historyPast];
      let cursorFuture = [...historyFuture];

      for (let i = 0; i < count; i++) {
        const prev = cursorPast[cursorPast.length - 1];
        cursorPast = cursorPast.slice(0, -1);
        cursorFuture = [
          { label: prev.label, snapshot: cursorDesign, timestampMs: prev.timestampMs },
          ...cursorFuture,
        ];
        cursorDesign = prev.snapshot;
      }

      const nextResolved = solveDesign(cursorDesign);
      const validSelIds = get().selectedCellIds.filter((id) =>
        nextResolved.cells.some((c) => c.id === id)
      );
      const fallbackCellId = validSelIds[0] ?? nextResolved.cells[0]?.id ?? null;

      set({
        design: cursorDesign,
        resolved: nextResolved,
        historyPast: cursorPast,
        historyFuture: cursorFuture,
        hasUnsavedChanges: !sameDesign(cursorDesign, checkpointDesign),
        selectedCellIds: validSelIds.length > 0 ? validSelIds : fallbackCellId ? [fallbackCellId] : [],
        selectedCellId: fallbackCellId,
        resizeDraft: null,
      });

      saveCurrentStateToStorage(
        cursorDesign,
        checkpointDesign,
        cursorPast,
        cursorFuture,
        lastCheckpointAt
      );
    },

    revertToCheckpoint: () => {
      const state = get();
      if (sameDesign(state.design, state.checkpointDesign)) return;
      if (state.historyPast[0] && sameDesign(state.historyPast[0].snapshot, state.checkpointDesign)) {
        get().undoSteps(state.historyPast.length);
        return;
      }
      const restored = structuredClone(state.checkpointDesign);
      const future: HistoryEntry[] = [{ label:'Checkpoint öncesi çalışma durumunu geri getir', snapshot:state.design }, ...state.historyFuture];
      set({ design:restored, resolved:solveDesign(restored), historyPast:[], historyFuture:future,
        hasUnsavedChanges:false, resizeDraft:null, selectedCellId:null, selectedCellIds:[], selectedDrawerId:null,
        selectedDrawerIds:[], selectedDoorId:null, selectedDoorIds:[], openDoorIds:{}, openDrawerIds:{} });
      saveCurrentStateToStorage(restored, state.checkpointDesign, [], future, state.lastCheckpointAt);
    },

    redo: () => {
      const { historyPast, historyFuture, design, checkpointDesign, lastCheckpointAt } = get();
      if (historyFuture.length === 0) return;
      const nextEntry = historyFuture[0];
      const nextFuture = historyFuture.slice(1);
      const nextPast = [...historyPast, { label: nextEntry.label, snapshot: design }];

      const nextResolved = solveDesign(nextEntry.snapshot);
      const validSelIds = get().selectedCellIds.filter((id) =>
        nextResolved.cells.some((c) => c.id === id)
      );
      const fallbackCellId = validSelIds[0] ?? nextResolved.cells[0]?.id ?? null;

      set({
        design: nextEntry.snapshot,
        resolved: nextResolved,
        historyPast: nextPast,
        historyFuture: nextFuture,
        hasUnsavedChanges: !sameDesign(nextEntry.snapshot, checkpointDesign),
        selectedCellIds: validSelIds.length > 0 ? validSelIds : fallbackCellId ? [fallbackCellId] : [],
        selectedCellId: fallbackCellId,
        resizeDraft: null,
      });

      saveCurrentStateToStorage(
        nextEntry.snapshot,
        checkpointDesign,
        nextPast,
        nextFuture,
        lastCheckpointAt
      );
    },

    exportJsonString: () => {
      return JSON.stringify(get().design, null, 2);
    },

    importJsonString: (rawJson) => {
      try {
        const validated = parseDesignJson(rawJson);
        const currentDesign = get().design;
        const resolved = solveDesign(validated);
        const allocationError = resolved.issues.find(i => i.code === 'DIMENSION_ALLOCATION_INVALID');
        if (allocationError) return { ok:false, error:allocationError.description };
        const nextPast: HistoryEntry[] = [
          ...get().historyPast.slice(-(MAX_HISTORY_STEPS - 1)),
          { label: `JSON İçe Aktarıldı: ${validated.name}`, snapshot: currentDesign },
        ];

        const firstImportedCell = resolved.cells[0]?.id ?? null;
        set({
          design: validated,
          resolved,
          historyPast: nextPast,
          historyFuture: [],
          hasUnsavedChanges: !sameDesign(validated, get().checkpointDesign),
          selectedBayId: validated.runs[0]?.bays[0]?.id ?? null,
          selectedCellId: firstImportedCell,
          selectedCellIds: firstImportedCell ? [firstImportedCell] : [],
          resizeDraft: null,
          openDoorIds: {},
          openDrawerIds: {},
        });

        saveCurrentStateToStorage(
          validated,
          get().checkpointDesign,
          nextPast,
          [],
          get().lastCheckpointAt
        );
        return { ok: true };
      } catch (err) {
        if (err instanceof ZodError) {
          return { ok: false, error: 'Dosyada gerekli gardırop bilgileri eksik veya geçersiz. Wardrobe Studio’dan dışa aktarılmış bir tasarım JSON’u seçin.' };
        }
        if (err instanceof SyntaxError) {
          return { ok: false, error: 'Dosya geçerli JSON biçiminde okunamadı. Dışa aktarılan dosyayı yeniden seçin.' };
        }
        const message = err instanceof Error ? err.message : 'Geçersiz JSON tasarım formatı.';
        return { ok: false, error: message };
      }
    },

    hydrateFromIndexedDB: async () => {
      const revision = sessionRevision;
      const request = ++hydrationRequest;
      const local = readSyncSessionFromLocalStorage();
      let session = local.session;
      let recovery = local.recoveryJson ?? get().recoveryJson;
      let readFailed = false;
      if (typeof indexedDB !== 'undefined') {
        try {
          const raw = await idbGet(IDB_SESSION_KEY);
          const indexed = validateSessionEnvelope(raw);
          if (raw != null && !indexed) recovery ??= JSON.stringify(raw, null, 2);
          if (indexed && (!session || (indexed.savedAtMs ?? 0) > (session.savedAtMs ?? 0))) session = indexed;
          if (!session && raw == null && revision === sessionRevision && request === hydrationRequest) {
            const legacy = await idbGet(LEGACY_IDB_KEY);
            if (legacy != null) {
              try {
                const design = normalizeAndValidateDesign(legacy);
                session = {
                  version: 2, workingDesign: design, checkpointDesign: design,
                  historyPast: [], historyFuture: [], lastAutoSavedAt: null, lastCheckpointAt: null,
                };
              } catch {
                recovery ??= JSON.stringify(legacy, null, 2);
              }
            }
          }
        } catch {
          readFailed = true;
        }
      }
      if (revision !== sessionRevision || request !== hydrationRequest) {
        const current = get();
        if (recovery && !current.recoveryJson) {
          set({ recoveryJson: recovery });
          saveCurrentStateToStorage(current.design, current.checkpointDesign, current.historyPast, current.historyFuture, current.lastCheckpointAt);
        }
        return;
      }
      if (!session) {
        if (readFailed || recovery) set({ persistenceStatus: 'error', recoveryJson: recovery });
        return;
      }
      const resolved = solveDesign(session.workingDesign);
      const firstCell = resolved.cells[0]?.id ?? null;
      savedAtMs = Math.max(savedAtMs, session.savedAtMs ?? 0);
      set({
        design: session.workingDesign,
        checkpointDesign: session.checkpointDesign,
        resolved,
        historyPast: session.historyPast,
        historyFuture: session.historyFuture,
        hasUnsavedChanges: !sameDesign(session.workingDesign, session.checkpointDesign),
        persistenceStatus: readFailed ? 'partial' : 'restored',
        recoveryJson: recovery ?? session.recoveryJson ?? null,
        lastSavedAt: session.lastAutoSavedAt ?? formatNowTime(),
        lastCheckpointAt: session.lastCheckpointAt,
        selectedBayId: session.workingDesign.runs[0]?.bays[0]?.id ?? null,
        selectedCellId: firstCell,
        selectedCellIds: firstCell ? [firstCell] : [],
        selectedDoorId: null, selectedDoorIds: [],
        selectedDrawerId: null, selectedDrawerIds: [],
        openDoorIds: {}, openDrawerIds: {}, resizeDraft: null,
      });
    },
  };
});
