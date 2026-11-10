import { Edges } from '@react-three/drei';
import { SceneHtml as Html } from '../annotations/SceneHtml';
import { useMemo } from 'react';
import * as THREE from 'three';
import type { Point2DMm, ResolvedCell, RoomObstacle } from '../../core/schema/types';
import { obstacleFootprint, roomDoorSweep } from '../../core/analysis/kinematics';
import { OWNER_NAMES, REACH_LABELS } from '../../core/analysis/studioAnalysis';
import { useWardrobeStore } from '../../store/useWardrobeStore';
import { createWorldSpaceExtrudeGeometry } from '../materials/materialRegistry';

const MM_TO_M=0.001;
const NOOP_RAYCAST:THREE.Object3D['raycast']=()=>null;
const ownerColors={anne:'#f472b6',baba:'#38bdf8',ortak:'#a78bfa'};
const reachColors={low:'#60a5fa',comfortable:'#34d399',high:'#fbbf24',assisted:'#fb7185'};

function PlanPolygons({polygons,color,y=0.008}:{polygons:Point2DMm[][];color:string;y?:number}) {
  const geometry=useMemo(()=>{
    const positions:number[]=[];
    for(const poly of polygons) for(let i=1;i<poly.length-1;i++) for(const p of [poly[0],poly[i],poly[i+1]]) positions.push(p.xMm*MM_TO_M,0,p.zMm*MM_TO_M);
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));return g;
  },[polygons]);
  return <mesh geometry={geometry} position={[0,y,0]} raycast={NOOP_RAYCAST} renderOrder={4}><meshBasicMaterial color={color} transparent opacity={0.22} side={THREE.DoubleSide} depthFunc={THREE.LessDepth}/></mesh>;
}
function CellAnalysisVolume({cell,color}:{cell:ResolvedCell;color:string}) {
  const polygonGeometry=useMemo(()=>cell.polygonXZMm?createWorldSpaceExtrudeGeometry(cell.polygonXZMm,cell.netHeightMm*MM_TO_M):null,[cell.polygonXZMm,cell.netHeightMm]);
  return polygonGeometry?<mesh geometry={polygonGeometry} position={[0,cell.yStartMm*MM_TO_M,0]} rotation={[-Math.PI/2,0,0]} raycast={NOOP_RAYCAST} renderOrder={20}><meshBasicMaterial color={color} transparent opacity={0.22} depthWrite={false} depthTest={false}/></mesh>:
    <mesh position={cell.worldCenterMm.map(v=>v*MM_TO_M) as [number,number,number]} raycast={NOOP_RAYCAST} renderOrder={20}>
      <boxGeometry args={cell.worldSizeMm.map(v=>Math.max(0.004,v*MM_TO_M-0.004)) as [number,number,number]}/><meshBasicMaterial color={color} transparent opacity={0.22} depthWrite={false} depthTest={false}/>
    </mesh>;
}
function ObstacleMarker({obstacle,colliding,selected}:{obstacle:RoomObstacle;colliding:boolean;selected:boolean}) {
  const poly=obstacleFootprint(obstacle),cx=poly.reduce((s,p)=>s+p.xMm,0)/4,cz=poly.reduce((s,p)=>s+p.zMm,0)/4;
  const color=colliding?'#fb7185':obstacle.kind==='window'?'#67e8f9':obstacle.kind==='socket'?'#fbbf24':'#94a3b8';
  return <group>
    <group position={[cx*MM_TO_M,(obstacle.positionMm[1]+obstacle.sizeMm[1]/2)*MM_TO_M,cz*MM_TO_M]} rotation={[0,obstacle.rotationDeg*Math.PI/180,0]}>
      <mesh raycast={NOOP_RAYCAST}><boxGeometry args={obstacle.sizeMm.map(v=>v*MM_TO_M) as [number,number,number]}/><meshStandardMaterial color="#94a3b8" transparent opacity={selected?0.38:0.2} depthWrite={false}/><Edges color={color} raycast={NOOP_RAYCAST}/></mesh>
      {obstacle.kind==='bed'&&<mesh position={[0,obstacle.sizeMm[1]*MM_TO_M/2+0.035,-obstacle.sizeMm[2]*MM_TO_M*0.33]} raycast={NOOP_RAYCAST}><boxGeometry args={[obstacle.sizeMm[0]*MM_TO_M*0.72,0.07,0.35]}/><meshStandardMaterial color="#cbd5e1" transparent opacity={0.6}/></mesh>}
      <Html position={[0,obstacle.sizeMm[1]*MM_TO_M/2+0.06,0]} center zIndexRange={[15,5]}><span className="pointer-events-none block whitespace-nowrap rounded border border-slate-600 bg-slate-950/90 px-2 py-1 text-[10px] text-slate-200">{obstacle.label}{colliding?' · Çakışma':''}</span></Html>
    </group>
    {obstacle.kind==='roomDoor'&&<PlanPolygons polygons={roomDoorSweep(obstacle)} color={colliding?'#fb7185':'#a78bfa'} y={0.012}/>}
  </group>;
}
export function AnalysisOverlays() {
  const design=useWardrobeStore(s=>s.design),model=useWardrobeStore(s=>s.resolved),overlay=useWardrobeStore(s=>s.analysisOverlay);
  const obstacles=useWardrobeStore(s=>s.showRoomObstacles),sweeps=useWardrobeStore(s=>s.showMotionSweeps),selected=useWardrobeStore(s=>s.selectedObstacleId);
  return <group userData={{studioHelper:true}}>
    {overlay!=='none'&&model.cells.map(cell=>{const reach=model.analysis?.reach.find(r=>r.cellId===cell.id);return <CellAnalysisVolume key={`analysis-${cell.id}`} cell={cell} color={overlay==='ownership'?ownerColors[cell.owner]:reachColors[reach?.zone??'comfortable']}/>;})}
    {obstacles&&design.obstacles?.map(o=><ObstacleMarker key={o.id} obstacle={o} selected={selected===o.id} colliding={model.analysis?.collidingObstacleIds.includes(o.id)??false}/>)}
    {sweeps&&model.analysis?.motions.map(m=>{const collision=model.issues.some(i=>i.id.startsWith('obstacle-motion-')&&i.id.endsWith(`-${m.id}`));return <PlanPolygons key={`sweep-${m.id}`} polygons={m.sweepPolygonsMm} y={m.kind==='hinged'?.008:m.kind==='sliding'?.009:.01} color={collision?'#fb7185':m.kind==='hinged'?'#fbbf24':m.kind==='sliding'?'#c084fc':'#38bdf8'}/>;})}
  </group>;
}
export function AnalysisToolbar() {
  const overlay=useWardrobeStore(s=>s.analysisOverlay),setOverlay=useWardrobeStore(s=>s.setAnalysisOverlay);
  const showSweeps=useWardrobeStore(s=>s.showMotionSweeps),setSweeps=useWardrobeStore(s=>s.setShowMotionSweeps);
  const showObstacles=useWardrobeStore(s=>s.showRoomObstacles),setObstacles=useWardrobeStore(s=>s.setShowRoomObstacles);
  const setView=useWardrobeStore(s=>s.setViewMode),setEye=useWardrobeStore(s=>s.setEyeLevelCamera),eye=useWardrobeStore(s=>s.eyeLevelOwner);
  const style=(active:boolean)=>`rounded border px-2 py-1.5 text-[11px] font-medium ${active?'border-sky-400 bg-sky-500/20 text-sky-200':'border-slate-700 bg-slate-900/95 text-slate-300 hover:border-slate-500'}`;
  return <div className="pointer-events-auto absolute bottom-3 left-3 z-30 max-w-[calc(100%-24px)] space-y-2 rounded-lg border border-slate-700 bg-slate-950/90 p-2 shadow-lg backdrop-blur">
    <div className="flex flex-wrap items-center gap-1.5">
      <button className={style(overlay==='ergonomics')} aria-pressed={overlay==='ergonomics'} onClick={()=>setOverlay(overlay==='ergonomics'?'none':'ergonomics')}>Ergonomi</button>
      <button className={style(overlay==='ownership')} aria-pressed={overlay==='ownership'} onClick={()=>setOverlay(overlay==='ownership'?'none':'ownership')}>Sahiplik</button>
      <button className={style(showSweeps)} aria-pressed={showSweeps} onClick={()=>setSweeps(!showSweeps)}>Süpürme alanları</button>
      <button className={style(showObstacles)} aria-pressed={showObstacles} onClick={()=>setObstacles(!showObstacles)}>Oda engelleri</button>
      <button className={style(false)} onClick={()=>setView('2d-plan-top')}>Üst plan</button>
      <button className={style(eye==='anne')} onClick={()=>setEye('anne')}>Anne göz hizası</button>
      <button className={style(eye==='baba')} onClick={()=>setEye('baba')}>Baba göz hizası</button>
    </div>
    {overlay!=='none'&&<div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-200">{overlay==='ownership'?Object.entries(ownerColors).map(([key,color])=><span key={key}><span style={{color}}>● </span>{OWNER_NAMES[key as keyof typeof ownerColors]}</span>):Object.entries(reachColors).map(([key,color])=><span key={key}><span style={{color}}>● </span>{REACH_LABELS[key as keyof typeof reachColors]}</span>)}</div>}
    {showSweeps&&<p className="text-[11px] text-slate-300"><span className="text-amber-200">Menteşe</span> · <span className="text-sky-200">Çekmece</span> · <span className="text-violet-200">Sürgü</span> · <span className="text-rose-200">Çakışma</span> · Açık gri dolgu oda engelidir</p>}
  </div>;
}
