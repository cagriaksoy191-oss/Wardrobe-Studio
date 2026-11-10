import {createServer} from 'vite';
import {writeFile} from 'node:fs/promises';
const server=await createServer({server:{middlewareMode:true},appType:'custom'});
try {
  const {phase5Example}=await server.ssrLoadModule('/src/core/presets/phase5Examples.ts');
  const {solveDesign}=await server.ssrLoadModule('/src/core/solver/carcassSolver.ts');
  const {buildMotionScene,constrainMotion,initialMotionConflicts}=await server.ssrLoadModule('/src/core/analysis/motionConstraints.ts');
  const records=[];
  for(const kind of ['straight','diagonal','blind','asymmetric']) {
    const design=phase5Example(kind),model=solveDesign(design),scene=buildMotionScene(design,model);
    const record={kind,errors:model.issues.filter(i=>i.severity==='error'),initial:initialMotionConflicts(scene),moves:scene.parts.map(p=>({id:p.id,...constrainMotion(scene,{},p.id,p.open)}))};records.push(record);
    console.log(JSON.stringify(record));
  }
  await writeFile('artifacts/phase5/motion-qa.json',JSON.stringify(records,null,2));
} finally {await server.close();}
