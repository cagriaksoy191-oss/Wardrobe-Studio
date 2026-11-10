import {assertProductionReady,polygonCutGroups,type ProductionPackage} from './productionModel';
/** UTF-8 BOM + noktalı virgül; metin hücrelerinde formül çalıştırılmasını önler. */
export function csvCell(value:unknown){let s=String(value??'');if(/^[\s]*[=+@-]/.test(s))s="'"+s;return `"${s.replaceAll('"','""')}"`;}
export function buildCutListCsv(pkg:ProductionPackage, compactPolygons=false) {
  assertProductionReady(pkg);
  const refs = new Map(polygonCutGroups(pkg, compactPolygons).flatMap(group => group.parts.map(part => [part.code, group.id] as const)));
  const rows:unknown[][]=[['Tasarım','Sürüm','Parça kodu','Kaynak kimliği','Ad','Görev','Kol','Modül','Hücre','Adet','Şekil','Genişlik mm','Yükseklik mm','Kalınlık mm','Malzeme','Malzeme kodu','Damar yönü','Kenar bantı','Ham kesim durumu','Poligon çizim referansı','Yerel V koordinatları mm','Kenarlar / boy / iç açı','Notlar','Üretim durumu','Düzlemde dış dönüş'],...pkg.parts.map(p=>[pkg.designName,pkg.versionName,p.code,p.sourceId,p.label,p.role,p.runId,p.moduleIds.join(' | '),p.cellId??'',p.quantity,p.shape,p.widthMm,p.heightMm,p.thicknessMm,p.material,p.materialId,p.grain==='vertical'?'H yönü':'W yönü',p.banding,p.rawCut,refs.get(p.code)??'',p.verticesMm?.map((v,i)=>`V${i+1}=(${v.xMm},${v.zMm})`).join(' | ')??'',p.edges.map(e=>`${e.id}: ${e.lengthMm.toFixed(1)} mm; V${e.from} ${e.interiorAngleDeg.toFixed(1)}°`).join(' | '),p.notes.join(' '),pkg.statusLabel,p.verticesMm?p.edges.map(e=>`V${e.from} ${e.turnAngleDeg.toFixed(1)}°`).join(' | '):''])];
  return '\uFEFF'+rows.map(r=>r.map(csvCell).join(';')).join('\r\n')+'\r\n';
}
