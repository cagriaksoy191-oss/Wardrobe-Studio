import { useMemo, useState } from 'react';
import { ACCESS_STATUS_LABEL, accessMeasurement, accessSequence, accessWarnings } from '../core/analysis/functionalAccess';
import { convexHull, drawerVolumes, hingedVolumes, polygonBounds, rectangle, slidingVolumes, type PhysicalVolume } from '../core/analysis/kinematics';
import { evaluateAccessOptions } from '../core/fronts/accessRemedies';
import { extractProduction } from '../core/production/productionModel';
import type { Design, Point2DMm, ResolvedFunctionalAccess, ResolvedModel } from '../core/schema/types';
import { useWardrobeStore } from '../store/useWardrobeStore';
import { StudioDialog } from './StudioDialog';

const button = 'min-h-9 rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-100 hover:border-sky-400';
const statusColor = { blocked: 'text-rose-300', unverified: 'text-amber-200', usable: 'text-emerald-300' };
const polygonPoints = (p: Point2DMm[]) => p.map(point => `${point.xMm},${point.zMm}`).join(' ');

function AccessPlan({ model, entry, label }: { model: ResolvedModel; entry?: ResolvedFunctionalAccess; label: string }) {
  const body = [
    ...model.corners.filter(corner => corner.type === 'diagonal').map(corner => ({ id: corner.id, points: corner.polygonXZMm })),
    ...model.bays.map(bay => {
      const [x, , z] = bay.worldCenterMm, [w, , d] = bay.worldSizeMm;
      return { id: bay.id, points: rectangle(x-w/2,z-d/2,w,d) };
    }),
  ];
  const hinged = model.doors.filter(door => entry?.coveringIds.includes(door.id));
  const sliding = (model.slidingDoors ?? []).filter(door => entry?.coveringIds.includes(door.id));
  const drawer = model.drawers.find(candidate => candidate.id === entry?.id);
  const solids: { id: string; closed: Point2DMm[]; pose: PhysicalVolume[]; sweep?: Point2DMm[] }[] = [
    ...hinged.map(door => {
      const angle = entry?.steps.find(step => step.partId === door.id)?.position ?? door.opening?.safeAngleDeg ?? 0;
      const fraction = angle / door.maxAngleDeg;
      return {
        id: door.id, closed: hingedVolumes(door, 0)[0].polygon,
        pose: hingedVolumes(door, fraction), sweep: convexHull(Array.from({length: 9}, (_, i) =>
          hingedVolumes(door, fraction * i / 8).flatMap(volume => volume.polygon)).flat()),
      };
    }),
    ...sliding.map(door => ({
      id: door.id, closed: slidingVolumes(door, door.initialOffsetMm)[0].polygon,
      pose: slidingVolumes(door, entry?.steps.find(step => step.partId === door.id)?.position ?? door.initialOffsetMm),
    })),
    ...(drawer ? [{
      id: drawer.id, closed: drawerVolumes(drawer, 0)[0].polygon,
      pose: drawerVolumes(drawer, (entry?.travel?.availableMm ?? 0) / Math.max(1, drawer.maxSlideMm)),
    }] : []),
  ];
  const points = [...body.flatMap(item => item.points), ...solids.flatMap(item => item.pose.flatMap(volume => volume.polygon))];
  if (!points.length) return null;
  const bounds = polygonBounds(points);
  const stroke = Math.max(bounds.maxX - bounds.minX, bounds.maxZ - bounds.minZ) / 300;
  const pad = 9 * stroke;
  return <figure className="min-w-0 rounded-lg border border-slate-700 bg-slate-950 p-3">
    <figcaption className="mb-2 text-xs font-semibold text-slate-100">{label}</figcaption>
    <svg role="img" aria-label={`${label} · üst görünüş`} className="h-40 w-full sm:h-48"
      viewBox={`${bounds.minX-pad} ${bounds.minZ-pad} ${bounds.maxX-bounds.minX+2*pad} ${bounds.maxZ-bounds.minZ+2*pad}`}>
      {body.map(item => <polygon key={item.id} points={polygonPoints(item.points)}
        fill={item.id === entry?.bayId ? '#164e63' : '#263449'} stroke={item.id === entry?.bayId ? '#67e8f9' : '#64748b'} strokeWidth={stroke} />)}
      {solids.map(item => <g key={item.id}>
        {item.sweep && <polygon points={polygonPoints(item.sweep)} fill="#fb923c" opacity=".20" />}
        <polygon points={polygonPoints(item.closed)} fill="none" stroke="#fbbf24" strokeWidth={stroke} strokeDasharray={`${3*stroke} ${2*stroke}`} />
        {item.pose.map((volume,i) => <polygon key={i} points={polygonPoints(volume.polygon)} fill={i === 0 ? '#fdba74' : '#f8fafc'}
          fillOpacity={i === 0 ? '.8' : '.5'} stroke="#fcd34d" strokeWidth={stroke*.55}/>)}
      </g>)}
    </svg>
    <p className="mt-1 text-[11px] text-slate-400">
      {solids.length > 0
        ? 'Kesik çizgi kapalı konum. Turuncu, denetlenen hareket ve parça zarfı.'
        : 'Kapaksız açık erişim — bu görünümde kapak veya hareket zarfı bulunmaz.'}
    </p>
  </figure>;
}

