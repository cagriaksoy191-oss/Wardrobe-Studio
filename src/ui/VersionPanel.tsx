import {useEffect,useMemo,useState} from 'react';
import {useWardrobeStore} from '../store/useWardrobeStore';
import {useVersionArchive} from '../store/versionArchive';
import {buildExternalAiPrompt,designDimensions,designMetrics,designSignature,previewDesignJson,type DesignMetrics,type ImportPreview} from '../core/versions/designExchange';
import {extractProduction} from '../core/production/productionModel';
import {buildTechnicalSheets,sheetToSvg} from '../core/production/technicalSheets';
import {solveDesign} from '../core/solver/carcassSolver';
import type {Design,ResolvedModel} from '../core/schema/types';
import {downloadFile,safeFileName} from '../export/download';
import { StudioDialog } from './StudioDialog';

const button='rounded border border-slate-600 bg-slate-800 px-2 py-1.5 text-[11px] text-slate-100 hover:border-sky-400 disabled:opacity-40';
const input='w-full rounded border border-slate-700 bg-slate-950 p-2 text-xs text-slate-100';
const metricLabels:Record<keyof DesignMetrics,string>={parts:'Fiziksel parça',panelsAreaM2:'Net üretim levhası (m²)',physicalShelfAreaM2:'Fiziksel raf yüzeyi (m²)',hangingMm:'Kullanılabilir askı boyu (mm)',shelfAreaM2:'Net depolama rafı ve tabanı (m²)',drawerLitres:'Çekmece neti (L)',storageLitres:'Depolama hacmi (L)',doors:'Kapak kanadı',drawers:'Çekmece',errors:'Kritik hata',warnings:'Uyarı / uzman',inventoryShortfall:'Envanter eksik adet'};

