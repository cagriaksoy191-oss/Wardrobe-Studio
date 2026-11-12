import {
  AlertTriangle,
  Box,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  DoorOpen,
  Download,
  Eye,
  EyeOff,
  FilePlus2,
  FolderOpen,
  Grid as GridIcon,
  History,
  Layers,
  Lock,
  Palette,
  Plus,
  Redo2,
  Ruler,
  Save,
  ScanEye,
  Sliders,
  Trash2,
  Undo2,
  Unlock,
  Upload,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  HANDLE_FINISH_CATALOG,
  HANDLE_STYLE_CATALOG,
  LED_COLOR_TEMP_CATALOG,
  MATERIAL_CATALOG,
  MATERIAL_CATEGORY_LABELS,
  type MaterialCategory,
} from './canvas/materials/materialRegistry';
import { WardrobeCanvas } from './canvas/scene/WardrobeCanvas';
import {
  INSERT_REGISTRY,
  STANDARD_SERVICE_ITEMS,
  resolveServiceItemPlacement,
} from './core/inserts/insertRegistry';
import { type BlankDesignOptions, SAMPLE_DESIGNS } from './core/presets/sampleDesigns';
import type {
  BaseFinishStyle,
  BayFrontMode,
  HandleFinishId,
  HandleStyleId,
  InsertType,
  JunctionType,
  LayoutKind,
  LedColorTempId,
  OwnerType,
  ServiceItemSpec,
  SideFinishStyle,
  TopFinishStyle,
} from './core/schema/types';
import { type SurfaceMaterialSlot, useWardrobeStore } from './store/useWardrobeStore';
import { CommandFeedback, IssueDetails, NumberField, Phase4InteriorPanel, Phase4RoomPanel } from './ui/Phase4Panels';
import { MotionNotice } from './canvas/scene/MotionController';
import { FrontSystemEditor } from './ui/FrontSystemEditor';
import { VersionPanel } from './ui/VersionPanel';
import { ProductionPanel } from './ui/ProductionPanel';
import { extractProduction } from './core/production/productionModel';
import { downloadFile, safeFileName } from './export/download';
import { accessWarnings } from './core/analysis/functionalAccess';
import { AccessReview } from './ui/AccessReview';
import { blankMeasureFields, readBlankMeasurements, shouldExplainExternalDrawers, type BlankMeasure, type BlankMeasureDrafts } from './ui/editorFeedback';

const OWNER_LABELS: Record<OwnerType, { label: string; badgeClass: string }> = {
  anne: {
    label: 'Anne',
    badgeClass: 'border-pink-500/40 bg-pink-500/15 text-pink-200',
  },
  baba: {
    label: 'Baba',
    badgeClass: 'border-sky-500/40 bg-sky-500/15 text-sky-200',
  },
  ortak: {
    label: 'Ortak',
    badgeClass: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200',
  },
};

