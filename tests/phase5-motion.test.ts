import { describe,expect,it } from 'vitest';
import type { Design, Front } from '../src/core/schema/types';
import { SAMPLE_DESIGNS } from '../src/core/presets/sampleDesigns';
import { normalizeAndValidateDesign } from '../src/core/schema/designSchema';
import { solveDesign } from '../src/core/solver/carcassSolver';
import { defaultSlidingConfig,frontSpanFromResolved } from '../src/core/solver/slidingSolver';
import { buildMotionScene,constrainMotion,createMotionConstraint,sweptTranslationTime } from '../src/core/analysis/motionConstraints';
import { exactRectangle,hingedVolumes,polygonAreaMm2,polygonBounds,slidingVolumes } from '../src/core/analysis/kinematics';
import { MotionSimulator } from '../src/core/analysis/motionSimulator';

function sliding(tracks:2|3=2,count=tracks as number):Design {
  const d=structuredClone(SAMPLE_DESIGNS['straight-wardrobe']);
  d.runs[0].constructionMode='shared';d.runs[0].bays.forEach((b,i)=>{b.root={kind:'leaf',id:`empty-${i}`,insert:{type:'empty'}};});
  d.fronts=[{id:'sliding-front',runId:d.runs[0].id,bayIds:d.runs[0].bays.map(b=>b.id),type:'sliding',yStartMm:82,yEndMm:2358,sliding:{...defaultSlidingConfig(18,tracks),leafCount:count}}];
  return d;
}
function singleHinged():Design {
  const d=sliding();d.fronts=[];const run=d.runs[0];run.lengthMm=800;run.startFillerMm=run.endFillerMm=0;run.bays=[run.bays[0]];run.bays[0].width={kind:'fixed',mm:800};run.bays[0].frontMode='singleLeft';
  return d;
}
describe('Phase 5 — sliding fronts and continuous physical motion',()=>{
  it.each([2,3] as const)('resolves %i tracks, overlap and exact integer widths without changing the carcass',tracks=>{
    const d=sliding(tracks),r=solveDesign(d),s=r.slidingSystems![0],leaves=r.slidingDoors!;
    expect(r.issues.filter(i=>i.severity==='error')).toEqual([]);
    expect(leaves).toHaveLength(tracks);expect(r.doors).toHaveLength(0);
    expect(leaves.reduce((n,l)=>n+l.widthMm,0)-(tracks-1)*30).toBe(s.openingWidthMm);
    expect(leaves.every(l=>Number.isInteger(l.widthMm)&&l.trackIndex<tracks)).toBe(true);
    expect(r.cells.every(c=>c.netDepthMm===d.runs[0].depthMm-d.runs[0].backPanelThicknessMm)).toBe(true);
    expect(s.railBoxes[0].centerMm[2]+s.railBoxes[0].sizeMm[2]/2).toBe(d.runs[0].depthMm+s.trackDepthMm);
    expect(normalizeAndValidateDesign(JSON.parse(JSON.stringify(d)))).toEqual(d);
  });
  it('retains unequal leaf widths and clamps every leaf to the physical rail endpoints',()=>{
    const d=sliding(),r0=solveDesign(d),w=r0.slidingSystems![0].openingWidthMm;
    d.fronts[0].sliding!.leafWidthsMm=[1000,w+30-1000];
    const r=solveDesign(d),s=r.slidingSystems![0];
    expect(r.slidingDoors!.map(l=>l.widthMm)).toEqual([1000,w+30-1000]);
    for(const l of r.slidingDoors!) {
      const lo=polygonBounds(slidingVolumes(l,l.minOffsetMm)[0].polygon),hi=polygonBounds(slidingVolumes(l,l.maxOffsetMm)[0].polygon);
      expect(lo.minX).toBe(s.railStartMm);expect(hi.maxX).toBe(s.railEndMm);
    }
  });
  it('reports impossible widths, track indices and insufficient rail depth',()=>{
    const d=sliding();d.fronts[0].sliding!.leafWidthsMm=[400,400];
    expect(solveDesign(d).issues.some(i=>i.code==='SLIDING_WIDTH_ALLOCATION')).toBe(true);
    delete d.fronts[0].sliding!.leafWidthsMm;d.fronts[0].sliding!.trackDepthMm=50;
    expect(solveDesign(d).issues.some(i=>i.code==='SLIDING_TRACK_CLEARANCE')).toBe(true);
    d.fronts[0].sliding=defaultSlidingConfig(18);d.fronts[0].sliding.trackIndices=[0,2];
    expect(solveDesign(d).issues.some(i=>i.code==='SLIDING_TRACK_INDEX')).toBe(true);
  });
  it('supports sliding + partial hinged + open bays and reports overlapping front ranges',()=>{
    const d=sliding();d.fronts[0].bayIds=d.runs[0].bays.slice(0,2).map(b=>b.id);d.fronts[0].yEndMm=1800;
    const top:Front={id:'upper-hinged',runId:'run-A',bayIds:d.fronts[0].bayIds,type:'hinged',hingeSide:'double',yStartMm:1803,yEndMm:2358};
    d.fronts.push(top);d.runs[0].bays[2].frontMode='open';
    const r=solveDesign(d);expect(r.slidingDoors).toHaveLength(2);expect(r.doors).toHaveLength(2);
    expect(r.issues.some(i=>i.code==='FRONT_COVERAGE_OVERLAP')).toBe(false);
    top.yStartMm=1700;expect(solveDesign(d).issues.some(i=>i.code==='FRONT_COVERAGE_OVERLAP')).toBe(true);
  });
  it('does not let a fast drag pass another leaf on the same track',()=>{
    const d=sliding(2,4),r=solveDesign(d),scene=buildMotionScene(d,r),leaf=r.slidingDoors![0],other=r.slidingDoors![2];
    const result=constrainMotion(scene,{},leaf.id,leaf.maxOffsetMm);
    const expected=other.closedWorldPositionMm[0]-other.widthMm/2-(leaf.closedWorldPositionMm[0]+leaf.widthMm/2);
    expect(result.blocked).toBe(true);expect(result.blockerId).toBe(other.id);
    expect(result.position).toBeCloseTo(expected-.05,2);
  });
  it('allows recessed handles on different tracks to pass while respecting handle protrusions',()=>{
    const d=sliding(),r=solveDesign(d),leaf=r.slidingDoors![0];
    expect(constrainMotion(buildMotionScene(d,r),{},leaf.id,leaf.maxOffsetMm).blocked).toBe(false);
    d.fronts[0].handleConfig={styleId:'barModern',finishId:'matteBlack',lengthMm:320,placement:'middle'};
    const withBar=solveDesign(d),s=withBar.slidingDoors![0];
    expect(constrainMotion(buildMotionScene(d,withBar),{},s.id,s.maxOffsetMm).blocked).toBe(true);
  });
  it('stops a sliding panel at an open drawer even when the requested delta crosses the whole obstacle',()=>{
    const d=sliding();d.runs[0].bays[0].root={kind:'leaf',id:'drawer-cell',insert:{type:'drawerBank',drawerCount:2}};
    const r=solveDesign(d),leaf=r.slidingDoors![0],drawer=r.drawers[0],scene=buildMotionScene(d,r);
    expect(drawer.isInternalDrawer).toBe(true);
    const poses={[leaf.id]:leaf.maxOffsetMm,[drawer.id]:1};
    const result=constrainMotion(scene,poses,leaf.id,0);
    expect(result.blocked).toBe(true);expect(result.blockerId).toBe(drawer.id);expect(result.position).toBeGreaterThan(0);
    poses[drawer.id]=0;
    expect(constrainMotion(scene,poses,leaf.id,0).position).toBe(0);
  });
  it('rechecks both directions at the exact achieved blocker pose, including a returning obstacle', () => {
    const design = sliding();
    design.runs[0].bays[0].root = { kind: 'leaf', id: 'drawer-cell', insert: { type: 'drawerBank', drawerCount: 2 } };
    const model = solveDesign(design);
    const [leaf] = model.slidingDoors!;
    const [drawer] = model.drawers;
    const scene = buildMotionScene(design, model);
    const check = createMotionConstraint(scene);
    const positions = { [leaf.id]: leaf.maxOffsetMm, [drawer.id]: 1 };
    const home = check(positions, leaf.id, 0);
    expect(home).toMatchObject({ blocked: true, blockerId: drawer.id });
    expect(home).toEqual(constrainMotion(scene, positions, leaf.id, 0));
    positions[leaf.id] = home.position;
    expect(check(positions, leaf.id, leaf.maxOffsetMm).position).toBe(leaf.maxOffsetMm);
    positions[drawer.id] = 0;
    expect(check(positions, leaf.id, 0)).toMatchObject({ blocked: false, position: 0 });
    positions[leaf.id] = 0;
    expect(check(positions, drawer.id, 1)).toMatchObject({ blocked: true, blockerId: leaf.id });
    positions[leaf.id] = leaf.maxOffsetMm;
    positions[drawer.id] = 1;
    expect(check(positions, leaf.id, 0)).toEqual(home);
  });
  it('preserves rapid reversals and reloads collision bounds when the model changes', () => {
    const design = singleHinged();
    const clear = solveDesign(design);
    const [door] = clear.doors;
    const sim = new MotionSimulator();
    sim.load(design, clear);
    sim.step(1/60, { [door.id]: true }, {});
    const opening = sim.positions[door.id];
    expect(opening).toBeGreaterThan(0);
    sim.draggingId = door.id;
    sim.step(1/60, {}, {});
    expect(sim.positions[door.id]).toBe(opening);
    sim.draggingId = null;
    for (let i = 0; i < 180; i++) sim.step(1/60, {}, {});
    expect(sim.positions[door.id]).toBe(0);
    expect(sim.dragTo(door.id, 1)).toMatchObject({ blocked: false, position: 1 });

    const changed = structuredClone(design);
    const bounds = polygonBounds(hingedVolumes(door, .5)[0].polygon);
    changed.obstacles = [{ id: 'new-post', label: 'Yeni engel', kind: 'other',
      positionMm: [Math.round((bounds.minX + bounds.maxX) / 2), 1000, Math.round((bounds.minZ + bounds.maxZ) / 2)],
      sizeMm: [2, 100, 2], rotationDeg: 0 }];
    const obstructed = solveDesign(changed);
    sim.load(changed, obstructed);
    const stop = sim.dragTo(door.id, 1);
    expect(stop).toMatchObject({ blocked: true, blockerId: 'new-post' });
    expect(stop.position).toBeLessThan(.6);
    sim.load(design, clear);
    expect(sim.dragTo(door.id, 1)).toMatchObject({ blocked: false, position: 1 });
  });
  it('uses an exact swept interval for thin obstacles rather than checking only endpoints',()=>{
    const a=exactRectangle(0,0,10,10),b=exactRectangle(500,0,1,10);
    expect(sweptTranslationTime(a,b,1000,0)).toBeCloseTo(.49,6);
    expect(sweptTranslationTime(a,exactRectangle(500,11,1,10),1000,0)).toBeNull();
  });
  it('stops a fast hinged motion at a thin intermediate obstacle and respects vertical separation',()=>{
    const d=singleHinged(),initial=solveDesign(d),door=initial.doors[0];
    const b=polygonBounds(hingedVolumes(door,.5)[0].polygon);
    d.obstacles=[{id:'thin-post',label:'İnce engel',kind:'other',positionMm:[Math.round((b.minX+b.maxX)/2),1000,Math.round((b.minZ+b.maxZ)/2)],sizeMm:[2,100,2],rotationDeg:0}];
    let result=constrainMotion(buildMotionScene(d,solveDesign(d)),{},door.id,1);
    expect(result.blocked).toBe(true);expect(result.blockerId).toBe('thin-post');expect(result.position).toBeLessThan(.6);
    d.obstacles[0].positionMm[1]=3000;
    result=constrainMotion(buildMotionScene(d,solveDesign(d)),{},door.id,1);
    expect(result.blocked).toBe(false);expect(result.position).toBe(1);
  });
  it('maps B-wall sliding motion onto Z and retains the same physical cut area',()=>{
    const d=structuredClone(SAMPLE_DESIGNS['l-diagonal-asymmetric']),run=d.runs[1];
    d.runs.forEach(r=>r.bays.forEach(b=>{b.frontMode='open';}));
    d.fronts=[{id:'b-sliding',runId:run.id,bayIds:run.bays.map(b=>b.id),type:'sliding',yStartMm:82,yEndMm:2358,sliding:defaultSlidingConfig(run.panelThicknessMm)}];
    const r=solveDesign(d),s=r.slidingDoors![0],lo=polygonBounds(slidingVolumes(s,s.minOffsetMm)[0].polygon);
    expect(s.slideDirectionWorld).toEqual([0,0,1]);expect(lo.minZ).toBe(r.slidingSystems![0].railStartMm);
    expect(polygonAreaMm2(slidingVolumes(s,0)[0].polygon)).toBe(s.widthMm*s.thicknessMm);
    expect(frontSpanFromResolved(d,r,d.fronts[0]).widthMm).toBe(r.slidingSystems![0].openingWidthMm);
  });
});
