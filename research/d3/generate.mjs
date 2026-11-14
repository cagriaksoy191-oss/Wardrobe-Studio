import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve,relative,isAbsolute} from 'node:path';
import {createHash} from 'node:crypto';
import {loadEngine} from './engine.mjs';
import {buildPrototype,DISCLAIMER} from './prototype.mjs';
import {summarize} from './metrics.mjs';
import {screenHardware} from './hardware.mjs';
import {makeSheet,indexHtml} from './visuals.mjs';
const root=process.cwd(),out=resolve(process.argv[2]??'artifacts/d3-cad/output'),rel=relative(root,out);
assert.ok(rel&&!rel.startsWith('..')&&!isAbsolute(rel),'Output must remain inside this worktree');
await mkdir(out,{recursive:true});const api=await loadEngine(),summaries=[],hashes={};
const emit=async(name,value)=>{const b=typeof value==='string'?value:JSON.stringify(value,null,2)+'\n';await writeFile(resolve(out,name),b);hashes[name]=createHash('sha256').update(b).digest('hex');};
for(const kind of ['diagonal','asymmetric']) {
  const d=api.phase5Example(kind),model=api.solveDesign(d),p={id:'ORIGINAL_'+kind,kind,context:d,model,scene:api.planHingeOpenings(d,model)};
  const s=summarize(api,p);summaries.push(s);await emit(p.id+'.svg',makeSheet(api,p,s));
  await emit(p.id+'.cad.json',{disclaimer:DISCLAIMER,importApproved:false,context:d,model});
  for(const fillerMm of [40,70,100])for(const layout of ['shelf','hanging']) {
    const p=buildPrototype(api,{kind,fillerMm,layout}),s=summarize(api,p);
    s.hardware=screenHardware(s.doors,'H5');summaries.push(s);
    await emit(p.id+'.svg',makeSheet(api,p,s));
    await emit(p.id+'.cad.json',{disclaimer:DISCLAIMER,...p.geometryContract,parameters:p.parameters,componentDesigns:p.componentDesigns,placements:p.placements,model:p.model});
  }
  // H1 comparison is closed-body geometry only. No independent-pivot motion is attributed to WingLine L.
  {
  const p=buildPrototype(api,{kind,mechanism:'H1'}),s=summarize(api,p);s.hardware=screenHardware(s.doors,'H1');summaries.push(s);
  await emit(p.id+'.svg',makeSheet(api,p,s));
  const closedModel=structuredClone(p.model);delete closedModel.analysis;
  // Omit ideal hinge motion metadata from H1 evidence; leaf dimensions remain a static geometry screen.
  closedModel.doors=closedModel.doors.map(d=>({id:d.id,bayIds:d.bayIds,runId:d.runId,widthMm:d.widthMm,heightMm:d.heightMm,thicknessMm:d.thicknessMm,closedVolumes:api.hingedVolumes(d,0)}));
  await emit(p.id+'.cad.json',{disclaimer:DISCLAIMER,simulation:'NOT_MODELED',hardwareKinematics:'HARDWARE_KINEMATICS_UNVERIFIED',productionApproval:'NOT_APPROVED',model:closedModel});
  }
}
const goldenText=await readFile('ENGINEERING_INVARIANTS.md','utf8'),canonical=[];
for(const [i,kind]of ['straight','diagonal','blind','asymmetric'].entries()) {
 const d=api.phase5Example(kind),m=api.solveDesign(d),p=api.extractProduction(d,m,'QA','2026-11-04T12:00:00.000Z');
 const hash=v=>createHash('sha256').update(api.designSignature(v)).digest('hex');
 const signatures=[hash(d),hash(m),hash(p)],row=goldenText.split('\n').find(l=>l.startsWith('| `'+kind+'` |'));
 assert.ok(row);assert.deepEqual(signatures,[...row.matchAll(/`([a-f0-9]{64})`/g)].map(m=>m[1]));assert.equal(p.parts.length,[69,94,81,94][i]);
 canonical.push({kind,parts:p.parts.length,signatures,accessStatus:p.accessStatus});
}
await emit('comparison.json',{disclaimer:DISCLAIMER,method:'D3-1: same leaf-cell definitions; shelf reach conservative lower bound; rod extraction center domain; polygonized door sweep raster estimate; no physical approval',canonical,summaries});
await emit('index.html',indexHtml(summaries));await writeFile(resolve(out,'SHA256.json'),JSON.stringify(hashes,null,2)+'\n');
console.log(JSON.stringify({out,candidates:summaries.length,canonicalParts:canonical.reduce((s,c)=>s+c.parts,0),shaPassed:12,files:Object.keys(hashes).length}));