export function App() {
  const {
    design,
    resolved,
    viewMode,
    activeStep,
    doorVisibilityMode,
    openDoorIds,
    openDrawerIds,
    showDimensions,
    wireframeMode,
    selectedBayId,
    selectedCellId,
    selectedCellIds,
    selectedDrawerId,
    selectedDrawerIds,
    doorEditorMode,
    historyPast,
    historyFuture,
    hasUnsavedChanges,
    lastCheckpointAt,
    persistenceStatus,
    isFirstUse,
    recoveryJson,
    lastSavedAt,
    setViewMode,
    setActiveStep,
    setDoorVisibilityMode,
    setShowDimensions,
    setWireframeMode,
    selectBay,
    selectCell,
    selectDrawer,
    setSelectedCells,
    setDoorEditorMode,
    toggleDoor,
    toggleDrawer,
    setAllDoorsOpen,
    setAllDrawersOpen,
    openNamedVersion,
    startBlankDesign,
    saveCheckpoint,
    updateRunDimension,
    updateMaterialThicknesses,
    setCornerType,
    setCornerHangingRod,
    updateCornerParam,
    setCornerDoorMode,
    addBay,
    removeBay,
    setBaySize,
    toggleBayLock,
    setBayOwner,
    setBayFrontConfig,
    setCellInsert,
    setMaterials,
    setSurfaceMaterial,
    renderQualityMode,
    setRenderQualityMode,
    setGlobalDoorHandle,
    setGlobalDrawerHandle,
    setLedLighting,
    applyExteriorFinishPreset,
    setExteriorFinish,
    setInteriorItemsConfig,
    undo,
    undoSteps,
    revertToCheckpoint,
    redo,
    exportJsonString,
    importJsonString,
    hydrateFromIndexedDB,
  } = useWardrobeStore();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const toolsButtonRef = useRef<HTMLButtonElement>(null);
  const sceneViewButtonRef = useRef<HTMLButtonElement>(null);
  const blankBuilderRef = useRef<HTMLElement>(null);
  const examplesSummaryRef = useRef<HTMLElement>(null);
  const [firstUseDismissed, setFirstUseDismissed] = useState(false);
  const [introDestination, setIntroDestination] = useState<'create' | 'examples' | null>(null);
  const [examplesOpen, setExamplesOpen] = useState(false);
  const firstUse = isFirstUse && persistenceStatus === 'idle' && !firstUseDismissed;
  const [importError, setImportError] = useState<string | null>(null);
  const [showHistoryMenu, setShowHistoryMenu] = useState<boolean>(false);
  const [showAdvancedRightInspector, setShowAdvancedRightInspector] = useState<boolean>(false);

  // Aşama 3: "3. Malzeme" adımı alt sekme durumu
  const [materialSubTab, setMaterialSubTab] = useState<
    'materials' | 'handles' | 'exterior' | 'led-studio' | 'items' | 'versions' | 'production'
  >('materials');
  const [activeMaterialSlot, setActiveMaterialSlot] = useState<SurfaceMaterialSlot>('door');
  const [compactPanel, setCompactPanel] = useState<'setup' | 'selection' | null>(null);
  const [showTools, setShowTools] = useState(false);
  const [materialInspector, setMaterialInspector] = useState(false);
  const [exportNotice, setExportNotice] = useState('');
  const [showAccessReview, setShowAccessReview] = useState(false);
  const [activeMaterialCategory, setActiveMaterialCategory] = useState<MaterialCategory | 'all'>(
    'all'
  );

  // "Yeni Tasarım / Sıfırdan Başla" sihirbazı durumu
  const [showBlankBuilder, setShowBlankBuilder] = useState<boolean>(false);
  const [blankName, setBlankName] = useState<string>('Yeni Gardırop Tasarımı');
  const [blankLayout, setBlankLayout] = useState<LayoutKind>('l-shape');
  const [blankCorner, setBlankCorner] = useState<JunctionType>('diagonal');
  const [blankMeasureDrafts, setBlankMeasureDrafts] = useState<BlankMeasureDrafts>({
    lengthAMm: '2800', depthAMm: '600', lengthBMm: '2200', depthBMm: '600', heightMm: '2400', roomHeightMm: '2550',
  });
  const blankMeasurements = useMemo(() => readBlankMeasurements(blankMeasureDrafts, blankLayout), [blankMeasureDrafts, blankLayout]);

  useEffect(() => {
    void hydrateFromIndexedDB();
  }, [hydrateFromIndexedDB]);

  useEffect(() => {
    if (!introDestination || activeStep !== 'room-carcass') return;
    (introDestination === 'create' ? blankBuilderRef.current : examplesSummaryRef.current)?.focus();
    setIntroDestination(null);
  }, [activeStep, introDestination]);

  const openIntroDestination = (destination: 'create' | 'examples') => {
    setFirstUseDismissed(true);
    setActiveStep('room-carcass');
    setCompactPanel('setup');
    setShowBlankBuilder(destination === 'create');
    if (destination === 'examples') setExamplesOpen(true);
    setIntroDestination(destination);
  };

  // Klavye kısayolları (Ctrl+Z / Ctrl+Y / Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowTools(false);
        setCompactPanel(null);
      }
      const target = e.target as HTMLElement | null;
      const isEditingInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT');

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveCheckpoint();
        return;
      }

      if (isEditingInput) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, saveCheckpoint]);

  const handleExportJson = () => {
    try {
      downloadFile(safeFileName(design.id) + '.wardrobe.json', exportJsonString(), 'application/json');
      setExportNotice('Tasarım JSON indirmesi başlatıldı.');
    } catch {
      setExportNotice('Tasarım JSON indirmesi başlatılamadı.');
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;
    e.currentTarget.value = '';
    if (showTools) {
      setShowTools(false);
      toolsButtonRef.current?.focus();
    }
    setImportError(null);
    setExportNotice('');
    const current = useWardrobeStore.getState().design;
    try {
      if (file.size > 2_000_000) throw new Error('JSON en fazla 2 MB olabilir.');
      const text = await file.text();
      if (current !== useWardrobeStore.getState().design) throw new Error('Dosya okunurken tasarım değişti. JSON dosyasını yeniden seçin.');
      const result = importJsonString(text);
      if (!result.ok) throw new Error(result.error ?? 'JSON dosyası yüklenemedi.');
      setSelectedCells([]);
      if (firstUse && !showTools) sceneViewButtonRef.current?.focus();
      setExportNotice('Tasarım açıldı. Geri Al önceki çalışma kopyasını getirir.');
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'JSON dosyası okunamadı.');
    }
  };

  const handleCreateBlankDesign = () => {
    if (!blankMeasurements.ok) return;
    const opts: BlankDesignOptions = {
      name: blankName.trim() || 'Yeni Gardırop Tasarımı',
      layoutKind: blankLayout,
      cornerType: blankCorner,
      ...blankMeasurements.values,
    };
    startBlankDesign(opts);
    if (useWardrobeStore.getState().commandError) return;
    setShowBlankBuilder(false);
    setCompactPanel(null);
  };

  const blankMeasureInput = (key: BlankMeasure, fullWidth = false) => {
    const { label, min, max, step } = blankMeasureFields[key];
    const invalid = !blankMeasurements.ok && blankMeasurements.field === key;
    return <label className={fullWidth ? 'block space-y-1' : 'space-y-1'}>
      <span className="text-slate-400">{label}</span>
      <input type="number" min={min} max={max} step={step} value={blankMeasureDrafts[key]}
        aria-invalid={invalid || undefined} aria-describedby={invalid ? 'blank-measure-error' : undefined}
        onChange={e => { const draft = e.target.value; setBlankMeasureDrafts(previous => ({ ...previous, [key]: draft })); }}
        className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-xs text-white" />
    </label>;
  };

  const selectedBay =
    resolved.bays.find((b) => b.id === selectedBayId) ?? resolved.bays[0] ?? null;
  const productionPartCount=useMemo(()=>extractProduction(design,resolved).parts.length,[design,resolved]);
  const hasExplicitFront=design.fronts.some(f=>f.bayIds.includes(selectedBay?.id??''));
  const selectedCell =
    resolved.cells.find((c) => c.id === selectedCellId) ??
    resolved.cells.find((c) => c.bayId === selectedBay?.id) ??
    null;

  const activeJunction = design.junctions[0] ?? null;
  const activeCorner = resolved.corners[0] ?? null;
  const cornerDoor = resolved.doors.find((d) => d.isCornerDoor) ?? null;

  const bayDoors = selectedBay
    ? resolved.doors.filter((d) => d.bayId === selectedBay.id)
    : [];
  const bayDrawers = selectedBay
    ? resolved.drawers.filter((d) => d.bayId === selectedBay.id)
    : [];

  const anyDoorOpen = [...resolved.doors,...(resolved.slidingDoors??[])].some((d) => Boolean(openDoorIds[d.id]));
  const anyDrawerOpen = resolved.drawers.some((d) => Boolean(openDrawerIds[d.id]));

  const toggleServiceItemInCell = (presetItem: ServiceItemSpec) => {
    if (!selectedCell || selectedCell.insert?.type !== 'serviceNiche') return;
    const currentItems = selectedCell.insert.serviceItems ?? [];
    const exists = currentItems.some((it) => it.id === presetItem.id);
    const nextItems = exists
      ? currentItems.filter((it) => it.id !== presetItem.id)
      : [...currentItems, { ...presetItem }];
    setCellInsert(selectedCell.id, {
      ...selectedCell.insert,
      serviceItems: nextItems,
    });
  };

  const updateServiceItemDim = (
    itemId: string,
    field: 'widthMm' | 'heightMm' | 'depthMm' | 'liftClearanceMm',
    valueMm: number
  ) => {
    if (!selectedCell || selectedCell.insert?.type !== 'serviceNiche') return;
    const currentItems = selectedCell.insert.serviceItems ?? [];
    const nextItems = currentItems.map((it) =>
      it.id === itemId ? { ...it, [field]: field === 'liftClearanceMm'
        ? Math.min(500, Math.max(0, Math.round(valueMm))) : Math.max(20, Math.round(valueMm)) } : it
    );
    setCellInsert(selectedCell.id, {
      ...selectedCell.insert,
      serviceItems: nextItems,
    });
  };

  const checkpointText = persistenceStatus === 'saving' ? 'Yazılıyor…'
    : persistenceStatus === 'error' ? 'Yeniden kaydet'
    : hasUnsavedChanges ? 'Kaydet *'
    : !lastCheckpointAt ? 'Kaydet'
    : persistenceStatus === 'partial' ? 'Tek depoda kayıt'
    : 'Kayıt noktası';
  const showInspector = activeStep !== 'view-export' || materialInspector;
  const accessProblems = useMemo(() => accessWarnings(resolved.analysis?.functionalAccess ?? []), [resolved]);
  const accessBlocks = accessProblems.filter(entry => entry.status === 'blocked');
  const wideSpans = resolved.issues.filter(issue => issue.code === 'SHELF_SPAN_EXCEEDED');
  const otherIssues = resolved.issues.filter(issue => issue.code !== 'SHELF_SPAN_EXCEEDED')
    .sort((a, b) => Number(b.severity === 'error') - Number(a.severity === 'error'));

  return (
    <div className="studio-app flex min-w-0 flex-col bg-slate-950 text-slate-100">
      {/* ÜST ARAÇ ÇUBUĞU */}
      <header className="studio-header shrink-0 border-b border-slate-800 bg-slate-900/95">
        <div className="studio-brand flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Box className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-wide text-white">WARDROBE STUDIO</h1>
            </div>
            <p className="truncate text-[11px] text-slate-400" title={design.name}>{design.name}</p>
          </div>
        </div>

        {/* GÖRÜNÜM MODU SEÇİCİ (3D / 2D Ortografik Cephe & Plan) */}
        <div role="group" aria-label="Görünüm" className="studio-views flex items-stretch gap-1 rounded-lg border border-slate-800 bg-slate-950 p-1">
          <button
            ref={sceneViewButtonRef}
            onClick={() => setViewMode('3d-perspective')}
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition ${
              viewMode === '3d-perspective'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Box className="h-3.5 w-3.5" />
            3D Perspektif
          </button>
          <button
            onClick={() => setViewMode('2d-front-A')}
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition ${
              viewMode === '2d-front-A'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            2D Cephe (A)
          </button>
          {design.layoutKind === 'l-shape' && (
            <button
              onClick={() => setViewMode('2d-front-B')}
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition ${
                viewMode === '2d-front-B'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              2D Cephe (B)
            </button>
          )}
          <button
            onClick={() => setViewMode('2d-plan-top')}
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition ${
              viewMode === '2d-plan-top'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <GridIcon className="h-3.5 w-3.5" />
            2D Üst Plan
          </button>
        </div>

        {/* KAPAK GÖRÜNÜRLÜĞÜ (NORMAL / X-RAY / GİZLİ) & TOPLU AÇ/KAPAT */}
        <div role="group" aria-label="Kapak ve çekmece görünümü" className="studio-front-toolbar flex min-w-0 items-stretch gap-1.5">
          <div className="flex items-center gap-0.5 rounded-lg border border-slate-800 bg-slate-950 p-1">
            <button
              onClick={() => setDoorVisibilityMode('normal')}
              className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition ${
                doorVisibilityMode === 'normal'
                  ? 'bg-sky-500/25 text-sky-200 border border-sky-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Kapakları Normal Göster"
            >
              <Eye className="h-3 w-3" />
              Kapak
            </button>
            <button
              onClick={() => setDoorVisibilityMode('xray')}
              className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition ${
                doorVisibilityMode === 'xray'
                  ? 'bg-sky-500/25 text-sky-200 border border-sky-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="X-Ray Yarı Saydam Kapak Modu (İç Düzeni Gösterir ve Tıklatır)"
            >
              <ScanEye className="h-3 w-3" />
              X-Ray
            </button>
            <button
              onClick={() => setDoorVisibilityMode('hidden')}
              className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition ${
                doorVisibilityMode === 'hidden'
                  ? 'bg-sky-500/25 text-sky-200 border border-sky-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Kapakları Geçici Olarak Gizle"
            >
              <EyeOff className="h-3 w-3" />
              Gizle
            </button>
          </div>

          <button
            onClick={() => setAllDoorsOpen(!anyDoorOpen)}
            aria-label={anyDoorOpen ? 'Kapakları Kapat' : 'Kapakları Aç'}
            className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition ${
              anyDoorOpen
                ? 'border-amber-500/50 bg-amber-500/20 text-amber-200'
                : 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
            title="Tüm Menteşeli Kapakları Aç / Kapat"
          >
            <DoorOpen className="h-3.5 w-3.5" />
            <span className="studio-front-action-label">{anyDoorOpen ? 'Kapakları Kapat' : 'Kapakları Aç'}</span>
          </button>

          <button
            onClick={() => setAllDrawersOpen(!anyDrawerOpen)}
            aria-label={anyDrawerOpen ? 'Çekmeceleri Kapat' : 'Çekmeceleri Aç'}
            className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition ${
              anyDrawerOpen
                ? 'border-amber-500/50 bg-amber-500/20 text-amber-200'
                : 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
            title="Tüm Çekmeceleri Aç / Kapat"
          >
            <FolderOpen className="h-3.5 w-3.5" />
            <span className="studio-front-action-label">{anyDrawerOpen ? 'Çekmeceleri Kapat' : 'Çekmeceleri Aç'}</span>
          </button>
        </div>

        {/* SAĞ HIZLI EYLEMLER: MANUEL KAYDET, ÖLÇÜLER, TEL-KAFES, GERİ AL/YİNELE, İŞLEM GEÇMİŞİ, JSON */}
        <div className="studio-session relative flex items-center gap-1.5">
          {/* MANUEL KAYDET (CHECKPOINT) BUTONU */}
          <button
            onClick={saveCheckpoint}
            className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold transition ${
              hasUnsavedChanges || !lastCheckpointAt || persistenceStatus === 'error'
                ? 'border-amber-400/70 bg-amber-500 text-slate-950 shadow-sm hover:bg-amber-400'
                : 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
            }`}
            title="Çalışma kopyasını manuel kayıt noktası olarak kaydet (Ctrl+S)"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{checkpointText}</span>
          </button>

          <button ref={toolsButtonRef} type="button" aria-expanded={showTools} aria-controls="studio-more-tools"
            className="studio-more-trigger rounded-md border border-slate-700 bg-slate-800 px-2 py-2 text-xs"
            onClick={() => setShowTools(!showTools)}>Araçlar</button>
          <div id="studio-more-tools" className="studio-more-tools" data-open={showTools}>
          {/* ÖLÇÜLER BUTONU */}
          <button
            onClick={() => setShowDimensions(!showDimensions)}
            className={`flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition ${
              showDimensions
                ? 'border-sky-500/50 bg-sky-500/15 text-sky-300'
                : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
            title="Milimetrik Ölçü Çizgilerini Göster/Gizle"
          >
            <Ruler className="h-3.5 w-3.5" />
            <span>Ölçüler</span>
          </button>

          <button
            onClick={() => setWireframeMode(!wireframeMode)}
            className={`flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition ${
              wireframeMode
                ? 'border-amber-500/50 bg-amber-500/15 text-amber-300'
                : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
            title="Tel-Kafes (Teşhis) Görünümü"
          >
            <Sliders className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={undo}
            disabled={historyPast.length === 0}
            className="flex items-center gap-1 rounded-md border border-slate-800 bg-slate-900 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-40"
            title={
              historyPast.length > 0
                ? `Geri Al (${historyPast.length} adım): ${historyPast[historyPast.length - 1].label}`
                : 'Geri Al (Ctrl+Z) — Kayıt noktasındasınız'
            }
          >
            <Undo2 className="h-3.5 w-3.5" />
            <span>{historyPast.length}</span>
          </button>
          <button
            onClick={redo}
            disabled={historyFuture.length === 0}
            className="flex items-center gap-1 rounded-md border border-slate-800 bg-slate-900 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-40"
            title={
              historyFuture.length > 0
                ? `Yinele (${historyFuture.length} adım): ${historyFuture[historyFuture.length - 1].label}`
                : 'Yinele (Ctrl+Y)'
            }
          >
            <Redo2 className="h-3.5 w-3.5" />
            {historyFuture.length > 0 && <span>{historyFuture.length}</span>}
          </button>

          {/* AŞAMA 2.4 BÖLÜM 9: ÇOKLU ADIM GERİ ALMA VE İŞLEM GEÇMİŞİ MENÜSÜ */}
          <button
            type="button"
            onClick={() => setShowHistoryMenu(!showHistoryMenu)}
            className={`flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition ${
              showHistoryMenu
                ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                : 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
            title="İşlem Geçmişi ve Çoklu Adım Geri Alma (5 / 10 / 20 Adım veya Son Kayıt Noktasına Dön)"
          >
            <History className="h-3.5 w-3.5" />
            <ChevronDown className="h-3 w-3" />
          </button>

          {showHistoryMenu && (
            <div className="absolute right-12 top-11 z-50 w-72 rounded-xl border border-slate-700 bg-slate-950/95 p-3 text-xs text-slate-100 shadow-2xl backdrop-blur-md space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="font-bold text-amber-300">
                  İşlem Geçmişi ({historyPast.length} Geri / {historyFuture.length} İleri)
                </span>
                <button
                  type="button"
                  onClick={() => setShowHistoryMenu(false)}
                  className="text-[10px] text-slate-400 hover:text-white"
                >
                  Kapat
                </button>
              </div>

              {/* Hızlı Çoklu Geri Alma Butonları */}
              <div className="grid grid-cols-3 gap-1 text-[10px]">
                <button
                  type="button"
                  disabled={historyPast.length === 0}
                  onClick={() => {
                    undoSteps(5);
                    setShowHistoryMenu(false);
                  }}
                  className="rounded border border-slate-700 bg-slate-900 py-1 font-semibold text-slate-200 hover:border-amber-400/50 disabled:opacity-40"
                >
                  5 Adım Geri
                </button>
                <button
                  type="button"
                  disabled={historyPast.length === 0}
                  onClick={() => {
                    undoSteps(10);
                    setShowHistoryMenu(false);
                  }}
                  className="rounded border border-slate-700 bg-slate-900 py-1 font-semibold text-slate-200 hover:border-amber-400/50 disabled:opacity-40"
                >
                  10 Adım Geri
                </button>
                <button
                  type="button"
                  disabled={historyPast.length === 0}
                  onClick={() => {
                    undoSteps(20);
                    setShowHistoryMenu(false);
                  }}
                  className="rounded border border-slate-700 bg-slate-900 py-1 font-semibold text-slate-200 hover:border-amber-400/50 disabled:opacity-40"
                >
                  20 Adım Geri
                </button>
              </div>

              <button
                type="button"
                disabled={historyPast.length === 0}
                onClick={() => {
                  revertToCheckpoint();
                  setShowHistoryMenu(false);
                }}
                className="w-full rounded border border-amber-500/50 bg-amber-500/20 px-2.5 py-1.5 text-[11px] font-bold text-amber-200 hover:bg-amber-500/30 disabled:opacity-40"
              >
                Son Kayıt Noktasına (Checkpoint) Dön ({historyPast.length} Adım)
              </button>

              {/* Tıklanabilir Son İşlemler Listesi */}
              <div className="space-y-1 max-h-48 overflow-y-auto pr-0.5">
                {historyPast.length === 0 ? (
                  <div className="py-2 text-center text-[11px] text-slate-500">
                    Kayıt noktasından bu yana işlem yapılmadı.
                  </div>
                ) : (
                  [...historyPast].reverse().map((step, revIdx) => {
                    const stepsBack = revIdx + 1;
                    return (
                      <button
                        key={`${step.timestampMs ?? revIdx}-${revIdx}`}
                        type="button"
                        onClick={() => {
                          undoSteps(stepsBack);
                          setShowHistoryMenu(false);
                        }}
                        className="flex w-full items-center justify-between rounded border border-slate-800 bg-slate-900/90 px-2 py-1 text-left text-[11px] text-slate-300 hover:border-sky-500/50 hover:text-white"
                      >
                        <span className="truncate pr-2">
                          {stepsBack}. {step.label}
                        </span>
                        <span className="shrink-0 font-mono text-[9px] text-amber-300">
                          -{stepsBack} adım
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          <button
            onClick={handleExportJson}
            className="flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs font-medium text-slate-200 hover:bg-slate-700"
            title="Tasarımı .wardrobe.json olarak indir"
          >
            <Download className="h-3.5 w-3.5" />
            JSON
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs font-medium text-slate-200 hover:bg-slate-700"
            title=".wardrobe.json dosyasından yükle"
          >
            <Upload className="h-3.5 w-3.5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportFile}
            className="hidden"
          />
          </div>
        </div>
      </header>

      <CommandFeedback />
      <MotionNotice />
      {importError && <div role="alert" className="flex shrink-0 items-start justify-between gap-2 border-b border-rose-700 bg-rose-950 px-3 py-2 text-xs text-rose-100">
        <span>JSON açılamadı. Çalışma kopyası korundu. {importError}</span>
        <button className="shrink-0 underline" onClick={() => setImportError(null)}>Kapat</button>
      </div>}
      {firstUse && <section aria-label="İlk tasarım" className="flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-sky-800 bg-sky-950/60 px-3 py-2 text-xs text-sky-100">
        <p><strong>İlk tasarım</strong> · Ekranda hazır bir örnek var. Aşağıdaki erişim uyarısı bu örneğe ait.</p>
        <div className="flex flex-wrap items-center gap-1.5">
          <button type="button" className="rounded border border-emerald-500 px-2 py-1.5 text-emerald-100" onClick={() => openIntroDestination('create')}>Kendi gardırobunu oluştur</button>
          <button type="button" className="rounded border border-sky-700 px-2 py-1.5" onClick={() => openIntroDestination('examples')}>Hazır örnekleri incele</button>
          <button type="button" className="rounded border border-sky-700 px-2 py-1.5" onClick={() => fileInputRef.current?.click()}>JSON dosyası aç</button>
          <button type="button" className="rounded px-2 py-1.5 underline" onClick={() => { setFirstUseDismissed(true); sceneViewButtonRef.current?.focus(); }}>Başlangıcı gizle</button>
        </div>
      </section>}
      {accessBlocks.length > 0 && <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-rose-900 bg-rose-950/50 px-3 py-1 text-xs text-rose-100">
        <span role="status">{resolved.corners.some(corner => corner.type === 'diagonal' && accessBlocks[0].bayId === corner.id)
          ? 'Köşe kapağı erişimi engelliyor' : 'İşlevsel erişim engeli'} · {accessBlocks.length} bölüm</span>
        <button type="button" className="min-h-8 rounded border border-rose-600/70 px-2.5 py-1 text-rose-100 hover:bg-rose-900"
          onClick={() => setShowAccessReview(true)}>Erişim ve çözümleri incele</button>
      </div>}
      {showAccessReview && <AccessReview onClose={() => setShowAccessReview(false)} onApplied={() => {
        setShowAccessReview(false);
        requestAnimationFrame(() => sceneViewButtonRef.current?.focus());
      }} />}
      <nav aria-label="Dar ekran panelleri" className="studio-compact-nav flex shrink-0 gap-2 border-b border-slate-800 px-2 py-1 xl:hidden">
        <button type="button" aria-expanded={compactPanel === 'setup'} aria-controls="studio-setup"
          className="rounded border border-slate-700 px-3 py-2 text-xs aria-expanded:border-sky-400"
          onClick={() => setCompactPanel(compactPanel === 'setup' ? null : 'setup')}>Tasarım paneli</button>
        <button type="button" aria-expanded={compactPanel === 'selection'} aria-controls="studio-selection"
          className="rounded border border-slate-700 px-3 py-2 text-xs aria-expanded:border-sky-400"
          onClick={() => setCompactPanel(compactPanel === 'selection' ? null : 'selection')}>Seçim ve uyarılar</button>
      </nav>

      {/* ANA ÇALIŞMA ALANI */}
      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {/* SOL PANEL: 3 ADIMLI İŞ AKIŞI, ŞABLONLAR, KOL ÖLÇÜLERİ, MALZEME KALINLIKLARI, KÖŞE VE BÖLMELER */}
        <aside id="studio-setup" aria-label="Tasarım paneli" className={`studio-setup ${compactPanel === 'setup' ? 'absolute inset-y-0 left-0 z-60 flex' : 'hidden'} w-80 max-w-full shrink-0 flex-col overflow-y-auto border-r border-slate-800 bg-slate-900 xl:static xl:flex`}>
          <div className="sticky top-0 z-10 shrink-0 border-b border-slate-800 bg-slate-950 p-2">
            <button type="button" className="mb-1 rounded border border-slate-700 px-2 py-1 text-xs xl:hidden" onClick={() => setCompactPanel(null)}>Tasarım panelini kapat</button>
            <div className="grid grid-cols-3 gap-1 rounded-lg bg-slate-900 p-1 text-[11px]">
              <button
                onClick={() => setActiveStep('room-carcass')}
                className={`rounded py-1.5 font-medium transition ${
                  activeStep === 'room-carcass'
                    ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                1. Oda & Köşe
              </button>
              <button
                onClick={() => setActiveStep('interior-fronts')}
                className={`rounded py-1.5 font-medium transition ${
                  activeStep === 'interior-fronts'
                    ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                2. İç & Kapak
              </button>
              <button
                onClick={() => setActiveStep('view-export')}
                className={`rounded py-1.5 font-medium transition ${
                  activeStep === 'view-export'
                    ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                3. Malzeme / Çıktı
              </button>
            </div>
          </div>

          {activeStep === 'interior-fronts' && <><FrontSystemEditor/><Phase4InteriorPanel /></>}
          {/* ADIM 1: ODA, ŞABLONLAR, KOL ÖLÇÜLERİ, MALZEME KALINLIKLARI VE KÖŞE */}
          {activeStep === 'room-carcass' && (
            <>
              {/* 1. ÖRNEK TASARIM ŞABLONLARI VE SIFIRDAN BAŞLA */}
              <div className="border-b border-slate-800 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Gardırop oluştur
                  </h2>
                  <button
                    onClick={() => setShowBlankBuilder(!showBlankBuilder)}
                    aria-expanded={showBlankBuilder}
                    className={`flex items-center gap-1 rounded border px-2 py-1 text-[10px] font-semibold transition ${
                      showBlankBuilder
                        ? 'border-emerald-400 bg-emerald-500 text-slate-950'
                        : 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                    }`}
                  >
                    <FilePlus2 className="h-3 w-3" />
                    Yeni tasarım
                  </button>
                </div>

                {showBlankBuilder && (
                  <section ref={blankBuilderRef} tabIndex={-1} aria-label="Yeni tasarım ölçüleri" className="rounded-lg border border-emerald-500/40 bg-slate-950 p-3 space-y-2.5 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-300">Yerleşim ve ölçüler</span>
                      <button
                        onClick={() => setShowBlankBuilder(false)}
                        className="text-[10px] text-slate-400 hover:text-slate-200"
                      >
                        Kapat
                      </button>
                    </div>

                    <p className="text-slate-300">Ölçüleri mm olarak girin. L yerleşimde A ana duvar, B dönen duvardır; ikisini de iç köşeden ölçün. Genişlikler dış ölçüdür; net iç alan, paneller düşüldükten sonra hesaplanır.</p>
                    <label className="block space-y-1">
                      <span className="text-slate-400">Tasarım Adı</span>
                      <input
                        type="text"
                        value={blankName}
                        onChange={(e) => setBlankName(e.target.value)}
                        className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white"
                      />
                    </label>

                    <div className="space-y-1">
                      <span className="text-slate-400">Gardırop Biçimi</span>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setBlankLayout('l-shape')}
                          className={`rounded border px-2 py-1 text-xs font-medium ${
                            blankLayout === 'l-shape'
                              ? 'border-emerald-500 bg-emerald-500/20 text-emerald-200'
                              : 'border-slate-800 bg-slate-900 text-slate-400'
                          }`}
                        >
                          L-Tipi Köşe Dolap
                        </button>
                        <button
                          type="button"
                          onClick={() => setBlankLayout('straight')}
                          className={`rounded border px-2 py-1 text-xs font-medium ${
                            blankLayout === 'straight'
                              ? 'border-emerald-500 bg-emerald-500/20 text-emerald-200'
                              : 'border-slate-800 bg-slate-900 text-slate-400'
                          }`}
                        >
                          Düz (Tek Duvar)
                        </button>
                      </div>
                    </div>

                    {blankLayout === 'l-shape' && (
                      <div className="space-y-1">
                        <span className="text-slate-400">Köşe Modülü Tipi</span>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => setBlankCorner('diagonal')}
                            className={`rounded border px-2 py-1 text-xs font-medium ${
                              blankCorner === 'diagonal'
                                ? 'border-amber-500 bg-amber-500/20 text-amber-200'
                                : 'border-slate-800 bg-slate-900 text-slate-400'
                            }`}
                          >
                            Beşgen / Diyagonal
                          </button>
                          <button
                            type="button"
                            onClick={() => setBlankCorner('blind')}
                            className={`rounded border px-2 py-1 text-xs font-medium ${
                              blankCorner === 'blind'
                                ? 'border-amber-500 bg-amber-500/20 text-amber-200'
                                : 'border-slate-800 bg-slate-900 text-slate-400'
                            }`}
                          >
                            Kör Köşe (Klapalı)
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      {blankMeasureInput('lengthAMm')}
                      {blankMeasureInput('depthAMm')}
                    </div>

                    {blankLayout === 'l-shape' && (
                      <div className="grid grid-cols-2 gap-2">
                        {blankMeasureInput('lengthBMm')}
                        {blankMeasureInput('depthBMm')}
                      </div>
                    )}

                    {blankMeasureInput('roomHeightMm', true)}
                    {blankMeasureInput('heightMm', true)}
                    <p className="text-slate-300">Oda yüksekliği zemin ile tavan arasıdır. Gardırop yüksekliği, dolabın baza ve üst klapa dahil dış yüksekliğidir.</p>

                    {!blankMeasurements.ok && <p id="blank-measure-error" role="alert" className="text-rose-200">{blankMeasurements.error}</p>}
                    <button
                      type="button"
                      onClick={handleCreateBlankDesign}
                      disabled={!blankMeasurements.ok}
                      className="flex min-h-9 w-full items-center justify-center gap-1.5 rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50 transition"
                    >
                      <FilePlus2 className="h-3.5 w-3.5" />
                      Boş Gardırobu Oluştur ve Başla
                    </button>
                  </section>
                )}

                <details className="space-y-1.5" open={examplesOpen} onToggle={event => setExamplesOpen(event.currentTarget.open)}>
                  <summary ref={examplesSummaryRef} className="cursor-pointer py-1 text-xs text-slate-300">Hazır örnekler</summary>
                  {Object.values(SAMPLE_DESIGNS).map((preset) => {
                    const active = design.id === preset.id;
                    return (
                      <button
                        key={preset.id}
                        onClick={() => {
                          if (openNamedVersion(preset, preset.name)) setCompactPanel(null);
                        }}
                        className={`w-full rounded-lg border px-3 py-2 text-left text-xs transition ${
                          active
                            ? 'border-amber-500/60 bg-amber-500/15 text-amber-200 font-semibold'
                            : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        {preset.name}
                      </button>
                    );
                  })}
                </details>
              </div>
              {!showBlankBuilder && <Phase4RoomPanel />}

              {/* 2. DUVAR KOLLARI VE ASİMETRİK DERİNLİK AYARLARI */}
              <div className="border-b border-slate-800 p-3.5 space-y-3">
                <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  2. Kol Ölçüleri & Derinlik (mm)
                </h2>

                {design.runs.map((run) => {
                  if (design.layoutKind === 'straight' && run.wallAxis !== 'A') return null;
                  return (
                    <div
                      key={run.id}
                      className="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-amber-300">{run.label}</span>
                        <button
                          onClick={() => addBay(run.id)}
                          className="flex items-center gap-1 rounded border border-sky-500/40 bg-sky-500/15 px-2 py-0.5 text-[10px] font-medium text-sky-200 hover:bg-sky-500/25"
                          title="Bu Kola Yeni Gövde Bölmesi Ekle"
                        >
                          <Plus className="h-3 w-3" />
                          Bölme Ekle
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <label className="space-y-1">
                          <span className="text-slate-400">Uzunluk (mm)</span>
                          <input
                            type="number"
                            step={50}
                            min={1200}
                            max={6000}
                            value={run.lengthMm}
                            onChange={(e) =>
                              updateRunDimension(run.id, 'lengthMm', Number(e.target.value) || 2000)
                            }
                            className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-xs text-white"
                          />
                        </label>
                        <label className="space-y-1">
                          <span className="text-slate-400">Derinlik (mm)</span>
                          <input
                            type="number"
                            step={20}
                            min={350}
                            max={800}
                            value={run.depthMm}
                            onChange={(e) =>
                              updateRunDimension(run.id, 'depthMm', Number(e.target.value) || 600)
                            }
                            className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-xs text-white"
                          />
                        </label>
                      </div>
                    </div>
                  );
                })}

                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <label className="space-y-1">
                    <span className="text-slate-400">Yükseklik</span>
                    <input
                      type="number"
                      step={20}
                      min={1800}
                      max={3000}
                      value={design.runs[0]?.heightMm ?? 2400}
                      onChange={(e) =>
                        updateRunDimension(
                          design.runs[0].id,
                          'heightMm',
                          Number(e.target.value) || 2400
                        )
                      }
                      className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-xs text-white"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-slate-400">Baza (mm)</span>
                    <input
                      type="number"
                      step={10}
                      min={0}
                      max={200}
                      value={design.runs[0]?.plinthHeightMm ?? 80}
                      onChange={(e) =>
                        updateRunDimension(
                          design.runs[0].id,
                          'plinthHeightMm',
                          Number(e.target.value) || 0
                        )
                      }
                      className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-xs text-white"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-slate-400">Üst klapa (mm)</span>
                    <input
                      aria-describedby="top-filler-help"
                      type="number"
                      step={10}
                      min={0}
                      max={200}
                      value={design.runs[0]?.topFillerHeightMm ?? 40}
                      onChange={(e) =>
                        updateRunDimension(
                          design.runs[0].id,
                          'topFillerHeightMm',
                          Number(e.target.value) || 0
                        )
                      }
                      className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-xs text-white"
                    />
                  </label>
                </div>
                <p id="top-filler-help" className="text-[10px] text-slate-400">Gövdenin üstündeki dikey dolgu yüksekliği. Dekoratif taç biçimi Gömme sekmesinde ayrı seçilir.</p>
              </div>

              {/* AŞAMA 2.4 BÖLÜM 11: İKİ PARAMETRELİ MALZEME KALINLIĞI SİSTEMİ */}
              <div className="border-b border-slate-800 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h2 className="text-[11px] font-bold uppercase tracking-wider text-sky-400">
                    3. Malzeme Kalınlıkları (`t` & `tb`)
                  </h2>
                  <span className="rounded bg-sky-500/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-sky-300">
                    {resolved.panelThicknessMm} / {resolved.backPanelThicknessMm} mm
                  </span>
                </div>

                <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-950/80 p-2.5 text-[11px]">
                  {/* 1. Ana Panel Kalınlığı */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 font-medium">Ana Panel Kalınlığı (mm)</span>
                      <div className="flex gap-1">
                        {[18, 22, 25].map((presetT) => (
                          <button
                            key={presetT}
                            type="button"
                            onClick={() => updateMaterialThicknesses(presetT, undefined)}
                            className={`rounded border px-1.5 py-0.5 font-mono text-[10px] ${
                              resolved.panelThicknessMm === presetT
                                ? 'border-amber-400 bg-amber-500/25 text-amber-200 font-bold'
                                : 'border-slate-800 bg-slate-900 text-slate-400'
                            }`}
                          >
                            {presetT}
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      type="number"
                      min={12}
                      max={36}
                      value={resolved.panelThicknessMm}
                      onChange={(e) =>
                        updateMaterialThicknesses(Number(e.target.value) || 18, undefined)
                      }
                      className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-xs text-white"
                    />
                  </div>

                  {/* 2. Arkalık ve Çekmece Tabanı Kalınlığı */}
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 font-medium">
                        Arkalık & Çekmece Tabanı (mm)
                      </span>
                      <div className="flex gap-1">
                        {[8, 4, 3].map((presetTb) => (
                          <button
                            key={presetTb}
                            type="button"
                            onClick={() => updateMaterialThicknesses(undefined, presetTb)}
                            className={`rounded border px-1.5 py-0.5 font-mono text-[10px] ${
                              resolved.backPanelThicknessMm === presetTb
                                ? 'border-emerald-400 bg-emerald-500/25 text-emerald-200 font-bold'
                                : 'border-slate-800 bg-slate-900 text-slate-400'
                            }`}
                          >
                            {presetTb}
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      type="number"
                      min={3}
                      max={18}
                      value={resolved.backPanelThicknessMm}
                      onChange={(e) =>
                        updateMaterialThicknesses(undefined, Number(e.target.value) || 8)
                      }
                      className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-xs text-white"
                    />
                  </div>

                  <div className="rounded bg-slate-900/90 px-2 py-1 text-[10px] text-slate-400 font-mono">
                    800mm Dış Bölme → Net İç:{' '}
                    <strong className="text-sky-300">
                      {800 - 2 * resolved.panelThicknessMm} mm
                    </strong>
                  </div>
                </div>
              </div>

              {/* 4. L-KÖŞE BİRLEŞİMİ AYARLARI */}
              {design.layoutKind === 'l-shape' && activeJunction && (
                <div className="border-b border-slate-800 p-3.5 space-y-2.5">
                  <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    4. L-Köşe Birleşimi (`Junction`)
                  </h2>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => setCornerType('diagonal')}
                      className={`rounded-md border px-2.5 py-1.5 text-xs font-medium transition ${
                        activeJunction.type === 'diagonal'
                          ? 'border-amber-500 bg-amber-500/20 text-amber-200'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Beşgen / Diyagonal
                    </button>
                    <button
                      onClick={() => setCornerType('blind')}
                      className={`rounded-md border px-2.5 py-1.5 text-xs font-medium transition ${
                        activeJunction.type === 'blind'
                          ? 'border-amber-500 bg-amber-500/20 text-amber-200'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Kör Köşe (Klapalı)
                    </button>
                  </div>

                  {activeJunction.type === 'diagonal' ? (
                    <>
                      <div className="grid grid-cols-3 gap-2 text-[11px]">
                        <label className="space-y-1">
                          <span className="text-slate-400">Köşe A (mm)</span>
                          <input
                            type="number"
                            step={20}
                            min={750}
                            max={1300}
                            value={activeJunction.diagonalArmAMm}
                            onChange={(e) =>
                              updateCornerParam('diagonalArmAMm', Number(e.target.value) || 900)
                            }
                            className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-xs text-white"
                          />
                        </label>
                        <label className="space-y-1">
                          <span className="text-slate-400">Köşe B (mm)</span>
                          <input
                            type="number"
                            step={20}
                            min={750}
                            max={1300}
                            value={activeJunction.diagonalArmBMm}
                            onChange={(e) =>
                              updateCornerParam('diagonalArmBMm', Number(e.target.value) || 900)
                            }
                            className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-xs text-white"
                          />
                        </label>
                        <label className="space-y-1">
                          <span className="text-slate-400">Köşe rafı sayısı</span>
                          <input
                            type="number"
                            min={0}
                            max={7}
                            value={activeJunction.shelvesCount}
                            onChange={(e) =>
                              updateCornerParam('shelvesCount', Number(e.target.value))
                            }
                            className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-xs text-white"
                          />
                        </label>
                      </div>

                      <p className="text-[10px] text-slate-400">{activeJunction.shelvesCount} fiziksel raf · {activeJunction.shelvesCount + 1} kullanılabilir aralık</p>
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Köşe Açılı Kapak Yönü:</span>
                          <div className="flex gap-1">
                            {(['left', 'right', 'open'] as const).map((m) => (
                              <button
                                key={m}
                                onClick={() => setCornerDoorMode(m)}
                                className={`rounded border px-1.5 py-0.5 text-[10px] ${
                                  (activeJunction.doorMode ?? 'left') === m
                                    ? 'border-amber-500 bg-amber-500/20 text-amber-200'
                                    : 'border-slate-800 bg-slate-950 text-slate-400'
                                }`}
                              >
                                {m === 'left' ? 'Sol' : m === 'right' ? 'Sağ' : 'Açık'}
                              </button>
                            ))}
                          </div>
                        </div>

                        {cornerDoor && (
                          <button
                            onClick={() => toggleDoor(cornerDoor.id)}
                            className="flex w-full items-center justify-between rounded border border-amber-500/40 bg-amber-500/10 px-2.5 py-1.5 text-[11px] font-medium text-amber-200 hover:bg-amber-500/20"
                          >
                            <span className="flex items-center gap-1.5">
                              <DoorOpen className="h-3.5 w-3.5" />
                              Beşgen Köşe Kapağı ({cornerDoor.widthMm} mm)
                            </span>
                            <span className="rounded bg-amber-500/25 px-1.5 py-0.5 text-[10px] font-bold">
                              {openDoorIds[cornerDoor.id] ? 'Kapat' : 'Aç'}
                            </span>
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <label className="space-y-1">
                        <span className="text-slate-400">Kör Klapa (mm)</span>
                        <input
                          type="number"
                          step={5}
                          min={20}
                          max={150}
                          value={activeJunction.fillerWidthMm}
                          onChange={(e) =>
                            updateCornerParam('fillerWidthMm', Number(e.target.value) || 60)
                          }
                          className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-xs text-white"
                        />
                      </label>
                      <div className="flex flex-col justify-end text-[11px] text-slate-400">
                        <span>B Kolu Başlangıcı:</span>
                        <span className="font-mono font-semibold text-sky-300">
                          {activeCorner?.consumedRunBMm ?? 660} mm
                        </span>
                      </div>
                    </div>
                  )}

                  {activeCorner && activeJunction.type === 'diagonal' && (
                    <div className="rounded border border-slate-800 bg-slate-950/80 px-2.5 py-1.5 text-[11px] text-slate-300 flex justify-between">
                      <span>Ön Açılı Açıklık:</span>
                      <span className="font-mono font-bold text-amber-300">
                        {activeCorner.frontOpeningWidthMm} mm ({activeCorner.frontAngleDeg}°)
                      </span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* ADIM 2: İÇ DÜZEN & KAPAK ODAKLI SOL GEZGİN */}
          {activeStep === 'interior-fronts' && (
            <div className="border-b border-slate-800 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <h2 className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                  İç Düzen & Kapak Gezgini
                </h2>
                <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
                  Adım 2 Aktif
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                3D sahnedeki <strong>+ Bölme Ekle</strong> butonlarıyla veya aşağıdan yeni bölme
                ekleyin; bölmeye, çekmeceye veya kapağa tıkladığınızda yanında açılan bağlamsal
                panel ile doğrudan düzenleyin.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {design.runs.map((run) => {
                  if (design.layoutKind === 'straight' && run.wallAxis !== 'A') return null;
                  return (
                    <button
                      key={run.id}
                      onClick={() => addBay(run.id)}
                      className="flex items-center gap-1 rounded border border-sky-500/40 bg-sky-500/15 px-2.5 py-1 text-[11px] font-medium text-sky-200 hover:bg-sky-500/25"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {run.wallAxis} Koluna Bölme Ekle
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setDoorEditorMode(!doorEditorMode)}
                  className={`flex items-center gap-1 rounded border px-2.5 py-1 text-[11px] font-semibold ${
                    doorEditorMode
                      ? 'border-amber-400 bg-amber-500 text-slate-950'
                      : 'border-amber-500/40 bg-amber-500/15 text-amber-200 hover:bg-amber-500/25'
                  }`}
                >
                  <DoorOpen className="h-3.5 w-3.5" />
                  {doorEditorMode ? 'Kapak Editörü Aktif' : 'Kapak Editörünü Aç'}
                </button>
              </div>
            </div>
          )}

          {/* ADIM 3: MALZEME, KULP, GÖMME BİTİŞ, LED AYDINLATMA, SUNUM MODU VE 3D EŞYALAR (AŞAMA 3) */}
          {activeStep === 'view-export' && (
            <div className="p-3 space-y-3">
              {/* Alt Sekme Seçici: 5 Düzenli Kategori */}
              <div className="grid grid-cols-4 gap-1 rounded-lg border border-slate-800 bg-slate-950 p-1 text-[10px]">
                {[
                  { id: 'materials', label: 'Yüzey' },
                  { id: 'handles', label: 'Kulp' },
                  { id: 'exterior', label: 'Gömme' },
                  { id: 'led-studio', label: 'LED/Işık' },
                  { id: 'items', label: '3D Eşya' },
                  { id: 'versions', label: 'Sürüm / AI' },
                  { id: 'production', label: 'Üretim' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() =>
                      setMaterialSubTab(
                        tab.id as 'materials' | 'handles' | 'exterior' | 'led-studio' | 'items' | 'versions' | 'production'
                      )
                    }
                    className={`rounded py-1.5 font-semibold transition ${
                      materialSubTab === tab.id
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {materialSubTab === 'versions' && <VersionPanel/>}
              {materialSubTab === 'production' && <ProductionPanel onReviewAccess={() => setShowAccessReview(true)} />}

              {/* SEKME 1: PBR MALZEME SİSTEMİ VE KALINLIKLAR */}
              {materialSubTab === 'materials' && (
                <div className="space-y-3">
                  {/* Malzeme Kalınlıkları Hızlı Kartı */}
                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-2.5 space-y-2 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sky-300">
                        Üretim Kalınlıkları (`t` & `tb`)
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {resolved.panelThicknessMm} / {resolved.backPanelThicknessMm} mm
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="space-y-1">
                        <span className="text-slate-400">Ana Panel (mm)</span>
                        <input
                          type="number"
                          min={12}
                          max={36}
                          value={resolved.panelThicknessMm}
                          onChange={(e) =>
                            updateMaterialThicknesses(Number(e.target.value) || 18, undefined)
                          }
                          className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-xs text-white"
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-slate-400">Arkalık / Taban (mm)</span>
                        <input
                          type="number"
                          min={3}
                          max={18}
                          value={resolved.backPanelThicknessMm}
                          onChange={(e) =>
                            updateMaterialThicknesses(undefined, Number(e.target.value) || 8)
                          }
                          className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-xs text-white"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Hedef Yüzey Slotu Seçici (Gövde / Kapak / Çekmece / Raf) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h2 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-400">
                        <Palette className="h-3.5 w-3.5" />
                        1. Düzenlenecek Yüzey Grubu
                      </h2>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                      {(
                        [
                          {
                            slot: 'carcass',
                            title: 'Gövde & Dikmeler',
                            matId: design.materials.carcassMaterialId,
                          },
                          {
                            slot: 'door',
                            title: 'Kapak Yüzeyi',
                            matId: design.materials.frontMaterialId,
                          },
                          {
                            slot: 'drawerFront',
                            title: 'Çekmece Ön Yüzü',
                            matId:
                              design.materials.drawerFrontMaterialId ??
                              design.materials.frontMaterialId,
                          },
                          {
                            slot: 'shelf',
                            title: 'İç Raf Yüzeyi',
                            matId:
                              design.materials.shelfMaterialId ??
                              design.materials.carcassMaterialId,
                          },
                        ] as const
                      ).map((s) => {
                        const active = activeMaterialSlot === s.slot;
                        const matMeta = MATERIAL_CATALOG[s.matId];
                        return (
                          <button
                            key={s.slot}
                            type="button"
                            aria-pressed={active}
                            onClick={() => setActiveMaterialSlot(s.slot)}
                            className={`rounded-lg border p-2 text-left transition ${
                              active
                                ? 'border-amber-400 bg-amber-500/20 text-amber-100'
                                : 'border-slate-800 bg-slate-950/80 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <div className="text-[10px] font-bold text-slate-400">{s.title}</div>
                            <div className="mt-1 flex items-start gap-1.5 font-semibold text-xs">
                              <span
                                className="h-3.5 w-3.5 shrink-0 rounded border border-white/25"
                                style={{ backgroundColor: matMeta.baseHex }}
                              />
                              <span className="min-w-0 break-words leading-snug">{matMeta.name}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Kategori Filtresi */}
                  <button type="button" className="rounded border border-slate-700 px-2 py-1 text-[10px] text-slate-300"
                    onClick={() => setMaterials({ shelfMaterialId: design.materials.carcassMaterialId })}>
                    Gövde malzemesini raflara da uygula
                  </button>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-semibold uppercase tracking-wider text-slate-400">
                        2. Malzeme Kategorisi (PBR Katalog)
                      </span>
                      <span className="text-sky-300">Dünya Ölçekli UV Aktif</span>
                    </div>
                    <div className="flex flex-wrap gap-1 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setActiveMaterialCategory('all')}
                        className={`rounded border px-2 py-0.5 font-medium ${
                          activeMaterialCategory === 'all'
                            ? 'border-sky-400 bg-sky-500/20 text-sky-200'
                            : 'border-slate-800 bg-slate-950 text-slate-400'
                        }`}
                      >
                        Tümü (17)
                      </button>
                      {(Object.keys(MATERIAL_CATEGORY_LABELS) as MaterialCategory[]).map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setActiveMaterialCategory(cat)}
                          className={`rounded border px-2 py-0.5 font-medium ${
                            activeMaterialCategory === cat
                              ? 'border-sky-400 bg-sky-500/20 text-sky-200'
                              : 'border-slate-800 bg-slate-950 text-slate-400'
                          }`}
                        >
                          {MATERIAL_CATEGORY_LABELS[cat]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Malzeme Kartları Listesi */}
                  <div className="space-y-1.5">
                    {Object.values(MATERIAL_CATALOG)
                      .filter(
                        (m) =>
                          activeMaterialCategory === 'all' || m.category === activeMaterialCategory
                      )
                      .map((m) => {
                        const currentSlotMatId =
                          activeMaterialSlot === 'carcass'
                            ? design.materials.carcassMaterialId
                            : activeMaterialSlot === 'door'
                              ? design.materials.frontMaterialId
                              : activeMaterialSlot === 'drawerFront'
                                ? (design.materials.drawerFrontMaterialId ??
                                  design.materials.frontMaterialId)
                                : (design.materials.shelfMaterialId ??
                                  design.materials.carcassMaterialId);
                        const active = currentSlotMatId === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            aria-pressed={active}
                            onClick={() => setSurfaceMaterial(activeMaterialSlot, m.id)}
                            className={`flex w-full items-center justify-between rounded-lg border px-2.5 py-2 text-left text-xs transition ${
                              active
                                ? 'border-amber-500 bg-amber-500/15 text-amber-200 font-semibold'
                                : 'border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <span className="flex items-center gap-2.5 min-w-0">
                              <span
                                className="h-5 w-5 rounded border border-white/25 shrink-0 shadow-inner"
                                style={{ backgroundColor: m.baseHex }}
                              />
                              <span className="min-w-0">
                                <span className="block break-words leading-snug">{m.name}</span>
                                <span className="block text-[10px] text-slate-400 font-normal">
                                  {m.categoryLabel}
                                </span>
                              </span>
                            </span>
                            {active && (
                              <span className="shrink-0 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-300">
                                Seçili
                              </span>
                            )}
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* SEKME 2: KULP SEÇİMİ VE ÖZELLEŞTİRME */}
              {materialSubTab === 'handles' && (
                <div className="space-y-3 text-[11px]">
                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-2.5 space-y-2">
                    <div className="font-bold text-amber-300">
                      1. Genel Kapak Kulpu (`Kapaklarla Birlikte Hareket Eder`)
                    </div>

                    <label className="block space-y-1">
                      <span className="text-slate-400">Kulp Modeli (6 Tip):</span>
                      <select
                        value={design.materials.doorHandleConfig?.styleId ?? 'barModern'}
                        onChange={(e) =>
                          setGlobalDoorHandle({ styleId: e.target.value as HandleStyleId })
                        }
                        className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white"
                      >
                        {Object.values(HANDLE_STYLE_CATALOG).map((h) => (
                          <option key={h.id} value={h.id}>
                            {h.name} — {h.shortDesc}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="grid grid-cols-2 gap-2">
                      <label className="space-y-1">
                        <span className="text-slate-400">Kulp Rengi / Bitişi:</span>
                        <select
                          value={design.materials.doorHandleConfig?.finishId ?? 'matteBlack'}
                          onChange={(e) =>
                            setGlobalDoorHandle({ finishId: e.target.value as HandleFinishId })
                          }
                          className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white"
                        >
                          {Object.values(HANDLE_FINISH_CATALOG).map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="space-y-1">
                        <span className="text-slate-400">Kulp Boyu (mm):</span>
                        <select
                          value={design.materials.doorHandleConfig?.lengthMm ?? 160}
                          onChange={(e) =>
                            setGlobalDoorHandle({ lengthMm: Number(e.target.value) })
                          }
                          className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-xs text-white"
                        >
                          <option value={96}>96 mm (Kısa)</option>
                          <option value={160}>160 mm (Standart)</option>
                          <option value={220}>220 mm (Modern Bar)</option>
                          <option value={320}>320 mm (Uzun Bar)</option>
                          <option value={600}>600 mm (Mimari Boy)</option>
                          <option value={1100}>1100 mm (Tam Boy Dikey)</option>
                        </select>
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <label className="space-y-1">
                        <span className="text-slate-400">Dikey Konum:</span>
                        <select
                          value={design.materials.doorHandleConfig?.placement ?? 'middle'}
                          onChange={(e) =>
                            setGlobalDoorHandle({
                              placement: e.target.value as
                                | 'middle'
                                | 'top'
                                | 'bottom'
                                | 'verticalEdge',
                            })
                          }
                          className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white"
                        >
                          <option value="middle">Kapak Ortasında (Ergonomik)</option>
                          <option value="top">Üst Hizada</option>
                          <option value="bottom">Alt Hizada</option>
                          <option value="verticalEdge">Tam Boy Dikey Kenar</option>
                        </select>
                      </label>

                      <label className="space-y-1">
                        <span className="text-slate-400">Kulp Yönü:</span>
                        <select
                          value={design.materials.doorHandleConfig?.orientation ?? 'vertical'}
                          onChange={(e) =>
                            setGlobalDoorHandle({
                              orientation: e.target.value as 'vertical' | 'horizontal',
                            })
                          }
                          className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white"
                        >
                          <option value="vertical">Dikey</option>
                          <option value="horizontal">Yatay</option>
                        </select>
                      </label>
                    </div>
                  </div>

                  {/* Çekmece Kulpu */}
                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-2.5 space-y-2">
                    <div className="font-bold text-sky-300">
                      2. Genel Çekmece Kulpu (`Çekmeceyle Birlikte Kayar`)
                    </div>

                    <label className="block space-y-1">
                      <span className="text-slate-400">Çekmece Kulp Modeli:</span>
                      <select
                        value={design.materials.drawerHandleConfig?.styleId ?? 'barModern'}
                        onChange={(e) =>
                          setGlobalDrawerHandle({ styleId: e.target.value as HandleStyleId })
                        }
                        className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white"
                      >
                        {Object.values(HANDLE_STYLE_CATALOG).map((h) => (
                          <option key={h.id} value={h.id}>
                            {h.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="grid grid-cols-3 gap-1.5">
                      <label className="space-y-1">
                        <span className="text-slate-400">Renk:</span>
                        <select
                          value={design.materials.drawerHandleConfig?.finishId ?? 'matteBlack'}
                          onChange={(e) =>
                            setGlobalDrawerHandle({ finishId: e.target.value as HandleFinishId })
                          }
                          className="w-full rounded border border-slate-700 bg-slate-900 px-1.5 py-1 text-[10px] text-white"
                        >
                          {Object.values(HANDLE_FINISH_CATALOG).map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="space-y-1">
                        <span className="text-slate-400">Konum:</span>
                        <select
                          value={design.materials.drawerHandleConfig?.placement ?? 'middle'}
                          onChange={(e) =>
                            setGlobalDrawerHandle({
                              placement: e.target.value as
                                | 'middle'
                                | 'top'
                                | 'bottom'
                                | 'verticalEdge',
                            })
                          }
                          className="w-full rounded border border-slate-700 bg-slate-900 px-1.5 py-1 text-[10px] text-white"
                        >
                          <option value="middle">Orta Hiza</option>
                          <option value="top">Üst Kenar</option>
                          <option value="bottom">Alt Kenar</option>
                        </select>
                      </label>

                      <label className="space-y-1">
                        <span className="text-slate-400">Boy (mm):</span>
                        <select
                          value={design.materials.drawerHandleConfig?.lengthMm ?? 160}
                          onChange={(e) =>
                            setGlobalDrawerHandle({ lengthMm: Number(e.target.value) })
                          }
                          className="w-full rounded border border-slate-700 bg-slate-900 px-1.5 py-1 font-mono text-[10px] text-white"
                        >
                          <option value={96}>96 mm</option>
                          <option value={160}>160 mm</option>
                          <option value={220}>220 mm</option>
                          <option value={320}>320 mm</option>
                        </select>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* SEKME 3: MODERN GÖMME GARDIROP, TAÇ, YAN KLAPA VE BAZA/AYAK SİSTEMİ */}
              {materialSubTab === 'exterior' && (
                <div className="space-y-3 text-[11px]">
                  <div className="space-y-1 rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-slate-300">
                    <p className="font-semibold text-sky-200">Tavan ve montaj payı</p>
                    <p>Oda {design.roomHeightMm} mm · gerekli pay {design.ceilingClearanceMm ?? 0} mm</p>
                    {design.runs.map(run => <p key={run.id}>{run.wallAxis} · dış yükseklik {run.heightMm} mm · kalan {design.roomHeightMm - run.heightMm} mm<br/>
                      Baza {run.plinthHeightMm} · üst dolgu {run.topFillerHeightMm} · yan klapalar {run.startFillerMm} / {run.endFillerMm} mm</p>)}
                  </div>
                  {/* Hızlı Hazır Görünüm Kartları */}
                  <div className="rounded-lg border border-emerald-500/40 bg-slate-950 p-2.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-300">
                        Hızlı Dış Görünüm Ön Ayarları
                      </span>
                      <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-200">
                        Yapısal Paneller Korunur
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-1.5">
                      <button
                        type="button"
                        onClick={() => applyExteriorFinishPreset('builtInMinimal')}
                        className={`rounded-lg border px-2.5 py-2 text-left transition ${
                          design.exteriorFinish?.presetId === 'builtInMinimal'
                            ? 'border-emerald-400 bg-emerald-500/20 text-emerald-100 font-semibold'
                            : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>Düz Gömme / Minimal Bitiş (Önerilen)</span>
                          <span className="text-[10px] text-emerald-300">Modern Niş</span>
                        </div>
                        <p className="mt-0.5 text-[10px] font-normal text-slate-400">
                          Klasik üst/yan taçları kaldırır; tavana sıfır düz gömme, sıfır yan dikme
                          ve 40 mm gizli baza uygular.
                        </p>
                      </button>

                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => applyExteriorFinishPreset('freestandingModern')}
                          className={`rounded border px-2 py-1.5 text-left ${
                            design.exteriorFinish?.presetId === 'freestandingModern'
                              ? 'border-sky-400 bg-sky-500/20 text-sky-200 font-semibold'
                              : 'border-slate-800 bg-slate-900 text-slate-300'
                          }`}
                        >
                          <div>Modern Bağımsız</div>
                          <div className="text-[9px] text-slate-400">Açık Üst + Ayarlı Ayak</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => applyExteriorFinishPreset('classicTrimmed')}
                          className={`rounded border px-2 py-1.5 text-left ${
                            design.exteriorFinish?.presetId === 'classicTrimmed'
                              ? 'border-amber-400 bg-amber-500/20 text-amber-200 font-semibold'
                              : 'border-slate-800 bg-slate-900 text-slate-300'
                          }`}
                        >
                          <div>Klasik Çerçeveli</div>
                          <div className="text-[9px] text-slate-400">Çıkıntılı Taç + Yan Pervaz</div>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Ayrıntılı Dış Bitiş Seçenekleri */}
                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-2.5 space-y-2.5">
                    <label className="block space-y-1">
                      <span className="text-slate-400 font-medium">1. Üst Bitiş Stili:</span>
                      <select
                        value={design.exteriorFinish?.topStyle ?? 'flatFiller'}
                        onChange={(e) =>
                          setExteriorFinish({ topStyle: e.target.value as TopFinishStyle })
                        }
                        className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white"
                      >
                        <option value="flushCeiling">Tavana Sıfır Düz Gömme</option>
                        <option value="flatFiller">Düz Üst Dolgu Klapası (20–100 mm)</option>
                        <option value="classicCrown">Klasik Dekoratif Üst Taç</option>
                        <option value="none">Üst Bitiş Yok (Açık Üst)</option>
                      </select>
                    </label>

                    <label className="block space-y-1">
                      <span className="text-slate-400 font-medium">2. Alt Baza / Ayak Stili:</span>
                      <select
                        value={design.exteriorFinish?.baseStyle ?? 'lowMinimalPlinth'}
                        onChange={(e) => {
                          const nextBase = e.target.value as BaseFinishStyle;
                          setExteriorFinish({ baseStyle: nextBase });
                        }}
                        className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white"
                      >
                        <option value="lowMinimalPlinth">Alçak Düz Baza (40–60 mm)</option>
                        <option value="recessedHiddenPlinth">Geri Çekilmiş Gizli Baza</option>
                        <option value="highClassicPlinth">Klasik Yüksek Baza (80–100 mm)</option>
                        <option value="adjustableFeet">Ayarlanabilir Gizli Ayak / Sıfır Baza</option>
                      </select>
                    </label>

                    <div className="grid grid-cols-2 gap-2">
                      <label className="space-y-1">
                        <span className="text-slate-400">Sol Yan Bitiş:</span>
                        <select
                          value={design.exteriorFinish?.leftSideStyle ?? 'flushClean'}
                          onChange={(e) =>
                            setExteriorFinish({ leftSideStyle: e.target.value as SideFinishStyle })
                          }
                          className="w-full rounded border border-slate-700 bg-slate-900 px-1.5 py-1 text-[10px] text-white"
                        >
                          <option value="flushClean">Sıfır Düz Yan Panel</option>
                          <option value="thinWallFiller">İnce Duvar Klapası</option>
                          <option value="decorativeSideTrim">Dekoratif Yan Pervaz</option>
                          <option value="wallRevealPanel">Duvar Nişi Gömme Yan</option>
                        </select>
                      </label>

                      <label className="space-y-1">
                        <span className="text-slate-400">Sağ Yan Bitiş:</span>
                        <select
                          value={design.exteriorFinish?.rightSideStyle ?? 'flushClean'}
                          onChange={(e) =>
                            setExteriorFinish({
                              rightSideStyle: e.target.value as SideFinishStyle,
                            })
                          }
                          className="w-full rounded border border-slate-700 bg-slate-900 px-1.5 py-1 text-[10px] text-white"
                        >
                          <option value="flushClean">Sıfır Düz Yan Panel</option>
                          <option value="thinWallFiller">İnce Duvar Klapası</option>
                          <option value="decorativeSideTrim">Dekoratif Yan Pervaz</option>
                          <option value="wallRevealPanel">Duvar Nişi Gömme Yan</option>
                        </select>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* SEKME 4: İÇ LED AYDINLATMA VE SUNUM MODU */}
              {materialSubTab === 'led-studio' && (
                <div className="space-y-3 text-[11px]">
                  {/* Düzenleme Modu vs Sunum Modu */}
                  <div className="rounded-lg border border-amber-500/40 bg-slate-950 p-2.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-300">
                        1. Görsel Kalite & Sunum Modu
                      </span>
                      <span className="text-[10px] text-slate-400">Stüdyo IBL + Gölge</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setRenderQualityMode('edit')}
                        className={`rounded border px-2.5 py-1.5 font-semibold transition ${
                          renderQualityMode === 'edit'
                            ? 'border-sky-400 bg-sky-500/20 text-sky-200'
                            : 'border-slate-800 bg-slate-900 text-slate-400'
                        }`}
                      >
                        Düzenleme Modu
                      </button>
                      <button
                        type="button"
                        onClick={() => setRenderQualityMode('presentation')}
                        className={`rounded border px-2.5 py-1.5 font-semibold transition ${
                          renderQualityMode === 'presentation'
                            ? 'border-amber-400 bg-amber-500 text-slate-950'
                            : 'border-slate-800 bg-slate-900 text-slate-300'
                        }`}
                      >
                        Sunum Modu (Stüdyo)
                      </button>
                    </div>
                  </div>

                  {/* İç LED Aydınlatma Ayarları */}
                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-2.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-300">
                        2. İç LED Şerit Aydınlatma ({resolved.ledStrips.length} Şerit)
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setLedLighting({
                            enabled: !(design.ledLighting?.enabled ?? true),
                          })
                        }
                        className={`rounded border px-2 py-0.5 text-[10px] font-bold ${
                          (design.ledLighting?.enabled ?? true)
                            ? 'border-amber-400 bg-amber-500/25 text-amber-200'
                            : 'border-slate-700 bg-slate-900 text-slate-400'
                        }`}
                      >
                        {(design.ledLighting?.enabled ?? true) ? 'LED Açık' : 'LED Kapalı'}
                      </button>
                    </div>

                    <label className="block space-y-1">
                      <span className="text-slate-400">Işık Renk Sıcaklığı (Kelvin):</span>
                      <select
                        value={design.ledLighting?.colorTempId ?? 'warm3000K'}
                        onChange={(e) =>
                          setLedLighting({ colorTempId: e.target.value as LedColorTempId })
                        }
                        className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white"
                      >
                        {Object.values(LED_COLOR_TEMP_CATALOG)
                          .filter((m) => m.id !== 'natural3000K')
                          .map((meta) => (
                            <option key={meta.id} value={meta.id}>
                              {meta.kelvinLabel} — {meta.name}
                            </option>
                          ))}
                      </select>
                    </label>

                    <label className="block space-y-1">
                      <div className="flex justify-between text-slate-400">
                        <span>Işık Şiddeti (Parlaklık):</span>
                        <span className="font-mono text-amber-300">
                          %{Math.round((design.ledLighting?.intensity ?? 0.85) * 100)}
                        </span>
                      </div>
                      <input
                        type="range"
                        onPointerDown={() => useWardrobeStore.getState().beginHistoryTransaction()}
                        onPointerUp={() => useWardrobeStore.getState().endHistoryTransaction()}
                        onPointerCancel={() => useWardrobeStore.getState().endHistoryTransaction()}
                        onLostPointerCapture={() => useWardrobeStore.getState().endHistoryTransaction()}
                        onKeyDown={() => useWardrobeStore.getState().beginHistoryTransaction()}
                        onKeyUp={() => useWardrobeStore.getState().endHistoryTransaction()}
                        onBlur={() => useWardrobeStore.getState().endHistoryTransaction()}
                        min={0.15}
                        max={1}
                        step={0.05}
                        value={design.ledLighting?.intensity ?? 0.85}
                        onChange={(e) => setLedLighting({ intensity: Number(e.target.value) })}
                        className="w-full accent-amber-400"
                      />
                    </label>

                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Aktif LED Konumları
                      </span>
                      {(
                        [
                          {
                            key: 'shelfUnder',
                            label: 'Raf Altı LED Şerit (Ön Kenardan 28mm İçeride)',
                            defaultVal: true,
                          },
                          {
                            key: 'verticalSides',
                            label: 'Dikey Yan Panel İç LED Şerit',
                            defaultVal: false,
                          },
                          {
                            key: 'hangingRod',
                            label: 'Askı Borusu Üstü LED Aydınlatma',
                            defaultVal: true,
                          },
                          {
                            key: 'openBays',
                            label: 'Açık Bölme / Vitrin LED Aydınlatması',
                            defaultVal: true,
                          },
                          {
                            key: 'cornerModule',
                            label: 'Beşgen Köşe Modülü İç Aydınlatması',
                            defaultVal: true,
                          },
                          {
                            key: 'onlyWhenOpenOrGlass',
                            label: 'Opak Kapak Kapalıyken Işık Sızmasını Önle',
                            defaultVal: true,
                          },
                        ] as const
                      ).map((item) => {
                        const checked = design.ledLighting?.[item.key] ?? item.defaultVal;
                        return (
                          <label
                            key={item.key}
                            className="flex items-center justify-between gap-2 rounded border border-slate-800/80 bg-slate-900/60 px-2 py-1 cursor-pointer"
                          >
                            <span className="text-slate-300">{item.label}</span>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => setLedLighting({ [item.key]: e.target.checked })}
                              className="rounded border-slate-600 accent-amber-500"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* SEKME 5: GERÇEK ÖLÇÜLÜ 3D KIYAFET VE EŞYA KÜTÜPHANESİ */}
              {materialSubTab === 'items' && (
                <div className="space-y-3 text-[11px]">
                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-2.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-300">
                        Gerçek Ölçülü 3D Kıyafet & Eşyalar
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setInteriorItemsConfig({
                            enabled: !(design.interiorItems?.enabled ?? true),
                          })
                        }
                        className={`rounded border px-2 py-0.5 text-[10px] font-bold ${
                          (design.interiorItems?.enabled ?? true)
                            ? 'border-emerald-400 bg-emerald-500/25 text-emerald-200'
                            : 'border-slate-700 bg-slate-900 text-slate-400'
                        }`}
                      >
                        {(design.interiorItems?.enabled ?? true) ? 'Eşyalar Açık' : 'Gizli'}
                      </button>
                    </div>

                    <div className="space-y-1">
                      <span className="text-slate-400">Doluluk / Yoğunluk Seviyesi:</span>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(
                          [
                            { id: 'low', label: 'Az Dolu' },
                            { id: 'medium', label: 'Orta (Önerilen)' },
                            { id: 'full', label: 'Tam Dolu' },
                          ] as const
                        ).map((d) => (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => setInteriorItemsConfig({ density: d.id })}
                            className={`rounded border py-1 text-[10px] font-semibold ${
                              (design.interiorItems?.density ?? 'medium') === d.id
                                ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200'
                                : 'border-slate-800 bg-slate-900 text-slate-400'
                            }`}
                          >
                            {d.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Kategori Görünürlük Filtreleri
                      </span>
                      {(
                        [
                          {
                            key: 'showHangingClothes',
                            label: 'Askıdaki Kıyafetler (Gömlek, Ceket, Pantolon, Uzun Elbise)',
                          },
                          {
                            key: 'showFoldedClothes',
                            label: 'Katlı Kıyafet İstifleri (Kazak, Tişört, Triko)',
                          },
                          {
                            key: 'showShoesAndBags',
                            label: 'Ayakkabı Çiftleri, Botlar ve Çantalar',
                          },
                          {
                            key: 'showStorageBoxesAndLuggage',
                            label: 'Saklama Kutuları, Yorgan Hurçları ve Valizler',
                          },
                          {
                            key: 'showServiceItems',
                            label: '3D Ev & Temizlik Ekipmanları (Merdiven, Ütü Masası, Süpürge)',
                          },
                        ] as const
                      ).map((cat) => {
                        const checked = design.interiorItems?.[cat.key] ?? true;
                        return (
                          <label
                            key={cat.key}
                            className="flex items-center justify-between gap-2 rounded border border-slate-800/80 bg-slate-900/60 px-2 py-1.5 cursor-pointer"
                          >
                            <span className="text-slate-300 leading-tight">{cat.label}</span>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) =>
                                setInteriorItemsConfig({ [cat.key]: e.target.checked })
                              }
                              className="rounded border-slate-600 accent-emerald-500 shrink-0"
                            />
                          </label>
                        );
                      })}
                    </div>

                    <p className="text-[10px] text-slate-400 leading-relaxed pt-1">
                      İpucu: 3D sahnede herhangi bir iç bölmeye tıkladığınızda açılan bağlamsal
                      panelden o bölmeye özel 3D eşya tipini (Gömlek, Uzun Elbise, Katlı Kazak,
                      Kutu, Valiz vb.) tekil olarak da değiştirebilirsiniz.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5. BÖLMELER (BAYS) LİSTESİ (Adım 1 ve Adım 2'de gösterilir) */}
          {activeStep !== 'view-export' && (
            <div className="p-3.5 space-y-2">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Bölmeler ve genişlikler
              </h2>
              <div className="space-y-1.5">
                {resolved.bays.map((bay) => {
                  const isSelected = bay.id === selectedBayId;
                  const ownerMeta = OWNER_LABELS[bay.owner];
                  const runOfBay = design.runs.find((r) => r.id === bay.runId);
                  const canDelete = (runOfBay?.bays.length ?? 1) > 1;

                  return (
                    <div
                      key={bay.id}
                      onClick={() => selectBay(bay.id)}
                      className={`cursor-pointer rounded-lg border p-2.5 text-xs transition ${
                        isSelected
                          ? 'border-sky-500 bg-sky-500/10'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-white truncate">{bay.label}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          <span
                            className={`rounded border px-1.5 py-0.5 text-[9px] font-semibold ${ownerMeta.badgeClass}`}
                          >
                            {ownerMeta.label}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleBayLock(bay.runId, bay.id);
                            }}
                            className={`rounded p-1 ${
                              bay.locked
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'text-slate-500 hover:text-slate-300'
                            }`}
                            title={bay.locked ? 'Ölçü Kilitli' : 'Ölçü Kilidini Aç/Kapat'}
                          >
                            {bay.locked ? (
                              <Lock className="h-3.5 w-3.5" />
                            ) : (
                              <Unlock className="h-3.5 w-3.5" />
                            )}
                          </button>
                          {canDelete && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeBay(bay.runId, bay.id);
                              }}
                              className="rounded p-1 text-slate-500 hover:bg-rose-500/20 hover:text-rose-300"
                              title="Bu Bölmeyi Sil"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="mt-1 flex items-center justify-between font-mono text-[11px]">
                        <span className="text-slate-400">
                          Dış: <strong className="text-slate-200">{bay.outerWidthMm}mm</strong>
                        </span>
                        <span className="text-sky-300">
                          Net İç: <strong>{bay.netInnerWidthMm}mm</strong>
                        </span>
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300">
                          {bay.sizeSpec.kind === 'fixed'
                            ? 'Sabit'
                            : `Esnek (${bay.sizeSpec.weight}x)`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </aside>

        {/* MERKEZ 3D / 2D SAHNE */}
        <main className="relative min-w-0 flex-1 overflow-hidden">
          <WardrobeCanvas />
        </main>

        {/* SAĞ PANEL: BÖLME GENEL BAKIŞI, HÜCRE & ÇEKMECE GEZGİNİ, DOĞRULAMA VE KAPASİTE ÖZETİ */}
        <aside id="studio-selection" aria-label="Seçim ve uyarılar" className={`studio-selection ${compactPanel === 'selection' ? 'absolute inset-y-0 right-0 z-60 flex' : 'hidden'} w-96 max-w-full shrink-0 flex-col overflow-y-auto border-l border-slate-800 bg-slate-900 xl:static xl:flex`}>
          <button type="button" className="m-2 self-start rounded border border-slate-700 px-2 py-1 text-xs xl:hidden" onClick={() => setCompactPanel(null)}>Seçim panelini kapat</button>
          {activeStep === 'view-export' && <button type="button" aria-expanded={materialInspector}
            className="m-3 rounded-lg border border-slate-700 p-2 text-left text-xs text-sky-200"
            onClick={() => setMaterialInspector(!materialInspector)}>{materialInspector ? 'Seçim denetçisini daralt' : 'Seçim denetçisini aç'}</button>}
          {showInspector && <>
          {/* 1. SEÇİLİ BÖLME (BAY) VE BAĞIMSIZ KAPAK (FRONT) ÖZETİ */}
          {selectedBay && (
            <div className="border-b border-slate-800 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <h2 className="text-[11px] font-bold uppercase tracking-wider text-sky-400">
                  1. Seçili Bölme & Kapak (`Front`)
                </h2>
                <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-slate-300">
                  {selectedBay.outerWidthMm} mm (İç: {selectedBay.netInnerWidthMm} mm)
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-semibold text-white truncate">{selectedBay.label}</div>
                <div className="flex gap-1">
                  {(['anne', 'baba', 'ortak'] as OwnerType[]).map((own) => (
                    <button
                      key={own}
                      onClick={() => setBayOwner(selectedBay.runId, selectedBay.id, own)}
                      className={`rounded border px-2 py-0.5 text-[10px] font-semibold transition ${
                        selectedBay.owner === own
                          ? OWNER_LABELS[own].badgeClass
                          : 'border-slate-800 bg-slate-950 text-slate-400'
                      }`}
                    >
                      {OWNER_LABELS[own].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bölme Genişliği: Sabit / Esnek */}
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <button
                  onClick={() =>
                    setBaySize(selectedBay.runId, selectedBay.id, {
                      kind: 'fixed',
                      mm: selectedBay.outerWidthMm,
                    })
                  }
                  className={`rounded border px-2 py-1 font-medium ${
                    selectedBay.sizeSpec.kind === 'fixed'
                      ? 'border-sky-500 bg-sky-500/20 text-sky-200'
                      : 'border-slate-800 bg-slate-950 text-slate-400'
                  }`}
                >
                  Sabit Genişlik (mm)
                </button>
                <button
                  onClick={() =>
                    setBaySize(selectedBay.runId, selectedBay.id, {
                      kind: 'flex',
                      weight: 1,
                    })
                  }
                  className={`rounded border px-2 py-1 font-medium ${
                    selectedBay.sizeSpec.kind === 'flex'
                      ? 'border-sky-500 bg-sky-500/20 text-sky-200'
                      : 'border-slate-800 bg-slate-950 text-slate-400'
                  }`}
                >
                  Esnek (Flex Paylaşım)
                </button>
              </div>

              {selectedBay.sizeSpec.kind === 'fixed' && (
                <NumberField label="Sabit Dış Genişlik (mm)" value={selectedBay.outerWidthMm} min={220}
                  max={design.runs.find(run => run.id === selectedBay.runId)?.lengthMm ?? 6000} step={10}
                  onCommit={mm => setBaySize(selectedBay.runId, selectedBay.id, { kind: 'fixed', mm })} />
              )}

              {/* Kapak Hızlı Ayarı & Kapak Editörü Kısayolu */}
              <div className="rounded-lg border border-slate-800 bg-slate-950/90 p-2.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Kapak Düzeni & Menteşe
                  </span>
                  <button
                    type="button"
                    onClick={() => setDoorEditorMode(!doorEditorMode)}
                    className={`rounded border px-2 py-0.5 text-[10px] font-semibold ${
                      doorEditorMode
                        ? 'border-amber-400 bg-amber-500 text-slate-950'
                        : 'border-amber-500/40 bg-amber-500/15 text-amber-200 hover:bg-amber-500/25'
                    }`}
                  >
                    {doorEditorMode ? 'Kapak Editörü Açık' : 'Kapak Editöründe Düzenle'}
                  </button>
                </div>

                {hasExplicitFront&&<p className="text-[11px] text-sky-200">Bağımsız kapak aralıkları kullanılıyor. Tür, yükseklik, kapsam ve ray ayarlarını “2. İç & Kapak” adımındaki Kapak Sistemleri panelinden düzenleyin.</p>}
                <div className={hasExplicitFront?'hidden':'grid grid-cols-2 gap-2 text-[11px]'}>
                  <select
                    value={selectedBay.frontMode}
                    onChange={(e) =>
                      setBayFrontConfig(
                        selectedBay.runId,
                        selectedBay.id,
                        e.target.value as BayFrontMode,
                        selectedBay.hingeAngleDeg
                      )
                    }
                    className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white"
                  >
                    <option value="auto">Otomatik kanat</option>
                    <option value="singleLeft">Tek Kapak — Sol Menteşe</option>
                    <option value="singleRight">Tek Kapak — Sağ Menteşe</option>
                    <option value="double">Çift Kapak (Sol + Sağ)</option>
                    <option value="open">Açık (Kapaksız Gövde)</option>
                  </select>

                  <select
                    value={selectedBay.hingeAngleDeg}
                    disabled={selectedBay.frontMode === 'open'}
                    onChange={(e) =>
                      setBayFrontConfig(
                        selectedBay.runId,
                        selectedBay.id,
                        selectedBay.frontMode,
                        Number(e.target.value) as 110 | 155 | 165
                      )
                    }
                    className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white disabled:opacity-40"
                  >
                    <option value={110}>110° Standart</option>
                    <option value={155}>155° Sıfır Çıkıntılı</option>
                    <option value={165}>165° Geniş Açılı</option>
                  </select>
                </div>

                {shouldExplainExternalDrawers(selectedBay, bayDoors, bayDrawers, hasExplicitFront) && (
                  <p role="status" className="text-[11px] text-amber-200">
                    Dış çekmeceler bu bölmenin ön yüzünü dolduruyor. Bu düzende menteşeli kanat oluşmadı.
                  </p>
                )}

                {bayDoors.length > 0 && (
                  <div className="grid grid-cols-1 gap-1 pt-0.5">
                    {bayDoors.map((d) => {
                      const isOpen = Boolean(openDoorIds[d.id]);
                      return (
                        <button
                          key={d.id}
                          onClick={() => toggleDoor(d.id)}
                          className={`flex items-center justify-between rounded border px-2 py-1 text-[11px] font-medium transition ${
                            isOpen
                              ? 'border-amber-500/60 bg-amber-500/20 text-amber-200'
                              : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <span className="truncate">
                            {d.label} ({d.widthMm}×{d.heightMm}mm)
                          </span>
                          <span className="ml-2 shrink-0 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
                            {isOpen ? 'Kapat' : 'Aç'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. BÖLME İÇİNDEKİ HÜCRELER, ÇEKMECELER VE BEŞGEN KÖŞE GEZGİNİ */}
          <div className="border-b border-slate-800 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                2. İç Bölmeler & Çekmeceler Gezgini
              </h2>
              {selectedCell && (
                <span className="font-mono text-[10px] text-sky-300">
                  Net: {selectedCell.netWidthMm}×{selectedCell.netHeightMm}×
                  {selectedCell.netDepthMm} mm
                </span>
              )}
            </div>

            <p className="text-[10px] text-slate-400 leading-snug">
              Bir bölme veya çekmece seçtiğinizde günlük düzenleme kontrolleri doğrudan 3D sahnede
              seçimin yanında açılır.
            </p>

            {/* Seçili bölmedeki görünür iç hacimlerin hızlı seçim listesi */}
            {selectedBay && (
              <div className="space-y-1 max-h-52 overflow-y-auto pr-0.5">
                {resolved.cells
                  .filter((c) => c.bayId === selectedBay.id)
                  .map((cell) => {
                    const isPrimarySelected = cell.id === selectedCell?.id;
                    const isInMultiSelection = selectedCellIds.includes(cell.id);
                    const modMeta = cell.insert ? INSERT_REGISTRY[cell.insert.type] : null;
                    return (
                      <button
                        key={cell.id}
                        onClick={(e) => {
                          if (e.ctrlKey || e.metaKey || e.shiftKey) {
                            const exists = selectedCellIds.includes(cell.id);
                            const nextIds = exists
                              ? selectedCellIds.filter((id) => id !== cell.id)
                              : [...selectedCellIds, cell.id];
                            setSelectedCells(nextIds, cell.bayId);
                          } else {
                            selectCell(cell.id, cell.bayId);
                          }
                        }}
                        className={`w-full rounded border px-2.5 py-1.5 text-left text-[11px] transition flex items-center justify-between ${
                          isPrimarySelected
                            ? 'border-amber-500 bg-amber-500/15 text-amber-200 font-semibold'
                            : isInMultiSelection
                              ? 'border-sky-500/80 bg-sky-500/15 text-sky-200 font-semibold'
                              : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <span>{cell.label}</span>
                          {modMeta && (
                            <span className="ml-1.5 rounded bg-slate-800/90 px-1.5 py-0.5 text-[9px] text-slate-300">
                              {modMeta.shortTitle}
                            </span>
                          )}
                        </div>
                        <span className="shrink-0 font-mono text-[10px] text-sky-300">
                          {cell.netWidthMm}×{cell.netHeightMm}
                        </span>
                      </button>
                    );
                  })}
              </div>
            )}

            {/* Seçili Bölmedeki Bağımsız Çekmeceler Listesi (Tek Tıkla Seç veya Aç/Kapat) */}
            {bayDrawers.length > 0 && (
              <div className="space-y-1 pt-1">
                {selectedCell?.insert?.type === 'drawerBank' && (
                  <NumberField
                    key={selectedCell.id}
                    label="Çekmece adedi"
                    value={selectedCell.insert.drawerCount ?? 3}
                    min={1}
                    max={8}
                    onCommit={drawerCount => setCellInsert(selectedCell.sourceLeafId ?? selectedCell.id, {
                      ...selectedCell.insert!,
                      drawerCount,
                      drawerFrontHeightsMm: undefined,
                    })}
                  />
                )}
                <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-300/90">
                  Bölmedeki Bağımsız Çekmeceler (`Seç & Düzenle` veya `Aç/Kapat`)
                </div>
                <div className="grid grid-cols-1 gap-1 max-h-40 overflow-y-auto pr-0.5">
                  {bayDrawers.map((drw) => {
                    const isDrwSelected =
                      selectedDrawerIds.includes(drw.id) || selectedDrawerId === drw.id;
                    const isOpen = Boolean(openDrawerIds[drw.id]);
                    return (
                      <div
                        key={drw.id}
                        className={`flex items-center justify-between rounded border px-2 py-1 text-[11px] ${
                          isDrwSelected
                            ? 'border-amber-400 bg-amber-500/20 text-amber-100 font-semibold'
                            : 'border-slate-800 bg-slate-950/70 text-slate-300'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={(e) =>
                            selectDrawer(
                              drw.id,
                              drw.cellId,
                              drw.bayId,
                              Boolean(e.shiftKey || e.ctrlKey || e.metaKey)
                            )
                          }
                          className="flex-1 text-left truncate pr-2 hover:text-amber-300"
                        >
                          Çekmece #{drw.drawerIndex + 1} ({drw.widthMm}×{drw.heightMm} mm)
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleDrawer(drw.id)}
                          className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300 hover:bg-slate-700"
                        >
                          {isOpen ? 'Kapat' : 'Aç'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Beşgen Köşe görünür raf aralıkları listesi */}
            {design.layoutKind === 'l-shape' &&
              activeJunction?.type === 'diagonal' &&
              resolved.cells.some((c) => c.subIntervalKind === 'cornerInterval') && (
                <div className="space-y-1 pt-1">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-300/90">
                    Beşgen Köşe Raf Aralıkları (`Y` Boyutlandırılabilir)
                  </div>
                  <label className="flex items-center gap-2 text-xs text-slate-200">
                    <input type="checkbox" checked={activeJunction.hasHangingRod}
                      onChange={(e) => setCornerHangingRod(activeJunction.id, e.target.checked)} />
                    Köşe askı borusu · en yüksek raf aralığı
                  </label>
                  <div className="space-y-1 max-h-36 overflow-y-auto pr-0.5">
                    {resolved.cells
                      .filter((c) => c.subIntervalKind === 'cornerInterval')
                      .map((cornerCell) => {
                        const active = cornerCell.id === selectedCell?.id;
                        return (
                          <button
                            key={cornerCell.id}
                            onClick={() => selectCell(cornerCell.id, cornerCell.bayId)}
                            className={`w-full rounded border px-2.5 py-1 text-left text-[11px] transition flex items-center justify-between ${
                              active
                                ? 'border-amber-500 bg-amber-500/15 text-amber-200 font-semibold'
                                : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <span className="truncate pr-2">{cornerCell.label}</span>
                            <span className="shrink-0 font-mono text-[10px] text-sky-300">
                              {cornerCell.netWidthMm}×{cornerCell.netHeightMm}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}

            {/* KATLANABİLİR GELİŞMİŞ HÜCRE & SERVİS NİŞİ DENETÇİSİ (Gereksiz Tekrarı Önler) */}
            {selectedCell && selectedCell.subIntervalKind !== 'cornerInterval' && (
              <div className="rounded-lg border border-slate-800 bg-slate-950">
                <button
                  type="button"
                  onClick={() =>
                    setShowAdvancedRightInspector(!showAdvancedRightInspector)
                  }
                  className="flex w-full items-center justify-between px-2.5 py-2 text-[10px] font-bold uppercase tracking-wider text-emerald-400 hover:text-emerald-300"
                >
                  <span>
                    Gelişmiş Modül & Servis Nişi Ayarları ({selectedCell.label})
                  </span>
                  {showAdvancedRightInspector ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </button>

                {(showAdvancedRightInspector ||
                  selectedCell.insert?.type === 'serviceNiche') && (
                  <div className="space-y-2.5 border-t border-slate-800 p-2.5 text-[11px]">
                    <label className="block space-y-1">
                      <span className="text-slate-400">Hücre Modülü (`InsertRegistry`)</span>
                      <select
                        value={selectedCell.insert?.type ?? 'empty'}
                        onChange={(e) => {
                          const nextType = e.target.value as InsertType;
                          setCellInsert(
                            selectedCell.id,
                            INSERT_REGISTRY[nextType].createDefaultConfig(),
                            undefined,
                            undefined,
                            selectedCell.subIntervalIndex !== undefined
                          );
                        }}
                        className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs font-medium text-white"
                      >
                        {Object.values(INSERT_REGISTRY).map((meta) => (
                          <option key={meta.type} value={meta.type}>
                            {meta.shortTitle} — {meta.description}
                          </option>
                        ))}
                      </select>
                    </label>

                    {selectedCell.insert?.type === 'hangingRod' && !selectedCell.cornerJunctionId && (
                      <label className="block text-slate-300">
                        Askı yüksekliği profili
                        <select
                          className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-white"
                          value={selectedCell.insert.rodHeightType ?? (selectedCell.insert.itemPreset === 'longDresses' ? 'long' : 'short')}
                          onChange={(e) => setCellInsert(selectedCell.sourceLeafId ?? selectedCell.id, {
                            ...selectedCell.insert!,
                            rodHeightType: e.target.value as 'short' | 'medium' | 'long',
                          })}
                        >
                          <option value="short">Kısa · Gömlek / bluz</option>
                          <option value="medium">Orta · Ceket / takım</option>
                          <option value="long">Uzun · Elbise / palto</option>
                        </select>
                      </label>
                    )}

                    {/* Dar Dikey Servis Nişi Eşya Düzenleyicisi */}
                    {selectedCell.insert?.type === 'serviceNiche' && (
                      <div className="space-y-2 rounded border border-sky-500/30 bg-slate-900/60 p-2">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Hedef El Payı (mm):</span>
                          <input
                            type="number"
                            min={10}
                            max={100}
                            step={5}
                            value={selectedCell.insert.handClearanceMm ?? 30}
                            onChange={(e) =>
                              setCellInsert(selectedCell.id, {
                                ...selectedCell.insert!,
                                handClearanceMm: Math.max(0, Number(e.target.value) || 30),
                              })
                            }
                            className="w-20 rounded border border-slate-700 bg-slate-950 px-2 py-0.5 font-mono text-xs text-white"
                          />
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {STANDARD_SERVICE_ITEMS.map((presetItem) => {
                            const active = (selectedCell.insert?.serviceItems ?? []).some(
                              (it) => it.id === presetItem.id
                            );
                            return (
                              <button
                                key={presetItem.id}
                                onClick={() => toggleServiceItemInCell(presetItem)}
                                className={`rounded border px-2 py-1 text-[10px] font-medium transition ${
                                  active
                                    ? 'border-sky-500 bg-sky-500/20 text-sky-200'
                                    : 'border-slate-800 bg-slate-950 text-slate-400'
                                }`}
                              >
                                {active ? '✓ ' : '+ '}
                                {presetItem.name}
                              </button>
                            );
                          })}
                        </div>

                        {(selectedCell.insert.serviceItems ?? []).map((item) => {
                          const placement = resolveServiceItemPlacement(item);
                          return (
                            <div
                              key={item.id}
                              className="rounded border border-slate-800 bg-slate-950 p-2 space-y-1"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-sky-300">{item.name}</span>
                                <span className="font-mono text-[9px] text-emerald-300">
                                  Ön: {placement.frontWidthMm}mm · Derinlik: {placement.intoDepthMm}mm
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                                <label>
                                  <span className="text-slate-400">İnce Kenar</span>
                                  <input
                                    type="number"
                                    value={item.widthMm}
                                    onChange={(e) =>
                                      updateServiceItemDim(
                                        item.id,
                                        'widthMm',
                                        Number(e.target.value) || 90
                                      )
                                    }
                                    className="w-full rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 font-mono text-white"
                                  />
                                </label>
                                <label>
                                  <span className="text-slate-400">Yan Genişlik</span>
                                  <input
                                    type="number"
                                    value={item.depthMm}
                                    onChange={(e) =>
                                      updateServiceItemDim(
                                        item.id,
                                        'depthMm',
                                        Number(e.target.value) || 400
                                      )
                                    }
                                    className="w-full rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 font-mono text-white"
                                  />
                                </label>
                                <label>
                                  <span className="text-slate-400">Yük (mm)</span>
                                  <input
                                    type="number"
                                    value={item.heightMm}
                                    onChange={(e) =>
                                      updateServiceItemDim(
                                        item.id,
                                        'heightMm',
                                        Number(e.target.value) || 1200
                                      )
                                    }
                                    className="w-full rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 font-mono text-white"
                                  />
                                </label>
                                <label>
                                  <span className="text-slate-400">Kaldırma payı (mm)</span>
                                  <input
                                    type="number" min={0} max={500} value={item.liftClearanceMm ?? 0}
                                    onChange={(e) => updateServiceItemDim(item.id, 'liftClearanceMm', Number(e.target.value))}
                                    className="w-full rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 font-mono text-white"
                                  />
                                </label>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          </>}

          {/* 3. DOĞRULAMA UYARILARI VE ÖZET METRİKLER */}
          <div className="p-3.5 space-y-3">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              3. Doğrulama & Kapasite Özeti
            </h2>

            {resolved.issues.length === 0 ? (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Tüm ölçü, kalınlık, menteşe, kapak ve niş sığma kontrolleri uygun.</span>
              </div>
            ) : (
              <div className="space-y-1.5">
                {otherIssues.map((iss) => (
                  <div
                    key={iss.id}
                    className={`rounded-lg border p-2.5 text-[11px] space-y-1 ${
                      iss.severity === 'error'
                        ? 'border-rose-500/50 bg-rose-500/10 text-rose-200'
                        : 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-semibold">
                      <AlertTriangle className={`h-3.5 w-3.5 shrink-0 ${iss.severity === 'error' ? 'text-rose-400' : 'text-amber-400'}`} />
                      <span>{iss.title}</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{iss.description}</p>
                    <IssueDetails issue={iss} />
                  </div>
                ))}
                {wideSpans.length > 0 && <details className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-2.5 text-xs">
                  <summary className="cursor-pointer font-semibold text-amber-200">Geniş raf ve modül açıklıkları · {wideSpans.length}</summary>
                  {wideSpans.map(issue => <div key={issue.id} className="mt-2 border-t border-amber-900/70 pt-2">
                    <strong className="text-amber-200">{issue.title}</strong>
                    <p className="text-slate-300">{issue.description}</p><IssueDetails issue={issue} />
                  </div>)}
                </details>}
              </div>
            )}

            <div className="rounded-lg border border-slate-800 bg-slate-950 p-2.5 font-mono text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Ana / Arkalık Kalınlık:</span>
                <span className="font-bold text-sky-300">
                  {resolved.panelThicknessMm} mm / {resolved.backPanelThicknessMm} mm
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Üretim parçası (tam liste):</span>
                <span className="font-bold text-white">
                  {productionPartCount} parça
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Aktif Menteşeli Kapak:</span>
                <span className="text-amber-300">{resolved.doors.length} kanat</span>
              </div>
              <div className="flex justify-between"><span className="text-slate-400">Aktif Sürgülü Kapak:</span><span className="text-sky-300">{resolved.slidingDoors?.length??0} kanat</span></div>
              <div className="flex justify-between">
                <span className="text-slate-400">Kullanılabilir askı boyu</span>
                <span className="text-sky-300">{resolved.summary.totalHangingLengthMm} mm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Net depolama rafı ve tabanı</span>
                <span className="text-emerald-300">{resolved.summary.totalShelfAreaM2.toFixed(2)} m²</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Toplam Çekmece:</span>
                <span className="text-amber-300">{resolved.summary.totalDrawerCount} adet</span>
              </div>
            </div>

          </div>
        </aside>
      </div>

      {/* ALT DURUM ŞERİDİ */}
      <footer className="studio-footer flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-800 bg-slate-900 px-3 py-1.5 text-[11px] text-slate-400">
          <span>Manuel nokta · <strong className="text-slate-200">
            {persistenceStatus === 'error' ? 'son yazma başarısız' : persistenceStatus === 'saving' ? 'yazılıyor'
              : hasUnsavedChanges ? 'değişiklik var' : lastCheckpointAt ?? 'henüz yok'}
          </strong></span>
          <span>Otomatik kurtarma · <strong className={persistenceStatus === 'error' ? 'text-rose-300' : 'text-sky-300'}>
            {persistenceStatus === 'saved' && (lastSavedAt ?? 'yazıldı')}
            {persistenceStatus === 'restored' && 'geri yüklendi'}
            {persistenceStatus === 'idle' && 'henüz yazılmadı'}
            {persistenceStatus === 'saving' && 'yazılıyor'}
            {persistenceStatus === 'partial' && 'tek depo'}
            {persistenceStatus === 'error' && 'yazma başarısız'}
          </strong></span>
          {exportNotice && <span role="status" className="text-sky-200">{exportNotice}</span>}
          {recoveryJson && (
            <button type="button" className="text-amber-200 underline"
              title="Eski kayıt güncel tasarım kurallarına uymuyor. Orijinal veriyi kurtarma dosyası olarak alın."
              onClick={() => downloadFile('wardrobe-kurtarma.json', recoveryJson, 'application/json')}>
              Eski kaydı dışa aktar
            </button>
          )}
          <span className="ml-auto hidden font-mono sm:inline">Ana panel {resolved.panelThicknessMm} mm · Arkalık {resolved.backPanelThicknessMm} mm</span>
      </footer>
    </div>
  );
}
