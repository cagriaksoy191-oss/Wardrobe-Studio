import { useState } from 'react';
import type { InventoryItemKind, InventoryTarget, OwnerType, RoomObstacleKind, StorageTemplateId, ValidationIssue } from '../core/schema/types';
import { DEFAULT_PROFILES, OWNER_NAMES, profileLimits } from '../core/analysis/studioAnalysis';
import { INVENTORY_CATALOG, itemDimensions } from '../core/analysis/inventory';
import { STORAGE_TEMPLATE_CATALOG } from '../core/inserts/storageTemplates';
import { useWardrobeStore } from '../store/useWardrobeStore';
import { NumberField } from './NumberField';

export { NumberField, type NumberFieldProps } from './NumberField';

const control = 'studio-input';
const button = 'rounded-md border border-slate-600 bg-slate-800 px-2.5 py-1.5 text-[11px] font-medium text-slate-100 transition hover:border-sky-400 hover:bg-slate-700/80 disabled:opacity-40';
const section = 'studio-section space-y-3 text-xs';
const title = 'studio-section-title';
const owners: OwnerType[] = ['anne', 'baba', 'ortak'];
const OBSTACLES: Record<RoomObstacleKind, string> = {
  bed: 'Yatak',
  roomDoor: 'Oda kapısı',
  window: 'Pencere',
  radiator: 'Radyatör',
  socket: 'Priz / anahtar',
  pillar: 'Kolon',
  beam: 'Kiriş',
  skirting: 'Süpürgelik',
  other: 'Diğer sabit engel',
};

export function CommandFeedback() {
  const error = useWardrobeStore(s => s.commandError);
  const clear = useWardrobeStore(s => s.clearCommandError);
  return error ? (
    <div
      role="alert"
      className="flex max-h-28 shrink-0 items-start justify-between gap-3 overflow-y-auto border-b border-rose-500/50 bg-rose-950 px-4 py-2 text-xs text-rose-100"
    >
      <span>İşlem uygulanmadı: {error}</span>
      <button type="button" onClick={clear} className="shrink-0 underline">
        Kapat
      </button>
    </div>
  ) : null;
}

export function RoomCeilingPanel({ embedded = false }: { embedded?: boolean }) {
  const design = useWardrobeStore(s => s.design);
  const updateRoomHeight = useWardrobeStore(s => s.updateRoomHeight);
  const content = (
    <>
      {!embedded && <h2 className={title}>Tavan ve montaj boşluğu</h2>}
      <div className="studio-form-grid grid grid-cols-2 gap-x-2">
        <NumberField
          label="Oda tavan yüksekliği (mm)"
          value={design.roomHeightMm}
          min={1800}
          max={4000}
          onCommit={value => updateRoomHeight('roomHeightMm', value)}
        />
        <NumberField
          label="Bilinen montaj boşluğu (mm)"
          value={design.ceilingClearanceMm ?? 0}
          max={300}
          onCommit={value => updateRoomHeight('ceilingClearanceMm', value)}
        />
      </div>
      <p className="studio-helper">Montaj boşluğunu yerinde ölçüm kesinleşince girin.</p>
    </>
  );

  if (embedded) return <div className="space-y-2.5 text-xs">{content}</div>;
  return (
    <section className={section} aria-label="Tavan ve montaj boşluğu">
      {content}
    </section>
  );
}

