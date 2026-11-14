import {massKg} from './metrics.mjs';
export function screenHardware(doors,mechanism) {
  return doors.map(d=>{
    const isH1=mechanism==='H1';
    const panelUpper=massKg(d.widthMm,d.heightMm,d.thicknessMm,800);
    // 1 kg is an analytic allowance, never the measured hardware mass.
    const analyticTotalUpperKg=panelUpper+1;
    return {id:d.id,mechanism,widthMm:d.widthMm,heightMm:d.heightMm,thicknessMm:d.thicknessMm,panelMassKg650to800:d.panelMassKgRange,
      actualMaterialDensityKgM3:null,actualHardwareMassKg:null,analyticAllowanceKg:1,analyticTotalUpperKg,
      widthScreen:isH1?(d.widthMm>=250&&d.widthMm<=600?'PASS':'FAIL'):'UNVERIFIED',
      thicknessScreen:isH1?(d.thicknessMm>=16&&d.thicknessMm<=25?'PASS':'FAIL'):'CONDITIONAL_TB_PLATE_GAP',
      heightScreen:isH1?(d.heightMm>=1000&&d.heightMm<=2400?'PASS_COMMON_DOCUMENT_RANGE':'FAIL'):'UNVERIFIED',
      massScreen:isH1?(analyticTotalUpperKg<=25?'ANALYTIC_SCREEN_PASS':'FAIL'):'UNVERIFIED',
      catalogueFmm:isH1?{singleOverlay:d.thicknessMm===18?61:d.thicknessMm===25?67:null,dualOverlay:d.thicknessMm===18?71:d.thicknessMm===25?77:null,source:'WingLine L installation p4, Sensys 8645i/8675 110 nominal / 100 effective',assemblyReferencePlane:'UNVERIFIED'}:null,
      hingeCount:isH1?{candidate:d.heightMm>2000?5:null,basis:'WingLine L tall-door installation chart only; shorter leaf count and final BOM/mount UNVERIFIED'}:null,
      codes:isH1?['9237880 (left, no closing spring)','9237881 (right, no closing spring)','Sensys 8675 without closing spring — exact variant UNVERIFIED']:['71B7550 full overlay screw-on (candidate)','71B7650 half overlay (alternative, not interchangeable)'],
      missingBOM:isH1?['exact cabinet hinge and middle hinges','top running/guide profiles and lengths','Pull/Push activation set','fasteners and profile cuts']:['mounting plate variant/height','TB and overlay/reveal','hinge quantity by actual height and mass','fasteners and boring pattern for substrate'],
      kinematics:'HARDWARE_KINEMATICS_UNVERIFIED',orderApproval:'NOT_APPROVED'};
  });
}
