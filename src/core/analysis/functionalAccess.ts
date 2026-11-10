import { runFrontMm } from '../schema/designConstraints';
import type {
  Design, Point2DMm, ResolvedCell, ResolvedDrawerUnit, ResolvedFunctionalAccess, ResolvedModel,
} from '../schema/types';
import { hangingProfile, INVENTORY_CATALOG } from './inventory';
import type { PhysicalVolume } from './kinematics';
import { constrainMotion, type MotionPart, type MotionPositions, type MotionScene, type MotionStop } from './motionConstraints';

// Same nominal handling allowance as the inventory and blind-corner checks.
const handlingMm = 30;
const positiveMm = (value: number) => Math.max(0, Math.floor(value + 1e-7));
type Interval = [number, number];
interface Aperture {
  origin: Point2DMm;
  along: Point2DMm;
  outward: Point2DMm;
  width: number;
  y0: number;
  y1: number;
}
interface Pose {
  positions: MotionPositions;
  volumes: PhysicalVolume[];
  steps: ResolvedFunctionalAccess['steps'];
  blockerLabel?: string;
}

function cellAperture(design: Design, cell: ResolvedCell): Aperture {
  const { yStartMm: y0, yEndMm: y1 } = cell;
  if (cell.cornerJunctionId && cell.polygonXZMm) {
    const [, , end, origin] = cell.polygonXZMm;
    const dx = end.xMm - origin.xMm, dz = end.zMm - origin.zMm;
    const width = Math.hypot(dx, dz);
    return {
      origin, width, y0, y1,
      along: { xMm: dx / width, zMm: dz / width },
      outward: { xMm: -dz / width, zMm: dx / width },
    };
  }
  const run = design.runs.find(r => r.id === cell.runId)!;
  const axis = run.wallAxis === 'B' ? 2 : 0;
  const width = cell.accessOpeningWidthMm ?? cell.netWidthMm;
  const start = cell.worldCenterMm[axis] + cell.netWidthMm / 2 - width;
  const front = runFrontMm(run);
  return axis === 2
    ? { origin: { xMm: front, zMm: start }, along: { xMm: 0, zMm: 1 }, outward: { xMm: 1, zMm: 0 }, width, y0, y1 }
    : { origin: { xMm: start, zMm: front }, along: { xMm: 1, zMm: 0 }, outward: { xMm: 0, zMm: 1 }, width, y0, y1 };
}

function projectedInterval(volume: PhysicalVolume, opening: Aperture, depth: number): Interval | undefined {
  const { origin, along, outward } = opening;
  const points = volume.polygon.map(p => {
    const dx = p.xMm - origin.xMm, dz = p.zMm - origin.zMm;
    return { x: dx * along.xMm + dz * along.zMm, z: dx * outward.xMm + dz * outward.zMm };
  });
  const x = points.filter(p => p.z >= 0 && p.z <= depth).map(p => p.x);
  for (const [index, a] of points.entries()) {
    const b = points[(index + 1) % points.length];
    for (const level of [0, depth]) {
      if (Math.min(a.z, b.z) < level && level < Math.max(a.z, b.z)) {
        x.push(a.x + (b.x - a.x) * (level - a.z) / (b.z - a.z));
      }
    }
  }
  if (!x.length) return;
  const start = Math.max(0, Math.min(...x)), end = Math.min(opening.width, Math.max(...x));
  if (end - start > .001) return [start, end];
}

function clearPassage(opening: Aperture, volumes: PhysicalVolume[], depth: number, ignoreId?: string) {
  const blocks: { span: Interval; label?: string }[] = [];
  let dominant = 0, blockerLabel: string | undefined;
  for (const volume of volumes) {
    if (volume.id === ignoreId && ignoreId !== undefined) continue;
    if (Math.min(volume.y1, opening.y1) - Math.max(volume.y0, opening.y0) <= .001) continue;
    const span = projectedInterval(volume, opening, depth);
    if (!span) continue;
    blocks.push({ span, label: volume.label });
    if (span[1] - span[0] > dominant) {
      dominant = span[1] - span[0];
      blockerLabel = volume.label;
    }
  }
  let cursor = 0, width = 0;
  for (const { span: [start, end] } of blocks.sort((a, b) => a.span[0] - b.span[0])) {
    width = Math.max(width, start - cursor);
    cursor = Math.max(cursor, end);
  }
  return { width: Math.max(width, opening.width - cursor), blockerLabel };
}