export function RoomErgonomicsPanel({ embedded = false }: { embedded?: boolean }) {
  const design = useWardrobeStore(s => s.design);
  const setProfile = useWardrobeStore(s => s.setPersonProfile);
  const setCornerOwner = useWardrobeStore(s => s.setCornerOwner);
  const setEye = useWardrobeStore(s => s.setEyeLevelCamera);
  const overlay = useWardrobeStore(s => s.analysisOverlay);
  const setOverlay = useWardrobeStore(s => s.setAnalysisOverlay);
  const profiles = design.ergonomics ?? DEFAULT_PROFILES;

  const content = (
    <>
      {!embedded && <h2 className={title}>Kişiler ve erişim</h2>}
      <p className="studio-helper">
        Boyları mm olarak girin. Sayısal alanlar Enter veya odaktan çıkışla uygulanır; ölçüler tamsayı mm&apos;ye yuvarlanır.
      </p>
      <div className="grid grid-cols-2 items-start gap-2">
        {(['anne', 'baba'] as const).map(owner => (
          <div key={owner} className="studio-card space-y-2">
            <NumberField
              label={`${OWNER_NAMES[owner]} boyu (mm)`}
              value={profiles[owner].heightMm}
              min={1000}
              max={2200}
              onCommit={heightMm => setProfile(owner, { heightMm })}
            />
            <span className="block text-[11px] text-slate-400">
              {profiles[owner].heightMm / 10} cm · göz {profileLimits(profiles[owner]).eyeHeightMm} mm
            </span>
            <button type="button" className={`${button} w-full`} onClick={() => setEye(owner)}>
              {OWNER_NAMES[owner]} göz hizası
            </button>
            <details className="text-[11px]">
              <summary className="cursor-pointer text-slate-300">Erişim varsayımları</summary>
              <div className="mt-2 space-y-2">
                <NumberField
                  label={`${OWNER_NAMES[owner]} günlük erişim (mm)`}
                  value={profileLimits(profiles[owner]).dailyReachMm}
                  min={800}
                  max={2600}
                  onCommit={dailyReachMm => setProfile(owner, { dailyReachMm })}
                />
                <NumberField
                  label={`${OWNER_NAMES[owner]} üst erişim (mm)`}
                  value={profileLimits(profiles[owner]).upperReachMm}
                  min={1000}
                  max={3000}
                  onCommit={upperReachMm => setProfile(owner, { upperReachMm })}
                />
                <button
                  type="button"
                  className={button}
                  onClick={() => setProfile(owner, { dailyReachMm: undefined, upperReachMm: undefined })}
                >
                  Boydan hesapla
                </button>
              </div>
            </details>
          </div>
        ))}
      </div>
      <p className="studio-helper">
        Planlama varsayımı: göz boyun %93&apos;ü, günlük erişim %105&apos;i, üst erişim %125&apos;i; 450 mm altı eğilme bölgesi. Ortak alan kısa kişinin erişimine göre değerlendirilir. Özel sınırlar boy değişince sabit kalır.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          className={`${button} ${overlay === 'ergonomics' ? 'border-sky-400 bg-sky-500/20 text-sky-100' : ''}`}
          aria-pressed={overlay === 'ergonomics'}
          onClick={() => setOverlay(overlay === 'ergonomics' ? 'none' : 'ergonomics')}
        >
          Erişim haritası
        </button>
        <button
          type="button"
          className={`${button} ${overlay === 'ownership' ? 'border-sky-400 bg-sky-500/20 text-sky-100' : ''}`}
          aria-pressed={overlay === 'ownership'}
          onClick={() => setOverlay(overlay === 'ownership' ? 'none' : 'ownership')}
        >
          Sahiplik renkleri
        </button>
      </div>
      {design.junctions.map(j => (
        <label key={j.id} className="block space-y-1">
          <span className="text-[11px] font-medium text-slate-300">Köşe sahibi</span>
          <select
            aria-label="Köşe sahibi"
            className={control}
            value={j.owner ?? 'ortak'}
            onChange={e => setCornerOwner(j.id, e.target.value as OwnerType)}
          >
            {owners.map(o => (
              <option key={o} value={o}>
                {OWNER_NAMES[o]}
              </option>
            ))}
          </select>
        </label>
      ))}
    </>
  );

  if (embedded) return <div className="space-y-3 text-xs">{content}</div>;
  return (
    <section className={section} aria-label="Kişisel ergonomi">
      {content}
    </section>
  );
}

