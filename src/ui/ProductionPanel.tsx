import {useEffect,useMemo,useRef,useState} from 'react';
import {useWardrobeStore} from '../store/useWardrobeStore';
import {useVersionArchive} from '../store/versionArchive';
import {designSignature} from '../core/versions/designExchange';
import {assertProductionReady,extractProduction} from '../core/production/productionModel';
import {buildPrintableReport,buildTechnicalSheets,sheetToSvg} from '../core/production/technicalSheets';
import {buildCutListCsv} from '../core/production/csvExport';
import {downloadFile,safeFileName} from '../export/download';
import { NumberField } from './Phase4Panels';
import { StudioDialog } from './StudioDialog';
import { accessMeasurement, accessWarnings } from '../core/analysis/functionalAccess';

const button='rounded border border-slate-600 bg-slate-800 px-3 py-2 text-xs text-slate-100 hover:border-sky-400 disabled:cursor-not-allowed disabled:opacity-40';
export function ProductionPanel({ onReviewAccess }: { onReviewAccess: () => void }) {
  const design=useWardrobeStore(s=>s.design),model=useWardrobeStore(s=>s.resolved),versions=useVersionArchive(s=>s.versions);
  const version=versions.find(v=>designSignature(v.design)===designSignature(design));
  const pkg=useMemo(()=>extractProduction(design,model,version?.name??'Çalışma kopyası'),[design,model,version?.name]);
  const sheets=useMemo(()=>buildTechnicalSheets(design,model,pkg,true),[design,model,pkg]);
  const [chosen,setChosen]=useState('00-KAPAK'),[show,setShow]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[renderPrompt,setRenderPrompt]=useState('');
  const [search,setSearch]=useState(''),[scale,setScale]=useState<'page'|'width'|number>('page');
  const sheetViewport=useRef<HTMLDivElement>(null);
  const [capture,setCapture]=useState<{kind:string;data:string;width:number;height:number}|null>(null);
  useEffect(()=>{const ready=(e:Event)=>setCapture((e as CustomEvent).detail);window.addEventListener('wardrobe:capture-ready',ready);return()=>window.removeEventListener('wardrobe:capture-ready',ready);},[]);
  const sheet=sheets.find(s=>s.id===chosen)??sheets[0],svg=useMemo(()=>sheetToSvg(sheet),[sheet]),stem=safeFileName(`${design.name}-${pkg.versionName}`),blocked=pkg.status==='blocked';
  const diagnostic = pkg.accessStatus === 'blocked';
  const geometryErrors = pkg.issues.filter(issue => issue.severity === 'error').length;
  const accessErrors = pkg.functionalAccess.filter(entry => entry.status === 'blocked').length;
  const accessUnknown = pkg.functionalAccess.filter(entry => entry.status === 'unverified').length;
  const accessIssue = accessWarnings(pkg.functionalAccess)[0];
  const tone = blocked || diagnostic ? 'text-rose-200' : 'text-amber-200';
  const pageIndex = sheets.indexOf(sheet);
  const goTo = (index: number) => setChosen(sheets[Math.max(0, Math.min(sheets.length - 1, index))].id);
  const query = search.trim().toLocaleLowerCase('tr-TR');
  const matches = query ? sheets.filter(s =>
    [s.id, s.title, ...s.partCodes].some(text => text.toLocaleLowerCase('tr-TR').includes(query))) : sheets;
  useEffect(() => { sheetViewport.current?.scrollTo(0, 0); }, [chosen]);
  const task=async(work:()=>Promise<void>)=>{setBusy(true);setMessage('');try{await work();}catch(e){setMessage(e instanceof Error?e.message:'Çıktı oluşturulamadı.');}finally{setBusy(false);}};
  const pdf=()=>task(async()=>{assertProductionReady(pkg);const {createProductionPdf,localPdfFont}=await import('../export/pdfWriter');const data=createProductionPdf(pkg,sheets,await localPdfFont());downloadFile(`${stem}-${diagnostic?'tani':'uretim'}.pdf`,data,'application/pdf');setMessage(`${sheets.length} sayfalık ${diagnostic?'tanısal':'teknik'} PDF için indirme başlatıldı.`);});
  const printable=()=>task(async()=>{assertProductionReady(pkg);const {localPdfFont}=await import('../export/pdfWriter');const font=await localPdfFont(),html=buildPrintableReport(pkg,sheets).replace("url('./fonts/NotoSans-Regular.ttf')",`url('data:font/ttf;base64,${font}')`);downloadFile(`${stem}-yazdir.html`,html,'text/html;charset=utf-8');setMessage('Yazdırılabilir rapor için indirme başlatıldı. Dosyayı açıp Yazdır / PDF düğmesini kullanın.');});
  const zip=()=>task(async()=>{const {createTechnicalZip}=await import('../export/zipWriter');downloadFile(`${stem}-teknik-paket.zip`,createTechnicalZip(design,pkg,sheets,true),'application/zip');setMessage(`${sheets.length} SVG paftası, tam CSV ve kaynak JSON içeren teknik paket için indirme başlatıldı.`);});
  const downloadSvg=()=>task(async()=>{
    downloadFile(`${safeFileName(sheet.id)}.svg`,svg,'image/svg+xml;charset=utf-8');
    setMessage(`${sheet.id} SVG paftası için indirme başlatıldı.`);
  });
  const controls=<div className="flex flex-wrap gap-2">
    <button className={button} disabled={busy||blocked} onClick={()=>void pdf()}>{diagnostic?'Tanısal PDF indir':'PDF indir'} ({sheets.length} sayfa)</button>
    <button className={button} disabled={busy||blocked||diagnostic} onClick={()=>{try{downloadFile(`${stem}-kesim.csv`,buildCutListCsv(pkg,true),'text/csv;charset=utf-8');setMessage(`${pkg.parts.length} fiziksel parçanın tam CSV listesi için indirme başlatıldı.`);}catch(e){setMessage(String(e));}}}>Tam CSV indir</button>
    <button className={button} disabled={busy||blocked||diagnostic} onClick={()=>void zip()}>Tüm SVG + CSV + JSON (ZIP)</button>
    <button className={button} disabled={busy||blocked} onClick={()=>void printable()}>Yazdırılabilir rapor</button>
    <button className={button} disabled={busy||blocked} onClick={()=>void downloadSvg()}>Bu paftayı SVG indir</button>
  </div>;
  return <section aria-label="Üretim paketi" className="space-y-3 text-xs">
    <h2 className="text-sm font-semibold text-sky-200">Üretim ön kontrolü</h2>
    <div className={`space-y-2 rounded border p-3 ${blocked||diagnostic?'border-red-700 bg-red-950/30':'border-amber-700 bg-amber-950/20'}`}>
      <p className={`font-semibold ${tone}`}>{pkg.statusLabel}</p>
      <p className="text-[11px] text-slate-200">Geometri {geometryErrors} kritik hata · Erişim {accessErrors} engel / {accessUnknown} açık kontrol</p>
      {accessIssue && <p className={`text-xs ${tone}`}>{accessIssue.label} · {accessMeasurement(accessIssue)}</p>}
      <p className="text-[11px] text-slate-300">{pkg.parts.length} fiziksel parça · {pkg.parts.filter(p=>p.shape==='polygon').length} özel poligon · {sheets.length} A3 pafta.</p>
      {blocked && <p className="text-xs text-red-200">Kritik geometri hatası düzeltilene kadar yalnızca önizleme açık.</p>}
      {!blocked && diagnostic && <p className="text-xs text-red-200">Tanısal paftaları inceleyin. Kesim listesi ve ZIP, erişim engeli giderilince açılır.</p>}
      {pkg.functionalAccess.length > 0 && <button className={button} onClick={onReviewAccess}>Erişim ölçümlerini incele</button>}
    </div>
    <p className="text-[11px] leading-relaxed text-slate-400">Ölçüler modellenen nominal bitmiş geometridir. Bant/kanal payı ve katalog donanımı usta kontrolü gerektirir. Cam/ayna satırları montaj zarfıdır; ham cam kesimi olarak kullanılmaz.</p>
    <button className={`${button} w-full border-sky-700`} onClick={()=>setShow(true)}>Paftaları ve kesim listesini geniş önizle</button>
    {controls}
    {busy&&<p role="status" className="text-sky-200">Paket hazırlanıyor…</p>}{message&&<p role="status" className="rounded border border-sky-900 p-2 text-sky-200">{message}</p>}
    {capture&&<figure className="space-y-1 rounded border border-slate-700 p-2"><img alt={`Son ${capture.kind} PNG önizlemesi`} src={capture.data} className="w-full rounded bg-white"/><figcaption className="text-[10px] text-slate-400">Son PNG: {capture.width} × {capture.height} piksel · {capture.kind}. İndirme başlatıldı. Yardımcı haritalarda seçim hacimleri ve stüdyo kılavuzları gizlenir.</figcaption></figure>}
    <details className="rounded border border-slate-700 p-2"><summary className="cursor-pointer text-slate-300">Malzeme kalınlık özeti</summary><table className="mt-2 w-full text-[10px]"><thead><tr><th className="text-left">Malzeme</th><th>mm</th><th>Parça</th><th>m²</th></tr></thead><tbody>{pkg.materialSummary.map(m=><tr key={`${m.materialId}-${m.thicknessMm}`} className="border-t border-slate-800"><td className="py-1">{m.material}</td><td className="text-right">{m.thicknessMm}</td><td className="text-right">{m.quantity}</td><td className="text-right">{(m.areaMm2/1e6).toFixed(3)}</td></tr>)}</tbody></table></details>
    <details className="space-y-2 rounded border border-slate-700 p-2"><summary className="cursor-pointer text-sky-200">PNG ve dış görselleştirme yardımcısı</summary><p className="mt-2 text-[10px] text-slate-400">Mevcut kameradan 2× çözünürlükte çıktı. Şema/ölçü katmanları PNG'ye dahil değildir. Yerel eşya, ışık ve kapak pozları görüntüye yansır.</p><div className="flex flex-wrap gap-1">{(['color','depth','edges']as const).map(kind=><button key={kind} className={button} onClick={()=>window.dispatchEvent(new CustomEvent('wardrobe:capture',{detail:{kind,name:stem}}))}>{kind==='color'?'Görünüm PNG':kind==='depth'?'Derinlik PNG':'Tel/kenar PNG'}</button>)}</div><button className={`${button} mt-2`} onClick={()=>{const value=`Ekli Wardrobe Studio görüntüsünü, derinlik ve tel/kenar yardımcılarını aynı kamera ve geometriyi kesin olarak koruyarak fotogerçekçi görselleştir. ${design.name}. Kollar: ${pkg.runDimensions.map(r=>`${r.axis}: ${r.lengthMm} × ${r.heightMm} × ${r.totalDepthMm} mm`).join('; ')}. Bölme, raf, kapak ve çekmece sayısını/değerlerini değiştirme. Malzemeler: ${[...new Set(pkg.parts.map(p=>p.material))].join(', ')}. Mevcut kulp, LED ve gömme bitiş kararlarını koru. Yeni mobilya veya ölçü ekleme. Teknik doğruluk kaynağı JSON ve üretim paketidir; bu görsel üretim onayı değildir.`;setRenderPrompt(value);void navigator.clipboard?.writeText(value).catch(()=>{});}}>Görselleştirme promptu hazırla</button>{renderPrompt&&<textarea aria-label="Görselleştirme promptu" className="mt-2 w-full rounded border border-slate-700 bg-slate-950 p-2 text-[10px] text-slate-200" rows={5} readOnly value={renderPrompt} onFocus={e=>e.target.select()}/>}</details>
    {show&&<StudioDialog label="Teknik pafta önizlemesi" onClose={()=>setShow(false)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 p-3">
        <div><h2 className="text-sm font-semibold">{design.name}</h2><p className={`text-xs ${tone}`}>{pkg.statusLabel} · {geometryErrors} kritik geometri hatası · {accessErrors} erişim engeli</p></div>
        <button autoFocus aria-label="Pafta önizlemesini kapat" className={button} onClick={()=>setShow(false)}>Kapat (Esc)</button>
      </div>
      <div className="border-b border-slate-700 p-2">{controls}</div>
      <div className="flex flex-wrap items-end gap-2 border-b border-slate-700 p-2 text-xs">
        <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Pafta boyutu">
          <button className={button} aria-pressed={scale==='page'} onClick={()=>setScale('page')}>Sayfaya sığdır</button>
          <button className={button} aria-pressed={scale==='width'} onClick={()=>setScale('width')}>Genişliğe sığdır</button>
          <button className={button} aria-label="Paftayı uzaklaştır" onClick={()=>setScale(Math.max(30,(typeof scale==='number'?scale:100)-20))}>−</button>
          <button className={button} aria-label="Paftayı yakınlaştır" onClick={()=>setScale(Math.min(240,(typeof scale==='number'?scale:100)+20))}>+</button>
          {typeof scale==='number'&&<span className="px-1 tabular-nums">{scale}%</span>}
        </div>
        <div className="flex items-end gap-1" role="group" aria-label="Sayfaya git">
          <button className={button} disabled={pageIndex===0} onClick={()=>goTo(pageIndex-1)}>Önceki</button>
          <div className="w-19"><NumberField label="Sayfa" value={pageIndex+1} min={1} max={sheets.length} onCommit={n=>goTo(n-1)}/></div>
          <button className={button} disabled={pageIndex===sheets.length-1} onClick={()=>goTo(pageIndex+1)}>Sonraki</button>
        </div>
        <label className="min-w-32 flex-1 space-y-1">Pafta / parça kodu ara
          <input type="search" className="block w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Üst plan veya P-…" />
        </label>
        <label className="min-w-36 flex-1 space-y-1">Teknik paftalar
          <select className="block w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5" value={matches.includes(sheet)?sheet.id:''} onChange={e=>setChosen(e.target.value)}>
            {!matches.includes(sheet)&&<option value="">{matches.length?'Pafta seçin':'Sonuç yok'}</option>}
            {matches.map(s=><option key={s.id} value={s.id}>{sheets.indexOf(s)+1}. {s.title}</option>)}
          </select>
        </label>
      </div>
      <div ref={sheetViewport} className="studio-sheet-viewport min-h-0 flex-1 overflow-auto bg-slate-800 p-3">
        <div className={`mx-auto bg-white shadow-lg [&_svg]:h-auto [&_svg]:w-full ${scale==='page'?'studio-sheet-fit':''}`}
          style={typeof scale==='number'?{width:`${scale}%`}:scale==='width'?{width:'100%'}:undefined} dangerouslySetInnerHTML={{__html:svg}}/>
      </div>
      <p role="status" className="border-t border-slate-700 p-2 text-[11px] text-slate-300">{pageIndex+1} / {sheets.length} · {sheet.id} {sheet.scale&&` · Pafta ölçeği 1:${sheet.scale}`}. {busy?'Dosya hazırlanıyor…':message}</p>
    </StudioDialog>}
  </section>;
}
