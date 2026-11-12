import { Edges } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { MotionSimulator } from '../../core/analysis/motionSimulator';
import { polygonBounds } from '../../core/analysis/kinematics';
import { useWardrobeStore } from '../../store/useWardrobeStore';
import type {Object3D} from 'three';
const NOOP_RAYCAST:Object3D['raycast']=()=>null;

export const motionRuntime=new MotionSimulator();
export function publishMotionNotice() {
  useWardrobeStore.getState().notifyMotion(motionRuntime.motionNotice());
}
export function MotionController({ showContact = true }: { showContact?: boolean }) {
  useFrame((_,delta)=>{
    const state=useWardrobeStore.getState();
    motionRuntime.load(state.design,state.resolved);
    motionRuntime.step(delta,state.openDoorIds,state.openDrawerIds);
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
  return notice?<div role="status" className="border-b border-amber-600/60 bg-amber-950/80 px-4 py-2 text-xs text-amber-100">{notice.reason}</div>:null;
}
