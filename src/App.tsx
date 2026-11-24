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
import { NumberField } from './ui/NumberField';
import { CommandFeedback, IssueDetails, Phase4InteriorPanel, Phase4RoomPanel } from './ui/Phase4Panels';
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
    hasOpenSlidingLeaf,
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
  const toolsMenuRef = useRef<HTMLDivElement>(null);
  const historyButtonRef = useRef<HTMLButtonElement>(null);
  const historyMenuRef = useRef<HTMLDivElement>(null);
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

  const focusHistoryTrigger = () => {
    if (historyButtonRef.current && historyButtonRef.current.offsetParent !== null) {
      historyButtonRef.current.focus();
    } else if (toolsButtonRef.current && toolsButtonRef.current.offsetParent !== null) {
      toolsButtonRef.current.focus();
    }
  };

  useEffect(() => {
    void hydrateFromIndexedDB();
  }, [hydrateFromIndexedDB]);

  useEffect(() => {
    if (!introDestination || activeStep !== 'room-carcass') return;
    (introDestination === 'create' ? blankBuilderRef.current : examplesSummaryRef.current)?.focus();
    setIntroDestination(null);
  }, [activeStep, introDestination]);

  useEffect(() => {
    if (!showHistoryMenu && !showTools) return;
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (
        showHistoryMenu &&
        !historyMenuRef.current?.contains(target) &&
        !historyButtonRef.current?.contains(target)
      ) {
        setShowHistoryMenu(false);
      }
      if (
        showTools &&
        !toolsMenuRef.current?.contains(target) &&
        !toolsButtonRef.current?.contains(target)
      ) {
        setShowTools(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [showHistoryMenu, showTools]);

  const openIntroDestination = (destination: 'create' | 'examples') => {
    setFirstUseDismissed(true);
    setActiveStep('room-carcass');
    setCompactPanel('setup');
    setShowBlankBuilder(destination === 'create');
    if (destination === 'examples') setExamplesOpen(true);
    setIntroDestination(destination);
  };

  // Klavye kısayolları (Ctrl+Z / Ctrl+Y / Ctrl+S / Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showHistoryMenu) {
          setShowHistoryMenu(false);
          focusHistoryTrigger();
        }
        if (showTools) {
          setShowTools(false);
          if (toolsButtonRef.current && toolsButtonRef.current.offsetParent !== null) {
            toolsButtonRef.current.focus();
          }
        }
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
  }, [undo, redo, saveCheckpoint, showHistoryMenu, showTools]);

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
      <span className="block text-[11px] font-medium text-slate-300">{label}</span>
      <input type="number" min={min} max={max} step={step} value={blankMeasureDrafts[key]}
        aria-invalid={invalid || undefined} aria-describedby={invalid ? 'blank-measure-error' : undefined}
        onChange={e => { const draft = e.target.value; setBlankMeasureDrafts(previous => ({ ...previous, [key]: draft })); }}
        className="studio-input font-mono" />
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

  const anyDoorOpen =
    hasOpenSlidingLeaf ||
    [...resolved.doors, ...(resolved.slidingDoors ?? [])].some((d) => Boolean(openDoorIds[d.id]));
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
          <div className="studio-brand-mark flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/20 text-amber-400">
            <Box className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-wide text-white">WARDROBE STUDIO</h1>
            </div>
            <p className="truncate text-[11px] text-slate-300" title={design.name}>{design.name}</p>
          </div>
        </div>

        {/* GÖRÜNÜM MODU SEÇİCİ (3D / 2D Ortografik Cephe & Plan) */}
        <div role="group" aria-label="Görünüm" className="studio-views gap-0.5 rounded-lg border border-slate-800 bg-slate-950 p-0.5">
          <button
            ref={sceneViewButtonRef}
            type="button"
            aria-pressed={viewMode === '3d-perspective'}
            onClick={() => setViewMode('3d-perspective')}
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition ${
              viewMode === '3d-perspective'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Box className="h-3.5 w-3.5" aria-hidden="true" />
            3D Perspektif
          </button>
          <button
            type="button"
            aria-pressed={viewMode === '2d-front-A'}
            onClick={() => setViewMode('2d-front-A')}
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition ${
              viewMode === '2d-front-A'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Layers className="h-3.5 w-3.5" aria-hidden="true" />
            2D Cephe (A)
          </button>
          {design.layoutKind === 'l-shape' && (
            <button
              type="button"
              aria-pressed={viewMode === '2d-front-B'}
              onClick={() => setViewMode('2d-front-B')}
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition ${
                viewMode === '2d-front-B'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Layers className="h-3.5 w-3.5" aria-hidden="true" />
              2D Cephe (B)
            </button>
          )}
          <button
            type="button"
            aria-pressed={viewMode === '2d-plan-top'}
            onClick={() => setViewMode('2d-plan-top')}
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition ${
              viewMode === '2d-plan-top'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <GridIcon className="h-3.5 w-3.5" aria-hidden="true" />
            2D Üst Plan
          </button>
        </div>

        {/* KAPAK GÖRÜNÜRLÜĞÜ (NORMAL / X-RAY / GİZLİ) & TOPLU AÇ/KAPAT */}
        <div role="group" aria-label="Kapak ve çekmece görünümü" className="studio-front-toolbar min-w-0 gap-1.5">
          <div className="studio-visibility-group gap-0.5 rounded-lg border border-slate-800 bg-slate-950 p-0.5">
            <button
              type="button"
              aria-pressed={doorVisibilityMode === 'normal'}
              onClick={() => setDoorVisibilityMode('normal')}
              className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition ${
                doorVisibilityMode === 'normal'
                  ? 'border border-sky-500/40 bg-sky-500/25 text-sky-200'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Kapakları normal göster"
            >
              <Eye className="h-3 w-3" aria-hidden="true" />
              Kapak
            </button>
            <button
              type="button"
              aria-pressed={doorVisibilityMode === 'xray'}
              onClick={() => setDoorVisibilityMode('xray')}
              className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition ${
                doorVisibilityMode === 'xray'
                  ? 'border border-sky-500/40 bg-sky-500/25 text-sky-200'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="X-Ray yarı saydam kapak modu (iç düzeni gösterir ve tıklatır)"
            >
              <ScanEye className="h-3 w-3" aria-hidden="true" />
              X-Ray
            </button>
            <button
              type="button"
              aria-pressed={doorVisibilityMode === 'hidden'}
              onClick={() => setDoorVisibilityMode('hidden')}
              className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition ${
                doorVisibilityMode === 'hidden'
                  ? 'border border-sky-500/40 bg-sky-500/25 text-sky-200'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Kapakları geçici olarak gizle"
            >
              <EyeOff className="h-3 w-3" aria-hidden="true" />
              Gizle
            </button>
          </div>

          <button
            type="button"
            aria-pressed={anyDoorOpen}
            onClick={() => setAllDoorsOpen(!anyDoorOpen)}
            aria-label={anyDoorOpen ? 'Kapakları Kapat' : 'Kapakları Aç'}
            className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition ${
              anyDoorOpen
                ? 'border-amber-500/50 bg-amber-500/20 text-amber-200'
                : 'border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800'
            }`}
            title="Tüm kapakları (menteşeli ve sürgülü) aç / kapat"
          >
            <DoorOpen className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="studio-front-action-label">{anyDoorOpen ? 'Kapakları Kapat' : 'Kapakları Aç'}</span>
          </button>

          <button
            type="button"
            aria-pressed={anyDrawerOpen}
            onClick={() => setAllDrawersOpen(!anyDrawerOpen)}
            aria-label={anyDrawerOpen ? 'Çekmeceleri Kapat' : 'Çekmeceleri Aç'}
            className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition ${
              anyDrawerOpen
                ? 'border-amber-500/50 bg-amber-500/20 text-amber-200'
                : 'border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800'
            }`}
            title="Tüm çekmeceleri aç / kapat"
          >
            <FolderOpen className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="studio-front-action-label">{anyDrawerOpen ? 'Çekmeceleri Kapat' : 'Çekmeceleri Aç'}</span>
          </button>
        </div>

        {/* SAĞ HIZLI EYLEMLER: GERİ AL / YİNELE (HER ZAMAN GÖRÜNÜR), KAYDET, ARAÇLAR VE İŞLEM GEÇMİŞİ */}
        <div className="studio-session relative gap-1.5">
          <div role="group" aria-label="Geri al ve yinele" className="flex items-center gap-1">
            <button
              type="button"
              onClick={undo}
              disabled={historyPast.length === 0}
              aria-label={
                historyPast.length > 0
                  ? `Geri al (${historyPast.length} adım): ${historyPast[historyPast.length - 1].label}`
                  : 'Geri al (geçmiş boş)'
              }
              className="flex items-center gap-1 rounded-md border border-slate-800 bg-slate-900 px-2 py-1 text-xs text-slate-200 transition hover:bg-slate-800 disabled:opacity-40"
              title={
                historyPast.length > 0
                  ? `Geri Al (${historyPast.length} adım): ${historyPast[historyPast.length - 1].label}`
                  : 'Geri Al (Ctrl+Z) — Kayıt noktasındasınız'
              }
            >
              <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span aria-hidden="true" className="font-mono text-[11px]">{historyPast.length}</span>
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={historyFuture.length === 0}
              aria-label={
                historyFuture.length > 0
                  ? `Yinele (${historyFuture.length} adım): ${historyFuture[historyFuture.length - 1].label}`
                  : 'Yinele (ileri adım yok)'
              }
              className="flex items-center gap-1 rounded-md border border-slate-800 bg-slate-900 px-2 py-1 text-xs text-slate-200 transition hover:bg-slate-800 disabled:opacity-40"
              title={
                historyFuture.length > 0
                  ? `Yinele (${historyFuture.length} adım): ${historyFuture[historyFuture.length - 1].label}`
                  : 'Yinele (Ctrl+Y)'
              }
            >
              <Redo2 className="h-3.5 w-3.5" aria-hidden="true" />
              {historyFuture.length > 0 && (
                <span aria-hidden="true" className="font-mono text-[11px]">{historyFuture.length}</span>
              )}
            </button>
          </div>

          {/* KAYIT NOKTASI BUTONU */}
          <button
            type="button"
            onClick={saveCheckpoint}
            className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold transition ${
              hasUnsavedChanges || !lastCheckpointAt || persistenceStatus === 'error'
                ? 'border-amber-400/70 bg-amber-500 text-slate-950 shadow-sm hover:bg-amber-400'
                : 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
            }`}
            title="Çalışma kopyasını kayıt noktası olarak kaydet (Ctrl+S)"
          >
            <Save className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{checkpointText}</span>
          </button>

          <button
            ref={toolsButtonRef}
            type="button"
            aria-expanded={showTools}
            aria-controls="studio-more-tools"
            className={`studio-more-trigger rounded-md border px-2.5 py-1 text-xs font-medium transition ${
              showTools
                ? 'border-sky-400 bg-sky-500/20 text-sky-100'
                : 'border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700'
            }`}
            onClick={() => {
              setShowTools((open) => !open);
              setShowHistoryMenu(false);
            }}
          >
            <span>Araçlar</span>
            <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
          </button>

          <div ref={toolsMenuRef} id="studio-more-tools" className="studio-more-tools" data-open={showTools}>
            {/* ÖLÇÜLER BUTONU */}
            <button
              type="button"
              aria-pressed={showDimensions}
              onClick={() => setShowDimensions(!showDimensions)}
              className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium transition ${
                showDimensions
                  ? 'border-sky-500/50 bg-sky-500/15 text-sky-200'
                  : 'border-slate-800 bg-slate-900 text-slate-300 hover:text-white'
              }`}
              title="Milimetrik ölçü çizgilerini göster/gizle"
            >
              <Ruler className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Ölçüler</span>
            </button>

            <button
              type="button"
              aria-pressed={wireframeMode}
              aria-label={wireframeMode ? 'Çizgisel görünümü (Tel kafes) kapat' : 'Çizgisel görünümü (Tel kafes) aç'}
              onClick={() => setWireframeMode(!wireframeMode)}
              className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium transition ${
                wireframeMode
                  ? 'border-amber-500/50 bg-amber-500/15 text-amber-200'
                  : 'border-slate-800 bg-slate-900 text-slate-300 hover:text-white'
              }`}
              title="Çizgisel görünüm (Tel kafes)"
            >
              <Sliders className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="studio-more-only-label">Çizgisel görünüm (Tel kafes)</span>
            </button>

            {/* ÇOKLU ADIM GERİ ALMA VE İŞLEM GEÇMİŞİ MENÜSÜ */}
            <button
              ref={historyButtonRef}
              type="button"
              aria-expanded={showHistoryMenu}
              aria-controls="studio-history-menu"
              aria-label={`İşlem geçmişi (${historyPast.length} geri, ${historyFuture.length} ileri adım)`}
              onClick={() => {
                setShowHistoryMenu((open) => !open);
                setShowTools(false);
              }}
              className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium transition ${
                showHistoryMenu
                  ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                  : 'border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800'
              }`}
              title="İşlem geçmişi ve çoklu adım geri alma (5 / 10 / 20 adım veya son kayıt noktasına dön)"
            >
              <History className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="studio-more-only-label">İşlem geçmişi</span>
              <ChevronDown className="ml-auto h-3 w-3" aria-hidden="true" />
            </button>

            <button
              type="button"
              aria-label="Tasarımı JSON olarak indir"
              onClick={() => {
                handleExportJson();
                setShowTools(false);
              }}
              className="flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs font-medium text-slate-100 hover:bg-slate-700"
              title="Tasarımı .wardrobe.json olarak indir"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              <span>
                JSON<span className="studio-more-only-label"> İndir</span>
              </span>
            </button>
            <button
              type="button"
              aria-label="JSON dosyasından tasarım yükle"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs font-medium text-slate-100 hover:bg-slate-700"
              title=".wardrobe.json dosyasından yükle"
            >
              <Upload className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="studio-more-only-label">JSON Yükle</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              aria-label="JSON tasarım dosyası seç"
              onChange={handleImportFile}
              className="hidden"
            />
          </div>

          {showHistoryMenu && (
            <div
              ref={historyMenuRef}
              id="studio-history-menu"
              role="region"
              aria-label="İşlem geçmişi"
              className="absolute right-0 top-[calc(100%+0.5rem)] z-[85] w-72 space-y-2.5 rounded-xl border border-slate-700 bg-slate-950/95 p-3 text-xs text-slate-100 shadow-2xl backdrop-blur-md"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="font-semibold text-amber-300">
                  İşlem Geçmişi ({historyPast.length} Geri / {historyFuture.length} İleri)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowHistoryMenu(false);
                    focusHistoryTrigger();
                  }}
                  className="text-[11px] text-slate-300 hover:text-white"
                >
                  Kapat
                </button>
              </div>

              {/* Hızlı Çoklu Geri Alma Butonları */}
              <div className="grid grid-cols-3 gap-1 text-[11px]">
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
                className="w-full rounded border border-amber-500/50 bg-amber-500/20 px-2.5 py-1.5 text-[11px] font-semibold text-amber-200 hover:bg-amber-500/30 disabled:opacity-40"
              >
                Son kayıt noktasına dön ({historyPast.length} adım)
              </button>

              {/* Tıklanabilir Son İşlemler Listesi */}
              <div className="max-h-48 space-y-1 overflow-y-auto pr-0.5">
                {historyPast.length === 0 ? (
                  <div className="py-2 text-center text-[11px] text-slate-400">
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
                        className="flex w-full items-center justify-between rounded border border-slate-800 bg-slate-900/90 px-2 py-1 text-left text-[11px] text-slate-200 hover:border-sky-500/50 hover:text-white"
                      >
                        <span className="truncate pr-2">
                          {stepsBack}. {step.label}
                        </span>
                        <span className="shrink-0 font-mono text-[11px] text-amber-300">
                          -{stepsBack} adım
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      <CommandFeedback />
      <MotionNotice />
      {importError && <div role="alert" className="flex shrink-0 items-start justify-between gap-2 border-b border-rose-700 bg-rose-950 px-3 py-2 text-xs text-rose-100">
        <span>JSON açılamadı. Çalışma kopyası korundu. {importError}</span>
        <button type="button" className="shrink-0 underline" onClick={() => setImportError(null)}>Kapat</button>
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
            <nav aria-label="Tasarım adımları" className="grid grid-cols-3 gap-1 rounded-lg bg-slate-900 p-1 text-[11px]">
              <button
                type="button"
                aria-current={activeStep === 'room-carcass' ? 'step' : undefined}
                onClick={() => setActiveStep('room-carcass')}
                className={`rounded py-1.5 font-medium transition ${
                  activeStep === 'room-carcass'
                    ? 'bg-amber-500 font-semibold text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                1. Oda & Köşe
              </button>
              <button
                type="button"
                aria-current={activeStep === 'interior-fronts' ? 'step' : undefined}
                onClick={() => setActiveStep('interior-fronts')}
                className={`rounded py-1.5 font-medium transition ${
                  activeStep === 'interior-fronts'
                    ? 'bg-amber-500 font-semibold text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                2. İç & Kapak
              </button>
              <button
                type="button"
                aria-current={activeStep === 'view-export' ? 'step' : undefined}
                onClick={() => setActiveStep('view-export')}
                className={`rounded py-1.5 font-medium transition ${
                  activeStep === 'view-export'
                    ? 'bg-amber-500 font-semibold text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                3. Malzeme / Çıktı
              </button>
            </nav>
          </div>

          {activeStep === 'interior-fronts' && <><FrontSystemEditor/><Phase4InteriorPanel /></>}
          {/* ADIM 1: ODA, ŞABLONLAR, KOL ÖLÇÜLERİ, MALZEME KALINLIKLARI VE KÖŞE */}
          {activeStep === 'room-carcass' && (
            <>
              {/* ÖRNEK TASARIM ŞABLONLARI VE SIFIRDAN BAŞLA */}
              <div className="studio-section space-y-2.5">
                <div className="flex items-center justify-between">
                  <h2 className="studio-section-title">Gardırop oluştur</h2>
                  <button
                    type="button"
                    onClick={() => setShowBlankBuilder(!showBlankBuilder)}
                    aria-expanded={showBlankBuilder}
                    className={`flex items-center gap-1 rounded border px-2 py-1 text-[11px] font-semibold transition ${
                      showBlankBuilder
                        ? 'border-emerald-400 bg-emerald-500 text-slate-950'
                        : 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                    }`}
                  >
                    <FilePlus2 className="h-3 w-3" aria-hidden="true" />
                    Yeni tasarım
                  </button>
                </div>

                {showBlankBuilder && (
                  <section ref={blankBuilderRef} tabIndex={-1} aria-label="Yeni tasarım ölçüleri" className="space-y-2.5 rounded-lg border border-emerald-500/40 bg-slate-950 p-3 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-emerald-300">Yerleşim ve ölçüler</span>
                      <button
                        type="button"
                        onClick={() => setShowBlankBuilder(false)}
                        className="text-[11px] text-slate-300 hover:text-white"
                      >
                        Kapat
                      </button>
                    </div>

                    <p className="studio-helper">Ölçüleri mm olarak girin. L yerleşimde A ana duvar, B dönen duvardır; ikisini de iç köşeden ölçün. Genişlikler dış ölçüdür; net iç alan, paneller düşüldükten sonra hesaplanır.</p>
                    <label className="block space-y-1">
                      <span className="block text-[11px] font-medium text-slate-300">Tasarım Adı</span>
                      <input
                        type="text"
                        value={blankName}
                        onChange={(e) => setBlankName(e.target.value)}
                        className="studio-input"
                      />
                    </label>

                    <div className="space-y-1">
                      <span className="block text-[11px] font-medium text-slate-300">Gardırop Biçimi</span>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          aria-pressed={blankLayout === 'l-shape'}
                          onClick={() => setBlankLayout('l-shape')}
                          className={`rounded border px-2 py-1.5 text-xs font-medium ${
                            blankLayout === 'l-shape'
                              ? 'border-emerald-500 bg-emerald-500/20 text-emerald-200'
                              : 'border-slate-800 bg-slate-900 text-slate-300'
                          }`}
                        >
                          L-Tipi Köşe Dolap
                        </button>
                        <button
                          type="button"
                          aria-pressed={blankLayout === 'straight'}
                          onClick={() => setBlankLayout('straight')}
                          className={`rounded border px-2 py-1.5 text-xs font-medium ${
                            blankLayout === 'straight'
                              ? 'border-emerald-500 bg-emerald-500/20 text-emerald-200'
                              : 'border-slate-800 bg-slate-900 text-slate-300'
                          }`}
                        >
                          Düz (Tek Duvar)
                        </button>
                      </div>
                    </div>

                    {blankLayout === 'l-shape' && (
                      <div className="space-y-1">
                        <span className="block text-[11px] font-medium text-slate-300">Köşe Modülü Tipi</span>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            aria-pressed={blankCorner === 'diagonal'}
                            onClick={() => setBlankCorner('diagonal')}
                            className={`rounded border px-2 py-1.5 text-xs font-medium ${
                              blankCorner === 'diagonal'
                                ? 'border-amber-500 bg-amber-500/20 text-amber-200'
                                : 'border-slate-800 bg-slate-900 text-slate-300'
                            }`}
                          >
                            Beşgen / Diyagonal
                          </button>
                          <button
                            type="button"
                            aria-pressed={blankCorner === 'blind'}
                            onClick={() => setBlankCorner('blind')}
                            className={`rounded border px-2 py-1.5 text-xs font-medium ${
                              blankCorner === 'blind'
                                ? 'border-amber-500 bg-amber-500/20 text-amber-200'
                                : 'border-slate-800 bg-slate-900 text-slate-300'
                            }`}
                          >
                            Kör Köşe (Klapalı)
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="studio-form-grid grid grid-cols-2 gap-x-2">
                      {blankMeasureInput('lengthAMm')}
                      {blankMeasureInput('depthAMm')}
                    </div>

                    {blankLayout === 'l-shape' && (
                      <div className="studio-form-grid grid grid-cols-2 gap-x-2">
                        {blankMeasureInput('lengthBMm')}
                        {blankMeasureInput('depthBMm')}
                      </div>
                    )}

                    {blankMeasureInput('roomHeightMm', true)}
                    {blankMeasureInput('heightMm', true)}
                    <p className="studio-helper">Oda yüksekliği zemin ile tavan arasıdır. Gardırop yüksekliği, dolabın baza ve üst dolgu (klapa) dahil dış yüksekliğidir.</p>

                    {!blankMeasurements.ok && <p id="blank-measure-error" role="alert" className="text-rose-200">{blankMeasurements.error}</p>}
                    <button
                      type="button"
                      onClick={handleCreateBlankDesign}
                      disabled={!blankMeasurements.ok}
                      className="flex min-h-9 w-full items-center justify-center gap-1.5 rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-bold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
                    >
                      <FilePlus2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Boş Gardırobu Oluştur ve Başla
                    </button>
                  </section>
                )}

                <details className="space-y-1.5" open={examplesOpen} onToggle={event => setExamplesOpen(event.currentTarget.open)}>
                  <summary ref={examplesSummaryRef} className="cursor-pointer py-1 text-xs text-slate-200">Hazır örnekler</summary>
                  {Object.values(SAMPLE_DESIGNS).map((preset) => {
                    const active = design.id === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => {
                          if (openNamedVersion(preset, preset.name)) setCompactPanel(null);
                        }}
                        className={`w-full rounded-lg border px-3 py-2 text-left text-xs transition ${
                          active
                            ? 'border-amber-500/60 bg-amber-500/15 font-semibold text-amber-200'
                            : 'border-slate-800 bg-slate-950/60 text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        {preset.name}
                      </button>
                    );
                  })}
                </details>
              </div>
              {!showBlankBuilder && <Phase4RoomPanel />}

              {/* DUVAR KOLLARI VE ASİMETRİK DERİNLİK AYARLARI */}
              <section aria-label="Kol ölçüleri ve derinlik" className="studio-section space-y-3">
                <h2 className="studio-section-title">Kol ölçüleri ve derinlik (mm)</h2>

                {design.runs.map((run) => {
                  if (design.layoutKind === 'straight' && run.wallAxis !== 'A') return null;
                  return (
                    <div
                      key={run.id}
                      className="studio-card space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-amber-300">{run.label}</span>
                        <button
                          type="button"
                          onClick={() => addBay(run.id)}
                          aria-label={`${run.label} için yeni bölme ekle`}
                          className="flex items-center gap-1 rounded border border-sky-500/40 bg-sky-500/15 px-2 py-1 text-[11px] font-medium text-sky-200 hover:bg-sky-500/25"
                          title="Bu kola yeni gövde bölmesi ekle"
                        >
                          <Plus className="h-3 w-3" aria-hidden="true" />
                          Bölme Ekle
                        </button>
                      </div>
                      <div className="studio-form-grid grid grid-cols-2 gap-x-2">
                        <NumberField
                          label="Uzunluk (mm)"
                          ariaLabel={`${run.label} uzunluk (mm)`}
                          step={50}
                          min={1200}
                          max={6000}
                          value={run.lengthMm}
                          onCommit={(next) => updateRunDimension(run.id, 'lengthMm', next)}
                        />
                        <NumberField
                          label="Derinlik (mm)"
                          ariaLabel={`${run.label} derinlik (mm)`}
                          step={20}
                          min={350}
                          max={800}
                          value={run.depthMm}
                          onCommit={(next) => updateRunDimension(run.id, 'depthMm', next)}
                        />
                      </div>
                    </div>
                  );
                })}

                <div className="studio-form-grid grid grid-cols-3 gap-x-2">
                  <NumberField
                    label="Yükseklik (mm)"
                    step={20}
                    min={1800}
                    max={3000}
                    value={design.runs[0]?.heightMm ?? 2400}
                    onCommit={(next) => updateRunDimension(design.runs[0].id, 'heightMm', next)}
                  />
                  <NumberField
                    label="Baza (mm)"
                    step={10}
                    min={0}
                    max={200}
                    value={design.runs[0]?.plinthHeightMm ?? 80}
                    onCommit={(next) => updateRunDimension(design.runs[0].id, 'plinthHeightMm', next)}
                  />
                  <NumberField
                    label="Üst dolgu (klapa)"
                    ariaLabel="Üst dolgu (klapa) yüksekliği (mm)"
                    describedBy="top-filler-help"
                    step={10}
                    min={0}
                    max={200}
                    value={design.runs[0]?.topFillerHeightMm ?? 40}
                    onCommit={(next) => updateRunDimension(design.runs[0].id, 'topFillerHeightMm', next)}
                  />
                </div>
                <p id="top-filler-help" className="studio-helper">
                  Gövdenin üstündeki dikey dolgu yüksekliği. Dekoratif taç biçimi Gömme sekmesinde ayrı seçilir.
                </p>
              </section>

              {/* İKİ PARAMETRELİ PANEL KALINLIĞI SİSTEMİ */}
              <section aria-label="Panel kalınlıkları" className="studio-section space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="studio-section-title">Panel kalınlıkları (Gövde / Arkalık)</h2>
                  <span className="rounded bg-sky-500/15 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-sky-300">
                    {resolved.panelThicknessMm} / {resolved.backPanelThicknessMm} mm
                  </span>
                </div>

                <div className="studio-card space-y-2.5 text-[11px]">
                  {/* 1. Ana Panel Kalınlığı */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-slate-200">Ana Panel Kalınlığı (mm)</span>
                      <div className="flex gap-1" role="group" aria-label="Ana panel kalınlığı hazır değerleri">
                        {[18, 22, 25].map((presetT) => (
                          <button
                            key={presetT}
                            type="button"
                            aria-pressed={resolved.panelThicknessMm === presetT}
                            aria-label={`Ana panel kalınlığını ${presetT} mm yap`}
                            onClick={() => updateMaterialThicknesses(presetT, undefined)}
                            className={`rounded border px-2 py-0.5 font-mono text-[11px] ${
                              resolved.panelThicknessMm === presetT
                                ? 'border-amber-400 bg-amber-500/25 font-bold text-amber-200'
                                : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500'
                            }`}
                          >
                            {presetT}
                          </button>
                        ))}
                      </div>
                    </div>
                    <NumberField
                      label="Ana Panel Kalınlığı (mm)"
                      hideLabel
                      min={12}
                      max={36}
                      value={resolved.panelThicknessMm}
                      onCommit={(next) => updateMaterialThicknesses(next, undefined)}
                    />
                  </div>

                  {/* 2. Arkalık ve Çekmece Tabanı Kalınlığı */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-slate-200">
                        Arkalık ve Çekmece Tabanı (mm)
                      </span>
                      <div className="flex gap-1" role="group" aria-label="Arkalık kalınlığı hazır değerleri">
                        {[8, 4, 3].map((presetTb) => (
                          <button
                            key={presetTb}
                            type="button"
                            aria-pressed={resolved.backPanelThicknessMm === presetTb}
                            aria-label={`Arkalık kalınlığını ${presetTb} mm yap`}
                            onClick={() => updateMaterialThicknesses(undefined, presetTb)}
                            className={`rounded border px-2 py-0.5 font-mono text-[11px] ${
                              resolved.backPanelThicknessMm === presetTb
                                ? 'border-emerald-400 bg-emerald-500/25 font-bold text-emerald-200'
                                : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500'
                            }`}
                          >
                            {presetTb}
                          </button>
                        ))}
                      </div>
                    </div>
                    <NumberField
                      label="Arkalık ve Çekmece Tabanı Kalınlığı (mm)"
                      hideLabel
                      min={3}
                      max={18}
                      value={resolved.backPanelThicknessMm}
                      onCommit={(next) => updateMaterialThicknesses(undefined, next)}
                    />
                  </div>

                  <div className="rounded bg-slate-900/90 px-2 py-1.5 font-mono text-[11px] text-slate-300">
                    800 mm Dış Bölme → Net İç:{' '}
                    <strong className="text-sky-300">
                      {800 - 2 * resolved.panelThicknessMm} mm
                    </strong>
                  </div>
                </div>
              </section>

              {/* L-KÖŞE BİRLEŞİMİ AYARLARI */}
              {design.layoutKind === 'l-shape' && activeJunction && (
                <section aria-label="L-köşe birleşimi" className="studio-section space-y-2.5">
                  <h2 className="studio-section-title">L-köşe birleşimi</h2>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      aria-pressed={activeJunction.type === 'diagonal'}
                      onClick={() => setCornerType('diagonal')}
                      className={`rounded-md border px-2.5 py-1.5 text-xs font-medium transition ${
                        activeJunction.type === 'diagonal'
                          ? 'border-amber-500 bg-amber-500/20 text-amber-200'
                          : 'border-slate-800 bg-slate-950 text-slate-300 hover:text-white'
                      }`}
                    >
                      Beşgen / Diyagonal
                    </button>
                    <button
                      type="button"
                      aria-pressed={activeJunction.type === 'blind'}
                      onClick={() => setCornerType('blind')}
                      className={`rounded-md border px-2.5 py-1.5 text-xs font-medium transition ${
                        activeJunction.type === 'blind'
                          ? 'border-amber-500 bg-amber-500/20 text-amber-200'
                          : 'border-slate-800 bg-slate-950 text-slate-300 hover:text-white'
                      }`}
                    >
                      Kör Köşe (Klapalı)
                    </button>
                  </div>

                  {activeJunction.type === 'diagonal' ? (
                    <>
                      <div className="studio-form-grid grid grid-cols-3 gap-x-2">
                        <NumberField
                          label="Köşe A (mm)"
                          step={20}
                          min={750}
                          max={1300}
                          value={activeJunction.diagonalArmAMm}
                          onCommit={(next) => updateCornerParam('diagonalArmAMm', next)}
                        />
                        <NumberField
                          label="Köşe B (mm)"
                          step={20}
                          min={750}
                          max={1300}
                          value={activeJunction.diagonalArmBMm}
                          onCommit={(next) => updateCornerParam('diagonalArmBMm', next)}
                        />
                        <NumberField
                          label="Köşe rafı sayısı"
                          min={0}
                          max={7}
                          value={activeJunction.shelvesCount}
                          onCommit={(next) => updateCornerParam('shelvesCount', next)}
                        />
                      </div>

                      <p className="studio-helper">
                        {activeJunction.shelvesCount} fiziksel raf · {activeJunction.shelvesCount + 1} kullanılabilir aralık
                      </p>
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-300">Köşe açılı kapak yönü:</span>
                          <div className="flex gap-1" role="group" aria-label="Köşe açılı kapak yönü">
                            {(['left', 'right', 'open'] as const).map((m) => (
                              <button
                                key={m}
                                type="button"
                                aria-pressed={(activeJunction.doorMode ?? 'left') === m}
                                onClick={() => setCornerDoorMode(m)}
                                className={`rounded border px-2 py-0.5 text-[11px] ${
                                  (activeJunction.doorMode ?? 'left') === m
                                    ? 'border-amber-500 bg-amber-500/20 text-amber-200'
                                    : 'border-slate-800 bg-slate-950 text-slate-300'
                                }`}
                              >
                                {m === 'left' ? 'Sol' : m === 'right' ? 'Sağ' : 'Açık'}
                              </button>
                            ))}
                          </div>
                        </div>

                        {cornerDoor && (
                          <button
                            type="button"
                            aria-pressed={Boolean(openDoorIds[cornerDoor.id])}
                            onClick={() => toggleDoor(cornerDoor.id)}
                            className="flex w-full items-center justify-between rounded border border-amber-500/40 bg-amber-500/10 px-2.5 py-1.5 text-[11px] font-medium text-amber-200 hover:bg-amber-500/20"
                          >
                            <span className="flex items-center gap-1.5">
                              <DoorOpen className="h-3.5 w-3.5" aria-hidden="true" />
                              Beşgen Köşe Kapağı ({cornerDoor.widthMm} mm)
                            </span>
                            <span className="rounded bg-amber-500/25 px-1.5 py-0.5 text-[11px] font-semibold">
                              {openDoorIds[cornerDoor.id] ? 'Kapat' : 'Aç'}
                            </span>
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="grid grid-cols-2 items-start gap-2">
                      <NumberField
                        label="Kör Klapa (mm)"
                        step={5}
                        min={20}
                        max={150}
                        value={activeJunction.fillerWidthMm}
                        onCommit={(next) => updateCornerParam('fillerWidthMm', next)}
                      />
                      <div className="flex flex-col gap-1 text-[11px] text-slate-300">
                        <span className="font-medium leading-snug">B Kolu Başlangıcı</span>
                        <span className="flex min-h-[32px] items-center font-mono font-semibold text-sky-300">
                          {activeCorner?.consumedRunBMm ?? 660} mm
                        </span>
                      </div>
                    </div>
                  )}

                  {activeCorner && activeJunction.type === 'diagonal' && (
                    <div className="flex justify-between rounded border border-slate-800 bg-slate-950/80 px-2.5 py-1.5 text-[11px] text-slate-200">
                      <span>Ön Açılı Açıklık:</span>
                      <span className="font-mono font-bold text-amber-300">
                        {activeCorner.frontOpeningWidthMm} mm ({activeCorner.frontAngleDeg}°)
                      </span>
                    </div>
                  )}
                </section>
              )}
            </>
          )}

          {/* ADIM 2: İÇ DÜZEN & KAPAK ODAKLI SOL GEZGİN */}
          {activeStep === 'interior-fronts' && (
            <section aria-label="İç düzen ve kapak gezgini" className="studio-section space-y-2.5">
              <div className="flex items-center justify-between">
                <h2 className="studio-section-title">İç düzen ve kapak gezgini</h2>
                <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[11px] font-semibold text-amber-300">
                  Adım 2
                </span>
              </div>
              <p className="studio-helper">
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
                      type="button"
                      onClick={() => addBay(run.id)}
                      className="flex items-center gap-1 rounded border border-sky-500/40 bg-sky-500/15 px-2.5 py-1.5 text-[11px] font-medium text-sky-200 hover:bg-sky-500/25"
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                      {run.wallAxis} Koluna Bölme Ekle
                    </button>
                  );
                })}
                <button
                  type="button"
                  aria-pressed={doorEditorMode}
                  onClick={() => setDoorEditorMode(!doorEditorMode)}
                  className={`flex items-center gap-1 rounded border px-2.5 py-1.5 text-[11px] font-semibold ${
                    doorEditorMode
                      ? 'border-amber-400 bg-amber-500 text-slate-950'
                      : 'border-amber-500/40 bg-amber-500/15 text-amber-200 hover:bg-amber-500/25'
                  }`}
                >
                  <DoorOpen className="h-3.5 w-3.5" aria-hidden="true" />
                  {doorEditorMode ? 'Kapak Düzenle (Aktif)' : 'Kapak Düzenle'}
                </button>
              </div>
            </section>
          )}

          {/* ADIM 3: MALZEME, KULP, GÖMME BİTİŞ, LED AYDINLATMA, SUNUM MODU VE 3D EŞYALAR (AŞAMA 3) */}
          {activeStep === 'view-export' && (
            <div className="space-y-3 p-3">
              {/* Alt Sekme Seçici */}
              <div role="group" aria-label="Malzeme ve çıktı sekmeleri" className="grid grid-cols-4 gap-1 rounded-lg border border-slate-800 bg-slate-950 p-1 text-[11px]">
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
                    aria-pressed={materialSubTab === tab.id}
                    onClick={() =>
                      setMaterialSubTab(
                        tab.id as 'materials' | 'handles' | 'exterior' | 'led-studio' | 'items' | 'versions' | 'production'
                      )
                    }
                    className={`rounded py-1.5 font-semibold transition ${
                      materialSubTab === tab.id
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {materialSubTab === 'versions' && <VersionPanel/>}
              {materialSubTab === 'production' && <ProductionPanel onReviewAccess={() => setShowAccessReview(true)} />}

              {/* SEKME 1: MALZEME SİSTEMİ VE KALINLIKLAR */}
              {materialSubTab === 'materials' && (
                <div className="space-y-3">
                  {/* Panel Kalınlıkları Hızlı Kartı */}
                  <div className="studio-card space-y-2 text-[11px]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="studio-section-title">
                        Panel kalınlıkları (Gövde / Arkalık)
                      </span>
                      <span className="font-mono text-[11px] text-slate-300">
                        {resolved.panelThicknessMm} / {resolved.backPanelThicknessMm} mm
                      </span>
                    </div>
                    <div className="studio-form-grid grid grid-cols-2 gap-x-2">
                      <NumberField
                        label="Ana Panel (mm)"
                        min={12}
                        max={36}
                        value={resolved.panelThicknessMm}
                        onCommit={(next) => updateMaterialThicknesses(next, undefined)}
                      />
                      <NumberField
                        label="Arkalık / Taban (mm)"
                        min={3}
                        max={18}
                        value={resolved.backPanelThicknessMm}
                        onCommit={(next) => updateMaterialThicknesses(undefined, next)}
                      />
                    </div>
                  </div>

                  {/* Hedef Yüzey Slotu Seçici (Gövde / Kapak / Çekmece / Raf) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h2 className="studio-section-title flex items-center gap-1.5">
                        <Palette className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
                        Düzenlenecek yüzey grubu
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
                                : 'border-slate-800 bg-slate-950/80 text-slate-200 hover:border-slate-700'
                            }`}
                          >
                            <div className="text-[11px] font-medium text-slate-300">{s.title}</div>
                            <div className="mt-1 flex items-start gap-1.5 text-xs font-semibold">
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
                  <button
                    type="button"
                    className="rounded border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[11px] text-slate-200 hover:border-sky-400"
                    onClick={() => setMaterials({ shelfMaterialId: design.materials.carcassMaterialId })}
                  >
                    Gövde malzemesini raflara da uygula
                  </button>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="studio-section-title">Malzeme Kataloğu</span>
                    </div>
                    <div className="flex flex-wrap gap-1 text-[11px]" role="group" aria-label="Malzeme kategorileri">
                      <button
                        type="button"
                        aria-pressed={activeMaterialCategory === 'all'}
                        onClick={() => setActiveMaterialCategory('all')}
                        className={`rounded border px-2 py-0.5 font-medium ${
                          activeMaterialCategory === 'all'
                            ? 'border-sky-400 bg-sky-500/20 text-sky-200'
                            : 'border-slate-800 bg-slate-950 text-slate-300'
                        }`}
                      >
                        Tümü (17)
                      </button>
                      {(Object.keys(MATERIAL_CATEGORY_LABELS) as MaterialCategory[]).map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          aria-pressed={activeMaterialCategory === cat}
                          onClick={() => setActiveMaterialCategory(cat)}
                          className={`rounded border px-2 py-0.5 font-medium ${
                            activeMaterialCategory === cat
                              ? 'border-sky-400 bg-sky-500/20 text-sky-200'
                              : 'border-slate-800 bg-slate-950 text-slate-300'
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
                                ? 'border-amber-500 bg-amber-500/15 font-semibold text-amber-200'
                                : 'border-slate-800 bg-slate-950/70 text-slate-200 hover:border-slate-700'
                            }`}
                          >
                            <span className="flex min-w-0 items-center gap-2.5">
                              <span
                                className="h-5 w-5 shrink-0 rounded border border-white/25 shadow-inner"
                                style={{ backgroundColor: m.baseHex }}
                              />
                              <span className="min-w-0">
                                <span className="block break-words leading-snug">{m.name}</span>
                                <span className="block text-[11px] font-normal text-slate-400">
                                  {m.categoryLabel}
                                </span>
                              </span>
                            </span>
                            {active && (
                              <span className="shrink-0 rounded bg-amber-500/20 px-1.5 py-0.5 text-[11px] text-amber-300">
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
                  <div className="studio-card space-y-2.5">
                    <h2 className="studio-section-title">
                      Genel kapak kulpu (kapaklarla birlikte hareket eder)
                    </h2>

                    <label className="block space-y-1">
                      <span className="block font-medium text-slate-300">Kulp Modeli (6 Tip)</span>
                      <select
                        value={design.materials.doorHandleConfig?.styleId ?? 'barModern'}
                        onChange={(e) =>
                          setGlobalDoorHandle({ styleId: e.target.value as HandleStyleId })
                        }
                        className="studio-input"
                      >
                        {Object.values(HANDLE_STYLE_CATALOG).map((h) => (
                          <option key={h.id} value={h.id}>
                            {h.name} — {h.shortDesc}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="grid grid-cols-2 items-end gap-2">
                      <label className="space-y-1">
                        <span className="block font-medium text-slate-300">Kulp Rengi / Bitişi</span>
                        <select
                          value={design.materials.doorHandleConfig?.finishId ?? 'matteBlack'}
                          onChange={(e) =>
                            setGlobalDoorHandle({ finishId: e.target.value as HandleFinishId })
                          }
                          className="studio-input"
                        >
                          {Object.values(HANDLE_FINISH_CATALOG).map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="space-y-1">
                        <span className="block font-medium text-slate-300">Kulp Boyu (mm)</span>
                        <select
                          value={design.materials.doorHandleConfig?.lengthMm ?? 160}
                          onChange={(e) =>
                            setGlobalDoorHandle({ lengthMm: Number(e.target.value) })
                          }
                          className="studio-input font-mono"
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

                    <div className="grid grid-cols-2 items-end gap-2">
                      <label className="space-y-1">
                        <span className="block font-medium text-slate-300">Dikey Konum</span>
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
                          className="studio-input"
                        >
                          <option value="middle">Kapak Ortasında (Ergonomik)</option>
                          <option value="top">Üst Hizada</option>
                          <option value="bottom">Alt Hizada</option>
                          <option value="verticalEdge">Tam Boy Dikey Kenar</option>
                        </select>
                      </label>

                      <label className="space-y-1">
                        <span className="block font-medium text-slate-300">Kulp Yönü</span>
                        <select
                          value={design.materials.doorHandleConfig?.orientation ?? 'vertical'}
                          onChange={(e) =>
                            setGlobalDoorHandle({
                              orientation: e.target.value as 'vertical' | 'horizontal',
                            })
                          }
                          className="studio-input"
                        >
                          <option value="vertical">Dikey</option>
                          <option value="horizontal">Yatay</option>
                        </select>
                      </label>
                    </div>
                  </div>

                  {/* Çekmece Kulpu */}
                  <div className="studio-card space-y-2.5">
                    <h2 className="studio-section-title">
                      Genel çekmece kulpu (çekmeceyle birlikte kayar)
                    </h2>

                    <label className="block space-y-1">
                      <span className="block font-medium text-slate-300">Çekmece Kulp Modeli</span>
                      <select
                        value={design.materials.drawerHandleConfig?.styleId ?? 'barModern'}
                        onChange={(e) =>
                          setGlobalDrawerHandle({ styleId: e.target.value as HandleStyleId })
                        }
                        className="studio-input"
                      >
                        {Object.values(HANDLE_STYLE_CATALOG).map((h) => (
                          <option key={h.id} value={h.id}>
                            {h.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="grid grid-cols-3 items-end gap-1.5">
                      <label className="space-y-1">
                        <span className="block font-medium text-slate-300">Renk</span>
                        <select
                          value={design.materials.drawerHandleConfig?.finishId ?? 'matteBlack'}
                          onChange={(e) =>
                            setGlobalDrawerHandle({ finishId: e.target.value as HandleFinishId })
                          }
                          className="studio-input px-1.5 text-[11px]"
                        >
                          {Object.values(HANDLE_FINISH_CATALOG).map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="space-y-1">
                        <span className="block font-medium text-slate-300">Konum</span>
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
                          className="studio-input px-1.5 text-[11px]"
                        >
                          <option value="middle">Orta Hiza</option>
                          <option value="top">Üst Kenar</option>
                          <option value="bottom">Alt Kenar</option>
                        </select>
                      </label>

                      <label className="space-y-1">
                        <span className="block font-medium text-slate-300">Boy (mm)</span>
                        <select
                          value={design.materials.drawerHandleConfig?.lengthMm ?? 160}
                          onChange={(e) =>
                            setGlobalDrawerHandle({ lengthMm: Number(e.target.value) })
                          }
                          className="studio-input px-1.5 font-mono text-[11px]"
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
                  <div className="studio-card space-y-1 text-slate-200">
                    <p className="studio-section-title">Tavan ve montaj payı</p>
                    <p>Oda {design.roomHeightMm} mm · gerekli pay {design.ceilingClearanceMm ?? 0} mm</p>
                    {design.runs.map(run => <p key={run.id}>{run.wallAxis} · dış yükseklik {run.heightMm} mm · kalan {design.roomHeightMm - run.heightMm} mm<br/>
                      Baza {run.plinthHeightMm} · üst dolgu (klapa) {run.topFillerHeightMm} · yan klapalar {run.startFillerMm} / {run.endFillerMm} mm</p>)}
                  </div>
                  {/* Hızlı Hazır Görünüm Kartları */}
                  <div className="space-y-2 rounded-lg border border-emerald-500/40 bg-slate-950 p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="studio-section-title text-emerald-300">
                        Hızlı dış görünüm ön ayarları
                      </span>
                      <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[11px] font-medium text-emerald-200">
                        Yapısal Paneller Korunur
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-1.5">
                      <button
                        type="button"
                        aria-pressed={design.exteriorFinish?.presetId === 'builtInMinimal'}
                        onClick={() => applyExteriorFinishPreset('builtInMinimal')}
                        className={`rounded-lg border px-2.5 py-2 text-left transition ${
                          design.exteriorFinish?.presetId === 'builtInMinimal'
                            ? 'border-emerald-400 bg-emerald-500/20 font-semibold text-emerald-100'
                            : 'border-slate-800 bg-slate-900 text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>Düz Gömme / Minimal Bitiş (Önerilen)</span>
                          <span className="text-[11px] text-emerald-300">Modern Niş</span>
                        </div>
                        <p className="studio-helper mt-0.5 font-normal">
                          Klasik üst/yan taçları kaldırır; tavana sıfır düz gömme, sıfır yan dikme
                          ve 40 mm gizli baza uygular.
                        </p>
                      </button>

                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          aria-pressed={design.exteriorFinish?.presetId === 'freestandingModern'}
                          onClick={() => applyExteriorFinishPreset('freestandingModern')}
                          className={`rounded border px-2 py-1.5 text-left ${
                            design.exteriorFinish?.presetId === 'freestandingModern'
                              ? 'border-sky-400 bg-sky-500/20 font-semibold text-sky-200'
                              : 'border-slate-800 bg-slate-900 text-slate-200'
                          }`}
                        >
                          <div>Modern Bağımsız</div>
                          <div className="text-[11px] text-slate-400">Açık Üst + Ayarlı Ayak</div>
                        </button>
                        <button
                          type="button"
                          aria-pressed={design.exteriorFinish?.presetId === 'classicTrimmed'}
                          onClick={() => applyExteriorFinishPreset('classicTrimmed')}
                          className={`rounded border px-2 py-1.5 text-left ${
                            design.exteriorFinish?.presetId === 'classicTrimmed'
                              ? 'border-amber-400 bg-amber-500/20 font-semibold text-amber-200'
                              : 'border-slate-800 bg-slate-900 text-slate-200'
                          }`}
                        >
                          <div>Klasik Çerçeveli</div>
                          <div className="text-[11px] text-slate-400">Çıkıntılı Taç + Yan Pervaz</div>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Ayrıntılı Dış Bitiş Seçenekleri */}
                  <div className="studio-card space-y-2.5">
                    <label className="block space-y-1">
                      <span className="block font-medium text-slate-300">Üst Bitiş Stili</span>
                      <select
                        value={design.exteriorFinish?.topStyle ?? 'flatFiller'}
                        onChange={(e) =>
                          setExteriorFinish({ topStyle: e.target.value as TopFinishStyle })
                        }
                        className="studio-input"
                      >
                        <option value="flushCeiling">Tavana Sıfır Düz Gömme</option>
                        <option value="flatFiller">Düz Üst Dolgu Klapası (20–100 mm)</option>
                        <option value="classicCrown">Klasik Dekoratif Üst Taç</option>
                        <option value="none">Üst Bitiş Yok (Açık Üst)</option>
                      </select>
                    </label>

                    <label className="block space-y-1">
                      <span className="block font-medium text-slate-300">Alt Baza / Ayak Stili</span>
                      <select
                        value={design.exteriorFinish?.baseStyle ?? 'lowMinimalPlinth'}
                        onChange={(e) => {
                          const nextBase = e.target.value as BaseFinishStyle;
                          setExteriorFinish({ baseStyle: nextBase });
                        }}
                        className="studio-input"
                      >
                        <option value="lowMinimalPlinth">Alçak Düz Baza (40–60 mm)</option>
                        <option value="recessedHiddenPlinth">Geri Çekilmiş Gizli Baza</option>
                        <option value="highClassicPlinth">Klasik Yüksek Baza (80–100 mm)</option>
                        <option value="adjustableFeet">Ayarlanabilir Gizli Ayak / Sıfır Baza</option>
                      </select>
                    </label>

                    <div className="grid grid-cols-2 items-end gap-2">
                      <label className="space-y-1">
                        <span className="block font-medium text-slate-300">Sol Yan Bitiş</span>
                        <select
                          value={design.exteriorFinish?.leftSideStyle ?? 'flushClean'}
                          onChange={(e) =>
                            setExteriorFinish({ leftSideStyle: e.target.value as SideFinishStyle })
                          }
                          className="studio-input px-2 text-[11px]"
                        >
                          <option value="flushClean">Sıfır Düz Yan Panel</option>
                          <option value="thinWallFiller">İnce Duvar Klapası</option>
                          <option value="decorativeSideTrim">Dekoratif Yan Pervaz</option>
                          <option value="wallRevealPanel">Duvar Nişi Gömme Yan</option>
                        </select>
                      </label>

                      <label className="space-y-1">
                        <span className="block font-medium text-slate-300">Sağ Yan Bitiş</span>
                        <select
                          value={design.exteriorFinish?.rightSideStyle ?? 'flushClean'}
                          onChange={(e) =>
                            setExteriorFinish({
                              rightSideStyle: e.target.value as SideFinishStyle,
                            })
                          }
                          className="studio-input px-2 text-[11px]"
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
                  <div className="space-y-2 rounded-lg border border-amber-500/40 bg-slate-950 p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="studio-section-title text-amber-300">
                        Görsel kalite ve sunum modu
                      </span>
                      <span className="text-[11px] text-slate-300">Stüdyo Işıklandırması</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        aria-pressed={renderQualityMode === 'edit'}
                        onClick={() => setRenderQualityMode('edit')}
                        className={`rounded border px-2.5 py-1.5 font-semibold transition ${
                          renderQualityMode === 'edit'
                            ? 'border-sky-400 bg-sky-500/20 text-sky-200'
                            : 'border-slate-800 bg-slate-900 text-slate-300'
                        }`}
                      >
                        Düzenleme Modu
                      </button>
                      <button
                        type="button"
                        aria-pressed={renderQualityMode === 'presentation'}
                        onClick={() => setRenderQualityMode('presentation')}
                        className={`rounded border px-2.5 py-1.5 font-semibold transition ${
                          renderQualityMode === 'presentation'
                            ? 'border-amber-400 bg-amber-500 text-slate-950'
                            : 'border-slate-800 bg-slate-900 text-slate-200'
                        }`}
                      >
                        Sunum Modu (Stüdyo)
                      </button>
                    </div>
                  </div>

                  {/* İç LED Aydınlatma Ayarları */}
                  <div className="studio-card space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="studio-section-title text-amber-300">
                        İç LED şerit aydınlatma ({resolved.ledStrips.length} şerit)
                      </span>
                      <button
                        type="button"
                        aria-pressed={design.ledLighting?.enabled ?? true}
                        onClick={() =>
                          setLedLighting({
                            enabled: !(design.ledLighting?.enabled ?? true),
                          })
                        }
                        className={`rounded border px-2 py-0.5 text-[11px] font-semibold ${
                          (design.ledLighting?.enabled ?? true)
                            ? 'border-amber-400 bg-amber-500/25 text-amber-200'
                            : 'border-slate-700 bg-slate-900 text-slate-300'
                        }`}
                      >
                        {(design.ledLighting?.enabled ?? true) ? 'LED Açık' : 'LED Kapalı'}
                      </button>
                    </div>

                    <label className="block space-y-1">
                      <span className="block font-medium text-slate-300">Işık Renk Sıcaklığı (Kelvin)</span>
                      <select
                        value={design.ledLighting?.colorTempId ?? 'warm3000K'}
                        onChange={(e) =>
                          setLedLighting({ colorTempId: e.target.value as LedColorTempId })
                        }
                        className="studio-input"
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
                      <div className="flex justify-between text-slate-300">
                        <span>Işık Şiddeti (Parlaklık)</span>
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
                      <span className="block text-[11px] font-semibold text-slate-300">
                        Aktif LED Konumları
                      </span>
                      {(
                        [
                          {
                            key: 'shelfUnder',
                            label: 'Raf Altı LED Şerit (Ön Kenardan 28 mm İçeride)',
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
                            className="flex cursor-pointer items-center justify-between gap-2 rounded border border-slate-800/80 bg-slate-900/60 px-2 py-1.5"
                          >
                            <span className="text-slate-200">{item.label}</span>
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
                  <div className="studio-card space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="studio-section-title text-emerald-300">
                        Gerçek ölçülü 3D kıyafet ve eşyalar
                      </span>
                      <button
                        type="button"
                        aria-pressed={design.interiorItems?.enabled ?? true}
                        onClick={() =>
                          setInteriorItemsConfig({
                            enabled: !(design.interiorItems?.enabled ?? true),
                          })
                        }
                        className={`rounded border px-2 py-0.5 text-[11px] font-semibold ${
                          (design.interiorItems?.enabled ?? true)
                            ? 'border-emerald-400 bg-emerald-500/25 text-emerald-200'
                            : 'border-slate-700 bg-slate-900 text-slate-300'
                        }`}
                      >
                        {(design.interiorItems?.enabled ?? true) ? 'Eşyalar Açık' : 'Gizli'}
                      </button>
                    </div>

                    <div className="space-y-1">
                      <span className="block font-medium text-slate-300">Doluluk / Yoğunluk Seviyesi</span>
                      <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Doluluk yoğunluğu">
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
                            aria-pressed={(design.interiorItems?.density ?? 'medium') === d.id}
                            onClick={() => setInteriorItemsConfig({ density: d.id })}
                            className={`rounded border py-1 text-[11px] font-semibold ${
                              (design.interiorItems?.density ?? 'medium') === d.id
                                ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200'
                                : 'border-slate-800 bg-slate-900 text-slate-300'
                            }`}
                          >
                            {d.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1 pt-1">
                      <span className="block text-[11px] font-semibold text-slate-300">
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
                            className="flex cursor-pointer items-center justify-between gap-2 rounded border border-slate-800/80 bg-slate-900/60 px-2 py-1.5"
                          >
                            <span className="leading-tight text-slate-200">{cat.label}</span>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) =>
                                setInteriorItemsConfig({ [cat.key]: e.target.checked })
                              }
                              className="shrink-0 rounded border-slate-600 accent-emerald-500"
                            />
                          </label>
                        );
                      })}
                    </div>

                    <p className="studio-helper pt-1">
                      İpucu: 3D sahnede herhangi bir iç bölmeye tıkladığınızda açılan bağlamsal
                      panelden o bölmeye özel 3D eşya tipini (Gömlek, Uzun Elbise, Katlı Kazak,
                      Kutu, Valiz vb.) tekil olarak da değiştirebilirsiniz.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* BÖLMELER LİSTESİ (Adım 1 ve Adım 2'de gösterilir) */}
          {activeStep !== 'view-export' && (
            <section aria-label="Bölmeler ve genişlikler" className="space-y-2.5 p-3.5">
              <h2 className="studio-section-title">Bölmeler ve genişlikler</h2>
              <div className="space-y-1.5">
                {resolved.bays.map((bay) => {
                  const isSelected = bay.id === selectedBayId;
                  const ownerMeta = OWNER_LABELS[bay.owner];
                  const runOfBay = design.runs.find((r) => r.id === bay.runId);
                  const canDelete = (runOfBay?.bays.length ?? 1) > 1;

                  return (
                    <div
                      key={bay.id}
                      className={`rounded-lg border p-2 text-xs transition ${
                        isSelected
                          ? 'border-sky-500 bg-sky-500/10'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <button
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => selectBay(bay.id)}
                          className="min-w-0 flex-1 rounded text-left"
                        >
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="truncate font-semibold text-white">{bay.label}</span>
                            <span
                              className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold ${ownerMeta.badgeClass}`}
                            >
                              {ownerMeta.label}
                            </span>
                          </div>
                          <div className="mt-1.5 flex items-center justify-between font-mono text-[11px]">
                            <span className="text-slate-300">
                              Dış: <strong className="text-slate-100">{bay.outerWidthMm} mm</strong>
                            </span>
                            <span className="text-sky-300">
                              Net: <strong>{bay.netInnerWidthMm} mm</strong>
                            </span>
                            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-200">
                              {bay.sizeSpec.kind === 'fixed'
                                ? 'Sabit'
                                : `Esnek (${bay.sizeSpec.weight}x)`}
                            </span>
                          </div>
                        </button>
                      </div>

                      <div className="mt-2 flex items-center justify-between border-t border-slate-800/80 pt-1.5">
                        <button
                          type="button"
                          aria-pressed={bay.locked}
                          aria-label={
                            bay.locked
                              ? `${bay.label} genişlik kilidini aç`
                              : `${bay.label} genişliğini kilitle`
                          }
                          onClick={() => toggleBayLock(bay.runId, bay.id)}
                          className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-medium transition ${
                            bay.locked
                              ? 'border-amber-500/50 bg-amber-500/20 text-amber-200'
                              : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500 hover:text-white'
                          }`}
                          title={bay.locked ? 'Ölçü kilitli — açmak için tıklayın' : 'Ölçüyü kilitle'}
                        >
                          {bay.locked ? (
                            <Lock className="h-3 w-3" aria-hidden="true" />
                          ) : (
                            <Unlock className="h-3 w-3" aria-hidden="true" />
                          )}
                          <span>{bay.locked ? 'Kilitli' : 'Serbest'}</span>
                        </button>

                        <button
                          type="button"
                          disabled={!canDelete}
                          aria-label={
                            canDelete
                              ? `${bay.label} bölmesini sil`
                              : `${bay.label} silinemez, en az bir bölme gereklidir`
                          }
                          onClick={() => {
                            if (!canDelete) return;
                            removeBay(bay.runId, bay.id);
                            setExportNotice(`${bay.label} bölmesi silindi. Geri Al (Ctrl+Z) ile geri getirebilirsiniz.`);
                          }}
                          className="inline-flex items-center gap-1 rounded border border-transparent px-2 py-0.5 text-[11px] text-slate-400 transition hover:border-rose-500/40 hover:bg-rose-500/15 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-35"
                          title={
                            canDelete
                              ? `${bay.label} bölmesini sil (Geri Al ile kurtarılabilir)`
                              : 'Kolda en az bir bölme kalmalıdır'
                          }
                        >
                          <Trash2 className="h-3 w-3" aria-hidden="true" />
                          <span>Sil</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
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
          {/* SEÇİLİ BÖLME VE BAĞIMSIZ KAPAK ÖZETİ */}
          {selectedBay && (
            <section aria-label="Seçili bölme ve kapak" className="studio-section space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="studio-section-title">Seçili bölme ve kapak</h2>
                <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[11px] text-slate-200">
                  {selectedBay.outerWidthMm} mm (İç: {selectedBay.netInnerWidthMm} mm)
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="truncate text-xs font-semibold text-white">{selectedBay.label}</div>
                <div className="flex gap-1" role="group" aria-label="Bölme sahibi">
                  {(['anne', 'baba', 'ortak'] as OwnerType[]).map((own) => (
                    <button
                      key={own}
                      type="button"
                      aria-pressed={selectedBay.owner === own}
                      onClick={() => setBayOwner(selectedBay.runId, selectedBay.id, own)}
                      className={`rounded border px-2 py-0.5 text-[11px] font-semibold transition ${
                        selectedBay.owner === own
                          ? OWNER_LABELS[own].badgeClass
                          : 'border-slate-800 bg-slate-950 text-slate-300'
                      }`}
                    >
                      {OWNER_LABELS[own].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bölme Genişliği: Sabit / Esnek */}
              <div className="grid grid-cols-2 gap-1.5 text-xs" role="group" aria-label="Bölme genişlik modu">
                <button
                  type="button"
                  aria-pressed={selectedBay.sizeSpec.kind === 'fixed'}
                  onClick={() =>
                    setBaySize(selectedBay.runId, selectedBay.id, {
                      kind: 'fixed',
                      mm: selectedBay.outerWidthMm,
                    })
                  }
                  className={`rounded border px-2 py-1.5 font-medium ${
                    selectedBay.sizeSpec.kind === 'fixed'
                      ? 'border-sky-500 bg-sky-500/20 text-sky-200'
                      : 'border-slate-800 bg-slate-950 text-slate-300'
                  }`}
                >
                  Sabit Genişlik (mm)
                </button>
                <button
                  type="button"
                  aria-pressed={selectedBay.sizeSpec.kind === 'flex'}
                  onClick={() =>
                    setBaySize(selectedBay.runId, selectedBay.id, {
                      kind: 'flex',
                      weight: 1,
                    })
                  }
                  className={`rounded border px-2 py-1.5 font-medium ${
                    selectedBay.sizeSpec.kind === 'flex'
                      ? 'border-sky-500 bg-sky-500/20 text-sky-200'
                      : 'border-slate-800 bg-slate-950 text-slate-300'
                  }`}
                >
                  Esnek (Otomatik Paylaşım)
                </button>
              </div>

              {selectedBay.sizeSpec.kind === 'fixed' && (
                <NumberField
                  label="Sabit Dış Genişlik (mm)"
                  value={selectedBay.outerWidthMm}
                  min={220}
                  max={design.runs.find(run => run.id === selectedBay.runId)?.lengthMm ?? 6000}
                  step={10}
                  onCommit={mm => setBaySize(selectedBay.runId, selectedBay.id, { kind: 'fixed', mm })}
                />
              )}

              {/* Kapak Hızlı Ayarı & Kapak Düzenle Kısayolu */}
              <div className="studio-card space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-slate-200">
                    Kapak Düzeni ve Menteşe
                  </span>
                  <button
                    type="button"
                    aria-pressed={doorEditorMode}
                    onClick={() => setDoorEditorMode(!doorEditorMode)}
                    className={`rounded border px-2 py-0.5 text-[11px] font-semibold ${
                      doorEditorMode
                        ? 'border-amber-400 bg-amber-500 text-slate-950'
                        : 'border-amber-500/40 bg-amber-500/15 text-amber-200 hover:bg-amber-500/25'
                    }`}
                  >
                    {doorEditorMode ? 'Kapak Düzenle (Aktif)' : 'Kapak Düzenle'}
                  </button>
                </div>

                {hasExplicitFront && (
                  <p className="text-[11px] text-sky-200">
                    Bağımsız kapak aralıkları kullanılıyor. Tür, yükseklik, kapsam ve ray ayarlarını “2. İç & Kapak” adımındaki Kapak Sistemleri panelinden düzenleyin.
                  </p>
                )}
                <div className={hasExplicitFront ? 'hidden' : 'grid grid-cols-2 items-end gap-2 text-[11px]'}>
                  <select
                    aria-label="Bölme kapak düzeni"
                    value={selectedBay.frontMode}
                    onChange={(e) =>
                      setBayFrontConfig(
                        selectedBay.runId,
                        selectedBay.id,
                        e.target.value as BayFrontMode,
                        selectedBay.hingeAngleDeg
                      )
                    }
                    className="studio-input"
                  >
                    <option value="auto">Otomatik kanat</option>
                    <option value="singleLeft">Tek Kapak — Sol Menteşe</option>
                    <option value="singleRight">Tek Kapak — Sağ Menteşe</option>
                    <option value="double">Çift Kapak (Sol + Sağ)</option>
                    <option value="open">Açık (Kapaksız Gövde)</option>
                  </select>

                  <select
                    aria-label="Menteşe açılma açısı"
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
                    className="studio-input disabled:opacity-40"
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
                          type="button"
                          aria-pressed={isOpen}
                          onClick={() => toggleDoor(d.id)}
                          className={`flex items-center justify-between rounded border px-2 py-1 text-[11px] font-medium transition ${
                            isOpen
                              ? 'border-amber-500/60 bg-amber-500/20 text-amber-200'
                              : 'border-slate-800 bg-slate-900 text-slate-200 hover:border-slate-700'
                          }`}
                        >
                          <span className="truncate">
                            {d.label} ({d.widthMm}×{d.heightMm} mm)
                          </span>
                          <span className="ml-2 shrink-0 rounded bg-slate-800 px-1.5 py-0.5 text-[11px] font-semibold text-amber-300">
                            {isOpen ? 'Kapat' : 'Aç'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* BÖLME İÇİNDEKİ HÜCRELER, ÇEKMECELER VE BEŞGEN KÖŞE GEZGİNİ */}
          <section aria-label="İç bölmeler ve çekmeceler gezgini" className="studio-section space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="studio-section-title">İç bölmeler ve çekmeceler</h2>
              {selectedCell && (
                <span className="font-mono text-[11px] text-sky-300">
                  Net: {selectedCell.netWidthMm}×{selectedCell.netHeightMm}×
                  {selectedCell.netDepthMm} mm
                </span>
              )}
            </div>

            <p className="studio-helper">
              Bir bölme veya çekmece seçtiğinizde günlük düzenleme kontrolleri doğrudan 3D sahnede
              seçimin yanında açılır.
            </p>

            {/* Seçili bölmedeki görünür iç hacimlerin hızlı seçim listesi */}
            {selectedBay && (
              <div className="max-h-52 space-y-1 overflow-y-auto pr-0.5">
                {resolved.cells
                  .filter((c) => c.bayId === selectedBay.id)
                  .map((cell) => {
                    const isPrimarySelected = cell.id === selectedCell?.id;
                    const isInMultiSelection = selectedCellIds.includes(cell.id);
                    const modMeta = cell.insert ? INSERT_REGISTRY[cell.insert.type] : null;
                    return (
                      <button
                        key={cell.id}
                        type="button"
                        aria-pressed={isPrimarySelected || isInMultiSelection}
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
                        className={`flex w-full items-center justify-between rounded border px-2.5 py-1.5 text-left text-[11px] transition ${
                          isPrimarySelected
                            ? 'border-amber-500 bg-amber-500/15 font-semibold text-amber-200'
                            : isInMultiSelection
                              ? 'border-sky-500/80 bg-sky-500/15 font-semibold text-sky-200'
                              : 'border-slate-800 bg-slate-950/60 text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <span>{cell.label}</span>
                          {modMeta && (
                            <span className="ml-1.5 rounded bg-slate-800/90 px-1.5 py-0.5 text-[10px] text-slate-200">
                              {modMeta.shortTitle}
                            </span>
                          )}
                        </div>
                        <span className="shrink-0 font-mono text-[11px] text-sky-300">
                          {cell.netWidthMm}×{cell.netHeightMm}
                        </span>
                      </button>
                    );
                  })}
              </div>
            )}

            {/* Seçili Bölmedeki Bağımsız Çekmeceler Listesi (Tek Tıkla Seç veya Aç/Kapat) */}
            {bayDrawers.length > 0 && (
              <div className="space-y-1.5 pt-1">
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
                <div className="text-[11px] font-semibold text-amber-300">
                  Bölmedeki bağımsız çekmeceler (seç veya aç/kapat)
                </div>
                <div className="grid max-h-40 grid-cols-1 gap-1 overflow-y-auto pr-0.5">
                  {bayDrawers.map((drw) => {
                    const isDrwSelected =
                      selectedDrawerIds.includes(drw.id) || selectedDrawerId === drw.id;
                    const isOpen = Boolean(openDrawerIds[drw.id]);
                    return (
                      <div
                        key={drw.id}
                        className={`flex items-center justify-between rounded border px-2 py-1 text-[11px] ${
                          isDrwSelected
                            ? 'border-amber-400 bg-amber-500/20 font-semibold text-amber-100'
                            : 'border-slate-800 bg-slate-950/70 text-slate-200'
                        }`}
                      >
                        <button
                          type="button"
                          aria-pressed={isDrwSelected}
                          onClick={(e) =>
                            selectDrawer(
                              drw.id,
                              drw.cellId,
                              drw.bayId,
                              Boolean(e.shiftKey || e.ctrlKey || e.metaKey)
                            )
                          }
                          className="flex-1 truncate pr-2 text-left hover:text-amber-300"
                        >
                          Çekmece #{drw.drawerIndex + 1} ({drw.widthMm}×{drw.heightMm} mm)
                        </button>
                        <button
                          type="button"
                          aria-pressed={isOpen}
                          aria-label={`Çekmece ${drw.drawerIndex + 1} ${isOpen ? 'kapat' : 'aç'}`}
                          onClick={() => toggleDrawer(drw.id)}
                          className="rounded bg-slate-800 px-1.5 py-0.5 text-[11px] font-semibold text-amber-300 hover:bg-slate-700"
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
                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] font-semibold text-amber-300">
                    Beşgen köşe raf aralıkları (yükseklik düzenlenebilir)
                  </div>
                  <label className="flex items-center gap-2 text-xs text-slate-200">
                    <input type="checkbox" checked={activeJunction.hasHangingRod}
                      onChange={(e) => setCornerHangingRod(activeJunction.id, e.target.checked)} />
                    Köşe askı borusu · en yüksek raf aralığı
                  </label>
                  <div className="max-h-36 space-y-1 overflow-y-auto pr-0.5">
                    {resolved.cells
                      .filter((c) => c.subIntervalKind === 'cornerInterval')
                      .map((cornerCell) => {
                        const active = cornerCell.id === selectedCell?.id;
                        return (
                          <button
                            key={cornerCell.id}
                            type="button"
                            aria-pressed={active}
                            onClick={() => selectCell(cornerCell.id, cornerCell.bayId)}
                            className={`flex w-full items-center justify-between rounded border px-2.5 py-1 text-left text-[11px] transition ${
                              active
                                ? 'border-amber-500 bg-amber-500/15 font-semibold text-amber-200'
                                : 'border-slate-800 bg-slate-950/60 text-slate-200 hover:border-slate-700'
                            }`}
                          >
                            <span className="truncate pr-2">{cornerCell.label}</span>
                            <span className="shrink-0 font-mono text-[11px] text-sky-300">
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
                  aria-expanded={showAdvancedRightInspector || selectedCell.insert?.type === 'serviceNiche'}
                  onClick={() =>
                    setShowAdvancedRightInspector(!showAdvancedRightInspector)
                  }
                  className="flex w-full items-center justify-between px-2.5 py-2 text-[11px] font-semibold text-emerald-300 hover:text-emerald-200"
                >
                  <span>
                    Gelişmiş modül ve servis nişi ayarları ({selectedCell.label})
                  </span>
                  {showAdvancedRightInspector ? (
                    <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                </button>

                {(showAdvancedRightInspector ||
                  selectedCell.insert?.type === 'serviceNiche') && (
                  <div className="space-y-2.5 border-t border-slate-800 p-2.5 text-[11px]">
                    <label className="block space-y-1">
                      <span className="block font-medium text-slate-300">Hücre modülü</span>
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
                        className="studio-input font-medium"
                      >
                        {Object.values(INSERT_REGISTRY).map((meta) => (
                          <option key={meta.type} value={meta.type}>
                            {meta.shortTitle} — {meta.description}
                          </option>
                        ))}
                      </select>
                    </label>

                    {selectedCell.insert?.type === 'hangingRod' && !selectedCell.cornerJunctionId && (
                      <label className="block space-y-1 text-slate-200">
                        <span className="block font-medium text-slate-300">Askı yüksekliği profili</span>
                        <select
                          className="studio-input"
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
                      <div className="space-y-2.5 rounded border border-sky-500/30 bg-slate-900/60 p-2.5">
                        <NumberField
                          label="Hedef El Payı (mm)"
                          compact
                          min={10}
                          max={100}
                          step={5}
                          value={selectedCell.insert.handClearanceMm ?? 30}
                          onCommit={(next) =>
                            setCellInsert(selectedCell.id, {
                              ...selectedCell.insert!,
                              handClearanceMm: next,
                            })
                          }
                        />

                        <div className="flex flex-wrap gap-1" role="group" aria-label="Servis nişi ekipmanları">
                          {STANDARD_SERVICE_ITEMS.map((presetItem) => {
                            const active = (selectedCell.insert?.serviceItems ?? []).some(
                              (it) => it.id === presetItem.id
                            );
                            return (
                              <button
                                key={presetItem.id}
                                type="button"
                                aria-pressed={active}
                                onClick={() => toggleServiceItemInCell(presetItem)}
                                className={`rounded border px-2 py-1 text-[11px] font-medium transition ${
                                  active
                                    ? 'border-sky-500 bg-sky-500/20 text-sky-200'
                                    : 'border-slate-800 bg-slate-950 text-slate-300'
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
                              className="space-y-2 rounded border border-slate-800 bg-slate-950 p-2"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold text-sky-300">{item.name}</span>
                                <span className="font-mono text-[11px] text-emerald-300">
                                  Ön: {placement.frontWidthMm} mm · Derinlik: {placement.intoDepthMm} mm
                                </span>
                              </div>
                              <div className="studio-form-grid grid grid-cols-2 gap-x-2">
                                <NumberField
                                  label="İnce Kenar (mm)"
                                  ariaLabel={`${item.name} ince kenar (mm)`}
                                  compact
                                  min={20}
                                  max={2000}
                                  step={5}
                                  value={item.widthMm}
                                  onCommit={(next) => updateServiceItemDim(item.id, 'widthMm', next)}
                                />
                                <NumberField
                                  label="Yan Genişlik (mm)"
                                  ariaLabel={`${item.name} yan genişlik (mm)`}
                                  compact
                                  min={20}
                                  max={2000}
                                  step={5}
                                  value={item.depthMm}
                                  onCommit={(next) => updateServiceItemDim(item.id, 'depthMm', next)}
                                />
                                <NumberField
                                  label="Yükseklik (mm)"
                                  ariaLabel={`${item.name} yükseklik (mm)`}
                                  compact
                                  min={20}
                                  max={3000}
                                  step={10}
                                  value={item.heightMm}
                                  onCommit={(next) => updateServiceItemDim(item.id, 'heightMm', next)}
                                />
                                <NumberField
                                  label="Kaldırma payı (mm)"
                                  ariaLabel={`${item.name} kaldırma payı (mm)`}
                                  compact
                                  min={0}
                                  max={500}
                                  step={5}
                                  value={item.liftClearanceMm ?? 0}
                                  onCommit={(next) => updateServiceItemDim(item.id, 'liftClearanceMm', next)}
                                />
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
          </section>
          </>}

          {/* DOĞRULAMA UYARILARI VE ÖZET METRİKLER */}
          <section aria-label="Doğrulama ve kapasite özeti" className="space-y-3 p-3.5">
            <h2 className="studio-section-title">Doğrulama ve kapasite özeti</h2>

            {resolved.issues.length === 0 ? (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Tüm ölçü, kalınlık, menteşe, kapak ve niş sığma kontrolleri uygun.</span>
              </div>
            ) : (
              <div className="space-y-1.5">
                {otherIssues.map((iss) => (
                  <div
                    key={iss.id}
                    className={`space-y-1 rounded-lg border p-2.5 text-[11px] ${
                      iss.severity === 'error'
                        ? 'border-rose-500/50 bg-rose-500/10 text-rose-200'
                        : 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-semibold">
                      <AlertTriangle className={`h-3.5 w-3.5 shrink-0 ${iss.severity === 'error' ? 'text-rose-400' : 'text-amber-400'}`} aria-hidden="true" />
                      <span>{iss.title}</span>
                    </div>
                    <p className="leading-relaxed text-slate-200">{iss.description}</p>
                    <IssueDetails issue={iss} />
                  </div>
                ))}
                {wideSpans.length > 0 && <details className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-2.5 text-xs">
                  <summary className="cursor-pointer font-semibold text-amber-200">Geniş raf ve modül açıklıkları · {wideSpans.length}</summary>
                  {wideSpans.map(issue => <div key={issue.id} className="mt-2 border-t border-amber-900/70 pt-2">
                    <strong className="text-amber-200">{issue.title}</strong>
                    <p className="text-slate-200">{issue.description}</p><IssueDetails issue={issue} />
                  </div>)}
                </details>}
              </div>
            )}

            <div className="studio-card space-y-1 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-300">Ana / Arkalık Kalınlık:</span>
                <span className="font-bold text-sky-300">
                  {resolved.panelThicknessMm} mm / {resolved.backPanelThicknessMm} mm
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Üretim parçası (tam liste):</span>
                <span className="font-bold text-white">
                  {productionPartCount} parça
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Aktif Menteşeli Kapak:</span>
                <span className="text-amber-300">{resolved.doors.length} kanat</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Aktif Sürgülü Kapak:</span>
                <span className="text-sky-300">{resolved.slidingDoors?.length ?? 0} kanat</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Kullanılabilir askı boyu</span>
                <span className="text-sky-300">{resolved.summary.totalHangingLengthMm} mm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Net depolama rafı ve tabanı</span>
                <span className="text-emerald-300">{resolved.summary.totalShelfAreaM2.toFixed(2)} m²</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Toplam Çekmece:</span>
                <span className="text-amber-300">{resolved.summary.totalDrawerCount} adet</span>
              </div>
            </div>

          </section>
        </aside>
      </div>

      {/* ALT DURUM ŞERİDİ */}
      <footer className="studio-footer flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-800 bg-slate-900 px-3 py-1.5 text-[11px] text-slate-300">
          <span>Kayıt noktası · <strong className="text-slate-100">
            {persistenceStatus === 'error' ? 'son yazma başarısız' : persistenceStatus === 'saving' ? 'yazılıyor'
              : hasUnsavedChanges ? 'değişiklik var' : lastCheckpointAt ?? 'henüz yok'}
          </strong></span>
          <span>Otomatik kayıt · <strong className={persistenceStatus === 'error' ? 'text-rose-300' : 'text-sky-300'}>
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
          <span className="ml-auto hidden font-mono text-slate-300 sm:inline">Ana panel {resolved.panelThicknessMm} mm · Arkalık {resolved.backPanelThicknessMm} mm</span>
      </footer>
    </div>
  );
}
