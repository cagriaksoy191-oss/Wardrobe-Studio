import {it,expect} from 'vitest';
import {MotionSimulator} from '../src/core/analysis/motionSimulator';
import {exactRectangle} from '../src/core/analysis/kinematics';
import {phase5Example} from '../src/core/presets/phase5Examples';
import {solveDesign} from '../src/core/solver/carcassSolver';
import {buildMotionScene,constrainMotion,initialMotionConflicts} from '../src/core/analysis/motionConstraints';
import {doorFootprint,polygonBounds} from '../src/core/analysis/kinematics';
import {extractProduction} from '../src/core/production/productionModel';
it('does not snap the final spring increment through a nearby physical contact',()=>{
  const sim=new MotionSimulator();sim.scene={parts:[{id:'moving',label:'Kanat',kind:'sliding',min:0,max:20000,home:0,open:20000,translation:[1,0],ignoredStaticIds:new Set(),volumes:p=>[{polygon:exactRectangle(p,0,10,10),y0:0,y1:100}]}],staticVolumes:[{id:'post',label:'Engel',polygon:exactRectangle(10000,0,1,10),y0:0,y1:100}]};
  sim.positions={moving:0};sim.targets={moving:0};sim.step(0,{},{});sim.positions.moving=9989.95;sim.targets.moving=9990.04;sim.velocities.moving=0;sim.step(1/60,{},{});
  expect(sim.positions.moving).toBeLessThanOrEqual(9989.95+.0001);expect(sim.stops.moving.blockerId).toBe('post');
});
it('starts symmetric and asymmetric L corner doors without overlap and stops at the adjacent real leaf',()=>{
  for(const kind of ['diagonal','asymmetric']as const){const d=phase5Example(kind),r=solveDesign(d),scene=buildMotionScene(d,r),corner=r.doors.find(d=>d.isCornerDoor)!;
    expect(initialMotionConflicts(scene)).toEqual([]);const result=constrainMotion(scene,{},corner.id,1);expect(result.blocked).toBe(true);expect(result.blockerId).toBe('door-bay-B1-left');expect(result.position).toBeGreaterThan(0);expect(result.position).toBeLessThan(.2);
    const panel=r.panels.find(p=>p.animatedUnitId===corner.id)!,bounds=polygonBounds(doorFootprint(corner,0));expect(panel.worldPositionMm[0]).toBeCloseTo((bounds.minX+bounds.maxX)/2,8);expect(panel.worldPositionMm[2]).toBeCloseTo((bounds.minZ+bounds.maxZ)/2,8);
  }
});
it('detects closed sliding overlap as a critical production error',()=>{
  const d=phase5Example('straight');d.fronts[0].sliding!.trackIndices=[0,0,2];const r=solveDesign(d);expect(r.issues.some(i=>i.code==='MOTION_INITIAL_INTERSECTION')).toBe(true);expect(extractProduction(d,r).status).toBe('blocked');
});
it('keeps 25/4 drawer back and front faces outside the back panel and bottom slab',()=>{
  const d=phase5Example('asymmetric'),r=solveDesign(d),drawer=r.drawers[0];
  expect(drawer.backPanelWorldPositionMm[2]-drawer.backPanelBoxSizeMm[2]/2).toBe(4);
  expect(drawer.frontWorldPositionMm[1]-drawer.frontBoxSizeMm[1]/2).toBe(drawer.yStartMm);
  const bodyBottom=r.panels.find(p=>p.id===`${drawer.bayId}-bottom`)!;expect(bodyBottom.worldPositionMm[1]+bodyBottom.boxSizeMm[1]/2).toBe(drawer.yStartMm);
});
