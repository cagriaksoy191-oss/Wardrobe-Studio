import { describe, expect, it } from 'vitest';
import { MotionSimulator } from '../src/core/analysis/motionSimulator';
import { boxVolume } from '../src/core/analysis/kinematics';
import { constrainMotion } from '../src/core/analysis/motionConstraints';
import { phase5Example } from '../src/core/presets/phase5Examples';
import { solveDesign } from '../src/core/solver/carcassSolver';
import { useWardrobeStore } from '../src/store/useWardrobeStore';

function tick(sim: MotionSimulator, frames = 180, drawers: Record<string, boolean> = {}) {
  for (let i = 0; i < frames; i++) sim.step(1 / 60, {}, drawers);
}
function blocked() {
  const design = phase5Example('straight'), model = solveDesign(design), sim = new MotionSimulator();
  sim.load(design, model);
  const [leaf, second] = model.slidingDoors!;
  sim.dragTo(second.id, second.maxOffsetMm);
  sim.dragTo(leaf.id, leaf.maxOffsetMm);
  tick(sim, 180, Object.fromEntries(model.drawers.map(item => [item.id, true])));
  sim.dragTo(leaf.id, 0);
  tick(sim);
  return { sim, design, model, leaf, second };
}
function begin(sim: MotionSimulator) {
  const plan = sim.recoveryOffer().plan;
  expect(plan).toBeDefined();
  expect(sim.startRecovery(plan)).toBe(true);
  return plan!;
}

