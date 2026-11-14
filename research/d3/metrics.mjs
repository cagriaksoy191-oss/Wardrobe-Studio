import {area,rect,unionLength} from './geometry.mjs';
import {cellPolygon,shelfReach,replay} from './access.mjs';

export const massKg=(w,h,t,density)=>w*h*t/1e9*density;
export function staticClashes(api,model) {
  const p=model.panels.filter(p=>!p.animatedUnitId&&p.role!=='hangingRod'&&p.role!=='drawerBox');
  const v=p.map(x=>api.panelVolume(x)),result=[];
  for(let i=0;i<p.length;i++)for(let j=i+1;j<p.length;j++)
    if(Math.min(v[i].y1,v[j].y1)-Math.max(v[i].y0,v[j].y0)>.05&&api.polygonsIntersect(v[i].polygon,v[j].polygon,-.05))result.push([p[i].id,p[j].id]);
  return result;
}
export function motionSequence(api,scene) {
  const positions={},opening=[],closing=[];
  for(const p of scene.parts) {
    const stop=api.constrainMotion(scene,positions,p.id,p.open);positions[p.id]=stop.position;
    opening.push({id:p.id,kind:p.kind,target:p.open,...stop,angleDeg:p.kind==='hinged'?stop.position*Math.abs(p.radiansPerUnit)*180/Math.PI:null});
  }
  const openPositions={...positions};
  for(const p of [...scene.parts].reverse()) {
    const stop=api.constrainMotion(scene,positions,p.id,p.home);positions[p.id]=stop.position;
    closing.push({id:p.id,kind:p.kind,...stop});
  }
  return {opening,closing,openPositions,closedAgain:scene.parts.every(p=>Math.abs((positions[p.id]??p.home)-p.home)<1e-6)};
}

