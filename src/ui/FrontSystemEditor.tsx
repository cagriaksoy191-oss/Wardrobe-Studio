import { useEffect, useState } from 'react';
import type { Front, FrontType, HandleConfig, HandleFinishId, HandleStyleId, MaterialId, ResolvedDoorLeaf, ResolvedSlidingLeaf } from '../core/schema/types';
import { defaultSlidingConfig, frontSpanFromResolved } from '../core/solver/slidingSolver';
import { frontVerticalRange } from '../core/fronts/frontGeometry';
import { useWardrobeStore } from '../store/useWardrobeStore';
import { HANDLE_FINISH_CATALOG, HANDLE_STYLE_CATALOG, MATERIAL_CATALOG } from '../canvas/materials/materialRegistry';
import { motionRuntime, publishMotionNotice } from '../canvas/scene/MotionController';
import { NumberField } from './NumberField';

const control = 'studio-input';
const button = 'rounded-md border border-slate-600 bg-slate-800 px-2.5 py-1.5 text-[11px] font-medium text-slate-100 transition hover:border-sky-400 hover:bg-slate-700/80 disabled:opacity-40';

export function HingedOpeningCard({ door, applyAlternative }: { door: ResolvedDoorLeaf; applyAlternative?: () => void }) {
  const opening = door.opening;
  const limited = opening && opening.safeAngleDeg < door.maxAngleDeg;
  const mount = door.mounting === 'inset' ? 'İçerlek'
    : door.mounting === 'shared-overlay' ? 'Paylaşımlı dikme · yarım bindirme'
    : door.mounting === 'diagonal' ? 'Açılı köşe'
    : door.mounting === 'needs-support' ? 'Taşıyıcı kontrolü gerekli' : 'Tam bindirme';
  return (
    <div className="space-y-1.5 rounded-lg border border-slate-700 bg-slate-950/75 p-2.5 text-[11px]">
      <p className="font-medium text-sky-200">Kapak ölçüleri gövde açıklığından otomatik hesaplanır</p>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-300">
        <dt>Kesim · en × boy × kalınlık</dt>
        <dd className="text-right font-mono text-white">
          {door.widthMm} × {door.heightMm} × {door.thicknessMm} mm
        </dd>
        <dt>Montaj</dt>
        <dd className="text-right">
          {mount} · {door.hingeSide === 'left' ? 'sol' : 'sağ'}
        </dd>
        <dt>Nominal hedef</dt>
        <dd className="text-right">{door.maxAngleDeg}°</dd>
        <dt>Güvenli sınır · komşular kapalı</dt>
        <dd className={`text-right font-semibold ${limited ? 'text-amber-300' : 'text-emerald-300'}`}>
          {opening ? `${opening.safeAngleDeg}°` : '—'}
        </dd>
      </dl>
      {limited && <p className="text-amber-200">Engel · {opening.blockerLabel ?? 'Geometri'}</p>}
      {opening?.alternative && (
        <p className="text-sky-200">
          {opening.alternative.side === 'left' ? 'Sol' : 'Sağ'} menteşe denemesi · {opening.alternative.safeAngleDeg}°
          {applyAlternative && (
            <button type="button" className={`${button} ml-2`} onClick={applyAlternative}>
              Bu yönü uygula
            </button>
          )}
        </p>
      )}
      <details>
        <summary className="cursor-pointer text-slate-300">Derzler ve donanım</summary>
        {door.clearanceMm && (
          <p className="mt-1 text-slate-300">
            Uçlar {door.clearanceMm.spanStart.toFixed(1)} / {door.clearanceMm.spanEnd.toFixed(1)} mm · alt/üst {door.clearanceMm.bottom} / {door.clearanceMm.top} mm
            {door.clearanceMm.centerSeam !== undefined ? ` · orta derz ${door.clearanceMm.centerSeam} mm` : ''}
          </p>
        )}
        <p className="mt-1 text-slate-400">
          Sabit eksenle planlama. Menteşe ürünü, boşluk, ağırlık ve delikler katalogla doğrulanır.
        </p>
      </details>
    </div>
  );
}

