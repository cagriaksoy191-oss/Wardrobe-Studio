import type { Design, Point2DMm, ResolvedCell, ResolvedDoorLeaf, ResolvedModel } from '../schema/types';
import { boxVolume, convexHull, drawerVolumes, getDoorOpeningAngleRad, hingedVolumes, obstacleFootprint, panelVolume, polygonBounds, polygonsIntersect, roomDoorSweep, slidingVolumes, type PhysicalVolume } from './kinematics';

export interface MotionPart {
  id:string;label:string;kind:'hinged'|'drawer'|'sliding';min:number;max:number;home:number;open:number;
  volumes:(position:number)=>PhysicalVolume[];
  translation?:[number,number];
  /** Açısal parametre başına radyan ve pivot, dönme zarfını sınırlandırır. */
  radiansPerUnit?:number;pivot?:Point2DMm;radiusMm?:number;
  ignoredStaticIds:Set<string>;
}
export interface MotionScene {
  parts: MotionPart[];
  staticVolumes: PhysicalVolume[];
  /** Exact closed-neighbor results already calculated by the hinge planner. */
  hingeHomeStops?: ReadonlyMap<string, MotionStop>;
}
export interface MotionStop {position:number;blocked:boolean;blockerId?:string;blockerLabel?:string;reason?:string}
export type MotionPositions=Record<string,number>;
const overlapsY=(a:PhysicalVolume,b:PhysicalVolume)=>Math.min(a.y1,b.y1)-Math.max(a.y0,b.y0)>0.001;

type BoundedVolume = PhysicalVolume & { bounds: ReturnType<typeof polygonBounds> };
const withBounds = (volume: PhysicalVolume): BoundedVolume => ({ ...volume, bounds: polygonBounds(volume.polygon) });

/** One live model snapshot. Store only the last exact obstacle pose for each part. */
export function createMotionConstraint(scene: MotionScene) {
  const staticVolumes = scene.staticVolumes.map(withBounds);
  const poses = new WeakMap<MotionPart, { position: number; volumes: BoundedVolume[] }>();
  return (positions: MotionPositions, id: string, requested: number) => constrain(
    scene, positions, id, requested, staticVolumes,
    (part, position) => {
      const saved = poses.get(part);
      if (saved?.position === position) return saved.volumes;
      const volumes = part.volumes(position).map(volume => withBounds({ ...volume, id: part.id, label: part.label }));
      poses.set(part, { position, volumes });
      return volumes;
    },
  );
}

/** Kapalı başlangıçta kesişen parça montaja hazır kabul edilemez. Temas ve montaj dikmesi ayrıdır. */
export function initialMotionConflicts(scene:MotionScene) {
  const conflicts:{partId:string;otherId:string;description:string}[]=[],seen=new Set<string>();
  const volumes=scene.parts.map(part=>({part,volumes:part.volumes(part.home)}));
  for(const {part,volumes:own}of volumes) {
    const candidates=[...scene.staticVolumes.filter(v=>!part.ignoredStaticIds.has(v.id??'')),...volumes.filter(v=>v.part.id!==part.id).flatMap(v=>v.volumes.map(box=>({...box,id:v.part.id,label:v.part.label})))];
    for(const obstacle of candidates){const key=[part.id,obstacle.id??'static'].sort().join('|');if(seen.has(key))continue;
      if(own.some(v=>Math.min(v.y1,obstacle.y1)-Math.max(v.y0,obstacle.y0)>.05&&polygonsIntersect(v.polygon,obstacle.polygon,-.05))){seen.add(key);conflicts.push({partId:part.id,otherId:obstacle.id??'',description:`${part.label} kapalı başlangıç konumunda ${obstacle.label??'diğer parça'} ile kesişiyor. Kapsam, yan pay, kulp veya montaj yerleşimini düzeltin.`});}
    }
  }
  return conflicts;
}