describe('explicit safe sliding-drawer recovery', () => {
  it('reproduces the physical 1458 mm / 86 mm stop without starting automatically', () => {
    const { sim, leaf, model } = blocked();
    expect(sim.positions[leaf.id]).toBeCloseTo(1458.05, 2);
    expect(sim.positions[model.drawers[0].id] * model.drawers[0].maxSlideMm).toBeCloseTo(86.05, 2);
    expect(sim.recovery).toBeNull();
    const old = { ...sim.positions };
    tick(sim);
    expect(sim.positions).toEqual(old);
  });
  it('plans on a copy and describes every actual moving part', () => {
    const { sim } = blocked();
    const before = JSON.stringify([sim.positions, sim.targets, sim.velocities, sim.stops]);
    const plan = sim.recoveryOffer().plan!;
    expect(plan.steps).toHaveLength(5);
    expect(plan.steps.every(step => plan.description.includes(step.label))).toBe(true);
    expect(JSON.stringify([sim.positions, sim.targets, sim.velocities, sim.stops])).toBe(before);
  });
  it('reaches every exact intermediate target before advancing and closes the leaf last', () => {
    const { sim, leaf, model } = blocked();
    const plan = begin(sim);
    let index = 0;
    const running = () => sim.recovery?.status === 'running';
    for (let i = 0; i < 1500 && running(); i++) {
      const old = { ...sim.positions };
      sim.step(1 / 60, {}, {});
      for (const id of Object.keys(old).filter(id => id !== plan.steps[index].id)) expect(sim.positions[id]).toBe(old[id]);
      if (sim.recovery!.step > index + 1 || sim.recovery!.status === 'completed') {
        expect(sim.positions[plan.steps[index].id]).toBe(plan.steps[index].target);
        index++;
      }
    }
    expect(index).toBe(5);
    expect(sim.recovery?.status).toBe('completed');
    expect(model.drawers.every(item => sim.positions[item.id] === 0)).toBe(true);
    expect(sim.positions[leaf.id]).toBe(0);
    expect(sim.motionNotice()).toBeNull();
    const final = { ...sim.positions };
    tick(sim, 500);
    expect(sim.positions).toEqual(final);
  });
  it.each([1, 90, 220, 400])('cancels at frame %i and never replays remaining targets', frame => {
    const { sim } = blocked();
    begin(sim); tick(sim, frame);
    sim.cancelRecovery();
    const pose = { ...sim.positions };
    tick(sim, 500);
    expect(sim.positions).toEqual(pose);
    expect(sim.recovery?.status).toBe('cancelled');
  });
  it('manual opposite command cancels and acts only as the new request', () => {
    const { sim, model } = blocked();
    begin(sim); tick(sim, 30);
    tick(sim, 1, { [model.drawers[0].id]: true });
    expect(sim.recovery?.status).toBe('cancelled');
    expect(sim.targets[model.drawers[0].id]).toBe(1);
  });
  it('explicit same-value command cancels and resumes only its requested part', () => {
    const { sim, leaf } = blocked();
    begin(sim); tick(sim, 30);
    sim.step(1 / 60, {}, {}, { revision: 1, ids: [leaf.id] });
    expect(sim.recovery?.status).toBe('cancelled');
    expect(sim.targets[leaf.id]).toBe(0);
  });
  it('manual drag cancels ownership before constraining the requested movement', () => {
    const { sim, leaf } = blocked();
    begin(sim); tick(sim, 20);
    const result = sim.dragTo(leaf.id, 0);
    expect(sim.recovery?.status).toBe('cancelled');
    expect(result.blocked).toBe(true);
    expect(sim.positions[leaf.id]).toBe(result.position);
  });
  it('rejects duplicate operation starts without replacing the owner', () => {
    const { sim } = blocked(), plan = begin(sim), id = sim.recovery!.operationId;
    expect(sim.startRecovery(plan)).toBe(false);
    expect(sim.recovery!.operationId).toBe(id);
  });
  it('rejects stale previews after a pose changes', () => {
    const { sim, second } = blocked(), plan = sim.recoveryOffer().plan;
    sim.dragTo(second.id, second.minOffsetMm);
    expect(sim.startRecovery(plan)).toBe(false);
  });
  it('rejects a caller-modified plan', () => {
    const { sim } = blocked(), plan = structuredClone({ ...sim.recoveryOffer().plan!, scene: undefined });
    expect(sim.startRecovery(plan as never)).toBe(false);
    const valid = sim.recoveryOffer().plan!;
    valid.steps[0].target = -999999;
    expect(sim.startRecovery(valid)).toBe(false);
  });
  it('rejects non-finite poses and a fresh closed scene', () => {
    const { sim, leaf, design, model } = blocked();
    sim.positions[leaf.id] = Number.NaN;
    sim.dragTo('missing', 0);
    expect(sim.recoveryOffer().plan).toBeUndefined();
    const fresh = new MotionSimulator(); fresh.load(design, model);
    expect(fresh.startRecovery()).toBe(false);
  });
  it('new static scene cancels immediately and holds achieved positions', () => {
    const { sim } = blocked();
    begin(sim); tick(sim, 20);
    sim.scene = { ...sim.scene, staticVolumes: [...sim.scene.staticVolumes,
      { ...boxVolume([2000, 500, 650], [100, 1000, 100]), id: 'new-obstacle' }] };
    const pose = { ...sim.positions };
    tick(sim);
    expect(sim.recovery?.status).toBe('cancelled');
    expect(sim.positions).toEqual(pose);
  });
  it('fails at a newly blocked step without advancing its index', () => {
    const { sim, leaf } = blocked();
    const plan = begin(sim);
    const active = sim.scene.parts.find(part => part.id === leaf.id)!;
    // Exact runtime constraint failure, while retaining the immutable scene instance.
    active.max = sim.positions[leaf.id];
    tick(sim, 2);
    expect(sim.recovery?.status).toBe('failed');
    expect(sim.recovery?.step).toBe(1);
    expect(sim.positions[leaf.id]).toBe(plan.positions[leaf.id]);
  });
  it('times out a part which never reaches its real target', () => {
    const { sim } = blocked(); const plan = begin(sim);
    for (let i = 0; i < 700; i++) {
      sim.positions[plan.steps[0].id] = plan.positions[plan.steps[0].id];
      sim.velocities = {};
      sim.step(.016, {}, {});
      if (sim.recovery?.status !== 'running') break;
    }
    expect(sim.recovery?.status).toBe('failed');
    const pose = { ...sim.positions }; tick(sim);
    expect(sim.positions).toEqual(pose);
  });
  it('rejects another sliding leaf blocking every park candidate', () => {
    const { sim, leaf } = blocked();
    const part = sim.scene.parts.find(item => item.id === leaf.id)!;
    sim.scene = { ...sim.scene, parts: [...sim.scene.parts, {
      id: 'other-leaf', label: 'Diğer sürgü', kind: 'sliding', home: 0, min: 0, max: 1, open: 1,
      volumes: () => part.volumes(1700), translation: [1, 0], ignoredStaticIds: new Set(),
    }] };
    sim.positions['other-leaf'] = 0;
    sim.targets['other-leaf'] = 0;
    expect(sim.recoveryOffer().plan).toBeUndefined();
  });
  it('rejects an ulp-stale preview without widening contact tolerances', () => {
    const { sim, leaf } = blocked(), plan = sim.recoveryOffer().plan!;
    sim.positions[leaf.id] += 1e-9;
    expect(sim.startRecovery(plan)).toBe(false);
  });
  it.each(['resize', 'add', 'remove', 'json', 'undo', 'redo', 'version'])('invalidates after %s via a newly resolved model', change => {
    const store = useWardrobeStore.getState();
    store.importJsonString(JSON.stringify(phase5Example('straight')));
    if (change === 'undo' || change === 'redo') store.updateRunDimension('run-A', 'lengthMm', 3100);
    if (change === 'redo') store.undo();
    const initial = useWardrobeStore.getState();
    const sim = new MotionSimulator();
    sim.load(initial.design, initial.resolved);
    const [leaf, second] = initial.resolved.slidingDoors!;
    sim.dragTo(second.id, second.maxOffsetMm); sim.dragTo(leaf.id, leaf.maxOffsetMm);
    tick(sim, 180, Object.fromEntries(initial.resolved.drawers.map(item => [item.id, true])));
    sim.dragTo(leaf.id, 0); tick(sim); begin(sim); tick(sim, 10);
    if (change === 'resize') store.updateRunDimension('run-A', 'lengthMm', 3200);
    if (change === 'add') store.addBay('run-A');
    if (change === 'remove') store.removeBay('run-A', initial.design.runs[0].bays[1].id);
    if (change === 'json') store.importJsonString(JSON.stringify(phase5Example('blind')));
    if (change === 'undo') store.undo();
    if (change === 'redo') store.redo();
    if (change === 'version') store.openNamedVersion(phase5Example('diagonal'), 'QA');
    const next = useWardrobeStore.getState();
    expect(next.resolved).not.toBe(initial.resolved);
    sim.load(next.design, next.resolved);
    expect(sim.recovery?.status).toBe('cancelled');
    tick(sim);
    expect(sim.scene.parts.every(part => sim.positions[part.id] === part.home)).toBe(true);
  });
  it('rejects a start when a newer same-value user command has not reached the next frame', () => {
    const { sim } = blocked(), plan = sim.recoveryOffer().plan!;
    sim.step(1 / 60, {}, {}, { revision: 7, ids: [] });
    expect(sim.startRecovery(plan, 8)).toBe(false);
    expect(sim.recovery).toBeNull();
  });
  it('preserves Design, checkpoints, JSON and Undo history through store target synchronization', () => {
    const store = useWardrobeStore.getState();
    store.importJsonString(JSON.stringify(phase5Example('straight')));
    store.setAllDrawersOpen(true);
    const ids = useWardrobeStore.getState().resolved.drawers.map(drawer => drawer.id);
    const before = JSON.stringify([store.exportJsonString(), useWardrobeStore.getState().checkpointDesign,
      useWardrobeStore.getState().historyPast, useWardrobeStore.getState().historyFuture]);
    useWardrobeStore.getState().syncRecoveryTargets(ids);
    expect(ids.every(id => useWardrobeStore.getState().openDrawerIds[id] === false)).toBe(true);
    expect(JSON.stringify([store.exportJsonString(), useWardrobeStore.getState().checkpointDesign,
      useWardrobeStore.getState().historyPast, useWardrobeStore.getState().historyFuture])).toBe(before);
  });
  it('publishes one store update for a stable recovery status across repeated frames', () => {
    const state = useWardrobeStore.getState();
    state.notifyRecovery(null, null);
    let notifications = 0;
    const unsubscribe = useWardrobeStore.subscribe(() => notifications++);
    try {
      const status = { status: 'running' as const, operationId: 1, step: 1, total: 5, message: 'Park' };
      for (let i = 0; i < 600; i++) state.notifyRecovery({ ...status }, null);
      expect(notifications).toBe(1);
    } finally {
      unsubscribe();
      state.notifyRecovery(null, null);
    }
  });
  it('allows manual recovery after cancellation and drops obsolete warnings', () => {
    const { sim, leaf } = blocked(); begin(sim); tick(sim, 20); sim.cancelRecovery();
    sim.dragTo(leaf.id, leaf.maxOffsetMm);
    sim.step(1 / 60, {}, {}, { revision: 2, ids: sim.scene.parts.filter(part => part.kind === 'drawer').map(part => part.id) });
    tick(sim);
    expect(sim.dragTo(leaf.id, 0).blocked).toBe(false);
    tick(sim);
    expect(sim.motionNotice()).toBeNull();
  });
  it('every automatic fixed-time displacement equals the unchanged physical constraint', () => {
    const { sim } = blocked(); begin(sim);
    for (let i = 0; i < 1300 && sim.recovery?.status === 'running'; i++) {
      const old = { ...sim.positions };
      sim.step(1 / 60, {}, {});
      for (const part of sim.scene.parts) if (old[part.id] !== sim.positions[part.id]) {
        const result = constrainMotion(sim.scene, old, part.id, sim.positions[part.id]);
        expect(result.blocked).toBe(false);
        expect(result.position).toBe(sim.positions[part.id]);
      }
    }
    expect(sim.recovery?.status).toBe('completed');
  });
});
