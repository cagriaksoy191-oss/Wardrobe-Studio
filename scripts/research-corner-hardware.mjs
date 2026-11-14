/** Salt okunur mühendislik probu. Uygulamaya import edilmez, Design kaydetmez.
 * Çalıştırma: node scripts/research-corner-hardware.mjs [çıktı-dizini]
 * Yoğunluk/tolerans senaryoları üretici onayı veya ölçülmüş tolerans değildir.
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const root = process.cwd();
const out = resolve(process.argv[2] ?? 'artifacts/corner-hardware-research');
assert.ok(out.startsWith(root + '/') || out.startsWith(root + '\\'), 'Çıktı bu worktree içinde olmalı.');
await mkdir(out, { recursive: true });
const { outputFiles: [bundle] } = await build({
  stdin: { contents: [
    "export { phase5Example } from './src/core/presets/phase5Examples';",
    "export { normalizeAndValidateDesign } from './src/core/schema/designSchema';",
    "export { solveDesign } from './src/core/solver/carcassSolver';",
    "export { extractProduction } from './src/core/production/productionModel';",
    "export { designSignature } from './src/core/versions/designExchange';",
    "export { buildMotionScene, constrainMotion, initialMotionConflicts } from './src/core/analysis/motionConstraints';",
    "export { defaultSlidingConfig } from './src/core/solver/slidingSolver';",
    "export { hingedVolumes, handleEnvelope } from './src/core/analysis/kinematics';",
    "export { buildTechnicalSheets, sheetToSvg } from './src/core/production/technicalSheets';",
  ].join('\n'), resolveDir: root, loader: 'ts' },
  bundle: true, write: false, platform: 'node', format: 'esm',
});
const enginePath = resolve(out, 'engine.mjs');
await writeFile(enginePath, bundle.contents);
const api = await import(pathToFileURL(enginePath).href);
const hash = value => createHash('sha256').update(api.designSignature(value)).digest('hex');
const invariant = await readFile('ENGINEERING_INVARIANTS.md', 'utf8');
const golden = Object.fromEntries([...invariant.matchAll(/\| `(straight|diagonal|blind|asymmetric)` \| `([a-f0-9]{64})` \| `([a-f0-9]{64})` \| `([a-f0-9]{64})` \|/g)]
  .map(([, kind, design, geometry, production]) => [kind, { design, geometry, production }]));
assert.equal(Object.keys(golden).length, 4);
const records = {};
const candidateRecords = {};
const sign = (design, model, production) => ({ design: hash(design), geometry: hash(model), production: hash(production) });
function evaluate(design) {
  const model = api.solveDesign(design);
  const production = api.extractProduction(design, model, 'QA', '2026-11-04T12:00:00.000Z');
  const scene = api.buildMotionScene(design, model);
  const home = Object.fromEntries(scene.parts.map(p => [p.id, p.home]));
  const corner = model.doors.find(d => d.isCornerDoor || d.id.startsWith('door-corner-'));
  const cornerStop = corner && api.constrainMotion(scene, home, corner.id, 1);
  const cornerAngle = corner && cornerStop.position * corner.maxAngleDeg;
  const openings = model.doors.map(d => {
    const stop = api.constrainMotion(scene, home, d.id, 1);
    return { id: d.id, commandedDeg: d.maxAngleDeg, reachedDeg: stop.position * d.maxAngleDeg,
      blockerId: stop.blockerId, closedVolumes: api.hingedVolumes(d, 0), reachedVolumes: api.hingedVolumes(d, stop.position) };
  });
  return { design, model, production, cornerAngle, cornerBlocker: cornerStop?.blockerId, openings,
    conflicts: api.initialMotionConflicts(scene), functional: production.functionalAccess };
}
for (const [i, kind] of ['straight', 'diagonal', 'blind', 'asymmetric'].entries()) {
  const design = api.phase5Example(kind), before = hash(design), result = evaluate(design);
  const signatures = sign(design, result.model, result.production);
  assert.deepEqual(signatures, golden[kind], kind + ': 3 referans SHA korunmalı');
  assert.equal(result.production.parts.length, [69, 94, 81, 94][i]);
  if (kind !== 'straight') {
    assert.equal(result.production.accessStatus, 'blocked');
    const sheets = api.buildTechnicalSheets(design, result.model, result.production);
    const svg = sheets.map(s => api.sheetToSvg(s));
    assert.ok(svg.some(s => s.includes('TANISAL')), 'P0 tanısal damga');
    await writeFile(resolve(out, kind + '-diagnostic.svg'), svg[0]);
    result.sheets = sheets.length;
  }
  assert.equal(hash(design), before, 'Prob kanonik niyeti değiştirmemeli');
  records[kind] = { ...result, signatures };
  await writeFile(resolve(out, kind + '-design.json'), JSON.stringify(design, null, 2) + '\n');
}
assert.equal(records.diagonal.model.doors.find(d => d.isCornerDoor).opening.safeAngleDeg, 5.1);
assert.equal(records.asymmetric.model.doors.find(d => d.isCornerDoor).opening.safeAngleDeg, 12.8);
assert.deepEqual(records.blind.functional.filter(f => f.kind === 'drawer').map(f => f.travel.availableMm), [49, 49, 49]);
for (const kind of ['diagonal', 'asymmetric', 'blind']) {
  const d = structuredClone(records[kind].design), [a, b] = d.runs, j = d.junctions[0];
  if (kind === 'blind') {
    a.bays[0].width = { kind: 'fixed', mm: 1500 };
    d.fronts.find(f => f.id === 'front-A-lower').sliding = {
      ...api.defaultSlidingConfig(a.panelThicknessMm, 3), leafCount: 3, startClearanceMm: 40,
    };
  } else {
    j.doorMode = 'right'; j.diagonalArmAMm = kind === 'diagonal' ? 1150 : 1050; j.diagonalArmBMm = 1050;
    if (kind === 'diagonal') { b.bays[0].frontMode = 'singleLeft'; b.bays[0].hingeAngleDeg = 155; }
  }
  const result = evaluate(api.normalizeAndValidateDesign(d));
  const reference = result.functional.find(f => f.status === 'usable' && f.steps.length &&
    (kind === 'blind' ? f.kind === 'drawer' : f.id.includes('corner-sub')));
  assert.ok(reference, 'Tarihsel adayın kullanılabilir alt senaryosu bulunmalı');
  const scene = api.buildMotionScene(result.design, result.model);
  const positions = Object.fromEntries(scene.parts.map(p => [p.id, p.home]));
  const commands = reference.steps.map(step => {
    const part = scene.parts.find(p => p.id === step.partId);
    return { id: part.id, target: step.unit === 'deg' ? step.position / (Math.abs(part.radiansPerUnit) * 180 / Math.PI) : step.position };
  });
  if (reference.kind === 'drawer') commands.push({ id: reference.id, target: 1 });
  const move = ({ id, target }) => {
    const stop = api.constrainMotion(scene, positions, id, target);
    assert.ok(Math.abs(stop.position - target) < 1e-7, 'Komut hedefi gerçekten ulaşılmalı: ' + id);
    positions[id] = stop.position;
    return { id, target, actual: stop.position, blocker: stop.blockerId };
  };
  result.replay = { open: commands.map(move), close: commands.toReversed().map(c => move({ id: c.id, target: scene.parts.find(p => p.id === c.id).home })) };
  candidateRecords[kind] = result;
  if (kind !== 'blind') {
    const withRod = structuredClone(d); withRod.junctions[0].hasHangingRod = true;
    candidateRecords[kind + '-with-rod'] = evaluate(api.normalizeAndValidateDesign(withRod));
  }
}
assert.equal(candidateRecords.diagonal.functional.find(f => f.id.includes('corner-sub')).clearWidthMm, 458);
assert.equal(candidateRecords.asymmetric.functional.find(f => f.id.includes('corner-sub')).clearWidthMm, 448);
assert.deepEqual(candidateRecords.blind.functional.filter(f => f.kind === 'drawer').map(f => f.travel.availableMm), [451, 451, 451]);
// Salt analitik alt/üst sınır: panel m=V*rho. 600/750/850 kg/m3 araştırma aralığıdır.
// Ek donanım kütlesi bilinmez; 0/1/2 kg yalnız duyarlılık eksenidir.
function panelMass(label, width, height, thickness) {
  const volume = width * height * thickness / 1e9;
  return { label, widthMm: width, heightMm: height, thicknessMm: thickness, volumeM3: volume,
    cgFromHingeEdgeMm: width / 2,
    cases: [600, 750, 850].flatMap(density => [0, 1, 2].map(addedMassKg => {
      const panelKg = volume * density;
      return { densityKgM3: density, addedMassKg, panelKg, totalKg: panelKg + addedMassKg,
        // Panel yerçekimi eğilme momenti. Ek kütle için muhafazakâr serbest kenar kolu.
        gravityMomentNm: panelKg * 9.80665 * width / 2000 + addedMassKg * 9.80665 * width / 1000 };
    })) };
}
const weights = [];
for (const [kind, r] of Object.entries({ ...records, ...Object.fromEntries(Object.entries(candidateRecords).map(([k, v]) => ['old-' + k, v])) })) {
  for (const d of [...r.model.doors, ...(r.model.slidingDoors ?? [])]) {
    weights.push(panelMass(kind + ':' + d.id, d.widthMm, d.heightMm, d.thicknessMm));
  }
}
// Yeni kavramlar: kesim listesi değil; belirlenen dış açıklığa sığdırma ön elemesi.
for (const spec of [
  ['WingLine-rectangular-18', 550, 2276, 18], ['WingLine-rectangular-25', 550, 2276, 25],
  ['Hawa-rectangular-25', 550, 2276, 25], ['Independent-rectangular-25', 450, 2276, 25],
  ['Wing77-nominal-quarter-18', 384, 2276, 18], ['Wing77-nominal-quarter-25', 384, 2276, 25],
]) weights.push(panelMass(...spec));
const tolerance = [0, 0.5, 1, 1.5, 2].map(perContributorMm => ({
  scenarioOnly: true, contributors: 6, perContributorMm, worstCaseConsumedMm: 6 * perContributorMm,
  residualMm: 6 - 6 * perContributorMm, contactOrOverlap: 6 - 6 * perContributorMm <= 0,
}));
assert.equal(tolerance.find(t => t.perContributorMm === 1).residualMm, 0);
assert.equal(panelMass('unit', 1000, 1000, 20).cases[0].panelKg, 12);
assert.equal(panelMass('unit', 1000, 1000, 20).cases[0].gravityMomentNm, 12 * 9.80665 / 2);
const topology = [600, 480].map(depth => {
  const originalPolygonMm2 = 900 * 900 - (900 - depth) * (900 - 600) / 2;
  const originalBodyFootprintMm2 = originalPolygonMm2 + (3000 - 900) * 600 + (2600 - 900) * depth;
  const usableARunMm = 3000 - depth - 70, usableBRunMm = 2600 - 600 - 70;
  const rectangularAccessibleGrossMm2 = usableARunMm * 600 + usableBRunMm * depth;
  return { depthBMm: depth, oldDiagonalArmsMm: [900, 900], originalBodyFootprintMm2,
    usableARunMm, usableBRunMm, rectangularAccessibleGrossMm2,
    grossDifferenceMm2: originalBodyFootprintMm2 - rectangularAccessibleGrossMm2,
    percentDifference: (originalBodyFootprintMm2 - rectangularAccessibleGrossMm2) / originalBodyFootprintMm2 * 100,
    note: '70 mm klapa analitik varsayım. Yeni iki düz kolun köşe hacmi erişilebilir depolama sayılmaz. Bu brüt plan karşılaştırması net raf alanı/hacim veya üretici kinematik kabulü değildir.' };
});
// Hawa 25 Pull, katalog s.104: T2=TB+92+Z3-M2, M2>=S+75.
const pocketDepth = [450, 550].map(widthMm => ({ widthMm, thicknessMm: 25, gapMm: 3,
  projectionM2Mm: 100, hardwareDepthT2Mm: widthMm + 92 + 3 - 100,
  note: 'Yalnız katalog derinlik denkliği; cep eni, montaj, hareket ve kullanıcı koridoru henüz modellenmedi.' }));
// B1 eski adayının dört kanada bölünmesi yalnız ön eleme; üretici boşluk/bindirme formülü ayrıca gerekir.
const foldingScreen = { nominalSpanMm: 1535, hypotheticalLeafMm: 384, leafCount: 4,
  wing77MaxLeafMm: 400, wing77MaxKg: 20,
  currentUnsupportedCompartmentMm: candidateRecords.diagonal.model.bays.find(b => b.id === 'bay-B1').netInnerWidthMm,
  documentedMaxCompartmentMm: 800, needsNewRecessedSupport: true,
  note: 'Mevcut B1 buna uymaz; 40 mm geri çekilmiş yeni destek ve yük altında en çok 1.5 mm üst tabla sehimi ayrıca doğrulanmalı.' };
const panelSource = await readFile('src/ui/ProductionPanel.tsx', 'utf8');
assert.match(panelSource, /const diagnostic = pkg.accessStatus === 'blocked'/);
assert.match(panelSource, /disabled=\{busy\|\|blocked\|\|diagnostic\}/);
assert.match(panelSource, /Tanısal PDF indir/);
await writeFile(resolve(out, 'engineering-analysis.json'), JSON.stringify({
  method: 'current canonical engine + three historical candidate copies; analytic mass/tolerance only; no manufacturer kinematic substitution',
  goldenSignaturesPassed: 12, partTotal: 338, records, candidateRecords, weights, tolerance, topology, pocketDepth, foldingScreen,
}, null, 2) + '\n');
const summary = r => ({ parts: r.production.parts.length, access: r.production.accessStatus,
  cornerAngle: r.cornerAngle, cornerBlocker: r.cornerBlocker,
  corner: r.model.doors.filter(d => d.id.startsWith('door-corner-')),
  doors: r.model.doors.map(d => [d.id, d.widthMm, d.heightMm, d.thicknessMm]),
  sliding: r.model.slidingDoors?.map(d => [d.id, d.widthMm, d.heightMm, d.thicknessMm]),
  functional: r.functional.filter(f => f.kind === 'drawer' || f.kind === 'hanging' || f.id.includes('corner-sub')).map(f => ({
    id: f.id, kind: f.kind, status: f.status, clear: f.clearWidthMm, required: f.requiredWidthMm,
    travel: f.travel, steps: f.steps, blocker: f.blockerLabel,
  })),
});
console.log(JSON.stringify({ canonical: Object.fromEntries(Object.entries(records).map(([k, r]) => [k, summary(r)])),
  historicalCandidate: Object.fromEntries(Object.entries(candidateRecords).map(([k, r]) => [k, summary(r)])),
  tolerance }, null, 2));
