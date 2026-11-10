import type { Design, ResolvedModel } from '../schema/types';
import { buildMotionScene,constrainMotion,type MotionPositions,type MotionScene,type MotionStop } from './motionConstraints';

/** Geçici hareket durumu Design/Undo'dan ayrıdır. React yeniden çizimi gerektirmez. */
export class MotionSimulator {
  scene:MotionScene={parts:[],staticVolumes:[]};
  positions:MotionPositions={};
  targets:MotionPositions={};
  velocities:MotionPositions={};
  stops:Record<string,MotionStop>={};
  draggingId:string|null=null;
  private model:ResolvedModel|null=null;
  private flags:Record<string,boolean>={};
  load(design:Design,model:ResolvedModel) {
    if(this.model===model)return;
    this.model=model;this.scene=buildMotionScene(design,model);
    this.positions={};this.targets={};this.velocities={};this.stops={};this.flags={};this.draggingId=null;
    for(const p of this.scene.parts){this.positions[p.id]=p.home;this.targets[p.id]=p.home;this.flags[p.id]=false;}
  }
  dragTo(id:string,requested:number):MotionStop {
    const result=constrainMotion(this.scene,this.positions,id,requested);
    this.positions[id]=result.position;this.targets[id]=result.position;this.velocities[id]=0;
    if(result.blocked)this.stops[id]=result;else delete this.stops[id];
    return result;
  }
  step(deltaSeconds:number,doors:Record<string,boolean>,drawers:Record<string,boolean>) {
    const dt=Math.min(.035,Math.max(0,deltaSeconds));
    for(const part of this.scene.parts) {
      const flag=Boolean((part.kind==='drawer'?drawers:doors)[part.id]);
      if(part.kind!=='sliding'||this.flags[part.id]!==flag) this.targets[part.id]=flag?part.open:0;
      this.flags[part.id]=flag;
      if(this.draggingId===part.id)continue;
      if(part.kind==='drawer'&&flag) {
        const drawer=this.model?.drawers.find(d=>d.id===part.id);
        // Let commanded hinges settle, then test the actual drawer path at the achieved pose.
        if(drawer?.coveringDoorIds.some(id=>doors[id] && this.scene.parts.some(p=>p.id===id&&p.kind==='hinged')
          && (this.velocities[id]??0)>0.0001)) {this.velocities[part.id]=0;continue;}
      }
      const old=this.positions[part.id]??part.home,target=this.targets[part.id]??part.home;
      const span=Math.max(1,part.max-part.min),omega=part.kind==='drawer'?8.5:8.2;
      if(Math.abs(old-target)<span*.00005&&Math.abs(this.velocities[part.id]??0)<span*.0001){
        if(Math.abs(old-target)>1e-9){const last=constrainMotion(this.scene,this.positions,part.id,target);this.positions[part.id]=last.position;if(last.blocked)this.stops[part.id]=last;else delete this.stops[part.id];}
        this.velocities[part.id]=0;continue;
      }
      const velocity=(this.velocities[part.id]??0)+((target-old)*omega*omega-2*omega*(this.velocities[part.id]??0))*dt;
      const requested=Math.max(part.min,Math.min(part.max,old+velocity*dt));
      const result=constrainMotion(this.scene,this.positions,part.id,requested);
      this.positions[part.id]=result.position;this.velocities[part.id]=result.blocked?0:velocity;
      if(result.blocked)this.stops[part.id]=result;else delete this.stops[part.id];
    }
  }
}
