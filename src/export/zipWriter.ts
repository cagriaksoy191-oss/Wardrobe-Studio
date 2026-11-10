import {zipSync,strToU8} from 'fflate';
import type {Design} from '../core/schema/types';
import {assertProductionReady,type ProductionPackage} from '../core/production/productionModel';
import {PRINT_SCALE_GUIDANCE,sheetToSvg,type TechnicalSheet} from '../core/production/technicalSheets';
import {buildCutListCsv} from '../core/production/csvExport';
import {safeFileName} from './download';
export function createTechnicalZip(design:Design,pkg:ProductionPackage,sheets:TechnicalSheet[],compactPolygons=false) {
  assertProductionReady(pkg);
  const entries:Record<string,Uint8Array>={'kesim-listesi.csv':strToU8(buildCutListCsv(pkg,compactPolygons)),'design.json':strToU8(JSON.stringify(design,null,2)),'uretim-modeli.json':strToU8(JSON.stringify(pkg,null,2)),'OKU.txt':strToU8(`${pkg.statusLabel}\n${pkg.notes.join('\n\n')}\n\nSVG paftaları A3 yatay. ${PRINT_SCALE_GUIDANCE} Teknik ölçüler mm. PDF uygulamadaki PDF indir düğmesinden alınır.`)};
  for(const sheet of sheets)entries[`svg/${safeFileName(sheet.id)}.svg`]=strToU8(sheetToSvg(sheet));
  return zipSync(entries,{level:6});
}
