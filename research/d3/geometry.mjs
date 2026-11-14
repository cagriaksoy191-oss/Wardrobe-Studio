/** Derived geometry uses mm; persistent component intent remains integer mm. */
export const area = p => Math.abs(p.reduce((s, a, i) => {
  const b = p[(i + 1) % p.length]; return s + a.xMm * b.zMm - b.xMm * a.zMm;
}, 0)) / 2;
export const rect = (x, z, w, d) => [{xMm:x,zMm:z},{xMm:x+w,zMm:z},{xMm:x+w,zMm:z+d},{xMm:x,zMm:z+d}];
export function clipHalfPlane(poly, nx, nz, c) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    const da = nx * a.xMm + nz * a.zMm - c, db = nx * b.xMm + nz * b.zMm - c;
    if (da >= -1e-8) out.push(a);
    if ((da > 1e-8 && db < -1e-8) || (da < -1e-8 && db > 1e-8)) {
      const f = da / (da - db); out.push({xMm:a.xMm + f*(b.xMm-a.xMm),zMm:a.zMm+f*(b.zMm-a.zMm)});
    }
  }
  return out;
}
export function erodeRectangle(poly, width, depth) {
  const sign = Math.sign(poly.reduce((s,a,i) => {const b=poly[(i+1)%poly.length];return s+a.xMm*b.zMm-b.xMm*a.zMm;},0));
  let result = poly;
  for (let i=0;i<poly.length&&result.length;i++) {
    const a=poly[i],b=poly[(i+1)%poly.length];
    const nx=sign*(a.zMm-b.zMm),nz=sign*(b.xMm-a.xMm);
    result=clipHalfPlane(result,nx,nz,nx*a.xMm+nz*a.zMm+Math.abs(nx)*width/2+Math.abs(nz)*depth/2);
  }
  return result;
}
export function intersectConvex(poly,clip) {
  const sign=Math.sign(clip.reduce((s,a,i)=>{const b=clip[(i+1)%clip.length];return s+a.xMm*b.zMm-b.xMm*a.zMm;},0));
  let result=poly;
  for(let i=0;i<clip.length&&result.length;i++) {
    const a=clip[i],b=clip[(i+1)%clip.length],nx=sign*(a.zMm-b.zMm),nz=sign*(b.xMm-a.xMm);
    result=clipHalfPlane(result,nx,nz,nx*a.xMm+nz*a.zMm);
  }
  return result;
}
export function horizontalSlice(poly,z) {
  const values=[];
  for(let i=0;i<poly.length;i++) {
    const a=poly[i],b=poly[(i+1)%poly.length];
    if(Math.abs(a.zMm-z)<1e-7) values.push(a.xMm);
    if((a.zMm<z&&b.zMm>z)||(a.zMm>z&&b.zMm<z)) values.push(a.xMm+(z-a.zMm)*(b.xMm-a.xMm)/(b.zMm-a.zMm));
  }
  return values.length?[Math.min(...values),Math.max(...values)]:null;
}
export function subtractIntervals(base, blocked) {
  let result=base?[base]:[];
  for(const [a,b] of blocked) result=result.flatMap(([x,y])=>b<=x||a>=y?[[x,y]]:[...(a>x?[[x,Math.min(a,y)]]:[]),...(b<y?[[Math.max(b,x),y]]:[])]);
  return result.filter(([a,b])=>b-a>1e-6);
}
export function unionLength(intervals) {
  let sum=0,end=-Infinity;
  for(const [a,b] of [...intervals].sort((a,b)=>a[0]-b[0])) {sum+=Math.max(0,b-Math.max(a,end));end=Math.max(end,b);}
  return sum;
}
export function rectangleUnionArea(rectangles) {
  const xs=[...new Set(rectangles.flatMap(r=>[r[0],r[2]]))].sort((a,b)=>a-b);
  let sum=0;
  for(let i=1;i<xs.length;i++) {
    const mid=(xs[i-1]+xs[i])/2;
    sum+=(xs[i]-xs[i-1])*unionLength(rectangles.filter(r=>r[0]<mid&&r[2]>mid).map(r=>[r[1],r[3]]));
  }
  return sum;
}
export const swap = p => [p[2],p[1],p[0]];
export function translateAlongX(m,offset) {
  const seen=new Set(),move=p=>{if(!seen.has(p)){p[0]+=offset;seen.add(p);}};
  for(const p of m.panels)move(p.worldPositionMm);
  for(const c of [...m.cells,...m.bays]) {move(c.worldCenterMm);if(c.startOffsetMm!==undefined)c.startOffsetMm+=offset;}
  for(const d of m.doors)move(d.pivotWorldMm);
  for(const d of m.drawers) {
    for(const key of Object.keys(d))if(Array.isArray(d[key])&&d[key].length===3&&/(WorldPositionMm|WorldMm)$/.test(key))move(d[key]);
    for(const p of d.organizerPanels??[])move(p.worldPositionMm);
  }
  return m;
}
export function reflectModel(source) {
  const m=structuredClone(source);
  const seen=new Map(),reflect=p=>{if(!seen.has(p))seen.set(p,swap(p));return seen.get(p);};
  const done=new Set();
  const panel=p=>{
    if(done.has(p))return;done.add(p);
    p.worldPositionMm=reflect(p.worldPositionMm);p.boxSizeMm=reflect(p.boxSizeMm);
    if(p.polygonXZMm)p.polygonXZMm=p.polygonXZMm.map(v=>({xMm:v.zMm,zMm:v.xMm}));
    p.rotationYRad=-p.rotationYRad;
  };
  m.panels.forEach(panel);
  for(const c of [...m.cells,...m.bays]) {c.worldCenterMm=reflect(c.worldCenterMm);c.worldSizeMm=reflect(c.worldSizeMm);c.wallAxis='B';c.rotationYRad=Math.PI/2;}
  for(const d of m.doors) {
    d.pivotWorldMm=reflect(d.pivotWorldMm);d.closedRotationYRad=Math.PI/2-d.closedRotationYRad;
    d.openRotationDirection*=-1;d.leafCenterOffsetMm[0]*=-1;d.handleOffsetMm[0]*=-1;
  }
  for(const d of m.drawers) {
    for(const key of Object.keys(d))if(Array.isArray(d[key])&&d[key].length===3&&/(WorldPositionMm|BoxSizeMm|WorldMm|slideDirectionWorld)$/.test(key))d[key]=reflect(d[key]);
    d.wallAxis='B';(d.organizerPanels??[]).forEach(panel);
  }
  return m;
}
export function boxPanel(id,center,size,t,role='wallFiller') {
  const face=size.map((v,i)=>({v,i})).filter(v=>v.v!==t);
  return {id,label:id,runId:'D3-SERVICE',role,shapeKind:'box',worldPositionMm:center,boxSizeMm:size,rotationYRad:0,
    cutWidthMm:face[0]?.v??size[0],cutHeightMm:face[1]?.v??size[1],cutThicknessMm:t,grainAxis:'vertical',materialSlot:'carcass'};
}
export function serviceBox(id,w,d,h,t,tb) {
  // Six separated panels; backs face the two room walls. No double-counted corner solids.
  return [boxPanel(id+'-left',[tb/2,h/2,d/2],[tb,h,d],tb),
    boxPanel(id+'-right',[w-t/2,h/2,d/2],[t,h,d],t),
    boxPanel(id+'-back',[(w+tb-t)/2,h/2,tb/2],[w-t-tb,h,tb],tb),
    boxPanel(id+'-front',[(w+tb-t)/2,h/2,d-t/2],[w-t-tb,h,t],t),
    boxPanel(id+'-bottom',[(w+tb-t)/2,t/2,(d+tb-t)/2],[w-t-tb,t,d-t-tb],t),
    boxPanel(id+'-top',[(w+tb-t)/2,h-t/2,(d+tb-t)/2],[w-t-tb,t,d-t-tb],t)];
}