function buildAccessPoses(scene: MotionScene, covering: MotionPart[], tryNeighbor: boolean,
  homeVolumes: Map<string, PhysicalVolume[]>, move: (part: MotionPart, positions: MotionPositions, target: number) => MotionStop): Pose[] {
  const poses: Pose[] = [];
  const seen = new Set<string>();
  const hinges = covering.filter(part => part.kind === 'hinged');
  const sliders = covering.filter(part => part.kind === 'sliding');
  const run = (actions: [MotionPart, number][]) => {
    const positions: MotionPositions = {};
    const steps: Pose['steps'] = [];
    let blockerLabel: string | undefined, hingeBlockerId: string | undefined;
    for (const [part, target] of actions) {
      const stop = move(part, positions, target);
      if (stop.blocked) {
        blockerLabel ??= stop.blockerLabel;
        if (hinges.includes(part)) hingeBlockerId ??= stop.blockerId;
      }
      if (Math.abs(stop.position - (positions[part.id] ?? part.home)) < 1e-7) continue;
      positions[part.id] = stop.position;
      const degrees = Math.abs(part.radiansPerUnit ?? 0) * 180 / Math.PI;
      steps.push({
        partId: part.id, label: part.label,
        position: part.kind === 'hinged' ? Math.floor(stop.position * degrees * 10 + 1e-7) / 10 : Math.round(stop.position),
        unit: part.kind === 'hinged' ? 'deg' : 'mm',
      });
    }
    const key = JSON.stringify(Object.entries(positions).sort());
    if (!seen.has(key)) {
      seen.add(key);
      poses.push({ positions, steps, blockerLabel, volumes: [
        ...scene.staticVolumes,
        ...scene.parts.flatMap(part => positions[part.id] === undefined ? homeVolumes.get(part.id)!
          : part.volumes(positions[part.id]).map(volume => ({ ...volume, id: part.id, label: part.label }))),
      ] });
    }
    return hingeBlockerId;
  };
  run([]);
  const slidePlans: [MotionPart, number][][] = sliders.length ? [
    sliders.map(part => [part, part.min]),
    [...sliders].reverse().map(part => [part, part.max]),
  ] : [[]];
  const hingeOrders = hinges.length > 1
    ? [hinges, [...hinges].reverse(), ...hinges.map(part => [part])]
    : [hinges];
  for (const slidePlan of slidePlans) {
    for (const order of hingeOrders) {
      for (const angle of order.length ? [Infinity, Math.PI / 2] : [Infinity]) {
        const actions: [MotionPart, number][] = [...slidePlan, ...order.map(
          (part): [MotionPart, number] => [part, Math.min(part.open, angle / Math.abs(part.radiansPerUnit ?? 1))],
        )];
        const blocker = run(actions);
        if (!tryNeighbor || !blocker || covering.some(part => part.id === blocker)) continue;
        const neighbor = scene.parts.find(part => part.id === blocker && part.kind === 'hinged');
        if (neighbor) run([[neighbor, neighbor.open], ...actions]);
      }
    }
  }
  return poses;
}

function cellSpecimen(cell: ResolvedCell) {
  const insert = cell.insert;
  const hanging = insert?.type === 'hangingRod' || insert?.type === 'doubleHanging';
  const service = insert?.type === 'serviceNiche' || insert?.storageTemplate === 'laundryBasket' || insert?.storageTemplate === 'trouserRack';
  const specimen = hanging ? hangingProfile(insert) : INVENTORY_CATALOG[
    insert?.storageTemplate === 'blindLuggage' ? 'suitcases' : insert?.type === 'shoeRack' ? 'shoes'
      : insert?.type === 'beddingYukluk' ? 'hurc' : 'foldedClothes'
  ];
  return {
    kind: service ? 'service' as const : hanging ? 'hanging' as const : 'shelf' as const,
    label: service ? 'Özel mekanizma / eşya' : specimen.label,
    width: (hanging ? specimen.widthMm : Math.min(specimen.widthMm, specimen.depthMm)) + handlingMm,
    depth: Math.max(specimen.widthMm, specimen.depthMm) + handlingMm,
    height: specimen.heightMm,
  };
}

