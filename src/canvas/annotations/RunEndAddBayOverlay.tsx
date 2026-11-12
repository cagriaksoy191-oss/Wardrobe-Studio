import { SceneHtml as Html } from './SceneHtml';
import { Check, Plus, X } from 'lucide-react';
import { memo, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { type NewBayStarterPreset, useWardrobeStore } from '../../store/useWardrobeStore';
import { StudioDialog } from '../../ui/StudioDialog';
import { NumberField } from '../../ui/Phase4Panels';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { runEndControlsFit } from './runEndControlFit';

const MM_TO_M = 0.001;

const STARTER_OPTIONS: { id: NewBayStarterPreset; label: string; desc: string }[] = [
  { id: 'shelves', label: 'Raflı Bölme', desc: '4 raf · 5 kullanılabilir aralık' },
  { id: 'longHanging', label: 'Uzun Askılı Bölme', desc: 'Elbise ve palto için tek askı' },
  { id: 'doubleHanging', label: 'Çift Kat Askılı Bölme', desc: 'Alt ve üst askı' },
  { id: 'drawers', label: 'Çekmeceli Bölme', desc: '4 çekmece' },
  { id: 'shoes', label: 'Ayakkabılıklı Bölme', desc: '5 raf · 6 kullanılabilir aralık' },
  { id: 'serviceNiche', label: 'Servis Nişi', desc: 'Ütü masası / merdiven / süpürge nişi' },
  { id: 'empty', label: 'Boş Bölme', desc: 'Bölünmemiş tek parça boş gövde' },
];

export const RunEndAddBayOverlay = memo(function RunEndAddBayOverlay({ dock, editorOpen }: { dock: HTMLElement | null; editorOpen: boolean }) {
  const width = useThree(state => state.size.width);
  const design = useWardrobeStore((s) => s.design);
  const resolved = useWardrobeStore((s) => s.resolved);
  const addBayAtRunEnd = useWardrobeStore((s) => s.addBayAtRunEnd);

  const [openRun, setOpenRun] = useState<{ id: string; docked: boolean } | null>(null);
  const [starterPreset, setStarterPreset] = useState<NewBayStarterPreset>('shelves');
  const [widthMode, setWidthMode] = useState<'fixed' | 'flex'>('fixed');
  const [widthMmInput, setWidthMmInput] = useState<number>(600);
  const [autoExtendRun, setAutoExtendRun] = useState(false);
  const [addError, setAddError] = useState('');
  const [outsideCanvas, setOutsideCanvas] = useState(false);
  const toolbarBottom = useRef(0);
  const placements = useMemo(() => design.runs
    .filter(run => design.layoutKind === 'l-shape' || run.wallAxis === 'A')
    .map(run => {
      const lastBay = resolved.bays.filter(bay => bay.runId === run.id).at(-1);
      const end = ((lastBay ? lastBay.startOffsetMm + lastBay.outerWidthMm : run.lengthMm) + 72) * MM_TO_M;
      const y = Math.round(run.heightMm * 0.52) * MM_TO_M;
      const depth = ((run.rearOffsetMm ?? 0) + Math.round(run.depthMm * 0.55)) * MM_TO_M;
      const position: [number, number, number] = run.wallAxis === 'A' ? [end, y, depth] : [depth, y, end];
      return { run, position, projected: new Vector3() };
    }), [design.layoutKind, design.runs, resolved.bays]);
  const projected = useMemo(() => placements.map(p => p.projected), [placements]);
  const useDock = openRun?.docked ?? (editorOpen || width <= 500 || outsideCanvas);
  const dockTarget = useDock ? dock : null;

  useLayoutEffect(() => {
    const toolbar = dock?.closest('.studio-scene-toolbar');
    if (!toolbar) return;
    const controls = [...toolbar.children].filter(element => element !== dock);
    const measure = () => {
      const scene = toolbar.closest('.studio-scene');
      // The dock is last in the toolbar. Excluding it keeps the fit test stable when it wraps.
      toolbarBottom.current = Math.max(...controls.map(element => element.getBoundingClientRect().bottom))
        - (scene?.getBoundingClientRect().top ?? 0);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(toolbar);
    for (const element of controls) observer.observe(element);
    return () => observer.disconnect();
  }, [dock]);

  useFrame(({ camera, size }) => {
    // Keep the dialog and the button that opened it in the same DOM tree until close.
    if (!dock || editorOpen || width <= 500 || openRun) return;
    for (const { position, projected: anchor } of placements) {
      anchor.set(...position).project(camera);
      anchor.x = (anchor.x + 1) * size.width / 2;
      anchor.y = (1 - anchor.y) * size.height / 2;
    }
    const outside = !runEndControlsFit(projected, size.width, size.height, toolbarBottom.current);
    if (outside !== outsideCanvas) setOutsideCanvas(outside);
  });

  return (
    <group>
      {placements.map(({ run, position }) => {
        const isOpen = openRun?.id === run.id;

        const extendedLengthMm = Math.min(6000, run.lengthMm + widthMmInput);

        return (
          <Html
            key={`run-end-add-${run.id}`}
            position={position}
            center
            zIndexRange={[25, 10]}
            dock={dockTarget}
          >
            <>
              <div className="relative group flex items-center justify-center">
                <button
                  type="button"
                  aria-label={`${run.label} sonuna yeni bölme ekle`}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenRun({ id: run.id, docked: useDock });
                    setAutoExtendRun(false);
                    setAddError('');
                  }}
                  title={`${run.label} sonuna yeni gardırop bölmesi ekle`}
                  className={`pointer-events-auto flex items-center justify-center rounded-full border-2 border-emerald-400/90 bg-slate-950/90 text-emerald-300 shadow-xl backdrop-blur-md transition-all duration-150 hover:scale-105 hover:border-emerald-300 hover:bg-emerald-500 hover:text-slate-950 ${dockTarget ? 'h-11 w-11 gap-0.5' : 'h-9 w-9'}`}
                >
                  <Plus className="h-5 w-5 stroke-[2.75]" />
                  {dockTarget && <span aria-hidden="true" className="text-[10px] font-bold">{run.wallAxis}</span>}
                </button>
                <div className={`pointer-events-none absolute ${dockTarget ? 'top-full right-0' : '-top-8 left-1/2 -translate-x-1/2'} whitespace-nowrap rounded-md border border-emerald-500/40 bg-slate-950/95 px-2 py-0.5 text-[10px] font-medium text-emerald-200 opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100`}>
                  {run.label} sonuna bölme ekle
                </div>
              </div>
              {isOpen && (
                <StudioDialog compact label={`${run.wallAxis} koluna yeni bölme`} onClose={() => setOpenRun(null)}>
                  <div className="flex shrink-0 items-center justify-between border-b border-slate-800 px-3 py-2 text-xs">
                    <span className="font-bold text-emerald-300">
                      + {run.wallAxis} Koluna Yeni Bölme Ekle
                    </span>
                    <button
                      type="button"
                      aria-label="Bölme eklemeyi kapat"
                      autoFocus
                      onClick={() => setOpenRun(null)}
                      className="grid h-9 w-9 place-items-center rounded text-slate-400 hover:bg-slate-800 hover:text-white"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="min-h-0 space-y-2.5 overflow-y-auto p-3 text-xs">
                    {/* Başlangıç Tipi Seçici */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Başlangıç Tipi
                      </span>
                      <div className="grid grid-cols-2 gap-1">
                        {STARTER_OPTIONS.map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            aria-pressed={starterPreset === opt.id}
                            onClick={() => {
                              setStarterPreset(opt.id);
                              if (opt.id === 'serviceNiche') setWidthMmInput(280);
                              else if (widthMmInput < 380) setWidthMmInput(600);
                            }}
                            className={`flex min-h-10 flex-col rounded border px-2 py-1 text-left transition ${
                              starterPreset === opt.id
                                ? 'border-emerald-400 bg-emerald-500/20 text-emerald-100'
                                : 'border-slate-800 bg-slate-900/90 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <span className="text-[11px] font-semibold">{opt.label}</span>
                            <span className="text-[9px] text-slate-400">{opt.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Genişlik Modu */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Genişlik Ayarı
                      </span>
                      <div className="grid grid-cols-2 gap-1 text-[11px]">
                        <button
                          type="button"
                          onClick={() => setWidthMode('fixed')}
                          className={`rounded border py-1 font-medium ${
                            widthMode === 'fixed'
                              ? 'border-sky-400 bg-sky-500/20 text-sky-200 font-semibold'
                              : 'border-slate-800 bg-slate-900 text-slate-400'
                          }`}
                        >
                          Sabit (mm)
                        </button>
                        <button
                          type="button"
                          onClick={() => setWidthMode('flex')}
                          className={`rounded border py-1 font-medium ${
                            widthMode === 'flex'
                              ? 'border-sky-400 bg-sky-500/20 text-sky-200 font-semibold'
                              : 'border-slate-800 bg-slate-900 text-slate-400'
                          }`}
                        >
                          Esnek (kalan alan)
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400">Sabit genişlik dıştan ölçülür; esnek bölmeler koldaki kalan alanı paylaşır.</p>

                      {widthMode === 'fixed' && (
                        <NumberField label="Yeni bölmenin dış genişliği (mm)"
                          value={widthMmInput} onCommit={setWidthMmInput} min={250} max={1200} />
                      )}
                    </div>

                    {/* Sığma Kontrolü & Kol Uzatma Seçeneği */}
                    <label className="flex items-start gap-2 rounded border border-slate-800 bg-slate-900/90 p-2 text-[10px] text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoExtendRun}
                        onChange={(e) => setAutoExtendRun(e.target.checked)}
                        className="mt-0.5 rounded border-slate-600"
                      />
                      <span>Kol boyunu {extendedLengthMm} mm’ye uzat</span>
                    </label>
                    {!autoExtendRun && <p className="text-[11px] text-slate-400">Kol {run.lengthMm} mm kalır. Yeni bölüm kalan alanı paylaşır.</p>}
                    {addError && <p role="alert" className="text-rose-200">{addError} Çalışma kopyası korundu.</p>}
                  </div>

                  <div className="shrink-0 border-t border-slate-800 p-3">
                    <button
                      type="button"
                      onClick={() => {
                        const added = addBayAtRunEnd(run.id, {
                          starterPreset,
                          widthMode,
                          widthMm: widthMmInput,
                          autoExtendRunLength: autoExtendRun,
                        });
                        if (added) setOpenRun(null);
                        else setAddError(useWardrobeStore.getState().commandError ?? 'Bölme eklenemedi.');
                      }}
                      className="flex min-h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Bölmeyi {run.wallAxis} Koluna Ekle
                    </button>
                  </div>
                </StudioDialog>
              )}
            </>
          </Html>
        );
      })}
    </group>
  );
});
