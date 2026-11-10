import {createServer} from 'vite';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const server=await createServer({server:{middlewareMode:true},appType:'custom'});
const acceptance=process.argv.includes('--user-acceptance');
const professional=acceptance||process.argv.includes('--professional-polish');
const fixtureRoot=acceptance?'artifacts/final-user-acceptance/production':professional?'artifacts/final-professional-polish/production':'artifacts/phase5/examples';
try {
  const {phase5Example}=await server.ssrLoadModule('/src/core/presets/phase5Examples.ts');
  const {solveDesign}=await server.ssrLoadModule('/src/core/solver/carcassSolver.ts');
  const {normalizeAndValidateDesign}=await server.ssrLoadModule('/src/core/schema/designSchema.ts');
  const {extractProduction}=await server.ssrLoadModule('/src/core/production/productionModel.ts');
  const {buildTechnicalSheets,sheetToSvg,buildPrintableReport}=await server.ssrLoadModule('/src/core/production/technicalSheets.ts');
  const {buildCutListCsv}=await server.ssrLoadModule('/src/core/production/csvExport.ts');
  const {createProductionPdf}=await server.ssrLoadModule('/src/export/pdfWriter.ts');
  const {createTechnicalZip}=await server.ssrLoadModule('/src/export/zipWriter.ts');
  const {buildMotionScene,constrainMotion}=await server.ssrLoadModule('/src/core/analysis/motionConstraints.ts');
  const font=(await readFile('public/fonts/NotoSans-Regular.ttf')).toString('base64'),records=[];
  if(!professional)await mkdir('output/pdf',{recursive:true});
  await mkdir(fixtureRoot,{recursive:true});
  for(const kind of ['straight','diagonal','blind','asymmetric']) {
    const previous=acceptance?'final-professional-polish':'final-remediation';
    const source=professional?JSON.parse(await readFile(`artifacts/${previous}/production/${kind}/design.json`,'utf8')):phase5Example(kind);
    const design=normalizeAndValidateDesign(source),model=solveDesign(design);
    const pkg=extractProduction(design,model,acceptance?'Kullanıcı kabul örneği':professional?`Son geometri doğrulaması / ${kind}`:`Aşama 5 — ${kind}`,professional?new Date().toISOString():'2026-11-04T14:20:00Z');
    const sheets=buildTechnicalSheets(design,model,pkg,professional);
    const folder=`${fixtureRoot}/${kind}`;await mkdir(`${folder}/svg`,{recursive:true});
    await writeFile(`${folder}/design.json`,JSON.stringify(design,null,2));await writeFile(`${folder}/production.json`,JSON.stringify(pkg,null,2));
    if(!acceptance||pkg.accessStatus!=='blocked') {
      await writeFile(`${folder}/cut-list.csv`,buildCutListCsv(pkg,professional));
      await writeFile(`${folder}/technical-package.zip`,createTechnicalZip(design,pkg,sheets,professional));
    }
    await writeFile(`${folder}/report.html`,buildPrintableReport(pkg,sheets).replace("url('./fonts/NotoSans-Regular.ttf')",`url('data:font/ttf;base64,${font}')`));
    for(const sheet of sheets)await writeFile(`${folder}/svg/${sheet.id}.svg`,sheetToSvg(sheet));
    const bytes=new Uint8Array(createProductionPdf(pkg,sheets,font));
    const path=acceptance?`${folder}/wardrobe-acceptance-${kind}${pkg.accessStatus==='blocked'?'-diagnostic':''}.pdf`
      :professional?`${folder}/wardrobe-professional-${kind}.pdf`:`output/pdf/wardrobe-phase5-${kind}.pdf`;
    await writeFile(path,bytes);
    const scene=buildMotionScene(design,model),motionChecks=scene.parts.map(p=>({id:p.id,kind:p.kind,home:p.home,requested:p.open,...constrainMotion(scene,{},p.id,p.open)}));
    if(professional) {
      await writeFile(`${folder}/resolved-model.json`,JSON.stringify(model,null,2));
      await writeFile(`${folder}/motion-checks.json`,JSON.stringify(motionChecks,null,2));
    }
    const record={kind,path,pages:sheets.length,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),parts:pkg.parts.length,drawerComponents:pkg.parts.filter(p=>p.role.startsWith('drawer')).length,polygons:pkg.parts.filter(p=>p.shape==='polygon').length,errors:pkg.issues.filter(i=>i.severity==='error'),materials:pkg.materialSummary,runs:pkg.runDimensions,sheets:sheets.map(s=>({id:s.id,title:s.title,scale:s.scale})),motionChecks,...(acceptance?{accessStatus:pkg.accessStatus}: {})};records.push(record);console.log(JSON.stringify({kind,pages:record.pages,parts:record.parts,polygons:record.polygons,bytes:record.bytes,errors:record.errors.length,access:pkg.accessStatus}));
  }
  await writeFile(`${fixtureRoot}/manifest.json`,JSON.stringify(records,null,2));
} finally {await server.close();}
