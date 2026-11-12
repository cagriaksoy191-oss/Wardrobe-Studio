import type { HandleConfig, Point2DMm, ResolvedDoorLeaf, ResolvedDrawerUnit, ResolvedModel, ResolvedMotion, ResolvedPanel, ResolvedSlidingLeaf, RoomObstacle } from '../schema/types';

export const getDoorOpeningAngleRad = (door: Pick<ResolvedDoorLeaf, 'maxAngleDeg'>) => door.maxAngleDeg * Math.PI / 180;
export const point = (xMm: number, zMm: number): Point2DMm => ({ xMm:Math.round(xMm), zMm:Math.round(zMm) });
export function rotatePoint(p: Point2DMm, angle: number, pivot = {xMm:0,zMm:0}): Point2DMm {
  return point(pivot.xMm + Math.cos(angle)*p.xMm + Math.sin(angle)*p.zMm,
    pivot.zMm - Math.sin(angle)*p.xMm + Math.cos(angle)*p.zMm);
}
export function rectangle(x: number, z: number, width: number, depth: number): Point2DMm[] {
  return [point(x,z), point(x+width,z), point(x+width,z+depth), point(x,z+depth)];
}
export function polygonAreaMm2(p: Point2DMm[]): number {
  return Math.abs(p.reduce((s,a,i) => { const b=p[(i+1)%p.length]; return s+a.xMm*b.zMm-b.xMm*a.zMm; },0))/2;
}
export function polygonBounds(p: Point2DMm[]) {
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const { xMm, zMm } of p) {
    minX = Math.min(minX, xMm);
    maxX = Math.max(maxX, xMm);
    minZ = Math.min(minZ, zMm);
    maxZ = Math.max(maxZ, zMm);
  }
  return { minX, maxX, minZ, maxZ };
}
export function convexHull(points: Point2DMm[]): Point2DMm[] {
  const sorted = [...new Map(points.map(p=>[`${p.xMm},${p.zMm}`,p])).values()].sort((a,b)=>a.xMm-b.xMm || a.zMm-b.zMm);
  const cross = (o:Point2DMm,a:Point2DMm,b:Point2DMm) => (a.xMm-o.xMm)*(b.zMm-o.zMm)-(a.zMm-o.zMm)*(b.xMm-o.xMm);
  const half = (list:Point2DMm[]) => { const result:Point2DMm[]=[]; for(const p of list) { while(result.length>=2 && cross(result[result.length-2],result[result.length-1],p)<=0) result.pop(); result.push(p); } result.pop(); return result; };
  return [...half(sorted),...half([...sorted].reverse())];
}
/** Dışbükey poligonlar için ayırıcı eksen testi; yalnızca temas çakışma sayılmaz. */
export function polygonsIntersect(a: Point2DMm[], b: Point2DMm[], toleranceMm=0): boolean {
  if(a.length<3 || b.length<3) return false;
  for(const poly of [a,b]) for(let i=0;i<poly.length;i++) {
    const p=poly[i], q=poly[(i+1)%poly.length];
    const nx=q.zMm-p.zMm, nz=p.xMm-q.xMm;
    const pad=toleranceMm*Math.hypot(nx,nz);
    const pa=a.map(v=>v.xMm*nx+v.zMm*nz), pb=b.map(v=>v.xMm*nx+v.zMm*nz);
    if(Math.max(...pa)+pad <= Math.min(...pb) || Math.max(...pb)+pad <= Math.min(...pa)) return false;
  }
  return true;
}
export function pointInConvexPolygon(p: Point2DMm, polygon: Point2DMm[]): boolean {
  let sign=0;
  for(let i=0;i<polygon.length;i++) {
    const a=polygon[i],b=polygon[(i+1)%polygon.length];
    const cross=(b.xMm-a.xMm)*(p.zMm-a.zMm)-(b.zMm-a.zMm)*(p.xMm-a.xMm);
    if(Math.abs(cross)<0.01) continue;
    if(sign && Math.sign(cross)!==sign) return false;
    sign=Math.sign(cross);
  }
  return true;
}
export function obstacleFootprint(obstacle: RoomObstacle): Point2DMm[] {
  return exactRectangle(0,0,obstacle.sizeMm[0],obstacle.sizeMm[2]).map(p=>rotateExact(p,obstacle.rotationDeg*Math.PI/180,{xMm:obstacle.positionMm[0],zMm:obstacle.positionMm[2]}));
}
export function doorFootprint(door: ResolvedDoorLeaf, fraction: number): Point2DMm[] {
  const x=door.leafCenterOffsetMm[0], z=door.leafCenterOffsetMm[2];
  return exactRectangle(x-door.widthMm/2,z-door.thicknessMm/2,door.widthMm,door.thicknessMm)
    .map(p=>rotateExact(p,door.closedRotationYRad+getDoorOpeningAngleRad(door)*door.openRotationDirection*fraction,{xMm:door.pivotWorldMm[0],zMm:door.pivotWorldMm[2]}));
}
function drawerFootprint(drawer: ResolvedDrawerUnit, fraction: number): Point2DMm[] {
  return convexHull(drawerVolumes(drawer,fraction).flatMap(v=>v.polygon));
}
export function resolveMotions(model: Pick<ResolvedModel,'doors'|'drawers'|'slidingDoors'>): ResolvedMotion[] {
  return [
    ...model.doors.map(door => {
      const segments=Math.ceil(door.maxAngleDeg);
      const sweepPolygonsMm:Point2DMm[][]=[];
      let previous=hingedVolumes(door,0);
      for(let k=0;k<segments;k++) {
        const next=hingedVolumes(door,(k+1)/segments);
        sweepPolygonsMm.push(convexHull([...previous,...next].flatMap(v=>v.polygon)));
        previous=next;
      }
      return { id:door.id,label:door.label,kind:'hinged' as const,runId:door.runId,yStartMm:door.yStartMm,yEndMm:door.yEndMm,sweepPolygonsMm,maxAngleDeg:door.maxAngleDeg };
    }),
    ...model.drawers.map(d => ({ id:d.id,label:d.label,kind:'linear' as const,runId:d.runId,yStartMm:d.yStartMm,yEndMm:d.yEndMm,
      sweepPolygonsMm:[convexHull([...drawerFootprint(d,0),...drawerFootprint(d,1)])],travelMm:d.maxSlideMm })),
    ...(model.slidingDoors??[]).map(s=>({id:s.id,label:s.label,kind:'sliding' as const,runId:s.runId,yStartMm:s.yStartMm,yEndMm:s.yEndMm,
      sweepPolygonsMm:slidingVolumes(s,s.minOffsetMm).map((v,i)=>convexHull([...v.polygon,...slidingVolumes(s,s.maxOffsetMm)[i].polygon])),travelMm:s.maxOffsetMm-s.minOffsetMm})),
  ];
}

