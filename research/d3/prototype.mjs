import assert from 'node:assert/strict';
import { reflectModel, translateAlongX, serviceBox, rect, rectangleUnionArea } from './geometry.mjs';

export const DISCLAIMER='DENEYSEL CAD — ÜRETİM ONAYI YOK';
export function distributeWidths(span, maxModuleMm) {
  assert.ok(Number.isInteger(span)&&span>0&&span%2===0,'Module span must be a positive even integer mm');
  assert.ok(Number.isInteger(maxModuleMm)&&maxModuleMm>=400,'Invalid module limit');
  const n=Math.ceil(span/maxModuleMm), units=span/2, q=Math.floor(units/n), remainder=units-q*n;
  const result=Array.from({length:n},(_,i)=>2*(q+(i>=n-remainder?1:0)));
  assert.ok(result.every(v=>v>=400&&v<=maxModuleMm),'Allocation outside bounds');
  return result;
}
export function buildPrototype(api,{kind='diagonal',fillerMm=70,layout='shelf',mechanism='H5',maxLeafMm}={}) {
  assert.ok(['diagonal','asymmetric'].includes(kind));
  assert.ok(Number.isInteger(fillerMm)&&fillerMm>=0&&fillerMm<=200,'Invalid analytical filler');
  assert.ok(['shelf','hanging'].includes(layout));
  assert.ok(['H5','H1'].includes(mechanism));
  const original=api.phase5Example(kind),t=original.runs[0].panelThicknessMm,tb=original.runs[0].backPanelThicknessMm;
  const leafLimit=maxLeafMm??(t===18?550:450);
  assert.ok(Number.isInteger(leafLimit)&&leafLimit>=250&&leafLimit<=600,'Unsupported leaf research envelope');
  const id=`EXPERIMENTAL_D3_${t===18?'001':'002'}_${fillerMm}_${layout}_${mechanism}${maxLeafMm===undefined?'':'_leaf'+leafLimit}`;
  const serviceW=original.runs[1].depthMm+fillerMm,serviceD=original.runs[0].depthMm+fillerMm;
  const componentDesigns=[],models=[],globalRuns=[],placements=[];
  for(const [index,sourceRun] of original.runs.entries()) {
    const runId=id+'-'+sourceRun.wallAxis,start=index?serviceD:serviceW;
    const widths=distributeWidths(sourceRun.lengthMm-start-sourceRun.endFillerMm,leafLimit*2);
    const d=structuredClone(original);d.id=runId;d.name=id;d.layoutKind='straight';d.junctions=[];d.fronts=[];
    d.ledLighting={...d.ledLighting,enabled:false};d.obstacles=[];
    const run={...structuredClone(sourceRun),id:runId,wallAxis:'A',constructionMode:'separate',lengthMm:sourceRun.lengthMm-start,startFillerMm:0};
    run.bays=widths.map((w,i)=>{
      const prefix=runId+'-M'+(i+1),first=index===0&&i===0,hanging=index===0&&(first||(layout==='hanging'&&i===1));
      const rod=(cellY)=>({kind:'leaf',id:prefix+'-hanging',label:prefix+' Askı',owner:'anne',insert:{type:'hangingRod',rodHeightMm:1700-cellY}});
      const root=first?{kind:'split',id:prefix+'-root',direction:'horizontal',children:[
        {id:prefix+'-lower',size:{kind:'fixed',mm:620},node:{kind:'leaf',id:prefix+'-drawers',label:prefix+' Çekmece',owner:'anne',insert:{type:'drawerBank',drawerCount:3,isInternalDrawer:false,storageTemplate:'jewelryDrawer'}}},
        {id:prefix+'-upper',size:{kind:'flex',weight:1},node:rod(sourceRun.plinthHeightMm+2*t+620)},
      ]}:hanging?rod(sourceRun.plinthHeightMm+t):{kind:'leaf',id:prefix+'-shelves',label:prefix+' Raf',owner:'ortak',insert:{type:'shelfStack',shelfCount:index===0?5:4}};
      return {id:prefix,label:prefix,width:{kind:'fixed',mm:w},locked:true,owner:hanging?'anne':'ortak',autoFront:true,frontMode:'double',hingeAngleDeg:155,root};
    });
    d.runs=[run];
    const normalized=api.normalizeAndValidateDesign(d),local=api.solveDesign(normalized);
    assert.ok(!local.issues.some(i=>i.severity==='error'),'Component solver errors: '+JSON.stringify(local.issues.filter(i=>i.severity==='error')));
    translateAlongX(local,start);
    models.push(index?reflectModel(local):local);
    globalRuns.push({...normalized.runs[0],lengthMm:sourceRun.lengthMm,wallAxis:sourceRun.wallAxis});componentDesigns.push(normalized);
    placements.push({runId,axis:sourceRun.wallAxis,startMm:start,moduleWidthsMm:widths});
  }
  const model={designId:id,panelThicknessMm:t,backPanelThicknessMm:tb,panels:models.flatMap(m=>m.panels),doors:models.flatMap(m=>m.doors),drawers:models.flatMap(m=>m.drawers),bays:models.flatMap(m=>m.bays),cells:models.flatMap(m=>m.cells),corners:[],slidingDoors:[],slidingSystems:[],ledStrips:[],dimensions:[],issues:[],summary:{}};
  model.panels.push(...serviceBox(id+'-service',serviceW,serviceD,2400,t,tb));
  // This is an analysis context, NOT an exportable Design-v1 aggregate. The two components above are valid Design v1.
  const context={...structuredClone(original),id,runs:globalRuns,junctions:[],fronts:[],obstacles:[]};
  const scene=api.planHingeOpenings(context,model);
  model.analysis=api.resolveStudioAnalysis(context,model,scene);
  const footprints=[rect(0,0,serviceW,serviceD),...globalRuns.map((r,i)=>r.wallAxis==='A'?rect(placements[i].startMm,0,r.lengthMm-placements[i].startMm,r.depthMm):rect(0,placements[i].startMm,r.depthMm,r.lengthMm-placements[i].startMm))];
  return {id,kind,fillerMm,layout,mechanism,context,componentDesigns,placements,model,scene,
    parameters:{t,tb,leafLimit,serviceW,serviceD,rodHeightMm:1700,drawerBankHeightMm:620,endFillerMm:20},
    geometryContract:{simulation:'IDEALIZED_HINGE_SIMULATION',hardwareKinematics:'HARDWARE_KINEMATICS_UNVERIFIED',productionApproval:'NOT_APPROVED',storeImportAllowed:false},
    footprintMm2:rectangleUnionArea(footprints.map(p=>[p[0].xMm,p[0].zMm,p[2].xMm,p[2].zMm])),
    sealedVoidGrossMm3:serviceW*serviceD*2400,sealedVoidNetMm3:(serviceW-t-tb)*(serviceD-t-tb)*(2400-2*t),
    servicePanels:model.panels.filter(p=>p.runId==='D3-SERVICE').map(p=>p.id),footprints};
}
export function manufacturingExport() {throw new Error('NOT_APPROVED: experimental D3 has no manufacturing CSV/ZIP export');}