export function AccessReview({ onClose, onApplied }: { onClose: () => void; onApplied: () => void }) {
  const design = useWardrobeStore(state => state.design);
  const model = useWardrobeStore(state => state.resolved);
  const apply = useWardrobeStore(state => state.applyAccessRemedy);
  const entries = model.analysis?.functionalAccess ?? [];
  const warnings = accessWarnings(entries);
  const [chosen, setChosen] = useState(warnings[0]?.bayId ?? entries[0]?.bayId ?? '');
  const [preview, setPreview] = useState<{ index: number; design: Design } | null>(null);
  const [failure, setFailure] = useState('');
  const moduleEntries = entries.filter(entry => entry.bayId === chosen);
  const issue = warnings.find(entry => entry.bayId === chosen);
  const representative = issue ?? moduleEntries[0];
  const options = useMemo(() => evaluateAccessOptions(design, model, chosen), [design, model, chosen]);
  const partLabelByCode = useMemo(() => {
    const pkg = extractProduction(design, model);
    return new Map(pkg.parts.map(part => [part.code, part.label]));
  }, [design, model]);
  const formatPartRef = (code: string) => {
    const label = partLabelByCode.get(code);
    return label ? `${label} (${code})` : code;
  };
  const option = preview?.design === design ? options[preview.index] : undefined;
  const nextEntry = option?.entries.find(entry => entry.id === representative?.id) ?? option?.entries[0];
  const door = model.doors.find(candidate => candidate.isCornerDoor && candidate.bayIds.includes(chosen));
  const optionDoor = option?.model.doors.find(candidate => candidate.isCornerDoor && candidate.bayIds.includes(chosen));
  const sectionName = (id: string) => model.bays.find(bay => bay.id === id)?.label ?? 'Beşgen köşe';
  const remaining = option?.model.analysis?.functionalAccess.filter(entry => entry.status === 'blocked').length ?? 0;
  return <StudioDialog label="İşlevsel erişim ve çözümler" onClose={onClose}>
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-700 p-3">
      <div><h2 className="font-semibold text-slate-100">İşlevsel erişim</h2>
        <p className="text-xs text-slate-400">Raf geçişi, askı açıklığı ve çekmece hareketi ayrı ölçülür.</p></div>
      <button autoFocus type="button" className={button} onClick={onClose}>Erişim incelemesini kapat</button>
    </div>
    <div className="min-h-0 flex-1 space-y-4 overflow-auto p-3 sm:p-5">
      <label className="block max-w-md space-y-1 text-xs text-slate-300">İncelenen bölüm
        <select className="block w-full rounded border border-slate-600 bg-slate-900 p-2 text-sm" value={chosen}
          onChange={event => { setChosen(event.target.value); setPreview(null); setFailure(''); }}>
          {[...new Set(entries.map(entry => entry.bayId))].map(id =>
            <option key={id} value={id}>{sectionName(id)}{warnings.some(entry => entry.bayId === id) ? ' · kontrol' : ''}</option>)}
        </select>
      </label>
      {representative && <div className="space-y-2 rounded-lg border border-slate-700 p-3 text-sm">
        <h3 className={`font-semibold ${statusColor[representative.status]}`}>{ACCESS_STATUS_LABEL[representative.status]}</h3>
        {door?.opening && <p className="text-slate-200">Kapak {door.opening.safeAngleDeg}° / {door.maxAngleDeg}°. Engel {door.opening.blockerLabel ?? 'yok'}.</p>}
        {representative.status === 'blocked' && <p className="text-rose-100">{representative.travel
          ? 'Çekmece mevcut düzenle planlanan kızak mesafesine ulaşmıyor.'
          : 'Bu kapak düzeni, rafın referans eşyası için gerekli geçişi sağlamıyor.'}</p>}
        <p className={statusColor[representative.status]}>{representative.label} · {accessMeasurement(representative)}</p>
        <details open={moduleEntries.length === 1}>
          <summary className="cursor-pointer py-1 text-xs text-slate-300">Bu bölümdeki {moduleEntries.length} ölçümü ve açma sırasını göster</summary>
          <ul className="divide-y divide-slate-800">
            {moduleEntries.map(entry => <li key={entry.id} className="py-2">
              <div className="flex flex-wrap justify-between gap-1">
                <span>{entry.label}</span><span className={statusColor[entry.status]}>{accessMeasurement(entry)}</span>
              </div>
              {entry.blockerLabel && <p className="text-xs text-slate-400">Sınır {entry.blockerLabel}</p>}
              {entry.status === 'usable' && entry.steps.length > 0 && <p className="text-xs text-slate-400">Diğer parçalar kapalıyken sıra · {accessSequence(entry)}</p>}
            </li>)}
          </ul>
        </details>
      </div>}
      {issue?.status === 'blocked' && <section aria-label="Doğrulanmış düzen seçenekleri" className="space-y-2">
        <h3 className="text-sm font-semibold">Çözüm önizlemesi</h3>
        {options.length === 0 && <p className="text-sm text-slate-300">Bu açıklık ve donanım için doğrulanmış bir düzen değişikliği bulunamadı.</p>}
        <div className="flex flex-wrap gap-2">{options.map((candidate,i) =>
          <button type="button" className={`${button} aria-pressed:border-cyan-400`} key={candidate.title} aria-pressed={option === candidate}
            onClick={() => { setPreview({ index: i, design }); setFailure(''); }}>{candidate.title} · Önizle</button>)}</div>
      </section>}
      {option && <section className="space-y-3 rounded-lg border border-cyan-800 bg-cyan-950/20 p-3" aria-label="Seçilen çözüm">
        <div className="grid gap-2 md:grid-cols-2">
          <AccessPlan model={model} entry={representative} label="Mevcut düzen" />
          <AccessPlan model={option.model} entry={nextEntry} label={option.title} />
        </div>
        <p className="text-sm text-cyan-100">{nextEntry && `${accessMeasurement(nextEntry)}.`}
          {optionDoor ? ` Güvenli sınır ${optionDoor.opening?.safeAngleDeg ?? '—'}°. Kulp ve taşıyıcı çözüldü, ürün onayı gerekir.`
            : ' Bu aralıkta kanat ve ona ait kulp / menteşe veya ray kalkar.'}</p>
        <p className="text-xs text-slate-300">Parça farkı {option.added.length} eklenen, {option.removed.length} çıkarılan, {option.resized.length} ölçüsü değişen.
          {option.removed.length > 0 && ` Çıkarılan: ${option.removed.map(formatPartRef).join(', ')}.`} Donanım satırı farkı {option.hardwareDelta}.</p>
        <p className="text-xs text-slate-300">Kalan erişim engeli {remaining}. Diğer parçalar başlangıç konumunda. Montaj ve sahada erişim kontrolü geçerlidir.</p>
      </section>}
      <p className="text-xs leading-relaxed text-slate-400">Ölçüler referans eşyanın düz çıkarma yolunu ve denenen kapak sırasını gösterir. Esnek eşyalar, eğerek çıkarma ve katalog donanımı yerinde doğrulanır.</p>
      {failure && <p role="alert" className="text-sm text-rose-200">{failure}</p>}
    </div>
    {option && <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-slate-700 bg-slate-950 p-3">
      <p className="text-xs text-slate-300">Bir düzenleme olarak uygulanır. Tek Geri Al ile geri dönebilirsiniz.</p>
      <button type="button" className="min-h-10 rounded-md bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950"
        onClick={() => {
          if (apply(design, option.remedy)) onApplied();
          else setFailure('Çalışma kopyası değişti veya işlem tamamlanamadı. Güncel çözümü yeniden önizleyin.');
        }}>Çözümü uygula</button>
    </div>}
  </StudioDialog>;
}
