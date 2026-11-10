import type { Design, Front, HandleConfig, ResolvedModel, ResolvedSlidingLeaf, Run, SlidingFrontConfig } from '../schema/types';
import { distributeIntegerMm } from './flexSolver';
import { runFrontMm } from '../schema/designConstraints';
import { frontVerticalRange } from '../fronts/frontGeometry';

export function defaultSlidingConfig(thicknessMm: number, trackCount: 2 | 3 = 2): SlidingFrontConfig {
  const spacing = thicknessMm + 12;
  return {trackCount,leafCount:trackCount,overlapMm:30,trackSpacingMm:spacing,
    trackDepthMm:Math.max(trackCount===2?90:100,18+thicknessMm+(trackCount-1)*spacing),verticalGapMm:10};
}

export function frontSpanFromResolved(design:Design, model:ResolvedModel, front:Pick<Front,'runId'|'bayIds'>&Partial<Pick<Front,'sliding'|'type'>>) {
  const run=design.runs.find(r=>r.id===front.runId);
  if(!run) throw new Error('Kapak kolu bulunamadı.');
  const bays=model.bays.filter(b=>front.bayIds.includes(b.id)).sort((a,b)=>a.index-b.index);
  if(!bays.length) throw new Error('Kapak bölmesi bulunamadı.');
  const first=bays[0],last=bays[bays.length-1],t=run.panelThicknessMm;
  const shared=run.constructionMode==='shared';
  const cornerSide=shared&&design.junctions.some(j=>j.type==='diagonal'&&(j.runAId===run.id||j.runBId===run.id));
  const blind=design.junctions.find(j=>j.type==='blind'&&j.priorityRunId===run.id);
  const other=blind?design.runs.find(r=>r.id===(blind.runAId===run.id?blind.runBId:blind.runAId)):undefined;
  const blindCover=first.index===0&&blind&&other?runFrontMm(other)+blind.fillerWidthMm:0;
  const startMm=first.startOffsetMm-(shared&&(first.index>0||cornerSide)?Math.round(t/2):0)+blindCover+2+(front.type==='sliding'?front.sliding?.startClearanceMm??0:0);
  const endMm=last.startOffsetMm+last.outerWidthMm-(shared&&last.index<run.bays.length-1?Math.round(t/2):0)-2-(front.type==='sliding'?front.sliding?.endClearanceMm??0:0);
  return {run,bays,startMm,endMm,widthMm:endMm-startMm};
}

const world = (run:Run,x:number,y:number,z:number):[number,number,number]=>run.wallAxis==='B'?[z,y,x]:[x,y,z];

