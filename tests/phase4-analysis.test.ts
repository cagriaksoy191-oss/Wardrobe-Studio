import { beforeEach, describe, expect, it } from 'vitest';
import type { Design, RoomObstacle } from '../src/core/schema/types';
import { createBlankDesign, SAMPLE_DESIGNS } from '../src/core/presets/sampleDesigns';
import { normalizeAndValidateDesign } from '../src/core/schema/designSchema';
import { solveDesign } from '../src/core/solver/carcassSolver';
import { doorFootprint, polygonAreaMm2, polygonBounds } from '../src/core/analysis/kinematics';
import { resolveInventory } from '../src/core/analysis/inventory';
import { eyeCameraPose, limitsForOwner } from '../src/core/analysis/studioAnalysis';
import { useWardrobeStore } from '../src/store/useWardrobeStore';

function oneBay():Design {
  const d=createBlankDesign({layoutKind:'straight',heightMm:2400});
  d.runs[0].lengthMm=1000; d.runs[0].endFillerMm=0; d.runs[0].bays=[d.runs[0].bays[0]];
  d.runs[0].bays[0].root={kind:'leaf',id:'one-cell',owner:'ortak',insert:{type:'hangingRod',rodHeightMm:1000}};
  return d;
}
function doorObstacle(d:Design):RoomObstacle {
  const door=solveDesign(d).doors[0], b=polygonBounds(doorFootprint(door,1));
  return {id:'test-bed',label:'Test yatağı',kind:'bed',positionMm:[Math.round((b.minX+b.maxX)/2)-25,0,Math.round((b.minZ+b.maxZ)/2)-25],sizeMm:[50,1000,50],rotationDeg:0};
}
describe('Phase 4 — personal use, capacity, placement and commands',()=>{
  beforeEach(()=>{useWardrobeStore.getState().endHistoryTransaction();useWardrobeStore.getState().loadPreset('straight-wardrobe');});
  it('updates reach from height profiles and uses the shorter profile for common storage',()=>{
    const d=oneBay();d.ergonomics={anne:{heightMm:1500},baba:{heightMm:1900}};
    expect(limitsForOwner(d,'ortak').dailyReachMm).toBe(1575);
    const leaf=d.runs[0].bays[0].root;if(leaf.kind==='leaf')leaf.insert!.rodHeightMm=1800;
    expect(solveDesign(d).analysis?.reach[0].zone).toBe('assisted');
    d.ergonomics.anne.heightMm=1900;
    expect(solveDesign(d).analysis?.reach[0].zone).toBe('comfortable');
  });
  it('persists profile settings and propagates a bay owner to existing leaf overrides',()=>{
    const s=useWardrobeStore.getState();s.setPersonProfile('anne',{heightMm:1590});s.setBayOwner('run-A','bay-S2','anne');
    expect(useWardrobeStore.getState().resolved.cells.filter(c=>c.bayId==='bay-S2').every(c=>c.owner==='anne')).toBe(true);
    const exported=useWardrobeStore.getState().exportJsonString();
    expect(normalizeAndValidateDesign(JSON.parse(exported)).ergonomics?.anne.heightMm).toBe(1590);
    s.undo();expect(useWardrobeStore.getState().design.runs[0].bays[1].owner).not.toBe('anne');
    const beforeInvalid=useWardrobeStore.getState().exportJsonString();
    const historyCount=useWardrobeStore.getState().historyPast.length;
    s.setPersonProfile('anne',{dailyReachMm:2600});
    expect(useWardrobeStore.getState().exportJsonString()).toBe(beforeInvalid);
    s.setPersonProfile('anne',{upperReachMm:1500});
    expect(useWardrobeStore.getState().exportJsonString()).toBe(beforeInvalid);
    expect(useWardrobeStore.getState().historyPast).toHaveLength(historyCount);
    expect(useWardrobeStore.getState().commandError).toContain('Günlük erişim');
  });
  it('derives eye cameras at each saved person eye height without modifying design coordinates',()=>{
    const d=oneBay();d.ergonomics={anne:{heightMm:1600},baba:{heightMm:1800}};
    const before=JSON.stringify(d),a=eyeCameraPose(d,'anne'),b=eyeCameraPose(d,'baba');
    expect(a.positionMm[1]).toBe(1488);expect(b.positionMm[1]).toBe(1674);
    expect(a.positionMm[1]).toBe(a.targetMm[1]);expect(JSON.stringify(d)).toBe(before);
  });
  it('does not count common hanging capacity twice across two owners',()=>{
    const d=oneBay();d.inventory=[{id:'a',kind:'shirts',owner:'anne',quantity:15},{id:'b',kind:'shirts',owner:'baba',quantity:15}];
    const report=solveDesign(d).analysis!.inventory;
    expect(report.map(r=>r.capacity)).toEqual([20,20]);
    expect(report.map(r=>r.allocated)).toEqual([15,5]);expect(report[1].shortfall).toBe(10);
  });
  it('uses physical garment height/depth rather than scaled preview counts',()=>{
    const d=oneBay();d.inventory=[{id:'a',kind:'shirts',owner:'anne',quantity:10}];
    const before=solveDesign(d).analysis!.inventory[0].capacity;
    d.interiorItems={enabled:false,density:'full'};
    const leaf=d.runs[0].bays[0].root;if(leaf.kind==='leaf'){leaf.insert!.itemPreset='shirts';leaf.insert!.itemCountOverride=40;}
    expect(solveDesign(d).analysis!.inventory[0].capacity).toBe(before);
    d.runs[0].depthMm=500;
    expect(solveDesign(d).analysis!.inventory[0].capacity).toBe(0);
    d.runs[0].depthMm=600;d.inventory[0].kind='longClothes';
    expect(solveDesign(d).analysis!.inventory[0].capacity).toBe(0);
  });
  it('respects custom physical item dimensions and rotated rectangular storage',()=>{
    const d=oneBay();const leaf=d.runs[0].bays[0].root;if(leaf.kind==='leaf')leaf.insert={type:'empty'};
    d.inventory=[{id:'case',kind:'suitcases',owner:'ortak',quantity:10,widthMm:550,depthMm:900,heightMm:1000}];
    const r=solveDesign(d).analysis!.inventory[0];expect(r.capacity).toBe(2);expect(r.allocated).toBe(2);
    d.inventory[0].heightMm=3000;expect(solveDesign(d).analysis!.inventory[0].capacity).toBe(0);
  });
  it('uses the actual pentagon area and not a rectangular or 0.72 approximation',()=>{
    const d=structuredClone(SAMPLE_DESIGNS['l-diagonal-asymmetric']),r=solveDesign(d);
    r.cells=r.cells.filter(c=>c.cornerJunctionId);r.drawers=[];
    const report=resolveInventory(d,r),area=polygonAreaMm2(r.cells[0].polygonXZMm!);
    expect(report.metrics.ortak.shelfAreaMm2).toBe(area*r.cells.length);
    expect(report.metrics.ortak.storageVolumeMm3).toBe(r.cells.reduce((s,c)=>s+area*c.netHeightMm,0));
  });
  it('detects an obstacle in a rotated door sweep and ignores objects above its height',()=>{
    const d=structuredClone(SAMPLE_DESIGNS['straight-wardrobe']);d.obstacles=[doorObstacle(d)];
    expect(solveDesign(d).issues.some(i=>i.code==='OBSTACLE_DOOR_SWEEP')).toBe(true);
    d.obstacles[0].positionMm[1]=3000;
    expect(solveDesign(d).issues.some(i=>i.code.startsWith('OBSTACLE_'))).toBe(false);
  });
  it('detects full drawer extension against a bed using the drawer travel direction',()=>{
    const d=structuredClone(SAMPLE_DESIGNS['straight-wardrobe']),r=solveDesign(d),drawer=r.drawers[0];
    d.obstacles=[{id:'drawer-bed',label:'Yatak ucu',kind:'bed',positionMm:[drawer.frontWorldPositionMm[0]-20,drawer.yStartMm,drawer.frontWorldPositionMm[2]+drawer.maxSlideMm-20],sizeMm:[40,100,40],rotationDeg:0}];
    expect(solveDesign(d).issues.some(i=>i.code==='OBSTACLE_DRAWER_SWEEP')).toBe(true);
  });
  it('detects a column in the body and an inward-opening room door in the approach area',()=>{
    const d=structuredClone(SAMPLE_DESIGNS['straight-wardrobe']);
    d.obstacles=[{id:'pillar',label:'Kolon',kind:'pillar',positionMm:[200,0,100],sizeMm:[100,2500,100],rotationDeg:0},
      {id:'door',label:'Oda kapısı',kind:'roomDoor',positionMm:[1000,0,1000],sizeMm:[900,2100,40],rotationDeg:180,openingAngleDeg:90,hingeSide:'left'}];
    const r=solveDesign(d);expect(r.issues.some(i=>i.code==='ROOM_OBSTACLE_BODY')).toBe(true);expect(r.issues.some(i=>i.code==='ROOM_DOOR_ACCESS_CONFLICT')).toBe(true);
  });
  it('adds, edits, persists and undoes obstacles',()=>{
    const s=useWardrobeStore.getState();s.saveCheckpoint();s.addRoomObstacle('bed');
    const id=useWardrobeStore.getState().design.obstacles![0].id;
    s.updateRoomObstacle(id,{positionMm:[1000.4,0,1800.7]});
    expect(useWardrobeStore.getState().design.obstacles![0].positionMm).toEqual([1000,0,1801]);
    expect(normalizeAndValidateDesign(JSON.parse(useWardrobeStore.getState().exportJsonString())).obstacles).toHaveLength(1);
    s.undo();expect(useWardrobeStore.getState().design.obstacles![0].positionMm).toEqual([400,0,900]);
    s.undo();expect(useWardrobeStore.getState().design.obstacles).toBeUndefined();
  });
  it('applies a suggested obstacle move atomically, clears the collision, and supports Undo',()=>{
    const s=useWardrobeStore.getState();s.addRoomObstacle('bed');s.saveCheckpoint();
    const before=useWardrobeStore.getState().exportJsonString();
    const issue=useWardrobeStore.getState().resolved.issues.find(i=>i.quickFixes?.some(f=>f.kind==='moveObstacle'))!;
    expect(issue).toBeDefined();expect(s.applyQuickFix(issue.quickFixes![0])).toBe(true);
    expect(useWardrobeStore.getState().historyPast).toHaveLength(1);
    expect(useWardrobeStore.getState().resolved.analysis!.collidingObstacleIds).toHaveLength(0);
    s.undo();expect(useWardrobeStore.getState().exportJsonString()).toBe(before);
  });
  it('offers a reversible 155 degree hinge fix for internal drawers',()=>{
    const s=useWardrobeStore.getState();s.loadPreset('l-diagonal-asymmetric');s.saveCheckpoint();
    const issue=useWardrobeStore.getState().resolved.issues.find(i=>i.code==='INTERNAL_DRAWER_HINGE_CONFLICT')!;
    expect(s.applyQuickFix(issue.quickFixes![0])).toBe(true);
    expect(useWardrobeStore.getState().resolved.issues.some(i=>i.code==='INTERNAL_DRAWER_HINGE_CONFLICT')).toBe(false);
    s.undo();expect(useWardrobeStore.getState().resolved.issues.some(i=>i.code==='INTERNAL_DRAWER_HINGE_CONFLICT')).toBe(true);
  });
  it('lowers an inaccessible rod to the profile limit as one reversible command',()=>{
    const d=oneBay();d.ergonomics={anne:{heightMm:1200},baba:{heightMm:1800}};
    const root=d.runs[0].bays[0].root;if(root.kind==='leaf')root.insert!.rodHeightMm=2000;
    const s=useWardrobeStore.getState();expect(s.importJsonString(JSON.stringify(d)).ok).toBe(true);s.saveCheckpoint();
    const fix=useWardrobeStore.getState().resolved.issues.find(i=>i.code==='ERGONOMIC_HANGING_HIGH')!.quickFixes![0];
    expect(s.applyQuickFix(fix)).toBe(true);
    expect(useWardrobeStore.getState().resolved.panels.find(p=>p.role==='hangingRod')!.worldPositionMm[1]).toBe(1260);
    expect(useWardrobeStore.getState().historyPast).toHaveLength(1);s.undo();
    expect(useWardrobeStore.getState().resolved.panels.find(p=>p.role==='hangingRod')!.worldPositionMm[1]).toBe(2098);
  });
  it.each(['deepYukluk','jewelryDrawer','trouserRack','laundryBasket'] as const)('builds %s from existing cell primitives and round-trips through JSON',template=>{
    const s=useWardrobeStore.getState();s.saveCheckpoint();s.applyStorageTemplate(template,'bay-S1');
    const state=useWardrobeStore.getState();expect(state.commandError).toBeNull();expect(state.historyPast).toHaveLength(1);
    expect(state.resolved.cells.some(c=>c.insert?.storageTemplate===template)).toBe(true);
    expect(normalizeAndValidateDesign(JSON.parse(state.exportJsonString()))).toEqual(state.design);
    if(template==='jewelryDrawer')expect(state.resolved.drawers.every(d=>!d.cellId.startsWith('cell-s2')?d.organizerPanels!.length===11:true)).toBe(true);
    if(template==='trouserRack')expect(state.resolved.panels.filter(p=>p.id.includes('trouser-rod')) .length).toBeGreaterThan(3);
    s.undo();expect(useWardrobeStore.getState().design.runs[0].bays[0]).toEqual(SAMPLE_DESIGNS['straight-wardrobe'].runs[0].bays[0]);
  });
  it('stages L rods at distinct world heights even with different plinth heights',()=>{
    const d=structuredClone(SAMPLE_DESIGNS['l-diagonal-asymmetric']);d.runs[0].plinthHeightMm=280;
    const s=useWardrobeStore.getState();s.importJsonString(JSON.stringify(d));s.applyStorageTemplate('steppedLHanging','bay-A1');
    const rods=useWardrobeStore.getState().resolved.panels.filter(p=>p.role==='hangingRod'&&(p.bayId==='bay-A1'||p.bayId==='bay-B1'));
    expect(rods).toHaveLength(2);expect(Math.abs(rods[0].worldPositionMm[1]-rods[1].worldPositionMm[1])).toBe(200);
  });
  it('creates a blind-corner luggage layout with explicit restricted access information',()=>{
    const s=useWardrobeStore.getState();s.loadPreset('l-blind-corner');s.applyStorageTemplate('blindLuggage','bay-blind-A1');
    const cells=useWardrobeStore.getState().resolved.cells.filter(c=>c.insert?.storageTemplate==='blindLuggage');
    expect(cells.length).toBeGreaterThan(0);expect(cells.every(c=>c.accessOpeningWidthMm!==undefined)).toBe(true);
  });
  it('copies with fresh cell IDs, retains outside widths, and mirrors internal left/right structure',()=>{
    const s=useWardrobeStore.getState();s.loadPreset('l-diagonal-asymmetric');s.saveCheckpoint();
    const before=useWardrobeStore.getState().design.runs[0].lengthMm;
    const sourceIds=new Set(useWardrobeStore.getState().resolved.cells.map(c=>c.id));
    s.copyBay('bay-A1','run-A',true);
    const state=useWardrobeStore.getState(),newBay=state.design.runs[0].bays.at(-1)!;
    expect(state.commandError).toBeNull();expect(state.design.runs[0].lengthMm).toBe(before+920);
    expect(state.resolved.cells.filter(c=>c.bayId===newBay.id).every(c=>!sourceIds.has(c.id))).toBe(true);
    if(newBay.root.kind==='split'&&newBay.root.children[0].node.kind==='split') {
      const right=newBay.root.children[0].node.children.at(-1)!.node;
      expect(right.kind==='leaf'&&right.insert?.type).toBe('serviceNiche');
    }
    expect(state.historyPast).toHaveLength(1);s.undo();expect(useWardrobeStore.getState().design.runs[0].lengthMm).toBe(before);
  });
  it('rejects isolated copying of a shared multi-bay front without losing the design',()=>{
    const s=useWardrobeStore.getState();s.setFrontBaySpan('bay-S1',['bay-S1','bay-S2']);const before=useWardrobeStore.getState().exportJsonString();
    s.copyBay('bay-S1','run-A');expect(useWardrobeStore.getState().exportJsonString()).toBe(before);expect(useWardrobeStore.getState().commandError).toContain('Ortak kapak');
  });
});
