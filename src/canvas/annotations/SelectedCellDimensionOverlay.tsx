import { Line } from '@react-three/drei';
import { SceneHtml as Html } from './SceneHtml';
import { AlertTriangle, Check, Pencil, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type * as THREE from 'three';
import type {
  ResizeAxis,
  ResizeDirection,
  ResolvedDoorLeaf,
  ResolvedSlidingLeaf,
} from '../../core/schema/types';
import { analyzeSelectedCellsGroup } from '../../core/solver/treeMutator';
import { useWardrobeStore } from '../../store/useWardrobeStore';
import { readNumberDraft } from '../../ui/editorFeedback';
import { motionRuntime } from '../scene/MotionController';

const MM_TO_M = 0.001;
const NOOP_RAYCAST: THREE.Object3D['raycast'] = () => null;

export interface SlidingLeafDimensionOverlaySpec {
  widthMm: number;
  heightMm: number;
  thicknessMm: number;
  trackNumber: number;
  widthLabel: string;
  heightLabel: string;
  trackLabel: string;
  xStartMm: [number, number, number];
  xEndMm: [number, number, number];
  yStartMm: [number, number, number];
  yEndMm: [number, number, number];
  trackBadgeMm: [number, number, number];
}

export interface HingedDoorDimensionOverlaySpec {
  widthMm: number;
  heightMm: number;
  thicknessMm: number;
  xStartMm: [number, number, number];
  xEndMm: [number, number, number];
  yStartMm: [number, number, number];
  yEndMm: [number, number, number];
}

/** Validates on-canvas inline mm input, strictly rejecting empty / whitespace / badInput before Number() (CF-09). */
export function parseOverlayMmDraft(
  raw: string,
  badInput: boolean,
  minMm: number,
  maxMm: number
): { ok: true; value: number } | { ok: false; error: string } {
  const res = readNumberDraft(raw, badInput, minMm, maxMm);
  if (res.kind === 'value') return { ok: true, value: res.value };
  if (res.kind === 'empty') {
    return { ok: false, error: `Boş bırakılamaz (${minMm}–${maxMm} mm).` };
  }
  return { ok: false, error: `${minMm}–${maxMm} mm arasında geçerli bir sayı girin.` };
}

/**
 * Computes 3D endpoints for hinged doors including 45° diagonal corner doors along the true front chord (CF-18)
 * and elevated Kapak X above bottom Dış/Net İç pills (CF-14).
 */
export function computeHingedDoorDimensionOverlay(
  door: ResolvedDoorLeaf
): HingedDoorDimensionOverlaySpec {
  const [hx, hy, hz] = door.pivotWorldMm;
  const wMm = door.widthMm;
  const hMm = door.heightMm;
  const tMm = door.thicknessMm;
  const yBottom = hy - hMm / 2;
  const yTop = hy + hMm / 2;
  // Offset Kapak X clearly above bottom bayOuter/bayInner (y=40mm) pills (CF-14)
  const xLineY = yBottom + Math.min(260, Math.max(96, Math.round(hMm * 0.14)));

  if (door.isCornerDoor) {
    const rot = door.closedRotationYRad;
    const cos = Math.cos(rot);
    const sin = Math.sin(rot);
    const sign = door.hingeSide === 'left' ? 1 : -1;
    const frontOff = tMm + 28;
    const toWorld = (lx: number, ly: number, lz: number): [number, number, number] => [
      hx + lx * cos + lz * sin,
      ly,
      hz - lx * sin + lz * cos,
    ];
    const xStartMm = toWorld(0, xLineY, frontOff);
    const xEndMm = toWorld(sign * wMm, xLineY, frontOff);
    const yLocalX = sign * Math.max(14, wMm - 14);
    const yStartMm = toWorld(yLocalX, yBottom, frontOff);
    const yEndMm = toWorld(yLocalX, yTop, frontOff);
    return { widthMm: wMm, heightMm: hMm, thicknessMm: tMm, xStartMm, xEndMm, yStartMm, yEndMm };
  }

  const isRunA = door.runId !== 'run-B';
  const offsetSign = door.hingeSide === 'left' ? 1 : -1;
  const centerX = isRunA ? hx + (offsetSign * wMm) / 2 : hx + 22;
  const centerZ = isRunA ? hz + 22 : hz + (offsetSign * wMm) / 2;

  const xStartMm: [number, number, number] = isRunA
    ? [centerX - wMm / 2, xLineY, centerZ]
    : [centerX, xLineY, centerZ - wMm / 2];
  const xEndMm: [number, number, number] = isRunA
    ? [centerX + wMm / 2, xLineY, centerZ]
    : [centerX, xLineY, centerZ + wMm / 2];

  const yStartMm: [number, number, number] = isRunA
    ? [centerX + wMm / 2 - 14, yBottom, centerZ]
    : [centerX, yBottom, centerZ + wMm / 2 - 14];
  const yEndMm: [number, number, number] = isRunA
    ? [centerX + wMm / 2 - 14, yTop, centerZ]
    : [centerX, yTop, centerZ + wMm / 2 - 14];

  return { widthMm: wMm, heightMm: hMm, thicknessMm: tMm, xStartMm, xEndMm, yStartMm, yEndMm };
}

export function computeSlidingLeafDimensionOverlay(
  leaf: ResolvedSlidingLeaf,
  slideOffsetMm: number = leaf.initialOffsetMm
): SlidingLeafDimensionOverlaySpec {
  const cx = leaf.closedWorldPositionMm[0] + leaf.slideDirectionWorld[0] * slideOffsetMm;
  const cy = leaf.closedWorldPositionMm[1];
  const cz = leaf.closedWorldPositionMm[2] + leaf.slideDirectionWorld[2] * slideOffsetMm;
  const wMm = leaf.widthMm;
  const hMm = leaf.heightMm;
  const tMm = leaf.thicknessMm;
  const yBottom = cy - hMm / 2;
  const yTop = cy + hMm / 2;
  const isRunA = leaf.wallAxis === 'A';
  const frontOffsetMm = tMm / 2 + 22;
  // Offset Kanat X cleanly above bottom Dış/Net İç pills (CF-14)
  const xLineY = yBottom + Math.min(260, Math.max(96, Math.round(hMm * 0.14)));

  const xStartMm: [number, number, number] = isRunA
    ? [cx - wMm / 2, xLineY, cz + frontOffsetMm]
    : [cx + frontOffsetMm, xLineY, cz - wMm / 2];
  const xEndMm: [number, number, number] = isRunA
    ? [cx + wMm / 2, xLineY, cz + frontOffsetMm]
    : [cx + frontOffsetMm, xLineY, cz + wMm / 2];

  const yStartMm: [number, number, number] = isRunA
    ? [cx + wMm / 2 - 14, yBottom, cz + frontOffsetMm]
    : [cx + frontOffsetMm, yBottom, cz + wMm / 2 - 14];
  const yEndMm: [number, number, number] = isRunA
    ? [cx + wMm / 2 - 14, yTop, cz + frontOffsetMm]
    : [cx + frontOffsetMm, yTop, cz + wMm / 2 - 14];

  const trackBadgeMm: [number, number, number] = isRunA
    ? [cx, yTop - 36, cz + frontOffsetMm]
    : [cx + frontOffsetMm, yTop - 36, cz];

  const trackNumber = leaf.trackIndex + 1;
  return {
    widthMm: wMm,
    heightMm: hMm,
    thicknessMm: tMm,
    trackNumber,
    widthLabel: `Kanat X: ${wMm} mm · Kalınlık: ${tMm} mm`,
    heightLabel: `Kanat Y: ${hMm} mm`,
    trackLabel: `Ray ${trackNumber}`,
    xStartMm,
    xEndMm,
    yStartMm,
    yEndMm,
    trackBadgeMm,
  };
}

export function shouldShowCellDimensionOverlay(
  group: ReturnType<typeof analyzeSelectedCellsGroup>,
  doorEditorMode = false
): boolean {
  if (doorEditorMode) return false;
  if (group.cells.length === 0) return false;
  if (group.isSingle) return true;
  if (group.isMultiShelfGroupSelection) {
    return group.canMergeShelfGroups && group.isContiguousVertical;
  }
  return group.isContiguousVertical || group.isContiguousHorizontal;
}

interface AxisLineSpec {
  axis: ResizeAxis;
  title: string;
  shortTag: string;
  valueMm: number;
  netDetailLabel?: string;
  color: string;
  badgeClass: string;
  startMm: [number, number, number];
  endMm: [number, number, number];
  defaultDirection: ResizeDirection;
  directionOptions: { value: ResizeDirection; label: string }[];
  minMm: number;
  maxMm: number;
}

export function SelectedCellDimensionOverlay() {
  const design = useWardrobeStore((s) => s.design);
  const resolved = useWardrobeStore((s) => s.resolved);
  const viewMode = useWardrobeStore((s) => s.viewMode);
  const selectedCellId = useWardrobeStore((s) => s.selectedCellId);
  const selectedCellIds = useWardrobeStore((s) => s.selectedCellIds);
  const selectedDrawerId = useWardrobeStore((s) => s.selectedDrawerId);
  const selectedDrawerIds = useWardrobeStore((s) => s.selectedDrawerIds);
  const doorEditorMode = useWardrobeStore((s) => s.doorEditorMode);
  const selectedDoorId = useWardrobeStore((s) => s.selectedDoorId);
  const selectedDoorIds = useWardrobeStore((s) => s.selectedDoorIds);
  const resizeDraft = useWardrobeStore((s) => s.resizeDraft);

  const startOrUpdateResizeDraft = useWardrobeStore((s) => s.startOrUpdateResizeDraft);
  const commitResizeDraft = useWardrobeStore((s) => s.commitResizeDraft);
  const updateSelectedDrawerHeight = useWardrobeStore((s) => s.updateSelectedDrawerHeight);
  const updateCornerParam = useWardrobeStore((s) => s.updateCornerParam);

  const [editingAxis, setEditingAxis] = useState<ResizeAxis | null>(null);
  const [draftVal, setDraftVal] = useState<string>('');
  const [draftError, setDraftError] = useState<string | null>(null);
  const [direction, setDirection] = useState<ResizeDirection>('up');
  const inputRef = useRef<HTMLInputElement | null>(null);

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

  useEffect(() => {
    if (editingAxis && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingAxis]);

  useEffect(() => {
    setEditingAxis(null);
    setDraftError(null);
  }, [activeCellIds.join(','), activeDrawerIds.join(','), activeDoorIds.join(','), doorEditorMode]);

  // ---------------------------------------------------------------------------
  // 1. KAPAK DÜZENLEME MODUNDA SEÇİLİ KAPAK ÖLÇÜ ÇİZGİLERİ (MENTEŞELİ & SÜRGÜLÜ)
  // ---------------------------------------------------------------------------
  if (doorEditorMode && activeDoorIds.length > 0) {
    const selectedDoor = resolved.doors.find((d) => d.id === activeDoorIds[0]);
    if (!selectedDoor) {
      const selectedSliding = resolved.slidingDoors?.find((d) => d.id === activeDoorIds[0]);
      if (!selectedSliding) return null;

      const slideOffsetMm =
        motionRuntime.positions[selectedSliding.id] ?? selectedSliding.initialOffsetMm;
      const spec = computeSlidingLeafDimensionOverlay(selectedSliding, slideOffsetMm);

      return (
        <group userData={{ studioHelper: true }}>
          <Line
            points={[
              [spec.xStartMm[0] * MM_TO_M, spec.xStartMm[1] * MM_TO_M, spec.xStartMm[2] * MM_TO_M],
              [spec.xEndMm[0] * MM_TO_M, spec.xEndMm[1] * MM_TO_M, spec.xEndMm[2] * MM_TO_M],
            ]}
            color="#f59e0b"
            lineWidth={2.5}
            raycast={NOOP_RAYCAST}
          />
          <Html
            position={[
              ((spec.xStartMm[0] + spec.xEndMm[0]) / 2) * MM_TO_M,
              ((spec.xStartMm[1] + spec.xEndMm[1]) / 2) * MM_TO_M,
              ((spec.xStartMm[2] + spec.xEndMm[2]) / 2) * MM_TO_M,
            ]}
            center
            zIndexRange={[30, 10]}
          >
            <div className="pointer-events-none whitespace-nowrap rounded border border-amber-300 bg-amber-500 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-950 shadow">
              {spec.widthLabel}
            </div>
          </Html>

          <Line
            points={[
              [spec.yStartMm[0] * MM_TO_M, spec.yStartMm[1] * MM_TO_M, spec.yStartMm[2] * MM_TO_M],
              [spec.yEndMm[0] * MM_TO_M, spec.yEndMm[1] * MM_TO_M, spec.yEndMm[2] * MM_TO_M],
            ]}
            color="#38bdf8"
            lineWidth={2.5}
            raycast={NOOP_RAYCAST}
          />
          <Html
            position={[
              ((spec.yStartMm[0] + spec.yEndMm[0]) / 2) * MM_TO_M,
              ((spec.yStartMm[1] + spec.yEndMm[1]) / 2) * MM_TO_M,
              ((spec.yStartMm[2] + spec.yEndMm[2]) / 2) * MM_TO_M,
            ]}
            center
            zIndexRange={[30, 10]}
          >
            <div className="pointer-events-none whitespace-nowrap rounded border border-sky-300 bg-sky-500 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-950 shadow">
              {spec.heightLabel}
            </div>
          </Html>

          <Html
            position={[
              spec.trackBadgeMm[0] * MM_TO_M,
              spec.trackBadgeMm[1] * MM_TO_M,
              spec.trackBadgeMm[2] * MM_TO_M,
            ]}
            center
            zIndexRange={[30, 10]}
          >
            <div className="pointer-events-none whitespace-nowrap rounded border border-violet-300 bg-violet-600/95 px-2 py-0.5 font-mono text-[10px] font-bold text-white shadow">
              {spec.trackLabel}
            </div>
          </Html>
        </group>
      );
    }

    const doorSpec = computeHingedDoorDimensionOverlay(selectedDoor);
    const { widthMm: wMm, heightMm: hMm, thicknessMm: tMm, xStartMm: xStart, xEndMm: xEnd, yStartMm: yStart, yEndMm: yEnd } = doorSpec;

    return (
      <group userData={{ studioHelper: true }}>
        <Line
          points={[
            [xStart[0] * MM_TO_M, xStart[1] * MM_TO_M, xStart[2] * MM_TO_M],
            [xEnd[0] * MM_TO_M, xEnd[1] * MM_TO_M, xEnd[2] * MM_TO_M],
          ]}
          color="#f59e0b"
          lineWidth={2.5}
          raycast={NOOP_RAYCAST}
        />
        <Html
          position={[
            ((xStart[0] + xEnd[0]) / 2) * MM_TO_M,
            ((xStart[1] + xEnd[1]) / 2) * MM_TO_M,
            ((xStart[2] + xEnd[2]) / 2) * MM_TO_M,
          ]}
          center
          zIndexRange={[30, 10]}
        >
          <div className="pointer-events-none whitespace-nowrap rounded border border-amber-300 bg-amber-500 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-950 shadow">
            Kapak X: {wMm} mm · Kalınlık: {tMm} mm
          </div>
        </Html>

        <Line
          points={[
            [yStart[0] * MM_TO_M, yStart[1] * MM_TO_M, yStart[2] * MM_TO_M],
            [yEnd[0] * MM_TO_M, yEnd[1] * MM_TO_M, yEnd[2] * MM_TO_M],
          ]}
          color="#38bdf8"
          lineWidth={2.5}
          raycast={NOOP_RAYCAST}
        />
        <Html
          position={[
            ((yStart[0] + yEnd[0]) / 2) * MM_TO_M,
            ((yStart[1] + yEnd[1]) / 2) * MM_TO_M,
            ((yStart[2] + yEnd[2]) / 2) * MM_TO_M,
          ]}
          center
          zIndexRange={[30, 10]}
        >
          <div className="pointer-events-none whitespace-nowrap rounded border border-sky-300 bg-sky-500 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-950 shadow">
            Kapak Y: {hMm} mm
          </div>
        </Html>
      </group>
    );
  }

  // CF-08: Suppress internal cell & drawer X/Y/Z overlays whenever doorEditorMode is active
  if (doorEditorMode) return null;

  // ---------------------------------------------------------------------------
  // 2. SEÇİLİ ÇEKMECE(LER) X / Y / Z FİZİKSEL ÖLÇÜ ÇİZGİLERİ
  // ---------------------------------------------------------------------------
  if (activeDrawerIds.length > 0) {
    const selectedDrawers = activeDrawerIds
      .map((id) => resolved.drawers.find((d) => d.id === id))
      .filter((d): d is NonNullable<typeof d> => Boolean(d));

    if (selectedDrawers.length === 0) return null;

    const firstDrw = selectedDrawers[0];
    const isRunA = firstDrw.wallAxis === 'A';
    const minY = Math.min(...selectedDrawers.map((d) => d.yStartMm));
    const maxY = Math.max(...selectedDrawers.map((d) => d.yEndMm));
    const totalHMm = Math.round(maxY - minY);
    const wMm = firstDrw.widthMm;
    const dMm = firstDrw.depthMm;
    const [cx, , cz] = firstDrw.boxWorldPositionMm;
    const frontOffset = 30;

    let xStartMm: [number, number, number];
    let xEndMm: [number, number, number];
    let yStartMm: [number, number, number];
    let yEndMm: [number, number, number];
    let zStartMm: [number, number, number];
    let zEndMm: [number, number, number];

    if (isRunA) {
      const frontZ = cz + dMm / 2 + frontOffset;
      xStartMm = [cx - wMm / 2, minY + 10, frontZ];
      xEndMm = [cx + wMm / 2, minY + 10, frontZ];
      yStartMm = [cx + wMm / 2 - 12, minY, frontZ];
      yEndMm = [cx + wMm / 2 - 12, maxY, frontZ];
      zStartMm = [cx - wMm / 2 + 14, maxY - 10, cz - dMm / 2];
      zEndMm = [cx - wMm / 2 + 14, maxY - 10, cz + dMm / 2];
    } else {
      const frontX = cx + dMm / 2 + frontOffset;
      xStartMm = [frontX, minY + 10, cz - wMm / 2];
      xEndMm = [frontX, minY + 10, cz + wMm / 2];
      yStartMm = [frontX, minY, cz + wMm / 2 - 12];
      yEndMm = [frontX, maxY, cz + wMm / 2 - 12];
      zStartMm = [cx - dMm / 2, maxY - 10, cz - wMm / 2 + 14];
      zEndMm = [cx + dMm / 2, maxY - 10, cz - wMm / 2 + 14];
    }

    const drawerSpecs: AxisLineSpec[] = [
      {
        axis: 'X',
        title: 'Çekmece Dış Genişlik (X)',
        shortTag: `X: ${wMm} mm`,
        valueMm: wMm,
        netDetailLabel: `Net İç: ${firstDrw.innerWidthMm} mm (${firstDrw.sideThicknessMm}mm Yan)`,
        color: '#f59e0b',
        badgeClass: 'bg-amber-500 text-slate-950 border-amber-300',
        startMm: xStartMm,
        endMm: xEndMm,
        defaultDirection: 'right',
        directionOptions: [],
        minMm: 200,
        maxMm: 1200,
      },
      {
        axis: 'Y',
        title:
          selectedDrawers.length === 1
            ? `Çekmece #${firstDrw.drawerIndex + 1} Ön Yükseklik (Y)`
            : `${selectedDrawers.length} Çekmece Toplam Yükseklik (Y)`,
        shortTag: `Y: ${totalHMm} mm`,
        valueMm: totalHMm,
        netDetailLabel:
          selectedDrawers.length === 1
            ? `Net İç Yük: ${firstDrw.innerHeightMm} mm`
            : `${selectedDrawers.length} çekmece seçili`,
        color: '#38bdf8',
        badgeClass: 'bg-sky-500 text-slate-950 border-sky-300 hover:bg-sky-400',
        startMm: yStartMm,
        endMm: yEndMm,
        defaultDirection: 'up',
        directionOptions: [],
        minMm: 80,
        maxMm: Math.max(120, firstDrw.parentBankHeightMm - 80),
      },
      {
        axis: 'Z',
        title: 'Çekmece Kasa Derinliği (Z)',
        shortTag: `Z: ${dMm} mm`,
        valueMm: dMm,
        netDetailLabel: `Net İç: ${firstDrw.innerDepthMm} mm (Taban: ${firstDrw.bottomThicknessMm}mm)`,
        color: '#34d399',
        badgeClass: 'bg-emerald-500 text-slate-950 border-emerald-300',
        startMm: zStartMm,
        endMm: zEndMm,
        defaultDirection: 'front',
        directionOptions: [],
        minMm: 250,
        maxMm: 750,
      },
    ];

    return (
      <group>
        {drawerSpecs.map((spec) => {
          const startM: [number, number, number] = [
            spec.startMm[0] * MM_TO_M,
            spec.startMm[1] * MM_TO_M,
            spec.startMm[2] * MM_TO_M,
          ];
          const endM: [number, number, number] = [
            spec.endMm[0] * MM_TO_M,
            spec.endMm[1] * MM_TO_M,
            spec.endMm[2] * MM_TO_M,
          ];
          const midM: [number, number, number] = [
            (startM[0] + endM[0]) / 2,
            (startM[1] + endM[1]) / 2,
            (startM[2] + endM[2]) / 2,
          ];

          const isEditing = editingAxis === spec.axis && spec.axis === 'Y' && selectedDrawers.length === 1;

          return (
            <group key={`drw-dim-${spec.axis}`}>
              <Line points={[startM, endM]} color={spec.color} lineWidth={2.6} raycast={NOOP_RAYCAST} />
              <Html
                position={midM}
                center
                distanceFactor={viewMode === '3d-perspective' ? 5.0 : undefined}
                zIndexRange={isEditing ? [60, 40] : [30, 10]}
              >
                {isEditing ? (
                  <div
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    className="pointer-events-auto flex flex-col gap-1.5 rounded-lg border border-sky-400 bg-slate-950/95 p-2 text-[11px] text-slate-100 shadow-2xl min-w-[205px]"
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold text-sky-300">
                      <span>{spec.title}</span>
                      <button
                        type="button"
                        aria-label="Ölçü düzenleyiciyi kapat"
                        title="Ölçü düzenleyiciyi kapat"
                        onClick={() => {
                          setEditingAxis(null);
                          setDraftError(null);
                        }}
                        className="inline-flex min-h-6 min-w-6 items-center justify-center rounded text-slate-400 hover:bg-slate-800 hover:text-white"
                      >
                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        ref={inputRef}
                        type="number"
                        aria-label={spec.title}
                        aria-invalid={draftError ? true : undefined}
                        step={10}
                        min={spec.minMm}
                        max={spec.maxMm}
                        value={draftVal}
                        onChange={(e) => {
                          setDraftVal(e.target.value);
                          if (draftError) setDraftError(null);
                        }}
                        onKeyDown={(e) => {
                          e.stopPropagation();
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const parsed = parseOverlayMmDraft(
                              draftVal,
                              Boolean(e.currentTarget.validity?.badInput),
                              spec.minMm,
                              spec.maxMm
                            );
                            if (!parsed.ok) {
                              setDraftError(parsed.error);
                              return;
                            }
                            updateSelectedDrawerHeight(firstDrw.id, parsed.value);
                            setDraftError(null);
                            setEditingAxis(null);
                          } else if (e.key === 'Escape') {
                            e.preventDefault();
                            setDraftError(null);
                            setEditingAxis(null);
                          }
                        }}
                        className="w-20 rounded border border-slate-500 bg-slate-900 px-2 py-1 font-mono text-xs font-bold text-white"
                      />
                      <span className="font-mono text-[10px] text-slate-400">mm</span>
                      <button
                        type="button"
                        onClick={() => {
                          const parsed = parseOverlayMmDraft(
                            draftVal,
                            Boolean(inputRef.current?.validity?.badInput),
                            spec.minMm,
                            spec.maxMm
                          );
                          if (!parsed.ok) {
                            setDraftError(parsed.error);
                            return;
                          }
                          updateSelectedDrawerHeight(firstDrw.id, parsed.value);
                          setDraftError(null);
                          setEditingAxis(null);
                        }}
                        className="flex min-h-6 items-center gap-1 rounded bg-sky-500 px-2 py-1 text-[10px] font-bold text-slate-950 hover:bg-sky-400"
                      >
                        <Check className="h-3 w-3" aria-hidden="true" />
                        Uygula
                      </button>
                    </div>
                    {draftError && (
                      <div
                        role="alert"
                        className="rounded border border-rose-500/40 bg-rose-950/90 px-1.5 py-0.5 text-[10px] text-rose-200"
                      >
                        {draftError}
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (spec.axis === 'Y' && selectedDrawers.length === 1) {
                        setEditingAxis('Y');
                        setDraftVal(String(spec.valueMm));
                      }
                    }}
                    className={`pointer-events-auto group flex flex-col items-center rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold shadow-lg ${spec.badgeClass}`}
                  >
                    <span className="flex items-center gap-1 whitespace-nowrap">
                      <span>{spec.shortTag}</span>
                      {spec.axis === 'Y' && selectedDrawers.length === 1 && (
                        <Pencil className="h-2.5 w-2.5 opacity-80" />
                      )}
                    </span>
                    {spec.netDetailLabel && (
                      <span className="text-[8px] font-semibold opacity-85 whitespace-nowrap">
                        {spec.netDetailLabel}
                      </span>
                    )}
                  </button>
                )}
              </Html>
            </group>
          );
        })}
      </group>
    );
  }

  // ---------------------------------------------------------------------------
  // 3. SEÇİLİ HÜCRE / RAF GRUBU / BEŞGEN KÖŞE ÖLÇÜ ÇİZGİLERİ
  // ---------------------------------------------------------------------------
  const group = analyzeSelectedCellsGroup(activeCellIds, resolved);
  if (!shouldShowCellDimensionOverlay(group, doorEditorMode)) return null;

  const first = group.cells[0];
  const [cx, , cz] = group.groupWorldCenterMm;
  const wMm = group.grossWidthMm;
  const hMm = group.grossHeightMm;
  const dMm = group.netDepthMm;

  const isRunA = first.wallAxis === 'A';
  const isCorner = group.isCornerSelection;
  const activeJunction = design.junctions[0] ?? null;

  let xStartMm: [number, number, number];
  let xEndMm: [number, number, number];
  let yStartPosMm: [number, number, number];
  let yEndPosMm: [number, number, number];
  let zStartMm: [number, number, number];
  let zEndMm: [number, number, number];

  const frontOffsetMm = 28;
  // Offset cell X pill cleanly above bottom bayOuter pills (y=40) and away from Y midpoint (CF-14)
  const cellXLineY =
    group.yStartMm < 180 && group.yEndMm > 270
      ? Math.min(group.yEndMm - 40, Math.max(group.yStartMm + 48, 220))
      : group.yStartMm + Math.min(44, Math.max(14, Math.round(hMm * 0.14)));

  if (isCorner) {
    // Stagger Köşe A (bottom), Y (middle), and Köşe B (upper) vertically so none bury each other (CF-14)
    const cornerZLineY = group.yEndMm - Math.min(54, Math.max(18, Math.round(hMm * 0.18)));
    xStartMm = [cx - wMm * 0.35, group.yStartMm + 24, cz + wMm * 0.35];
    xEndMm = [cx + wMm * 0.35, group.yStartMm + 24, cz - wMm * 0.35];
    yStartPosMm = [cx + wMm * 0.36, group.yStartMm, cz - wMm * 0.36];
    yEndPosMm = [cx + wMm * 0.36, group.yEndMm, cz - wMm * 0.36];
    zStartMm = [cx - dMm * 0.3, cornerZLineY, cz - dMm * 0.3];
    zEndMm = [cx + dMm * 0.3, cornerZLineY, cz + dMm * 0.3];
  } else if (isRunA) {
    const frontZ = cz + dMm / 2 + frontOffsetMm;
    const backZ = cz - dMm / 2;
    const leftX = cx - wMm / 2;
    const rightX = cx + wMm / 2;

    xStartMm = [leftX, cellXLineY, frontZ];
    xEndMm = [rightX, cellXLineY, frontZ];

    yStartPosMm = [rightX - 14, group.yStartMm, frontZ];
    yEndPosMm = [rightX - 14, group.yEndMm, frontZ];

    zStartMm = [leftX + 18, group.yEndMm - 14, backZ];
    zEndMm = [leftX + 18, group.yEndMm - 14, cz + dMm / 2];
  } else {
    const frontX = cx + dMm / 2 + frontOffsetMm;
    const backX = cx - dMm / 2;
    const leftZ = cz - wMm / 2;
    const rightZ = cz + wMm / 2;

    xStartMm = [frontX, cellXLineY, leftZ];
    xEndMm = [frontX, cellXLineY, rightZ];

    yStartPosMm = [frontX, group.yStartMm, rightZ - 14];
    yEndPosMm = [frontX, group.yEndMm, rightZ - 14];

    zStartMm = [backX, group.yEndMm - 14, leftZ + 18];
    zEndMm = [cx + dMm / 2, group.yEndMm - 14, leftZ + 18];
  }

  const axisSpecs: AxisLineSpec[] = [
    {
      axis: 'X',
      title: isCorner
        ? 'Beşgen Köşe Kol Genişliği (Köşe A / B)'
        : group.cells.length > 1
          ? 'Toplam Genişlik (X)'
          : 'Hücre Genişliği (X)',
      shortTag: isCorner
        ? `Köşe A: ${activeJunction?.diagonalArmAMm ?? wMm} mm`
        : `X: ${wMm} mm`,
      valueMm: isCorner ? (activeJunction?.diagonalArmAMm ?? wMm) : wMm,
      netDetailLabel: isCorner
        ? `Tüm köşe rafları ortak kol ölçüsü paylaşır`
        : group.widthDividersMm > 0
          ? `Net: ${group.netWidthSumMm} + ${group.widthDividersMm}mm Bölücü`
          : undefined,
      color: '#f59e0b',
      badgeClass: 'bg-amber-500 text-slate-950 border-amber-300 hover:bg-amber-400',
      startMm: xStartMm,
      endMm: xEndMm,
      defaultDirection: 'right',
      directionOptions: [
        { value: 'right', label: 'Sağa (Sol Sabit)' },
        { value: 'left', label: 'Sola (Sağ Sabit)' },
      ],
      minMm: isCorner ? 750 : 100,
      maxMm: isCorner ? 1300 : 2400,
    },
    {
      axis: 'Y',
      title: isCorner
        ? 'Köşe Raf Aralığı Yüksekliği (Y)'
        : group.cells.length > 1
          ? 'Toplam Yükseklik (Y)'
          : 'Hücre Yüksekliği (Y)',
      shortTag: `Y: ${hMm} mm`,
      valueMm: hMm,
      netDetailLabel:
        group.heightDividersMm > 0
          ? `Net: ${group.netHeightSumMm} + ${group.heightDividersMm}mm Raf`
          : undefined,
      color: '#38bdf8',
      badgeClass: 'bg-sky-500 text-slate-950 border-sky-300 hover:bg-sky-400',
      startMm: yStartPosMm,
      endMm: yEndPosMm,
      defaultDirection: 'up',
      directionOptions: [
        { value: 'up', label: 'Yukarı (Alt Sabit)' },
        { value: 'down', label: 'Aşağı (Üst Sabit)' },
      ],
      minMm: Math.max(80, group.cells.length * 80 + group.heightDividersMm),
      maxMm: 2600,
    },
    {
      axis: 'Z',
      title: isCorner ? 'Beşgen Köşe B Kolu (Z)' : 'Net İç Derinlik (Z)',
      shortTag: isCorner
        ? `Köşe B: ${activeJunction?.diagonalArmBMm ?? dMm} mm`
        : `Z: ${dMm} mm`,
      valueMm: isCorner ? (activeJunction?.diagonalArmBMm ?? dMm) : dMm,
      color: '#34d399',
      badgeClass: 'bg-emerald-500 text-slate-950 border-emerald-300 hover:bg-emerald-400',
      startMm: zStartMm,
      endMm: zEndMm,
      defaultDirection: 'front',
      directionOptions: [
        { value: 'front', label: 'Öne (Arka Duvar Sabit)' },
        { value: 'back', label: 'Arkaya (Ön Sabit)' },
      ],
      minMm: isCorner ? 750 : 324,
      maxMm: isCorner ? 1300 : 774,
    },
  ];

  const handleOpenAxisEditor = (spec: AxisLineSpec, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAxis(spec.axis);
    setDraftVal(String(spec.valueMm));
    setDraftError(null);
    setDirection(spec.defaultDirection);
  };

  const handlePreviewOrApply = (spec: AxisLineSpec, e?: React.SyntheticEvent) => {
    e?.stopPropagation();
    const parsed = parseOverlayMmDraft(
      draftVal,
      Boolean(inputRef.current?.validity?.badInput),
      spec.minMm,
      spec.maxMm
    );
    if (!parsed.ok) {
      setDraftError(parsed.error);
      return;
    }
    const rounded = parsed.value;
    setDraftError(null);

    if (isCorner && (spec.axis === 'X' || spec.axis === 'Z')) {
      const paramField = spec.axis === 'X' ? 'diagonalArmAMm' : 'diagonalArmBMm';
      updateCornerParam(paramField, Math.max(750, Math.min(1300, rounded)));
      setEditingAxis(null);
      return;
    }

    startOrUpdateResizeDraft(spec.axis, direction, rounded);
    const latestDraft = useWardrobeStore.getState().resizeDraft;
    if (
      latestDraft &&
      latestDraft.conflictOverlapMm === 0 &&
      !latestDraft.exceedsBoundary &&
      latestDraft.neighborCellIds.length === 0
    ) {
      commitResizeDraft();
    }
    setEditingAxis(null);
  };

  return (
    <group>
      {axisSpecs.map((spec) => {
        const startM: [number, number, number] = [
          spec.startMm[0] * MM_TO_M,
          spec.startMm[1] * MM_TO_M,
          spec.startMm[2] * MM_TO_M,
        ];
        const endM: [number, number, number] = [
          spec.endMm[0] * MM_TO_M,
          spec.endMm[1] * MM_TO_M,
          spec.endMm[2] * MM_TO_M,
        ];
        const midM: [number, number, number] = [
          (startM[0] + endM[0]) / 2,
          (startM[1] + endM[1]) / 2,
          (startM[2] + endM[2]) / 2,
        ];

        const isEditing = editingAxis === spec.axis;

        return (
          <group key={`sel-dim-${spec.axis}`}>
            <Line points={[startM, endM]} color={spec.color} lineWidth={2.6} raycast={NOOP_RAYCAST} />
            <Html
              position={midM}
              center
              distanceFactor={viewMode === '3d-perspective' ? 5.0 : undefined}
              zIndexRange={isEditing ? [60, 40] : [30, 10]}
            >
              {isEditing ? (
                <div
                  onPointerDown={(e) => e.stopPropagation()}
                  onPointerUp={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  onWheel={(e) => e.stopPropagation()}
                  className="pointer-events-auto flex flex-col gap-1.5 rounded-lg border border-amber-400 bg-slate-950/95 p-2 text-[11px] text-slate-100 shadow-2xl backdrop-blur-md min-w-[215px]"
                >
                  <div className="flex items-center justify-between text-[10px] font-bold text-amber-300">
                    <span>{spec.title}</span>
                    <button
                      type="button"
                      aria-label="Ölçü düzenleyiciyi kapat"
                      title="Ölçü düzenleyiciyi kapat"
                      onClick={() => {
                        setEditingAxis(null);
                        setDraftError(null);
                      }}
                      className="inline-flex min-h-6 min-w-6 items-center justify-center rounded text-slate-400 hover:bg-slate-800 hover:text-white"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>

                  {isCorner && (spec.axis === 'X' || spec.axis === 'Z') ? (
                    <div className="text-[10px] text-slate-300 leading-snug">
                      Beşgen köşe modülündeki tüm raflar aynı kol ölçüsünü paylaşır (750–1300 mm):
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      {spec.directionOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setDirection(opt.value)}
                          className={`min-h-6 rounded border px-1.5 py-0.5 font-medium transition ${
                            direction === opt.value
                              ? 'border-amber-400 bg-amber-500/25 text-amber-200 font-semibold'
                              : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    <input
                      ref={inputRef}
                      type="number"
                      aria-label={spec.title}
                      aria-invalid={draftError ? true : undefined}
                      step={10}
                      min={spec.minMm}
                      max={spec.maxMm}
                      value={draftVal}
                      onChange={(e) => {
                        setDraftVal(e.target.value);
                        if (draftError) setDraftError(null);
                      }}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handlePreviewOrApply(spec);
                        } else if (e.key === 'Escape') {
                          e.preventDefault();
                          setDraftError(null);
                          setEditingAxis(null);
                        }
                      }}
                      className="w-24 rounded border border-slate-500 bg-slate-900 px-2 py-1 font-mono text-xs font-bold text-white focus:border-amber-400 focus:outline-none"
                    />
                    <span className="font-mono text-[10px] text-slate-400">mm</span>
                    <button
                      type="button"
                      onClick={(e) => handlePreviewOrApply(spec, e)}
                      className="flex min-h-6 items-center gap-1 rounded bg-amber-500 px-2 py-1 text-[10px] font-bold text-slate-950 hover:bg-amber-400"
                    >
                      <Check className="h-3 w-3" aria-hidden="true" />
                      Uygula
                    </button>
                  </div>
                  {draftError && (
                    <div
                      role="alert"
                      className="rounded border border-rose-500/40 bg-rose-950/90 px-1.5 py-0.5 text-[10px] text-rose-200"
                    >
                      {draftError}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => handleOpenAxisEditor(spec, e)}
                  title={`${spec.title} — Yönlü boyutlandırmak için tıklayın`}
                  className={`pointer-events-auto group flex flex-col items-center rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold shadow-lg transition hover:scale-105 ${spec.badgeClass}`}
                >
                  <span className="flex items-center gap-1 whitespace-nowrap">
                    <span>{spec.shortTag}</span>
                    <Pencil className="h-2.5 w-2.5 opacity-75 group-hover:opacity-100" />
                  </span>
                  {spec.netDetailLabel && (
                    <span className="text-[8px] font-semibold opacity-85 whitespace-nowrap">
                      {spec.netDetailLabel}
                    </span>
                  )}
                </button>
              )}
            </Html>
          </group>
        );
      })}

      {/* ÇAKIŞMA ÖNİZLEMESİ 3D KIRMIZI ETİKETİ */}
      {resizeDraft &&
        resizeDraft.conflictBoxWorldCenterMm &&
        (resizeDraft.conflictOverlapMm > 0 || resizeDraft.exceedsBoundary) && (
          <Html
            position={[
              resizeDraft.conflictBoxWorldCenterMm[0] * MM_TO_M,
              resizeDraft.conflictBoxWorldCenterMm[1] * MM_TO_M,
              resizeDraft.conflictBoxWorldCenterMm[2] * MM_TO_M,
            ]}
            center
            zIndexRange={[35, 15]}
          >
            <div className="pointer-events-none flex items-center gap-1.5 whitespace-nowrap rounded-md border border-rose-400 bg-rose-950/95 px-2.5 py-1 text-[11px] font-bold text-rose-200 shadow-xl">
              <AlertTriangle className="h-3.5 w-3.5 text-rose-400 shrink-0" />
              <span>
                Çakışma: {resizeDraft.conflictOverlapMm} mm ({resizeDraft.neighborLabel})
              </span>
            </div>
          </Html>
        )}
    </group>
  );
}
