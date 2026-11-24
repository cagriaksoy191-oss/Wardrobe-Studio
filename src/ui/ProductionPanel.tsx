import {useEffect,useId,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {useWardrobeStore} from '../store/useWardrobeStore';
import {useVersionArchive} from '../store/versionArchive';
import {extractProduction} from '../core/production/productionModel';
import {buildTechnicalSheets,sheetToSvg} from '../core/production/technicalSheets';
import {fullManufacturingExportDenial} from '../core/production/fullExportPolicy';
import {downloadFile,safeFileName} from '../export/download';
import {downloadFullManufacturingFile,downloadProductionDocument,manufacturingVersion} from '../export/manufacturingDownload';
import { NumberField } from './Phase4Panels';
import { StudioDialog } from './StudioDialog';
import { accessMeasurement, accessWarnings } from '../core/analysis/functionalAccess';

const button='rounded border border-slate-600 bg-slate-800 px-3 py-2 text-xs text-slate-100 hover:border-sky-400 disabled:cursor-not-allowed disabled:opacity-40';
const compactButton='rounded border border-slate-600 bg-slate-800 px-2.5 py-1.5 text-[11px] font-medium text-slate-100 hover:border-sky-400 disabled:cursor-not-allowed disabled:opacity-40';
const CAPTURE_KIND_LABELS: Record<string, string> = {
  color: 'Görünüm',
  depth: 'Derinlik',
  edges: 'Tel / kenar',
};
export function ProductionPanel({ onReviewAccess }: { onReviewAccess: () => void }) {
  const design=useWardrobeStore(s=>s.design),model=useWardrobeStore(s=>s.resolved),versions=useVersionArchive(s=>s.versions);
  const version=useMemo(()=>manufacturingVersion(design,versions),[design,versions]);
  const pkg=useMemo(()=>extractProduction(design,model,version?.name??'Çalışma kopyası'),[design,model,version?.name]);
  const sheets=useMemo(()=>buildTechnicalSheets(design,model,pkg,true),[design,model,pkg]);
  const [chosen,setChosen]=useState('00-KAPAK'),[show,setShow]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[renderPrompt,setRenderPrompt]=useState(''),[renderPromptStatus,setRenderPromptStatus]=useState('');
  const [search,setSearch]=useState(''),[scale,setScale]=useState<'page'|'width'|number>('page');
  const sheetViewport=useRef<HTMLDivElement>(null);
  const activeTask=useRef<AbortController | null>(null);
  const exportNoticeId=useId();
  const [capture,setCapture]=useState<{kind:string;data:string;width:number;height:number}|null>(null);
  useEffect(()=>{const ready=(e:Event)=>setCapture((e as CustomEvent).detail);window.addEventListener('wardrobe:capture-ready',ready);return()=>window.removeEventListener('wardrobe:capture-ready',ready);},[]);
  const sheet=sheets.find(s=>s.id===chosen)??sheets[0],svg=useMemo(()=>sheetToSvg(sheet),[sheet]),stem=safeFileName(`${design.name}-${pkg.versionName}`),blocked=pkg.status==='blocked';
  const diagnostic = pkg.accessStatus === 'blocked';
  const fullExportDenial = fullManufacturingExportDenial(design, model, pkg);
  const geometryErrors = pkg.issues.filter(issue => issue.severity === 'error').length;
  const accessErrors = pkg.functionalAccess.filter(entry => entry.status === 'blocked').length;
  const accessUnknown = pkg.functionalAccess.filter(entry => entry.status === 'unverified').length;
  const accessIssue = accessWarnings(pkg.functionalAccess)[0];
  const tone = blocked || diagnostic ? 'text-rose-200' : 'text-amber-200';
  const pageIndex = sheets.indexOf(sheet);
  const goTo = (index: number) => setChosen(sheets[Math.max(0, Math.min(sheets.length - 1, index))].id);
  const closePreview = () => {
    setShow(false);
    setSearch('');
  };
  const openAccessFromModal = () => {
    closePreview();
    onReviewAccess();
  };
  const query = search.trim().toLocaleLowerCase('tr-TR');
  const matches = useMemo(
    () => (query ? sheets.filter(s =>
      [s.id, s.title, ...s.partCodes].some(text => text.toLocaleLowerCase('tr-TR').includes(query))) : sheets),
    [query, sheets]
  );
  const hasNoSearchMatches = Boolean(query && matches.length === 0);
  useEffect(() => {
    if (query && matches.length > 0 && !matches.some(m => m.id === chosen)) {
      setChosen(matches[0].id);
    }
  }, [query, matches, chosen]);
  useEffect(() => { sheetViewport.current?.scrollTo(0, 0); }, [chosen]);
  useEffect(() => useWardrobeStore.subscribe((current, previous) => {
    if (current.design !== previous.design || current.resolved !== previous.resolved) {
      setMessage('');
      setRenderPrompt('');
      setRenderPromptStatus('');
    }
  }), []);
  useLayoutEffect(() => {
    const cancelActive = () => {
      if (activeTask.current) {
        activeTask.current.abort();
        activeTask.current = null;
        setBusy(false);
      }
    };
    window.addEventListener('wardrobe:cancel-production-exports', cancelActive);
    return () => {
      window.removeEventListener('wardrobe:cancel-production-exports', cancelActive);
      activeTask.current?.abort();
    };
  }, []);
  const task = async (work: (signal: AbortSignal) => Promise<void>) => {
    if (activeTask.current) return;
    const operation = new AbortController();
    activeTask.current = operation;
    setBusy(true);
    setMessage('');
    try {
      await work(operation.signal);
    } catch (error) {
      if (!operation.signal.aborted) {
        setMessage(error instanceof Error ? error.message : 'Çıktı oluşturulamadı.');
      }
    } finally {
      activeTask.current = null;
      if (!operation.signal.aborted) setBusy(false);
    }
  };
  const pdf = () => task(async signal => {
    const { design: startDesign, resolved: startResolved } = useWardrobeStore.getState();
    const result = await downloadProductionDocument('pdf', signal);
    const current = useWardrobeStore.getState();
    if (!signal.aborted && current.design === startDesign && current.resolved === startResolved) setMessage(result);
  });
  const printable = () => task(async signal => {
    const { design: startDesign, resolved: startResolved } = useWardrobeStore.getState();
    const result = await downloadProductionDocument('printable', signal);
    const current = useWardrobeStore.getState();
    if (!signal.aborted && current.design === startDesign && current.resolved === startResolved) setMessage(result);
  });
  const fullExport = (format: 'csv' | 'zip') => task(async signal => {
    const { design: startDesign, resolved: startResolved } = useWardrobeStore.getState();
    const result = await downloadFullManufacturingFile(format, signal);
    const current = useWardrobeStore.getState();
    if (!signal.aborted && current.design === startDesign && current.resolved === startResolved) setMessage(result);
  });
  const downloadSvg=()=>task(async()=>{
    downloadFile(`${safeFileName(sheet.id)}.svg`,svg,'image/svg+xml;charset=utf-8');
    setMessage(`${sheet.id} SVG paftası için indirme başlatıldı.`);
  });
  const svgDisabled = busy || blocked || (show && hasNoSearchMatches);
  const diagnosticButtons = (
    <div className="flex flex-wrap gap-2">
      <button type="button" className={button} disabled={busy||blocked} onClick={()=>void pdf()}>{diagnostic?'Tanısal PDF indir':'PDF indir'} ({sheets.length} sayfa)</button>
      <button type="button" className={button} disabled={busy||blocked} onClick={()=>void printable()}>Yazdırılabilir rapor (.html)</button>
      <button type="button" className={button} disabled={svgDisabled} onClick={()=>void downloadSvg()}>Bu paftayı SVG indir ({sheet.id})</button>
    </div>
  );
  const cutPackageButtons = (
    <div className="flex flex-wrap gap-2">
      <button type="button" className={button} disabled={busy||Boolean(fullExportDenial)} aria-describedby={fullExportDenial?exportNoticeId:undefined} onClick={()=>void fullExport('csv')}>Tam CSV indir</button>
      <button type="button" className={button} disabled={busy||Boolean(fullExportDenial)} aria-describedby={fullExportDenial?exportNoticeId:undefined} onClick={()=>void fullExport('zip')}>Tüm SVG + CSV + JSON (ZIP)</button>
    </div>
  );
  const controls = diagnostic || blocked ? (
    <div className="space-y-2">
      <div className="space-y-1.5 rounded border border-sky-800/70 bg-slate-900/60 p-2.5">
        <p className="text-[11px] font-semibold text-sky-200">
          {blocked ? 'Tanısal İnceleme Çıktıları (Geometri Hatası Nedeniyle Kilitli)' : 'Tanısal İnceleme Çıktıları (Açık)'}
        </p>
        {diagnosticButtons}
      </div>
      <div className="space-y-1.5 rounded border border-rose-800/70 bg-rose-950/25 p-2.5">
        <p className="text-[11px] font-semibold text-rose-200">
          {blocked ? 'Üretim Kesim Paketi (Kritik Geometri Hatası Nedeniyle Kilitli)' : 'Üretim Kesim Paketi (Erişim Engeli Nedeniyle Kilitli)'}
        </p>
        {cutPackageButtons}
      </div>
      <p className="studio-helper text-[11px] text-slate-400">PDF: çok sayfalı çizim · HTML: tarayıcıdan yazdırma · SVG: aktif tek pafta · CSV/ZIP: kesim listesi ve tam atölye paketi.</p>
    </div>
  ) : (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-2">
        <button type="button" className={button} disabled={busy||blocked} onClick={()=>void pdf()}>PDF indir ({sheets.length} sayfa)</button>
        <button type="button" className={button} disabled={busy||Boolean(fullExportDenial)} aria-describedby={fullExportDenial?exportNoticeId:undefined} onClick={()=>void fullExport('csv')}>Tam CSV indir</button>
        <button type="button" className={button} disabled={busy||Boolean(fullExportDenial)} aria-describedby={fullExportDenial?exportNoticeId:undefined} onClick={()=>void fullExport('zip')}>Tüm SVG + CSV + JSON (ZIP)</button>
        <button type="button" className={button} disabled={busy||blocked} onClick={()=>void printable()}>Yazdırılabilir rapor (.html)</button>
        <button type="button" className={button} disabled={svgDisabled} onClick={()=>void downloadSvg()}>Bu paftayı SVG indir ({sheet.id})</button>
      </div>
      <p className="studio-helper text-[11px] text-slate-400">PDF: çok sayfalı çizim · HTML: tarayıcıdan yazdırma · SVG: aktif tek pafta · CSV/ZIP: kesim listesi ve tam atölye paketi.</p>
    </div>
  );
  const modalExportToolbar = (
    <div className="flex flex-wrap items-center gap-1.5">
      {(diagnostic || blocked) && (
        <span className="rounded border border-rose-700/80 bg-rose-950/40 px-2 py-1 text-[11px] font-semibold text-rose-200">
          {blocked ? 'Geometri hatası · kilitli' : 'Tanısal pafta · kesim kilitli'}
        </span>
      )}
      <button type="button" className={compactButton} disabled={busy||blocked} onClick={()=>void pdf()}>{diagnostic?'Tanısal PDF indir':'PDF indir'} ({sheets.length} sayfa)</button>
      <button type="button" className={compactButton} disabled={busy||Boolean(fullExportDenial)} aria-describedby={fullExportDenial?exportNoticeId:undefined} onClick={()=>void fullExport('csv')}>Tam CSV indir</button>
      <button type="button" className={compactButton} disabled={busy||Boolean(fullExportDenial)} aria-describedby={fullExportDenial?exportNoticeId:undefined} onClick={()=>void fullExport('zip')}>Tüm SVG + CSV + JSON (ZIP)</button>
      <button type="button" className={compactButton} disabled={busy||blocked} onClick={()=>void printable()}>Yazdırılabilir rapor (.html)</button>
      <button type="button" className={compactButton} disabled={svgDisabled} onClick={()=>void downloadSvg()}>Bu paftayı SVG indir ({sheet.id})</button>
      {diagnostic && !blocked && pkg.functionalAccess.length > 0 && (
        <button type="button" className={`${compactButton} border-amber-600/80`} onClick={openAccessFromModal}>Erişim ölçümlerini incele</button>
      )}
    </div>
  );
  const captureKindLabel = capture ? (CAPTURE_KIND_LABELS[capture.kind] ?? capture.kind) : '';
  return <section aria-label="Üretim paketi" className="studio-section space-y-3 text-xs">
    <h2 className="studio-section-title text-sm font-semibold text-sky-200">Üretim ön kontrolü</h2>
    <div className={`space-y-2 rounded border p-3 ${blocked||diagnostic?'border-red-700 bg-red-950/30':'border-amber-700 bg-amber-950/20'}`}>
      <p className={`font-semibold ${tone}`}>{pkg.statusLabel}</p>
      <p className="text-[11px] text-slate-200">Geometri {geometryErrors} kritik hata · Erişim {accessErrors} engel / {accessUnknown} açık kontrol</p>
      {accessIssue && <p className={`text-xs ${tone}`}>{accessIssue.label} · {accessMeasurement(accessIssue)}</p>}
      <p className="text-[11px] text-slate-300">{pkg.parts.length} fiziksel parça · {pkg.parts.filter(p=>p.shape==='polygon').length} özel poligon · {sheets.length} A3 pafta.</p>
      {fullExportDenial && <p id={exportNoticeId} className="text-xs text-red-200">{blocked
        ? 'Kritik geometri hatası düzeltilene kadar yalnızca önizleme açık.'
        : fullExportDenial}</p>}
      {pkg.functionalAccess.length > 0 && <button type="button" className={`${button} ${diagnostic ? 'border-amber-600/80' : ''}`} onClick={onReviewAccess}>Erişim ölçümlerini incele</button>}
    </div>
    <p className="studio-helper text-[11px] leading-relaxed text-slate-400">Ölçüler modellenen nominal bitmiş geometridir. Bant/kanal payı ve katalog donanımı usta kontrolü gerektirir. Cam/ayna satırları montaj zarfıdır; ham cam kesimi olarak kullanılmaz.</p>
    <button type="button" className={`${button} w-full border-sky-700`} onClick={()=>setShow(true)}>Paftaları ve kesim listesini geniş önizle</button>
    {controls}
    {busy&&<p role="status" className="text-sky-200">Paket hazırlanıyor…</p>}{message&&<p role="status" className="rounded border border-sky-900 p-2 text-sky-200">{message}</p>}
    {capture&&<figure className="space-y-1 rounded border border-slate-700 p-2"><img alt={`Son ${captureKindLabel} PNG önizlemesi`} src={capture.data} className="w-full rounded bg-white"/><figcaption className="text-[11px] text-slate-400">Son PNG: {capture.width} × {capture.height} piksel · {captureKindLabel}. İndirme başlatıldı. Yardımcı haritalarda seçim hacimleri ve stüdyo kılavuzları gizlenir.</figcaption></figure>}
    <details className="studio-card rounded border border-slate-700 p-2.5"><summary className="cursor-pointer text-slate-200">Malzeme kalınlık özeti</summary><table className="mt-2 w-full text-[11px]"><thead><tr><th className="text-left">Malzeme</th><th>mm</th><th>Parça</th><th>m²</th></tr></thead><tbody>{pkg.materialSummary.map(m=><tr key={`${m.materialId}-${m.thicknessMm}`} className="border-t border-slate-800"><td className="py-1">{m.material}</td><td className="text-right">{m.thicknessMm}</td><td className="text-right">{m.quantity}</td><td className="text-right">{(m.areaMm2/1e6).toFixed(3)}</td></tr>)}</tbody></table></details>
    <details className="studio-card space-y-2 rounded border border-slate-700 p-2.5"><summary className="cursor-pointer text-sky-200">PNG ve dış görselleştirme yardımcısı</summary><p className="mt-2 text-[11px] text-slate-400">Mevcut kameradan 2× çözünürlükte çıktı. Şema/ölçü katmanları PNG'ye dahil değildir. Yerel eşya, ışık ve kapak pozları görüntüye yansır.</p><div className="flex flex-wrap gap-1">{(['color','depth','edges']as const).map(kind=><button type="button" key={kind} className={button} onClick={()=>window.dispatchEvent(new CustomEvent('wardrobe:capture',{detail:{kind,name:stem}}))}>{kind==='color'?'Görünüm PNG':kind==='depth'?'Derinlik PNG':'Tel/kenar PNG'}</button>)}</div><button type="button" className={`${button} mt-2`} onClick={()=>{
      const value=`Ekli Wardrobe Studio görüntüsünü, derinlik ve tel/kenar yardımcılarını aynı kamera ve geometriyi kesin olarak koruyarak fotogerçekçi görselleştir. ${design.name}. Kollar: ${pkg.runDimensions.map(r=>`${r.axis}: ${r.lengthMm} × ${r.heightMm} × ${r.totalDepthMm} mm`).join('; ')}. Bölme, raf, kapak ve çekmece sayısını/değerlerini değiştirme. Malzemeler: ${[...new Set(pkg.parts.map(p=>p.material))].join(', ')}. Mevcut kulp, LED ve gömme bitiş kararlarını koru. Yeni mobilya veya ölçü ekleme. Teknik doğruluk kaynağı JSON ve üretim paketidir; bu görsel üretim onayı değildir.`;
      setRenderPrompt(value);
      if (navigator.clipboard?.writeText) {
        void navigator.clipboard.writeText(value).then(
          () => setRenderPromptStatus('Görselleştirme promptu hazırlandı ve panoya kopyalandı.'),
          () => setRenderPromptStatus('Görselleştirme promptu hazırlandı. Panoya erişilemedi; aşağıdaki metni seçip Ctrl+C ile kopyalayın.')
        );
      } else {
        setRenderPromptStatus('Görselleştirme promptu hazırlandı. Aşağıdaki metni seçip Ctrl+C ile kopyalayın.');
      }
    }}>Görselleştirme promptu hazırla</button>{renderPromptStatus&&<p role="status" className="mt-2 rounded border border-sky-800 bg-sky-950/30 p-2 text-[11px] text-sky-200">{renderPromptStatus}</p>}{renderPrompt&&<textarea aria-label="Görselleştirme promptu" className="mt-2 w-full rounded border border-slate-500 bg-slate-950 p-2 text-[11px] text-slate-200" rows={5} readOnly value={renderPrompt} onFocus={e=>e.target.select()}/>}</details>
    {show&&<StudioDialog label="Teknik pafta önizlemesi" onClose={closePreview}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 px-3 py-2">
        <div><h2 className="text-sm font-semibold">{design.name}</h2><p className={`text-xs ${tone}`}>{pkg.statusLabel} · {geometryErrors} kritik geometri hatası · {accessErrors} erişim engeli</p></div>
        <button type="button" autoFocus aria-label="Pafta önizlemesini kapat" className={button} onClick={closePreview}>Kapat (Esc)</button>
      </div>
      <div className="border-b border-slate-700 px-3 py-1.5">{modalExportToolbar}</div>
      <div className="flex flex-wrap items-end gap-2 border-b border-slate-700 px-3 py-2 text-xs">
        <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Pafta boyutu">
          <button type="button" className={compactButton} aria-pressed={scale==='page'} onClick={()=>setScale('page')}>Sayfaya sığdır</button>
          <button type="button" className={compactButton} aria-pressed={scale==='width'} onClick={()=>setScale('width')}>Genişliğe sığdır</button>
          <button type="button" className={compactButton} aria-label="Paftayı uzaklaştır" onClick={()=>setScale(Math.max(30,(typeof scale==='number'?scale:100)-20))}>−</button>
          <button type="button" className={compactButton} aria-label="Paftayı yakınlaştır" onClick={()=>setScale(Math.min(240,(typeof scale==='number'?scale:100)+20))}>+</button>
          {typeof scale==='number'&&<span className="px-1 tabular-nums">{scale}%</span>}
        </div>
        <div className="flex items-end gap-1" role="group" aria-label="Sayfaya git">
          <button type="button" className={compactButton} disabled={hasNoSearchMatches||pageIndex===0} onClick={()=>goTo(pageIndex-1)}>Önceki</button>
          <div className="w-19"><NumberField label="Sayfa" value={pageIndex+1} min={1} max={sheets.length} disabled={hasNoSearchMatches} inputClassName="border-slate-500" onCommit={n=>goTo(n-1)}/></div>
          <button type="button" className={compactButton} disabled={hasNoSearchMatches||pageIndex===sheets.length-1} onClick={()=>goTo(pageIndex+1)}>Sonraki</button>
        </div>
        <label className="flex min-w-32 flex-1 flex-col gap-1.5">
          <span className="block leading-tight">Pafta / parça kodu ara <span className="ml-1 text-[11px] text-slate-400 tabular-nums">({matches.length} / {sheets.length} pafta)</span></span>
          <input type="search" className="block w-full rounded border border-slate-500 bg-slate-900 px-2 py-1.5" value={search}
            onChange={e=>setSearch(e.target.value)} placeholder="Üst plan veya P-…" onKeyDown={event => {
              if (event.key !== 'Escape' || event.nativeEvent.isComposing) return;
              event.preventDefault();
              event.stopPropagation();
              closePreview();
            }} />
        </label>
        <label className="flex min-w-36 flex-1 flex-col gap-1.5">
          <span className="block leading-tight">Teknik paftalar</span>
          <select className="block w-full rounded border border-slate-500 bg-slate-900 px-2 py-1.5" value={matches.includes(sheet)?sheet.id:''} onChange={e=>setChosen(e.target.value)}>
            {!matches.includes(sheet)&&<option value="">{matches.length?'Pafta seçin':'Sonuç yok'}</option>}
            {matches.map(s=><option key={s.id} value={s.id}>{sheets.indexOf(s)+1}. {s.title}</option>)}
          </select>
        </label>
      </div>
      <div ref={sheetViewport} className="studio-sheet-viewport min-h-0 flex-1 overflow-auto bg-slate-800 p-3">
        {hasNoSearchMatches ? (
          <div role="status" className="mx-auto my-8 max-w-md rounded-lg border border-slate-700 bg-slate-900/95 p-5 text-center text-slate-200 shadow-lg">
            <p className="text-sm font-semibold text-amber-200">Eşleşen pafta bulunamadı</p>
            <p className="mt-1.5 text-xs text-slate-300">“{search.trim()}” için eşleşen pafta veya parça kodu bulunamadı.</p>
            <button type="button" className={`${button} mt-3 border-sky-700`} onClick={()=>setSearch('')}>Aramayı temizle</button>
          </div>
        ) : (
          <div className={`mx-auto bg-white shadow-lg [&_svg]:h-auto [&_svg]:w-full ${scale==='page'?'studio-sheet-fit':''}`}
            style={typeof scale==='number'?{width:`${scale}%`}:scale==='width'?{width:'100%'}:undefined} dangerouslySetInnerHTML={{__html:svg}}/>
        )}
      </div>
      <p role="status" className="border-t border-slate-700 p-2 text-[11px] text-slate-300">{hasNoSearchMatches ? `0 / ${sheets.length} eşleşen pafta · Arama: “${search.trim()}”` : `${pageIndex+1} / ${sheets.length} · ${sheet.id}${sheet.scale?` · Pafta ölçeği 1:${sheet.scale}`:''}`}. {busy?'Dosya hazırlanıyor…':message}</p>
    </StudioDialog>}
  </section>;
}
