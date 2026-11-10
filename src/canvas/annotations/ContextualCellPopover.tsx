import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Columns,
  DoorOpen,
  Equal,
  FolderOpen,
  Layers,
  Merge,
  Minus,
  Move,
  Plus,
  Rows,
  Scissors,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { type CSSProperties, useEffect, useState } from 'react';
import {
  HANDLE_FINISH_CATALOG,
  HANDLE_STYLE_CATALOG,
  MATERIAL_CATALOG,
} from '../materials/materialRegistry';
import { INTERIOR_ITEM_PRESET_LABELS } from '../wardrobe/WardrobeItemsPreview';
import { INSERT_REGISTRY } from '../../core/inserts/insertRegistry';
import type {
  BayFrontMode,
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
import { FrontSystemEditor, HingedOpeningCard } from '../../ui/FrontSystemEditor';
import { frontVerticalRange } from '../../core/fronts/frontGeometry';

export interface SelectionScreenBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  centerX: number;
  centerY: number;
  canvasWidth: number;
  canvasHeight: number;
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
  const splitBayDoorHorizontally = useWardrobeStore((s) => s.splitBayDoorHorizontally);
  const mergeBayDoors = useWardrobeStore((s) => s.mergeBayDoors);
  const updateCornerParam = useWardrobeStore((s) => s.updateCornerParam);
  const setCornerDoorMode = useWardrobeStore((s) => s.setCornerDoorMode);
  const setDoorMaterialAndHandle = useWardrobeStore((s) => s.setDoorMaterialAndHandle);
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

  const [splitCountInput, setSplitCountInput] = useState<number>(3);
  const [groupIntervalTarget, setGroupIntervalTarget] = useState<number>(
    Math.max(2, group.cells.length + 1)
  );
  const [mergeTargetIntervals, setMergeTargetIntervals] = useState<number>(
    Math.max(2, group.cells.length)
  );
  const [activeAxis, setActiveAxis] = useState<ResizeAxis>('Y');
  const [activeDirection, setActiveDirection] = useState<ResizeDirection>('up');
  const [targetMmInput, setTargetMmInput] = useState<string>('');
  const [neighborMmInput, setNeighborMmInput] = useState<string>('');
  const [drawerHeightInput, setDrawerHeightInput] = useState<string>('');
  const [doorSplitHeightInput, setDoorSplitHeightInput] = useState<number>(1850);
  const [showAdvancedSection, setShowAdvancedSection] = useState<boolean>(false);

  const selectionSignature = `${activeCellIds.join(',')}|${activeDrawerIds.join(',')}|${activeDoorIds.join(',')}|${doorEditorMode}`;

  useEffect(() => {
    if (group.cells.length > 0) {
      setGroupIntervalTarget(group.cells.length > 1 ? group.cells.length + 1 : 3);
      setMergeTargetIntervals(Math.max(2, group.cells.length));
      const defaultMm =
        activeAxis === 'Y'
          ? group.grossHeightMm
          : activeAxis === 'X'
            ? group.grossWidthMm
            : group.netDepthMm;
      setTargetMmInput(String(defaultMm));
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
      setNeighborMmInput(String(resizeDraft.neighborDraftMm));
      setTargetMmInput(String(resizeDraft.requestedTotalMm));
      setActiveAxis(resizeDraft.axis);
      setActiveDirection(resizeDraft.direction);
    }
  }, [resizeDraft]);

  // Ekran konumu hesaplama (her zaman sahne sınırları içinde ve yüksek z-index ile)
  const panelWidth = Math.min(328, Math.max(1, (screenBounds?.canvasWidth ?? 356) - 28));
  const estimatedPanelHeight = 420;

  let leftPx = 16;
  let topPx = 104;

  if (screenBounds && screenBounds.canvasWidth > 0) {
    const { minX, maxX, centerX, centerY, canvasWidth, canvasHeight } = screenBounds;
    const placeOnRight =
      maxX + panelWidth + 24 <= canvasWidth || centerX < canvasWidth * 0.52;

    if (placeOnRight) {
      leftPx = Math.max(0, Math.min(canvasWidth - panelWidth - 14, Math.max(14, maxX + 18)));
    } else {
      leftPx = Math.max(0, Math.min(canvasWidth - panelWidth - 14, Math.max(14, minX - panelWidth - 18)));
    }

    topPx = Math.max(
      104,
      Math.min(
        Math.max(104, canvasHeight - estimatedPanelHeight - 74),
        Math.round(centerY - estimatedPanelHeight * 0.42)
      )
    );
  }
  const panelStyle = { '--context-left': `${leftPx}px`, '--context-top': `${topPx}px`, '--context-width': `${panelWidth}px` } as CSSProperties;
  const panelClass = 'context-panel pointer-events-auto absolute z-50 flex flex-col gap-2.5 rounded-xl border border-slate-600 bg-slate-900/98 p-3 text-xs text-slate-100 shadow-2xl';
  const headingClass = 'context-heading flex items-start justify-between gap-2 border-b border-slate-700 pb-2';

  // ===========================================================================
  // MOD 1: BAĞIMSIZ KAPAK EDİTÖRÜ MODU (`doorEditorMode`)
  // ===========================================================================
  if (doorEditorMode) {
    const slidingSelection=resolved.slidingDoors?.some(d=>activeDoorIds.includes(d.id)) ||
      (!resolved.doors.some(d=>activeDoorIds.includes(d.id)) && design.fronts.some(f=>f.type==='sliding'&&f.bayIds.includes(selectedBayId??'')));
    if(slidingSelection) return <section aria-label="Sürgülü kapak düzenleyicisi" style={panelStyle} onPointerDown={e=>e.stopPropagation()} onClick={e=>e.stopPropagation()} onWheel={e=>e.stopPropagation()} className={panelClass}>
      <div className={headingClass}><h2 className="font-semibold text-sky-200">Sürgülü kapak editörü</h2><button aria-label="Kapak editörünü kapat" className="rounded border border-slate-600 p-1" onClick={()=>setDoorEditorMode(false)}><X size={16}/></button></div><FrontSystemEditor compact/>
    </section>;
    const selectedDoor =
      resolved.doors.find((d) => d.id === activeDoorIds[0]) ??
      resolved.doors.find((d) => d.bayId === selectedBayId) ??
      null;
    if (selectedDoor?.isCornerDoor) {
      const alternate = selectedDoor.opening?.alternative;
      return <section aria-label="Köşe kapak düzenleyicisi" style={panelStyle} className={panelClass}
        onPointerDown={e=>e.stopPropagation()} onClick={e=>e.stopPropagation()} onWheel={e=>e.stopPropagation()}>
        <div className={headingClass}><h2 className="font-semibold text-amber-200">{selectedDoor.label}</h2><button aria-label="Kapak editörünü kapat" className="rounded border border-slate-600 p-1" onClick={()=>setDoorEditorMode(false)}><X size={16}/></button></div>
        <HingedOpeningCard door={selectedDoor} applyAlternative={alternate ? () => setCornerDoorMode(alternate.side) : undefined} />
        <label className="space-y-1">Köşe menteşe yönü
          <select className="w-full rounded border border-slate-700 bg-slate-950 p-2" value={selectedDoor.hingeSide} onChange={e=>setCornerDoorMode(e.target.value as 'left'|'right'|'open')}>
            <option value="left">Sol menteşe</option><option value="right">Sağ menteşe</option><option value="open">Açık köşe</option>
          </select>
        </label>
        <button type="button" className="rounded border border-sky-700 bg-sky-950 p-2" onClick={() => toggleDoor(selectedDoor.id)}>{openDoorIds[selectedDoor.id] ? 'Köşe kapağını kapat' : 'Köşe kapağını aç'}</button>
      </section>;
    }
    const targetBay =
      resolved.bays.find((b) => b.id === (selectedDoor?.bayId ?? selectedBayId)) ??
      resolved.bays[0] ??
      null;

    if (!targetBay) return null;

    const explicitFrontsForBay = design.fronts.filter((f) => f.bayIds.includes(targetBay.id));
    const bayDoors = resolved.doors.filter((d) => d.bayIds.includes(targetBay.id));
    const run = design.runs.find(run => run.id === targetBay.runId)!;
    const activeFront =
      (selectedDoor?.frontId
        ? design.fronts.find((f) => f.id === selectedDoor.frontId)
        : explicitFrontsForBay[0]) ?? null;
    const currentMode: BayFrontMode = activeFront
      ? activeFront.type === 'open' ? 'open' : activeFront.hingeSide === 'double' ? 'double'
        : activeFront.hingeSide === 'right' ? 'singleRight' : activeFront.hingeSide === 'auto' ? 'auto' : 'singleLeft'
      : targetBay.frontMode;
    const alternate = selectedDoor?.opening?.alternative;

    return (
      <div
        style={panelStyle}
        role="region" aria-label="Kapak düzenleyicisi"
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        className={panelClass}
      >
        <div className={headingClass}>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <DoorOpen className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span className="font-bold text-amber-300">
                Kapak Editörü — {targetBay.label}
              </span>
            </div>
            <div className="mt-0.5 font-mono text-[10px] text-slate-300">
              {selectedDoor ? (
                <span>
                  Seçili Kanat: <strong className="text-amber-300">{selectedDoor.widthMm}</strong> ×{' '}
                  <strong className="text-sky-300">{selectedDoor.heightMm}</strong> ×{' '}
                  <strong className="text-emerald-300">{selectedDoor.thicknessMm}</strong> mm
                </span>
              ) : (
                <span>Bölme Dış Genişlik: {targetBay.outerWidthMm} mm (Kapaksız / Açık)</span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDoorEditorMode(false)}
            title="Kapak Düzenleme Modundan Çık (Esc)"
            className="rounded-md border border-slate-700 bg-slate-800/90 p-1 text-slate-300 hover:bg-slate-700 hover:text-white shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        {selectedDoor && <HingedOpeningCard door={selectedDoor} applyAlternative={alternate
          ? () => updateDoorFrontConfig(targetBay.id, activeFront?.id, alternate.side === 'left' ? 'singleLeft' : 'singleRight', selectedDoor.maxAngleDeg) : undefined} />}
        {selectedDoor && <button type="button" className="rounded border border-sky-700 bg-sky-950 px-2 py-2 text-sky-200"
          onClick={() => toggleDoor(selectedDoor.id)}>{openDoorIds[selectedDoor.id] ? 'Seçili kanadı kapat' : 'Seçili kanadı aç'}</button>}
        <details className="border-b border-slate-700 pb-2"><summary className="cursor-pointer text-sky-200">Kapak türü, kapsam ve sürgü sistemi</summary><FrontSystemEditor compact/></details>

        {/* 1. KAPAK DÜZENİ VE MENTEŞE YÖNÜ */}
        <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-950/90 p-2.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-300">
            1. Kapak Tipi & Açılış Yönü
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            {(
              [
                { mode: 'auto', label: 'Otomatik kanat' },
                { mode: 'singleLeft', label: 'Tek Kapak (Sol)' },
                { mode: 'singleRight', label: 'Tek Kapak (Sağ)' },
                { mode: 'double', label: 'Çift Kapak (Sol+Sağ)' },
                { mode: 'open', label: 'Kapaksız (Açık)' },
              ] as { mode: BayFrontMode; label: string }[]
            ).map((opt) => {
              const isActive = currentMode === opt.mode;
              return (
                <button
                  key={opt.mode}
                  type="button"
                  onClick={() =>
                    updateDoorFrontConfig(
                      targetBay.id,
                      activeFront?.id,
                      opt.mode,
                      selectedDoor?.maxAngleDeg ?? targetBay.hingeAngleDeg
                    )
                  }
                  className={`rounded border px-2 py-1.5 font-medium transition ${
                    isActive
                      ? 'border-amber-400 bg-amber-500/20 text-amber-200 font-semibold'
                      : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <div className="space-y-1 pt-1">
            <span className="text-[10px] text-slate-400">Menteşe Açısı:</span>
            <div className="grid grid-cols-3 gap-1 text-[10px]">
              {([110, 155, 165] as const).map((deg) => {
                const currentDeg =
                  activeFront?.openingAngleDeg ??
                  selectedDoor?.maxAngleDeg ??
                  targetBay.hingeAngleDeg;
                return (
                  <button
                    key={deg}
                    type="button"
                    onClick={() =>
                      updateDoorFrontConfig(
                        targetBay.id,
                        activeFront?.id,
                        currentMode === 'open' ? 'auto' : currentMode,
                        deg
                      )
                    }
                    className={`rounded border py-1 font-mono font-semibold ${
                      currentDeg === deg
                        ? 'border-sky-400 bg-sky-500/25 text-sky-200'
                        : 'border-slate-800 bg-slate-900 text-slate-400'
                    }`}
                  >
                    {deg}° {deg === 155 ? '(İç Çek.)' : ''}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 2. KAPAĞI YATAY BÖL (ÜST YÜKLÜK + ALT GÖVDE) VEYA BİRLEŞTİR */}
        <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-950/90 p-2.5">
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-sky-300">
            <span>2. Kısmi / Bölünmüş Kapak (Yüklük & Alt)</span>
            <span className="font-mono text-[9px] text-slate-400">
              {explicitFrontsForBay.length > 1
                ? `${explicitFrontsForBay.length} Parça`
                : 'Tam Boy'}
            </span>
          </div>

          {explicitFrontsForBay.length <= 1 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="text-slate-300">Bölme Yüksekliği (Y):</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step={20}
                    min={400}
                    max={2200}
                    value={doorSplitHeightInput}
                    onChange={(e) =>
                      setDoorSplitHeightInput(Math.max(300, Number(e.target.value) || 1850))
                    }
                    className="w-20 rounded border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-xs font-bold text-white"
                  />
                  <span className="font-mono text-[10px] text-slate-400">mm</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => splitBayDoorHorizontally(targetBay.id, doorSplitHeightInput)}
                className="flex w-full items-center justify-center gap-1.5 rounded border border-sky-400/60 bg-sky-500/20 px-2.5 py-1.5 text-[11px] font-bold text-sky-200 hover:bg-sky-500/30 transition"
              >
                <Scissors className="h-3.5 w-3.5" />
                Kapağı Yatay Böl (Alt Gövde + Üst Yüklük)
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {[...explicitFrontsForBay].sort((a, b) => frontVerticalRange(run, a).start - frontVerticalRange(run, b).start).map((fr, idx) => (
                <div
                  key={fr.id}
                  className="rounded border border-slate-800 bg-slate-900 p-2 space-y-1 text-[10px]"
                >
                  <div className="flex items-center justify-between font-semibold text-amber-200">
                    <span>{idx === 0 ? 'Alt Kapak Grubu' : 'Üst Yüklük Kapağı'}</span>
                    <span className="font-mono text-sky-300">
                      {frontVerticalRange(run, fr).start} – {frontVerticalRange(run, fr).end} mm
                    </span>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => mergeBayDoors(targetBay.id)}
                className="flex w-full items-center justify-center gap-1.5 rounded border border-amber-400/60 bg-amber-500/20 px-2.5 py-1.5 text-[11px] font-bold text-amber-200 hover:bg-amber-500/30 transition"
              >
                <Merge className="h-3.5 w-3.5" />
                Bölünmüş Kapakları Tek Kapakta Birleştir
              </button>
            </div>
          )}
        </div>

        {/* 4. KAPAK YÜZEY MALZEMESİ VE KULP ÖZELLEŞTİRME (AŞAMA 3) */}
        <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-950/90 p-2.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-300">
            3. Kapak Malzemesi ve Kulp
          </div>

          <label className="block space-y-1 text-[10px]">
            <span className="text-slate-400">Bu Kapağın Yüzey Malzemesi:</span>
            <select
              value={
                activeFront?.materialId ??
                targetBay.doorMaterialId ??
                targetBay.frontMaterialId ??
                ''
              }
              onChange={(e) => {
                const val = (e.target.value || null) as MaterialId | null;
                setDoorMaterialAndHandle(targetBay.id, activeFront?.id, val, undefined);
              }}
              className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-white"
            >
              <option value="">
                Genel Kapak Malzemesini Kullan (
                {MATERIAL_CATALOG[design.materials.frontMaterialId].name})
              </option>
              {Object.values(MATERIAL_CATALOG).map((mat) => (
                <option key={mat.id} value={mat.id}>
                  {mat.name} ({mat.categoryLabel})
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-1.5 text-[10px]">
            <label className="space-y-1">
              <span className="text-slate-400">Kulp Modeli:</span>
              <select
                value={
                  activeFront?.handleConfig?.styleId ??
                  targetBay.handleConfig?.styleId ??
                  design.materials.doorHandleConfig?.styleId ??
                  'barModern'
                }
                onChange={(e) =>
                  setDoorMaterialAndHandle(targetBay.id, activeFront?.id, undefined, {
                    styleId: e.target.value as HandleStyleId,
                  })
                }
                className="w-full rounded border border-slate-700 bg-slate-900 px-1.5 py-1 text-[10px] text-white"
              >
                {Object.values(HANDLE_STYLE_CATALOG).map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-slate-400">Kulp Rengi:</span>
              <select
                value={
                  activeFront?.handleConfig?.finishId ??
                  targetBay.handleConfig?.finishId ??
                  design.materials.doorHandleConfig?.finishId ??
                  'matteBlack'
                }
                onChange={(e) =>
                  setDoorMaterialAndHandle(targetBay.id, activeFront?.id, undefined, {
                    finishId: e.target.value as HandleFinishId,
                  })
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
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-[10px]">
            <label className="space-y-1">
              <span className="text-slate-400">Konum:</span>
              <select
                value={
                  activeFront?.handleConfig?.placement ??
                  targetBay.handleConfig?.placement ??
                  design.materials.doorHandleConfig?.placement ??
                  'middle'
                }
                onChange={(e) =>
                  setDoorMaterialAndHandle(targetBay.id, activeFront?.id, undefined, {
                    placement: e.target.value as 'middle' | 'top' | 'bottom' | 'verticalEdge',
                  })
                }
                className="w-full rounded border border-slate-700 bg-slate-900 px-1.5 py-1 text-[10px] text-white"
              >
                <option value="middle">Orta Hiza</option>
                <option value="top">Üst Hiza</option>
                <option value="bottom">Alt Hiza</option>
                <option value="verticalEdge">Tam Boy Kenar</option>
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-slate-400">Yön:</span>
              <select
                value={
                  activeFront?.handleConfig?.orientation ??
                  targetBay.handleConfig?.orientation ??
                  design.materials.doorHandleConfig?.orientation ??
                  'vertical'
                }
                onChange={(e) =>
                  setDoorMaterialAndHandle(targetBay.id, activeFront?.id, undefined, {
                    orientation: e.target.value as 'vertical' | 'horizontal',
                  })
                }
                className="w-full rounded border border-slate-700 bg-slate-900 px-1.5 py-1 text-[10px] text-white"
              >
                <option value="vertical">Dikey</option>
                <option value="horizontal">Yatay</option>
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-slate-400">Boy (mm):</span>
              <select
                value={
                  activeFront?.handleConfig?.lengthMm ??
                  targetBay.handleConfig?.lengthMm ??
                  design.materials.doorHandleConfig?.lengthMm ??
                  160
                }
                onChange={(e) =>
                  setDoorMaterialAndHandle(targetBay.id, activeFront?.id, undefined, {
                    lengthMm: Number(e.target.value),
                  })
                }
                className="w-full rounded border border-slate-700 bg-slate-900 px-1.5 py-1 font-mono text-[10px] text-white"
              >
                <option value={96}>96 mm</option>
                <option value={160}>160 mm</option>
                <option value={220}>220 mm</option>
                <option value={320}>320 mm</option>
                <option value={600}>600 mm</option>
                <option value={1100}>1100 mm</option>
              </select>
            </label>
          </div>
        </div>

        {/* 5. KİNEMATİK AÇ / KAPAT TESTİ */}
        {bayDoors.length > 0 && (
          <div className="space-y-1 rounded-lg border border-slate-800 bg-slate-950/90 p-2.5">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Kapak Kanatlarını Test Et (Aç / Kapat)
            </div>
            <div className="grid grid-cols-1 gap-1">
              {bayDoors.map((d) => {
                const isOpen = Boolean(openDoorIds[d.id]);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleDoor(d.id)}
                    className={`flex items-center justify-between rounded border px-2 py-1 text-[11px] font-medium ${
                      isOpen
                        ? 'border-amber-500/60 bg-amber-500/20 text-amber-200'
                        : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span className="truncate">{d.label}</span>
                    <span className="font-mono text-[10px] text-amber-300">
                      {isOpen ? 'Kapat' : 'Aç'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ===========================================================================
  // MOD 2: BAĞIMSIZ ÇEKMECE SEÇİMİ VE DÜZENLEME MODU (`selectedDrawerIds`)
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

    const handleApplyDrawerHeight = (customMm?: number) => {
      const val = customMm !== undefined ? customMm : Number(drawerHeightInput.trim());
      if (!Number.isFinite(val) || val < 80) return;
      updateSelectedDrawerHeight(firstDrw.id, Math.round(val));
    };

    return (
      <div
        style={panelStyle}
        role="region" aria-label="Çekmece düzenleyicisi"
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        className={panelClass}
      >
        <div className={headingClass}>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <FolderOpen className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span className="font-bold text-amber-300 truncate">
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
            title="Çekmece Seçimini Temizle (Esc)"
            className="rounded-md border border-slate-700 bg-slate-800/90 p-1 text-slate-300 hover:bg-slate-700 hover:text-white shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Gruptaki Tüm Çekmeceleri Seç veya Eşitle */}
        {bankDrawers.length > 1 && (
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <button
              type="button"
              onClick={() => {
                for (const d of bankDrawers) {
                  if (!activeDrawerIds.includes(d.id)) {
                    selectDrawer(d.id, d.cellId, d.bayId, true);
                  }
                }
              }}
              className="flex items-center justify-center gap-1 rounded border border-sky-500/40 bg-sky-500/15 px-2 py-1.5 font-medium text-sky-200 hover:bg-sky-500/25"
            >
              <Layers className="h-3.5 w-3.5" />
              Tümünü Seç ({bankDrawers.length})
            </button>
            <button
              type="button"
              onClick={() => equalizeDrawerBankHeights(firstDrw.cellId)}
              className="flex items-center justify-center gap-1 rounded border border-emerald-500/40 bg-emerald-500/15 px-2 py-1.5 font-semibold text-emerald-200 hover:bg-emerald-500/25"
            >
              <Equal className="h-3.5 w-3.5" />
              Çekmeceleri Eşitle
            </button>
          </div>
        )}

        {/* 1. SEÇİLİ ÇEKMECE ÖN YÜKSEKLİĞİ (`Y`) DÜZENLEME */}
        {selectedDrawers.length === 1 && (
          <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-950/90 p-2.5">
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-sky-300">
              <span>Çekmece #{firstDrw.drawerIndex + 1} Ön Yüksekliği (Y)</span>
              <span className="font-mono text-[9px] text-slate-400">
                Grup: {firstDrw.parentBankHeightMm} mm
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleApplyDrawerHeight(firstDrw.heightMm - 20)}
                className="rounded border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-xs text-slate-200 hover:bg-slate-800"
              >
                -20
              </button>
              <input
                type="number"
                step={10}
                min={80}
                max={Math.max(120, firstDrw.parentBankHeightMm - 80)}
                value={drawerHeightInput}
                onChange={(e) => setDrawerHeightInput(e.target.value)}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleApplyDrawerHeight();
                  }
                }}
                className="w-20 rounded border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-xs font-bold text-white"
              />
              <span className="font-mono text-[10px] text-slate-400">mm</span>
              <button
                type="button"
                onClick={() => handleApplyDrawerHeight(firstDrw.heightMm + 20)}
                className="rounded border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-xs text-slate-200 hover:bg-slate-800"
              >
                +20
              </button>
              <button
                type="button"
                onClick={() => handleApplyDrawerHeight()}
                className="flex-1 rounded bg-sky-500 px-2 py-1 text-[11px] font-bold text-slate-950 hover:bg-sky-400"
              >
                Uygula
              </button>
            </div>
            <div className="text-[10px] text-slate-400 leading-snug">
              Not: Bu çekmecenin yüksekliği değiştiğinde aynı gruptaki diğer çekmeceler toplam kasa
              yüksekliğini ({firstDrw.parentBankHeightMm} mm) koruyacak şekilde otomatik dengelenir.
            </div>
          </div>
        )}

        {/* 2. ÇEKMECE GRUBU ADEDİ VE İÇ / DIŞ ÇEKMECE AYARI */}
        {parentCell && parentCell.insert?.type === 'drawerBank' && (
          <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-950/90 p-2.5">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-300">
              Çekmece Grubu Ayarları
            </div>
            <label className="flex items-center justify-between gap-2 text-[11px] text-slate-300">
              Çekmece kızak türü
              <select
                value={parentCell.insert.drawerSlide ?? ''}
                onChange={(e) => setCellInsert(parentCell.sourceLeafId ?? parentCell.id, {
                  ...parentCell.insert!,
                  drawerSlide: (e.target.value || undefined) as 'partial' | 'full' | undefined,
                })}
                className="rounded border border-slate-700 bg-slate-900 px-2 py-1"
              >
                <option value="">Önceki düzen · %82</option>
                <option value="partial">Kısmi açılım · %80</option>
                <option value="full">Tam açılım · %100</option>
              </select>
            </label>
            <div className="flex items-center justify-between gap-2 text-[11px]">
              <span className="text-slate-300">Gruptaki Çekmece Adedi:</span>
              <div className="flex items-center gap-1 rounded border border-slate-800 bg-slate-900 px-1.5 py-0.5">
                <button
                  type="button"
                  onClick={() =>
                    setCellInsert(parentCell.sourceLeafId ?? parentCell.id, {
                      ...parentCell.insert!,
                      drawerCount: Math.max(1, (parentCell.insert?.drawerCount ?? 3) - 1),
                      drawerFrontHeightsMm: undefined,
                    })
                  }
                  className="p-0.5 text-slate-400 hover:text-white"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-6 text-center font-mono font-bold text-amber-300">
                  {parentCell.insert.drawerCount ?? 3}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setCellInsert(parentCell.sourceLeafId ?? parentCell.id, {
                      ...parentCell.insert!,
                      drawerCount: Math.min(6, (parentCell.insert?.drawerCount ?? 3) + 1),
                      drawerFrontHeightsMm: undefined,
                    })
                  }
                  className="p-0.5 text-slate-400 hover:text-white"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 text-[11px]">
              <span className="text-slate-300">Çekmece Konumu:</span>
              <button
                type="button"
                onClick={() =>
                  setCellInsert(parentCell.sourceLeafId ?? parentCell.id, {
                    ...parentCell.insert!,
                    isInternalDrawer: !parentCell.insert?.isInternalDrawer,
                  })
                }
                className={`rounded border px-2.5 py-1 text-[11px] font-semibold ${
                  parentCell.insert.isInternalDrawer
                    ? 'border-amber-500/50 bg-amber-500/20 text-amber-200'
                    : 'border-emerald-500/50 bg-emerald-500/20 text-emerald-200'
                }`}
              >
                {parentCell.insert.isInternalDrawer
                  ? 'İç Çekmece (Kapak Arkası)'
                  : 'Dış Çekmece (Cephede)'}
              </button>
            </div>
          </div>
        )}

        {/* 3. ÇEKMECE ÖN YÜZ MALZEMESİ VE KULP ÖZELLEŞTİRME (AŞAMA 3) */}
        {parentCell && (
          <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-950/90 p-2.5 text-[10px]">
            <div className="font-semibold uppercase tracking-wider text-amber-300">
              3. Çekmece Malzemesi & Kulp Özelleştirme
            </div>

            <label className="block space-y-1">
              <span className="text-slate-400">Çekmece Ön Yüz Malzemesi:</span>
              <select
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
                className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] text-white"
              >
                <option value="">
                  Genel Çekmece Malzemesini Kullan (
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
                <span className="text-slate-400">Kulp Modeli:</span>
                <select
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
                  className="w-full rounded border border-slate-700 bg-slate-900 px-1.5 py-1 text-[10px] text-white"
                >
                  {Object.values(HANDLE_STYLE_CATALOG).map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-slate-400">Kulp Rengi:</span>
                <select
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
                  className="w-full rounded border border-slate-700 bg-slate-900 px-1.5 py-1 text-[10px] text-white"
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
                <span className="text-slate-400">Konum:</span>
                <select
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
        )}

        {/* 4. 5 PANELLİ KASA NET İÇ HACİM VE KİNEMATİK AÇ/KAPAT */}
        <div className="space-y-1.5 rounded-lg border border-slate-800 bg-slate-950/90 p-2.5 text-[10px]">
          <div className="flex items-center justify-between text-slate-300">
            <span>5 Panelli Kasa Net İç Hacim:</span>
            <span className="font-mono font-bold text-sky-300">
              {firstDrw.innerWidthMm}×{firstDrw.innerDepthMm}×{firstDrw.innerHeightMm} mm
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Kasa Malzeme Kalınlıkları:</span>
            <span className="font-mono text-emerald-300">
              Yan: {firstDrw.sideThicknessMm} mm · Taban: {firstDrw.bottomThicknessMm} mm
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              for (const d of selectedDrawers) {
                toggleDrawer(d.id);
              }
            }}
            className="mt-1 flex w-full items-center justify-center gap-1.5 rounded border border-amber-400/60 bg-amber-500/20 px-2.5 py-1.5 text-[11px] font-bold text-amber-200 hover:bg-amber-500/30 transition"
          >
            <FolderOpen className="h-3.5 w-3.5" />
            {openDrawerIds[firstDrw.id]
              ? 'Seçili Çekmeceyi Kapat'
              : 'Seçili Çekmeceyi Aç (Kinematik Test)'}
          </button>
        </div>
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

  const siblingIntervalsOfFirst = firstCell.sourceLeafId
    ? resolved.cells.filter((c) => c.sourceLeafId === firstCell.sourceLeafId)
    : [];

  const handleTriggerResizePreview = (customValMm?: number, customDir?: ResizeDirection) => {
    const val = customValMm !== undefined ? customValMm : Number(targetMmInput.trim());
    if (!Number.isFinite(val) || Number.isNaN(val) || val < 60) return;
    startOrUpdateResizeDraft(activeAxis, customDir ?? activeDirection, Math.round(val));
  };

  return (
    <div
      style={panelStyle}
      role="region" aria-label={group.isSingle ? 'Raf hücresi düzenleyicisi' : 'Çoklu hücre düzenleyicisi'}
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
            <span className="inline-flex h-2 w-2 rounded-full bg-amber-400 shrink-0" />
            <span className="font-bold text-amber-300">
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
          title="Seçimi Temizle (Esc)"
          className="rounded-md border border-slate-700 bg-slate-800/90 p-1 text-slate-300 hover:bg-slate-700 hover:text-white shrink-0"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Tek bir raf aralığı seçiliyse tüm raf grubunu tek tıkla seçme kısayolu */}
      {group.isSingle && siblingIntervalsOfFirst.length > 1 && (
        <button
          type="button"
          onClick={() => setSelectedCells(siblingIntervalsOfFirst.map((c) => c.id))}
          className="flex items-center justify-between rounded-lg border border-sky-500/40 bg-sky-500/15 px-2.5 py-1.5 text-[11px] font-medium text-sky-200 hover:bg-sky-500/25 transition"
        >
          <span className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-sky-400" />
            <span>Grubun Tüm Aralıklarını Seç</span>
          </span>
          <span className="rounded bg-sky-500/30 px-1.5 py-0.5 font-mono text-[10px] font-bold">
            {siblingIntervalsOfFirst.length} Aralık
          </span>
        </button>
      )}

      {/* BEŞGEN KÖŞE ÖZEL KONTROL KARTI */}
      {group.isCornerSelection && activeJunction && (
        <div className="space-y-2 rounded-lg border border-amber-500/40 bg-slate-950/90 p-2.5">
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-amber-300">
            <span>Beşgen Köşe Modülü & Raf Ayarları</span>
            <span className="font-mono text-[9px] text-slate-400">
              {activeJunction.shelvesCount + 1} Aralık
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-[10px]">
            <label className="space-y-0.5">
              <span className="text-slate-400">Raf Adedi</span>
              <input
                type="number"
                min={1}
                max={7}
                value={activeJunction.shelvesCount}
                onChange={(e) =>
                  updateCornerParam('shelvesCount', Math.max(1, Math.min(7, Number(e.target.value) || 4)))
                }
                className="w-full rounded border border-slate-700 bg-slate-900 px-1.5 py-1 font-mono text-xs text-white"
              />
            </label>
            <label className="space-y-0.5">
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
                className="w-full rounded border border-slate-700 bg-slate-900 px-1.5 py-1 font-mono text-xs text-white"
              />
            </label>
            <label className="space-y-0.5">
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
                className="w-full rounded border border-slate-700 bg-slate-900 px-1.5 py-1 font-mono text-xs text-white"
              />
            </label>
          </div>
          {activeJunction.intervalHeightsMm && activeJunction.intervalHeightsMm.length > 0 && (
            <button
              type="button"
              onClick={() => updateCornerParam('shelvesCount', activeJunction.shelvesCount)}
              className="flex w-full items-center justify-center gap-1 rounded border border-sky-500/40 bg-sky-500/15 px-2 py-1 text-[10px] font-semibold text-sky-200 hover:bg-sky-500/25"
            >
              <Equal className="h-3 w-3" />
              Köşe Raf Aralıklarını Eşitle
            </button>
          )}
        </div>
      )}

      {/* 2. BÖLME, ÇOKLU RAF GRUBU & ARALIK SAYISI DÖNÜŞTÜRME KONTROLLERİ */}
      {group.isSingle && firstCell.insert?.type === 'shelfStack' && firstCell.insert.adjustable && (
        <div className="space-y-1 rounded-lg border border-slate-800 bg-slate-950/90 p-2.5 text-[11px] text-slate-300">
          <p>32 mm raf adımı · referans modülün alt iç yüzü</p>
          {firstCell.insert.shelfPinRows ? (
            firstCell.subIntervalIndex !== undefined && firstCell.subIntervalIndex < firstCell.insert.shelfPinRows.length
              ? <div className="flex items-center gap-2">
                  <span>Aralığın üst rafı</span>
                  <button type="button" className="rounded border border-slate-600 px-2 py-1"
                    onClick={() => adjustShelfGrid(firstCell.id, -1)}>−32 mm</button>
                  <button type="button" className="rounded border border-slate-600 px-2 py-1"
                    onClick={() => adjustShelfGrid(firstCell.id, 1)}>+32 mm</button>
                </div>
              : <p>Taşımak için rafın altındaki aralığı seçin.</p>
          ) : (
            <button type="button" className="rounded border border-sky-700 px-2 py-1 text-sky-200"
              onClick={() => adjustShelfGrid(firstCell.id, 0)}>32 mm düzenini etkinleştir</button>
          )}
        </div>
      )}
      {!group.isCornerSelection && (
        <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-950/90 p-2.5">
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            <span>
              {group.isSingle
                ? 'Hücre Bölme İşlemleri'
                : group.isMultiShelfGroupSelection
                  ? 'Çoklu Raf Grubu Toplu Düzenleme'
                  : 'Toplu Aralık & Bölme İşlemleri'}
            </span>
            <span className="font-mono text-[9px] text-amber-300">
              {resolved.panelThicknessMm} mm Bölücü
            </span>
          </div>

          {group.isSingle ? (
            <>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => splitCell(firstCell.id, 'vertical', 'equal')}
                  className="flex items-center justify-center gap-1 rounded border border-slate-700 bg-slate-900 px-2 py-1.5 font-medium text-slate-200 hover:border-amber-500/60 hover:bg-slate-800"
                >
                  <Columns className="h-3.5 w-3.5 text-amber-400" />
                  Dikey Böl (2)
                </button>
                <button
                  type="button"
                  onClick={() => splitCell(firstCell.id, 'horizontal', 'equal')}
                  className="flex items-center justify-center gap-1 rounded border border-slate-700 bg-slate-900 px-2 py-1.5 font-medium text-slate-200 hover:border-sky-500/60 hover:bg-slate-800"
                >
                  <Rows className="h-3.5 w-3.5 text-sky-400" />
                  Yatay Böl (2)
                </button>
              </div>

              <div className="flex items-center justify-between gap-1.5 pt-0.5 text-[11px]">
                <div className="flex items-center gap-1 rounded border border-slate-800 bg-slate-900 px-1.5 py-0.5">
                  <button
                    type="button"
                    onClick={() => setSplitCountInput((v) => Math.max(2, v - 1))}
                    className="p-0.5 text-slate-400 hover:text-white"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-5 text-center font-mono font-bold text-amber-300">
                    {splitCountInput}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSplitCountInput((v) => Math.min(8, v + 1))}
                    className="p-0.5 text-slate-400 hover:text-white"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => divideCellIntoN(firstCell.id, 'vertical', splitCountInput)}
                  className="flex-1 rounded border border-amber-500/40 bg-amber-500/15 px-2 py-1 text-[10px] font-semibold text-amber-200 hover:bg-amber-500/25"
                >
                  {splitCountInput} Dikey Böl
                </button>
                <button
                  type="button"
                  onClick={() => divideCellIntoN(firstCell.id, 'horizontal', splitCountInput)}
                  className="flex-1 rounded border border-sky-500/40 bg-sky-500/15 px-2 py-1 text-[10px] font-semibold text-sky-200 hover:bg-sky-500/25"
                >
                  {splitCountInput} Yatay Böl
                </button>
              </div>
            </>
          ) : group.isMultiShelfGroupSelection ? (
            /* AŞAMA 2.4 BÖLÜM 3: FARKLI RAF GRUPLARINDAN SEÇİLEN BÖLMELERİN TOPLU DÜZENLENMESİ */
            <div className="space-y-2">
              <div className="rounded border border-sky-500/30 bg-sky-950/30 p-2 space-y-1 text-[10px]">
                <div className="font-semibold text-sky-200">
                  Seçili Raf Grupları ({group.shelfGroups.length} grup):
                </div>
                {group.shelfGroups.map((sg) => (
                  <div key={sg.groupKey} className="flex items-center justify-between text-slate-300">
                    <span className="truncate">{sg.groupLabel}</span>
                    <span className="font-mono text-amber-300">
                      {sg.cells.length} aralık ({sg.grossHeightMm}mm)
                    </span>
                  </div>
                ))}
              </div>

              {/* 1. Ayrı Ayrı Eşit Dağıt */}
              <button
                type="button"
                onClick={equalizeSelectedCells}
                className="flex w-full items-center justify-center gap-1.5 rounded border border-sky-500/50 bg-sky-500/20 px-2.5 py-1.5 text-[11px] font-semibold text-sky-200 hover:bg-sky-500/30"
              >
                <Equal className="h-3.5 w-3.5" />
                Her Grubu Kendi İçinde Eşit Dağıt
              </button>

              {/* 2. Her Grubu N Eşit Aralığa Dönüştür */}
              <div className="flex items-center justify-between gap-1.5 text-[11px]">
                <span className="text-slate-400">Grup Başına Aralık:</span>
                <div className="flex items-center gap-1 rounded border border-slate-800 bg-slate-900 px-1.5 py-0.5">
                  <button
                    type="button"
                    onClick={() => setGroupIntervalTarget((v) => Math.max(1, v - 1))}
                    className="p-0.5 text-slate-400 hover:text-white"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-6 text-center font-mono font-bold text-amber-300">
                    {groupIntervalTarget}
                  </span>
                  <button
                    type="button"
                    onClick={() => setGroupIntervalTarget((v) => Math.min(12, v + 1))}
                    className="p-0.5 text-slate-400 hover:text-white"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setContiguousGroupIntervalCount(groupIntervalTarget)}
                  className="rounded border border-amber-500/50 bg-amber-500/20 px-2 py-1 text-[10px] font-bold text-amber-200 hover:bg-amber-500/30"
                >
                  Her Grubu {groupIntervalTarget} Aralık Yap
                </button>
              </div>

              {/* 3. Grupları Birleştir ve Yeniden Böl (Fiziksel olarak komşu ise) */}
              {group.canMergeShelfGroups ? (
                <div className="space-y-1.5 rounded border border-emerald-500/40 bg-emerald-950/30 p-2">
                  <div className="text-[10px] font-semibold text-emerald-300">
                    Grupları Tek Hacimde Birleştir ve Yeniden Böl:
                  </div>
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1 rounded border border-slate-800 bg-slate-900 px-1.5 py-0.5">
                      <button
                        type="button"
                        onClick={() => setMergeTargetIntervals((v) => Math.max(1, v - 1))}
                        className="p-0.5 text-slate-400 hover:text-white"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center font-mono text-xs font-bold text-emerald-300">
                        {mergeTargetIntervals}
                      </span>
                      <button
                        type="button"
                        onClick={() => setMergeTargetIntervals((v) => Math.min(14, v + 1))}
                        className="p-0.5 text-slate-400 hover:text-white"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => mergeAndResplitSelectedGroups(mergeTargetIntervals)}
                      className="flex-1 flex items-center justify-center gap-1 rounded bg-emerald-500 px-2.5 py-1 text-[10px] font-bold text-slate-950 hover:bg-emerald-400 transition"
                    >
                      <Merge className="h-3.5 w-3.5" />
                      Birleştir ve {mergeTargetIntervals} Eşit Aralığa Böl
                    </button>
                  </div>
                </div>
              ) : (
                group.cannotMergeReason && (
                  <div className="rounded border border-amber-500/30 bg-amber-500/10 p-2 text-[10px] text-amber-200 leading-relaxed">
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
                  <Equal className="h-3.5 w-3.5" />
                  Eşit Dağıt ({group.cells.length})
                </button>
                <button
                  type="button"
                  onClick={() => setContiguousGroupIntervalCount(group.cells.length + 1)}
                  className="flex items-center justify-center gap-1 rounded border border-emerald-500/50 bg-emerald-500/20 px-2 py-1.5 font-bold text-emerald-200 hover:bg-emerald-500/30"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {group.cells.length} → {group.cells.length + 1} Eşit Aralık
                </button>
              </div>

              <div className="flex items-center justify-between gap-1.5 text-[11px]">
                <span className="text-slate-400">Hedef Aralık:</span>
                <div className="flex items-center gap-1 rounded border border-slate-800 bg-slate-900 px-1.5 py-0.5">
                  <button
                    type="button"
                    onClick={() => setGroupIntervalTarget((v) => Math.max(1, v - 1))}
                    className="p-0.5 text-slate-400 hover:text-white"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={groupIntervalTarget}
                    onChange={(e) =>
                      setGroupIntervalTarget(Math.max(1, Math.min(12, Number(e.target.value) || 2)))
                    }
                    className="w-8 bg-transparent text-center font-mono text-xs font-bold text-amber-300 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setGroupIntervalTarget((v) => Math.min(12, v + 1))}
                    className="p-0.5 text-slate-400 hover:text-white"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setContiguousGroupIntervalCount(groupIntervalTarget)}
                  className="rounded border border-amber-500/50 bg-amber-500/20 px-2.5 py-1 text-[10px] font-bold text-amber-200 hover:bg-amber-500/30"
                >
                  {groupIntervalTarget} Eşit Aralığa Dönüştür
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-0.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => batchSplitSelectedCells('vertical')}
                  className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-300 hover:border-amber-500/50"
                >
                  Tümünü Dikey Böl
                </button>
                <button
                  type="button"
                  onClick={() => batchSplitSelectedCells('horizontal')}
                  className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-300 hover:border-sky-500/50"
                >
                  Tümünü Yatay Böl
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="rounded border border-amber-500/30 bg-amber-500/10 p-2 text-[10px] text-amber-200 leading-relaxed">
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

      {/* 3. HIZLI MODÜL ATAMA VE 3D EŞYA ÖNİZLEMESİ */}
      {!group.isCornerSelection && (
        <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-950/90 p-2.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
            {group.isSingle ? 'Hızlı Modül Ata' : `Toplu Modül Ata (${group.cells.length} Bölme)`}
          </div>
          <select
            value={firstCell.insert?.type ?? 'empty'}
            onChange={(e) => {
              const nextType = e.target.value as InsertType;
              batchSetSelectedCellsInsert(INSERT_REGISTRY[nextType].createDefaultConfig());
            }}
            className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] font-medium text-white"
          >
            {Object.values(INSERT_REGISTRY).map((meta) => (
              <option key={meta.type} value={meta.type}>
                {meta.shortTitle} — {meta.description}
              </option>
            ))}
          </select>

          {group.isSingle && (
            <label className="block space-y-1 pt-1 text-[10px]">
              <span className="text-slate-400">3D İç Eşya Görselleştirmesi:</span>
              <select
                value={firstCell.insert?.itemPreset ?? 'auto'}
                onChange={(e) =>
                  setCellItemPreset(
                    firstCell.sourceLeafId ?? firstCell.id,
                    e.target.value as InteriorItemPreset
                  )
                }
                className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] text-amber-200"
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
          )}
        </div>
      )}

      {/* 4. YÖNLÜ YENİDEN BOYUTLANDIRMA (`X / Y / Z`) VE KOMŞU ÇAKIŞMA ÖNİZLEMESİ */}
      {(group.isSingle || isContiguousGroup) && (
        <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-950/90 p-2.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-sky-400">
              <SlidersHorizontal className="h-3 w-3" />
              <span>
                {group.isCornerSelection
                  ? 'Köşe Raf Yüksekliği (`Y`) Boyutlandırma'
                  : 'Yönlü Boyutlandırma (`X / Y / Z`)'}
              </span>
            </span>
            <span className="text-[9px] text-slate-400">Komşu Korumalı</span>
          </div>

          {/* Eksen Seçici Sekmeler */}
          {!group.isCornerSelection && (
            <div className="grid grid-cols-3 gap-1 rounded bg-slate-900 p-1 text-[10px]">
              <button
                type="button"
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
                  onClick={() => {
                    setActiveAxis('Y');
                    setActiveDirection('up');
                    if (resizeDraft) handleTriggerResizePreview(undefined, 'up');
                  }}
                  className={`flex items-center justify-center gap-1 rounded border px-2 py-1 font-medium ${
                    activeDirection === 'up'
                      ? 'border-sky-400 bg-sky-500/20 text-sky-200 font-semibold'
                      : 'border-slate-800 bg-slate-900 text-slate-400'
                  }`}
                >
                  <ArrowUp className="h-3 w-3" />
                  Yukarı (Alt Sabit)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveAxis('Y');
                    setActiveDirection('down');
                    if (resizeDraft) handleTriggerResizePreview(undefined, 'down');
                  }}
                  className={`flex items-center justify-center gap-1 rounded border px-2 py-1 font-medium ${
                    activeDirection === 'down'
                      ? 'border-sky-400 bg-sky-500/20 text-sky-200 font-semibold'
                      : 'border-slate-800 bg-slate-900 text-slate-400'
                  }`}
                >
                  <ArrowDown className="h-3 w-3" />
                  Aşağı (Üst Sabit)
                </button>
              </>
            )}

            {!group.isCornerSelection && activeAxis === 'X' && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setActiveDirection('left');
                    if (resizeDraft) handleTriggerResizePreview(undefined, 'left');
                  }}
                  className={`flex items-center justify-center gap-1 rounded border px-2 py-1 font-medium ${
                    activeDirection === 'left'
                      ? 'border-amber-400 bg-amber-500/20 text-amber-200 font-semibold'
                      : 'border-slate-800 bg-slate-900 text-slate-400'
                  }`}
                >
                  <ArrowLeft className="h-3 w-3" />
                  Sola (Sağ Sabit)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveDirection('right');
                    if (resizeDraft) handleTriggerResizePreview(undefined, 'right');
                  }}
                  className={`flex items-center justify-center gap-1 rounded border px-2 py-1 font-medium ${
                    activeDirection === 'right'
                      ? 'border-amber-400 bg-amber-500/20 text-amber-200 font-semibold'
                      : 'border-slate-800 bg-slate-900 text-slate-400'
                  }`}
                >
                  <ArrowRight className="h-3 w-3" />
                  Sağa (Sol Sabit)
                </button>
              </>
            )}

            {!group.isCornerSelection && activeAxis === 'Z' && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setActiveDirection('front');
                    if (resizeDraft) handleTriggerResizePreview(undefined, 'front');
                  }}
                  className={`flex items-center justify-center gap-1 rounded border px-2 py-1 font-medium ${
                    activeDirection === 'front'
                      ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200 font-semibold'
                      : 'border-slate-800 bg-slate-900 text-slate-400'
                  }`}
                >
                  <Move className="h-3 w-3" />
                  Öne (Duvar Sabit)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveDirection('back');
                    if (resizeDraft) handleTriggerResizePreview(undefined, 'back');
                  }}
                  className={`flex items-center justify-center gap-1 rounded border px-2 py-1 font-medium ${
                    activeDirection === 'back'
                      ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200 font-semibold'
                      : 'border-slate-800 bg-slate-900 text-slate-400'
                  }`}
                >
                  <Move className="h-3 w-3" />
                  Arkaya (Ön Sabit)
                </button>
              </>
            )}
          </div>

          {/* Yeni Hedef Ölçü Girişi */}
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              step={10}
              min={60}
              max={3000}
              value={targetMmInput}
              onChange={(e) => setTargetMmInput(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleTriggerResizePreview();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  cancelResizeDraft();
                }
              }}
              className="w-28 rounded border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-xs font-bold text-white focus:border-sky-400 focus:outline-none"
            />
            <span className="font-mono text-[10px] text-slate-400">mm</span>
            <button
              type="button"
              onClick={() => handleTriggerResizePreview()}
              className="flex-1 rounded bg-sky-500 px-2.5 py-1 text-[11px] font-bold text-slate-950 hover:bg-sky-400 transition"
            >
              Önizle / Hesapla
            </button>
          </div>

          {/* AKTİF TASLAK VE KOMŞU ÇAKIŞMA ÇÖZÜM KARTI */}
          {resizeDraft && (
            <div
              className={`mt-1 space-y-2 rounded-lg border p-2.5 text-[11px] ${
                resizeDraft.conflictOverlapMm > 0 || resizeDraft.exceedsBoundary
                  ? 'border-rose-500/70 bg-rose-950/50 text-rose-100'
                  : 'border-emerald-500/60 bg-emerald-950/40 text-emerald-100'
              }`}
            >
              <div className="space-y-0.5 text-[10px]">
                <div className="text-slate-300">
                  • <strong>Sabit:</strong> {resizeDraft.fixedBoundaryLabel}
                </div>
                <div className="text-slate-300">
                  • <strong>Hareketli:</strong> {resizeDraft.movingBoundaryLabel}
                </div>
              </div>

              {resizeDraft.exceedsBoundary ? (
                <div className="flex items-start gap-1.5 rounded border border-rose-500/50 bg-rose-950/80 p-2 text-[10px] text-rose-200">
                  <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{resizeDraft.boundaryErrorReason}</span>
                </div>
              ) : resizeDraft.conflictOverlapMm > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-start gap-1.5 rounded border border-rose-500/50 bg-rose-950/80 p-2 text-[10px] text-rose-200">
                    <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-rose-300">
                        Komşu Bölme ile {resizeDraft.conflictOverlapMm} mm Çakışma!
                      </div>
                      <p className="mt-0.5 leading-relaxed">
                        <strong>{resizeDraft.neighborLabel}</strong> ({resizeDraft.neighborCurrentMm}{' '}
                        mm) izinsiz küçültülmedi ve 3D sahnede kırmızı vurgulandı. Çakışmayı
                        gidermek için komşu bölme ölçüsünü{' '}
                        <strong>{resizeDraft.requiredNeighborMm} mm</strong> olarak onaylayın:
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[10px] text-rose-200 truncate">
                      Komşu Yeni Ölçü (mm):
                    </span>
                    <input
                      type="number"
                      step={10}
                      value={neighborMmInput}
                      onChange={(e) => {
                        setNeighborMmInput(e.target.value);
                        const num = Number(e.target.value);
                        if (Number.isFinite(num) && num > 0) {
                          updateResizeDraftNeighborMm(Math.round(num));
                        }
                      }}
                      className="w-20 rounded border border-rose-400/60 bg-slate-900 px-2 py-0.5 font-mono text-xs font-bold text-white"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={autoBalanceResizeDraftNeighbor}
                    className="w-full rounded border border-amber-400/70 bg-amber-500/25 px-2.5 py-1.5 text-[11px] font-bold text-amber-200 hover:bg-amber-500/35 transition"
                  >
                    Komşu Sınırı {resizeDraft.requiredNeighborMm} mm Yap (Çakışmayı Çöz)
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 rounded border border-emerald-500/40 bg-emerald-950/70 p-2 text-[10px] text-emerald-200">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>
                    Çakışma yok (0 mm).{' '}
                    {resizeDraft.neighborCellIds.length > 0 &&
                      `Komşu bölme (${resizeDraft.neighborLabel}) ${resizeDraft.neighborDraftMm} mm olarak dengelendi.`}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <button
                  type="button"
                  disabled={resizeDraft.conflictOverlapMm > 0 || resizeDraft.exceedsBoundary}
                  onClick={() => commitResizeDraft()}
                  className="rounded bg-emerald-500 px-2.5 py-1.5 text-[11px] font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Değişiklikleri Uygula
                </button>
                <button
                  type="button"
                  onClick={cancelResizeDraft}
                  className="rounded border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 hover:bg-slate-700 transition"
                >
                  İptal (Son Geçerli)
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. KATLANABİLİR GELİŞMİŞ AYARLAR (AKILLI ŞABLONLAR, ALT ARALIK AYIRMA, UNSPLIT) */}
      {group.isSingle && !group.isCornerSelection && (
        <div className="rounded-lg border border-slate-800 bg-slate-950/70">
          <button
            type="button"
            onClick={() => setShowAdvancedSection(!showAdvancedSection)}
            className="flex w-full items-center justify-between px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-200"
          >
            <span>Gelişmiş Bölme & Ağaç İşlemleri</span>
            {showAdvancedSection ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>

          {showAdvancedSection && (
            <div className="space-y-1.5 border-t border-slate-800 p-2.5 text-[10px]">
              {firstCell.subIntervalIndex !== undefined && (
                <button
                  type="button"
                  onClick={() => isolateSubInterval(firstCell.id)}
                  className="w-full rounded border border-amber-400/60 bg-amber-500/20 px-2 py-1 font-semibold text-amber-100 hover:bg-amber-500/30"
                >
                  Bu Aralığı Bağımsız Alt Hücreye Ayır (`SplitNode`)
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
                  <Merge className="h-3 w-3" />
                  Bu Bölünmeyi Birleştir (Üst Hücreye Sıfırla)
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
