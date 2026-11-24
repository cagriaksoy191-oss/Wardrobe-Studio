import type { Design, ResolvedModel } from '../schema/types';
import { planSafeRecovery, type RecoveryOffer, type RecoveryPlan, type RecoveryStatus } from './safeMotionRecovery';
import { buildMotionScene,createMotionConstraint,type MotionPositions,type MotionScene,type MotionStop } from './motionConstraints';

interface ManualStop {
  requested: number;
  blockerPosition: number;
}

/** Geçici hareket durumu Design/Undo'dan ayrıdır. React yeniden çizimi gerektirmez. */
export class MotionSimulator {
  private motionScene: MotionScene = { parts: [], staticVolumes: [] };
  private constrain = createMotionConstraint(this.motionScene);
  get scene(): MotionScene { return this.motionScene; }
  set scene(scene: MotionScene) {
    this.cancelRecovery('Sahne değişti. Güvenli sıra iptal edildi.');
    this.poseRevision++;
    this.offerCache = null;
    this.motionScene = scene;
    this.constrain = createMotionConstraint(scene);
  }
  positions:MotionPositions={};
  targets:MotionPositions={};
  velocities:MotionPositions={};
  stops:Record<string,MotionStop>={};
  draggingId:string|null=null;
  private model:ResolvedModel|null=null;
  private designId: string | null = null;
  private flags:Record<string,boolean>={};
  private manualStops = new Map<string, ManualStop>();
  private closingDrawerId: string | null = null;
  recovery: RecoveryStatus | null = null;
  private operationSerial = 0;
  private operation: { plan: RecoveryPlan; index: number; validated: boolean; elapsed: number; expected: MotionPositions } | null = null;
  // A cancelled transaction must stay at its achieved pose until a fresh manual command.
  private paused = new Set<string>();
  private poseRevision = 0;
  private offerCache: { revision: number; offer: RecoveryOffer } | null = null;
  private commandRevision: number | undefined;
  load(design:Design,model:ResolvedModel,options?:{clearRecoveryOnDesignChange?:boolean}) {
    if(this.model===model)return;
    const designChanged = this.designId !== null && this.designId !== design.id;
    if (!this.operation) this.recovery = null;
    this.designId = design.id;
    this.model=model;this.scene=buildMotionScene(design,model);
    if (designChanged && options?.clearRecoveryOnDesignChange) this.recovery = null;
    this.positions={};this.targets={};this.velocities={};this.stops={};this.flags={};this.draggingId=null;
    this.manualStops.clear();
    this.closingDrawerId = null;
    this.paused.clear();
    this.offerCache = null;
    this.poseRevision++;
    for(const p of this.scene.parts){this.positions[p.id]=p.home;this.targets[p.id]=p.home;this.flags[p.id]=false;}
  }
  dragTo(id:string,requested:number):MotionStop {
    this.cancelRecovery('Manuel hareket nedeniyle güvenli sıra iptal edildi.');
    this.paused.delete(id);
    const result=this.constrain(this.positions,id,requested);
    this.positions[id]=result.position;this.targets[id]=result.position;this.velocities[id]=0;
    if(result.blocked)this.stops[id]=result;else delete this.stops[id];
    this.rememberManualStop(id, requested, result);
    this.poseRevision++;
    if (this.closingDrawerId && this.positions[this.closingDrawerId] === 0) this.closingDrawerId = null;
    return result;
  }

  recoveryOffer(): RecoveryOffer {
    if (this.operation || this.draggingId || Object.values(this.velocities).some(value => value !== 0)) {
      return { reason: 'Hareketlerin durmasını bekleyin.' };
    }
    if (this.offerCache?.revision === this.poseRevision) return this.offerCache.offer;
    const offer = planSafeRecovery(this.scene, this.positions, this.stops);
    if (offer.plan) {
      const owned = new Set(offer.plan.steps.map(step => step.id));
      if (this.scene.parts.some(part => !owned.has(part.id) && this.targets[part.id] !== this.positions[part.id])) {
        delete offer.plan;
        offer.reason = 'Diğer hareketleri tamamlayın. Manuel hareket kullanabilirsiniz.';
      }
    }
    this.offerCache = { revision: this.poseRevision, offer };
    return offer;
  }

  startRecovery(plan = this.recoveryOffer().plan, commandRevision = this.commandRevision): boolean {
    if (this.operation || commandRevision !== this.commandRevision || !plan || plan.scene !== this.scene ||
        this.scene.parts.some(part => plan.positions[part.id] !== this.positions[part.id])) return false;
    const current = planSafeRecovery(this.scene, this.positions, this.stops).plan;
    if (!this.recoveryOffer().plan) return false;
    if (!current || JSON.stringify(current.steps) !== JSON.stringify(plan.steps)) return false;
    // Copy the preview. Neither later UI edits nor caller-owned arrays can modify this operation.
    const ownedPlan = { ...current, steps: current.steps.map(step => ({ ...step })), positions: { ...this.positions } };
    this.offerCache = null;
    this.operation = { plan: ownedPlan, index: 0, validated: false, elapsed: 0, expected: { ...this.positions } };
    for (const step of ownedPlan.steps) {
      this.paused.add(step.id);
      this.flags[step.id] = false;
      this.targets[step.id] = this.positions[step.id];
      this.velocities[step.id] = 0;
      delete this.stops[step.id];
      this.manualStops.delete(step.id);
    }
    this.recovery = { status: 'running', operationId: ++this.operationSerial,
      message: ownedPlan.steps[0].label, step: 1, total: ownedPlan.steps.length };
    return true;
  }