export function CarcassConstructionPanel({ embedded = false }: { embedded?: boolean }) {
  const design = useWardrobeStore(s => s.design);
  const setMode = useWardrobeStore(s => s.setRunConstructionMode);

  const content = (
    <>
      <h3 className={title}>Gövde konstrüksiyonu</h3>
      {design.runs.map(r => (
        <label key={r.id} className="block space-y-1">
          <span className="text-[11px] font-medium text-slate-300">{r.label}</span>
          <select
            aria-label={`${r.wallAxis} kolu konstrüksiyonu`}
            value={r.constructionMode ?? 'separate'}
            className={control}
            onChange={e => setMode(r.id, e.target.value as 'shared' | 'separate')}
          >
            <option value="shared">Paylaşımlı dikme · N+1 panel</option>
            <option value="separate">Ayrı gövdeler · 2N panel</option>
          </select>
        </label>
      ))}
      <p className="studio-helper">
        Eski JSON dosyaları ayrı gövde ölçüleriyle korunur. Seçim dış genişlikleri korur; net açıklıkları yeniden hesaplar ve Geri Al ile geri döner. Ortak dikmenin kalınlığı soldaki bölmenin brüt payına dahildir.
      </p>
    </>
  );

  if (embedded) return <div className="space-y-2.5 border-t border-slate-800 pt-2.5 text-xs">{content}</div>;
  return (
    <section className={section} aria-label="Gövde konstrüksiyonu">
      {content}
    </section>
  );
}

export function Phase4RoomPanel() {
  return (
    <>
      <RoomCeilingPanel />
      <RoomErgonomicsPanel />
      <CarcassConstructionPanel />
      <ObstaclePanel />
    </>
  );
}

