import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  Columns,
  DoorOpen,
  Equal,
  FolderOpen,
  Layers,
  Merge,
  Minus,
  Move,
  Plus,
  RotateCcw,
  Rows,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { type CSSProperties, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  HANDLE_FINISH_CATALOG,
  HANDLE_STYLE_CATALOG,
  MATERIAL_CATALOG,
} from '../materials/materialRegistry';
import { INTERIOR_ITEM_PRESET_LABELS } from '../wardrobe/WardrobeItemsPreview';
import { INSERT_REGISTRY } from '../../core/inserts/insertRegistry';
import type {
  FrontType,
  HandleFinishId,
  HandleStyleId,
  InsertType,
  InteriorItemPreset,
  MaterialId,
  ResizeAxis,
  ResizeDirection,
} from '../../core/schema/types';
import { analyzeSelectedCellsGroup } from '../../core/solver/treeMutator';
import { useWardrobeStore } from '../../store/useWardrobeStore';
import {
  FRONT_TYPE_LABELS,
  resolveActiveDoorInspectorContext,
  switchBayFrontType,
} from '../../ui/DoorInspectorPanel';
import {
  defaultShelfIntervalDraft,
  readNumberDraft,
  readShelfIntervalDraft,
  shelfIntervalLimit,
} from '../../ui/editorFeedback';
import { NumberField } from '../../ui/NumberField';

export interface SelectionScreenBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  centerX: number;
  centerY: number;
  canvasWidth: number;
  canvasHeight: number;
  conflictCenterX?: number;
  conflictCenterY?: number;
}

export interface PopoverPlacement {
  leftPx: number;
  topPx: number;
  widthPx: number;
}

export interface PopoverPlacementOptions {
  conflictActive?: boolean;
}

const PILL_CLEARANCE_PX = 84;
const EDGE_MARGIN_PX = 14;
const TOP_ANCHOR_PX = 104;

export function computePopoverMaxHeightPx(
  sceneHeightPx: number,
  topAnchorPx: number,
  analysisToolbarReservedPx: number,
  minHeightPx = 180
): number {
  return Math.max(minHeightPx, Math.floor(sceneHeightPx - topAnchorPx - analysisToolbarReservedPx - 12));
}

export function computePopoverPlacement(
  screenBounds: SelectionScreenBounds | null,
  mode: 'door-quick-bar' | 'cell-or-drawer',
  options: PopoverPlacementOptions = {}
): PopoverPlacement {
  const canvasWidth = screenBounds?.canvasWidth ?? 900;
  const maxWidth = mode === 'door-quick-bar' ? 312 : canvasWidth < 740 ? 290 : 320;
  const widthPx = Math.min(maxWidth, Math.max(180, canvasWidth - EDGE_MARGIN_PX * 2));
  const rightAlignedLeft = Math.max(EDGE_MARGIN_PX, canvasWidth - widthPx - EDGE_MARGIN_PX);

  if (mode === 'door-quick-bar') {
    if (screenBounds && screenBounds.canvasWidth > 0 && screenBounds.centerX > canvasWidth * 0.55) {
      return { leftPx: EDGE_MARGIN_PX, topPx: TOP_ANCHOR_PX, widthPx };
    }
    return { leftPx: rightAlignedLeft, topPx: TOP_ANCHOR_PX, widthPx };
  }

  // CF-05: When a resize conflict badge is visible, flip opposite the conflict badge / cell
  if (options.conflictActive && screenBounds && screenBounds.canvasWidth > 0) {
    const focusX = screenBounds.conflictCenterX ?? screenBounds.centerX;
    return {
      leftPx: focusX >= canvasWidth * 0.48 ? EDGE_MARGIN_PX : rightAlignedLeft,
      topPx: TOP_ANCHOR_PX,
      widthPx,
    };
  }

  if (screenBounds && screenBounds.canvasWidth > 0) {
    const rightSpace = canvasWidth - (screenBounds.maxX + PILL_CLEARANCE_PX) - EDGE_MARGIN_PX;
    const leftSpace = screenBounds.minX - PILL_CLEARANCE_PX - EDGE_MARGIN_PX;

    if (rightSpace >= widthPx) {
      return { leftPx: rightAlignedLeft, topPx: TOP_ANCHOR_PX, widthPx };
    }
    if (leftSpace >= widthPx) {
      return { leftPx: EDGE_MARGIN_PX, topPx: TOP_ANCHOR_PX, widthPx };
    }
    const moreRoomOnRight = canvasWidth - screenBounds.maxX >= screenBounds.minX;
    return {
      leftPx: moreRoomOnRight ? rightAlignedLeft : EDGE_MARGIN_PX,
      topPx: TOP_ANCHOR_PX,
      widthPx,
    };
  }

  return { leftPx: rightAlignedLeft, topPx: TOP_ANCHOR_PX, widthPx };
}

interface ContextualCellPopoverProps {
  screenBounds: SelectionScreenBounds | null;
}

