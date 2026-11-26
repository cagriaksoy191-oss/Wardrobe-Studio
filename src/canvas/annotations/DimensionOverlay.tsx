import { Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { SceneHtml as Html } from './SceneHtml';
import { Check, Pencil, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type * as THREE from 'three';
import type { DimensionAnnotation, Run } from '../../core/schema/types';
import { type StudioViewMode, useWardrobeStore } from '../../store/useWardrobeStore';
import { readNumberDraft } from '../../ui/editorFeedback';

const MM_TO_M = 0.001;
const NOOP_RAYCAST: THREE.Object3D['raycast'] = () => null;

function ViewProjectionGate({
  viewMode,
  onProjected,
}: {
  viewMode: StudioViewMode;
  onProjected: (mode: StudioViewMode) => void;
}) {
  const reportedRef = useRef<StudioViewMode | null>(null);
  useFrame(() => {
    if (reportedRef.current !== viewMode) {
      reportedRef.current = viewMode;
      onProjected(viewMode);
    }
  });
  return null;
}

export function buildMergedInnerByOuterMap(
  visibleDimensions: DimensionAnnotation[],
  viewMode: StudioViewMode,
  selectedBayId: string | null
): { mergedInnerByOuterId: Map<string, DimensionAnnotation>; suppressedInnerIds: Set<string> } {
  const mergedInnerByOuterId = new Map<string, DimensionAnnotation>();
  const suppressedInnerIds = new Set<string>();
  const isFront2D = viewMode === '2d-front-A' || viewMode === '2d-front-B';
  const outerByBayId = new Map<string, DimensionAnnotation>();
  for (const dim of visibleDimensions) {
    if (dim.kind === 'bayOuter' && dim.bayId) {
      outerByBayId.set(dim.bayId, dim);
    }
  }
  for (const dim of visibleDimensions) {
    if (dim.kind !== 'bayInner' || !dim.bayId) continue;
    const shouldMerge = isFront2D || (viewMode === '3d-perspective' && dim.bayId === selectedBayId);
    if (!shouldMerge) continue;
    const outer = outerByBayId.get(dim.bayId);
    if (outer) {
      mergedInnerByOuterId.set(outer.id, dim);
      suppressedInnerIds.add(dim.id);
    }
  }
  return { mergedInnerByOuterId, suppressedInnerIds };
}

export function resolveDimensionRenderEndpoints(
  dim: DimensionAnnotation,
  viewMode: StudioViewMode,
  runs: Run[]
): { startMm: [number, number, number]; endMm: [number, number, number] } {
  const run = runs.find((r) => r.id === dim.runId);
  if (dim.kind === 'depth' && viewMode === '3d-perspective') {
    if (run) {
      const topY = run.heightMm + 35;
      return {
        startMm: [dim.startMm[0], topY, dim.startMm[2]],
        endMm: [dim.endMm[0], topY, dim.endMm[2]],
      };
    }
  }
  // CF-14: Stagger runTotal above cornerArm in 2D Front views so Köşe B never collides with B kolu
  if (dim.kind === 'runTotal' && (viewMode === '2d-front-A' || viewMode === '2d-front-B') && run) {
    const raisedY = run.heightMm + 250;
    return {
      startMm: [dim.startMm[0], raisedY, dim.startMm[2]],
      endMm: [dim.endMm[0], raisedY, dim.endMm[2]],
    };
  }
  if (dim.kind === 'cornerArm' && (viewMode === '2d-front-A' || viewMode === '2d-front-B') && run) {
    const armY = run.heightMm + 50;
    return {
      startMm: [dim.startMm[0], armY, dim.startMm[2]],
      endMm: [dim.endMm[0], armY, dim.endMm[2]],
    };
  }
  // CF-14: Stagger narrow adjacent bayOuter pills in 2D Front B (e.g. Dış: 680 vs Dış: 600 at 1024x768)
  if (dim.kind === 'bayOuter' && viewMode === '2d-front-B' && run && dim.bayId) {
    const bIdx = run.bays.findIndex((b) => b.id === dim.bayId);
    if (bIdx >= 0 && bIdx % 2 === 1 && run.bays.length > 1) {
      const staggeredY = 175;
      return {
        startMm: [dim.startMm[0], staggeredY, dim.startMm[2]],
        endMm: [dim.endMm[0], staggeredY, dim.endMm[2]],
      };
    }
  }
  // CF-14: In 3D L-layouts, elevate Run B bayOuter dimensions cleanly above Run A bayOuter pills
  if (
    dim.kind === 'bayOuter' &&
    viewMode === '3d-perspective' &&
    run?.wallAxis === 'B' &&
    runs.length > 1
  ) {
    const elevatedY = 225;
    return {
      startMm: [dim.startMm[0], elevatedY, dim.startMm[2]],
      endMm: [dim.endMm[0], elevatedY, dim.endMm[2]],
    };
  }
  return { startMm: dim.startMm, endMm: dim.endMm };
}

interface DimensionOverlayProps {
  dimensions: DimensionAnnotation[];
  viewMode: StudioViewMode;
  selectedBayId: string | null;
}

export function DimensionOverlay({
  dimensions,
  viewMode,
  selectedBayId,
}: DimensionOverlayProps) {
  const updateRunDimension = useWardrobeStore((s) => s.updateRunDimension);
  const updateCornerParam = useWardrobeStore((s) => s.updateCornerParam);
  const setBaySize = useWardrobeStore((s) => s.setBaySize);
  const selectBay = useWardrobeStore((s) => s.selectBay);
  const runs = useWardrobeStore((s) => s.design.runs);

  const [editingDimId, setEditingDimId] = useState<string | null>(null);
  const [draftValue, setDraftValue] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [projectedViewMode, setProjectedViewMode] = useState<StudioViewMode>(viewMode);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const isViewProjected = projectedViewMode === viewMode;

  useEffect(() => {
    if (editingDimId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingDimId]);

  const visibleDimensions = dimensions.filter((d) => {
    if (viewMode === '3d-perspective' && editingDimId !== d.id &&
        (d.kind === 'cornerArm' || (d.kind === 'bayInner' && d.bayId !== selectedBayId))) return false;
    if (viewMode === '2d-front-A') {
      return d.kind !== 'depth' && (!d.runId || runs.some(run => run.id === d.runId && run.wallAxis === 'A'));
    }
    if (viewMode === '2d-front-B') {
      return d.kind !== 'depth' && runs.some(run => run.id === d.runId && run.wallAxis === 'B');
    }
    if (viewMode === '2d-plan-top') {
      return (
        d.kind === 'runTotal' ||
        d.kind === 'depth' ||
        d.kind === 'cornerArm' ||
        d.kind === 'bayOuter'
      );
    }
    return true;
  });
  const { mergedInnerByOuterId, suppressedInnerIds } = buildMergedInnerByOuterMap(
    visibleDimensions,
    viewMode,
    selectedBayId
  );

  const startEditing = (dim: DimensionAnnotation, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!dim.editTarget) return;
    if (dim.bayId) {
      selectBay(dim.bayId);
    }
    const initialNumeric =
      dim.editTarget === 'bayInnerDerived' && dim.sourceValueMm !== undefined
        ? Math.round(dim.sourceValueMm)
        : Math.round(dim.valueMm);
    setEditingDimId(dim.id);
    setDraftValue(String(initialNumeric));
    setValidationError(null);
  };

  const cancelEditing = (e?: React.SyntheticEvent) => {
    e?.stopPropagation();
    setEditingDimId(null);
    setValidationError(null);
  };

  const commitEditing = (dim: DimensionAnnotation, e?: React.SyntheticEvent) => {
    e?.stopPropagation();
    const minMm = dim.minMm ?? 200;
    const maxMm = dim.maxMm ?? 6000;
    const badInput = Boolean(inputRef.current?.validity?.badInput);
    const result = readNumberDraft(draftValue, badInput, minMm, maxMm);

    if (result.kind !== 'value') {
      setValidationError(
        result.kind === 'empty'
          ? `Boş bırakılamaz. Geçerli aralık: ${minMm} – ${maxMm} mm`
          : result.kind === 'outOfRange'
            ? `Geçerli aralık: ${minMm} – ${maxMm} mm`
            : 'Lütfen geçerli bir sayısal milimetre değeri girin.'
      );
      return;
    }

    const rounded = result.value;

    switch (dim.editTarget) {
      case 'runLength':
        if (dim.runId) {
          updateRunDimension(dim.runId, 'lengthMm', rounded);
        }
        break;
      case 'runDepth':
        if (dim.runId) {
          updateRunDimension(dim.runId, 'depthMm', rounded);
        }
        break;
      case 'runHeight':
        if (dim.runId) {
          updateRunDimension(dim.runId, 'heightMm', rounded);
        }
        break;
      case 'cornerArmA':
        updateCornerParam('diagonalArmAMm', rounded);
        break;
      case 'cornerArmB':
        updateCornerParam('diagonalArmBMm', rounded);
        break;
      case 'bayOuterWidth':
      case 'bayInnerDerived':
        if (dim.runId && dim.bayId) {
          selectBay(dim.bayId);
          setBaySize(dim.runId, dim.bayId, { kind: 'fixed', mm: rounded });
        }
        break;
      default:
        break;
    }

    setEditingDimId(null);
    setValidationError(null);
  };

  return (
    <group>
      <ViewProjectionGate viewMode={viewMode} onProjected={setProjectedViewMode} />
      {visibleDimensions.map((dim) => {
        const endpoints = resolveDimensionRenderEndpoints(dim, viewMode, runs);
        const startM: [number, number, number] = [
          endpoints.startMm[0] * MM_TO_M,
          endpoints.startMm[1] * MM_TO_M,
          endpoints.startMm[2] * MM_TO_M,
        ];
        const endM: [number, number, number] = [
          endpoints.endMm[0] * MM_TO_M,
          endpoints.endMm[1] * MM_TO_M,
          endpoints.endMm[2] * MM_TO_M,
        ];
        const midM: [number, number, number] = [
          (startM[0] + endM[0]) / 2,
          (startM[1] + endM[1]) / 2,
          (startM[2] + endM[2]) / 2,
        ];

        const isSelectedBayDim = dim.bayId !== undefined && dim.bayId === selectedBayId;
        const isInner = dim.kind === 'bayInner';
        const isEditingThis = editingDimId === dim.id;
        const mergedInner = mergedInnerByOuterId.get(dim.id);
        const isSuppressedInner = suppressedInnerIds.has(dim.id);
        const isFront2D = viewMode === '2d-front-A' || viewMode === '2d-front-B';
        const lineColor = isEditingThis
          ? '#10b981'
          : isSelectedBayDim
            ? '#f59e0b'
            : isInner
              ? '#38bdf8'
              : '#94a3b8';

        return (
          <group key={dim.id}>
            <Line
              points={[startM, endM]}
              color={lineColor}
              lineWidth={isEditingThis ? 2.5 : isSelectedBayDim ? 2 : 1.25}
              dashed={isInner}
              dashScale={40}
              dashSize={1}
              gapSize={0.5}
              raycast={NOOP_RAYCAST}
            />
            {(!isSuppressedInner || isEditingThis) && <Html
              position={midM}
              center
              distanceFactor={viewMode === '3d-perspective' ? 5.5 : undefined}
              zIndexRange={isEditingThis ? [60, 40] : [20, 0]}
            >
              {isEditingThis ? (
                <div
                  onPointerDown={(e) => e.stopPropagation()}
                  onPointerUp={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  onDoubleClick={(e) => e.stopPropagation()}
                  onWheel={(e) => e.stopPropagation()}
                  className="pointer-events-auto flex flex-col gap-1 rounded-lg border border-emerald-400 bg-slate-950/95 p-2 text-[11px] text-slate-100 shadow-xl backdrop-blur-md min-w-[185px]"
                >
                  <div className="flex items-center justify-between gap-2 text-[10px] font-semibold text-emerald-300">
                    <span>
                      {dim.editTarget === 'bayInnerDerived'
                        ? `Kaynak Dış Genişlik (Net İç: ${Math.round(dim.valueMm)} mm)`
                        : dim.label.split(':')[0] + ' (mm)'}
                    </span>
                    <span className="text-[9px] font-normal text-slate-400">
                      {dim.minMm ?? 200}–{dim.maxMm ?? 6000}
                    </span>
                  </div>
                  {mergedInner && (
                    <span className="text-[9px] text-sky-300">{mergedInner.label}</span>
                  )}
                  <div className="flex items-center gap-1">
                    <input
                      ref={inputRef}
                      type="number"
                      aria-label={`${dim.label.split(':')[0]} değeri (mm)`}
                      aria-invalid={validationError ? true : undefined}
                      aria-describedby={validationError ? `dim-error-${dim.id}` : undefined}
                      min={dim.minMm ?? 200}
                      max={dim.maxMm ?? 6000}
                      step={10}
                      value={draftValue}
                      onChange={(e) => {
                        setDraftValue(e.target.value);
                        if (validationError) setValidationError(null);
                      }}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          commitEditing(dim);
                        } else if (e.key === 'Escape') {
                          e.preventDefault();
                          cancelEditing();
                        }
                      }}
                      className="w-24 rounded border border-slate-500 bg-slate-900 px-2 py-1 font-mono text-xs font-bold text-white focus:border-emerald-400 focus:outline-none"
                    />
                    <span className="text-[10px] font-mono text-slate-400">mm</span>
                    <button
                      type="button"
                      onClick={(e) => commitEditing(dim, e)}
                      aria-label="Ölçüyü onayla"
                      title="Onayla (Enter)"
                      className="inline-flex min-h-6 min-w-6 items-center justify-center rounded bg-emerald-500 p-1 text-slate-950 hover:bg-emerald-400 transition"
                    >
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => cancelEditing(e)}
                      aria-label="Ölçü düzenlemeyi iptal et"
                      title="İptal (Esc)"
                      className="inline-flex min-h-6 min-w-6 items-center justify-center rounded bg-slate-800 p-1 text-slate-300 hover:bg-slate-700 transition"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                  {dim.editTarget === 'bayInnerDerived' && (
                    <div className="text-[9px] text-sky-300 leading-tight">
                      Türetilmiş net iç ölçü, bölme dış genişliğinden ({dim.sourceValueMm} mm) otomatik hesaplanır.
                    </div>
                  )}
                  {validationError && (
                    <div id={`dim-error-${dim.id}`} role="alert" className="rounded bg-rose-950/90 border border-rose-500/40 px-1.5 py-0.5 text-[9px] text-rose-200">
                      {validationError}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => startEditing(dim, e)}
                  title={
                    dim.editTarget === 'bayInnerDerived'
                      ? `${dim.label} — Kaynak dış genişliği (${dim.sourceValueMm} mm) düzenlemek için tıklayın`
                      : `${dim.label} — Doğrudan ölçü girmek için tıklayın`
                  }
                  className={`${isViewProjected ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'} group flex min-h-[25px] ${isFront2D && mergedInner ? 'flex-col items-center justify-center leading-tight py-0.5' : 'items-center gap-1 py-0.5'} whitespace-nowrap rounded px-1.5 text-[10px] font-mono font-medium shadow-sm border backdrop-blur-sm transition hover:scale-105 ${
                    isSelectedBayDim
                      ? 'bg-amber-500/95 text-slate-950 border-amber-300 font-bold hover:bg-amber-400'
                      : isInner
                        ? 'bg-sky-950/90 text-sky-200 border-sky-500/50 hover:border-sky-300 hover:bg-sky-900'
                        : 'bg-slate-900/90 text-slate-200 border-slate-700 hover:border-amber-400/70 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <span>{dim.kind === 'runTotal' ? `${runs.find(run=>run.id===dim.runId)?.wallAxis ?? 'A'} kolu · ${dim.valueMm} mm` : dim.label}</span>
                    {!isFront2D && mergedInner && (
                      <span className="border-l border-amber-800/50 pl-1">{mergedInner.label}</span>
                    )}
                    <Pencil className="h-2.5 w-2.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                  </span>
                  {isFront2D && mergedInner && (
                    <span className={`text-[9px] ${isSelectedBayDim ? 'text-slate-900/85 font-semibold' : 'text-sky-300'}`}>
                      {mergedInner.label}
                    </span>
                  )}
                </button>
              )}
            </Html>}
          </group>
        );
      })}
    </group>
  );
}
