import {area,rect,clipHalfPlane,erodeRectangle,horizontalSlice,subtractIntervals,unionLength,rectangleUnionArea,intersectConvex} from './geometry.mjs';

export function cellPolygon(c) {
  return c.polygonXZMm??rect(c.worldCenterMm[0]-c.worldSizeMm[0]/2,c.worldCenterMm[2]-c.worldSizeMm[2]/2,c.worldSizeMm[0],c.worldSizeMm[2]);
}
export function supportPolygon(api,model,c) {
  const cell=cellPolygon(c);
  const support=model.panels.filter(p=>p.bayId===c.bayId&&p.role==='shelf').map(p=>api.panelVolume(p)).find(v=>Math.abs(v.y1-c.yStartMm)<.01&&api.polygonsIntersect(v.polygon,cell));
  return support?intersectConvex(cell,support.polygon):cell;
}
export function aperture(context,c) {
  if(c.cornerJunctionId&&c.polygonXZMm) {
    const [,,end,origin]=c.polygonXZMm,w=Math.hypot(end.xMm-origin.xMm,end.zMm-origin.zMm);
    return {origin,along:{xMm:(end.xMm-origin.xMm)/w,zMm:(end.zMm-origin.zMm)/w},outward:{xMm:-(end.zMm-origin.zMm)/w,zMm:(end.xMm-origin.xMm)/w},width:w};
  }
  const r=context.runs.find(r=>r.id===c.runId),b=r.wallAxis==='B',w=c.accessOpeningWidthMm??c.netWidthMm;
  const start=c.worldCenterMm[b?2:0]+c.netWidthMm/2-w;
  // All studied runs are floor cabinets; front is nominal depth (no wall offset).
  return {origin:b?{xMm:r.depthMm,zMm:start}:{xMm:start,zMm:r.depthMm},along:b?{xMm:0,zMm:1}:{xMm:1,zMm:0},outward:b?{xMm:1,zMm:0}:{xMm:0,zMm:1},width:w};
}
export const localPoint=(p,a)=>({xMm:(p.xMm-a.origin.xMm)*a.along.xMm+(p.zMm-a.origin.zMm)*a.along.zMm,zMm:(p.xMm-a.origin.xMm)*a.outward.xMm+(p.zMm-a.origin.zMm)*a.outward.zMm});
export const worldPoint=(p,a)=>({xMm:a.origin.xMm+p.xMm*a.along.xMm+p.zMm*a.outward.xMm,zMm:a.origin.zMm+p.xMm*a.along.zMm+p.zMm*a.outward.zMm});

export function replay(api,scene,steps=[]) {
  const positions={},checks=[];
  for(const s of steps) {
    const part=scene.parts.find(p=>p.id===s.partId);
    const target=s.unit==='deg'?s.position*Math.PI/180/Math.abs(part.radiansPerUnit):s.position;
    const stop=api.constrainMotion(scene,positions,part.id,target);
    positions[part.id]=stop.position;checks.push({id:part.id,target,reached:stop.position,blocked:stop.blocked});
  }
  return {positions,checks,volumes:[...scene.staticVolumes,...scene.parts.flatMap(p=>p.volumes(positions[p.id]??p.home).map(v=>({...v,id:p.id})))]};
}

/** Continuous straight translation of one padded item, for a fixed modeled open pose.
 * Each accepted interval is analytically collision-free for every center in it.
 * Depth samples do NOT claim exhaustive coverage: union of accepted rectangles is a lower bound.
 */
export function shelfReach(api,context,model,scene,c,access,{stepMm=20}={}) {
  const a=aperture(context,c),hanging=access.kind==='hanging';
  const poly=(hanging?cellPolygon(c):supportPolygon(api,model,c)).map(p=>localPoint(p,a));
  const w=hanging?480:310,d=hanging?550:390,h=hanging?850:70;
  const rod=hanging?model.panels.find(p=>p.role==='hangingRod'&&p.cellId===c.id):null;
  const top=rod?rod.worldPositionMm[1]:c.yStartMm+2+h;
  const y0=hanging?top-h:c.yStartMm+2,y1=y0+h;
  const pose=replay(api,scene,access.steps),eroded=erodeRectangle(poly,w,d);
  const heightFits=y0>=c.yStartMm&&y1<=c.yEndMm;
  const obstacles=pose.volumes.filter(v=>v.id!==rod?.id&&Math.min(v.y1,y1)-Math.max(v.y0,y0)>.001).map(v=>({...v,polygon:v.polygon.map(p=>localPoint(p,a))}));
  const intervalsAt=z=>{
    const base=horizontalSlice(eroded,z);if(!base||!heightFits)return [];
    const blocks=[];
    for(const v of obstacles) {
      const clipped=clipHalfPlane(clipHalfPlane(v.polygon,0,1,z-d/2),0,-1,-(d+30));
      if(clipped.length>=3&&area(clipped)>1e-6) blocks.push([Math.min(...clipped.map(p=>p.xMm))-w/2,Math.max(...clipped.map(p=>p.xMm))+w/2]);
    }
    return subtractIntervals(base,blocks);
  };
  const rectangles=[];
  if(eroded.length&&heightFits) {
    const zs=eroded.map(p=>p.zMm),lo=Math.min(...zs),hi=Math.max(...zs),levels=new Set([...zs,lo,hi]);
    for(let z=lo;z<hi;z+=stepMm)levels.add(z);
    for(const z of [...levels].sort((a,b)=>a-b))for(const [l,r]of intervalsAt(z))rectangles.push([l-w/2,z-d/2,r+w/2,z+d/2]);
  }
  const rodZ=rod?localPoint({xMm:rod.worldPositionMm[0],zMm:rod.worldPositionMm[2]},a).zMm:null;
  const rodIntervals=rod?intervalsAt(rodZ).map(([l,r])=>[Math.max(l,20),Math.min(r,c.netWidthMm-20)]).filter(([l,r])=>r>l):[];
  const accessibleMm2=rectangleUnionArea(rectangles),surfaceMm2=area(poly);
  return {id:c.id,bayId:c.bayId,kind:access.kind,openingMm:access.openingWidthMm,clearFrontMm:access.clearWidthMm,
    shelfDepthMm:c.supportDepthMm??c.netDepthMm,heightMm:c.netHeightMm,y0,y1,specimenMm:[w,d,h],direction:a.outward,
    surfaceMm2,accessibleMm2,accessibleRodCenterMm:unionLength(rodIntervals),rodIntervals,rodHeightMm:rod?.worldPositionMm[1]??null,
    status:accessibleMm2>1?(hanging?'CONDITIONALLY_ACCESSIBLE':'ACCESSIBLE'):'BLOCKED',
    physicalStatus:'UNVERIFIED_PHYSICAL',detachmentPath:hanging?'NOT_MODELED':null,steps:access.steps,replay:pose.checks,
    accessiblePolygons:rectangles.map(([x,z,x1,z1])=>rect(x,z,x1-x,z1-z).map(p=>worldPoint(p,a))),stepMm};
}
