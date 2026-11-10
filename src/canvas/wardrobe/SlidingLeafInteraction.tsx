import { type ThreeEvent } from '@react-three/fiber';
import { useEffect, useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import type { ResolvedDoorLeaf, ResolvedSlidingLeaf } from '../../core/schema/types';
import { useWardrobeStore } from '../../store/useWardrobeStore';
import { motionRuntime,publishMotionNotice } from '../scene/MotionController';

export function slidingAsDoor(s:ResolvedSlidingLeaf):ResolvedDoorLeaf {
  return {id:s.id,frontId:s.frontId,label:s.label,runId:s.runId,bayId:s.bayId,bayIds:s.bayIds,isPartialHeight:true,hingeSide:'left',maxAngleDeg:110,widthMm:s.widthMm,heightMm:s.heightMm,thicknessMm:s.thicknessMm,yStartMm:s.yStartMm,yEndMm:s.yEndMm,materialId:s.materialId,handleConfig:s.handleConfig,
    pivotWorldMm:s.closedWorldPositionMm,closedRotationYRad:s.handleRotationYRad,openRotationDirection:1,leafCenterOffsetMm:[0,0,0],
    handleOffsetMm:[s.wallAxis==='B'?s.closedWorldPositionMm[2]-s.handleSurfaceWorldMm[2]:s.handleSurfaceWorldMm[0]-s.closedWorldPositionMm[0],s.handleSurfaceWorldMm[1]-s.closedWorldPositionMm[1],s.thicknessMm/2+1],handleLengthMm:s.handleConfig.lengthMm};
}
export function allowsSlidingDrag(flags:{editor:boolean;multiSelect:boolean;button:number;shift?:boolean;ctrl?:boolean;meta?:boolean}) {
  return !flags.editor&&!flags.multiSelect&&flags.button===0&&!flags.shift&&!flags.ctrl&&!flags.meta;
}
interface DragSession {plane:THREE.Plane;start:THREE.Vector3;offset:number;capture:{releasePointerCapture?:(id:number)=>void};pointerId:number}
export function SlidingLeafInteraction({leaf,doorEditorMode,multiSelectToolActive,onToggleDoor,children}:{leaf:ResolvedSlidingLeaf;doorEditorMode:boolean;multiSelectToolActive:boolean;onToggleDoor:(id:string)=>void;children:(toggle:(id:string)=>void)=>ReactNode}) {
  const drag=useRef<DragSession|null>(null),moved=useRef(false);
  const finish=(event?:Event|{pointerId:number})=>{
    const session=drag.current;if(!session)return;
    if(event&&'pointerId'in event&&event.pointerId!==session.pointerId)return;
    drag.current=null;motionRuntime.draggingId=null;
    try{session.capture.releasePointerCapture?.(session.pointerId);}catch{/* Yakalama iptal edilmiş olabilir. */}
    const store=useWardrobeStore.getState();store.setPartDragging(false);store.refreshMotion();publishMotionNotice();
  };
  useEffect(() => {
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') finish(); };
    window.addEventListener('blur', finish);
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
    window.addEventListener('keydown', escape);
    return () => {
      finish();
      window.removeEventListener('blur', finish);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
      window.removeEventListener('keydown', escape);
    };
  }, []);
  const down=(e:ThreeEvent<PointerEvent>)=>{
    if(drag.current||motionRuntime.draggingId!==null)return;
    if(!allowsSlidingDrag({editor:doorEditorMode,multiSelect:multiSelectToolActive,button:e.button,shift:e.shiftKey,ctrl:e.ctrlKey,meta:e.metaKey}))return;
    e.stopPropagation();
    const store=useWardrobeStore.getState();motionRuntime.load(store.design,store.resolved);
    const axis=new THREE.Vector3(...leaf.slideDirectionWorld);
    const normal=e.ray.direction.clone().addScaledVector(axis,-e.ray.direction.dot(axis));
    if(normal.length()<.001)return;
    normal.normalize();
    const plane=new THREE.Plane().setFromNormalAndCoplanarPoint(normal,e.point);
    const start=e.ray.intersectPlane(plane,new THREE.Vector3());if(!start)return;
    const capture=e.target as unknown as DragSession['capture']&{setPointerCapture?:(id:number)=>void};
    try { capture.setPointerCapture?.(e.pointerId); } catch { return; }
    drag.current={plane,start:start.clone(),offset:motionRuntime.positions[leaf.id]??leaf.initialOffsetMm,capture,pointerId:e.pointerId};
    moved.current=false;motionRuntime.draggingId=leaf.id;store.setPartDragging(true);
  };
  const move=(e:ThreeEvent<PointerEvent>)=>{
    const session=drag.current;if(!session||session.pointerId!==e.pointerId)return;e.stopPropagation();
    const point=e.ray.intersectPlane(session.plane,new THREE.Vector3());if(!point)return;
    const deltaMm=point.sub(session.start).dot(new THREE.Vector3(...leaf.slideDirectionWorld))*1000;
    if(Math.abs(deltaMm)>2)moved.current=true;
    motionRuntime.dragTo(leaf.id,session.offset+deltaMm);publishMotionNotice();
  };
  return <group onPointerDown={down} onPointerMove={move} onPointerUp={finish} onPointerCancel={finish} onLostPointerCapture={finish}>
    {children(id=>{if(moved.current){moved.current=false;return;}onToggleDoor(id);})}
  </group>;
}