function SlidingPosition({ leaf }: { leaf: ResolvedSlidingLeaf }) {
  const [position, setPosition] = useState(() => Math.round(motionRuntime.positions[leaf.id] ?? leaf.initialOffsetMm));
  const toggle = useWardrobeStore(s => s.toggleDoor);
  useEffect(() => {
    const timer = setInterval(
      () => setPosition(Math.round(motionRuntime.positions[leaf.id] ?? leaf.initialOffsetMm)),
      120,
    );
    return () => clearInterval(timer);
  }, [leaf.id, leaf.initialOffsetMm]);
  return (
    <div className="space-y-1 rounded border border-slate-700 bg-slate-950/60 p-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium text-slate-200">
          Kanat {leaf.leafIndex + 1} · Ray {leaf.trackIndex + 1}
        </span>
        <button
          type="button"
          aria-label={`Kanat ${leaf.leafIndex + 1} aç veya kapat`}
          className={button}
          onClick={() => toggle(leaf.id)}
        >
          Aç / Kapat
        </button>
      </div>
      <input
        aria-label={`Kanat ${leaf.leafIndex + 1} hareketi (mm)`}
        className="w-full accent-sky-400"
        type="range"
        min={leaf.minOffsetMm}
        max={leaf.maxOffsetMm}
        value={position}
        step={1}
        onChange={e => {
          const s = useWardrobeStore.getState();
          motionRuntime.load(s.design, s.resolved);
          const result = motionRuntime.dragTo(leaf.id, Number(e.target.value));
          setPosition(Math.round(result.position));
          publishMotionNotice();
        }}
      />
      <p className="font-mono text-[11px] text-slate-400">
        {position} mm · sınır {leaf.minOffsetMm}…{leaf.maxOffsetMm} mm
      </p>
    </div>
  );
}

