import {jsPDF} from 'jspdf';
import {assertProductionReady,type ProductionPackage} from '../core/production/productionModel';
import type {TechnicalSheet} from '../core/production/technicalSheets';

/** Raster ekran görüntüsü yerine aynı SVG paftalarından vektör PDF üretir. Font yerel gömülür. */
export function createProductionPdf(pkg:ProductionPackage,sheets:TechnicalSheet[],fontBase64:string):ArrayBuffer {
  assertProductionReady(pkg);
  const doc=new jsPDF({orientation:'landscape',unit:'mm',format:'a3',compress:true,putOnlyUsedFonts:true,precision:3});
  doc.addFileToVFS('NotoSans-Regular.ttf',fontBase64);doc.addFont('NotoSans-Regular.ttf','NotoSans','normal');doc.setFont('NotoSans');
  doc.setProperties({title:`${pkg.designName} - ${pkg.versionName}`,subject:'Gerçek mm teknik çizim, kesim listesi ve montaj notları',author:'Wardrobe Studio',creator:'Wardrobe Studio / Yerel üretim paketi'});
  doc.setLanguage('tr');doc.setDisplayMode('fullwidth','continuous');
  sheets.forEach((sheet,i)=>{
    if(i)doc.addPage('a3','landscape');
    for(const e of sheet.elements){
      if(e.kind==='text'){
        doc.setFontSize(e.size*72/25.4);doc.setTextColor(e.color);
        doc.text(e.text.replace(/[\u2010-\u2015]/g,'-'),e.at[0],e.at[1],{align:e.align??'left',angle:-(e.rotation??0)});
      } else {
        doc.setDrawColor(e.color);doc.setLineWidth(e.width);doc.setLineDashPattern(e.dash?[1.2,1]:[],0);
        if(e.kind==='line')doc.line(e.a[0],e.a[1],e.b[0],e.b[1]);
        else if(e.points.length>1){doc.setFillColor(e.fill);const start=e.points[0],relative=e.points.slice(1).map((p,k)=>[p[0]-e.points[k][0],p[1]-e.points[k][1]]);doc.lines(relative,start[0],start[1],[1,1],'FD',true);}
      }
    }
    doc.setLineDashPattern([],0);
  });
  return doc.output('arraybuffer');
}
export async function localPdfFont():Promise<string> {
  const response=await fetch(`${import.meta.env.BASE_URL}fonts/NotoSans-Regular.ttf`);if(!response.ok)throw new Error('Yerel PDF yazı tipi okunamadı. Sayfayı yenileyip tekrar deneyin.');
  const data=new Uint8Array(await response.arrayBuffer());let binary='';for(let i=0;i<data.length;i+=8192)binary+=String.fromCharCode(...data.subarray(i,i+8192));return btoa(binary);
}