export function buildMotionScene(design:Design,model:ResolvedModel):MotionScene {
  const staticVolumes:PhysicalVolume[]=model.panels.filter(p=>!p.animatedUnitId&&p.role!=='drawerBox').map(p=>({...panelVolume(p),id:p.id,label:p.label}));
  for (const system of model.slidingSystems ?? []) {
    const name = design.fronts.find(front => front.id === system.frontId)?.label
      ?? model.bays.find(bay => system.bayIds.includes(bay.id))?.label ?? 'Sürgülü cephe';
    system.railBoxes.forEach((box, index) => staticVolumes.push({
      ...boxVolume(box.centerMm, box.sizeMm), id: `${system.frontId}-rail-${index}`,
      label: `${name} · ${index === 0 ? 'alt' : 'üst'} ray`,
    }));
  }
  for(const o of design.obstacles??[]) {
    const polys=o.kind==='roomDoor'?roomDoorSweep(o):[obstacleFootprint(o)];
    for(const polygon of polys)staticVolumes.push({id:o.id,label:o.kind==='roomDoor'?`${o.label} açılım alanı`:o.label,polygon,y0:o.positionMm[1],y1:o.positionMm[1]+o.sizeMm[1]});
  }
  const parts = model.doors.map(hingedMotionPart);
  for(const d of model.drawers)parts.push({id:d.id,label:d.label,kind:'drawer',min:0,max:1,home:0,open:1,volumes:p=>drawerVolumes(d,p),translation:[d.slideDirectionWorld[0]*d.maxSlideMm,d.slideDirectionWorld[2]*d.maxSlideMm],ignoredStaticIds:new Set()});
  for(const s of model.slidingDoors??[])parts.push({id:s.id,label:s.label,kind:'sliding',min:s.minOffsetMm,max:s.maxOffsetMm,home:s.initialOffsetMm,open:s.openOffsetMm,volumes:p=>slidingVolumes(s,p),translation:[s.slideDirectionWorld[0],s.slideDirectionWorld[2]],ignoredStaticIds:new Set()});
  return {parts,staticVolumes};
}

export function hingedMotionPart(door: ResolvedDoorLeaf): MotionPart {
  const pivot = { xMm: door.pivotWorldMm[0], zMm: door.pivotWorldMm[2] };
  const radiusMm = Math.max(...hingedVolumes(door, 0).flatMap(volume =>
    volume.polygon.map(point => Math.hypot(point.xMm - pivot.xMm, point.zMm - pivot.zMm))));
  return {
    id: door.id, label: door.label, kind: 'hinged', min: 0, max: 1, home: 0, open: 1,
    volumes: position => hingedVolumes(door, position),
    radiansPerUnit: getDoorOpeningAngleRad(door) * door.openRotationDirection, pivot, radiusMm,
    ignoredStaticIds: new Set(),
  };
}

/** Hareketli dışbükey poligon ile sabit poligonun kesiştiği kesintisiz zaman aralığı.
 * Hız ne kadar yüksek olursa olsun başlangıç/son nokta örneklemesi yapılmaz.
 */
export function sweptTranslationTime(a:Point2DMm[],b:Point2DMm[],dx:number,dz:number):number|null {
  let enter=0,exit=1;
  for(const poly of [a,b])for(let i=0;i<poly.length;i++) {
    const p=poly[i],q=poly[(i+1)%poly.length],nx=q.zMm-p.zMm,nz=p.xMm-q.xMm;
    const pa=a.map(v=>v.xMm*nx+v.zMm*nz),pb=b.map(v=>v.xMm*nx+v.zMm*nz);
    const amin=Math.min(...pa),amax=Math.max(...pa),bmin=Math.min(...pb),bmax=Math.max(...pb),velocity=dx*nx+dz*nz;
    const eps=1e-7*Math.hypot(nx,nz);
    if(Math.abs(velocity)<1e-10){if(amax<=bmin+eps||bmax<=amin+eps)return null;continue;}
    let t0=(bmin-amax+eps)/velocity,t1=(bmax-amin-eps)/velocity;
    if(t0>t1)[t0,t1]=[t1,t0];
    enter=Math.max(enter,t0);exit=Math.min(exit,t1);
    if(enter>=exit-1e-12)return null;
  }
  return enter<1&&exit>0?Math.max(0,enter):null;
}