  cancelRecovery(message = 'Güvenli sıra iptal edildi.', failed = false) {
    if (!this.operation) return;
    for (const step of this.operation.plan.steps) {
      this.targets[step.id] = this.positions[step.id];
      this.velocities[step.id] = 0;
      this.paused.add(step.id);
    }
    this.operation = null;
    this.offerCache = null;
    this.closingDrawerId = null;
    this.recovery = { ...this.recovery!, status: failed ? 'failed' : 'cancelled', message };
    this.poseRevision++;
  }

  dismissRecovery() { this.recovery = null; }

  private prepareRecovery(delta: number) {
    const operation = this.operation;
    if (!operation) return;
    const step = operation.plan.steps[operation.index];
    if (this.scene !== operation.plan.scene || this.draggingId ||
        this.scene.parts.some(part => part.id !== step.id && this.positions[part.id] !== operation.expected[part.id])) {
      this.cancelRecovery('Konum veya sahne değişti. Güvenli sıra iptal edildi.', true);
      return;
    }
    operation.elapsed += delta;
    if (operation.elapsed > 10) {
      this.cancelRecovery('Parça gerçek hedefe ulaşamadı. Manuel hareket kullanın.', true);
      return;
    }
    if (!operation.validated) {
      const check = this.constrain(this.positions, step.id, step.target);
      if (check.blocked || check.position !== step.target) {
        this.cancelRecovery('Yeni engel nedeniyle güvenli sıra durdu. Manuel hareket kullanın.', true);
        return;
      }
      operation.validated = true;
      this.targets[step.id] = step.target;
    }
  }

  private advanceRecovery() {
    const operation = this.operation;
    if (!operation) return;
    const step = operation.plan.steps[operation.index];
    if (this.stops[step.id]?.blocked) {
      this.cancelRecovery('Hareket yeni bir engelde durdu. Manuel hareket kullanın.', true);
      return;
    }
    // The spring's constrained final snap must have actually settled, not just received a target.
    if (this.positions[step.id] !== step.target || this.velocities[step.id] !== 0) return;
    operation.expected[step.id] = step.target;
    operation.index++;
    operation.elapsed = 0;
    operation.validated = false;
    if (operation.index < operation.plan.steps.length) {
      this.recovery = { ...this.recovery!, step: operation.index + 1, message: operation.plan.steps[operation.index].label };
    } else {
      for (const item of operation.plan.steps) {
        this.paused.delete(item.id);
        delete this.stops[item.id];
        this.manualStops.delete(item.id);
      }
      this.closingDrawerId = null;
      this.operation = null;
      this.offerCache = null;
      this.recovery = { ...this.recovery!, status: 'completed', message: 'Güvenli sıra tamamlandı. İlgili çekmeceler ve sürgü kapandı.' };
    }
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
      const current = this.constrain(this.positions, id, saved.requested);
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

  step(deltaSeconds:number,doors:Record<string,boolean>,drawers:Record<string,boolean>,command?:{revision:number;ids:string[]}) {
    const dt=Math.min(.035,Math.max(0,deltaSeconds));
    const changed = this.scene.parts.filter(part => this.flags[part.id] !== Boolean((part.kind === 'drawer' ? drawers : doors)[part.id])).map(part => part.id);
    const explicit = command && command.revision !== this.commandRevision ? command.ids : [];
    this.commandRevision = command?.revision;
    if (changed.length || explicit.length) {
      this.cancelRecovery('Yeni manuel komut nedeniyle güvenli sıra iptal edildi.');
      for (const id of [...changed, ...explicit]) this.paused.delete(id);
      this.poseRevision++;
    }
    this.prepareRecovery(dt);
    const activeStep = this.operation?.plan.steps[this.operation.index];
    for(const part of this.scene.parts) {
      const flag=Boolean((part.kind==='drawer'?drawers:doors)[part.id]);
      const newCommand = this.flags[part.id] !== flag;
      if (!this.paused.has(part.id) && (part.kind!=='sliding'||newCommand||explicit.includes(part.id))) this.targets[part.id]=flag?part.open:part.home;
      if (newCommand) {
        delete this.stops[part.id];
        this.manualStops.delete(part.id);
        if (part.id === this.closingDrawerId && flag) this.closingDrawerId = null;
      }
      this.flags[part.id]=flag;
      if(activeStep && part.id !== activeStep.id)continue;
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
        if(Math.abs(old-target)>1e-9){const last=this.constrain(this.positions,part.id,target);this.positions[part.id]=last.position;if(last.blocked)this.stops[part.id]=last;else delete this.stops[part.id];}
        this.velocities[part.id]=0;if(this.positions[part.id]!==old)this.poseRevision++;continue;
      }
      const velocity=(this.velocities[part.id]??0)+((target-old)*omega*omega-2*omega*(this.velocities[part.id]??0))*dt;
      const requested=Math.max(part.min,Math.min(part.max,old+velocity*dt));
      const result=this.constrain(this.positions,part.id,requested);
      this.positions[part.id]=result.position;this.velocities[part.id]=result.blocked?0:velocity;
      if(result.position!==old)this.poseRevision++;
      if(result.blocked)this.stops[part.id]=result;else delete this.stops[part.id];
    }
    this.advanceRecovery();
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
