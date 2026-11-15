import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadEngine} from '../d3/engine.mjs';
import {staticClashes,faceGaps} from '../d3/metrics.mjs';
import {rect} from '../d3/geometry.mjs';
import {buildB3,moventoDimensions,exportManufacturing} from './prototype.mjs';
import {measureB3,drawerNet} from './measure.mjs';
import {auditOverlaps} from './overlap-audit.mjs';
const api=await loadEngine();
test('MOVENTO SKW is INNER width; 15mm side creates LW-12 external box',()=>{
  const x=moventoDimensions(828);assert.equal(x.innerWidth,786);assert.equal(x.outerWidth,816);assert.equal(x.outerLength,490);assert.equal(x.innerDepth,460);assert.equal(x.mountDepth,503);
});
test('unsupported side stock and non-NL500 never silently normalized',()=>{
  assert.throws(()=>moventoDimensions(828,{side:18}));assert.throws(()=>moventoDimensions(828,{side:25}));assert.throws(()=>moventoDimensions(828,{nl:450}));
  assert.throws(()=>buildB3(api,{variant:'UNKNOWN'}));assert.throws(()=>buildB3(api,{strokeMm:501}));
});
for(const variant of ['SINGLE3','DUAL3','DUAL2']) {
  test(`${variant}: reproducible actual solids, unchanged canonical intent`,()=>{
    const before=api.designSignature(api.phase5Example('blind')),p=buildB3(api,{variant}),q=buildB3(api,{variant});
    assert.equal(api.designSignature(p.model),api.designSignature(q.model));assert.equal(api.designSignature(api.phase5Example('blind')),before);
    assert.deepEqual(staticClashes(api,p.model),[]);assert.deepEqual(api.initialMotionConflicts(p.scene),[]);assert.deepEqual(faceGaps(api,p.context,p.model),[]);
    assert.deepEqual(p.context.runs.map(r=>r.lengthMm),[3000,2600]);assert.deepEqual(p.context.runs.map(r=>r.depthMm),[600,600]);
    assert.equal(p.model.slidingDoors.length,0);assert.equal(p.model.slidingSystems.length,0);
    assert.ok(p.model.panels.every(p=>[p.cutWidthMm,p.cutHeightMm,p.cutThicknessMm].every(Number.isInteger)));
  });
  test(`${variant}: fronts, real boxes and independent thin sides`,()=>{
    const p=buildB3(api,{variant}),n=variant==='SINGLE3'?3:variant==='DUAL3'?6:4;
    assert.equal(p.model.drawers.length,n);
    assert.equal(p.model.drawers.reduce((v,d)=>v+drawerNet(d),0),{SINGLE3:180601560,DUAL3:361668360,DUAL2:409089520}[variant]);
    for(const d of p.model.drawers) {
      const c=p.model.cells.find(c=>c.id===d.cellId);assert.equal(d.innerWidthMm,c.netWidthMm-42);assert.equal(d.innerDepthMm,460);
      assert.equal(d.sideThicknessMm,15);assert.equal(d.bottomThicknessMm,8);assert.equal(d.research.mountDepth,503);
      assert.equal(d.innerHeightMm,variant==='DUAL2'?287:171);assert.equal((c.netWidthMm-d.frontBoxSizeMm[0])/2,3);
      assert.ok(!d.isInternalDrawer);assert.ok(d.organizerPanels.some(p=>p.researchRole==='innerFront'));
      assert.equal(d.research.manufacturerStrokeMm,null);assert.ok(drawerNet(d)>0);
    }
    assert.ok(measureB3(api,p).drawerFaceSeamsMm.every(s=>s.gapMm===4));
  });
  test(`${variant}: all tested neighbor angles/order cycles preserve stroke and return home`,()=>{
    const s=measureB3(api,buildB3(api,{variant}));
    assert.ok(s.interactions.every(c=>c.closedAgain));assert.ok(s.interactions.every(c=>c.strokes?.every(d=>d.returnedClosed&&d.reachedMm>=d.requestedMm-.01)??true));
    assert.ok(s.metrics.accessibleRodCenterMm>0);assert.ok(s.reach.filter(r=>r.kind==='hanging').every(r=>r.detachmentPath==='NOT_MODELED'&&r.physicalStatus==='UNVERIFIED_PHYSICAL'));
    assert.equal(s.metrics.accessibleRodPhysicalMm,null);assert.equal(s.metrics.physicallyAccessibleVolumeMm3,null);assert.equal(s.classifications.production,'NOT_APPROVED');
  });
}
test('155-degree full-height version remains a rejected counterexample',()=>{
  const s=measureB3(api,buildB3(api,{variant:'DUAL3',blindOpeningLimitDeg:155}));
  assert.equal(s.classifications.systemSequence,'NO_GO');assert.ok(s.interactions.some(c=>!c.closedAgain));
  assert.ok(s.interactions.some(c=>c.strokes?.some(d=>d.reachedMm<20)));
});
test('unknown 500mm travel is only an explicit sensitivity target',()=>{
  const p=buildB3(api,{strokeMm:500});assert.ok(p.id.endsWith('STROKE500'));
  assert.ok(p.model.drawers.every(d=>d.maxSlideMm===500&&d.research.manufacturerStrokeMm===null));
});
test('synthetic room obstacle continuously limits drawer, reverse motion returns',()=>{
  const p=buildB3(api),d=p.model.drawers[0],c=d.frontWorldPositionMm;
  const scene={...p.scene,staticVolumes:[...p.scene.staticVolumes,{id:'synthetic-obstacle',polygon:rect(c[0]-500,700,1000,30),y0:0,y1:600}]};
  const stop=api.constrainMotion(scene,{},d.id,1);assert.ok(stop.blocked&&stop.position<1);
  const back=api.constrainMotion(scene,{[d.id]:stop.position},d.id,0);assert.equal(back.position,0);
});
test('overlap audit diagnoses all twenty positive volumes without changing cuts/source',()=>{
  const a=auditOverlaps(api);assert.equal(a.pairCount,20);assert.ok(a.pairs.every(p=>p.intersectionVolumeMm3>0));
  assert.equal(a.pairwiseVolumeSumMm3,133812.5);assert.deepEqual(a.copiedPositionCounterfactual.remainingClashes,[]);
  assert.ok(a.copiedPositionCounterfactual.cutDimensionsIdentical&&a.originalModelUnchanged);assert.equal(a.newP0,false);
  const first=a.pairs[0];assert.equal(first.axisAlignedOverlapMm.x,.5);assert.equal(first.intersectionVolumeMm3,7450);
});
test('no manufacturing gate or import approval exists',()=>{assert.throws(exportManufacturing,/NOT_APPROVED/);assert.equal(buildB3(api).geometryContract.storeImportAllowed,false);});