/** Straight extraction corridor at the cell front, plus a continuous stroke test for real drawers. */
export function resolveFunctionalAccess(design: Design, model: ResolvedModel, scene: MotionScene): ResolvedFunctionalAccess[] {
  const cells = new Map(model.cells.map(cell => [cell.id, cell]));
  const parts = new Map(scene.parts.map(part => [part.id, part]));
  const posesByCoverage = new Map<string, Pose[]>();
  const homeVolumes = new Map(scene.parts.map(part => [part.id,
    part.volumes(part.home).map(volume => ({ ...volume, id: part.id, label: part.label }))]));
  const motionCache = new Map<string, MotionStop>();
  const move = (part: MotionPart, positions: MotionPositions, target: number) => {
    const positionEntries = Object.entries(positions);
    const home = !positionEntries.length ? scene.hingeHomeStops?.get(part.id) : undefined;
    if (home) return target > home.position ? home : { position: target, blocked: false };
    const key = JSON.stringify([part.id, target, positionEntries.sort()]);
    const cached = motionCache.get(key);
    if (cached) return cached;
    const stop = constrainMotion(scene, positions, part.id, target);
    motionCache.set(key, stop);
    return stop;
  };
  const result: ResolvedFunctionalAccess[] = [];
  const covers = (bayId: string, { y0, y1 }: Aperture) => [
    ...model.doors.filter(door => door.bayIds.includes(bayId) && door.yStartMm < y1 && door.yEndMm > y0),
    ...(model.slidingDoors ?? []).filter(door => door.bayIds.includes(bayId) && door.yStartMm < y1 && door.yEndMm > y0),
  ].map(door => door.id);
  const posesFor = (ids: string[], corner: boolean) => {
    const key = [corner, ...ids].join('|');
    let poses = posesByCoverage.get(key);
    if (!poses) {
      poses = buildAccessPoses(scene, ids.map(id => parts.get(id)!), corner, homeVolumes, move);
      posesByCoverage.set(key, poses);
    }
    return poses;
  };

  for (const cell of cells.values()) {
    if (!cell.isLeaf || cell.insert?.type === 'drawerBank') continue;
    const opening = cellAperture(design, cell);
    const item = cellSpecimen(cell);
    const rod = item.kind === 'hanging' && model.panels.find(panel => panel.role === 'hangingRod' && panel.cellId === cell.id);
    const top = rod ? Math.min(rod.worldPositionMm[1], opening.y1) : opening.y1;
    const fitsHeight = top - opening.y0 >= item.height;
    if (rod) opening.y0 = Math.max(opening.y0, top - item.height);
    opening.y1 = Math.min(top, opening.y0 + item.height);
    const coveringIds = covers(cell.bayId, opening);
    let best: { width: number; pose: Pose; blockerLabel?: string } | undefined;
    for (const pose of posesFor(coveringIds, Boolean(cell.cornerJunctionId))) {
      const passage = clearPassage(opening, pose.volumes, item.depth);
      if (!best || passage.width > best.width + .001) best = { ...passage, pose };
    }
    const clearWidthMm = positiveMm(best!.width), openingWidthMm = positiveMm(opening.width);
    // A garment may turn or fold around a rail. A failed straight-envelope check alone
    // cannot determine that path. Drawer travel and rigid shelf passages are separate checks.
    const status = item.kind === 'service' || !fitsHeight || openingWidthMm < item.width
      ? 'unverified'
      : clearWidthMm >= item.width ? 'usable' : item.kind === 'hanging' ? 'unverified' : 'blocked';
    result.push({
      id: cell.id, bayId: cell.bayId, label: cell.label, kind: item.kind, status,
      clearWidthMm, openingWidthMm, requiredWidthMm: item.width, reference: item.label,
      blockerLabel: status === 'usable' ? undefined : best!.pose.blockerLabel ?? best!.blockerLabel,
      coveringIds, steps: best!.pose.steps,
    });
  }

  for (const drawer of model.drawers) {
    const cell = cells.get(drawer.cellId);
    if (!cell) continue;
    const opening = { ...cellAperture(design, cell), y0: drawer.yStartMm, y1: drawer.yEndMm };
    const coveringIds = covers(drawer.bayId, opening);
    const width = drawer.frontBoxSizeMm[drawer.wallAxis === 'B' ? 2 : 0];
    let best: { travel: number; width: number; pose: Pose; blockerLabel?: string } | undefined;
    for (const pose of posesFor(coveringIds, false)) {
      const stop = constrainMotion(scene, pose.positions, drawer.id, 1);
      const travel = positiveMm(stop.position * drawer.maxSlideMm);
      const passage = clearPassage(opening, pose.volumes, drawer.maxSlideMm, drawer.id);
      if (!best || travel > best.travel || (travel === best.travel && passage.width > best.width)) {
        best = { travel, width: passage.width, pose, blockerLabel: stop.blockerLabel };
      }
      if (travel === drawer.maxSlideMm) break;
    }
    result.push(drawerAccess(drawer, opening, width, coveringIds, best!));
  }
  return result;
}