/** Front niyetinden, gövdeyi veya net iç derinliği değiştirmeden ön ray sistemi türetir. */
export function attachSlidingFronts(design:Design,model:ResolvedModel):void {
  model.slidingDoors=[];model.slidingSystems=[];
  const fronts:Front[]=[...design.fronts.filter(f=>f.type==='sliding')];
  for(const run of design.runs)for(const bay of run.bays)if(bay.frontMode==='sliding'&&!design.fronts.some(f=>f.bayIds.includes(bay.id)))
    fronts.push({id:`auto-sliding-${bay.id}`,runId:run.id,bayIds:[bay.id],type:'sliding',yStartMm:run.plinthHeightMm+2,yEndMm:run.heightMm-run.topFillerHeightMm-2});
  for(const front of fronts) {
    if(!model.bays.some(b=>front.bayIds.includes(b.id))) {
      model.issues.push({id:`${front.id}-unresolved`,code:'SLIDING_FRONT_UNRESOLVED',severity:'error',title:'Sürgü gövdesi çözülemedi',description:'Kapak kapsamındaki gövdelerin yerleşimini ve kol eksenini kontrol edin.',targetId:front.id});
      continue;
    }
    const {run,bays,startMm,endMm,widthMm}=frontSpanFromResolved(design,model,front);
    const cfg=front.sliding??defaultSlidingConfig(run.panelThicknessMm,front.trackIndex===2?3:2);
    const t=run.panelThicknessMm, count=cfg.leafCount, gap=cfg.verticalGapMm??10;
    const range = frontVerticalRange(run, front);
    const y0=Math.max(run.plinthHeightMm+2,range.start), y1=Math.min(run.heightMm-run.topFillerHeightMm-2,range.end);
    const issue=(code:string,description:string,severity:'error'|'warning'|'expert'='error')=>model.issues.push({id:`${front.id}-${code}`,code,severity,title:'Sürgülü kapak sistemi',description,targetId:front.id,why:'Ray, bindirme ve kanat ölçüleri aynı kapak açıklığından türetilir.'});
    if(widthMm<count*150-(count-1)*cfg.overlapMm||y1-y0-2*gap<160) {issue('SLIDING_OPENING_TOO_SMALL','Açıklık, en az 150 mm genişlikte kanatlar ve 160 mm net kapak yüksekliği için yetersiz.');continue;}
    if(cfg.trackSpacingMm<t+2||cfg.trackDepthMm<8+t+(cfg.trackCount-1)*cfg.trackSpacingMm+10) {issue('SLIDING_TRACK_CLEARANCE','Ray derinliği/eksen aralığı panel kalınlığına yetmiyor. Panel kalınlığı, ön/arka ray ve kulp boşluğunu artırın.');continue;}
    const totalWidth=widthMm+(count-1)*cfg.overlapMm;
    let widths:number[];
    if(cfg.leafWidthsMm) {
      widths=cfg.leafWidthsMm;
      if(widths.length!==count||widths.reduce((s,w)=>s+w,0)!==totalWidth||widths.some(w=>w<150||w>widthMm)) {issue('SLIDING_WIDTH_ALLOCATION',`Kanat genişlikleri toplamı ${totalWidth} mm olmalı; her kanat ray açıklığına sığmalıdır.`);continue;}
    } else widths=distributeIntegerMm(totalWidth,Array.from({length:count},(_,i)=>({id:String(i),size:{kind:'flex' as const,weight:1,minMm:150}}))).map(r=>r.resolvedMm);
    const tracks=cfg.trackIndices??Array.from({length:count},(_,i)=>((i+(front.trackIndex??0))%cfg.trackCount) as 0|1|2);
    if(tracks.length!==count||tracks.some(i=>i>=cfg.trackCount)) {issue('SLIDING_TRACK_INDEX','Kanat ray sıralaması seçili iki/üç ray düzenine uymuyor.');continue;}
    if(bays.length===1) issue('SLIDING_SINGLE_BAY','Tek bölmede sürgü, açıklığın yalnız bir kısmına erişim sağlar. Çekmece genişliğini ve çıkarma açıklığını kontrol edin.','warning');
    for(let i=0;i<count-1;i++)if(tracks[i]===tracks[i+1]&&cfg.overlapMm>0)issue('SLIDING_SAME_TRACK_OVERLAP','Kapalı durumda örtüşen komşu kanatlar aynı rayda olamaz. Ray sırasını değiştirin.');
    const effectiveHandle:HandleConfig=front.handleConfig??{styleId:'recessedJ',finishId:'matteBlack',lengthMm:320,placement:'middle',orientation:'vertical',offsetFromEdgeMm:38};
    if(!['recessedJ'].includes(effectiveHandle.styleId)) issue('SLIDING_HANDLE_REVIEW','Çıkıntılı kulpun arka/ön ray geçişini engellemediğini kontrol edin. Hareket sınırı kulp zarfını da kullanır.','expert');
    const system={frontId:front.id,runId:run.id,bayIds:bays.map(b=>b.id),trackCount:cfg.trackCount,overlapMm:cfg.overlapMm,openingWidthMm:widthMm,trackDepthMm:cfg.trackDepthMm,trackSpacingMm:cfg.trackSpacingMm,railStartMm:startMm,railEndMm:endMm,yStartMm:y0,yEndMm:y1,
      railBoxes:[y0+4,y1-4].map(y=>({centerMm:world(run,(startMm+endMm)/2,y,runFrontMm(run)+cfg.trackDepthMm/2),sizeMm:world(run,widthMm,8,cfg.trackDepthMm)}))};
    model.slidingSystems.push(system);
    let cursor=startMm;
    for(let i=0;i<count;i++) {
      const w=widths[i],depth=runFrontMm(run)+8+tracks[i]*cfg.trackSpacingMm+t/2;
      const id=`slide-${front.id}-${i+1}`, min=startMm-cursor,max=endMm-cursor-w;
      const sign=i%2===0?1:-1;
      const handleAlong=cursor+(sign>0?w-Math.min(w/3,effectiveHandle.offsetFromEdgeMm??38):Math.min(w/3,effectiveHandle.offsetFromEdgeMm??38));
      const handleY=effectiveHandle.placement==='top'?y1-gap-45:effectiveHandle.placement==='bottom'?y0+gap+45:(y0+y1)/2;
      const leaf:ResolvedSlidingLeaf={id,frontId:front.id,label:`${front.label??bays[0].label} Sürgü ${i+1}`,runId:run.id,bayId:bays[0].id,bayIds:bays.map(b=>b.id),wallAxis:run.wallAxis,leafIndex:i,trackIndex:tracks[i],widthMm:w,heightMm:y1-y0-2*gap,thicknessMm:t,yStartMm:y0+gap,yEndMm:y1-gap,
        closedWorldPositionMm:world(run,cursor+w/2,(y0+y1)/2,depth),boxSizeMm:world(run,w,y1-y0-2*gap,t),slideDirectionWorld:run.wallAxis==='B'?[0,0,1]:[1,0,0],minOffsetMm:min,maxOffsetMm:max,initialOffsetMm:i===0?Math.max(min,Math.min(max,front.slideOffsetMm??0)):0,openOffsetMm:Math.abs(max)>Math.abs(min)?max:min,
        materialId:front.materialId??bays[0].doorMaterialId??design.materials.frontMaterialId,handleConfig:effectiveHandle,handleSurfaceWorldMm:world(run,handleAlong,handleY+(effectiveHandle.verticalOffsetMm??0),depth+t/2+1),handleRotationYRad:run.wallAxis==='B'?Math.PI/2:0};
      model.slidingDoors.push(leaf);
      model.panels.push({id:`panel-${id}`,label:leaf.label,runId:run.id,bayId:leaf.bayId,bayIds:leaf.bayIds,role:'doorLeaf',shapeKind:'box',cutWidthMm:w,cutHeightMm:leaf.heightMm,cutThicknessMm:t,worldPositionMm:leaf.closedWorldPositionMm,boxSizeMm:leaf.boxSizeMm,rotationYRad:0,grainAxis:'vertical',materialSlot:'front',materialIdOverride:leaf.materialId,animatedUnitId:id});
      cursor+=w-cfg.overlapMm;
    }
    const leaves=model.slidingDoors.filter(l=>l.frontId===front.id);
    for(const cell of model.cells)if(front.bayIds.includes(cell.bayId)&&cell.yStartMm<y1&&cell.yEndMm>y0)cell.coveringDoorIds=[...(cell.coveringDoorIds??[]),...leaves.map(l=>l.id)];
    for(const drawer of model.drawers)if(front.bayIds.includes(drawer.bayId)&&drawer.yStartMm<y1&&drawer.yEndMm>y0)drawer.coveringDoorIds.push(...leaves.map(l=>l.id));
    for(const led of model.ledStrips)if(led.bayId&&front.bayIds.includes(led.bayId)&&led.worldPositionMm[1]>y0&&led.worldPositionMm[1]<y1)led.coveringDoorIds=[...led.coveringDoorIds,...leaves.map(l=>l.id)];
    issue('SLIDING_HARDWARE_REVIEW',`Ray sistemi gövdenin önüne ${cfg.trackDepthMm} mm ekler; iç net derinlik korunur. ${gap} mm üst/alt pay ve ray aralıkları planlama parametresidir. Gerçek profil, taşıma kapasitesi ve montaj delikleri üreticiyle doğrulanmalıdır.`,'expert');
  }
  model.summary.totalDoorsCount=model.doors.length+model.slidingDoors.length;
  model.summary.totalPanelsCount=model.panels.length;
}
