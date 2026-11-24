import { AlertTriangle, DoorOpen, Merge, Scissors, X } from 'lucide-react';
import { type JSX, useEffect, useState } from 'react';
import {
  HANDLE_FINISH_CATALOG,
  HANDLE_STYLE_CATALOG,
  MATERIAL_CATALOG,
} from '../canvas/materials/materialRegistry';
import { frontVerticalRange } from '../core/fronts/frontGeometry';
import type {
  BayFrontMode,
  Design,
  Front,
  FrontType,
  HandleFinishId,
  HandleStyleId,
  MaterialId,
  ResolvedBay,
  ResolvedDoorLeaf,
  ResolvedModel,
  ResolvedSlidingLeaf,
  Run,
} from '../core/schema/types';
import { useWardrobeStore } from '../store/useWardrobeStore';
import { FrontSystemEditor, HingedOpeningCard } from './FrontSystemEditor';
import { NumberField } from './NumberField';

export interface DoorInspectorPanelProps {
  onCloseEditor?: () => void;
}

export interface ActiveDoorInspectorContext {
  isCornerDoor: boolean;
  selectedHingedDoor: ResolvedDoorLeaf | null;
  selectedSlidingLeaf: ResolvedSlidingLeaf | null;
  targetBay: ResolvedBay | null;
  run: Run | null;
  explicitFrontsForBay: Front[];
  activeFront: Front | null;
  activeFrontType: FrontType;
  isHybridBay: boolean;
  hingedMode: BayFrontMode;
  bayHingedDoors: ResolvedDoorLeaf[];
  frontSlidingLeaves: ResolvedSlidingLeaf[];
}

export const FRONT_TYPE_LABELS: Record<FrontType, string> = {
  hinged: 'Menteşeli',
  sliding: 'Sürgülü',
  open: 'Açık',
  drawerFront: 'Çekmece önü',
};

export function splitDoorLeafLabel(
  label: string,
  hingeSide: 'left' | 'right'
): { baseLabel: string; sideBadge: string } {
  const match = label.match(/\s+(Sol Kapak|Sağ Kapak)$/);
  if (match) {
    return {
      baseLabel: label.slice(0, match.index).trim() || label,
      sideBadge: match[1],
    };
  }
  const trimmed = label.replace(/\s+Kapak$/, '').trim();
  return {
    baseLabel: trimmed || label,
    sideBadge: hingeSide === 'right' ? 'Sağ Kapak' : 'Sol Kapak',
  };
}

export function formatSharedFrontScopeSummary(run: Run, bayIds: readonly string[]): string {
  const ordered = run.bays.filter((b) => bayIds.includes(b.id));
  const codes = ordered.map((b) => b.label.split(':')[0].trim() || b.id);
  if (codes.length <= 1) return codes[0] ?? '';
  if (codes.length === 2) return `${codes[0]}–${codes[1]}`;
  return `${codes[0]}–${codes[codes.length - 1]}`;
}

export function canIsolateBayFromSharedFront(run: Run, front: Front, bayId: string): boolean {
  if (front.bayIds.length <= 1 || !front.bayIds.includes(bayId)) return false;
  const remainingIndices = run.bays
    .map((b, idx) => (front.bayIds.includes(b.id) && b.id !== bayId ? idx : -1))
    .filter((idx) => idx >= 0);
  if (remainingIndices.length === 0) return false;
  for (let i = 1; i < remainingIndices.length; i++) {
    if (remainingIndices[i] !== remainingIndices[i - 1] + 1) return false;
  }
  return true;
}

