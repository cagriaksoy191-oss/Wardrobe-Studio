import {summarize,faceGaps,rasterUnion} from '../d3/metrics.mjs';
import {replay} from '../d3/access.mjs';
import {rect,area} from '../d3/geometry.mjs';

export const drawerNet=d=>d.innerWidthMm*d.innerDepthMm*d.innerHeightMm-(d.organizerPanels??[]).filter(p=>p.researchRole!=='innerFront').reduce((s,p)=>s+p.cutWidthMm*p.cutHeightMm*p.cutThicknessMm,0);
export function interactions(api,p) {
  const {model,scene}=p,drawers=scene.parts.filter(x=>x.kind==='drawer'),hinges=scene.parts.filter(x=>x.kind==='hinged');
  const scenarios=[];
  for(const deg of [0,30,60,90,155])for(const reverse of [false,true]) {
    const positions={},opening=[];
    const hs=reverse?[...hinges].reverse():hinges;
    for(const part of hs) {
      const maxDeg=Math.abs(part.radiansPerUnit)*180/Math.PI;
      const stop=api.constrainMotion(scene,positions,part.id,Math.min(1,deg/maxDeg));positions[part.id]=stop.position;
      opening.push({id:part.id,requestedDeg:deg,nominalLimitDeg:maxDeg,reachedDeg:stop.position*maxDeg,blocked:stop.blocked});
    }
    const strokes=[];
    for(const part of drawers) {
      const stop=api.constrainMotion(scene,positions,part.id,1);positions[part.id]=stop.position;
      const back=api.constrainMotion(scene,positions,part.id,0);positions[part.id]=back.position;
      strokes.push({id:part.id,reachedMm:stop.position*model.drawers.find(d=>d.id===part.id).maxSlideMm,requestedMm:model.drawers.find(d=>d.id===part.id).maxSlideMm,returnedClosed:back.position===0});
    }
    // Keep all drawers extended, then try closing every door in the deliberately wrong order.
    for(const part of drawers)positions[part.id]=api.constrainMotion(scene,positions,part.id,1).position;
    const doorClosing=[];
    for(const part of hs){const stop=api.constrainMotion(scene,positions,part.id,0);positions[part.id]=stop.position;doorClosing.push({id:part.id,...stop});}
    for(const part of [...drawers].reverse())positions[part.id]=api.constrainMotion(scene,positions,part.id,0).position;
    for(const part of [...hs].reverse())positions[part.id]=api.constrainMotion(scene,positions,part.id,0).position;
    scenarios.push({name:`neighbors-${deg}-${reverse?'reverse':'forward'}`,opening,strokes,doorClosing,closedAgain:scene.parts.every(p=>Math.abs(positions[p.id]??p.home)<1e-6)});
  }
  const positions={},wrongOrder=[];
  for(const part of drawers)positions[part.id]=api.constrainMotion(scene,positions,part.id,1).position;
  for(const part of hinges){const stop=api.constrainMotion(scene,positions,part.id,1);positions[part.id]=stop.position;wrongOrder.push({id:part.id,...stop});}
  for(const part of [...hinges,...drawers].reverse())positions[part.id]=api.constrainMotion(scene,positions,part.id,0).position;
  scenarios.push({name:'drawers-first-doors-after',opening:wrongOrder,closedAgain:scene.parts.every(p=>Math.abs(positions[p.id]??p.home)<1e-6)});
  return scenarios;
}
export function measureB3(api,p) {
  const s=summarize(api,p),oldDrawer=s.metrics.drawerMm3,newDrawer=p.model.drawers.reduce((v,d)=>v+drawerNet(d),0);
  s.metrics.drawerMm3=newDrawer;s.metrics.netStorageMm3+=newDrawer-oldDrawer;
  const blindCell=p.model.cells.find(c=>c.id==='A-blind-storage');
  // D3 uses one common 310 mm shelf reference. The blind luggage/floor cell is
  // separately tagged: this does NOT validate removal of the original suitcase/hurc.
  const blind=s.reach.find(r=>r.id===blindCell?.id);
  if(blind){blind.actualInsertPath='NOT_MODELED';blind.status='CONDITIONALLY_ACCESSIBLE';blind.referenceNote='310mm folded-item support reference only; actual luggage/hurc requires its own 480mm scenario and orientation.';}
  s.metrics.independentModules=p.variant?p.model.bays.length:1;
  s.metrics.physicallyAccessibleVolumeMm3=null;
  s.metrics.geometryPartCount=p.variant?p.model.panels.length:api.extractProduction(p.context,p.model,'QA','2026-11-04T12:00:00.000Z').parts.length;
  s.drawers=s.drawers.map(row=>{const d=p.model.drawers.find(d=>d.id===row.id),woodVolume=d.research?p.model.panels.filter(p=>p.animatedUnitId===d.id).reduce((v,p)=>v+p.cutWidthMm*p.cutHeightMm*p.cutThicknessMm,0):null;
    return {...row,netMm3:drawerNet(d),frontWidthMm:d.frontBoxSizeMm[d.wallAxis==='B'?2:0],sideMm:d.sideThicknessMm,bottomMm:d.bottomThicknessMm,movento:d.research??null,manufacturerStrokeMm:null,
      analyticWoodMassKgRange:woodVolume===null?null:[woodVolume/1e9*650,woodVolume/1e9*800],hardwareMassKg:null,verifiedPayloadKg:null,
      nominalSideRevealMm:p.variant?(p.model.cells.find(c=>c.id===d.cellId).netWidthMm-d.frontBoxSizeMm[0])/2:null};});
  s.drawerFaceSeamsMm=p.model.bays.flatMap(b=>{const rows=p.model.drawers.filter(d=>d.bayId===b.id).sort((a,b)=>a.yStartMm-b.yStartMm);return rows.slice(1).map((d,i)=>({bayId:b.id,gapMm:d.yStartMm-rows[i].yEndMm}));});
  s.interactions=p.variant?interactions(api,p):null;
  s.classifications.access=s.metrics.accessibleRodCenterMm>0&&s.drawers.every(d=>d.reachedMm===d.requestedMm)?'ACCESS_PARTIAL':'ACCESS_FAIL';
  s.approachZones=s.reach.filter(r=>r.kind==='hanging').map(r=>{
    const c=p.model.cells.find(c=>c.id===r.id);
    return {cellId:r.id,polygon:rect(c.worldCenterMm[0]-300,600+550+30,600,600),heightMm:1800,status:'ASSUMED_APPROACH_ZONE_NOT_HUMAN_VALIDATION'};
  });
  s.reservations=p.reservations??[];s.blindStorage={sealed:false,notEquivalentToD3ServiceBox:true,frontOccludedLengthMm:670,remainingClearOpeningMm:blind?.openingMm??null,actualLuggagePath:'NOT_MODELED'};
  s.hardware={runner:'760H5000S',lockingDevices:'T51.7601 left/right',catalogueDynamicClassKg:40,manufacturerStrokeMm:null,
    exactRailCad:'UNVERIFIED',hinge:'H5 ideal upper doors 155 deg / full-height doors 92-deg analytic limit; 71B7550 + 70T7553.09 actual mount/quantity UNVERIFIED',loadedDeflection:'UNVERIFIED',screwRetention:'UNVERIFIED',stockAndOrder:'UNVERIFIED',approval:'NOT_APPROVED'};
  if(s.interactions?.some(c=>!c.closedAgain||c.strokes?.some(d=>d.reachedMm<d.requestedMm-.01)))s.classifications.systemSequence='NO_GO';
  else s.classifications.systemSequence=p.variant?'PHYSICAL_TEST_REQUIRED':'ACCESS_FAIL';
  s.closedFace=faceGaps(api,p.context,p.model).length?'FAIL':'PASS';
  return s;
}
