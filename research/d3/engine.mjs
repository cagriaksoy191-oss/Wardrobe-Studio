import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

let pending;
export function loadEngine() {
  return pending ??= (async () => {
    const output = resolve('artifacts/d3-cad');
    await mkdir(output, { recursive: true });
    const result = await build({ stdin: { contents: [
      "export { phase5Example } from './src/core/presets/phase5Examples';",
      "export { normalizeAndValidateDesign } from './src/core/schema/designSchema';",
      "export { solveDesign } from './src/core/solver/carcassSolver';",
      "export { extractProduction } from './src/core/production/productionModel';",
      "export { designSignature } from './src/core/versions/designExchange';",
      "export { buildMotionScene, constrainMotion, initialMotionConflicts } from './src/core/analysis/motionConstraints';",
      "export { resolveFunctionalAccess } from './src/core/analysis/functionalAccess';",
      "export { planHingeOpenings } from './src/core/solver/hingePlanning';",
      "export { panelVolume, polygonsIntersect, polygonAreaMm2, pointInConvexPolygon, hingedVolumes, resolveMotions } from './src/core/analysis/kinematics';",
      "export { resolveStudioAnalysis } from './src/core/analysis/studioAnalysis';",
    ].join('\n'), resolveDir: process.cwd(), loader: 'ts' },
      bundle: true, write: false, platform: 'node', format: 'esm' });
    const path = resolve(output, 'readonly-engine.mjs');
    await writeFile(path, result.outputFiles[0].contents);
    return import(pathToFileURL(path).href);
  })();
}
