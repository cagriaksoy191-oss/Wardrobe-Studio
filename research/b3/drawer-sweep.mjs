import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {loadEngine} from '../d3/engine.mjs';
import {area,intersectConvex} from '../d3/geometry.mjs';
import {replay} from '../d3/access.mjs';
import {buildB3,B3_VARIANTS} from './prototype.mjs';
import {interactions} from './measure.mjs';

function convexHull(points) {
  const ordered=[...points].sort((a,b)=>a.xMm-b.xMm||a.zMm-b.zMm);
  const side=ps=>{const h=[];for(const c of ps){while(h.length>1){const a=h.at(-2),b=h.at(-1);if((b.xMm-a.xMm)*(c.zMm-a.zMm)-(b.zMm-a.zMm)*(c.xMm-a.xMm)>1e-9)break;h.pop();}h.push(c);}return h.slice(0,-1);};
  return [...side(ordered),...side(ordered.reverse())];
}
// Exact extrusion in XZ for each translating convex solid, tested against fixed
// pose solids. Sum pair intersections; overlaps of pairs are not a global union.
function sweptIntersections(part,position,blockers) {
  const start=part.volumes(0),end=part.volumes(position),pairs=[];
  for(const [i,a]of start.entries()) {
    const swept=convexHull([...a.polygon,...end[i].polygon]);
    if(swept.length<3)continue;
    for(const b of blockers) {
      const y=Math.min(a.y1,b.y1)-Math.max(a.y0,b.y0);if(y<=0)continue;
      const poly=intersectConvex(swept,b.polygon);if(poly.length<3)continue;
      const volumeMm3=area(poly)*y;if(volumeMm3>1e-5)pairs.push({drawerSolid:a.id,blocker:b.id,volumeMm3});
    }
  }
  return {sumMm3:pairs.reduce((s,p)=>s+p.volumeMm3,0),pairs};
}
const api=await loadEngine(),context=api.phase5Example('blind'),model=api.solveDesign(context);
const original={id:'ORIGINAL_blind',context,model,scene:api.planHingeOpenings(context,model)};
const cases=[original,...B3_VARIANTS.map(variant=>buildB3(api,{variant})),buildB3(api,{variant:'DUAL3',blindOpeningLimitDeg:155})];
const records=cases.map(p=>{
  const opts=p.variant?interactions(api,p).filter(s=>s.strokes).map(s=>({id:s.name,positions:Object.fromEntries(s.opening.map(o=>[o.id,o.reachedDeg/o.nominalLimitDeg]))})):null;
  const drawers=p.scene.parts.filter(d=>d.kind==='drawer').map(d=>{
    const physical=p.model.drawers.find(row=>row.id===d.id);
    const poses=opts??[{id:'canonical functional replay',positions:replay(api,p.scene,p.model.analysis.functionalAccess.find(a=>a.id===d.id).steps).positions}];
    return {id:d.id,scenes:poses.map(({id,positions})=>{
      const pos={...positions,[d.id]:0},stop=api.constrainMotion(p.scene,pos,d.id,1);
      const blockers=[...p.scene.staticVolumes,...p.scene.parts.filter(x=>x.id!==d.id).flatMap(x=>x.volumes(pos[x.id]??x.home))];
      return {id,targetMm:physical.maxSlideMm,reachedMm:stop.position*physical.maxSlideMm,blockerId:stop.blockerId??null,
        allowed:sweptIntersections(d,stop.position,blockers),unconstrained:sweptIntersections(d,1,blockers)};
    })};
  });
  return {id:p.id,drawers};
});
assert.ok(records.slice(1,4).every(r=>r.drawers.every(d=>d.scenes.every(s=>s.reachedMm===451&&s.allowed.sumMm3<1e-5))));
const rejected=records.at(-1);assert.ok(rejected.drawers.some(d=>d.scenes.some(s=>s.reachedMm<20&&s.unconstrained.sumMm3>1000)));
await writeFile('artifacts/portable-cad/drawer-sweep-verification.json',JSON.stringify({method:'Convex translated prism per drawer solid; pairwise overlap sum; fixed neighbor poses; not global union or hardware test',records},null,2));
for(const r of records) {
 const scenes=r.drawers.flatMap(d=>d.scenes),worst=scenes.reduce((a,b)=>a.unconstrained.sumMm3>b.unconstrained.sumMm3?a:b);
 console.log(JSON.stringify({id:r.id,checks:scenes.length,maxAllowedOverlapMm3:Math.max(...scenes.map(s=>s.allowed.sumMm3)),maxForcedOverlapMm3:worst.unconstrained.sumMm3,worstScenario:worst.id,worstReachedMm:worst.reachedMm,blocker:worst.blockerId}));
}
