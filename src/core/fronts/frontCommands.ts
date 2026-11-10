import type { Bay, Design, Front, FrontType, ResolvedModel, Run, SlidingFrontConfig } from '../schema/types';
import { defaultSlidingConfig } from '../solver/slidingSolver';
import { carcassFrontLevels, FRONT_VERTICAL_REVEAL_MM, frontVerticalRange } from './frontGeometry';
const uid=()=>`front-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;

export function configureFrontInDesign(draft:Design,model:ResolvedModel,bayId:string,frontId:string|undefined,type:FrontType,sliding?:SlidingFrontConfig):string {
  const run=draft.runs.find(r=>r.bays.some(b=>b.id===bayId)),bay=run?.bays.find(b=>b.id===bayId);
  if(!run||!bay)throw new Error('Kapak için önce bir gövde bölmesi seçin.');
  let front=frontId?draft.fronts.find(f=>f.id===frontId):undefined;
  if(frontId&&!front)throw new Error('Düzenlenen kapak aralığı artık mevcut değil.');
  if(!front) {
    const resolvedBay = model.bays.find(b => b.id === bayId);
    front = automaticBayFront(run, { ...bay, frontMode: resolvedBay?.frontMode ?? bay.frontMode }, uid());
    draft.fronts.push(front);
  }
  front.type=type;
  if(type==='sliding') {
    front.sliding=sliding??front.sliding??defaultSlidingConfig(run.panelThicknessMm);
    // Mevcut çıkıntılı menteşe kulpu, ilk dönüşümde ray geçişine taşınmaz.
    if(!frontId)front.handleConfig={styleId:'recessedJ',finishId:bay.handleConfig?.finishId??'matteBlack',lengthMm:320,placement:'middle',orientation:'vertical'};
    delete front.hingeSide;delete front.openingAngleDeg;
  } else if(type==='hinged') {
    front.hingeSide??='auto';front.openingAngleDeg??=bay.hingeAngleDeg??110;
    delete front.sliding;delete front.slideOffsetMm;delete front.trackIndex;
  }
  return front.id;
}
export function splitFrontRangeInDesign(draft:Design,frontId:string,splitAtMm?:number):void {
  const front=draft.fronts.find(f=>f.id===frontId);if(!front)throw new Error('Kapak aralığı bulunamadı.');
  const run=draft.runs.find(r=>r.id===front.runId)!;
  const range=frontVerticalRange(run,front);
  const { top }=carcassFrontLevels(run);
  const split=Math.round(splitAtMm??range.start+(range.end-range.start)*.75);
  const seam = 2 * FRONT_VERTICAL_REVEAL_MM;
  if(split-range.start<180||range.end-split-seam<180)throw new Error('Üst/alt kapak için yeterli yükseklik yok.');
  const followsTop = front.yEndAnchor === 'top' || range.end === top - FRONT_VERTICAL_REVEAL_MM;
  const upper:Front={...front,id:uid(),label:`${front.label??'Kapak'} Üst`,type:'hinged',
    yStartMm:followsTop?top-split-seam:split+seam,yStartAnchor:followsTop?'top':undefined,
    yEndMm:followsTop?top-range.end:range.end,yEndAnchor:followsTop?'top':undefined,
    hingeSide:front.hingeSide??'auto',openingAngleDeg:front.openingAngleDeg??110};
  delete upper.sliding;delete upper.slideOffsetMm;delete upper.trackIndex;
  front.yEndMm=followsTop?top-split:split;
  front.yEndAnchor=followsTop?'top':undefined;
  draft.fronts.push(upper);
}

export function automaticBayFront(run: Run, bay: Bay, id: string): Front {
  return {
    id, runId:run.id, bayIds:[bay.id], label:bay.label, type:'hinged',
    yStartMm:0, yStartAnchor:'drawers', yEndMm:FRONT_VERTICAL_REVEAL_MM, yEndAnchor:'top',
    hingeSide:bay.frontMode==='double'?'double':bay.frontMode==='singleRight'?'right':bay.frontMode==='singleLeft'?'left':'auto',
    openingAngleDeg:bay.hingeAngleDeg, materialId:bay.doorMaterialId??bay.frontMaterialId, handleConfig:bay.handleConfig,
  };
}