export function resolveActiveDoorInspectorContext(
  design: Design,
  resolved: ResolvedModel,
  selectedBayId: string | null,
  activeDoorIds: string[],
  chosenFrontId?: string | null
): ActiveDoorInspectorContext {
  const primaryDoorId = activeDoorIds[0] ?? null;
  const directHinged = primaryDoorId
    ? resolved.doors.find((d) => d.id === primaryDoorId) ?? null
    : null;
  const directSliding = primaryDoorId
    ? resolved.slidingDoors?.find((d) => d.id === primaryDoorId) ?? null
    : null;

  if (directHinged?.isCornerDoor) {
    return {
      isCornerDoor: true,
      selectedHingedDoor: directHinged,
      selectedSlidingLeaf: null,
      targetBay: null,
      run: null,
      explicitFrontsForBay: [],
      activeFront: null,
      activeFrontType: 'hinged',
      isHybridBay: false,
      hingedMode: directHinged.hingeSide === 'right' ? 'singleRight' : 'singleLeft',
      bayHingedDoors: [directHinged],
      frontSlidingLeaves: [],
    };
  }

  const targetBayId =
    directSliding?.bayId ??
    directSliding?.bayIds[0] ??
    directHinged?.bayId ??
    selectedBayId ??
    resolved.bays[0]?.id ??
    null;

  const targetBay =
    (targetBayId ? resolved.bays.find((b) => b.id === targetBayId) : null) ??
    resolved.bays[0] ??
    null;

  const run = targetBay ? design.runs.find((r) => r.id === targetBay.runId) ?? null : null;

  const explicitFrontsForBay = targetBay
    ? design.fronts
        .filter((f) => f.bayIds.includes(targetBay.id))
        .sort((a, b) =>
          run ? frontVerticalRange(run, a).start - frontVerticalRange(run, b).start : 0
        )
    : [];

  const directFrontId = directSliding?.frontId ?? directHinged?.frontId;
  const activeFront =
    (chosenFrontId ? explicitFrontsForBay.find((f) => f.id === chosenFrontId) : undefined) ??
    (directFrontId ? explicitFrontsForBay.find((f) => f.id === directFrontId) : undefined) ??
    explicitFrontsForBay[0] ??
    null;

  const activeFrontType: FrontType = activeFront
    ? activeFront.type
    : targetBay?.frontMode === 'sliding'
      ? 'sliding'
      : targetBay?.frontMode === 'open'
        ? 'open'
        : 'hinged';

  const isHybridBay = explicitFrontsForBay.length > 1;

  const hingedMode: BayFrontMode = activeFront
    ? activeFront.type === 'open'
      ? 'open'
      : activeFront.type === 'sliding'
        ? 'sliding'
        : activeFront.hingeSide === 'double'
          ? 'double'
          : activeFront.hingeSide === 'right'
            ? 'singleRight'
            : activeFront.hingeSide === 'auto'
              ? 'auto'
              : 'singleLeft'
    : (targetBay?.frontMode ?? 'auto');

  const bayHingedDoors = activeFront
    ? resolved.doors.filter((d) => d.frontId === activeFront.id)
    : targetBay
      ? resolved.doors.filter((d) => d.bayIds.includes(targetBay.id) && !d.frontId)
      : [];

  const frontSlidingLeaves = activeFront
    ? (resolved.slidingDoors ?? []).filter((d) => d.frontId === activeFront.id)
    : targetBay
      ? (resolved.slidingDoors ?? []).filter(
          (d) => d.bayId === targetBay.id || d.bayIds.includes(targetBay.id)
        )
      : [];

  const selectedHingedDoor =
    activeFrontType === 'hinged'
      ? (directHinged && (!activeFront || directHinged.frontId === activeFront.id)
          ? directHinged
          : bayHingedDoors[0] ?? null)
      : null;

  const selectedSlidingLeaf =
    activeFrontType === 'sliding'
      ? (directSliding && (!activeFront || directSliding.frontId === activeFront.id)
          ? directSliding
          : frontSlidingLeaves[0] ?? null)
      : null;

  return {
    isCornerDoor: false,
    selectedHingedDoor,
    selectedSlidingLeaf,
    targetBay,
    run,
    explicitFrontsForBay,
    activeFront,
    activeFrontType,
    isHybridBay,
    hingedMode,
    bayHingedDoors,
    frontSlidingLeaves,
  };
}

export function switchBayFrontType(
  bayId: string,
  activeFront: Front | null,
  currentType: FrontType,
  nextType: FrontType
): void {
  if (currentType === nextType) return;
  const store = useWardrobeStore.getState();
  const resolvedBay = store.resolved.bays.find((b) => b.id === bayId);
  const hingeAngle = activeFront?.openingAngleDeg ?? resolvedBay?.hingeAngleDeg ?? 110;

  if (nextType === 'open') {
    if (activeFront) {
      if (activeFront.type === 'sliding') {
        store.removeFrontSystem(activeFront.id);
      } else {
        store.configureFrontSystem(bayId, activeFront.id, 'open');
      }
    } else {
      store.updateDoorFrontConfig(bayId, undefined, 'open', hingeAngle);
    }
    const next = useWardrobeStore.getState();
    next.selectDoor(null, bayId);
    next.setSelectedFrontId?.(activeFront?.id ?? null);
    return;
  }

  if (nextType === 'hinged') {
    if (activeFront) {
      store.configureFrontSystem(bayId, activeFront.id, 'hinged');
      const next = useWardrobeStore.getState();
      const nextDoor =
        next.resolved.doors.find((d) => d.frontId === activeFront.id) ??
        next.resolved.doors.find((d) => d.bayId === bayId || d.bayIds.includes(bayId));
      next.selectDoor(nextDoor?.id ?? null, bayId);
      next.setSelectedFrontId?.(activeFront.id);
    } else {
      store.updateDoorFrontConfig(bayId, undefined, 'auto', hingeAngle);
      useWardrobeStore.getState().setSelectedFrontId?.(null);
    }
    return;
  }

  // nextType === 'sliding'
  store.configureFrontSystem(bayId, activeFront?.id, 'sliding');
  const next = useWardrobeStore.getState();
  const nextLeaf =
    (activeFront
      ? next.resolved.slidingDoors?.find((d) => d.frontId === activeFront.id)
      : undefined) ??
    next.resolved.slidingDoors?.find((d) => d.bayId === bayId || d.bayIds.includes(bayId));
  const resolvedFrontId =
    nextLeaf?.frontId ??
    activeFront?.id ??
    next.design.fronts.find((f) => f.bayIds.includes(bayId) && f.type === 'sliding')?.id ??
    null;
  next.selectDoor(nextLeaf?.id ?? null, bayId);
  next.setSelectedFrontId?.(resolvedFrontId);
}