export function ContextualCellPopover({ screenBounds }: ContextualCellPopoverProps) {
  const design = useWardrobeStore((s) => s.design);
  const resolved = useWardrobeStore((s) => s.resolved);
  const selectedBayId = useWardrobeStore((s) => s.selectedBayId);
  const selectedCellId = useWardrobeStore((s) => s.selectedCellId);
  const selectedCellIds = useWardrobeStore((s) => s.selectedCellIds);
  const selectedDrawerId = useWardrobeStore((s) => s.selectedDrawerId);
  const selectedDrawerIds = useWardrobeStore((s) => s.selectedDrawerIds);
  const doorEditorMode = useWardrobeStore((s) => s.doorEditorMode);
  const selectedDoorId = useWardrobeStore((s) => s.selectedDoorId);
  const selectedDoorIds = useWardrobeStore((s) => s.selectedDoorIds);
  const selectedFrontId = useWardrobeStore((s) => s.selectedFrontId);
  const openDoorIds = useWardrobeStore((s) => s.openDoorIds);
  const openDrawerIds = useWardrobeStore((s) => s.openDrawerIds);
  const resizeDraft = useWardrobeStore((s) => s.resizeDraft);

  const clearCellSelection = useWardrobeStore((s) => s.clearCellSelection);
  const clearDrawerSelection = useWardrobeStore((s) => s.clearDrawerSelection);
  const setSelectedCells = useWardrobeStore((s) => s.setSelectedCells);
  const selectDrawer = useWardrobeStore((s) => s.selectDrawer);
  const splitCell = useWardrobeStore((s) => s.splitCell);
  const unsplitCell = useWardrobeStore((s) => s.unsplitCell);
  const isolateSubInterval = useWardrobeStore((s) => s.isolateSubInterval);
  const divideCellIntoN = useWardrobeStore((s) => s.divideCellIntoN);
  const setContiguousGroupIntervalCount = useWardrobeStore(
    (s) => s.setContiguousGroupIntervalCount
  );
  const equalizeSelectedCells = useWardrobeStore((s) => s.equalizeSelectedCells);
  const mergeAndResplitSelectedGroups = useWardrobeStore(
    (s) => s.mergeAndResplitSelectedGroups
  );
  const batchSplitSelectedCells = useWardrobeStore((s) => s.batchSplitSelectedCells);
  const batchSetSelectedCellsInsert = useWardrobeStore((s) => s.batchSetSelectedCellsInsert);
  const setCellInsert = useWardrobeStore((s) => s.setCellInsert);
  const adjustShelfGrid = useWardrobeStore((s) => s.adjustShelfGrid);
  const updateSelectedDrawerHeight = useWardrobeStore((s) => s.updateSelectedDrawerHeight);
  const equalizeDrawerBankHeights = useWardrobeStore((s) => s.equalizeDrawerBankHeights);
  const toggleDrawer = useWardrobeStore((s) => s.toggleDrawer);
  const toggleDoor = useWardrobeStore((s) => s.toggleDoor);
  const setDoorEditorMode = useWardrobeStore((s) => s.setDoorEditorMode);
  const updateDoorFrontConfig = useWardrobeStore((s) => s.updateDoorFrontConfig);
  const updateCornerParam = useWardrobeStore((s) => s.updateCornerParam);
  const setCornerDoorMode = useWardrobeStore((s) => s.setCornerDoorMode);
  const setDrawerMaterialAndHandle = useWardrobeStore((s) => s.setDrawerMaterialAndHandle);
  const setCellItemPreset = useWardrobeStore((s) => s.setCellItemPreset);

  const startOrUpdateResizeDraft = useWardrobeStore((s) => s.startOrUpdateResizeDraft);
  const updateResizeDraftNeighborMm = useWardrobeStore((s) => s.updateResizeDraftNeighborMm);
  const autoBalanceResizeDraftNeighbor = useWardrobeStore((s) => s.autoBalanceResizeDraftNeighbor);
  const cancelResizeDraft = useWardrobeStore((s) => s.cancelResizeDraft);
  const commitResizeDraft = useWardrobeStore((s) => s.commitResizeDraft);

  const activeDrawerIds =
    selectedDrawerIds.length > 0
      ? selectedDrawerIds
      : selectedDrawerId
        ? [selectedDrawerId]
        : [];

  const activeDoorIds =
    selectedDoorIds.length > 0
      ? selectedDoorIds
      : selectedDoorId
        ? [selectedDoorId]
        : [];

  const activeCellIds =
    selectedCellIds.length > 0
      ? selectedCellIds
      : selectedCellId
        ? [selectedCellId]
        : [];

  const group = analyzeSelectedCellsGroup(activeCellIds, resolved);
  const groupIntervalMax = shelfIntervalLimit(group);
  const groupIntervalDefault = defaultShelfIntervalDraft(group, groupIntervalMax);

  const [splitCountInput, setSplitCountInput] = useState<number>(3);
  const [groupIntervalDraft, setGroupIntervalDraft] = useState(groupIntervalDefault);
  const [groupIntervalBadInput, setGroupIntervalBadInput] = useState(false);
  const groupIntervalTarget = groupIntervalBadInput
    ? null
    : readShelfIntervalDraft(groupIntervalDraft, groupIntervalMax);
  const [mergeTargetIntervals, setMergeTargetIntervals] = useState<number>(
    Math.max(2, group.cells.length)
  );
  const [activeAxis, setActiveAxis] = useState<ResizeAxis>('Y');
  const [activeDirection, setActiveDirection] = useState<ResizeDirection>('up');
  const [targetMmInput, setTargetMmInput] = useState<string>('');
  const [targetMmError, setTargetMmError] = useState<string | null>(null);
  const [drawerHeightInput, setDrawerHeightInput] = useState<string>('');
  const [drawerHeightError, setDrawerHeightError] = useState<string | null>(null);
  const [dynamicMaxHeightPx, setDynamicMaxHeightPx] = useState<number | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const drawerHeightInputRef = useRef<HTMLInputElement | null>(null);
  const targetMmInputRef = useRef<HTMLInputElement | null>(null);

  const selectionSignature = `${activeCellIds.join(',')}|${activeDrawerIds.join(',')}|${activeDoorIds.join(',')}|${doorEditorMode}`;

  useEffect(() => {
    setGroupIntervalDraft(groupIntervalDefault);
    setGroupIntervalBadInput(false);
    setTargetMmError(null);
    setDrawerHeightError(null);
  }, [selectionSignature, groupIntervalDefault]);

  useEffect(() => {
    if (group.cells.length > 0) {
      setMergeTargetIntervals(Math.max(2, group.cells.length));
      const defaultMm =
        activeAxis === 'Y'
          ? group.grossHeightMm
          : activeAxis === 'X'
            ? group.grossWidthMm
            : group.netDepthMm;
      setTargetMmInput(String(defaultMm));
      setTargetMmError(null);
    }
  }, [
    selectionSignature,
    activeAxis,
    group.cells.length,
    group.grossHeightMm,
    group.grossWidthMm,
    group.netDepthMm,
  ]);

  useEffect(() => {
    if (activeDrawerIds.length > 0) {
      const firstDrw = resolved.drawers.find((d) => d.id === activeDrawerIds[0]);
      if (firstDrw) {
        setDrawerHeightInput(String(firstDrw.heightMm));
        setDrawerHeightError(null);
      }
    }
  }, [activeDrawerIds.join(','), resolved.drawers]);

  useEffect(() => {
    if (activeAxis === 'Y') setActiveDirection('up');
    else if (activeAxis === 'X') setActiveDirection('right');
    else setActiveDirection('front');
  }, [activeAxis]);

  useEffect(() => {
    if (resizeDraft) {
      setTargetMmInput(String(resizeDraft.requestedTotalMm));
      setTargetMmError(null);
      setActiveAxis(resizeDraft.axis);
      setActiveDirection(resizeDraft.direction);
    }
  }, [resizeDraft]);

  const conflictActive = Boolean(
    resizeDraft && (resizeDraft.conflictOverlapMm > 0 || resizeDraft.exceedsBoundary)
  );
  const placement = computePopoverPlacement(
    screenBounds,
    doorEditorMode ? 'door-quick-bar' : 'cell-or-drawer',
    { conflictActive }
  );

  // CF-05: Dynamically measure .studio-scene height minus top toolbar and AnalysisToolbar so popovers never collide
  useLayoutEffect(() => {
    const panel = panelRef.current;
    const scene = panel?.closest('.studio-scene') as HTMLElement | null;
    if (!scene) return;
    const measure = () => {
      const sceneRect = scene.getBoundingClientRect();
      if (sceneRect.height <= 0) return;
      const toolbar = scene.querySelector('.studio-scene-toolbar') as HTMLElement | null;
      const toolbarBottom =
        toolbar && toolbar.offsetHeight > 0
          ? toolbar.getBoundingClientRect().bottom - sceneRect.top + 8
          : placement.topPx;
      const effectiveTop = Math.max(placement.topPx, toolbarBottom);
      const analysisBar = scene.querySelector('[data-testid="analysis-toolbar"]') as HTMLElement | null;
      const analysisReserved =
        analysisBar && analysisBar.offsetHeight > 0
          ? Math.max(0, sceneRect.bottom - analysisBar.getBoundingClientRect().top)
          : 16;
      setDynamicMaxHeightPx(
        computePopoverMaxHeightPx(sceneRect.height, effectiveTop, analysisReserved)
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(scene);
    const toolbar = scene.querySelector('.studio-scene-toolbar');
    const analysisBar = scene.querySelector('[data-testid="analysis-toolbar"]');
    if (toolbar) observer.observe(toolbar);
    if (analysisBar) observer.observe(analysisBar);
    return () => observer.disconnect();
  }, [placement.topPx, selectionSignature, Boolean(resizeDraft)]);

  const panelStyle = {
    '--context-left': `${placement.leftPx}px`,
    '--context-top': `${placement.topPx}px`,
    '--context-width': `${placement.widthPx}px`,
    ...(dynamicMaxHeightPx !== null ? { maxHeight: `${dynamicMaxHeightPx}px` } : {}),
  } as CSSProperties;

  const panelClass =
    'context-panel pointer-events-auto absolute z-50 flex flex-col gap-2 rounded-xl border border-slate-600 bg-slate-900/98 p-2.5 text-xs text-slate-100 shadow-2xl';
  const headingClass =
    'context-heading flex items-start justify-between gap-2 border-b border-slate-700 pb-2';

  // ===========================================================================
  // MOD 1: KOMPAKT YÜZEN KAPAK HIZLI EYLEM ÇUBUĞU (doorEditorMode, <= 165px)
  // Masaüstünde (>= 1280px / xl) sağdaki DoorInspectorPanel tek yetkili paneldir;
  // yüzen hızlı çubuk yalnızca dar/tablet/mobil ekranlarda (xl:hidden) gösterilir (VF-11, CF-14).
  // ===========================================================================
  if (doorEditorMode) {
    const ctx = resolveActiveDoorInspectorContext(
      design,
      resolved,
      selectedBayId,
      activeDoorIds,
      selectedFrontId
    );
    if (!ctx.isCornerDoor && !ctx.targetBay) return null;

    const openInspectorDrawer = () => {
      window.dispatchEvent(new CustomEvent('wardrobe:open-selection-drawer'));
    };

    const titleText = ctx.isCornerDoor
      ? ctx.selectedHingedDoor!.label
      : ctx.targetBay!.label;

    const cutSummary = ctx.isCornerDoor
      ? `${ctx.selectedHingedDoor!.widthMm} × ${ctx.selectedHingedDoor!.heightMm} × ${ctx.selectedHingedDoor!.thicknessMm} mm`
      : ctx.activeFrontType === 'sliding' && ctx.selectedSlidingLeaf
        ? `Ray ${ctx.selectedSlidingLeaf.trackIndex + 1} · ${ctx.selectedSlidingLeaf.widthMm} × ${ctx.selectedSlidingLeaf.heightMm} mm`
        : ctx.activeFrontType === 'hinged' && ctx.selectedHingedDoor
          ? `${ctx.selectedHingedDoor.widthMm} × ${ctx.selectedHingedDoor.heightMm} × ${ctx.selectedHingedDoor.thicknessMm} mm`
          : `Açık · Dış ${ctx.targetBay!.outerWidthMm} mm`;

    const activeLeafId = ctx.isCornerDoor
      ? ctx.selectedHingedDoor!.id
      : ctx.activeFrontType === 'sliding'
        ? ctx.selectedSlidingLeaf?.id ?? null
        : ctx.selectedHingedDoor?.id ?? null;

    const isLeafOpen = activeLeafId ? Boolean(openDoorIds[activeLeafId]) : false;
    const alternate = ctx.selectedHingedDoor?.opening?.alternative ?? null;

    const handleFlipDirection = () => {
      if (!alternate) return;
      if (ctx.isCornerDoor) {
        setCornerDoorMode(alternate.side);
      } else if (ctx.targetBay && ctx.selectedHingedDoor) {
        updateDoorFrontConfig(
          ctx.targetBay.id,
          ctx.activeFront?.id,
          alternate.side === 'left' ? 'singleLeft' : 'singleRight',
          ctx.selectedHingedDoor.maxAngleDeg
        );
      }
    };

    return (
      <section
        style={panelStyle}
        aria-label="Kapak hızlı eylem çubuğu"
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        className="context-panel pointer-events-auto absolute z-50 flex flex-col gap-1.5 rounded-xl border border-slate-600/90 bg-slate-900/96 p-2.5 text-xs text-slate-100 shadow-2xl xl:hidden"
      >
        {/* Satır 1: Başlık + kesim ölçüsü + Kapat (Esc) */}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <DoorOpen className="h-3.5 w-3.5 shrink-0 text-amber-400" aria-hidden="true" />
              <span className="truncate text-[11px] font-semibold text-amber-200">{titleText}</span>
              {activeDoorIds.length > 1 && (
                <span className="shrink-0 rounded border border-amber-400/60 bg-amber-500/20 px-1 py-0.25 text-[10px] font-semibold text-amber-200">
                  {activeDoorIds.length} kapak
                </span>
              )}
            </div>
            <div className="truncate font-mono text-[10px] text-slate-300">{cutSummary}</div>
          </div>
          <button
            type="button"
            onClick={() => setDoorEditorMode(false)}
            aria-label="Kapak düzenlemeyi kapat"
            title="Kapak düzenlemeyi kapat (Esc)"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-700 bg-slate-800/90 text-slate-200 transition hover:border-slate-500 hover:bg-slate-700 hover:text-white"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>

        {/* Satır 2: Hızlı cephe seçici (Menteşeli | Sürgülü | Açık veya Köşe: Sol | Sağ | Açık) */}
        {ctx.isCornerDoor && ctx.selectedHingedDoor ? (
          <div
            className="grid grid-cols-3 gap-1 rounded-lg border border-slate-700 bg-slate-950 p-0.5"
            role="group"
            aria-label="Köşe menteşe yönü"
          >
            {(
              [
                { value: 'left', label: 'Sol' },
                { value: 'right', label: 'Sağ' },
                { value: 'open', label: 'Açık' },
              ] as const
            ).map((opt) => {
              const active = ctx.selectedHingedDoor!.hingeSide === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setCornerDoorMode(opt.value)}
                  className={`rounded-md py-1 text-[11px] font-semibold transition ${
                    active
                      ? 'bg-amber-400 text-slate-950'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        ) : (
          <div
            className="grid grid-cols-3 gap-1 rounded-lg border border-slate-700 bg-slate-950 p-0.5"
            role="group"
            aria-label="Hızlı cephe sistemi"
          >
            {(['hinged', 'sliding', 'open'] as FrontType[]).map((frontType) => {
              const isActive = ctx.activeFrontType === frontType;
              return (
                <button
                  key={frontType}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() =>
                    switchBayFrontType(
                      ctx.targetBay!.id,
                      ctx.activeFront,
                      ctx.activeFrontType,
                      frontType
                    )
                  }
                  className={`rounded-md py-1 text-[11px] font-semibold transition ${
                    isActive
                      ? frontType === 'sliding'
                        ? 'bg-sky-500 text-slate-950'
                        : frontType === 'open'
                          ? 'bg-slate-200 text-slate-950'
                          : 'bg-amber-400 text-slate-950'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {FRONT_TYPE_LABELS[frontType]}
                </button>
              );
            })}
          </div>
        )}

        {/* Satır 3: Birincil hızlı eylem(ler) + dar ekranda Tüm ayarlar / masaüstünde sakin ipucu */}
        <div className="flex flex-wrap items-center gap-1.5">
          {activeLeafId && (
            <button
              type="button"
              onClick={() => toggleDoor(activeLeafId)}
              className="flex-1 rounded-md border border-sky-500/60 bg-sky-500/20 px-2 py-1 text-[11px] font-semibold text-sky-100 transition hover:bg-sky-500/30"
            >
              {isLeafOpen ? 'Kanadı kapat' : 'Kanadı aç'}
            </button>
          )}
          {alternate && (
            <button
              type="button"
              onClick={handleFlipDirection}
              className="inline-flex items-center gap-1 rounded-md border border-amber-400/60 bg-amber-500/20 px-2 py-1 text-[11px] font-semibold text-amber-100 transition hover:bg-amber-500/30"
            >
              <RotateCcw className="h-3 w-3" aria-hidden="true" />
              <span>Yönü ters çevir</span>
            </button>
          )}
          <button
            type="button"
            aria-label="Detaylı kapak ayarları"
            onClick={openInspectorDrawer}
            className="rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-[11px] font-medium text-slate-100 transition hover:border-sky-400 xl:hidden"
          >
            Tüm ayarlar
          </button>
        </div>

        <p className="hidden truncate text-[10px] text-slate-300 xl:block">
          Ayrıntılı menteşe, ray ve malzeme ayarları sağ panelde.
        </p>
      </section>
    );
  }

  // ===========================================================================
  // MOD 2: BAĞIMSIZ ÇEKMECE SEÇİMİ VE DÜZENLEME MODU (selectedDrawerIds)
  // ===========================================================================
  if (activeDrawerIds.length > 0) {
    const selectedDrawers = activeDrawerIds
      .map((id) => resolved.drawers.find((d) => d.id === id))
      .filter((d): d is NonNullable<typeof d> => Boolean(d));

    if (selectedDrawers.length === 0) return null;

    const firstDrw = selectedDrawers[0];
    const parentCell = resolved.cells.find((c) => c.id === firstDrw.cellId);
    const bankDrawers = resolved.drawers.filter((d) => d.cellId === firstDrw.cellId);
    const totalSelectedHeightMm = selectedDrawers.reduce((s, d) => s + d.heightMm, 0);

    const maxDrawerH = Math.max(120, firstDrw.parentBankHeightMm - 80);

    const handleApplyDrawerHeight = (customMm?: number) => {
      if (customMm !== undefined) {
        const clamped = Math.max(80, Math.min(maxDrawerH, Math.round(customMm)));
        setDrawerHeightError(null);
        updateSelectedDrawerHeight(firstDrw.id, clamped);
        return;
      }
      const parsed = readNumberDraft(
        drawerHeightInput,
        Boolean(drawerHeightInputRef.current?.validity?.badInput),
        80,
        maxDrawerH
      );
      if (parsed.kind !== 'value') {
        const msg = '80 ile ' + maxDrawerH + ' mm arasında bir yükseklik girin.';
        setDrawerHeightError(msg);
        return;
      }
      setDrawerHeightError(null);
      updateSelectedDrawerHeight(firstDrw.id, parsed.value);
    };

    return (
      <div
        ref={panelRef}
        style={panelStyle}
        role="region"
        aria-label="Çekmece düzenleyicisi"
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        className={panelClass}
      >
        <div className={headingClass}>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <FolderOpen className="h-3.5 w-3.5 shrink-0 text-amber-400" aria-hidden="true" />
              <span className="truncate font-bold text-amber-300">
                {selectedDrawers.length === 1
                  ? `Çekmece #${firstDrw.drawerIndex + 1} / ${firstDrw.totalDrawersInBank}`
                  : `${selectedDrawers.length} Çekmece Seçili`}
              </span>
            </div>
            <div className="mt-0.5 font-mono text-[10px] text-slate-300">
              X: <strong className="text-amber-300">{firstDrw.widthMm}</strong> · Y:{' '}
              <strong className="text-sky-300">{totalSelectedHeightMm}</strong> · Z:{' '}
              <strong className="text-emerald-300">{firstDrw.depthMm}</strong> mm
            </div>
          </div>
          <button
            type="button"
            onClick={clearDrawerSelection}
            aria-label="Çekmece seçimini temizle"
            title="Çekmece seçimini temizle (Esc)"
            className="shrink-0 rounded-md border border-slate-700 bg-slate-800/90 p-1 text-slate-300 hover:bg-slate-700 hover:text-white"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>

        {/* Hızlı Kinematik Aç/Kapat + Grup Eşitleme */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <button
            type="button"
            onClick={() => {
              for (const d of selectedDrawers) {
                toggleDrawer(d.id);
              }
            }}
            className="flex flex-1 items-center justify-center gap-1 rounded border border-amber-400/60 bg-amber-500/20 px-2 py-1.5 font-semibold text-amber-100 transition hover:bg-amber-500/30"
          >
            <FolderOpen className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{openDrawerIds[firstDrw.id] ? 'Çekmeceyi Kapat' : 'Çekmeceyi Aç'}</span>
          </button>
          {bankDrawers.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => {
                  for (const d of bankDrawers) {
                    if (!activeDrawerIds.includes(d.id)) {
                      selectDrawer(d.id, d.cellId, d.bayId, true);
                    }
                  }
                }}
                aria-label={`Gruptaki tüm ${bankDrawers.length} çekmeceyi seç`}
                className="flex items-center gap-1 rounded border border-sky-500/40 bg-sky-500/15 px-2 py-1.5 font-medium text-sky-200 hover:bg-sky-500/25"
              >
                <Layers className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Tümü ({bankDrawers.length})</span>
              </button>
              <button
                type="button"
                onClick={() => equalizeDrawerBankHeights(firstDrw.cellId)}
                aria-label="Çekmece yüksekliklerini eşitle"
                className="flex items-center gap-1 rounded border border-emerald-500/40 bg-emerald-500/15 px-2 py-1.5 font-semibold text-emerald-200 hover:bg-emerald-500/25"
              >
                <Equal className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Eşitle</span>
              </button>
            </>
          )}
        </div>

        {/* 1. SEÇİLİ ÇEKMECE ÖN YÜKSEKLİĞİ (Y) DÜZENLEME */}
        {selectedDrawers.length === 1 && (
          <div className="space-y-1.5 rounded-lg border border-slate-800 bg-slate-950/90 p-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-200">
              <span>Çekmece #{firstDrw.drawerIndex + 1} yüksekliği (Y)</span>
              <span className="font-mono text-[10px] font-normal text-slate-400">
                Grup: {firstDrw.parentBankHeightMm} mm
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Çekmece yüksekliğini 20 mm azalt"
                onClick={() => handleApplyDrawerHeight(firstDrw.heightMm - 20)}
                className="min-h-7 rounded border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-xs text-slate-200 hover:bg-slate-800"
              >
                -20
              </button>
              <input
                ref={drawerHeightInputRef}
                type="number"
                aria-label="Çekmece ön yüksekliği (mm)"
                aria-invalid={drawerHeightError ? true : undefined}
                aria-describedby={drawerHeightError ? 'popover-drawer-height-error' : undefined}
                step={10}
                min={80}
                max={maxDrawerH}
                value={drawerHeightInput}
                onChange={(e) => {
                  setDrawerHeightInput(e.target.value);
                  if (drawerHeightError) setDrawerHeightError(null);
                }}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleApplyDrawerHeight();
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    setDrawerHeightInput(String(firstDrw.heightMm));
                    setDrawerHeightError(null);
                    e.currentTarget.blur();
                  }
                }}
                className="w-18 rounded border border-slate-500 bg-slate-900 px-2 py-1 font-mono text-xs font-bold text-white"
              />
              <span className="font-mono text-[10px] text-slate-400">mm</span>
              <button
                type="button"
                aria-label="Çekmece yüksekliğini 20 mm artır"
                onClick={() => handleApplyDrawerHeight(firstDrw.heightMm + 20)}
                className="min-h-7 rounded border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-xs text-slate-200 hover:bg-slate-800"
              >
                +20
              </button>
              <button
                type="button"
                onClick={() => handleApplyDrawerHeight()}
                className="min-h-7 flex-1 rounded border border-sky-400/60 bg-sky-500/20 px-2 py-1 text-[11px] font-semibold text-sky-100 hover:bg-sky-500/30"
              >
                Uygula
              </button>
            </div>
            {drawerHeightError && (
              <p id="popover-drawer-height-error" role="alert" className="text-[10px] leading-snug text-rose-200">
                {drawerHeightError}
              </p>
            )}
          </div>
        )}

        {/* 2. ÇEKMECE GRUBU ADEDİ, İÇ/DIŞ VE KIZAK TÜRÜ */}
        {parentCell && parentCell.insert?.type === 'drawerBank' && (
          <div className="space-y-1.5 rounded-lg border border-slate-800 bg-slate-950/90 p-2">
            <div className="flex items-center justify-between gap-2 text-[11px]">
              <span className="text-slate-300">Adet:</span>
              <div className="flex items-center gap-1 rounded border border-slate-800 bg-slate-900 px-1 py-0.5">
                <button
                  type="button"
                  aria-label="Çekmece adedini azalt"
                  onClick={() =>
                    setCellInsert(parentCell.sourceLeafId ?? parentCell.id, {
                      ...parentCell.insert!,
                      drawerCount: Math.max(1, (parentCell.insert?.drawerCount ?? 3) - 1),
                      drawerFrontHeightsMm: undefined,
                    })
                  }
                  className="inline-flex min-h-6 min-w-6 items-center justify-center rounded text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  <Minus className="h-3 w-3" aria-hidden="true" />
                </button>
                <span className="w-6 text-center font-mono font-bold text-amber-300">
                  {parentCell.insert.drawerCount ?? 3}
                </span>
                <button
                  type="button"
                  aria-label="Çekmece adedini artır"
                  onClick={() =>
                    setCellInsert(parentCell.sourceLeafId ?? parentCell.id, {
                      ...parentCell.insert!,
                      drawerCount: Math.min(6, (parentCell.insert?.drawerCount ?? 3) + 1),
                      drawerFrontHeightsMm: undefined,
                    })
                  }
                  className="inline-flex min-h-6 min-w-6 items-center justify-center rounded text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  <Plus className="h-3 w-3" aria-hidden="true" />
                </button>
              </div>
              <button
                type="button"
                onClick={() =>
                  setCellInsert(parentCell.sourceLeafId ?? parentCell.id, {
                    ...parentCell.insert!,
                    isInternalDrawer: !parentCell.insert?.isInternalDrawer,
                  })
                }
                className={`rounded border px-2 py-1 text-[10px] font-semibold ${
                  parentCell.insert.isInternalDrawer
                    ? 'border-amber-500/50 bg-amber-500/20 text-amber-200'
                    : 'border-emerald-500/50 bg-emerald-500/20 text-emerald-200'
                }`}
              >
                {parentCell.insert.isInternalDrawer ? 'İç Çekmece' : 'Dış Çekmece'}
              </button>
            </div>
            <label className="flex items-center justify-between gap-2 text-[11px] text-slate-300">
              <span>Kızak türü</span>
              <select
                aria-label="Çekmece kızak türü"
                value={parentCell.insert.drawerSlide ?? ''}
                onChange={(e) =>
                  setCellInsert(parentCell.sourceLeafId ?? parentCell.id, {
                    ...parentCell.insert!,
                    drawerSlide: (e.target.value || undefined) as 'partial' | 'full' | undefined,
                  })
                }
                className="rounded border border-slate-500 bg-slate-900 px-2 py-1 text-[11px] text-white"
              >
                <option value="">Varsayılan · %82</option>
                <option value="partial">Kısmi açılım · %80</option>
                <option value="full">Tam açılım · %100</option>
              </select>
            </label>
          </div>
        )}

        {/* 3. KATLANABİLİR MALZEME, KULP VE KASA DETAYI (DÜŞÜK SIKLIK) */}
        {parentCell && (
          <details className="rounded-lg border border-slate-800 bg-slate-950/75 p-2 text-[11px]">
            <summary className="cursor-pointer font-medium text-slate-200">
              Malzeme, kulp ve kasa detayı
            </summary>
            <div className="mt-2 space-y-2 text-[10px]">
              <div className="flex items-center justify-between text-slate-300">
                <span>Kasa Net İç Hacim:</span>
                <span className="font-mono font-bold text-sky-300">
                  {firstDrw.innerWidthMm}×{firstDrw.innerDepthMm}×{firstDrw.innerHeightMm} mm
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Kasa Kalınlıkları:</span>
                <span className="font-mono text-emerald-300">
                  Yan: {firstDrw.sideThicknessMm} mm · Taban: {firstDrw.bottomThicknessMm} mm
                </span>
              </div>

              <label className="block space-y-1">
                <span className="text-slate-300">Ön Yüz Malzemesi:</span>
                <select
                  aria-label="Çekmece ön yüz malzemesi"
                  value={
                    parentCell.insert?.frontMaterialId ??
                    parentCell.insert?.drawerFrontMaterialId ??
                    ''
                  }
                  onChange={(e) => {
                    const val = (e.target.value || null) as MaterialId | null;
                    setDrawerMaterialAndHandle(
                      parentCell.sourceLeafId ?? parentCell.id,
                      val,
                      undefined
                    );
                  }}
                  className="w-full rounded border border-slate-500 bg-slate-900 px-2 py-1 text-[10px] text-white"
                >
                  <option value="">
                    Genel Çekmece Malzemesi (
                    {
                      MATERIAL_CATALOG[
                        design.materials.drawerFrontMaterialId ?? design.materials.frontMaterialId
                      ].name
                    }
                    )
                  </option>
                  {Object.values(MATERIAL_CATALOG).map((mat) => (
                    <option key={mat.id} value={mat.id}>
                      {mat.name} ({mat.categoryLabel})
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-1.5">
                <label className="space-y-1">
                  <span className="text-slate-300">Kulp Modeli:</span>
                  <select
                    aria-label="Çekmece kulp modeli"
                    value={
                      parentCell.insert?.handleConfig?.styleId ??
                      design.materials.drawerHandleConfig?.styleId ??
                      'barModern'
                    }
                    onChange={(e) =>
                      setDrawerMaterialAndHandle(
                        parentCell.sourceLeafId ?? parentCell.id,
                        undefined,
                        { styleId: e.target.value as HandleStyleId }
                      )
                    }
                    className="w-full rounded border border-slate-500 bg-slate-900 px-1.5 py-1 text-[10px] text-white"
                  >
                    {Object.values(HANDLE_STYLE_CATALOG).map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="text-slate-300">Kulp Rengi:</span>
                  <select
                    aria-label="Çekmece kulp rengi"
                    value={
                      parentCell.insert?.handleConfig?.finishId ??
                      design.materials.drawerHandleConfig?.finishId ??
                      'matteBlack'
                    }
                    onChange={(e) =>
                      setDrawerMaterialAndHandle(
                        parentCell.sourceLeafId ?? parentCell.id,
                        undefined,
                        { finishId: e.target.value as HandleFinishId }
                      )
                    }
                    className="w-full rounded border border-slate-500 bg-slate-900 px-1.5 py-1 text-[10px] text-white"
                  >
                    {Object.values(HANDLE_FINISH_CATALOG).map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <label className="space-y-1">
                  <span className="text-slate-300">Konum:</span>
                  <select
                    aria-label="Çekmece kulp konumu"
                    value={
                      parentCell.insert?.handleConfig?.placement ??
                      design.materials.drawerHandleConfig?.placement ??
                      'middle'
                    }
                    onChange={(e) =>
                      setDrawerMaterialAndHandle(
                        parentCell.sourceLeafId ?? parentCell.id,
                        undefined,
                        {
                          placement: e.target.value as 'middle' | 'top' | 'bottom' | 'verticalEdge',
                        }
                      )
                    }
                    className="w-full rounded border border-slate-500 bg-slate-900 px-1.5 py-1 text-[10px] text-white"
                  >
                    <option value="middle">Orta Hiza</option>
                    <option value="top">Üst Kenar</option>
                    <option value="bottom">Alt Kenar</option>
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="text-slate-300">Boy (mm):</span>
                  <select
                    aria-label="Çekmece kulp boyu"
                    value={
                      parentCell.insert?.handleConfig?.lengthMm ??
                      design.materials.drawerHandleConfig?.lengthMm ??
                      160
                    }
                    onChange={(e) =>
                      setDrawerMaterialAndHandle(
                        parentCell.sourceLeafId ?? parentCell.id,
                        undefined,
                        { lengthMm: Number(e.target.value) }
                      )
                    }
                    className="w-full rounded border border-slate-500 bg-slate-900 px-1.5 py-1 font-mono text-[10px] text-white"
                  >
                    <option value={96}>96 mm</option>
                    <option value={160}>160 mm</option>
                    <option value={220}>220 mm</option>
                    <option value={320}>320 mm</option>
                  </select>
                </label>
              </div>
            </div>
          </details>
        )}
      </div>
    );
  }

  // ===========================================================================
  // MOD 3: HÜCRE / RAF GRUBU / ÇOKLU RAF GRUBU / BEŞGEN KÖŞE DÜZENLEME MODU
  // ===========================================================================
  if (group.cells.length === 0) return null;

  const firstCell = group.cells[0];
  const isContiguousGroup = group.isContiguousVertical || group.isContiguousHorizontal;
  const activeJunction = design.junctions[0] ?? null;

  const changeIntervalTarget = (offset: number) => {
    setGroupIntervalBadInput(false);
    setGroupIntervalDraft((draft) => {
      const count = readShelfIntervalDraft(draft, groupIntervalMax);
      return String(count === null ? 1 : Math.max(1, Math.min(groupIntervalMax, count + offset)));
    });
  };
  const applyIntervalTarget = () => {
    if (groupIntervalTarget !== null) setContiguousGroupIntervalCount(groupIntervalTarget);
  };
  const groupIntervalInvalid =
    groupIntervalBadInput || (groupIntervalDraft !== '' && groupIntervalTarget === null);
  const intervalInput = (
    <div className="flex items-center gap-1 rounded border border-slate-600 bg-slate-900 px-1 py-0.5">
      <button
        type="button"
        aria-label="Aralık hedefini azalt"
        onClick={() => changeIntervalTarget(-1)}
        className="inline-flex min-h-6 min-w-6 items-center justify-center rounded text-slate-300 hover:bg-slate-800 hover:text-white"
      >
        <Minus className="h-3 w-3" aria-hidden="true" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={groupIntervalMax}
        step={1}
        aria-label={group.isMultiShelfGroupSelection ? 'Grup başına aralık' : 'Hedef aralık'}
        aria-invalid={groupIntervalInvalid ? true : undefined}
        aria-describedby={groupIntervalInvalid ? 'popover-shelf-interval-error' : undefined}
        placeholder="—"
        value={groupIntervalDraft}
        onChange={(e) => {
          setGroupIntervalBadInput(Boolean(e.currentTarget.validity?.badInput));
          setGroupIntervalDraft(e.target.value);
        }}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Enter') {
            e.preventDefault();
            applyIntervalTarget();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            setGroupIntervalBadInput(false);
            setGroupIntervalDraft(groupIntervalDefault);
            e.currentTarget.blur();
          }
        }}
        className="w-11 bg-transparent text-center font-mono text-xs font-bold text-amber-300 focus:outline-none"
      />
      <button
        type="button"
        aria-label="Aralık hedefini artır"
        onClick={() => changeIntervalTarget(1)}
        className="inline-flex min-h-6 min-w-6 items-center justify-center rounded text-slate-300 hover:bg-slate-800 hover:text-white"
      >
        <Plus className="h-3 w-3" aria-hidden="true" />
      </button>
    </div>
  );

  const siblingIntervalsOfFirst = firstCell.sourceLeafId
    ? resolved.cells.filter((c) => c.sourceLeafId === firstCell.sourceLeafId)
    : [];
  const wholeShelfGroup =
    firstCell.subIntervalKind === 'shelfInterval' &&
    siblingIntervalsOfFirst.length > 1 &&
    group.cells.every((cell) => cell.sourceLeafId === firstCell.sourceLeafId);

  const handleTriggerResizePreview = (customValMm?: number, customDir?: ResizeDirection) => {
    if (customValMm !== undefined) {
      if (!Number.isFinite(customValMm) || customValMm < 60) return;
      setTargetMmError(null);
      startOrUpdateResizeDraft(activeAxis, customDir ?? activeDirection, Math.round(customValMm));
      return;
    }
    const parsed = readNumberDraft(
      targetMmInput,
      Boolean(targetMmInputRef.current?.validity?.badInput),
      60,
      3000
    );
    if (parsed.kind !== 'value') {
      setTargetMmError('60 ile 3000 mm arasında geçerli bir ölçü girin.');
      return;
    }
    setTargetMmError(null);
    startOrUpdateResizeDraft(activeAxis, customDir ?? activeDirection, parsed.value);
  };

  return (
    <div
      ref={panelRef}
      style={panelStyle}
      role="region"
      aria-label={group.isSingle ? 'Raf hücresi düzenleyicisi' : 'Çoklu hücre düzenleyicisi'}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      className={panelClass}
    >
      {/* 1. ÜST BAŞLIK: SEÇİM ÖZETİ VE TEMİZLEME */}
      <div className={headingClass}>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex h-2 w-2 shrink-0 rounded-full bg-amber-400" />
            <span className="truncate font-bold text-amber-300">
              {group.isSingle
                ? firstCell.label
                : group.isMultiShelfGroupSelection
                  ? `${group.cells.length} Bölme (${group.shelfGroups.length} Ayrı Raf Grubu)`
                  : `${group.cells.length} Bölme Seçili (${
                      group.isContiguousVertical
                        ? 'Dikey Grup'
                        : group.isContiguousHorizontal
                          ? 'Yatay Grup'
                          : 'Çoklu Grup'
                    })`}
            </span>
          </div>
          <div className="mt-0.5 font-mono text-[10px] text-slate-300">
            {group.cells.length > 1 && group.isContiguousVertical ? (
              <span>
                Brüt Y: <strong className="text-sky-300">{group.grossHeightMm}mm</strong> (Net:{' '}
                {group.netHeightSumMm} + {group.cells.length - 1}×{resolved.panelThicknessMm}mm Raf)
              </span>
            ) : group.cells.length > 1 && group.isContiguousHorizontal ? (
              <span>
                Brüt X: <strong className="text-amber-300">{group.grossWidthMm}mm</strong> (Net:{' '}
                {group.netWidthSumMm} + {group.cells.length - 1}×{resolved.panelThicknessMm}mm Dikme)
              </span>
            ) : group.isMultiShelfGroupSelection || group.cells.length > 1 ? (
              <span>
                {group.shelfGroups.length} grup · {group.cells.length} aralık
              </span>
            ) : (
              <span>
                X: <strong className="text-amber-300">{group.grossWidthMm}</strong> · Y:{' '}
                <strong className="text-sky-300">{group.grossHeightMm}</strong> · Z:{' '}
                <strong className="text-emerald-300">{group.netDepthMm}</strong> mm
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={clearCellSelection}
          aria-label="Seçimi temizle"
          title="Seçimi Temizle (Esc)"
          className="shrink-0 rounded-md border border-slate-700 bg-slate-800/90 p-1 text-slate-300 hover:bg-slate-700 hover:text-white"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      {wholeShelfGroup && !resizeDraft && (
        <p className="text-[11px] text-slate-300">
          Raf grubu: {siblingIntervalsOfFirst.length - 1} fiziksel raf ·{' '}
          {siblingIntervalsOfFirst.length} kullanılabilir aralık
        </p>
      )}

      {/* Tek bir aralık seçiliyse tüm grubu seçme kısayolu */}
      {group.isSingle && siblingIntervalsOfFirst.length > 1 && !resizeDraft && (
        <button
          type="button"
          onClick={() => setSelectedCells(siblingIntervalsOfFirst.map((c) => c.id))}
          className="flex items-center justify-between rounded-lg border border-sky-500/40 bg-sky-500/15 px-2.5 py-1 text-[11px] font-medium text-sky-200 transition hover:bg-sky-500/25"
        >
          <span className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
            <span>Grubun Tüm Aralıklarını Seç</span>
          </span>
          <span className="rounded bg-sky-500/30 px-1.5 py-0.5 font-mono text-[10px] font-bold">
            {siblingIntervalsOfFirst.length} Aralık
          </span>
        </button>
      )}

      {/* BEŞGEN KÖŞE ÖZEL KONTROL KARTI */}
      {group.isCornerSelection && activeJunction && (
        <div className="space-y-2 rounded-lg border border-amber-500/40 bg-slate-950/90 p-2">
          <div className="flex items-center justify-between text-[11px] font-semibold text-amber-200">
            <span>Beşgen köşe modülü</span>
            <span className="font-mono text-[10px] font-normal text-slate-300">
              {activeJunction.shelvesCount} raf · {activeJunction.shelvesCount + 1} aralık
            </span>
          </div>
          <div className="studio-form-grid grid grid-cols-3 gap-x-1.5">
            <NumberField
              label="Raf adedi"
              value={activeJunction.shelvesCount}
              min={1}
              max={7}
              compact
              onCommit={(v) => updateCornerParam('shelvesCount', v)}
            />
            <NumberField
              label="Köşe A (mm)"
              value={activeJunction.diagonalArmAMm}
              min={750}
              max={1300}
              step={20}
              compact
              onCommit={(v) => updateCornerParam('diagonalArmAMm', v)}
            />
            <NumberField
              label="Köşe B (mm)"
              value={activeJunction.diagonalArmBMm}
              min={750}
              max={1300}
              step={20}
              compact
              onCommit={(v) => updateCornerParam('diagonalArmBMm', v)}
            />
          </div>
          {activeJunction.intervalHeightsMm && activeJunction.intervalHeightsMm.length > 0 && (
            <button
              type="button"
              onClick={() => updateCornerParam('shelvesCount', activeJunction.shelvesCount)}
              className="flex w-full items-center justify-center gap-1 rounded border border-sky-500/40 bg-sky-500/15 px-2 py-1 text-[10px] font-semibold text-sky-200 hover:bg-sky-500/25"
            >
              <Equal className="h-3 w-3" aria-hidden="true" />
              <span>Köşe Raf Aralıklarını Eşitle</span>
            </button>
          )}
        </div>
      )}

      {/* 2. BÖLME & ÇOKLU RAF GRUBU KONTROLLERİ */}
      {!group.isCornerSelection && (!resizeDraft || !group.isSingle) && (
        <div className="space-y-1.5 rounded-lg border border-slate-800 bg-slate-950/90 p-2">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-200">
            <span>
              {group.isSingle
                ? 'Hızlı bölme'
                : group.isMultiShelfGroupSelection
                  ? 'Çoklu raf grubu toplu düzenleme'
                  : 'Toplu aralık ve bölme işlemleri'}
            </span>
            <span className="font-mono text-[10px] font-normal text-slate-300">
              {resolved.panelThicknessMm} mm bölücü
            </span>
          </div>

          {group.isSingle ? (
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => splitCell(firstCell.id, 'vertical', 'equal')}
                className="flex items-center justify-center gap-1 rounded border border-slate-700 bg-slate-900 px-2 py-1.5 font-medium text-slate-200 hover:border-amber-500/60 hover:bg-slate-800"
              >
                <Columns className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
                <span>Dikey Böl (2)</span>
              </button>
              <button
                type="button"
                onClick={() => splitCell(firstCell.id, 'horizontal', 'equal')}
                className="flex items-center justify-center gap-1 rounded border border-slate-700 bg-slate-900 px-2 py-1.5 font-medium text-slate-200 hover:border-sky-500/60 hover:bg-slate-800"
              >
                <Rows className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
                <span>Yatay Böl (2)</span>
              </button>
            </div>
          ) : group.isMultiShelfGroupSelection ? (
            /* CAD-07 KORUNUR: Çoklu grup özeti + kaydırılabilir liste + kesilmeyen uyarı */
            <div className="space-y-2">
              <div className="space-y-1 rounded border border-sky-500/30 bg-sky-950/30 p-2 text-[10px]">
                <div className="font-semibold text-sky-200">
                  Seçili Raf Grupları ({group.shelfGroups.length} grup):
                </div>
                <div className="max-h-36 space-y-1 overflow-y-auto pr-1">
                  {group.shelfGroups.map((sg) => (
                    <div
                      key={sg.groupKey}
                      className="flex items-center justify-between gap-2 text-slate-300"
                    >
                      <span className="truncate">{sg.groupLabel}</span>
                      <span className="shrink-0 font-mono text-amber-300">
                        {sg.cells.length} aralık ({sg.grossHeightMm}mm)
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={equalizeSelectedCells}
                className="flex w-full items-center justify-center gap-1.5 rounded border border-sky-500/50 bg-sky-500/20 px-2.5 py-1.5 text-[11px] font-semibold text-sky-200 hover:bg-sky-500/30"
              >
                <Equal className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Her Grubu Kendi İçinde Eşit Dağıt</span>
              </button>

              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="text-slate-300">Grup başına aralık (1–{groupIntervalMax}):</span>
                {intervalInput}
                <button
                  type="button"
                  disabled={groupIntervalTarget === null}
                  onClick={applyIntervalTarget}
                  className="min-h-7 rounded border border-amber-500/50 bg-amber-500/20 px-2 py-1 text-[10px] font-bold text-amber-200 hover:bg-amber-500/30 disabled:opacity-55"
                >
                  {groupIntervalTarget === null
                    ? 'Her Gruba Uygula'
                    : `Her Grubu ${groupIntervalTarget} Aralık Yap`}
                </button>
              </div>
              {groupIntervalInvalid && (
                <p id="popover-shelf-interval-error" role="alert" className="text-[10px] text-rose-200">
                  1 ile {groupIntervalMax} arasında tam sayı girin.
                </p>
              )}

              {group.canMergeShelfGroups ? (
                <div className="space-y-1.5 rounded border border-emerald-500/40 bg-emerald-950/30 p-2">
                  <div className="text-[10px] font-semibold text-emerald-300">
                    Grupları Tek Hacimde Birleştir ve Yeniden Böl:
                  </div>
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1 rounded border border-slate-800 bg-slate-900 px-1 py-0.5">
                      <button
                        type="button"
                        aria-label="Birleştirme aralık hedefini azalt"
                        onClick={() => setMergeTargetIntervals((v) => Math.max(1, v - 1))}
                        className="inline-flex min-h-6 min-w-6 items-center justify-center rounded text-slate-300 hover:bg-slate-800 hover:text-white"
                      >
                        <Minus className="h-3 w-3" aria-hidden="true" />
                      </button>
                      <span className="w-6 text-center font-mono text-xs font-bold text-emerald-300">
                        {mergeTargetIntervals}
                      </span>
                      <button
                        type="button"
                        aria-label="Birleştirme aralık hedefini artır"
                        onClick={() => setMergeTargetIntervals((v) => Math.min(14, v + 1))}
                        className="inline-flex min-h-6 min-w-6 items-center justify-center rounded text-slate-300 hover:bg-slate-800 hover:text-white"
                      >
                        <Plus className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => mergeAndResplitSelectedGroups(mergeTargetIntervals)}
                      className="flex flex-1 items-center justify-center gap-1 rounded bg-emerald-500 px-2.5 py-1 text-[10px] font-bold text-slate-950 transition hover:bg-emerald-400"
                    >
                      <Merge className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Birleştir ve {mergeTargetIntervals} Eşit Aralığa Böl</span>
                    </button>
                  </div>
                </div>
              ) : (
                group.cannotMergeReason && (
                  <div className="rounded border border-amber-500/30 bg-amber-500/10 p-2 text-[10px] leading-relaxed text-amber-200">
                    {group.cannotMergeReason}
                  </div>
                )
              )}
            </div>
          ) : isContiguousGroup ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={equalizeSelectedCells}
                  className="flex items-center justify-center gap-1 rounded border border-sky-500/40 bg-sky-500/15 px-2 py-1.5 font-semibold text-sky-200 hover:bg-sky-500/25"
                >
                  <Equal className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Eşit Dağıt ({group.cells.length})</span>
                </button>
                <button
                  type="button"
                  disabled={group.cells.length >= groupIntervalMax}
                  onClick={() => setContiguousGroupIntervalCount(group.cells.length + 1)}
                  className="flex items-center justify-center gap-1 rounded border border-emerald-500/50 bg-emerald-500/20 px-2 py-1.5 font-bold text-emerald-200 hover:bg-emerald-500/30 disabled:opacity-40"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>
                    {group.cells.length >= groupIntervalMax
                      ? `Üst sınır: ${groupIntervalMax}`
                      : `${group.cells.length} → ${group.cells.length + 1} Aralık`}
                  </span>
                </button>
              </div>

              <div className="flex items-center justify-between gap-1.5 text-[11px]">
                <span className="text-slate-300">Hedef (1–{groupIntervalMax}):</span>
                {intervalInput}
                <button
                  type="button"
                  disabled={groupIntervalTarget === null}
                  onClick={applyIntervalTarget}
                  className="min-h-7 rounded border border-amber-500/50 bg-amber-500/20 px-2 py-1 text-[10px] font-bold text-amber-200 hover:bg-amber-500/30 disabled:opacity-55"
                >
                  {groupIntervalTarget === null ? 'Uygula' : `${groupIntervalTarget} Aralık Yap`}
                </button>
              </div>
              {groupIntervalInvalid && (
                <p id="popover-shelf-interval-error" role="alert" className="text-[10px] text-rose-200">
                  1 ile {groupIntervalMax} arasında tam sayı girin.
                </p>
              )}

              <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => batchSplitSelectedCells('vertical')}
                  className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-200 hover:border-amber-500/50"
                >
                  Tümünü Dikey Böl
                </button>
                <button
                  type="button"
                  onClick={() => batchSplitSelectedCells('horizontal')}
                  className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-200 hover:border-sky-500/50"
                >
                  Tümünü Yatay Böl
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="rounded border border-amber-500/30 bg-amber-500/10 p-2 text-[10px] leading-relaxed text-amber-200">
                {group.cannotMergeReason ??
                  `Seçili ${group.cells.length} bölme farklı konumlarda. Her birini kendi raf grubunda eşit dağıtabilir veya toplu modül atayabilirsiniz.`}
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                <button
                  type="button"
                  onClick={equalizeSelectedCells}
                  className="rounded border border-sky-500/40 bg-sky-500/15 px-2 py-1 font-semibold text-sky-200 hover:bg-sky-500/25"
                >
                  Grupları Kendi İçinde Eşitle
                </button>
                <button
                  type="button"
                  onClick={() => batchSplitSelectedCells('horizontal')}
                  className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-200 hover:bg-slate-800"
                >
                  Seçilileri Yatay Böl
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. HIZLI MODÜL ATAMA */}
      {!group.isCornerSelection && !resizeDraft && (
        <div className="space-y-1.5 rounded-lg border border-slate-800 bg-slate-950/90 p-2">
          <div className="text-[11px] font-semibold text-slate-200">
            {group.isSingle ? 'Hızlı modül ata' : `Toplu modül ata (${group.cells.length} bölme)`}
          </div>
          <select
            aria-label={group.isSingle ? 'Hızlı modül seçimi' : 'Toplu modül seçimi'}
            value={firstCell.insert?.type ?? 'empty'}
            onChange={(e) => {
              const nextType = e.target.value as InsertType;
              batchSetSelectedCellsInsert(INSERT_REGISTRY[nextType].createDefaultConfig());
            }}
            className="w-full rounded border border-slate-500 bg-slate-900 px-2 py-1 text-[11px] font-medium text-white"
          >
            {Object.values(INSERT_REGISTRY).map((meta) => (
              <option key={meta.type} value={meta.type}>
                {meta.shortTitle} — {meta.description}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 4. YÖNLÜ YENİDEN BOYUTLANDIRMA (X / Y / Z) VE KOMŞU ÇAKIŞMA ÖNİZLEMESİ */}
      {(group.isSingle || isContiguousGroup) && (
        <div className="space-y-1.5 rounded-lg border border-slate-800 bg-slate-950/90 p-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-200">
              <SlidersHorizontal className="h-3 w-3 text-slate-300" aria-hidden="true" />
              <span>
                {group.isCornerSelection
                  ? 'Köşe raf yüksekliği (Y)'
                  : 'Yönlü boyutlandırma (X / Y / Z)'}
              </span>
            </span>
            <span className="text-[10px] text-slate-400">Komşu korumalı</span>
          </div>

          {!group.isCornerSelection && (
            <div className="grid grid-cols-3 gap-1 rounded bg-slate-900 p-0.5 text-[10px]">
              <button
                type="button"
                aria-pressed={activeAxis === 'Y'}
                onClick={() => setActiveAxis('Y')}
                className={`rounded py-1 font-mono font-semibold transition ${
                  activeAxis === 'Y'
                    ? 'bg-sky-500 text-slate-950'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                Y: {group.grossHeightMm}
              </button>
              <button
                type="button"
                aria-pressed={activeAxis === 'X'}
                onClick={() => setActiveAxis('X')}
                className={`rounded py-1 font-mono font-semibold transition ${
                  activeAxis === 'X'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                X: {group.grossWidthMm}
              </button>
              <button
                type="button"
                aria-pressed={activeAxis === 'Z'}
                onClick={() => setActiveAxis('Z')}
                className={`rounded py-1 font-mono font-semibold transition ${
                  activeAxis === 'Z'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                Z: {group.netDepthMm}
              </button>
            </div>
          )}

          {/* Büyüme Yönü Seçici */}
          <div className="grid grid-cols-2 gap-1.5 text-[10px]">
            {(activeAxis === 'Y' || group.isCornerSelection) && (
              <>
                <button
                  type="button"
                  aria-pressed={activeDirection === 'up'}
                  onClick={() => {
                    setActiveAxis('Y');
                    setActiveDirection('up');
                    if (resizeDraft) handleTriggerResizePreview(undefined, 'up');
                  }}
                  className={`flex items-center justify-center gap-1 rounded border px-2 py-1 font-medium ${
                    activeDirection === 'up'
                      ? 'border-sky-400 bg-sky-500/20 font-semibold text-sky-200'
                      : 'border-slate-800 bg-slate-900 text-slate-300'
                  }`}
                >
                  <ArrowUp className="h-3 w-3" aria-hidden="true" />
                  <span>Yukarı (Alt Sabit)</span>
                </button>
                <button
                  type="button"
                  aria-pressed={activeDirection === 'down'}
                  onClick={() => {
                    setActiveAxis('Y');
                    setActiveDirection('down');
                    if (resizeDraft) handleTriggerResizePreview(undefined, 'down');
                  }}
                  className={`flex items-center justify-center gap-1 rounded border px-2 py-1 font-medium ${
                    activeDirection === 'down'
                      ? 'border-sky-400 bg-sky-500/20 font-semibold text-sky-200'
                      : 'border-slate-800 bg-slate-900 text-slate-300'
                  }`}
                >
                  <ArrowDown className="h-3 w-3" aria-hidden="true" />
                  <span>Aşağı (Üst Sabit)</span>
                </button>
              </>
            )}

            {!group.isCornerSelection && activeAxis === 'X' && (
              <>
                <button
                  type="button"
                  aria-pressed={activeDirection === 'left'}
                  onClick={() => {
                    setActiveDirection('left');
                    if (resizeDraft) handleTriggerResizePreview(undefined, 'left');
                  }}
                  className={`flex items-center justify-center gap-1 rounded border px-2 py-1 font-medium ${
                    activeDirection === 'left'
                      ? 'border-amber-400 bg-amber-500/20 font-semibold text-amber-200'
                      : 'border-slate-800 bg-slate-900 text-slate-300'
                  }`}
                >
                  <ArrowLeft className="h-3 w-3" aria-hidden="true" />
                  <span>Sola (Sağ Sabit)</span>
                </button>
                <button
                  type="button"
                  aria-pressed={activeDirection === 'right'}
                  onClick={() => {
                    setActiveDirection('right');
                    if (resizeDraft) handleTriggerResizePreview(undefined, 'right');
                  }}
                  className={`flex items-center justify-center gap-1 rounded border px-2 py-1 font-medium ${
                    activeDirection === 'right'
                      ? 'border-amber-400 bg-amber-500/20 font-semibold text-amber-200'
                      : 'border-slate-800 bg-slate-900 text-slate-300'
                  }`}
                >
                  <ArrowRight className="h-3 w-3" aria-hidden="true" />
                  <span>Sağa (Sol Sabit)</span>
                </button>
              </>
            )}

            {!group.isCornerSelection && activeAxis === 'Z' && (
              <>
                <button
                  type="button"
                  aria-pressed={activeDirection === 'front'}
                  onClick={() => {
                    setActiveDirection('front');
                    if (resizeDraft) handleTriggerResizePreview(undefined, 'front');
                  }}
                  className={`flex items-center justify-center gap-1 rounded border px-2 py-1 font-medium ${
                    activeDirection === 'front'
                      ? 'border-emerald-400 bg-emerald-500/20 font-semibold text-emerald-200'
                      : 'border-slate-800 bg-slate-900 text-slate-300'
                  }`}
                >
                  <Move className="h-3 w-3" aria-hidden="true" />
                  <span>Öne (Duvar Sabit)</span>
                </button>
                <button
                  type="button"
                  aria-pressed={activeDirection === 'back'}
                  onClick={() => {
                    setActiveDirection('back');
                    if (resizeDraft) handleTriggerResizePreview(undefined, 'back');
                  }}
                  className={`flex items-center justify-center gap-1 rounded border px-2 py-1 font-medium ${
                    activeDirection === 'back'
                      ? 'border-emerald-400 bg-emerald-500/20 font-semibold text-emerald-200'
                      : 'border-slate-800 bg-slate-900 text-slate-300'
                  }`}
                >
                  <Move className="h-3 w-3" aria-hidden="true" />
                  <span>Arkaya (Ön Sabit)</span>
                </button>
              </>
            )}
          </div>

          {/* Yeni Hedef Ölçü Girişi */}
          <div className="flex items-center gap-1.5">
            <input
              ref={targetMmInputRef}
              type="number"
              aria-label={`Hedef ${activeAxis} ölçüsü (mm)`}
              aria-invalid={targetMmError ? true : undefined}
              aria-describedby={targetMmError ? 'popover-target-mm-error' : undefined}
              step={10}
              min={60}
              max={3000}
              value={targetMmInput}
              onChange={(e) => {
                setTargetMmInput(e.target.value);
                if (targetMmError) setTargetMmError(null);
              }}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleTriggerResizePreview();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  setTargetMmError(null);
                  cancelResizeDraft();
                }
              }}
              className="w-24 rounded border border-slate-500 bg-slate-900 px-2 py-1 font-mono text-xs font-bold text-white focus:border-sky-400 focus:outline-none"
            />
            <span className="font-mono text-[10px] text-slate-400">mm</span>
            <button
              type="button"
              onClick={() => handleTriggerResizePreview()}
              className="min-h-7 flex-1 rounded border border-sky-400/60 bg-sky-500/20 px-2 py-1 text-[11px] font-semibold text-sky-100 transition hover:bg-sky-500/30"
            >
              Önizle / Hesapla
            </button>
          </div>
          {targetMmError && (
            <p id="popover-target-mm-error" role="alert" className="text-[10px] leading-snug text-rose-200">
              {targetMmError}
            </p>
          )}

          {/* AKTİF TASLAK VE KOMŞU ÇAKIŞMA ÇÖZÜM KARTI */}
          {resizeDraft && (
            <div
              className={`mt-1 space-y-1.5 rounded-lg border p-2 text-[11px] ${
                resizeDraft.conflictOverlapMm > 0 || resizeDraft.exceedsBoundary
                  ? 'border-rose-500/70 bg-rose-950/50 text-rose-100'
                  : 'border-emerald-500/60 bg-emerald-950/40 text-emerald-100'
              }`}
            >
              <div className="space-y-0.5 text-[10px] text-slate-200">
                <div>
                  <strong>Sabit:</strong> {resizeDraft.fixedBoundaryLabel}
                </div>
                <div>
                  <strong>Hareketli:</strong> {resizeDraft.movingBoundaryLabel}
                </div>
              </div>

              {resizeDraft.exceedsBoundary ? (
                <div className="flex items-start gap-1.5 rounded border border-rose-500/50 bg-rose-950/80 p-1.5 text-[10px] text-rose-200">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" aria-hidden="true" />
                  <span>{resizeDraft.boundaryErrorReason}</span>
                </div>
              ) : resizeDraft.conflictOverlapMm > 0 ? (
                <div className="space-y-1.5">
                  <div className="flex items-start gap-1.5 rounded border border-rose-500/50 bg-rose-950/80 p-1.5 text-[10px] text-rose-200">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" aria-hidden="true" />
                    <div>
                      <div className="font-bold text-rose-300">
                        {resizeDraft.neighborLabel} ile {resizeDraft.conflictOverlapMm} mm çakışma
                      </div>
                      <p className="mt-0.5 leading-snug">
                        Komşu ({resizeDraft.neighborCurrentMm} mm) izinsiz küçültülmedi. Önerilen
                        yeni ölçü: <strong>{resizeDraft.requiredNeighborMm} mm</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <span className="pt-1 text-[10px] text-rose-200">
                      Komşu yeni ölçü (mm):
                    </span>
                    <div className="w-28 shrink-0">
                      <NumberField
                        compact
                        hideLabel
                        label="Komşu yeni ölçü (mm)"
                        ariaLabel="Komşu yeni ölçü (mm)"
                        value={resizeDraft.neighborDraftMm}
                        min={60}
                        max={3000}
                        step={10}
                        onCommit={(val) => updateResizeDraftNeighborMm(val)}
                        inputClassName="border-rose-400/70"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={autoBalanceResizeDraftNeighbor}
                    className="w-full rounded border border-amber-400/70 bg-amber-500/25 px-2 py-1 text-[11px] font-bold text-amber-200 transition hover:bg-amber-500/35"
                  >
                    Komşuyu {resizeDraft.requiredNeighborMm} mm Yap (Çakışmayı Çöz)
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 rounded border border-emerald-500/40 bg-emerald-950/70 p-1.5 text-[10px] text-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden="true" />
                  <span>
                    Çakışma yok (0 mm).{' '}
                    {resizeDraft.neighborCellIds.length > 0 &&
                      `${resizeDraft.neighborLabel} ${resizeDraft.neighborDraftMm} mm dengelendi.`}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                <button
                  type="button"
                  disabled={resizeDraft.conflictOverlapMm > 0 || resizeDraft.exceedsBoundary}
                  onClick={() => commitResizeDraft()}
                  className="rounded bg-emerald-500 px-2 py-1 text-[11px] font-bold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Uygula
                </button>
                <button
                  type="button"
                  onClick={cancelResizeDraft}
                  className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] font-semibold text-slate-200 transition hover:bg-slate-700"
                >
                  İptal
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. KATLANABİLİR GELİŞMİŞ SEÇENEKLER (N-BÖLME, 32 MM RAF, 3D EŞYA, ŞABLONLAR, UNSPLIT) */}
      {group.isSingle && !group.isCornerSelection && !resizeDraft && (
        <details className="rounded-lg border border-slate-800 bg-slate-950/75 p-2 text-[11px]">
          <summary className="flex min-h-6 cursor-pointer items-center font-medium text-slate-200">
            Gelişmiş bölme, 32 mm adım ve 3D eşya
          </summary>
          <div className="mt-2 space-y-2 text-[10px]">
            {/* N Eşit Bölme */}
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-1 rounded border border-slate-800 bg-slate-900 px-1 py-0.5">
                <button
                  type="button"
                  aria-label="Bölme adedini azalt"
                  onClick={() => setSplitCountInput((v) => Math.max(2, v - 1))}
                  className="inline-flex min-h-6 min-w-6 items-center justify-center rounded text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  <Minus className="h-3 w-3" aria-hidden="true" />
                </button>
                <span className="w-5 text-center font-mono text-xs font-bold text-amber-300">
                  {splitCountInput}
                </span>
                <button
                  type="button"
                  aria-label="Bölme adedini artır"
                  onClick={() => setSplitCountInput((v) => Math.min(8, v + 1))}
                  className="inline-flex min-h-6 min-w-6 items-center justify-center rounded text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  <Plus className="h-3 w-3" aria-hidden="true" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => divideCellIntoN(firstCell.id, 'vertical', splitCountInput)}
                className="min-h-6 flex-1 rounded border border-amber-500/40 bg-amber-500/15 px-2 py-1 font-semibold text-amber-200 hover:bg-amber-500/25"
              >
                {splitCountInput} Dikey Böl
              </button>
              <button
                type="button"
                onClick={() => divideCellIntoN(firstCell.id, 'horizontal', splitCountInput)}
                className="min-h-6 flex-1 rounded border border-sky-500/40 bg-sky-500/15 px-2 py-1 font-semibold text-sky-200 hover:bg-sky-500/25"
              >
                {splitCountInput} Yatay Böl
              </button>
            </div>

            {/* 32 mm Raf Pim Adımı */}
            {firstCell.insert?.type === 'shelfStack' && firstCell.insert.adjustable && (
              <div className="space-y-1 rounded border border-slate-800 bg-slate-900/70 p-2 text-slate-300">
                <p>32 mm raf adımı · referans modülün alt iç yüzü</p>
                {firstCell.insert.shelfPinRows ? (
                  firstCell.subIntervalIndex !== undefined &&
                  firstCell.subIntervalIndex < firstCell.insert.shelfPinRows.length ? (
                    <div className="flex items-center gap-2">
                      <span>Aralığın üst rafı</span>
                      <button
                        type="button"
                        className="min-h-6 rounded border border-slate-600 px-2 py-0.5 text-slate-100 hover:border-sky-400"
                        onClick={() => adjustShelfGrid(firstCell.id, -1)}
                      >
                        −32 mm
                      </button>
                      <button
                        type="button"
                        className="min-h-6 rounded border border-slate-600 px-2 py-0.5 text-slate-100 hover:border-sky-400"
                        onClick={() => adjustShelfGrid(firstCell.id, 1)}
                      >
                        +32 mm
                      </button>
                    </div>
                  ) : (
                    <p>Taşımak için rafın altındaki aralığı seçin.</p>
                  )
                ) : (
                  <button
                    type="button"
                    className="rounded border border-sky-700 px-2 py-1 text-sky-200 hover:border-sky-400"
                    onClick={() => adjustShelfGrid(firstCell.id, 0)}
                  >
                    32 mm düzenini etkinleştir
                  </button>
                )}
              </div>
            )}

            {/* 3D İç Eşya Görselleştirme Geçersiz Kılma */}
            <label className="block space-y-1">
              <span className="text-slate-300">3D İç Eşya Görselleştirmesi:</span>
              <select
                aria-label="3D iç eşya görselleştirmesi"
                value={firstCell.insert?.itemPreset ?? 'auto'}
                onChange={(e) =>
                  setCellItemPreset(
                    firstCell.sourceLeafId ?? firstCell.id,
                    e.target.value as InteriorItemPreset
                  )
                }
                className="w-full rounded border border-slate-500 bg-slate-900 px-2 py-1 text-[10px] text-amber-200"
              >
                {(Object.entries(INTERIOR_ITEM_PRESET_LABELS) as [InteriorItemPreset, string][]).map(
                  ([presetId, label]) => (
                    <option key={presetId} value={presetId}>
                      {label}
                    </option>
                  )
                )}
              </select>
            </label>

            {/* Alt Aralık Ayırma & Akıllı Şablonlar & Birleştirme */}
            <div className="space-y-1 border-t border-slate-800 pt-2">
              {firstCell.subIntervalIndex !== undefined && (
                <button
                  type="button"
                  onClick={() => isolateSubInterval(firstCell.id)}
                  className="w-full rounded border border-amber-400/60 bg-amber-500/20 px-2 py-1 font-semibold text-amber-100 hover:bg-amber-500/30"
                >
                  Bu Aralığı Bağımsız Alt Hücreye Ayır
                </button>
              )}

              <button
                type="button"
                onClick={() => splitCell(firstCell.id, 'horizontal', 'topYukluk')}
                className="w-full rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-left text-emerald-200 hover:bg-emerald-500/20"
              >
                + Üst 380 mm Yüklük + Alt Ana Bölme
              </button>
              <button
                type="button"
                onClick={() => splitCell(firstCell.id, 'horizontal', 'bottomDrawers')}
                className="w-full rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-left text-amber-200 hover:bg-amber-500/20"
              >
                + Alt 640 mm Çekmece Grubu + Üst Askı Bölmesi
              </button>
              <button
                type="button"
                onClick={() => splitCell(firstCell.id, 'vertical', 'leftServiceNiche')}
                className="w-full rounded border border-sky-500/30 bg-sky-500/10 px-2 py-1 text-left text-sky-200 hover:bg-sky-500/20"
              >
                + Sol 250 mm Dar Dikey Servis Nişi + Ana Bölme
              </button>

              {firstCell.parentId && (
                <button
                  type="button"
                  onClick={() => unsplitCell(firstCell.id)}
                  className="flex w-full items-center justify-center gap-1 rounded border border-rose-500/40 bg-rose-500/10 px-2 py-1.5 font-semibold text-rose-200 hover:bg-rose-500/20"
                >
                  <Merge className="h-3 w-3" aria-hidden="true" />
                  <span>Bu Bölünmeyi Birleştir (Üst Hücreye Sıfırla)</span>
                </button>
              )}
            </div>
          </div>
        </details>
      )}
    </div>
  );
}