function rotatingTime(part:MotionPart,from:number,to:number,start:PhysicalVolume[],end:PhysicalVolume[],obstacle:PhysicalVolume):number|null {
  const volumes=(t:number)=>part.volumes(from+(to-from)*t);
  const search=(lo:number,hi:number,a:PhysicalVolume[],b:PhysicalVolume[],depth:number):number|null=>{
    const theta=Math.abs((to-from)*(hi-lo)*(part.radiansPerUnit??0));
    // Her köşe yayının kirişinden en büyük uzaklığı. Hull + bu pay tüm ara
    // konumları kapsar; ince engeller hızlı açılmada atlanamaz.
    const sagitta=(part.radiusMm??0)*(1-Math.cos(theta/2));
    const possible=a.some((v,i)=>overlapsY(v,obstacle)&&polygonsIntersect(convexHull([...v.polygon,...b[i].polygon]),obstacle.polygon,sagitta+1e-7));
    if(!possible)return null;
    if(depth>=22||(part.radiusMm??0)*theta<0.05)return lo;
    const mid=(lo+hi)/2,m=volumes(mid);
    return search(lo,mid,a,m,depth+1)??search(mid,hi,m,b,depth+1);
  };
  return search(0,1,start,end,0);
}

export function constrainMotion(scene:MotionScene,positions:MotionPositions,id:string,requested:number):MotionStop {
  return constrain(scene, positions, id, requested, scene.staticVolumes,
    (part, position) => part.volumes(position).map(volume => ({ ...volume, id: part.id, label: part.label })));
}

function constrain(
  scene: MotionScene, positions: MotionPositions, id: string, requested: number,
  staticVolumes: readonly (PhysicalVolume | BoundedVolume)[],
  volumesAt: (part: MotionPart, position: number) => (PhysicalVolume | BoundedVolume)[],
): MotionStop {
  const part=scene.parts.find(p=>p.id===id);
  if(!part)return {position:0,blocked:true,reason:'Hareketli parça bulunamadı.'};
  const from=Math.max(part.min,Math.min(part.max,positions[id]??part.home));
  const to=Math.max(part.min,Math.min(part.max,requested));
  if(Math.abs(to-from)<1e-9)return {position:to,blocked:false};
  const start=part.volumes(from);
  const end=part.volumes(to);
  // The recursive sweep used the interpolated endpoint, which can differ by an ulp.
  const sweepEnd = from + (to - from);
  const rotatingEnd = !part.translation && sweepEnd !== to ? part.volumes(sweepEnd) : end;
  const broad=polygonBounds([...start,...end].flatMap(v=>v.polygon));
  const wholeY={y0:Math.min(...start.map(v=>v.y0)),y1:Math.max(...start.map(v=>v.y1))};
  const pad=part.translation?0:(part.radiusMm??0)*(1-Math.cos(Math.abs((part.radiansPerUnit??0)*(to-from))/2));
  const dx=(part.translation?.[0]??0)*(to-from),dz=(part.translation?.[1]??0)*(to-from);
  let first=1,blocker:PhysicalVolume|undefined;
  const checkObstacle = (obstacle: PhysicalVolume | BoundedVolume) => {
    if(Math.min(wholeY.y1,obstacle.y1)-Math.max(wholeY.y0,obstacle.y0)<=0.001)return;
    const ob='bounds' in obstacle ? obstacle.bounds : polygonBounds(obstacle.polygon);
    if(ob.minX>=broad.maxX+pad||ob.maxX<=broad.minX-pad||ob.minZ>=broad.maxZ+pad||ob.maxZ<=broad.minZ-pad)return;
    let hit:number|null=null;
    if(part.translation) {
      for(const v of start)if(overlapsY(v,obstacle)) {
        const t=sweptTranslationTime(v.polygon,obstacle.polygon,dx,dz);
        if(t!==null&&(hit===null||t<hit))hit=t;
      }
    } else hit=rotatingTime(part,from,to,start,rotatingEnd,obstacle);
    if(hit!==null&&hit<first){first=hit;blocker=obstacle;}
  };
  // Keep the original candidate order, including the tie-break between blockers.
  for (const obstacle of staticVolumes) if (!part.ignoredStaticIds.has(obstacle.id ?? '')) checkObstacle(obstacle);
  for (const other of scene.parts) if (other.id !== id) {
    for (const obstacle of volumesAt(other, positions[other.id] ?? other.home)) checkObstacle(obstacle);
  }
  if(!blocker)return {position:to,blocked:requested!==to,reason:requested!==to?'Rayın mekanik uç sınırına ulaşıldı.':undefined};
  const path=part.translation?Math.hypot(...part.translation)*Math.abs(to-from):(part.radiusMm??1)*Math.abs((part.radiansPerUnit??1)*(to-from));
  const safe=Math.max(0,first-0.05/Math.max(0.05,path));
  const position = from + (to - from) * safe;
  const blockerLabel = blocker.label ?? 'Diğer parça';
  const blockerId = blocker.id;
  const movingBlocker = scene.parts.find(other => other.id === blockerId);
  const blockerOpen = movingBlocker && Math.abs((positions[movingBlocker.id] ?? movingBlocker.home) - movingBlocker.home) > 0.002;
  const nominal = Math.round(Math.abs(part.radiansPerUnit ?? 0) * 180 / Math.PI);
  const reached = Math.floor(position * nominal * 10) / 10;
  const reason = part.kind === 'hinged'
    ? `${part.label} · hedef ${to > from ? nominal : 0}° · mevcut sınır ${reached}°. Engel: ${blockerLabel}.`
    : `${part.label} · engel: ${blockerLabel}.`;
  let nextStep = '';
  if (part.kind === 'drawer' && movingBlocker?.kind === 'sliding') {
    nextStep = ' Sürgü kanadını çekmece açıklığının dışına kaydırın.';
  } else if (part.kind === 'sliding' && movingBlocker?.kind === 'drawer' && blockerOpen) {
    nextStep = ' Sürgüyü geri kaydırın ve çekmeceyi kapatın.';
  } else if (blockerOpen) {
    nextStep = ' Önce engel olan parçayı kapatın.';
  }
  return { position, blocked: true, blockerId, blockerLabel, reason: reason + nextStep };
}

