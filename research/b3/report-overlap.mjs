import {readFile,writeFile} from 'node:fs/promises';
const a=JSON.parse(await readFile('artifacts/portable-cad/overlap-audit.json','utf8'));
const file='ORIGINAL_25_4_PANEL_OVERLAP_AUDIT.md',old=await readFile(file,'utf8'),marker='<!-- PAIR_TABLE -->';
const vec=v=>v.map(n=>Number(n.toFixed(6))).join(' / ');
const rows=a.pairs.map((p,i)=>{
 const body=p.panels.map(q=>`| \`${q.id}\` |${q.role}|${vec(q.centerMm)}|${vec(q.sizeMm)}|${vec(q.cutMm)}|`).join('\n');
 const d=p.axisAlignedOverlapMm;
 return `### Çift ${i+1}\n\n| Gerçek parça kimliği | Tip | Dünya merkezi X/Y/Z mm | Kutu X/Y/Z mm | Kesim en/boy/kalınlık mm |\n| --- | --- | --- | --- | --- |\n${body}\n\nKesişim X/Y/Z: **${d.x} / ${d.y} / ${d.z} mm**; plan alanı${p.intersectionAreaMm2} mm², hacim **${p.intersectionVolumeMm3} mm³**. Kesişim plan poligonu: ${p.intersectionPolygon.map(q=>`(${q.xMm},${q.zMm})`).join('; ')}.\n\nSınıf: koordinat yuvarlamasıyla nominal katı penetrasyonu; kasıtlı geçme kanıtı yok. Kaynak: ${p.source}. Kesim ebatları/poligonları karşı olgusal merkez düzeltmesinde aynı; fiziksel imalat kusuru kanıtlanmadı, üretim toleransı UNKNOWN.\n`;
});
await writeFile(file,old.split(marker)[0]+marker+'\n\n'+rows.join('\n'));
console.log(`Recorded ${a.pairCount} pair diagnostics in tracked Markdown`);