// Kesim/niyet ölçüleri tamsayı mm kalır; dönüş sonucu koordinatları yuvarlamak
// hareket sırasında gerçek yüzeyde 1 mm titreşim ve sahte temas oluştururdu.
export const exactRectangle=(x:number,z:number,w:number,d:number):Point2DMm[]=>[{xMm:x,zMm:z},{xMm:x+w,zMm:z},{xMm:x+w,zMm:z+d},{xMm:x,zMm:z+d}];
export const rotateExact=(p:Point2DMm,a:number,pivot:Point2DMm={xMm:0,zMm:0}):Point2DMm=>({xMm:pivot.xMm+Math.cos(a)*p.xMm+Math.sin(a)*p.zMm,zMm:pivot.zMm-Math.sin(a)*p.xMm+Math.cos(a)*p.zMm});
export interface PhysicalVolume {polygon:Point2DMm[];y0:number;y1:number;id?:string;label?:string}
export function boxVolume(center:[number,number,number],size:[number,number,number],angle=0):PhysicalVolume {
  return {polygon:exactRectangle(-size[0]/2,-size[2]/2,size[0],size[2]).map(p=>rotateExact(p,angle,{xMm:center[0],zMm:center[2]})),y0:center[1]-size[1]/2,y1:center[1]+size[1]/2};
}
/** HandleMesh3D'nin altı stilinin gerçek görsel boyutlarını saran yerel hacim. */
export function handleEnvelope(config:HandleConfig|undefined,defaultLength=160,defaultOrientation:'vertical'|'horizontal'='vertical') {
  const style=config?.styleId??'barModern',len=Math.max(60,config?.lengthMm??defaultLength);
  let x0=-5.5,x1=5.5,y0=-Math.max(len/2,36),y1=-y0,z1=27;
  if(style==='knobMinimal'){x0=y0=-17;x1=y1=17;z1=22.5;}
  if(style==='recessedJ'){x0=-11;x1=11;y0=-Math.max(110,len)/2;y1=-y0;z1=9.5;}
  if(style==='edgeLip'){x0=-11;x1=11;y0=-Math.max(90,len)/2;y1=-y0;z1=17.5;}
  if(style==='profileVertical'){x0=-12;x1=3.5;y0=-Math.max(180,len*1.35)/2;y1=-y0;z1=20;}
  if(style==='classicCurve'){x0=-11;x1=11;y0=-Math.max(len*.46,Math.max(35,len*.4)+11);y1=-y0;z1=32.5;}
  if((config?.orientation??defaultOrientation)==='horizontal')[x0,x1,y0,y1]=[-y1,-y0,x0,x1];
  return {x0,x1,y0,y1,z0:0,z1};
}
function handleVolume(surface:[number,number,number],config:HandleConfig|undefined,len:number,orientation:'vertical'|'horizontal',angle:number):PhysicalVolume {
  const h=handleEnvelope(config,len,orientation);
  return {polygon:exactRectangle(h.x0,h.z0,h.x1-h.x0,h.z1-h.z0).map(p=>rotateExact(p,angle,{xMm:surface[0],zMm:surface[2]})),y0:surface[1]+h.y0,y1:surface[1]+h.y1};
}
export function hingedHandleLocalPosition(door: ResolvedDoorLeaf): [number, number, number] {
  return [door.handleOffsetMm[0], door.handleOffsetMm[1], door.leafCenterOffsetMm[2] + door.thicknessMm / 2];
}

