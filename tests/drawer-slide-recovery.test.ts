import { describe, expect, it } from 'vitest';
import { boxVolume } from '../src/core/analysis/kinematics';
import { MotionSimulator } from '../src/core/analysis/motionSimulator';
import { phase5Example } from '../src/core/presets/phase5Examples';
import { solveDesign } from '../src/core/solver/carcassSolver';

function tick(sim: MotionSimulator, frames: number, drawers: Record<string, boolean> = {}) {
  for (let frame = 0; frame < frames; frame++) sim.step(1 / 60, {}, drawers);
}

function threeTrackCase() {
  const design = phase5Example('straight');
  const model = solveDesign(design);
  const sim = new MotionSimulator();
  sim.load(design, model);
  const [leaf, second] = model.slidingDoors!;
  const open = Object.fromEntries(model.drawers.map(drawer => [drawer.id, true]));
  sim.dragTo(second.id, second.maxOffsetMm);
  sim.dragTo(leaf.id, leaf.maxOffsetMm);
  return { sim, leaf, model, open };
}

describe('WS-UX-009 – reciprocal drawer and sliding door contact', () => {
  it('shows the actual blocked stroke and finishes only after the user parks the leaf', () => {
    const { sim, leaf, model, open } = threeTrackCase();
    const drawer = model.drawers[0];
    tick(sim, 180, open);
    expect(sim.positions[drawer.id] * drawer.maxSlideMm).toBe(451);
    expect(sim.dragTo(leaf.id, 0).position).toBeCloseTo(1458.05, 2);
    tick(sim, 180);
    expect(sim.positions[drawer.id] * drawer.maxSlideMm).toBeCloseTo(86.05, 2);
    expect(sim.motionNotice()).toMatchObject({ id: drawer.id, blockerId: leaf.id });
    expect(sim.motionNotice()?.reason).toContain('86 mm açık');
    expect(sim.dragTo(leaf.id, 0).blocked).toBe(true);

    expect(sim.dragTo(leaf.id, leaf.maxOffsetMm).blocked).toBe(false);
    tick(sim, 1);
    expect(sim.motionNotice()?.reason).toContain('kapanıyor');
    tick(sim, 180);
    expect(model.drawers.every(item => sim.positions[item.id] === 0)).toBe(true);
    expect(sim.positions[leaf.id]).toBe(leaf.maxOffsetMm);
    expect(sim.motionNotice()?.reason).toContain('Çekmece kapandı');
    expect(sim.dragTo(leaf.id, 0)).toEqual({ position: 0, blocked: false, reason: undefined });
    expect(sim.motionNotice()).toBeNull();
  });

  it('drops an obsolete manual stop when a free drawer closes without moving the leaf', () => {
    const sim = new MotionSimulator();
    sim.scene = { staticVolumes: [], parts: [
      { id: 'leaf', label: 'Kanat', kind: 'sliding', min: 0, max: 650, home: 0, open: 650,
        volumes: position => [boxVolume([position, 100, 300], [80, 100, 80])], translation: [1, 0], ignoredStaticIds: new Set() },
      { id: 'drawer', label: 'Çekmece', kind: 'drawer', min: 0, max: 1, home: 0, open: 1,
        volumes: position => [boxVolume([400, 100, position * 300], [80, 100, 80])], translation: [0, 300], ignoredStaticIds: new Set() },
    ] };
    tick(sim, 180, { drawer: true });
    const stopped = sim.dragTo('leaf', 650);
    expect(stopped.blockerId).toBe('drawer');
    tick(sim, 180);
    expect(sim.positions.drawer).toBe(0);
    expect(sim.stops.leaf).toBeUndefined();
    expect(sim.positions.leaf).toBe(stopped.position);
    expect(sim.dragTo('leaf', 650).position).toBe(650);
  });

  it('honors rapid command reversal and does not replay a canceled drag', () => {
    const { sim, leaf, model, open } = threeTrackCase();
    tick(sim, 120, open);
    sim.draggingId = leaf.id;
    const stop = sim.dragTo(leaf.id, 0);
    sim.draggingId = null;
    tick(sim, 120);
    expect(sim.positions[leaf.id]).toBe(stop.position);
    sim.dragTo(leaf.id, leaf.maxOffsetMm);
    tick(sim, 1);
    tick(sim, 120, open);
    expect(sim.positions[model.drawers[0].id]).toBe(1);
    expect(sim.motionNotice()).toBeNull();
    expect(sim.positions[leaf.id]).toBe(leaf.maxOffsetMm);
  });
});
