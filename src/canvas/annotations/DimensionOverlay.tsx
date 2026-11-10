import { Line } from '@react-three/drei';
import { SceneHtml as Html } from './SceneHtml';
import { Check, Pencil, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { DimensionAnnotation } from '../../core/schema/types';
import { type StudioViewMode, useWardrobeStore } from '../../store/useWardrobeStore';

const MM_TO_M = 0.001;

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
  const inputRef = useRef<HTMLInputElement | null>(null);

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
      return !d.runId || runs.some(run => run.id === d.runId && run.wallAxis === 'A');
    }
    if (viewMode === '2d-front-B') {
      return runs.some(run => run.id === d.runId && run.wallAxis === 'B');
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
  const selectedNet = viewMode === '3d-perspective' ? visibleDimensions.find(
    d => d.kind === 'bayInner' && d.bayId === selectedBayId,
  ) : undefined;
  const selectedOuter = selectedNet ? visibleDimensions.find(
    d => d.kind === 'bayOuter' && d.bayId === selectedBayId,
  ) : undefined;

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
    const parsed = Number(draftValue.trim());
    const minMm = dim.minMm ?? 200;
    const maxMm = dim.maxMm ?? 6000;

    if (!Number.isFinite(parsed) || Number.isNaN(parsed)) {
      setValidationError('Lütfen geçerli bir sayısal milimetre değeri girin.');
      return;
    }

    const rounded = Math.round(parsed);
    if (rounded < minMm || rounded > maxMm) {
      setValidationError(`Geçerli aralık: ${minMm} – ${maxMm} mm`);
      return;
    }

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
      {visibleDimensions.map((dim) => {
        const startM: [number, number, number] = [
          dim.startMm[0] * MM_TO_M,
          dim.startMm[1] * MM_TO_M,
          dim.startMm[2] * MM_TO_M,
        ];
        const endM: [number, number, number] = [
          dim.endMm[0] * MM_TO_M,
          dim.endMm[1] * MM_TO_M,
          dim.endMm[2] * MM_TO_M,
        ];
        const midM: [number, number, number] = [
          (startM[0] + endM[0]) / 2,
          (startM[1] + endM[1]) / 2,
          (startM[2] + endM[2]) / 2,
        ];

        const isSelectedBayDim = dim.bayId !== undefined && dim.bayId === selectedBayId;
        const isInner = dim.kind === 'bayInner';
        const isEditingThis = editingDimId === dim.id;
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
            />
            {(!selectedOuter || dim.id !== selectedNet?.id || isEditingThis) && <Html
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
                  {selectedNet && selectedOuter && dim.id === selectedOuter.id && (
                    <span className="text-[9px] text-sky-300">{selectedNet.label}</span>
                  )}
                  <div className="flex items-center gap-1">
                    <input
                      ref={inputRef}
                      type="number"
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
                      className="w-24 rounded border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-xs font-bold text-white focus:border-emerald-400 focus:outline-none"
                    />
                    <span className="text-[10px] font-mono text-slate-400">mm</span>
                    <button
                      type="button"
                      onClick={(e) => commitEditing(dim, e)}
                      title="Onayla (Enter)"
                      className="rounded bg-emerald-500 p-1 text-slate-950 hover:bg-emerald-400 transition"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => cancelEditing(e)}
                      title="İptal (Esc)"
                      className="rounded bg-slate-800 p-1 text-slate-300 hover:bg-slate-700 transition"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {dim.editTarget === 'bayInnerDerived' && (
                    <div className="text-[9px] text-sky-300 leading-tight">
                      Türetilmiş net iç ölçü, bölme dış genişliğinden ({dim.sourceValueMm} mm) otomatik hesaplanır.
                    </div>
                  )}
                  {validationError && (
                    <div className="rounded bg-rose-950/90 border border-rose-500/40 px-1.5 py-0.5 text-[9px] text-rose-200">
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
                  className={`pointer-events-auto group flex items-center gap-1 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-mono font-medium shadow-sm border backdrop-blur-sm transition hover:scale-105 ${
                    isSelectedBayDim
                      ? 'bg-amber-500/95 text-slate-950 border-amber-300 font-bold hover:bg-amber-400'
                      : isInner
                        ? 'bg-sky-950/90 text-sky-200 border-sky-500/50 hover:border-sky-300 hover:bg-sky-900'
                        : 'bg-slate-900/90 text-slate-200 border-slate-700 hover:border-amber-400/70 hover:text-white'
                  }`}
                >
                  <span>{dim.kind === 'runTotal' ? `${runs.find(run=>run.id===dim.runId)?.wallAxis ?? 'A'} kolu · ${dim.valueMm} mm` : dim.label}</span>
                  {selectedNet && selectedOuter && dim.id === selectedOuter.id && (
                    <span className="border-l border-amber-800/50 pl-1">{selectedNet.label}</span>
                  )}
                  <Pencil className="h-2.5 w-2.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                </button>
              )}
            </Html>}
          </group>
        );
      })}
    </group>
  );
}
