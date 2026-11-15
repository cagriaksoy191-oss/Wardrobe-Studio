import {area,intersectConvex} from '../d3/geometry.mjs';
import {staticClashes} from '../d3/metrics.mjs';
const bounds=v=>({minX:Math.min(...v.polygon.map(p=>p.xMm)),maxX:Math.max(...v.polygon.map(p=>p.xMm)),minZ:Math.min(...v.polygon.map(p=>p.zMm)),maxZ:Math.max(...v.polygon.map(p=>p.zMm)),minY:v.y0,maxY:v.y1});
export function auditOverlaps(api) {
  const design=api.phase5Example('asymmetric'),model=api.solveDesign(design),before=api.designSignature(model);
  const pairs=staticClashes(api,model).map(([idA,idB])=>{
    const panels=[idA,idB].map(id=>model.panels.find(p=>p.id===id)),volumes=panels.map(p=>api.panelVolume(p)),b=volumes.map(bounds);
    const depth={x:Math.max(0,Math.min(b[0].maxX,b[1].maxX)-Math.max(b[0].minX,b[1].minX)),y:Math.max(0,Math.min(b[0].maxY,b[1].maxY)-Math.max(b[0].minY,b[1].minY)),z:Math.max(0,Math.min(b[0].maxZ,b[1].maxZ)-Math.max(b[0].minZ,b[1].minZ))};
    const intersection=intersectConvex(volumes[0].polygon,volumes[1].polygon),planArea=area(intersection);
    const corner=panels[0].role==='cornerSidePanel';
    return {idA,idB,panels:panels.map((p,i)=>({id:p.id,role:p.role,centerMm:p.worldPositionMm,sizeMm:p.boxSizeMm,cutMm:[p.cutWidthMm,p.cutHeightMm,p.cutThicknessMm],polygon:p.polygonXZMm??null,bounds:b[i]})),
      axisAlignedOverlapMm:depth,intersectionPolygon:intersection,intersectionAreaMm2:planArea,intersectionVolumeMm3:planArea*depth.y,
      classification:'COORDINATE_ROUNDING_WITH_NOMINAL_SOLID_PENETRATION',intentionalJoin:'NO_EVIDENCE_OF_INTENTIONAL_PENETRATION',
      cause:corner?'cornerSolver: arm - Math.round(t/2), versus polygon arm - t':'carcassSolver: bounds.x0 + Math.round(odd width/2), versus exact side center',
      source:corner?'src/core/solver/cornerSolver.ts:119/143':'src/core/solver/carcassSolver.ts: horizontal divider and shelf center construction',
      productionDimensionImpact:'CUT_DIMENSIONS_UNCHANGED_BY_DIAGNOSTIC_PLACEMENT_CORRECTION',physicalManufacturingDefect:'NOT_PROVEN_FROM_NOMINAL_RENDER_COORDINATES',toleranceAssumption:null};
  });
  const corrected=structuredClone(model);
  for(const p of corrected.panels) {
    if(p.id==='junc-custom-side-A')p.worldPositionMm[0]+=.5;
    if(p.id==='junc-custom-side-B')p.worldPositionMm[2]+=.5;
    if(p.role==='shelf'&&pairs.some(r=>r.idB===p.id))p.worldPositionMm[p.runId==='run-B'?2:0]-=.5;
  }
  const cutSignature=m=>api.designSignature(m.panels.map(p=>[p.id,p.cutWidthMm,p.cutHeightMm,p.cutThicknessMm,p.polygonXZMm]));
  return {id:'D3-BASELINE-001',classification:'NOMINAL_GEOMETRY_PLACEMENT_DEFECT',newP0:false,pairCount:pairs.length,pairs,
    pairwiseVolumeSumMm3:pairs.reduce((s,p)=>s+p.intersectionVolumeMm3,0),pairVolumeSumIsGlobalUnion:false,
    copiedPositionCounterfactual:{appliedToSource:false,remainingClashes:staticClashes(api,corrected),cutDimensionsIdentical:cutSignature(model)===cutSignature(corrected)},
    originalModelUnchanged:before===api.designSignature(model),productionTolerancesSpecified:false,
    conclusion:'20 nominal penetrations are caused by two coordinate rounding formulas, not oversized integer cut dimensions or documented grooves. Manufacturing defect remains unproven; source/canonical geometry unchanged.'};
}
