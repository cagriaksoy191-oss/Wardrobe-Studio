import {describe,it,expect} from 'vitest';
import {phase5Example} from '../src/core/presets/phase5Examples';
import {solveDesign} from '../src/core/solver/carcassSolver';
import {assertProductionReady,extractProduction,partCode,MATERIAL_NAMES} from '../src/core/production/productionModel';
import {buildCutListCsv,csvCell} from '../src/core/production/csvExport';
import {buildPrintableReport,buildTechnicalSheets,sheetToSvg} from '../src/core/production/technicalSheets';
import {normalizeAndValidateDesign} from '../src/core/schema/designSchema';
import {createTechnicalZip} from '../src/export/zipWriter';
import {unzipSync,strFromU8} from 'fflate';
import {MATERIAL_CATALOG} from '../src/canvas/materials/materialRegistry';

describe('Phase 5 — canonical production and vector documents',()=>{
  it('uses the same material labels as the existing PBR picker',()=>{for(const m of Object.values(MATERIAL_CATALOG))expect(MATERIAL_NAMES[m.id]).toBe(m.name);});
  it.each(['straight','diagonal','blind','asymmetric']as const)('extracts a consistent %s production package',kind=>{
    const d=phase5Example(kind),r=solveDesign(normalizeAndValidateDesign(d)),p=extractProduction(d,r,'Doğrulama','2026-11-04T12:00:00Z');
    expect(p.issues.filter(i=>i.severity==='error')).toEqual([]);expect(p.status).toBe('review');expect(()=>assertProductionReady(p)).not.toThrow();
    expect(new Set(p.parts.map(p=>p.code)).size).toBe(p.parts.length);
    expect(p.parts.every(p=>[p.widthMm,p.heightMm,p.thicknessMm].every(n=>Number.isInteger(n)&&n>0))).toBe(true);
    expect(p.materialSummary.reduce((s,m)=>s+m.quantity,0)).toBe(p.parts.filter(p=>p.shape!=='assembly').length);
    expect(extractProduction(d,solveDesign(d)).parts.map(p=>p.code)).toEqual(p.parts.map(p=>p.code));
    expect(p.runDimensions[0].totalDepthMm).toBe(d.runs[0].depthMm+r.slidingSystems![0].trackDepthMm);
  });
  it('lists five real drawer panels plus each organizer without the decorative outer box',()=>{
    const d=phase5Example('straight'),r=solveDesign(d),p=extractProduction(d,r);
    for(const drawer of r.drawers){const parts=p.parts.filter(p=>p.unitId===drawer.id);expect(parts.filter(p=>p.role!=='drawerOrganizer')).toHaveLength(5);expect(parts.filter(p=>p.role==='drawerOrganizer')).toHaveLength(drawer.organizerPanels!.length);
      expect(parts.filter(p=>p.role==='drawerSide')).toHaveLength(2);expect(parts.find(p=>p.role==='drawerBottom')?.thicknessMm).toBe(8);
      expect(parts.some(p=>p.sourceId===`${drawer.cellId}-drawer-box-${drawer.drawerIndex+1}`)).toBe(false);
    }
  });
  it('uses per-run 25/4 mm for all body and drawer components',()=>{
    const d=phase5Example('asymmetric'),r=solveDesign(d),p=extractProduction(d,r);
    expect(p.parts.filter(p=>['sidePanel','topPanel','bottomPanel','shelf','drawerSide','drawerBack','drawerFront','doorLeaf'].includes(p.role)).every(p=>p.thicknessMm===25)).toBe(true);
    expect(p.parts.filter(p=>['backPanel','drawerBottom','drawerOrganizer','cornerBackPanel'].includes(p.role)).every(p=>p.thicknessMm===4)).toBe(true);
    expect(p.materialSummary.some(m=>m.thicknessMm===4)).toBe(true);
  });
  it('counts N+1 shared vertical panels and preserves separate legacy neighbours',()=>{
    const d=phase5Example('straight');d.fronts=[];
    let p=extractProduction(d,solveDesign(d));expect(p.parts.filter(p=>p.role==='sidePanel')).toHaveLength(3);
    expect(p.parts.filter(p=>p.moduleIds.length===2&&p.role==='sidePanel')).toHaveLength(1);
    delete d.runs[0].constructionMode;p=extractProduction(d,solveDesign(d));expect(p.parts.filter(p=>p.role==='sidePanel')).toHaveLength(4);
  });
  it('preserves every polygon vertex, edge length, angle and actual area',()=>{
    const d=phase5Example('asymmetric'),r=solveDesign(d),p=extractProduction(d,r),polygons=p.parts.filter(p=>p.shape==='polygon');
    expect(polygons.length).toBeGreaterThan(2);
    for(const part of polygons){expect(part.edges).toHaveLength(part.verticesMm!.length);expect(part.edges.every(e=>e.lengthMm>0&&e.interiorAngleDeg>0)).toBe(true);expect(part.edges.reduce((s,e)=>s+e.interiorAngleDeg,0)).toBeCloseTo((part.verticesMm!.length-2)*180,6);expect(part.areaMm2).toBeLessThan(part.widthMm*part.heightMm);expect(part.edges.some(e=>e.orientation==='Eğik ön kenar')).toBe(true);}
    const c=r.corners[0];expect(c.outerFrontSpanMm).toBe(Math.round(Math.hypot(d.junctions[0].diagonalArmAMm-d.runs[1].depthMm,d.junctions[0].diagonalArmBMm-d.runs[0].depthMm)));
    const v=c.innerPolygonXZMm;expect(c.frontOpeningWidthMm).toBe(Math.round(Math.hypot(v[2].xMm-v[3].xMm,v[2].zMm-v[3].zMm)));
  });
  it('matches full CSV rows, sheet part references and all polygon drawings',()=>{
    const d=phase5Example('asymmetric'),r=solveDesign(d),p=extractProduction(d,r),s=buildTechnicalSheets(d,r,p),csv=buildCutListCsv(p);
    expect(csv.charCodeAt(0)).toBe(0xfeff);expect(csv.split('\r\n').filter(Boolean)).toHaveLength(p.parts.length+1);
    for(const part of p.parts){expect(csv).toContain(part.code);expect(s.some(s=>s.partCodes.includes(part.code)||s.elements.some(e=>e.kind==='text'&&e.text.includes(part.code)))).toBe(true);if(part.verticesMm){const detail=s.find(s=>s.id===`10-${part.code}`);expect(detail?.partCodes).toContain(part.code);expect(s.find(s=>s.id.startsWith(`10-${part.code}-KOORD`))).toBeDefined();}}
    expect(s.some(s=>s.id==='03-CEPHE-A')).toBe(true);expect(s.some(s=>s.id==='03-CEPHE-B')).toBe(true);expect(s.some(s=>s.id==='04-PLAN')).toBe(true);expect(s.some(s=>s.id==='05-KESIT-A')).toBe(true);
  });
  it.each(['straight','diagonal','blind','asymmetric']as const)('keeps all %s drawing commands within A3 page boundaries',kind=>{
    const d=phase5Example(kind),r=solveDesign(d),p=extractProduction(d,r),s=buildTechnicalSheets(d,r,p);
    for(const sheet of s){expect(sheet.widthMm).toBe(420);expect(sheet.heightMm).toBe(297);for(const el of sheet.elements){const coords=el.kind==='text'?[el.at]:el.kind==='line'?[el.a,el.b]:el.points;for(const [x,y]of coords){expect(x,`${sheet.id} x`).toBeGreaterThanOrEqual(0);expect(x,`${sheet.id} x`).toBeLessThanOrEqual(420);expect(y,`${sheet.id} y`).toBeGreaterThanOrEqual(0);expect(y,`${sheet.id} y`).toBeLessThanOrEqual(297);}if(el.kind==='text')expect(el.size).toBeGreaterThanOrEqual(2.5);}}
  });
  it('escapes SVG and print HTML and neutralizes spreadsheet formulas',()=>{
    const d=phase5Example('straight');d.name='<script>alert(1)</script>';const p=extractProduction(d,solveDesign(d)),s=buildTechnicalSheets(d,solveDesign(d),p);
    expect(sheetToSvg(s[0])).not.toContain('<script>');expect(buildPrintableReport(p,s)).not.toContain('<script>alert');expect(csvCell('=SUM(1,2)')).toBe('"\'=SUM(1,2)"');expect(csvCell('a;"b"')).toBe('"a;""b"""');expect(partCode('same')).toBe(partCode('same'));
  });
  it('separates glass assembly envelope from unknown glass raw cut',()=>{
    const d=phase5Example('straight');d.fronts[0].materialId='clearGlass';const r=solveDesign(d),p=extractProduction(d,r),glass=p.parts.filter(p=>p.shape==='assembly');expect(glass).toHaveLength(3);expect(glass.every(p=>p.rawCut.includes('belirlenmedi'))).toBe(true);expect(p.materialSummary.some(m=>m.materialId==='clearGlass')).toBe(false);
  });
  it('blocks production exports for critical geometry rather than granting approval',()=>{
    const d=phase5Example('straight');d.fronts[0].sliding!.trackDepthMm=50;const p=extractProduction(d,solveDesign(d));expect(p.status).toBe('blocked');expect(()=>buildCutListCsv(p)).toThrow('Kritik');expect(()=>assertProductionReady(p)).toThrow();
    const blind=phase5Example('blind');blind.junctions[0].fillerWidthMm=44;const invalidCorner=extractProduction(blind,solveDesign(blind));expect(invalidCorner.status).toBe('blocked');expect(invalidCorner.issues.some(i=>i.code==='BLIND_CORNER_FILLER_TOO_NARROW'&&i.severity==='error')).toBe(true);
  });
  it('round-trips the exact full CSV, all SVG pages and source Design through the downloadable ZIP',()=>{
    const d=phase5Example('asymmetric'),r=solveDesign(d),p=extractProduction(d,r),s=buildTechnicalSheets(d,r,p),zip=unzipSync(createTechnicalZip(d,p,s));
    expect(Object.keys(zip)).toHaveLength(s.length+4);expect(zip['kesim-listesi.csv']).toEqual(new TextEncoder().encode(buildCutListCsv(p)));expect(Array.from(zip['kesim-listesi.csv'].slice(0,3))).toEqual([239,187,191]);expect(JSON.parse(strFromU8(zip['design.json']))).toEqual(d);expect(JSON.parse(strFromU8(zip['uretim-modeli.json'])).parts).toHaveLength(p.parts.length);expect(Object.keys(zip).filter(k=>k.startsWith('svg/'))).toHaveLength(s.length);
  });
});