export function ObstaclePanel({ embedded = false }: { embedded?: boolean }) {
  const obstacles = useWardrobeStore(s => s.design.obstacles) ?? [];
  const selected = useWardrobeStore(s => s.selectedObstacleId);
  const select = useWardrobeStore(s => s.selectRoomObstacle);
  const add = useWardrobeStore(s => s.addRoomObstacle);
  const update = useWardrobeStore(s => s.updateRoomObstacle);
  const remove = useWardrobeStore(s => s.removeRoomObstacle);
  const setView = useWardrobeStore(s => s.setViewMode);
  const [kind, setKind] = useState<RoomObstacleKind>('bed');
  const obstacle = obstacles.find(o => o.id === selected) ?? obstacles[0];

  const content = (
    <>
      {!embedded && <h2 className={title}>Oda engelleri</h2>}
      <div className="flex gap-2">
        <select
          aria-label="Yeni engel türü"
          className={control}
          value={kind}
          onChange={e => setKind(e.target.value as RoomObstacleKind)}
        >
          {Object.entries(OBSTACLES).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
        <button type="button" className={`${button} shrink-0`} onClick={() => add(kind)}>
          Engel ekle
        </button>
      </div>
      <button type="button" className={`${button} w-full`} onClick={() => setView('2d-plan-top')}>
        Üst planda yerleşimi incele
      </button>
      {obstacle ? (
        <div className="studio-card space-y-2.5">
          <select
            aria-label="Düzenlenen engel"
            className={control}
            value={obstacle.id}
            onChange={e => select(e.target.value)}
          >
            {obstacles.map(o => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
          <label className="block space-y-1">
            <span className="text-[11px] font-medium text-slate-300">Engel adı</span>
            <input
              aria-label="Engel adı"
              key={`${obstacle.id}-label`}
              defaultValue={obstacle.label}
              onBlur={e => {
                if (e.target.value.trim() !== obstacle.label && e.target.value.trim()) {
                  update(obstacle.id, { label: e.target.value.trim() });
                }
              }}
              className={control}
            />
          </label>
          <div className="studio-form-grid grid grid-cols-3 gap-x-2">
            {(['X', 'Y', 'Z'] as const).map((axis, i) => (
              <NumberField
                key={`${obstacle.id}-p-${i}`}
                label={`${axis} konumu (mm)`}
                value={obstacle.positionMm[i]}
                min={i === 1 ? 0 : -10000}
                max={i === 1 ? 5000 : 20000}
                onCommit={n => {
                  const positionMm: [number, number, number] = [...obstacle.positionMm];
                  positionMm[i] = n;
                  update(obstacle.id, { positionMm });
                }}
              />
            ))}
          </div>
          <div className="studio-form-grid grid grid-cols-3 gap-x-2">
            {['Genişlik', 'Yükseklik', 'Derinlik'].map((label, i) => (
              <NumberField
                key={`${obstacle.id}-s-${i}`}
                label={`Engel ${label.toLocaleLowerCase('tr')} (mm)`}
                value={obstacle.sizeMm[i]}
                min={1}
                max={i === 1 ? 5000 : 10000}
                onCommit={n => {
                  const sizeMm: [number, number, number] = [...obstacle.sizeMm];
                  sizeMm[i] = n;
                  update(obstacle.id, { sizeMm });
                }}
              />
            ))}
          </div>
          <NumberField
            label="Engel dönüşü (°)"
            value={obstacle.rotationDeg}
            min={-360}
            max={360}
            onCommit={rotationDeg => update(obstacle.id, { rotationDeg })}
          />
          {obstacle.kind === 'roomDoor' && (
            <div className="studio-form-grid grid grid-cols-2 gap-x-2">
              <NumberField
                label="Oda kapısı açısı (°)"
                value={obstacle.openingAngleDeg ?? 90}
                max={180}
                onCommit={openingAngleDeg => update(obstacle.id, { openingAngleDeg })}
              />
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-medium text-slate-300">Oda kapısı menteşesi</span>
                <select
                  aria-label="Oda kapısı menteşesi"
                  className={control}
                  value={obstacle.hingeSide ?? 'left'}
                  onChange={e => update(obstacle.id, { hingeSide: e.target.value as 'left' | 'right' })}
                >
                  <option value="left">Sol</option>
                  <option value="right">Sağ</option>
                </select>
              </label>
            </div>
          )}
          <p className="studio-helper">
            X/Y/Z sol-alt-arka köşedir. A duvarı X, B duvarı Z boyunca uzanır; +Y yukarı. Dönüş bu köşe etrafındadır.
          </p>
          <button
            type="button"
            className={`${button} border-rose-500/40 text-rose-200 hover:border-rose-400 hover:bg-rose-950/60`}
            onClick={() => remove(obstacle.id)}
          >
            Engeli kaldır
          </button>
        </div>
      ) : (
        <p className="studio-helper">Yatak, kapı veya sabit engel ekleyerek gerçek yerleşimi kontrol edin.</p>
      )}
    </>
  );

  if (embedded) return <div className="space-y-3 text-xs">{content}</div>;
  return (
    <section className={section} aria-label="Oda engelleri">
      {content}
    </section>
  );
}

export function Phase4InteriorPanel() {
  return (
    <>
      <InventoryPanel />
      <StorageTemplatePanel />
    </>
  );
}

export function InventoryPanel({ embedded = false }: { embedded?: boolean }) {
  const targets = useWardrobeStore(s => s.design.inventory) ?? [];
  const analysis = useWardrobeStore(s => s.resolved.analysis);
  const upsert = useWardrobeStore(s => s.upsertInventoryTarget);
  const remove = useWardrobeStore(s => s.removeInventoryTarget);
  const [owner, setOwner] = useState<OwnerType>('anne');
  const [kind, setKind] = useState<InventoryItemKind>('shirts');

  const content = (
    <>
      {!embedded && <h2 className={title}>Envanter ve gerçek kapasite</h2>}
      <table className="w-full table-fixed text-[11px]">
        <thead className="text-sky-200">
          <tr>
            <th className="w-1/3 py-1 text-left">Kapasite</th>
            {owners.map(o => (
              <th key={o} className="px-1 text-right">
                {OWNER_NAMES[o]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-slate-200">
          {(
            [
              ['Askı (m)', 'hangingLengthMm', 1000, 2],
              ['Raf/taban (m²)', 'shelfAreaMm2', 1e6, 2],
              ['Çekmece (L)', 'drawerVolumeMm3', 1e6, 1],
              ['Ayakkabı (çift)', 'shoePairs', 1, 0],
            ] as const
          ).map(([label, key, divisor, digits]) => (
            <tr key={key} className="border-t border-slate-800">
              <th scope="row" className="py-1 text-left font-normal text-slate-300">
                {label}
              </th>
              {owners.map(own => (
                <td key={own} className="px-1 text-right tabular-nums">
                  {((analysis?.metrics[own]?.[key] ?? 0) / divisor).toLocaleString('tr-TR', {
                    maximumFractionDigits: digits,
                  })}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="grid grid-cols-[84px_1fr] items-end gap-2">
        <select
          aria-label="Yeni hedef sahibi"
          className={control}
          value={owner}
          onChange={e => setOwner(e.target.value as OwnerType)}
        >
          {owners.map(o => (
            <option key={o} value={o}>
              {OWNER_NAMES[o]}
            </option>
          ))}
        </select>
        <select
          aria-label="Yeni hedef eşyası"
          className={control}
          value={kind}
          onChange={e => setKind(e.target.value as InventoryItemKind)}
        >
          {Object.entries(INVENTORY_CATALOG).map(([id, def]) => (
            <option key={id} value={id}>
              {def.label}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        className={`${button} w-full`}
        onClick={() =>
          upsert({
            id: `inventory-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
            owner,
            kind,
            quantity: 10,
          })
        }
      >
        Envanter hedefi ekle
      </button>
      <p className="studio-helper">
        Kapasite tek eşya türü için muhafazakâr geometrik tahmindir. “Ayrılan” hedeflerin birlikte yerleşimidir; aynı hacim tekrar kullanılmaz. Ortak alanlar liste sırasıyla paylaşılır. Ölçüler örnek eşya varsayımlarıdır; kendi eşyanızın ölçüsünü girebilirsiniz.
      </p>
      {targets.map(target => {
        const row = analysis?.inventory.find(r => r.target.id === target.id);
        const dims = itemDimensions(target);
        const patch = (p: Partial<InventoryTarget>) => upsert({ ...target, ...p });
        return (
          <div
            key={target.id}
            className={`space-y-2 rounded-lg border p-2.5 ${
              row?.shortfall ? 'border-amber-600/60 bg-amber-950/15' : 'border-slate-700 bg-slate-950/65'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-slate-100">{INVENTORY_CATALOG[target.kind].label}</span>
              <button
                type="button"
                aria-label={`${INVENTORY_CATALOG[target.kind].label} hedefini kaldır`}
                className="text-[11px] text-slate-300 underline-offset-2 hover:text-rose-200 hover:underline"
                onClick={() => remove(target.id)}
              >
                Kaldır
              </button>
            </div>
            <div className="studio-form-grid grid grid-cols-2 gap-x-2">
              <label className="flex flex-col gap-1">
                <span className="block text-[11px] font-medium text-slate-300">Hedef sahibi</span>
                <select
                  aria-label={`${INVENTORY_CATALOG[target.kind].label} sahibi`}
                  className={control}
                  value={target.owner}
                  onChange={e => patch({ owner: e.target.value as OwnerType })}
                >
                  {owners.map(o => (
                    <option key={o} value={o}>
                      {OWNER_NAMES[o]}
                    </option>
                  ))}
                </select>
              </label>
              <NumberField
                label={`${INVENTORY_CATALOG[target.kind].label} hedef adedi`}
                value={target.quantity}
                max={1000}
                onCommit={quantity => patch({ quantity })}
              />
            </div>
            <dl className="grid grid-cols-4 gap-1 text-center text-[11px] tabular-nums">
              <div className="rounded bg-slate-900 py-1">
                <dt>Hedef</dt>
                <dd>{target.quantity}</dd>
              </div>
              <div className="rounded bg-sky-950 py-1 text-sky-200">
                <dt>Kapasite</dt>
                <dd>{row?.capacity === 1000 ? '1000+' : row?.capacity ?? 0}</dd>
              </div>
              <div className="rounded bg-emerald-950 py-1 text-emerald-200">
                <dt>Ayrılan</dt>
                <dd>{row?.allocated ?? 0}</dd>
              </div>
              <div className={`rounded py-1 ${row?.shortfall ? 'bg-amber-950 text-amber-200' : 'bg-slate-900'}`}>
                <dt>Eksik</dt>
                <dd>{row?.shortfall ?? 0}</dd>
              </div>
            </dl>
            {row?.shortfall ? (
              <p className="text-[11px] text-amber-200">{row.suggestion}</p>
            ) : (
              <p className="text-[11px] text-emerald-300">Hedef karşılanıyor.</p>
            )}
            <details className="text-[11px] text-slate-300">
              <summary className="cursor-pointer">Eşya ölçüleri ve kullanılan alanlar</summary>
              <div className="studio-form-grid mt-2 grid grid-cols-3 gap-x-2">
                <NumberField label="Eşya eni (mm)" value={dims.widthMm} min={1} max={3000} onCommit={widthMm => patch({ widthMm })} />
                <NumberField label="Eşya derinliği (mm)" value={dims.depthMm} min={1} max={3000} onCommit={depthMm => patch({ depthMm })} />
                <NumberField label="Eşya yüksekliği (mm)" value={dims.heightMm} min={1} max={3000} onCommit={heightMm => patch({ heightMm })} />
                {INVENTORY_CATALOG[target.kind].hanging && (
                  <NumberField
                    label="Askı başına aralık (mm)"
                    value={dims.hangerPitchMm ?? 55}
                    min={10}
                    max={300}
                    onCommit={hangerPitchMm => patch({ hangerPitchMm })}
                  />
                )}
              </div>
              <p className="mt-2 text-slate-300">{row?.spaceLabels.join(' · ') || 'Uygun alan bulunamadı.'}</p>
            </details>
          </div>
        );
      })}
    </>
  );

  if (embedded) return <div className="space-y-3 text-xs">{content}</div>;
  return (
    <section className={section} aria-label="Envanter ve kapasite">
      {content}
    </section>
  );
}

export function StorageTemplatePanel({ embedded = false }: { embedded?: boolean }) {
  const design = useWardrobeStore(s => s.design);
  const bayId = useWardrobeStore(s => s.selectedBayId);
  const cellId = useWardrobeStore(s => s.selectedCellId);
  const apply = useWardrobeStore(s => s.applyStorageTemplate);
  const copy = useWardrobeStore(s => s.copyBay);
  const mirror = useWardrobeStore(s => s.mirrorBay);
  const setOwner = useWardrobeStore(s => s.setBayOwner);
  const [targetRun, setTargetRun] = useState('run-A');
  const [template, setTemplate] = useState<StorageTemplateId>('deepYukluk');
  const [useCell, setUseCell] = useState(false);
  const run = design.runs.find(r => r.bays.some(b => b.id === bayId));
  const bay = run?.bays.find(b => b.id === bayId);
  const effectiveRun = design.runs.some(r => r.id === targetRun) ? targetRun : design.runs[0].id;

  const content = (
    <>
      {!embedded && <h2 className={title}>Özel depolama ve bölme işlemleri</h2>}
      <p className="text-[11px] text-slate-300">
        {bay ? `Seçili: ${bay.label}` : 'Önce sahneden veya yapı ağacından bir gövde bölmesi seçin.'}
      </p>
      {bay && run && (
        <label className="block space-y-1">
          <span className="text-[11px] font-medium text-slate-300">Tüm bölmenin sahibi</span>
          <select
            aria-label="Tüm bölmenin sahibi"
            className={control}
            value={bay.owner}
            onChange={e => setOwner(run.id, bay.id, e.target.value as OwnerType)}
          >
            {owners.map(o => (
              <option key={o} value={o}>
                {OWNER_NAMES[o]}
              </option>
            ))}
          </select>
        </label>
      )}
      <select
        aria-label="Özel depolama şablonu"
        value={template}
        onChange={e => setTemplate(e.target.value as StorageTemplateId)}
        className={control}
      >
        {Object.entries(STORAGE_TEMPLATE_CATALOG).map(([id, def]) => (
          <option key={id} value={id}>
            {def.label}
          </option>
        ))}
      </select>
      <p className="studio-helper">{STORAGE_TEMPLATE_CATALOG[template].description}</p>
      <label className="flex items-center gap-2 text-[11px] text-slate-200">
        <input
          type="checkbox"
          checked={useCell}
          onChange={e => setUseCell(e.target.checked)}
          disabled={!cellId || template === 'steppedLHanging' || template === 'blindLuggage'}
        />
        Yalnız seçili iç hücreye uygula
      </label>
      <p className="studio-helper">
        Uygula, hedefin iç düzenini değiştirir; tek Geri Al ile geri döner. L-askı iki kolun ilk bölmelerini, kör köşe şablonu öncelikli kolun ilk bölmesini düzenler.
      </p>
      <button
        type="button"
        className={`${button} w-full`}
        disabled={!bay}
        onClick={() => {
          if (bay) apply(template, bay.id, useCell ? cellId ?? undefined : undefined);
        }}
      >
        Şablonu uygula
      </button>
      <div className="space-y-2 border-t border-slate-800 pt-2.5">
        <label className="block space-y-1">
          <span className="text-[11px] font-medium text-slate-300">Kopyanın ekleneceği kol</span>
          <select
            aria-label="Kopya hedef kolu"
            className={control}
            value={effectiveRun}
            onChange={e => setTargetRun(e.target.value)}
          >
            {design.runs.map(r => (
              <option key={r.id} value={r.id}>
                {r.wallAxis} Kolu
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className={button} disabled={!bay} onClick={() => bay && copy(bay.id, effectiveRun)}>
            Bölmeyi kopyala
          </button>
          <button type="button" className={button} disabled={!bay} onClick={() => bay && copy(bay.id, effectiveRun, true)}>
            Aynalı kopya ekle
          </button>
        </div>
        <button type="button" className={`${button} w-full`} disabled={!bay} onClick={() => bay && mirror(bay.id)}>
          Seçili bölmeyi aynala
        </button>
        <p className="studio-helper">
          Kopya için kol uzunluğu bölmenin dış genişliği kadar artar. Yeni hücre kimlikleri üretilir. Çok bölmeli ortak kapaklar önce ayrılmalıdır.
        </p>
      </div>
    </>
  );

  if (embedded) return <div className="space-y-3 text-xs">{content}</div>;
  return (
    <section className={section} aria-label="Özel depolama ve kopyalama">
      {content}
    </section>
  );
}

export function IssueDetails({ issue }: { issue: ValidationIssue }) {
  const apply = useWardrobeStore(s => s.applyQuickFix);
  return (
    <div className="space-y-2">
      {(issue.why || issue.suggestions?.length) && (
        <details>
          <summary className="cursor-pointer text-[11px] font-semibold text-sky-300">
            Neden? / Çözüm önerileri
          </summary>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-300">{issue.why}</p>
          {issue.suggestions?.map((text, i) => (
            <p key={i} className="mt-1 text-[11px] text-slate-200">
              {text}
            </p>
          ))}
        </details>
      )}
      {issue.quickFixes?.map((fix, i) => (
        <button key={i} type="button" className={`${button} w-full text-left`} onClick={() => apply(fix)}>
          {fix.label}
        </button>
      ))}
    </div>
  );
}