export function FrontSystemEditor({ compact = false }: { compact?: boolean }) {
  const design = useWardrobeStore(s => s.design);
  const model = useWardrobeStore(s => s.resolved);
  const bayId = useWardrobeStore(s => s.selectedBayId);
  const selectedDoorId = useWardrobeStore(s => s.selectedDoorId);
  const configure = useWardrobeStore(s => s.configureFrontSystem);
  const patch = useWardrobeStore(s => s.patchFrontSystem);
  const split = useWardrobeStore(s => s.splitFrontSystem);
  const remove = useWardrobeStore(s => s.removeFrontSystem);
  const toggle = useWardrobeStore(s => s.toggleDoor);
  const [chosen, setChosen] = useState('');
  const selectedFrontId =
    model.slidingDoors?.find(d => d.id === selectedDoorId)?.frontId ??
    model.doors.find(d => d.id === selectedDoorId)?.frontId;
  useEffect(() => setChosen(selectedFrontId ?? ''), [selectedFrontId, bayId]);

  const run = design.runs.find(r => r.bays.some(b => b.id === bayId));
  const bay = run?.bays.find(b => b.id === bayId);
  const fronts = design.fronts.filter(f => f.bayIds.includes(bayId ?? ''));
  const front = fronts.find(f => f.id === chosen) ?? fronts.find(f => f.id === selectedFrontId) ?? fronts[0];
  if (!run || !bay) {
    return <p className="p-3.5 text-xs text-slate-400">Kapak sistemi için bir gövde seçin.</p>;
  }

  const type: FrontType = front?.type ?? (bay.frontMode === 'sliding' ? 'sliding' : bay.frontMode === 'open' ? 'open' : 'hinged');
  const range = front && frontVerticalRange(run, front);
  const hinged = model.doors.filter(d => (front ? d.frontId === front.id : d.bayIds.includes(bay.id) && !d.frontId));
  const selectedHinge = hinged.find(d => d.id === selectedDoorId) ?? hinged[0];
  const cfg = front?.sliding ?? defaultSlidingConfig(run.panelThicknessMm);
  const leaves = model.slidingDoors?.filter(d => d.frontId === front?.id) ?? [];
  const system = model.slidingSystems?.find(s => s.frontId === front?.id);
  let opening = system?.openingWidthMm ?? (model.bays.find(b => b.id === bay.id)?.outerWidthMm ?? 600) - 4;
  if (front) {
    try {
      opening = frontSpanFromResolved(design, model, front).widthMm;
    } catch {
      /* Geometri uyarısı sağ panelde gösterilir. */
    }
  }
  const total = opening + (cfg.leafCount - 1) * cfg.overlapMm;
  const widths =
    leaves.length === cfg.leafCount
      ? leaves.map(l => l.widthMm)
      : Array.from({ length: cfg.leafCount }, (_, i) =>
          i === cfg.leafCount - 1
            ? total - Math.floor(total / cfg.leafCount) * (cfg.leafCount - 1)
            : Math.floor(total / cfg.leafCount),
        );
  const patchConfig = (p: Partial<typeof cfg>) => front && patch(front.id, { sliding: { ...cfg, ...p } });
  const handle: HandleConfig =
    front?.handleConfig ??
    leaves[0]?.handleConfig ??
    bay.handleConfig ??
    design.materials.doorHandleConfig ?? {
      styleId: type === 'sliding' ? 'recessedJ' : 'barModern',
      finishId: 'matteBlack',
      lengthMm: 320,
      placement: 'middle',
      orientation: 'vertical',
    };
  const patchHandle = (p: Partial<HandleConfig>) => front && patch(front.id, { handleConfig: { ...handle, ...p } });

  return (
    <section
      aria-label={compact ? 'Seçili kapak sistemi' : 'Kapak sistemleri'}
      className={`space-y-3 text-xs ${compact ? '' : 'studio-section'}`}
    >
      <h2 className="studio-section-title">Menteşeli / Sürgülü / Açık cephe</h2>
      {!compact && (
        <p className="studio-helper">
          {bay.label} · Bir kapak aralığı birden çok bitişik gövdeyi kapsayabilir.
        </p>
      )}
      {fronts.length > 0 && (
        <label className="block space-y-1">
          <span className="text-[11px] font-medium text-slate-300">Düzenlenen kapak aralığı</span>
          <select
            aria-label="Düzenlenen kapak aralığı"
            className={control}
            value={front?.id ?? ''}
            onChange={e => setChosen(e.target.value)}
          >
            {fronts.map(f => {
              const { start, end } = frontVerticalRange(run, f);
              return (
                <option key={f.id} value={f.id}>
                  {f.label ?? f.id} · {start}–{end} mm
                </option>
              );
            })}
          </select>
        </label>
      )}
      <label className="block space-y-1">
        <span className="text-[11px] font-medium text-slate-300">Kapak sistemi</span>
        <select
          aria-label="Kapak sistemi"
          className={control}
          value={type}
          onChange={e => configure(bay.id, front?.id, e.target.value as FrontType)}
        >
          <option value="hinged">Menteşeli</option>
          <option value="sliding">Sürgülü</option>
          <option value="open">Açık / kapaksız</option>
        </select>
      </label>
      {!front && (
        <button type="button" className={`${button} w-full`} onClick={() => configure(bay.id, undefined, type)}>
          Kapak aralığını özelleştir
        </button>
      )}
      {front && (
        <>
          {range && (
            <details className="rounded-lg border border-slate-700 p-2.5">
              <summary className="cursor-pointer text-[11px] font-medium text-slate-200">
                Gelişmiş · kapsam kotları ve montaj
              </summary>
              <div className="mt-2 space-y-2">
                <p className="studio-helper">Aralığın mutlak kotunu ayarlar. Girilen kenar gövdeyle birlikte taşınmaz.</p>
                <div className="studio-form-grid grid grid-cols-2 gap-x-2">
                  <NumberField
                    label="Kapsam alt kotu (mm)"
                    value={range.start}
                    max={range.end - 160}
                    onCommit={yStartMm => patch(front.id, { yStartMm, yStartAnchor: undefined })}
                  />
                  <NumberField
                    label="Kapsam üst kotu (mm)"
                    value={range.end}
                    min={range.start + 160}
                    max={run.heightMm}
                    onCommit={yEndMm => patch(front.id, { yEndMm, yEndAnchor: undefined })}
                  />
                </div>
                {type === 'hinged' && (
                  <label className="block space-y-1">
                    <span className="text-[11px] font-medium text-slate-300">Montaj yerleşimi</span>
                    <select
                      aria-label="Montaj yerleşimi"
                      className={control}
                      value={front.hingeMount ?? 'overlay'}
                      onChange={e => patch(front.id, { hingeMount: e.target.value as Front['hingeMount'] })}
                    >
                      <option value="overlay">Bindirmeli · gövdeye göre</option>
                      <option value="inset">İçerlek · tek net bölme</option>
                    </select>
                  </label>
                )}
              </div>
            </details>
          )}
          <details>
            <summary className="cursor-pointer text-[11px] font-medium text-slate-200">Kapsanan bitişik bölmeler</summary>
            <div className="mt-2 space-y-1">
              {run.bays.map(b => (
                <label key={b.id} className="flex items-center gap-2 text-[11px] text-slate-200">
                  <input
                    type="checkbox"
                    checked={front.bayIds.includes(b.id)}
                    onChange={e =>
                      patch(front.id, {
                        bayIds: e.target.checked
                          ? [...front.bayIds, b.id]
                          : front.bayIds.filter(id => id !== b.id),
                      })
                    }
                  />
                  {b.label}
                </label>
              ))}
            </div>
          </details>
          {type === 'hinged' && (
            <div className="grid grid-cols-2 items-end gap-2">
              <select
                aria-label="Menteşe yönü"
                className={control}
                value={front.hingeSide ?? 'left'}
                onChange={e => patch(front.id, { hingeSide: e.target.value as Front['hingeSide'] })}
              >
                <option value="auto">Otomatik kanat</option>
                <option value="left">Sol menteşe</option>
                <option value="right">Sağ menteşe</option>
                <option value="double">Çift kanat</option>
              </select>
              <select
                aria-label="Menteşe açısı"
                className={control}
                value={front.openingAngleDeg ?? bay.hingeAngleDeg ?? 110}
                onChange={e => patch(front.id, { openingAngleDeg: Number(e.target.value) as 110 | 155 | 165 })}
              >
                {[110, 155, 165].map(n => (
                  <option key={n} value={n}>
                    {n}° hedef
                  </option>
                ))}
              </select>
            </div>
          )}
          {type === 'sliding' && (
            <div className="space-y-2 rounded-lg border border-sky-700/50 bg-sky-950/20 p-2.5">
              <label className="block space-y-1">
                <span className="text-[11px] font-medium text-slate-300">Ray düzeni</span>
                <select
                  aria-label="Ray düzeni"
                  className={control}
                  value={cfg.trackCount}
                  onChange={e =>
                    patch(front.id, {
                      sliding: defaultSlidingConfig(run.panelThicknessMm, Number(e.target.value) as 2 | 3),
                    })
                  }
                >
                  <option value={2}>İki ray</option>
                  <option value={3}>Üç ray</option>
                </select>
              </label>
              <NumberField
                label="Sürgü kanat adedi"
                value={cfg.leafCount}
                min={2}
                max={6}
                onCommit={leafCount => patchConfig({ leafCount, leafWidthsMm: undefined, trackIndices: undefined })}
              />
              {leaves.map(l => (
                <SlidingPosition key={l.id} leaf={l} />
              ))}
              <p className="text-[11px] text-sky-200">
                Sahnedeki kanadı veya kulpu tutup sürükleyin. Düzenleme ve çoklu seçim araçları kapalı olmalı.
              </p>
              <details className="rounded border border-slate-700 p-2">
                <summary className="cursor-pointer text-[11px] font-medium text-slate-200">
                  Gelişmiş ray ve kanat ayarları
                </summary>
                <div className="studio-form-grid mt-2 grid grid-cols-2 gap-x-2">
                  <NumberField
                    label="Kanat bindirmesi (mm)"
                    value={cfg.overlapMm}
                    max={100}
                    onCommit={overlapMm => patchConfig({ overlapMm, leafWidthsMm: undefined })}
                  />
                  <NumberField
                    label="Ray derinliği (mm)"
                    value={cfg.trackDepthMm}
                    min={50}
                    max={250}
                    onCommit={trackDepthMm => patchConfig({ trackDepthMm })}
                  />
                  <NumberField
                    label="Ray eksen aralığı (mm)"
                    value={cfg.trackSpacingMm}
                    min={15}
                    max={80}
                    onCommit={trackSpacingMm => patchConfig({ trackSpacingMm })}
                  />
                  <NumberField
                    label="Üst/alt planlama payı (mm)"
                    value={cfg.verticalGapMm ?? 10}
                    max={60}
                    onCommit={verticalGapMm => patchConfig({ verticalGapMm })}
                  />
                </div>
                <p className="studio-helper mt-2">
                  Gövde {run.depthMm} mm, ray {cfg.trackDepthMm} mm, duvardan ön ray sınırı{' '}
                  {(run.rearOffsetMm ?? 0) + run.depthMm + cfg.trackDepthMm} mm. Profil ve montaj payları üreticiyle doğrulanmalıdır.
                </p>
                <div className="studio-form-grid mt-2 grid grid-cols-2 gap-x-2">
                  <NumberField
                    label="Başlangıç / köşe payı (mm)"
                    value={cfg.startClearanceMm ?? 0}
                    max={200}
                    onCommit={startClearanceMm => patchConfig({ startClearanceMm, leafWidthsMm: undefined })}
                  />
                  <NumberField
                    label="Bitiş yan payı (mm)"
                    value={cfg.endClearanceMm ?? 0}
                    max={200}
                    onCommit={endClearanceMm => patchConfig({ endClearanceMm, leafWidthsMm: undefined })}
                  />
                </div>
                <p className="studio-helper mt-1.5">
                  Yan pay ray açıklığını daraltır; otomatik bir dolgu paneli eklemez. Köşe kapağı ve ray profilinin kapalı durumda da kesişmediğini kontrol edin.
                </p>
                <button
                  type="button"
                  className={`${button} mt-2 w-full`}
                  onClick={() => patch(front.id, { sliding: defaultSlidingConfig(run.panelThicknessMm, cfg.trackCount) })}
                >
                  Kalınlığa uygun ray önayarı
                </button>
                <details className="mt-2">
                  <summary className="cursor-pointer text-[11px] text-slate-200">Kanat genişlikleri ve ray sırası</summary>
                  <div className="mt-2 space-y-2">
                    <p className="studio-helper">
                      Son kanat kalan açıklığa göre ayarlanır. Bütün genişlikler ve bindirmeler açıklığı tam kapatır.
                    </p>
                    {widths.map((w, i) => (
                      <div key={i} className="studio-form-grid grid grid-cols-2 gap-x-2">
                        {i < widths.length - 1 ? (
                          <NumberField
                            label={`Kanat ${i + 1} genişliği (mm)`}
                            value={w}
                            min={150}
                            max={opening}
                            onCommit={n => {
                              const updated = [...widths];
                              updated[i] = n;
                              updated[updated.length - 1] =
                                total - updated.slice(0, -1).reduce((s, v) => s + v, 0);
                              patchConfig({ leafWidthsMm: updated });
                            }}
                          />
                        ) : (
                          <div className="studio-form-cell flex flex-col gap-1">
                            <span className="text-[11px] font-medium text-slate-300">Son kanat</span>
                            <p className="flex min-h-[32px] items-center font-mono text-[11px] text-slate-200">{w} mm</p>
                          </div>
                        )}
                        <label className="flex flex-col gap-1">
                          <span className="text-[11px] font-medium text-slate-300">Ray</span>
                          <select
                            aria-label={`Kanat ${i + 1} rayı`}
                            className={control}
                            value={cfg.trackIndices?.[i] ?? i % cfg.trackCount}
                            onChange={e => {
                              const tracks = widths.map((_, k) => cfg.trackIndices?.[k] ?? k % cfg.trackCount) as (0 | 1 | 2)[];
                              tracks[i] = Number(e.target.value) as 0 | 1 | 2;
                              patchConfig({ trackIndices: tracks });
                            }}
                          >
                            {Array.from({ length: cfg.trackCount }, (_, k) => (
                              <option key={k} value={k}>
                                Ray {k + 1} {k === 0 ? '(gövdeye yakın)' : ''}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    ))}
                    <button
                      type="button"
                      className={button}
                      onClick={() => patchConfig({ leafWidthsMm: undefined, trackIndices: undefined })}
                    >
                      Eşit genişlik ve sıralı ray
                    </button>
                  </div>
                </details>
              </details>
            </div>
          )}
          {type !== 'open' && (
            <details>
              <summary className="cursor-pointer text-[11px] font-medium text-slate-200">Kapak malzemesi ve kulp</summary>
              <div className="mt-2 space-y-2">
                <select
                  aria-label="Sistem kapak malzemesi"
                  className={control}
                  value={front.materialId ?? bay.doorMaterialId ?? design.materials.frontMaterialId}
                  onChange={e => patch(front.id, { materialId: e.target.value as MaterialId })}
                >
                  {Object.entries(MATERIAL_CATALOG).map(([id, m]) => (
                    <option key={id} value={id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Sistem kulp modeli"
                  className={control}
                  value={handle.styleId}
                  onChange={e => patchHandle({ styleId: e.target.value as HandleStyleId })}
                >
                  {Object.entries(HANDLE_STYLE_CATALOG).map(([id, h]) => (
                    <option key={id} value={id}>
                      {h.name}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Sistem kulp yüzeyi"
                  className={control}
                  value={handle.finishId}
                  onChange={e => patchHandle({ finishId: e.target.value as HandleFinishId })}
                >
                  {Object.entries(HANDLE_FINISH_CATALOG).map(([id, h]) => (
                    <option key={id} value={id}>
                      {h.name}
                    </option>
                  ))}
                </select>
                <NumberField
                  label="Sistem kulp boyu (mm)"
                  value={handle.lengthMm}
                  min={60}
                  max={1200}
                  onCommit={lengthMm => patchHandle({ lengthMm })}
                />
              </div>
            </details>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className={button} onClick={() => split(front.id)}>
              Üst menteşeli / alt ayrı
            </button>
            <button type="button" className={button} onClick={() => remove(front.id)}>
              Aralığı açık bırak
            </button>
          </div>
          <p className="studio-helper">
            Özelleştirilen aralıkların dışı açık kalır. Üst/alt ayırma, kapsam ve ray değişiklikleri tek Geri Al işlemidir; kanat hareketleri tasarım geçmişi oluşturmaz.
          </p>
        </>
      )}
      {type === 'hinged' && selectedHinge && !compact && (
        <>
          <HingedOpeningCard
            door={selectedHinge}
            applyAlternative={
              front && selectedHinge.opening?.alternative
                ? () => patch(front.id, { hingeSide: selectedHinge.opening!.alternative!.side })
                : undefined
            }
          />
          {hinged.map(leaf => (
            <button
              key={leaf.id}
              type="button"
              className={`${button} w-full text-left`}
              onClick={() => toggle(leaf.id)}
            >
              {leaf.label} · Aç / Kapat
            </button>
          ))}
        </>
      )}
    </section>
  );
}
