import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadEngine} from './engine.mjs';
import {area,rect,erodeRectangle,rectangleUnionArea,serviceBox,translateAlongX,reflectModel} from './geometry.mjs';
import {buildPrototype,distributeWidths,manufacturingExport} from './prototype.mjs';
import {massKg,summarize,staticClashes,faceGaps} from './metrics.mjs';
import {screenHardware} from './hardware.mjs';
import {shelfReach} from './access.mjs';
const api=await loadEngine();

test('polygon erosion has independently calculated rectangular area',()=>assert.equal(area(erodeRectangle(rect(0,0,800,600),310,390)),490*210));
test('overlapping support rectangles are counted once',()=>assert.equal(rectangleUnionArea([[0,0,400,600],[200,0,600,600]]),600*600));
test('mass uses mm to m3 conversion and actual thickness',()=>{assert.ok(Math.abs(massKg(450,2276,25,800)-20.484)<1e-10);assert.ok(Math.abs(massKg(550,2276,18,650)-14.64606)<1e-10);});
test('allocation preserves all integer mm and leaf envelope',()=>{for(const span of [2310,1910,2430,1880])for(const max of [900,1100]){const a=distributeWidths(span,max);assert.equal(a.reduce((x,y)=>x+y,0),span);assert.ok(a.every(w=>w%2===0&&w<=max));}});
test('allocation never silently repairs invalid input',()=>{assert.throws(()=>distributeWidths(2311,1100));assert.throws(()=>buildPrototype(api,{fillerMm:-1}));assert.throws(()=>buildPrototype(api,{maxLeafMm:249}));});
test('translation visits aliased geometry only once; reflection preserves volume',()=>{
  const v=[100,2,3],p={worldPositionMm:v,boxSizeMm:[10,20,30],rotationYRad:0};
  const m={panels:[p],cells:[],bays:[],doors:[],drawers:[{frontWorldPositionMm:v,organizerPanels:[p],wallAxis:'A'}]};
  translateAlongX(m,70);assert.equal(v[0],170);const r=reflectModel(m);assert.deepEqual(r.panels[0].worldPositionMm,[3,2,170]);assert.equal(r.panels[0].boxSizeMm.reduce((a,b)=>a*b),6000);
});
test('sealed service box is six non-overlapping solids with exact net void',()=>{
  const panels=serviceBox('s',670,670,2400,18,8);assert.equal(panels.length,6);assert.deepEqual(staticClashes(api,{panels}),[]);
  const solid=panels.reduce((s,p)=>s+p.boxSizeMm.reduce((a,b)=>a*b),0);assert.equal(solid+644*644*2364,670*670*2400);
});
for(const kind of ['diagonal','asymmetric'])for(const fillerMm of [40,70,100])for(const layout of ['shelf','hanging']) {
  test(`${kind}/${fillerMm}/${layout}: independent cabinets, closed solids and immutable source`,()=>{
    const original=api.designSignature(api.phase5Example(kind)),p=buildPrototype(api,{kind,fillerMm,layout}),q=buildPrototype(api,{kind,fillerMm,layout});
    assert.equal(api.designSignature(p.model),api.designSignature(q.model));assert.equal(api.designSignature(api.phase5Example(kind)),original);
    assert.deepEqual(staticClashes(api,p.model),[]);assert.deepEqual(api.initialMotionConflicts(p.scene),[]);
    assert.deepEqual(faceGaps(api,p.context,p.model),[],'External drawer fronts plus full-depth fixed panel edges must close the face');
    for(const [i,r]of p.placements.entries()) {
      assert.equal(r.startMm+r.moduleWidthsMm.reduce((a,b)=>a+b,0)+20,p.context.runs[i].lengthMm);
      assert.equal(p.componentDesigns[i].runs[0].startFillerMm,0);api.normalizeAndValidateDesign(p.componentDesigns[i]);
    }
    assert.ok(p.model.doors.every(d=>d.widthMm<=p.parameters.leafLimit&&Number.isInteger(d.widthMm)));
    assert.ok(p.model.panels.every(p=>[p.cutWidthMm,p.cutHeightMm,p.cutThicknessMm].every(Number.isInteger)));
    assert.ok(p.model.drawers.every(d=>!d.isInternalDrawer));assert.ok(p.model.panels.filter(p=>p.role==='hangingRod').every(p=>p.worldPositionMm[1]===1700));
  });
}
test('shelf and drawer capacities equal independently summed clear cell solids',()=>{
  const p=buildPrototype(api),s=summarize(api,p),t=p.parameters.t;
  const expectedShelf=p.placements.slice(0,1).flatMap(r=>r.moduleWidthsMm.slice(1)).reduce((v,w)=>v+(w-2*t)*(592+5*577),0)+p.placements[1].moduleWidthsMm.reduce((v,w)=>v+(w-2*t)*(592+4*577),0);
  assert.equal(s.metrics.shelfMm2,expectedShelf);assert.equal(s.metrics.rodRawMm,770-36);assert.equal(s.metrics.rodUsableMm,770-36-40);
  assert.ok(s.metrics.accessibleShelfMm2<=s.metrics.shelfMm2);assert.ok(s.metrics.netStorageMm3<s.metrics.moduleBodyMm3);
  assert.ok(s.drawers.every(d=>d.returnedClosed&&d.reachedMm===d.requestedMm));assert.equal(s.metrics.independentModules,5);
  assert.ok(s.operatingCycles.every(c=>c.closedAgain&&c.drawers.every(d=>d.reachedFraction===1)));
});
test('overly narrow modules fail the 480mm hanger scenario instead of stretching leaves',()=>{
  const p=buildPrototype(api,{maxLeafMm:250}),c=p.model.cells.find(c=>c.insert?.type==='hangingRod'),a=p.model.analysis.functionalAccess.find(a=>a.id===c.id);
  const r=shelfReach(api,p.context,p.model,p.scene,c,a);assert.ok(c.netWidthMm<480);assert.equal(r.accessibleRodCenterMm,0);assert.equal(r.status,'BLOCKED');
});
test('solid door blocker removes straight shelf reach; aperture alone cannot pass',()=>{
  const p=buildPrototype(api),c=p.model.cells.find(c=>c.isLeaf&&c.insert?.type!=='drawerBank'&&c.insert?.type!=='hangingRod'),a=p.model.analysis.functionalAccess.find(a=>a.id===c.id);
  const scene={...p.scene,staticVolumes:[...p.scene.staticVolumes,{id:'negative-block',polygon:rect(c.worldCenterMm[0]-c.netWidthMm/2,600,c.netWidthMm,30),y0:0,y1:2400}]};
  const result=shelfReach(api,p.context,p.model,scene,c,a);assert.equal(result.accessibleMm2,0);assert.equal(result.status,'BLOCKED');
});
test('H1 movement is unknown and cannot inherit H5 access; unsupported 25mm hardware is rejected',()=>{
  const s=summarize(api,buildPrototype(api,{kind:'asymmetric',mechanism:'H1'}));
  assert.equal(s.simulation,'NOT_MODELED');assert.equal(s.metrics.accessibleShelfMm2,null);assert.equal(s.sequence,null);assert.ok(s.reach.every(r=>r.status==='NOT_MODELED'));
  const screen=screenHardware([{id:'bad',widthMm:240,heightMm:2276,thicknessMm:26,panelMassKgRange:[1,2]}],'H1')[0];
  assert.equal(screen.widthScreen,'FAIL');assert.equal(screen.thicknessScreen,'FAIL');assert.equal(screen.kinematics,'HARDWARE_KINEMATICS_UNVERIFIED');
});
test('experimental model has no manufacturing or import approval',()=>{assert.throws(()=>manufacturingExport(),/NOT_APPROVED/);const p=buildPrototype(api);assert.equal(p.geometryContract.storeImportAllowed,false);assert.equal(p.geometryContract.productionApproval,'NOT_APPROVED');});
