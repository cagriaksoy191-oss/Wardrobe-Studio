import { SceneHtml as Html } from './SceneHtml';
import { Check, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { type NewBayStarterPreset, useWardrobeStore } from '../../store/useWardrobeStore';
import { StudioDialog } from '../../ui/StudioDialog';
import { NumberField } from '../../ui/Phase4Panels';

const MM_TO_M = 0.001;

const STARTER_OPTIONS: { id: NewBayStarterPreset; label: string; desc: string }[] = [
  { id: 'shelves', label: 'Raflı Bölme', desc: '4 ayarlanabilir raf' },
  { id: 'longHanging', label: 'Uzun Askılı Bölme', desc: 'Elbise ve palto için tek askı' },
  { id: 'doubleHanging', label: 'Çift Kat Askılı Bölme', desc: 'Alt ve üst askı' },
  { id: 'drawers', label: 'Çekmeceli Bölme', desc: '4 çekmece' },
  { id: 'shoes', label: 'Ayakkabılıklı Bölme', desc: '5 kat ayakkabılık' },
  { id: 'serviceNiche', label: 'Servis Nişi', desc: 'Ütü masası / merdiven / süpürge nişi' },
  { id: 'empty', label: 'Boş Bölme', desc: 'Bölünmemiş tek parça boş gövde' },
];

export function RunEndAddBayOverlay() {
  const design = useWardrobeStore((s) => s.design);
  const resolved = useWardrobeStore((s) => s.resolved);
  const addBayAtRunEnd = useWardrobeStore((s) => s.addBayAtRunEnd);

  const [openRunId, setOpenRunId] = useState<string | null>(null);
  const [starterPreset, setStarterPreset] = useState<NewBayStarterPreset>('shelves');
  const [widthMode, setWidthMode] = useState<'fixed' | 'flex'>('fixed');
  const [widthMmInput, setWidthMmInput] = useState<number>(600);
  const [autoExtendRun, setAutoExtendRun] = useState(false);
  const [addError, setAddError] = useState('');

  const activeRuns = design.runs.filter(
    (r) => design.layoutKind === 'l-shape' || r.wallAxis === 'A'
  );

  return (
    <group>
      {activeRuns.map((run) => {
        const baysOfRun = resolved.bays.filter((b) => b.runId === run.id);
        const lastBay = baysOfRun[baysOfRun.length - 1];
        const endPosMm = lastBay ? lastBay.startOffsetMm + lastBay.outerWidthMm : run.lengthMm;
        const midYMm = Math.round(run.heightMm * 0.52);
        const depthMidMm = (run.rearOffsetMm ?? 0) + Math.round(run.depthMm * 0.55);

        const posM: [number, number, number] =
          run.wallAxis === 'A'
            ? [(endPosMm + 72) * MM_TO_M, midYMm * MM_TO_M, depthMidMm * MM_TO_M]
            : [depthMidMm * MM_TO_M, midYMm * MM_TO_M, (endPosMm + 72) * MM_TO_M];

        const isOpen = openRunId === run.id;

        const extendedLengthMm = Math.min(6000, run.lengthMm + widthMmInput);

        return (
          <Html
            key={`run-end-add-${run.id}`}
            position={posM}
            center
            zIndexRange={[25, 10]}
          >
            <>
              <div className="relative group flex items-center justify-center">
                <button
                  type="button"
                  aria-label={`${run.label} sonuna yeni bölme ekle`}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenRunId(run.id);
                    setAutoExtendRun(false);
                    setAddError('');
                  }}
                  title={`${run.label} sonuna yeni gardırop bölmesi ekle`}
                  className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border-2 border-emerald-400/90 bg-slate-950/90 text-emerald-300 shadow-xl backdrop-blur-md transition-all duration-150 hover:scale-110 hover:border-emerald-300 hover:bg-emerald-500 hover:text-slate-950"
                >
                  <Plus className="h-5 w-5 stroke-[2.75]" />
                </button>
                <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-emerald-500/40 bg-slate-950/95 px-2 py-0.5 text-[10px] font-medium text-emerald-200 opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                  {run.label} sonuna bölme ekle
                </div>
              </div>
              {isOpen && (
                <StudioDialog compact label={`${run.wallAxis} koluna yeni bölme`} onClose={() => setOpenRunId(null)}>
                  <div className="flex shrink-0 items-center justify-between border-b border-slate-800 px-3 py-2 text-xs">
                    <span className="font-bold text-emerald-300">
                      + {run.wallAxis} Koluna Yeni Bölme Ekle
                    </span>
                    <button
                      type="button"
                      aria-label="Bölme eklemeyi kapat"
                      autoFocus
                      onClick={() => setOpenRunId(null)}
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
                        if (added) setOpenRunId(null);
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
}