export function footprintPolygons(context,model) {
  const corners=model.corners.map(c=>c.polygonXZMm).filter(Boolean);
  // Corner footprint is the actual carcass polygon, not its bounding rectangle.
  const cp=model.panels.filter(p=>p.polygonXZMm&&p.role==='bottomPanel').map(p=>p.polygonXZMm);
  return [...(corners.length?corners:cp.slice(0,1)),...model.bays.map(b=>{
    const r=context.runs.find(r=>r.id===b.runId),w=b.outerWidthMm??b.widthMm??b.netWidthMm+2*r.panelThicknessMm;
    return r.wallAxis==='B'?rect(0,b.worldCenterMm[2]-w/2,r.depthMm,w):rect(b.worldCenterMm[0]-w/2,0,w,r.depthMm);
  }),...context.runs.map(r=>r.wallAxis==='B'?rect(0,r.lengthMm-r.endFillerMm,r.depthMm,r.endFillerMm):rect(r.lengthMm-r.endFillerMm,0,r.endFillerMm,r.depthMm))];
}
export function operatingCycles(api,model,scene) {
  return model.bays.map(b=>{
    const parts=scene.parts.filter(p=>model.doors.some(d=>d.id===p.id&&d.bayIds.includes(b.id)));
    const positions={},opening=[],closing=[];
    for(const p of parts) {
      const target=Math.min(p.open,Math.PI/2/Math.abs(p.radiansPerUnit)),stop=api.constrainMotion(scene,positions,p.id,target);
      positions[p.id]=stop.position;opening.push({id:p.id,targetDeg:90,reachedDeg:stop.position*Math.abs(p.radiansPerUnit)*180/Math.PI,blocked:stop.blocked});
    }
    const drawers=[];
    for(const p of scene.parts.filter(p=>p.kind==='drawer'&&model.drawers.some(d=>d.id===p.id&&d.bayId===b.id))) {
      const open=api.constrainMotion(scene,positions,p.id,1);positions[p.id]=open.position;
      const back=api.constrainMotion(scene,positions,p.id,0);positions[p.id]=back.position;
      drawers.push({id:p.id,requestedFraction:1,reachedFraction:open.position,closedAgain:back.position===0});
    }
    for(const p of [...parts].reverse()) {
      const stop=api.constrainMotion(scene,positions,p.id,0);positions[p.id]=stop.position;closing.push({id:p.id,...stop});
    }
    return {bayId:b.id,opening,drawers,closing,closedAgain:parts.every(p=>positions[p.id]===0)&&drawers.every(d=>d.closedAgain)};
  });
}
export function faceGaps(api,context,model) {
  // Designed edge/seam reveals up to 4 mm are excluded; a storage-height opening is not.
  return model.bays.flatMap(b=>{
    const intervals=[...model.doors,...(model.slidingDoors??[])].filter(d=>d.bayIds.includes(b.id)).map(d=>[d.yStartMm,d.yEndMm]);
    intervals.push(...model.drawers.filter(d=>d.bayId===b.id&&!d.isInternalDrawer).map(d=>[d.yStartMm,d.yEndMm]));
    const run=context.runs.find(r=>r.id===b.runId),axis=run.wallAxis==='B'?'xMm':'zMm';
    for(const panel of model.panels.filter(p=>p.bayId===b.id&&['shelf','bottomPanel','topPanel'].includes(p.role))) {
      const v=api.panelVolume(panel);
      if(Math.max(...v.polygon.map(p=>p[axis]))>=run.depthMm-.5)intervals.push([v.y0,v.y1]);
    }
    let cursor=82;const gaps=[];
    for(const [lo,hi]of intervals.sort((a,b)=>a[0]-b[0])) {if(lo-cursor>4)gaps.push({bayId:b.id,fromMm:cursor,toMm:lo});cursor=Math.max(cursor,hi);}
    if(2358-cursor>4)gaps.push({bayId:b.id,fromMm:cursor,toMm:2358});
    return gaps;
  });
}
// Deterministic midpoint integration of polygon unions, exact slice interval unions.
// Error is exposed by running at two resolutions; this is not an exact area claim.
export function rasterUnion(polys,stepMm=5) {
  if(!polys.length)return 0;
  const min=Math.min(...polys.flatMap(p=>p.map(v=>v.xMm))),max=Math.max(...polys.flatMap(p=>p.map(v=>v.xMm)));
  const bounded=polys.map(p=>({p,min:Math.min(...p.map(v=>v.xMm)),max:Math.max(...p.map(v=>v.xMm))}));
  let sum=0;
  for(let lo=min;lo<max;lo+=stepMm) {
    const hi=Math.min(max,lo+stepMm),x=(lo+hi)/2,spans=[];
    for(const b of bounded) {
      if(b.min>=x||b.max<=x)continue;
      const zs=[];
      for(let i=0;i<b.p.length;i++) {const a=b.p[i],c=b.p[(i+1)%b.p.length];if((a.xMm<=x&&c.xMm>x)||(c.xMm<=x&&a.xMm>x))zs.push(a.zMm+(x-a.xMm)*(c.zMm-a.zMm)/(c.xMm-a.xMm));}
      if(zs.length)spans.push([Math.min(...zs),Math.max(...zs)]);
    }
    sum+=(hi-lo)*unionLength(spans);
  }
  return sum;
}
export function summarize(api,p,{stepMm=20,roomStepMm=5}={}) {
  const {model,context,scene}=p,h1=p.mechanism==='H1';
  const leaves=model.cells.filter(c=>c.isLeaf),fa=model.analysis.functionalAccess;
  const reach=leaves.filter(c=>c.insert?.type!=='drawerBank').map(c=>shelfReach(api,context,model,scene,c,fa.find(a=>a.id===c.id),{stepMm}));
  const shelves=reach.filter(r=>r.kind!=='hanging'),rods=model.panels.filter(p=>p.role==='hangingRod');
  const drawers=model.drawers.map(d=>{
    const a=fa.find(a=>a.id===d.id),pose=replay(api,scene,a.steps),open=api.constrainMotion(scene,pose.positions,d.id,1);
    const back=api.constrainMotion(scene,{...pose.positions,[d.id]:open.position},d.id,0);
    return {id:d.id,innerMm:[d.innerWidthMm,d.innerDepthMm,d.innerHeightMm],netMm3:d.innerWidthMm*d.innerDepthMm*d.innerHeightMm-(d.organizerPanels??[]).reduce((s,p)=>s+p.cutWidthMm*p.cutHeightMm*p.cutThicknessMm,0),
      requestedMm:d.maxSlideMm,reachedMm:Math.floor(open.position*d.maxSlideMm+1e-7),returnedClosed:back.position===0,blocked:open.blocked,frontClosed:!d.isInternalDrawer};
  });
  const drawerMm3=drawers.reduce((s,d)=>s+d.netMm3,0);
  const netMm3=leaves.filter(c=>c.insert?.type!=='drawerBank').reduce((s,c)=>s+area(cellPolygon(c))*c.netHeightMm,0)+drawerMm3;
  const footprints=p.footprints??footprintPolygons(context,model),footprintMm2=p.footprintMm2??rasterUnion(footprints,1);
  const sequence=motionSequence(api,scene);
  const operatingModel={...model,doors:model.doors.map(d=>({...d,maxAngleDeg:Math.min(90,api.constrainMotion(scene,{},d.id,1).position*d.maxAngleDeg)}))};
  const sweep=api.resolveMotions(operatingModel).filter(m=>m.kind==='hinged').flatMap(m=>m.sweepPolygonsMm);
  const extra=(step)=>rasterUnion([...footprints,...sweep],step)-rasterUnion(footprints,step);
  const doorSweepExtraMm2=extra(roomStepMm),roomRefined=extra(roomStepMm/2);
  const all=sweep.flat(),bounds={minX:Math.min(...all.map(p=>p.xMm)),maxX:Math.max(...all.map(p=>p.xMm)),minZ:Math.min(...all.map(p=>p.zMm)),maxZ:Math.max(...all.map(p=>p.zMm))};
  const t=context.runs[0].panelThicknessMm;
  const doors=model.doors.map(d=>({id:d.id,widthMm:d.widthMm,heightMm:d.heightMm,thicknessMm:d.thicknessMm,
    panelMassKgRange:[massKg(d.widthMm,d.heightMm,d.thicknessMm,650),massKg(d.widthMm,d.heightMm,d.thicknessMm,800)],hardwareMassKg:null,
    manufacturerLoadStatus:'UNVERIFIED',hingeCount:null,mounting:'UNVERIFIED'}));
  const staticConflicts=staticClashes(api,model),closedConflicts=api.initialMotionConflicts(scene);
  const accessibleShelfMm2=shelves.reduce((s,r)=>s+r.accessibleMm2,0),shelfMm2=shelves.reduce((s,r)=>s+r.surfaceMm2,0);
  const rodRawMm=rods.reduce((s,r)=>s+r.cutWidthMm,0),rodUsableMm=rods.reduce((s,r)=>s+Math.max(0,r.cutWidthMm-40),0);
  const accessibleRodCenterMm=reach.filter(r=>r.kind==='hanging').reduce((s,r)=>s+r.accessibleRodCenterMm,0);
  const moduleBodyMm3=p.placements?p.placements.reduce((s,r,i)=>s+r.moduleWidthsMm.reduce((a,b)=>a+b,0)*context.runs[i].depthMm*(2400-80-40),0):(footprintMm2-context.runs.reduce((s,r)=>s+r.endFillerMm*r.depthMm,0))*(2400-80-40);
  const geometryPass=!staticConflicts.length&&!closedConflicts.length;
  return {id:p.id,kind:p.kind,fillerMm:p.fillerMm??null,layout:p.layout??'canonical',mechanism:p.mechanism??'CANONICAL',
    definitionsVersion:'D3-1',units:'mm / mm2 / mm3; masses kg',
    metrics:{grossBodyMm3:footprintMm2*2280,moduleBodyMm3,netStorageMm3:netMm3,shelfMm2,
      accessibleShelfMm2:h1?null:accessibleShelfMm2,rodRawMm,rodUsableMm,accessibleRodCenterMm:h1?null:accessibleRodCenterMm,accessibleRodPhysicalMm:null,drawerMm3,
      strokeMm:h1?null:drawers.map(d=>d.reachedMm),independentModules:p.placements?p.placements.reduce((s,r)=>s+r.moduleWidthsMm.length,0):1,
      footprintMm2,doorSweepExtraMm2:h1?null:doorSweepExtraMm2,doorSweepRefinementDeltaMm2:h1?null:roomRefined-doorSweepExtraMm2,
      actualRoomClearance:null,sealedGrossMm3:p.sealedVoidGrossMm3??0,sealedNetMm3:p.sealedVoidNetMm3??0},
    parameters:p.parameters??{t},placements:p.placements??null,panelCount:model.panels.length,doorCount:model.doors.length,drawerCount:drawers.length,
    shelfSupportCount:shelves.length,shelfPanelCount:model.panels.filter(p=>p.role==='shelf').length,
    doors,drawers:h1?drawers.map(d=>({...d,reachedMm:null,returnedClosed:null,blocked:null})):drawers,
    reach:h1?reach.map(r=>({...r,status:'NOT_MODELED',accessibleMm2:null,accessibleRodCenterMm:null,steps:[],replay:[],accessiblePolygons:[]})):reach,
    staticConflicts,closedConflicts,sequence:h1?null:sequence,operatingCycles:h1?null:operatingCycles(api,model,scene),doorSweepBounds:h1?null:bounds,
    classifications:{geometry:geometryPass?'EXPERIMENTAL_GEOMETRY_PASS':'NO_GO',
      access:h1?'NOT_MODELED':accessibleShelfMm2>0&&accessibleRodCenterMm>0?'ACCESS_PARTIAL':'ACCESS_FAIL',hardware:'HARDWARE_UNVERIFIED',physical:'PHYSICAL_TEST_REQUIRED',production:'NOT_APPROVED'},
    closedFace:faceGaps(api,context,model).length?'FAIL':'PASS',faceGaps:faceGaps(api,context,model),simulation:h1?'NOT_MODELED':'IDEALIZED_HINGE_SIMULATION',hardwareKinematics:'HARDWARE_KINEMATICS_UNVERIFIED'};
}