function DimensionComparison({ a, b }: { a: ReturnType<typeof designDimensions>; b: ReturnType<typeof designDimensions> }) {
  const rows: [string, string | number | undefined, string | number | undefined][] = [
    ['Yerleşim', a.layout, b.layout], ['Kol derinliği', a.depthRelation, b.depthRelation],
    ['A kolu uzunluğu (mm)', a.lengthA, b.lengthA], ['B kolu uzunluğu (mm)', a.lengthB, b.lengthB],
    ['A gövde derinliği (mm)', a.depthA, b.depthA], ['B gövde derinliği (mm)', a.depthB, b.depthB],
    ['A arka ofset (mm)', a.rearA, b.rearA], ['B arka ofset (mm)', a.rearB, b.rearB],
    ['Gardırop yüksekliği (mm)', a.height, b.height],
    ...(['X', 'Y', 'Z'] as const).map((axis, i): [string, number, number] => ['Kapalı dış ' + axis + ' (mm)', a.outer[i], b.outer[i]]),
  ];
  const format = (v: string | number | undefined) => typeof v === 'number' ? v.toLocaleString('tr-TR', {maximumFractionDigits:1}) : v ?? '—';
  return <table aria-label="Dış ölçü karşılaştırması" className="comparison-table w-full table-fixed text-xs">
    <thead><tr><th className="text-left">Ölçü</th><th>A</th><th>B</th><th>Fark</th></tr></thead>
    <tbody>{rows.map(([label, left, right]) => <tr key={label} className="border-t border-slate-800">
      <td className="py-1">{label}</td><td className="text-right">{format(left)}</td><td className="text-right">{format(right)}</td>
      <td className="text-right">{format(typeof left === 'number' && typeof right === 'number' ? right-left : undefined)}</td>
    </tr>)}</tbody>
  </table>;
}
function MiniDesign({design,resolved}:{design:Design;resolved?:ResolvedModel}) {
  const svg=useMemo(()=>{const model=resolved??solveDesign(design),pkg=extractProduction(design,model),sheet=buildTechnicalSheets(design,model,pkg).find(s=>s.id==='02-GENEL');return sheet?sheetToSvg(sheet):'';},[design,resolved]);
  return <div className="overflow-hidden rounded border border-slate-600 bg-white [&_svg]:h-auto [&_svg]:max-h-[290px] [&_svg]:w-full" dangerouslySetInnerHTML={{__html:svg}}/>;
}
function CompareLeaves({ a, b }: { a: ResolvedModel; b: ResolvedModel }) {
  const leaves = (model: ResolvedModel) => [...model.doors, ...(model.slidingDoors ?? [])];
  const first = leaves(a), second = leaves(b);
  const ids = [...new Set([...first, ...second].map(leaf => leaf.id))];
  const size = (leaf?: typeof first[number]) => leaf ? `${leaf.widthMm} × ${leaf.heightMm} × ${leaf.thicknessMm}` : '—';
  return <table aria-label="Kapak kesim ölçüleri karşılaştırması" className="comparison-table w-full table-fixed text-xs">
    <thead><tr><th className="w-2/5 text-left">Kanat</th><th>A (mm)</th><th>B (mm)</th><th>Fark (mm)</th></tr></thead>
    <tbody>{ids.map(id => {
      const left = first.find(leaf => leaf.id === id), right = second.find(leaf => leaf.id === id);
      const delta = left && right ? [right.widthMm-left.widthMm,right.heightMm-left.heightMm,right.thicknessMm-left.thicknessMm].join(' / ') : '—';
      return <tr key={id} className="border-t border-slate-800"><th scope="row" className="break-words text-left font-normal">{left?.label ?? right?.label}</th>
        <td>{size(left)}</td><td>{size(right)}</td><td>{delta}</td></tr>;
    })}</tbody>
  </table>;
}
export function VersionPanel() {
  const design=useWardrobeStore(s=>s.design),open=useWardrobeStore(s=>s.openNamedVersion),resolved=useWardrobeStore(s=>s.resolved);
  const {versions,save,rename,setArchived,hydrate,error,status,recoveryDocuments}=useVersionArchive();
  const [name,setName]=useState(''),[chosen,setChosen]=useState(''),[archived,setShowArchived]=useState(false),[compare,setCompare]=useState(''),[message,setMessage]=useState('');
  const [showCompare,setShowCompare]=useState(false);
  const [request,setRequest]=useState(''),[prompt,setPrompt]=useState(''),[raw,setRaw]=useState(''),[preview,setPreview]=useState<ImportPreview|null>(null),[importName,setImportName]=useState('AI önerisi'),[savedImport,setSavedImport]=useState<string|null>(null);
  useEffect(()=>{void hydrate();},[hydrate]);
  const activeVersion=versions.find(v=>designSignature(v.design)===designSignature(design)),selected=versions.find(v=>v.id===chosen),other=versions.find(v=>v.id===compare);
  const otherResolved=useMemo(()=>showCompare&&other?solveDesign(other.design):null,[other,showCompare]);
  const metrics=useMemo(()=>designMetrics(design,resolved),[design,resolved]);
  const otherMetrics=useMemo(()=>other&&otherResolved?designMetrics(other.design,otherResolved):null,[other,otherResolved]);
  const dimensions=useMemo(()=>designDimensions(design,resolved),[design,resolved]);
  const otherDimensions=useMemo(()=>other&&otherResolved?designDimensions(other.design,otherResolved):null,[other,otherResolved]);
  const copy=async(text:string)=>{try{await navigator.clipboard.writeText(text);setMessage('Panoya kopyalandı.');}catch{setMessage('Panoya erişilemedi. Aşağıdaki metni seçip Ctrl+C ile kopyalayın.');}};
  const visible=versions.filter(v=>archived||!v.archived);
  return <section aria-label="Sürümler ve dış AI" className="space-y-3 text-xs">
    <h2 className="text-sm font-semibold text-sky-200">Sürümler ve karşılaştırma</h2>
    <p className="text-[11px] text-slate-400">{activeVersion?`Açık sürüm: ${activeVersion.name}`:'Çalışma kopyası · henüz adlandırılmış sürümle aynı değil'}. Sürüm arşivi, Ctrl+S kontrol noktası ve otomatik kayıttan ayrıdır.</p>
    <input aria-label="Yeni sürüm adı" className={input} value={name} placeholder="Örn. A — üç raylı çözüm" maxLength={100} onChange={e=>setName(e.target.value)}/>
    <button className={`${button} w-full`} onClick={()=>{const id=save(name,design);if(id){setChosen(id);setMessage('Yeni sürüm çalışma arşivine eklendi.');}}}>Aktif tasarımı yeni sürüm kaydet</button>
    <label className="flex gap-2 text-[10px] text-slate-400"><input type="checkbox" checked={archived} onChange={e=>setShowArchived(e.target.checked)}/>Arşivlenenleri de göster</label>
    <select aria-label="Kayıtlı sürümler" className={input} value={chosen} onChange={e=>{setChosen(e.target.value);const v=versions.find(v=>v.id===e.target.value);if(v)setName(v.name);}}><option value="">Sürüm seçin ({visible.length})</option>{visible.map(v=><option key={v.id} value={v.id}>{v.archived?'[Arşiv] ':''}{v.name} · {new Date(v.createdAt).toLocaleDateString('tr-TR')}</option>)}</select>
    {selected&&<div className="space-y-2 rounded border border-slate-700 p-2"><p className="text-[10px] text-slate-400">{selected.name} · {new Date(selected.createdAt).toLocaleString('tr-TR')} · {selected.source==='json'?'JSON önerisi':'Elle kayıt'}</p><div className="grid grid-cols-2 gap-2"><button className={button} onClick={()=>{setMessage(open(selected.design,selected.name) ? 'Sürüm açıldı. Önceki çalışma kopyası Geri Al ile geri gelir.' : useWardrobeStore.getState().commandError ?? 'Sürüm açılamadı.');}}>Bu sürümü aç (Geri Al var)</button><button className={button} onClick={()=>{rename(selected.id,name);setMessage('Sürüm adı güncellendi.');}}>Ad alanıyla yeniden adlandır</button><button className={button} onClick={()=>setArchived(selected.id,!selected.archived)}>{selected.archived?'Arşivden çıkar':'Arşivle'}</button><button className={button} onClick={()=>downloadFile(`${safeFileName(selected.name)}.json`,JSON.stringify(selected.design,null,2),'application/json;charset=utf-8')}>Sürüm JSON indir</button></div></div>}
    <button type="button" className={`${button} w-full border-sky-700`} onClick={()=>setShowCompare(true)}>A/B karşılaştırmasını aç</button>
    {showCompare&&<StudioDialog label="A/B tasarım karşılaştırması" onClose={()=>setShowCompare(false)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 p-3">
        <div><h2 className="text-lg font-semibold text-sky-100">A/B tasarım karşılaştırması</h2><p className="text-xs text-slate-300">A · çalışma kopyası. B · kayıtlı sürüm. Fark = B − A.</p></div>
        <button autoFocus className={button} onClick={()=>setShowCompare(false)}>Kapat (Esc)</button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-3 sm:p-5">
        <label className="block max-w-md space-y-1 text-sm"><span>B sürümü</span><select aria-label="Karşılaştırma B sürümü" className={input} value={compare} onChange={e=>setCompare(e.target.value)}><option value="">B sürümünü seçin</option>{versions.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</select></label>
        {other&&otherResolved&&otherMetrics&&otherDimensions&&<>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <figure><figcaption className="mb-1 font-semibold text-sky-200">A · {design.name}</figcaption><MiniDesign design={design} resolved={resolved}/></figure>
            <figure><figcaption className="mb-1 font-semibold text-amber-200">B · {other.name}</figcaption><MiniDesign design={other.design} resolved={otherResolved}/></figure>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <section><h3 className="mb-2 font-semibold text-sky-200">Dış ölçüler</h3><DimensionComparison a={dimensions} b={otherDimensions}/></section>
            <section><h3 className="mb-2 font-semibold text-sky-200">Kapasite, parça ve doğrulama</h3>
              <table className="comparison-table w-full table-fixed text-xs"><thead><tr><th className="w-2/5 text-left">Ölçüt</th><th>A</th><th>B</th><th>Fark</th></tr></thead><tbody>{(Object.keys(metricLabels)as(keyof DesignMetrics)[]).map(k=><tr key={k} className="border-t border-slate-800"><td>{metricLabels[k]}</td>{[metrics[k],otherMetrics[k],otherMetrics[k]-metrics[k]].map((n,i)=><td key={i}>{n.toLocaleString('tr-TR',{maximumFractionDigits:2})}</td>)}</tr>)}</tbody></table>
            </section>
          </div>
          <section className="mt-4"><h3 className="mb-2 font-semibold text-sky-200">Kapak kesimleri · en × boy × kalınlık</h3><CompareLeaves a={resolved} b={otherResolved}/></section>
        </>}
      </div>
    </StudioDialog>}
    <details className="rounded border border-sky-800 p-2"><summary className="cursor-pointer font-semibold text-sky-200">Dış AI · tam JSON gidiş / dönüş</summary><div className="mt-3 space-y-2">
      <p className="text-[10px] leading-relaxed text-slate-400">Bu araç dış servise bağlanmaz. Hazırlanan metni seçtiğiniz AI aracına kendiniz götürün; dönen tam Design JSON'u önizleyin. Geçerli öneri önce ayrı bir sürüm olur.</p>
      <textarea aria-label="AI tasarım isteği" className={input} rows={3} placeholder="Bu tasarımda ne değişsin?" value={request} onChange={e=>setRequest(e.target.value)}/>
      <button className={`${button} w-full`} onClick={()=>{const value=buildExternalAiPrompt(design,request);setPrompt(value);void copy(value);}}>Tam JSON ve talimatları hazırla / kopyala</button>
      {prompt&&<textarea aria-label="AI için kopyalanacak tam metin" readOnly className={`${input} font-mono text-[10px]`} rows={5} value={prompt} onFocus={e=>e.target.select()}/>}
      <label className="block space-y-1"><span className="text-slate-400">Dönen tam JSON</span><textarea aria-label="AI JSON yanıtı" className={`${input} font-mono text-[10px]`} rows={7} value={raw} onChange={e=>{setRaw(e.target.value);setPreview(null);setSavedImport(null);}}/></label>
      <label className="block text-[10px] text-slate-400">veya JSON dosyası seçin<input aria-label="AI JSON dosyası" type="file" accept=".json,application/json" className="mt-1 block w-full" onChange={e=>{const file=e.target.files?.[0];if(!file)return;if(file.size>2000000){setPreview({errors:['JSON en fazla 2 MB olabilir.'],warnings:[]});return;}void file.text().then(t=>{setRaw(t);setPreview(previewDesignJson(t));setSavedImport(null);});e.target.value='';}}/></label>
      <button className={`${button} w-full`} onClick={()=>{setPreview(previewDesignJson(raw));setSavedImport(null);}}>JSON doğrula ve önizle</button>
      {preview&&<div role="status" className="space-y-2 rounded border border-slate-700 p-2">{preview.errors.length?<><p className="font-semibold text-red-300">Kaydedilemez · {preview.errors.length} hata</p><ul className="max-h-40 space-y-1 overflow-y-auto text-[10px] text-red-200">{preview.errors.map((e,i)=><li key={i}>{e}</li>)}</ul></>:preview.design&&<><p className="font-semibold text-emerald-200">Geçerli öneri: {preview.design.name}</p><p className="text-[10px] text-slate-400">{preview.resolved?.bays.length} bölme · {preview.resolved?.doors.length??0} menteşeli / {preview.resolved?.slidingDoors?.length??0} sürgülü kanat · {preview.warnings.length} uyarı/uzman notu</p><MiniDesign design={preview.design}/><input aria-label="Öneri sürüm adı" className={input} value={importName} onChange={e=>setImportName(e.target.value)}/><button className={`${button} w-full`} disabled={!!savedImport} onClick={()=>{const id=save(importName,preview.design!,'json');if(id){setSavedImport(id);setChosen(id);setMessage('Öneri ayrı sürüm olarak arşive eklendi.');}}}>Öneriyi yeni sürüm kaydet</button>{savedImport&&<button className={`${button} w-full border-amber-500`} onClick={()=>{const version=versions.find(v=>v.id===savedImport);if(version){setMessage(open(version.design,version.name) ? 'Öneri aktif çalışma olarak açıldı. Geri Al ile önceki tasarıma dönebilirsiniz.' : useWardrobeStore.getState().commandError ?? 'Öneri açılamadı.');}}}>Kaydedilen öneriyi aktif tasarım olarak aç</button>}</>}{preview.warnings.length>0&&<details><summary className="text-[10px] text-amber-200">Uyarıları incele ({preview.warnings.length})</summary><ul className="max-h-40 space-y-1 overflow-y-auto text-[10px] text-slate-400">{preview.warnings.map((w,i)=><li key={i}>{w}</li>)}</ul></details>}</div>}
    </div></details>
    {(error||message)&&<p role="status" className={`rounded border p-2 text-[11px] ${error?'border-red-800 text-red-200':'border-sky-900 text-sky-200'}`}>{error??message}</p>}
    {recoveryDocuments.length>0&&<button type="button" className={button}
      onClick={()=>downloadFile('wardrobe-surum-kurtarma.json',JSON.stringify(recoveryDocuments,null,2),'application/json')}>
      Doğrulanamayan sürüm kayıtlarını indir ({recoveryDocuments.length})
    </button>}
    <p className="text-[10px] text-slate-500">Arşiv · {status==='saved'?'iki depoya kaydedildi':status==='partial'?'tek depoya kaydedildi':status==='saving'?'kaydediliyor':status==='restored'?'geri yüklendi':status==='error'?'kayıt hatası':'hazır'}</p>
  </section>;
}
