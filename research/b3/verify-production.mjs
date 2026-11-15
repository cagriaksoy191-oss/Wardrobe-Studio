import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createServer} from 'vite';
const vite=await createServer({server:{middlewareMode:true},appType:'custom'});
try {
 const {phase5Example}=await vite.ssrLoadModule('/src/core/presets/phase5Examples.ts');
 const {solveDesign}=await vite.ssrLoadModule('/src/core/solver/carcassSolver.ts');
 const {extractProduction}=await vite.ssrLoadModule('/src/core/production/productionModel.ts');
 const {designSignature}=await vite.ssrLoadModule('/src/core/versions/designExchange.ts');
 const {buildTechnicalSheets,sheetToSvg}=await vite.ssrLoadModule('/src/core/production/technicalSheets.ts');
 const {createProductionPdf}=await vite.ssrLoadModule('/src/export/pdfWriter.ts');
 const golden=await readFile('ENGINEERING_INVARIANTS.md','utf8'),font=(await readFile('public/fonts/NotoSans-Regular.ttf')).toString('base64'),records=[];
 const hash=v=>createHash('sha256').update(designSignature(v)).digest('hex');
 await mkdir('artifacts/portable-cad/canonical',{recursive:true});
 for(const [i,kind]of ['straight','diagonal','blind','asymmetric'].entries()) {
  const design=phase5Example(kind),model=solveDesign(design),pkg=extractProduction(design,model,'QA','2026-11-04T12:00:00.000Z');
  const signatures=[hash(design),hash(model),hash(pkg)],row=golden.split('\n').find(l=>l.startsWith('| `'+kind+'` |'));
  assert.deepEqual(signatures,[...row.matchAll(/`([a-f0-9]{64})`/g)].map(m=>m[1]));assert.equal(pkg.parts.length,[69,94,81,94][i]);
  const sheets=buildTechnicalSheets(design,model,pkg),svg=sheets.map(s=>sheetToSvg(s));
  if(kind!=='straight') {assert.equal(pkg.accessStatus,'blocked');assert.ok(svg.some(s=>s.includes('TANISAL')));}
  await writeFile(`artifacts/portable-cad/canonical/${kind}.wardrobe.json`,JSON.stringify(design,null,2));
  await writeFile(`artifacts/portable-cad/canonical/${kind}-diagnostic.svg`,svg[0]);
  const pdf=new Uint8Array(createProductionPdf(pkg,sheets,font));assert.equal(new TextDecoder().decode(pdf.subarray(0,5)),'%PDF-');
  await writeFile(`artifacts/portable-cad/canonical/${kind}-diagnostic.pdf`,pdf);
  records.push({kind,parts:pkg.parts.length,signatures,accessStatus:pkg.accessStatus,pages:sheets.length,pdfBytes:pdf.length,diagnostic:kind!=='straight'});
 }
 await writeFile('artifacts/portable-cad/canonical-verification.json',JSON.stringify({signaturesPassed:12,parts:338,records},null,2));console.log(JSON.stringify(records.map(r=>({kind:r.kind,parts:r.parts,pages:r.pages,access:r.accessStatus}))));
} finally {await vite.close();}
