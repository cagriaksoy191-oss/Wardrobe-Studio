import assert from 'node:assert/strict';
import {rect} from '../d3/geometry.mjs';

export const B3_VARIANTS=['SINGLE3','DUAL3','DUAL2'];
export function moventoDimensions(lw,{nl=500,side=15,bottom=8}={}) {
  assert.ok(Number.isInteger(lw)&&lw>200);
  assert.ok(nl===500,'Only the documented 760H5000S configuration is modeled');
  assert.ok(Number.isInteger(side)&&side>=12&&side<=16,'MOVENTO side must satisfy the documented <=16 mm condition');
  assert.ok(Number.isInteger(bottom)&&bottom>=6&&bottom<=10);
  return {nl,side,bottom,innerWidth:lw-42,outerWidth:lw-42+2*side,outerLength:nl-10,innerDepth:nl-10-2*side,mountDepth:nl+3,
    source:'Blum catalogue planning 421; SKW INTERNAL width; dimensions nominal +0/-1.5 mm, manufacturing NOT_APPROVED'};
}
function boxPart(d,suffix,center,size,t,role='drawerBox',researchRole='box') {
  const face=size.filter(v=>v!==t);
  return {id:d.id+'-'+suffix,label:suffix,runId:d.runId,bayId:d.bayId,cellId:d.cellId,role,shapeKind:'box',worldPositionMm:center,boxSizeMm:size,rotationYRad:0,
    cutWidthMm:face[0]??size[0],cutHeightMm:face[1]??size[1],cutThicknessMm:t,grainAxis:'horizontal',materialSlot:'carcass',animatedUnitId:d.id,researchRole};
}
function integerGaps(span,n,t) {const units=span-(n-1)*t,q=Math.floor(units/n);return Array.from({length:n},(_,i)=>q+(i===n-1?units-n*q:0));}
export function replaceMoventoBox(model,d,strokeMm) {
  const c=model.cells.find(c=>c.id===d.cellId),dim=moventoDimensions(c.netWidthMm);
  assert.ok(c.netDepthMm>=dim.mountDepth+1,'NL500 mounting depth plus conservative 1 mm preassembly reserve does not fit');
  model.panels=model.panels.filter(p=>p.animatedUnitId!==d.id);
  const x=d.frontWorldPositionMm[0],frontBack=d.frontWorldPositionMm[2]-d.frontBoxSizeMm[2]/2;
  const back=frontBack-dim.outerLength,boxBottom=d.yStartMm+38,boxH=d.heightMm-48;
  assert.ok(boxH>70&&Number.isInteger(strokeMm)&&strokeMm>=1&&strokeMm<=500);
  d.isInternalDrawer=false;d.coveringDoorIds=[];d.sideThicknessMm=dim.side;d.bottomThicknessMm=dim.bottom;
  d.innerWidthMm=dim.innerWidth;d.innerDepthMm=dim.innerDepth;d.innerHeightMm=boxH-dim.bottom;
  d.depthMm=dim.outerLength;d.maxSlideMm=strokeMm;d.slideRatio=null;
  d.boxWorldPositionMm=[x,boxBottom+boxH/2,back+dim.outerLength/2];d.boxSizeMm=[dim.outerWidth,boxH,dim.outerLength];
  d.leftSideWorldPositionMm=[x-dim.outerWidth/2+dim.side/2,boxBottom+boxH/2,back+dim.outerLength/2];d.leftSideBoxSizeMm=[dim.side,boxH,dim.outerLength];
  d.rightSideWorldPositionMm=[x+dim.outerWidth/2-dim.side/2,boxBottom+boxH/2,back+dim.outerLength/2];d.rightSideBoxSizeMm=[dim.side,boxH,dim.outerLength];
  d.backPanelWorldPositionMm=[x,boxBottom+boxH/2,back+dim.side/2];d.backPanelBoxSizeMm=[dim.innerWidth,boxH,dim.side];
  d.bottomPanelWorldPositionMm=[x,boxBottom+dim.bottom/2,back+dim.side+dim.innerDepth/2];d.bottomPanelBoxSizeMm=[dim.innerWidth,dim.bottom,dim.innerDepth];
  const innerFront=boxPart(d,'inner-front',[x,boxBottom+boxH/2,frontBack-dim.side/2],[dim.innerWidth,boxH,dim.side],dim.side,'drawerBox','innerFront');
  const dividers=[],cols=integerGaps(dim.innerWidth,4,dim.bottom),rows=integerGaps(dim.innerDepth,3,dim.bottom),height=Math.min(70,d.innerHeightMm);
  let left=x-dim.innerWidth/2;
  for(let i=0;i<4;i++) {
    if(i<3)dividers.push(boxPart(d,'jewelry-col-'+i,[left+cols[i]+dim.bottom/2,boxBottom+dim.bottom+height/2,back+dim.side+dim.innerDepth/2],[dim.bottom,height,dim.innerDepth],dim.bottom,'drawerBox','organizer'));
    let z=back+dim.side;
    for(let j=0;j<2;j++){z+=rows[j];dividers.push(boxPart(d,`jewelry-row-${i}-${j}`,[left+cols[i]/2,boxBottom+dim.bottom+height/2,z+dim.bottom/2],[cols[i],height,dim.bottom],dim.bottom,'drawerBox','organizer'));z+=dim.bottom;}
    left+=cols[i]+dim.bottom;
  }
  d.organizerPanels=[innerFront,...dividers];d.organizerSlots={columnWidthsMm:cols,rowDepthsMm:rows,heightMm:height};
  const wood=[boxPart(d,'external-front',d.frontWorldPositionMm,d.frontBoxSizeMm,d.frontBoxSizeMm[2],'drawerFront'),
    boxPart(d,'side-left',d.leftSideWorldPositionMm,d.leftSideBoxSizeMm,dim.side),boxPart(d,'side-right',d.rightSideWorldPositionMm,d.rightSideBoxSizeMm,dim.side),
    boxPart(d,'back',d.backPanelWorldPositionMm,d.backPanelBoxSizeMm,dim.side),boxPart(d,'bottom',d.bottomPanelWorldPositionMm,d.bottomPanelBoxSizeMm,dim.bottom),innerFront,...dividers];
  model.panels.push(...wood);
  d.research={...dim,underBoxReserveMm:38,topReserveMm:10,strokeRequestedMm:strokeMm,manufacturerStrokeMm:null,hardwareApproval:'UNVERIFIED',assemblyApproval:'NOT_APPROVED'};
  // Deliberate empty reservation volumes, NOT manufacturer rail CAD or collision solids.
  return [-1,1].map((sign,i)=>({id:d.id+'-runner-reserve-'+i,kind:'runner',worldCenterMm:[x+sign*(c.netWidthMm/2-10.5),boxBottom-14.25,frontBack-dim.mountDepth/2],boxSizeMm:[21,28.5,dim.mountDepth],
    status:'ANALYTICAL_RESERVATION_NOT_PRODUCT_CAD',assemblyDepthMm:dim.mountDepth+1}));
}
export function buildB3(api,{variant='SINGLE3',strokeMm=451,rodHeightMm=1700,blindOpeningLimitDeg=92}={}) {
  assert.ok(B3_VARIANTS.includes(variant));assert.ok(Number.isInteger(rodHeightMm)&&rodHeightMm>=1500&&rodHeightMm<=2000);
  assert.ok([92,155].includes(blindOpeningLimitDeg));
  const d=api.phase5Example('blind');d.id=`EXPERIMENTAL_B3_003_${variant}${strokeMm===451?'':'_STROKE'+strokeMm}${blindOpeningLimitDeg===92?'':'_UNLIMITED155'}`;d.name=d.id;d.fronts=[];d.obstacles=[];d.ledLighting={...d.ledLighting,enabled:false};
  for(const r of d.runs)r.constructionMode='separate';
  const [a,b]=d.runs;a.bays=[{...a.bays[0],id:d.id+'-A-BLIND',frontMode:'double',autoFront:true,hingeAngleDeg:155},...([864,866].map((width,i)=>{
    const prefix=d.id+'-A-C'+(i+1),withDrawer=i===0||variant!=='SINGLE3';
    return {id:prefix,label:`A çekmece/askı ${i+1}`,width:{kind:'fixed',mm:width},locked:true,owner:'anne',frontMode:'double',autoFront:true,hingeAngleDeg:155,
      root:withDrawer?{kind:'split',id:prefix+'-root',direction:'horizontal',children:[
        {id:prefix+'-lower',size:{kind:'fixed',mm:690},node:{kind:'leaf',id:prefix+'-drawers',label:'Dış takı çekmeceleri',owner:'anne',insert:{type:'drawerBank',drawerCount:variant==='DUAL2'?2:3,isInternalDrawer:false,storageTemplate:'jewelryDrawer'}}},
        {id:prefix+'-upper',size:{kind:'flex',weight:1},node:{kind:'leaf',id:prefix+'-rod',label:'Bağımsız üst askı',owner:'anne',insert:{type:'hangingRod',rodHeightMm:rodHeightMm-(a.plinthHeightMm+2*a.panelThicknessMm+690)}}},
      ]}:{kind:'leaf',id:prefix+'-shelves',label:'A rafları',owner:'ortak',insert:{type:'shelfStack',shelfCount:5}}};
  }))];
  b.bays=[954,956].map((width,i)=>({id:d.id+'-B-C'+(i+1),label:'B rafları '+(i+1),width:{kind:'fixed',mm:width},locked:true,owner:'ortak',frontMode:'double',autoFront:true,hingeAngleDeg:155,
    root:{kind:'leaf',id:d.id+'-B-shelves-'+i,label:'B rafları',owner:'ortak',insert:{type:'shelfStack',shelfCount:4}}}));
  const context=api.normalizeAndValidateDesign(d),model=api.solveDesign(context),reservations=[];
  assert.ok(!model.issues.some(i=>i.severity==='error'),'Invalid component geometry');
  // Fixed blind face belongs on the external facade plane. The canonical solver puts it
  // inside full-depth horizontal panels; correct ONLY this explicit experimental assembly.
  const blindFace=model.panels.find(p=>p.id==='junc-custom-blind-filler-A');
  assert.ok(blindFace);const originalBlindFaceZ=blindFace.worldPositionMm[2];
  blindFace.worldPositionMm[2]=a.depthMm+a.panelThicknessMm/2+1;
  // Explicit research motion envelope; Design v1 is NOT extended. Real 92-degree
  // limiter 70T7553.09 is only a BOM candidate until mounting/kinematics are verified.
  for(const door of model.doors)if(door.yStartMm<700)door.maxAngleDeg=blindOpeningLimitDeg;
  for(const drawer of model.drawers)reservations.push(...replaceMoventoBox(model,drawer,strokeMm));
  for(const door of model.doors)reservations.push({id:door.id+'-hinge-reservation',kind:'hinge',worldCenterMm:[door.pivotWorldMm[0],door.yStartMm+100,door.pivotWorldMm[2]-30],boxSizeMm:[50,120,60],status:'ANALYTICAL_RESERVATION_NOT_PRODUCT_CAD'});
  const scene=api.planHingeOpenings(context,model);model.analysis=api.resolveStudioAnalysis(context,model,scene);
  const footprints=[rect(0,0,3000,600),rect(0,670,600,1930)];
  return {id:d.id,kind:'blind',variant,layout:variant,mechanism:'H5',context,model,scene,footprints,reservations,
    parameters:{t:18,tb:8,rodHeightMm,drawerBankHeightMm:690,drawerSideMm:15,drawerBottomMm:8,nominalLengthMm:500,strokeRequestedMm:strokeMm,blindOpeningLimitDeg,fixedBlindFaceZ:{before:originalBlindFaceZ,experimental:blindFace.worldPositionMm[2]}},
    sealedVoidGrossMm3:0,sealedVoidNetMm3:0,geometryContract:{simulation:'IDEALIZED_HINGE_SIMULATION',hardwareKinematics:'HARDWARE_KINEMATICS_UNVERIFIED',productionApproval:'NOT_APPROVED',storeImportAllowed:false}};
}
export function exportManufacturing(){throw new Error('NOT_APPROVED: B3 research has no manufacturing CSV/ZIP export');}