export function DoorInspectorPanel({ onCloseEditor }: DoorInspectorPanelProps): JSX.Element | null {
  const design = useWardrobeStore((s) => s.design);
  const resolved = useWardrobeStore((s) => s.resolved);
  const doorEditorMode = useWardrobeStore((s) => s.doorEditorMode);
  const selectedBayId = useWardrobeStore((s) => s.selectedBayId);
  const selectedDoorId = useWardrobeStore((s) => s.selectedDoorId);
  const selectedDoorIds = useWardrobeStore((s) => s.selectedDoorIds);
  const selectedFrontId = useWardrobeStore((s) => s.selectedFrontId);
  const openDoorIds = useWardrobeStore((s) => s.openDoorIds);

  const setDoorEditorMode = useWardrobeStore((s) => s.setDoorEditorMode);
  const setSelectedFrontId = useWardrobeStore((s) => s.setSelectedFrontId);
  const toggleDoor = useWardrobeStore((s) => s.toggleDoor);
  const selectDoor = useWardrobeStore((s) => s.selectDoor);
  const updateDoorFrontConfig = useWardrobeStore((s) => s.updateDoorFrontConfig);
  const patchFrontSystem = useWardrobeStore((s) => s.patchFrontSystem);
  const splitBayDoorHorizontally = useWardrobeStore((s) => s.splitBayDoorHorizontally);
  const mergeBayDoors = useWardrobeStore((s) => s.mergeBayDoors);
  const setCornerDoorMode = useWardrobeStore((s) => s.setCornerDoorMode);
  const setDoorMaterialAndHandle = useWardrobeStore((s) => s.setDoorMaterialAndHandle);

  const activeDoorIds =
    selectedDoorIds.length > 0 ? selectedDoorIds : selectedDoorId ? [selectedDoorId] : [];

  const [doorSplitHeightInput, setDoorSplitHeightInput] = useState<number>(1850);

  const ctx = resolveActiveDoorInspectorContext(
    design,
    resolved,
    selectedBayId,
    activeDoorIds,
    selectedFrontId
  );

  useEffect(() => {
    if (!ctx.run) return;
    const defaultSplit = Math.min(
      1850,
      Math.max(400, ctx.run.heightMm - ctx.run.topFillerHeightMm - 420)
    );
    setDoorSplitHeightInput(defaultSplit);
  }, [ctx.run?.id, ctx.run?.heightMm, ctx.run?.topFillerHeightMm]);

  if (!doorEditorMode) return null;

  const handleClose = () => {
    if (onCloseEditor) {
      onCloseEditor();
    } else {
      setDoorEditorMode(false);
    }
  };

  const selectedDoorsAll = activeDoorIds
    .map(
      (id) =>
        resolved.doors.find((d) => d.id === id) ??
        resolved.slidingDoors?.find((d) => d.id === id) ??
        null
    )
    .filter((d): d is ResolvedDoorLeaf | ResolvedSlidingLeaf => Boolean(d));
  const isMultiDoorSelected = selectedDoorsAll.length > 1;

  const handleBatchOpenDoors = (open: boolean) => {
    for (const door of selectedDoorsAll) {
      const currentlyOpen = Boolean(openDoorIds[door.id]);
      if (currentlyOpen !== open) {
        toggleDoor(door.id);
      }
    }
  };

  const renderMultiDoorBatchCard = () =>
    isMultiDoorSelected ? (
      <div className="studio-card space-y-2 border-amber-500/40 bg-amber-950/20">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold text-amber-200">
            Çoklu kapak seçimi ({selectedDoorsAll.length} kapak)
          </span>
          <span className="font-mono text-[10px] text-slate-300">Shift+Tık</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => handleBatchOpenDoors(true)}
            className="min-h-7 rounded-md border border-sky-500/60 bg-sky-500/20 px-2 py-1 text-[11px] font-semibold text-sky-100 transition hover:bg-sky-500/30"
          >
            Seçili {selectedDoorsAll.length} kapağı aç
          </button>
          <button
            type="button"
            onClick={() => handleBatchOpenDoors(false)}
            className="min-h-7 rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-[11px] font-semibold text-slate-100 transition hover:border-slate-400 hover:bg-slate-700"
          >
            Seçili {selectedDoorsAll.length} kapağı kapat
          </button>
        </div>
      </div>
    ) : null;

  const diagonalJunction =
    design.layoutKind === 'l-shape'
      ? design.junctions.find((j) => j.type === 'diagonal') ?? null
      : null;
  const isCornerDoorOpen = Boolean(diagonalJunction && diagonalJunction.doorMode === 'open');

  const restoreCornerDoor = (side: 'left' | 'right') => {
    setCornerDoorMode(side);
    const next = useWardrobeStore.getState();
    const cornerDoor = next.resolved.doors.find((d) => d.isCornerDoor);
    if (cornerDoor) {
      next.selectDoor(cornerDoor.id, null);
      next.setSelectedFrontId?.(null);
    }
  };

  // =========================================================================
  // 1. KÖŞE KAPAĞI DENETÇİSİ (Beşgen Köşe)
  // =========================================================================
  if (ctx.isCornerDoor && ctx.selectedHingedDoor) {
    const cornerDoor = ctx.selectedHingedDoor;
    const alternate = cornerDoor.opening?.alternative;
    const isOpen = Boolean(openDoorIds[cornerDoor.id]);

    return (
      <section
        aria-label="Kapak Editörü Denetçisi"
        className="studio-section space-y-3 border-b-2 border-amber-500/40 bg-slate-900/95 text-xs"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-1.5">
              <DoorOpen className="h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
              <h2 className="studio-section-title truncate text-amber-200">
                Kapak Editörü — {cornerDoor.label}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center rounded border border-slate-700 bg-slate-950 px-2 py-0.5 font-mono text-[11px] text-slate-200">
                {cornerDoor.widthMm} × {cornerDoor.heightMm} × {cornerDoor.thicknessMm} mm
              </span>
              {isMultiDoorSelected && (
                <span className="inline-flex items-center rounded border border-amber-400/60 bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-200">
                  {selectedDoorsAll.length} kapak seçili
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Kapak düzenlemeyi kapat"
            className="inline-flex min-h-7 shrink-0 items-center gap-1 rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] font-medium text-slate-200 transition hover:border-slate-500 hover:text-white"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Kapat (Esc)</span>
          </button>
        </div>

        {renderMultiDoorBatchCard()}

        <HingedOpeningCard
          door={cornerDoor}
          applyAlternative={alternate ? () => setCornerDoorMode(alternate.side) : undefined}
        />

        <div className="studio-card space-y-2">
          <div className="text-[11px] font-semibold text-slate-200">Köşe menteşe yönü</div>
          <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Köşe menteşe yönü">
            {(
              [
                { value: 'left', label: 'Sol' },
                { value: 'right', label: 'Sağ' },
                { value: 'open', label: 'Açık' },
              ] as const
            ).map((opt) => {
              const active = cornerDoor.hingeSide === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setCornerDoorMode(opt.value)}
                  className={`min-h-7 rounded-md border px-2 py-1.5 text-[11px] font-medium transition ${
                    active
                      ? 'border-amber-400 bg-amber-500/20 font-semibold text-amber-200'
                      : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={() => toggleDoor(cornerDoor.id)}
          className="min-h-8 w-full rounded-md border border-sky-500/60 bg-sky-500/20 px-3 py-2 text-xs font-semibold text-sky-100 transition hover:bg-sky-500/30"
        >
          {isOpen ? 'Köşe kapağını kapat' : 'Köşe kapağını aç'}
        </button>
      </section>
    );
  }

  // =========================================================================
  // 2. STANDART / SÜRGÜLÜ / AÇIK / KARMA BÖLME DENETÇİSİ
  // =========================================================================
  if (!ctx.targetBay || !ctx.run) return null;

  const { targetBay, run, activeFront, activeFrontType, explicitFrontsForBay, isHybridBay } = ctx;
  const selectedDoor = ctx.selectedHingedDoor;
  const selectedSliding = ctx.selectedSlidingLeaf;
  const alternate = selectedDoor?.opening?.alternative;
  const isSharedMultiBayFront = Boolean(activeFront && activeFront.bayIds.length > 1);
  const sharedScopeSummary =
    activeFront && isSharedMultiBayFront
      ? formatSharedFrontScopeSummary(run, activeFront.bayIds)
      : '';
  const canIsolateTargetBay =
    activeFront && isSharedMultiBayFront
      ? canIsolateBayFromSharedFront(run, activeFront, targetBay.id)
      : false;

  const handleIsolateTargetBay = () => {
    if (!activeFront || !canIsolateTargetBay) return;
    const remainingBayIds = activeFront.bayIds.filter((id) => id !== targetBay.id);
    patchFrontSystem(activeFront.id, { bayIds: remainingBayIds });
    const next = useWardrobeStore.getState();
    const isolatedDoor =
      next.resolved.doors.find((d) => d.bayId === targetBay.id) ??
      next.resolved.slidingDoors?.find((d) => d.bayId === targetBay.id) ??
      null;
    next.selectDoor(isolatedDoor?.id ?? null, targetBay.id);
    next.setSelectedFrontId?.(null);
  };

  const canMergeSplitHinged =
    explicitFrontsForBay.length > 1 &&
    explicitFrontsForBay.every(
      (f) =>
        f.type === 'hinged' &&
        [...f.bayIds].sort().join(',') === [...explicitFrontsForBay[0].bayIds].sort().join(',')
    );

  const cutBadgeText =
    activeFrontType === 'sliding' && selectedSliding
      ? `Kanat ${selectedSliding.leafIndex + 1} · Ray ${selectedSliding.trackIndex + 1} · ${selectedSliding.widthMm} × ${selectedSliding.heightMm} × ${selectedSliding.thicknessMm} mm`
      : activeFrontType === 'hinged' && selectedDoor
        ? `${selectedDoor.widthMm} × ${selectedDoor.heightMm} × ${selectedDoor.thicknessMm} mm`
        : `Açık bölme · Dış ${targetBay.outerWidthMm} mm`;

  const applyHingedConfig = (mode: BayFrontMode, angle: 110 | 155 | 165) => {
    updateDoorFrontConfig(targetBay.id, activeFront?.id, mode, angle);
    if (activeFront) {
      const next = useWardrobeStore.getState();
      const match = next.resolved.doors.find((d) => d.frontId === activeFront.id);
      if (match) next.selectDoor(match.id, targetBay.id);
      next.setSelectedFrontId?.(activeFront.id);
    }
  };

  const currentAngle = (activeFront?.openingAngleDeg ??
    selectedDoor?.maxAngleDeg ??
    targetBay.hingeAngleDeg ??
    110) as 110 | 155 | 165;

  return (
    <section
      aria-label="Kapak Editörü Denetçisi"
      className="studio-section space-y-3 border-b-2 border-amber-500/40 bg-slate-900/95 text-xs"
    >
      {/* ÜST BAŞLIK + KESİM ROZETİ + ORTAK KAPSAM + KAPAT */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-1.5">
            <DoorOpen className="h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
            <h2 className="studio-section-title truncate text-amber-200">
              Kapak Editörü — {targetBay.label}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center rounded border border-slate-700 bg-slate-950 px-2 py-0.5 font-mono text-[11px] text-slate-200">
              {cutBadgeText}
            </span>
            {isSharedMultiBayFront && activeFront && (
              <span className="inline-flex items-center rounded border border-amber-400/60 bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-200">
                Ortak cephe · {activeFront.bayIds.length} bölme: {sharedScopeSummary}
              </span>
            )}
            {isHybridBay && (
              <span className="inline-flex items-center rounded border border-sky-500/50 bg-sky-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-sky-200">
                Karma cephe · {explicitFrontsForBay.length} aralık
              </span>
            )}
            {isMultiDoorSelected && (
              <span className="inline-flex items-center rounded border border-amber-400/60 bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-200">
                {selectedDoorsAll.length} kapak seçili
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={handleClose}
          aria-label="Kapak düzenlemeyi kapat"
          className="inline-flex min-h-7 shrink-0 items-center gap-1 rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] font-medium text-slate-200 transition hover:border-slate-500 hover:text-white"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Kapat (Esc)</span>
        </button>
      </div>

      {renderMultiDoorBatchCard()}

      {/* BEŞGEN KÖŞE KAPAĞI AÇIKSA TEK TIKLA GERİ EKLEME KARTI (CF-11) */}
      {isCornerDoorOpen && (
        <div className="studio-card space-y-2 border-amber-500/45 bg-amber-950/20">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-amber-200">
              Beşgen Köşe Kapağı (Açık)
            </span>
            <span className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-[10px] text-slate-300">
              Kapaksız
            </span>
          </div>
          <p className="studio-helper">
            Beşgen köşe kapağı şu anda açık konumda. İstediğiniz menteşe yönüyle tek tıkla geri
            ekleyebilirsiniz.
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => restoreCornerDoor('left')}
              className="min-h-7 rounded-md border border-amber-400/70 bg-amber-500/20 px-2 py-1 text-[11px] font-semibold text-amber-100 transition hover:bg-amber-500/30"
            >
              Köşe kapağını geri ekle (Sol)
            </button>
            <button
              type="button"
              onClick={() => restoreCornerDoor('right')}
              className="min-h-7 rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-[11px] font-semibold text-slate-100 transition hover:border-amber-400/60 hover:bg-slate-700"
            >
              Sağ menteşe ile ekle
            </button>
          </div>
        </div>
      )}

      {/* KARMA / ÇOK ARALIKLI CEPHE SEÇİCİSİ */}
      {isHybridBay && (
        <div className="studio-card space-y-1.5">
          <div className="text-[11px] font-semibold text-sky-200">
            Düzenlenen kapak aralığı ({explicitFrontsForBay.length} parça)
          </div>
          <div className="grid grid-cols-1 gap-1">
            {explicitFrontsForBay.map((fr, idx) => {
              const range = frontVerticalRange(run, fr);
              const isSelected = activeFront?.id === fr.id;
              return (
                <button
                  key={fr.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => {
                    const leaf =
                      resolved.slidingDoors?.find((d) => d.frontId === fr.id) ??
                      resolved.doors.find((d) => d.frontId === fr.id);
                    selectDoor(leaf?.id ?? null, targetBay.id);
                    setSelectedFrontId(fr.id);
                  }}
                  className={`flex min-h-7 items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-left text-[11px] transition ${
                    isSelected
                      ? 'border-sky-400 bg-sky-500/20 font-semibold text-white'
                      : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <span className="truncate">
                    {fr.label ?? (idx === 0 ? 'Alt Kapak Aralığı' : 'Üst Kapak Aralığı')} ·{' '}
                    <span className="text-sky-300">{FRONT_TYPE_LABELS[fr.type]}</span>
                  </span>
                  <span className="shrink-0 font-mono text-[10px] text-slate-300">
                    {range.start}–{range.end} mm
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ORTAK ÇOK BÖLMELİ CEPHE UYARISI VE AYIRMA EYLEMİ (CF-06) */}
      {isSharedMultiBayFront && activeFront && (
        <div
          role="note"
          className="space-y-2 rounded-lg border border-amber-400/50 bg-amber-950/25 p-2.5 text-[11px] text-amber-100"
        >
          <div className="flex items-start gap-1.5">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" aria-hidden="true" />
            <p className="leading-snug">
              Bu ortak cephe <strong>{activeFront.bayIds.length} bölmeyi ({sharedScopeSummary})</strong>{' '}
              birlikte kapsar. Cephe türünü değiştirmek kapsanan tüm bölmeleri günceller.
            </p>
          </div>
          <button
            type="button"
            disabled={!canIsolateTargetBay}
            title={
              canIsolateTargetBay
                ? 'Seçili bölmeyi ortak cepheden ayırarak bağımsız düzenleyin'
                : 'Orta bölme doğrudan ayrılamaz; önce uç bölmelerden kapsamı daraltın'
            }
            onClick={handleIsolateTargetBay}
            className="min-h-7 w-full rounded-md border border-amber-400/70 bg-amber-500/20 px-2.5 py-1 text-[11px] font-semibold text-amber-100 transition hover:bg-amber-500/30 disabled:cursor-not-allowed disabled:opacity-55"
          >
            Yalnızca bu bölmeyi ayır
          </button>
        </div>
      )}

      {/* ÜST DÜZEY BİRLEŞİK CEPHE TÜRÜ SEÇİCİSİ (HER ZAMAN GÖRÜNÜR) */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-semibold text-slate-200">Cephe sistemi</div>
        <div
          className="grid grid-cols-3 gap-1 rounded-lg border border-slate-700 bg-slate-950 p-1"
          role="group"
          aria-label="Cephe sistemi seçimi"
        >
          {(['hinged', 'sliding', 'open'] as const).map((frontType) => {
            const isActive = activeFrontType === frontType;
            return (
              <button
                key={frontType}
                type="button"
                aria-pressed={isActive}
                onClick={() =>
                  switchBayFrontType(targetBay.id, activeFront, activeFrontType, frontType)
                }
                className={`min-h-[32px] rounded-md px-2 py-1 text-[11px] font-semibold transition ${
                  isActive
                    ? frontType === 'sliding'
                      ? 'bg-sky-500 text-slate-950 shadow-sm'
                      : frontType === 'open'
                        ? 'bg-slate-200 text-slate-950 shadow-sm'
                        : 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {FRONT_TYPE_LABELS[frontType]}
              </button>
            );
          })}
        </div>
      </div>

      {/* =================================================================== */}
      {/* BAĞLAMSAL BÖLÜM A: MENTEŞELİ CEPHE                                  */}
      {/* =================================================================== */}
      {activeFrontType === 'hinged' && (
        <div className="space-y-2.5">
          {selectedDoor && (
            <HingedOpeningCard
              door={selectedDoor}
              applyAlternative={
                alternate
                  ? () =>
                      applyHingedConfig(
                        alternate.side === 'left' ? 'singleLeft' : 'singleRight',
                        selectedDoor.maxAngleDeg
                      )
                  : undefined
              }
            />
          )}

          {/* Hızlı Kanat Aç / Kapat */}
          {ctx.bayHingedDoors.length === 1 && (
            <button
              type="button"
              onClick={() => toggleDoor(ctx.bayHingedDoors[0].id)}
              className="min-h-8 w-full rounded-md border border-sky-500/60 bg-sky-500/20 px-3 py-1.5 text-[11px] font-semibold text-sky-100 transition hover:bg-sky-500/30"
            >
              {openDoorIds[ctx.bayHingedDoors[0].id]
                ? 'Seçili kanadı kapat'
                : 'Seçili kanadı aç'}
            </button>
          )}
          {ctx.bayHingedDoors.length > 1 && (
            <div className="studio-card space-y-1.5">
              <div className="text-[11px] font-semibold text-slate-200">Kanatları aç / kapat</div>
              <div className="grid grid-cols-1 gap-1">
                {ctx.bayHingedDoors.map((leaf) => {
                  const isOpen = Boolean(openDoorIds[leaf.id]);
                  const isSelected = leaf.id === selectedDoor?.id;
                  const { baseLabel, sideBadge } = splitDoorLeafLabel(leaf.label, leaf.hingeSide);
                  return (
                    <div
                      key={leaf.id}
                      className={`flex items-center justify-between gap-1.5 rounded border px-2 py-1 text-[11px] ${
                        isSelected
                          ? 'border-amber-500/60 bg-amber-500/10 text-amber-100'
                          : 'border-slate-800 bg-slate-900 text-slate-300'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => selectDoor(leaf.id, targetBay.id)}
                        className="flex min-h-6 min-w-0 flex-1 items-center gap-1.5 text-left font-medium hover:text-white"
                      >
                        <span className="min-w-0 flex-1 truncate">{baseLabel}</span>
                        <span className="shrink-0 rounded border border-slate-600 bg-slate-950/90 px-1.5 py-0.5 text-[10px] font-semibold text-amber-200">
                          {sideBadge}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleDoor(leaf.id)}
                        className="min-h-6 min-w-[44px] shrink-0 rounded border border-sky-500/50 bg-sky-500/15 px-2 py-0.5 text-[10px] font-semibold text-sky-200 hover:bg-sky-500/25"
                      >
                        {isOpen ? 'Kapat' : 'Aç'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Menteşe Yönü & Açısı */}
          <div className="studio-card space-y-2.5">
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold text-slate-200">Menteşe düzeni</div>
              <div className="grid grid-cols-2 gap-1.5" role="group" aria-label="Menteşe düzeni">
                {(
                  [
                    { mode: 'auto', label: 'Otomatik' },
                    { mode: 'singleLeft', label: 'Sol menteşe' },
                    { mode: 'singleRight', label: 'Sağ menteşe' },
                    { mode: 'double', label: 'Çift kanat' },
                  ] as { mode: BayFrontMode; label: string }[]
                ).map((opt) => {
                  const isActive = ctx.hingedMode === opt.mode;
                  return (
                    <button
                      key={opt.mode}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => applyHingedConfig(opt.mode, currentAngle)}
                      className={`rounded-md border px-2 py-1.5 text-[11px] font-medium transition ${
                        isActive
                          ? 'border-amber-400 bg-amber-500/20 font-semibold text-amber-200'
                          : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold text-slate-200">Menteşe açısı</div>
              <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Menteşe açısı">
                {([110, 155, 165] as const).map((deg) => {
                  const isActive = currentAngle === deg;
                  return (
                    <button
                      key={deg}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() =>
                        applyHingedConfig(ctx.hingedMode === 'open' ? 'auto' : ctx.hingedMode, deg)
                      }
                      className={`rounded-md border py-1.5 font-mono text-[11px] font-semibold transition ${
                        isActive
                          ? 'border-sky-400 bg-sky-500/20 text-sky-200'
                          : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      {deg}°{deg === 155 ? ' (İç)' : ''}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Üst / Alt Kapak Bölümü */}
          <div className="studio-card space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-slate-200">Üst / Alt kapak bölümü</span>
              <span className="font-mono text-[10px] text-slate-400">
                {explicitFrontsForBay.length > 1 ? `${explicitFrontsForBay.length} parça` : 'Tam boy'}
              </span>
            </div>

            {explicitFrontsForBay.length <= 1 ? (
              <div className="space-y-2">
                <NumberField
                  label="Bölme yüksekliği (mm)"
                  value={doorSplitHeightInput}
                  min={300}
                  max={Math.max(500, run.heightMm - run.topFillerHeightMm - 200)}
                  step={20}
                  onCommit={setDoorSplitHeightInput}
                />
                <button
                  type="button"
                  onClick={() => splitBayDoorHorizontally(targetBay.id, doorSplitHeightInput)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-md border border-sky-400/60 bg-sky-500/15 px-2.5 py-1.5 text-[11px] font-semibold text-sky-200 transition hover:bg-sky-500/25"
                >
                  <Scissors className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Üst / Alt Böl (Yüklük + Alt Gövde)</span>
                </button>
              </div>
            ) : canMergeSplitHinged ? (
              <button
                type="button"
                onClick={() => mergeBayDoors(targetBay.id)}
                className="flex w-full items-center justify-center gap-1.5 rounded-md border border-amber-400/60 bg-amber-500/15 px-2.5 py-1.5 text-[11px] font-semibold text-amber-200 transition hover:bg-amber-500/25"
              >
                <Merge className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Bölünmüş Kapakları Tek Kapakta Birleştir</span>
              </button>
            ) : (
              <p className="studio-helper">
                Bu bölmede farklı cephe tipleri (karma cephe) var. Üstteki aralık listesinden her
                bölümü bağımsız yönetebilirsiniz.
              </p>
            )}
          </div>

          {/* Malzeme, kulp ve gelişmiş kapsam ayarları (tek katlanabilir bölüm, sıfır tekrar) */}
          <details className="rounded-lg border border-slate-700/80 bg-slate-950/60 p-2.5">
            <summary className="flex min-h-6 cursor-pointer items-center text-[11px] font-semibold text-slate-200">
              Malzeme, kulp ve kapsam ayarları
            </summary>
            <div className="mt-2.5 space-y-2.5">
              <label className="block space-y-1">
                <span className="text-[11px] font-medium text-slate-300">Kapak yüzey malzemesi</span>
                <select
                  aria-label="Bu kapağın yüzey malzemesi"
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
                  className="studio-input"
                >
                  <option value="">
                    Genel kapak malzemesi ({MATERIAL_CATALOG[design.materials.frontMaterialId].name})
                  </option>
                  {Object.values(MATERIAL_CATALOG).map((mat) => (
                    <option key={mat.id} value={mat.id}>
                      {mat.name} ({mat.categoryLabel})
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-2">
                <label className="block space-y-1">
                  <span className="text-[11px] font-medium text-slate-300">Kulp modeli</span>
                  <select
                    aria-label="Kulp modeli"
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
                    className="studio-input"
                  >
                    {Object.values(HANDLE_STYLE_CATALOG).map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-1">
                  <span className="text-[11px] font-medium text-slate-300">Kulp rengi</span>
                  <select
                    aria-label="Kulp rengi"
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
                    className="studio-input"
                  >
                    {Object.values(HANDLE_FINISH_CATALOG).map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <label className="block space-y-1">
                  <span className="text-[11px] font-medium text-slate-300">Konum</span>
                  <select
                    aria-label="Kulp konumu"
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
                    className="studio-input px-1.5"
                  >
                    <option value="middle">Orta</option>
                    <option value="top">Üst</option>
                    <option value="bottom">Alt</option>
                    <option value="verticalEdge">Tam kenar</option>
                  </select>
                </label>

                <label className="block space-y-1">
                  <span className="text-[11px] font-medium text-slate-300">Yön</span>
                  <select
                    aria-label="Kulp yönü"
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
                    className="studio-input px-1.5"
                  >
                    <option value="vertical">Dikey</option>
                    <option value="horizontal">Yatay</option>
                  </select>
                </label>

                <label className="block space-y-1">
                  <span className="text-[11px] font-medium text-slate-300">Boy</span>
                  <select
                    aria-label="Kulp boyu"
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
                    className="studio-input px-1.5 font-mono"
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

              <div className="border-t border-slate-800 pt-2.5">
                <FrontSystemEditor
                  embeddedMode="hinged-advanced"
                  activeFrontId={activeFront?.id ?? null}
                />
              </div>
            </div>
          </details>
        </div>
      )}

      {/* =================================================================== */}
      {/* BAĞLAMSAL BÖLÜM B: SÜRGÜLÜ CEPHE (ZERO DUPLICATION)                 */}
      {/* =================================================================== */}
      {activeFrontType === 'sliding' && (
        <FrontSystemEditor embeddedMode="sliding" activeFrontId={activeFront?.id ?? null} />
      )}

      {/* =================================================================== */}
      {/* BAĞLAMSAL BÖLÜM C: AÇIK / KAPAKSIZ CEPHE                            */}
      {/* =================================================================== */}
      {activeFrontType === 'open' && (
        <div className="space-y-2.5">
          <div className="studio-card space-y-1.5">
            <div className="text-[11px] font-semibold text-slate-200">Açık / kapaksız bölme</div>
            <p className="studio-helper">
              Bu aralık için kapak üretilmez. Üstteki seçiciden tek tıkla Menteşeli veya Sürgülü
              cepheye geçebilirsiniz.
            </p>
          </div>
          {/* CF-15: Implicit open bays also expose custom range / promotion controls */}
          <details className="rounded-lg border border-slate-700/80 bg-slate-950/60 p-2.5">
            <summary className="flex min-h-6 cursor-pointer items-center text-[11px] font-semibold text-slate-200">
              Kapsam kotları ve bölme aralığı
            </summary>
            <div className="mt-2.5">
              <FrontSystemEditor embeddedMode="open-advanced" activeFrontId={activeFront?.id ?? null} />
            </div>
          </details>
        </div>
      )}
    </section>
  );
}
