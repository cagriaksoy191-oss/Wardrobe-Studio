import {createBlankDesign} from './sampleDesigns';
import type {Design,SplitNode} from '../schema/types';
import {defaultSlidingConfig} from '../solver/slidingSolver';

/** Yeniden üretilebilir üretim/QA örnekleri; aktif kullanıcı projesine kendiliğinden yüklenmez. */
export function phase5Example(kind:'straight'|'diagonal'|'blind'|'asymmetric'):Design {
  const straight=kind==='straight',thick=kind==='asymmetric',d=createBlankDesign({name:straight?'Düz Gardırop — Üç Ray ve Çekmece':kind==='blind'?'Kör Köşe — Karma Cephe':thick?'Asimetrik Beşgen — 25 ve 4 mm':'Beşgen L — 18 ve 8 mm',layoutKind:straight?'straight':'l-shape',cornerType:kind==='blind'?'blind':'diagonal',lengthAMm:3000,lengthBMm:2600,depthAMm:600,depthBMm:thick?480:600});
  d.id=`phase5-${kind}`;
  for(const r of d.runs){r.panelThicknessMm=thick?25:18;r.backPanelThicknessMm=thick?4:8;r.bays.forEach((b,i)=>{b.label=`${r.wallAxis}${i+1} ${i===0?'Çekmece + Askı':'Ayarlanabilir Raf'}`;b.owner=i===0?'anne':'baba';});}
  const t=d.runs[0].panelThicknessMm;
  const drawerRoot=(axis:string):SplitNode=>({kind:'split',id:`${axis}-root`,direction:'horizontal',children:[{id:`${axis}-bottom-child`,size:{kind:'fixed',mm:690},node:{kind:'leaf',id:`${axis}-drawers`,label:'Üçlü Takı Çekmecesi',owner:'anne',insert:{type:'drawerBank',drawerCount:3,isInternalDrawer:true,storageTemplate:'jewelryDrawer'}}},{id:`${axis}-top-child`,size:{kind:'flex',weight:1},node:{kind:'leaf',id:`${axis}-hanging`,label:'Gömlek Askısı',owner:'anne',insert:{type:'hangingRod'}}}]});
  d.runs[0].bays[0].root=drawerRoot('A');d.runs[0].bays[1].root={kind:'leaf',id:'A-shelves',label:'Beş Raf',owner:'baba',insert:{type:'shelfStack',shelfCount:5,adjustable:true}};
  if(straight){d.fronts=[{id:'front-A-sliding',label:'Üç Raylı Ana Cephe',runId:'run-A',bayIds:d.runs[0].bays.map(b=>b.id),type:'sliding',yStartMm:82,yEndMm:2358,sliding:defaultSlidingConfig(t,3)}];}
  else {
    d.fronts=[{id:'front-A-lower',label:'Alt Sürgülü Cephe',runId:'run-A',bayIds:d.runs[0].bays.map(b=>b.id),type:'sliding',yStartMm:82,yEndMm:1800,sliding:{...defaultSlidingConfig(t,2),startClearanceMm:40}},
      {id:'front-A-upper',label:'Üst Menteşeli Yüklük',runId:'run-A',bayIds:[d.runs[0].bays[1].id],type:'hinged',hingeSide:'double',openingAngleDeg:155,yStartMm:1803,yEndMm:2358}];
    d.runs[1].bays[0].frontMode='double';d.runs[1].bays[0].root={kind:'leaf',id:'B-shelves',label:'B Kolu Rafları',owner:'ortak',insert:{type:'shelfStack',shelfCount:4}};
    d.junctions[0].doorMode='left';d.junctions[0].shelvesCount=3;
    if(kind==='blind'){d.junctions[0].fillerWidthMm=70;d.runs[0].bays[0].width={kind:'fixed',mm:1250};d.runs[0].bays[0].root={kind:'leaf',id:'A-blind-storage',label:'Kör köşe valiz / yüklük',owner:'ortak',insert:{type:'beddingYukluk',storageTemplate:'blindLuggage'}};d.runs[0].bays[0].label='A1 Kör Köşe Valiz';d.runs[0].bays[1].root=drawerRoot('A');d.runs[0].bays[1].label='A2 Çekmece + Askı';d.runs[0].bays[1].owner='anne';}
  }
  d.ledLighting={enabled:true,shelfUnder:true,verticalSides:true,hangingRod:true,openBays:true,cornerModule:true,onlyWhenOpenOrGlass:true,colorTempId:'warm3000K',intensity:.8};
  return d;
}
