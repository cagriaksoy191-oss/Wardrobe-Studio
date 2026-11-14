import { Edges } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { MotionSimulator } from '../../core/analysis/motionSimulator';
import { polygonBounds } from '../../core/analysis/kinematics';
import { useWardrobeStore } from '../../store/useWardrobeStore';
import type {Object3D} from 'three';
const NOOP_RAYCAST:Object3D['raycast']=()=>null;

export const motionRuntime=new MotionSimulator();
export function publishMotionNotice() {
  const state = useWardrobeStore.getState();
  const notice = motionRuntime.motionNotice();
  state.notifyMotion(notice);
  const offer = notice && !motionRuntime.recovery ? motionRuntime.recoveryOffer() : null;
  state.notifyRecovery(motionRuntime.recovery, offer ? {
    available: Boolean(offer.plan), description: offer.plan?.description ?? offer.reason,
  } : null);
}
export function MotionController({ showContact = true }: { showContact?: boolean }) {
  useEffect(() => () => {
    motionRuntime.cancelRecovery('Görünüm kapandı. Güvenli sıra iptal edildi.');
    publishMotionNotice();
  }, []);
  useFrame((_,delta)=>{
    const state=useWardrobeStore.getState();
    motionRuntime.load(state.design,state.resolved);
    motionRuntime.step(delta,state.openDoorIds,state.openDrawerIds,state.motionCommand);
    publishMotionNotice();
  },-100);
  const notice=useWardrobeStore(s=>s.motionNotice);
  if(!notice || !showContact || !motionRuntime.stops[notice.id])return null;
  const part=motionRuntime.scene.parts.find(p=>p.id===notice.id);
  return <group userData={{studioHelper:true}}>{part?.volumes(motionRuntime.positions[part.id]??part.home).map((v,i)=>{
    const b=polygonBounds(v.polygon);
    return <mesh key={i} position={[(b.minX+b.maxX)*.0005,(v.y0+v.y1)*.0005,(b.minZ+b.maxZ)*.0005]} raycast={NOOP_RAYCAST}>
      <boxGeometry args={[(b.maxX-b.minX)*.001,(v.y1-v.y0)*.001,(b.maxZ-b.minZ)*.001]}/>
      <meshBasicMaterial transparent opacity={0} depthWrite={false}/><Edges color="#fb7185" raycast={NOOP_RAYCAST}/>
    </mesh>;
  })}</group>;
}
export function SlidingRails() {
  const systems=useWardrobeStore(s=>s.resolved.slidingSystems);
  return <group>{systems?.flatMap(s=>s.railBoxes.map((box,i)=><mesh key={`${s.frontId}-${i}`} position={box.centerMm.map(v=>v*.001) as [number,number,number]} raycast={NOOP_RAYCAST}>
    <boxGeometry args={box.sizeMm.map(v=>v*.001) as [number,number,number]}/><meshStandardMaterial color="#64748b" metalness={.85} roughness={.3}/><Edges color="#cbd5e1" raycast={NOOP_RAYCAST}/>
  </mesh>))}</group>;
}
export function MotionNotice() {
  const notice=useWardrobeStore(s=>s.motionNotice);
  const recovery = useWardrobeStore(s => s.motionRecovery);
  const offer = useWardrobeStore(s => s.motionRecoveryOffer);
  const region = useRef<HTMLDivElement>(null);
  if (!notice && !recovery) return null;
  const act = () => {
    if (recovery?.status === 'running') {
      motionRuntime.cancelRecovery();
    } else if (recovery) {
      motionRuntime.dismissRecovery();
      region.current?.focus();
    } else {
      const state = useWardrobeStore.getState();
      motionRuntime.load(state.design, state.resolved);
      const plan = motionRuntime.recoveryOffer().plan;
      if (plan && motionRuntime.startRecovery(plan, state.motionCommand.revision)) state.syncRecoveryTargets(plan.steps.map(step => step.id));
    }
    publishMotionNotice();
  };
  return <div ref={region} tabIndex={-1} role="status" className="border-b border-amber-600/60 bg-amber-950/80 px-4 py-2 text-xs text-amber-100">
    <p>{recovery?.message ?? notice?.reason}</p>
    {offer && <p id="motion-recovery-description" className="mt-1">{offer.description}</p>}
    {recovery?.status === 'running' && <div className="mt-1 flex items-center gap-2">
      <span>Adım {recovery.step}/{recovery.total}</span>
      <progress aria-label="Tamamlanan güvenli hareket adımları" value={recovery.step - 1} max={recovery.total} />
    </div>}
    {(recovery || offer?.available) && <button type="button" aria-describedby={offer ? 'motion-recovery-description' : undefined}
      className="mt-2 min-h-11 rounded border border-amber-400 px-3 py-2 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-200"
      onClick={act}>{recovery ? recovery.status === 'running' ? 'Güvenli sırayı iptal et' : 'Bildirimi kapat' : 'Güvenli sırayla kapat'}</button>}
  </div>;
}
