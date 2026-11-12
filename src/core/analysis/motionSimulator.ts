import type { Design, ResolvedModel } from '../schema/types';
import { buildMotionScene,constrainMotion,type MotionPositions,type MotionScene,type MotionStop } from './motionConstraints';

interface ManualStop {
  requested: number;
  blockerPosition: number;
}

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
  private manualStops = new Map<string, ManualStop>();
  private closingDrawerId: string | null = null;
  load(design:Design,model:ResolvedModel) {
    if(this.model===model)return;
    this.model=model;this.scene=buildMotionScene(design,model);
    this.positions={};this.targets={};this.velocities={};this.stops={};this.flags={};this.draggingId=null;
    this.manualStops.clear();
    this.closingDrawerId = null;
    for(const p of this.scene.parts){this.positions[p.id]=p.home;this.targets[p.id]=p.home;this.flags[p.id]=false;}
  }
  dragTo(id:string,requested:number):MotionStop {
    const result=constrainMotion(this.scene,this.positions,id,requested);
    this.positions[id]=result.position;this.targets[id]=result.position;this.velocities[id]=0;
    if(result.blocked)this.stops[id]=result;else delete this.stops[id];
    this.rememberManualStop(id, requested, result);
    if (this.closingDrawerId && this.positions[this.closingDrawerId] === 0) this.closingDrawerId = null;
    return result;
  }

  private rememberManualStop(id: string, requested: number, result: MotionStop) {
    const blocker = result.blockerId;
    if (result.blocked && blocker && this.positions[blocker] !== undefined) {
      this.manualStops.set(id, { requested, blockerPosition: this.positions[blocker] });
    } else {
      this.manualStops.delete(id);
    }
  }

  private refreshManualStops() {
    for (const [id, saved] of this.manualStops) {
      const blocker = this.stops[id]?.blockerId;
      if (!blocker || this.draggingId === id || this.draggingId === blocker) continue;
      if (this.positions[blocker] === saved.blockerPosition || this.velocities[blocker] !== 0) continue;
      const current = constrainMotion(this.scene, this.positions, id, saved.requested);
      // Recheck the warning at the new obstacle pose. A previous drag never resumes by itself.
      if (current.blocked) this.stops[id] = current;
      else delete this.stops[id];
      this.rememberManualStop(id, saved.requested, current);
    }
  }

  motionNotice(): { id: string; reason: string; blockerId?: string } | null {
    const closingId = this.closingDrawerId;
    if (closingId) {
      const drawer = this.model?.drawers.find(item => item.id === closingId);
      const stop = this.stops[closingId];
      if (drawer && stop?.blockerId && this.scene.parts.some(part => part.id === stop.blockerId && part.kind === 'sliding')) {
        const remaining = Math.max(1, Math.round(this.positions[closingId] * drawer.maxSlideMm));
        return { id: closingId, blockerId: stop.blockerId,
          reason: `${drawer.label} kapanmadı, ${remaining} mm açık. ${stop.blockerLabel} kanadını geri park edin. Çekmece tamamen kapanınca kanadı kapatın.` };
      }
      if (drawer && this.positions[closingId] > 0 && !stop) {
        return { id: closingId, reason: `${drawer.label} kapanıyor. Kanadı kapatmadan önce bekleyin.` };
      }
    }
    const stopped = Object.entries(this.stops).find(([, result]) => result.blocked && result.reason);
    if (stopped) return { id: stopped[0], reason: stopped[1].reason!, blockerId: stopped[1].blockerId };
    if (closingId && this.positions[closingId] === 0) {
      return { id: closingId, reason: 'Çekmece kapandı. Sürgü kanadını kapatabilirsiniz.' };
    }
    return null;
  }

  step(deltaSeconds:number,doors:Record<string,boolean>,drawers:Record<string,boolean>) {
    const dt=Math.min(.035,Math.max(0,deltaSeconds));
    for(const part of this.scene.parts) {
      const flag=Boolean((part.kind==='drawer'?drawers:doors)[part.id]);
      const newCommand = this.flags[part.id] !== flag;
      if(part.kind!=='sliding'||newCommand) this.targets[part.id]=flag?part.open:0;
      if (newCommand) {
        delete this.stops[part.id];
        this.manualStops.delete(part.id);
        if (part.id === this.closingDrawerId && flag) this.closingDrawerId = null;
      }
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
    this.refreshManualStops();
    for (const [id, stop] of Object.entries(this.stops)) {
      if (this.targets[id] !== 0 || this.flags[id] || this.positions[id] <= 0) continue;
      if (this.scene.parts.some(part => part.id === id && part.kind === 'drawer') &&
          this.scene.parts.some(part => part.id === stop.blockerId && part.kind === 'sliding')) {
        this.closingDrawerId = id;
        break;
      }
    }
  }
}