function drawerAccess(drawer: ResolvedDrawerUnit, opening: Aperture, width: number, coveringIds: string[],
  best: { travel: number; width: number; pose: Pose; blockerLabel?: string }): ResolvedFunctionalAccess {
  const status = drawer.maxSlideMm <= 0 ? 'unverified' : best.travel >= drawer.maxSlideMm ? 'usable' : 'blocked';
  return {
    id: drawer.id, bayId: drawer.bayId, label: drawer.label, kind: 'drawer', status,
    clearWidthMm: positiveMm(best.width), openingWidthMm: positiveMm(opening.width), requiredWidthMm: width,
    reference: 'Modellenen kızak mesafesi', travel: { availableMm: best.travel, requiredMm: drawer.maxSlideMm },
    blockerLabel: best.blockerLabel, coveringIds, steps: best.pose.steps,
  };
}

export const ACCESS_STATUS_LABEL = {
  usable: 'Planlama kontrolü geçti',
  blocked: 'İşlevsel erişim engeli',
  unverified: 'İşlevsel erişim doğrulanamadı',
} as const;

export function accessMeasurement(entry: ResolvedFunctionalAccess) {
  return entry.travel
    ? `Kızak ${entry.travel.availableMm} / ${entry.travel.requiredMm} mm`
    : `Net geçiş ${entry.clearWidthMm} / ${entry.requiredWidthMm} mm · ${entry.reference}`;
}

export function accessSequence(entry: ResolvedFunctionalAccess) {
  return entry.steps.map(step => `${step.label} ${step.position}${step.unit === 'deg' ? '°' : ' mm'}`).join(' → ');
}

/** Worst measured check per affected module. Full per-cell and drawer detail stays available. */
export function accessWarnings(entries: ResolvedFunctionalAccess[]) {
  const groups = new Map<string, ResolvedFunctionalAccess>();
  const remaining = (entry: ResolvedFunctionalAccess) => entry.travel
    ? entry.travel.availableMm / Math.max(1, entry.travel.requiredMm)
    : entry.clearWidthMm / Math.max(1, entry.requiredWidthMm);
  for (const entry of entries) {
    if (entry.status === 'usable') continue;
    const previous = groups.get(entry.bayId);
    if (!previous || (entry.status === 'blocked' && previous.status !== 'blocked') ||
      (entry.status === previous.status && remaining(entry) < remaining(previous))) groups.set(entry.bayId, entry);
  }
  return [...groups.values()].sort((a, b) => Number(b.status === 'blocked') - Number(a.status === 'blocked'));
}