export function hingedHandleSurface(door: ResolvedDoorLeaf, angle = door.closedRotationYRad): [number, number, number] {
  const [xMm, yMm, zMm] = hingedHandleLocalPosition(door);
  const surface=rotateExact({xMm,zMm},angle,{xMm:door.pivotWorldMm[0],zMm:door.pivotWorldMm[2]});
  return [surface.xMm, door.pivotWorldMm[1]+yMm, surface.zMm];
}
export function hingedVolumes(door:ResolvedDoorLeaf,fraction:number):PhysicalVolume[] {
  const a=door.closedRotationYRad+getDoorOpeningAngleRad(door)*door.openRotationDirection*fraction;
  const centerY=door.pivotWorldMm[1]+door.leafCenterOffsetMm[1];
  return [{polygon:doorFootprint(door,fraction),y0:centerY-door.heightMm/2,y1:centerY+door.heightMm/2},handleVolume(hingedHandleSurface(door,a),door.handleConfig,door.handleLengthMm,'vertical',a)];
}
export function slidingVolumes(leaf:ResolvedSlidingLeaf,offsetMm:number):PhysicalVolume[] {
  const moved=(p:[number,number,number]):[number,number,number]=>p.map((v,i)=>v+leaf.slideDirectionWorld[i]*offsetMm) as [number,number,number];
  return [boxVolume(moved(leaf.closedWorldPositionMm),leaf.boxSizeMm),handleVolume(moved(leaf.handleSurfaceWorldMm),leaf.handleConfig,leaf.handleConfig.lengthMm,'vertical',leaf.handleRotationYRad)];
}
export function drawerVolumes(d:ResolvedDrawerUnit,fraction:number):PhysicalVolume[] {
  const moved=(p:[number,number,number]):[number,number,number]=>p.map((v,i)=>v+d.slideDirectionWorld[i]*d.maxSlideMm*fraction) as [number,number,number];
  const result=[boxVolume(moved(d.frontWorldPositionMm),d.frontBoxSizeMm),boxVolume(moved(d.leftSideWorldPositionMm),d.leftSideBoxSizeMm),boxVolume(moved(d.rightSideWorldPositionMm),d.rightSideBoxSizeMm),boxVolume(moved(d.backPanelWorldPositionMm),d.backPanelBoxSizeMm),boxVolume(moved(d.bottomPanelWorldPositionMm),d.bottomPanelBoxSizeMm)];
  const surface:[number,number,number]=d.wallAxis==='B'?[d.frontWorldPositionMm[0]+d.frontBoxSizeMm[0]/2,d.handleWorldPositionMm[1],d.handleWorldPositionMm[2]]:[d.handleWorldPositionMm[0],d.handleWorldPositionMm[1],d.frontWorldPositionMm[2]+d.frontBoxSizeMm[2]/2];
  result.push(handleVolume(moved(surface),d.handleConfig,Math.max(d.handleBoxSizeMm[0],d.handleBoxSizeMm[2]),'horizontal',d.wallAxis==='B'?Math.PI/2:0));
  for(const panel of d.organizerPanels??[])result.push(boxVolume(moved(panel.worldPositionMm),panel.boxSizeMm));
  return result;
}
export function panelVolume(panel:ResolvedPanel):PhysicalVolume {
  return panel.polygonXZMm?{polygon:panel.polygonXZMm,y0:panel.worldPositionMm[1],y1:panel.worldPositionMm[1]+panel.cutThicknessMm}:boxVolume(panel.worldPositionMm,panel.boxSizeMm,panel.rotationYRad);
}
export function roomDoorSweep(obstacle: RoomObstacle): Point2DMm[][] {
  const w=obstacle.sizeMm[0], t=obstacle.sizeMm[2];
  const right=obstacle.hingeSide==='right';
  const pivotLocal=point(right?w:0,0);
  const base=rectangle(right?-w:0,0,w,t);
  const angle=(obstacle.openingAngleDeg??90)*Math.PI/180;
  const world=(p:Point2DMm) => rotatePoint(point(p.xMm+pivotLocal.xMm,p.zMm),obstacle.rotationDeg*Math.PI/180,{xMm:obstacle.positionMm[0],zMm:obstacle.positionMm[2]});
  const polys:Point2DMm[][]=[];
  const steps=Math.max(1,Math.ceil(obstacle.openingAngleDeg??90));
  for(let i=0;i<steps;i++) polys.push(convexHull([...base.map(p=>world(rotatePoint(p,(right?1:-1)*angle*i/steps))),...base.map(p=>world(rotatePoint(p,(right?1:-1)*angle*(i+1)/steps)))]));
  return polys;
}