/** Bütün raylardaki kanatların birleşik örtüsü, hücrede gerçek bir açıklık bırakıyor mu? */
export function slidingCellHasOpening(model:ResolvedModel,positions:MotionPositions,cell:ResolvedCell):boolean {
  const leaves=(model.slidingDoors??[]).filter(l=>l.bayIds.includes(cell.bayId)&&l.yStartMm<cell.yEndMm&&l.yEndMm>cell.yStartMm);
  if(!leaves.length)return true;
  const axis=cell.wallAxis==='B'?2:0,start=cell.worldCenterMm[axis]-cell.netWidthMm/2,end=start+cell.netWidthMm;
  const levels=[...new Set([cell.yStartMm,cell.yEndMm,...leaves.flatMap(l=>[Math.max(cell.yStartMm,l.yStartMm),Math.min(cell.yEndMm,l.yEndMm)])])].sort((a,b)=>a-b);
  for(let k=1;k<levels.length;k++) {
    if(levels[k]-levels[k-1]<2)continue;
    const y=(levels[k]+levels[k-1])/2;
    const intervals=leaves.filter(l=>l.yStartMm<y&&l.yEndMm>y).map(l=>[l.closedWorldPositionMm[axis]-l.widthMm/2+(positions[l.id]??l.initialOffsetMm),l.closedWorldPositionMm[axis]+l.widthMm/2+(positions[l.id]??l.initialOffsetMm)]).sort((a,b)=>a[0]-b[0]);
    let cursor=start;
    for(const [lo,hi] of intervals){if(lo>cursor+5)return true;cursor=Math.max(cursor,hi);}
    if(cursor<end-5)return true;
  }
  return false;
}
