import { createMotionConstraint, type MotionPositions, type MotionScene, type MotionStop } from './motionConstraints';

export interface RecoveryStep { id: string; target: number; label: string }
export interface RecoveryPlan {
  scene: MotionScene;
  positions: MotionPositions;
  steps: RecoveryStep[];
  description: string;
}
export interface RecoveryStatus {
  status: 'running' | 'completed' | 'cancelled' | 'failed';
  operationId: number;
  message: string;
  step: number;
  total: number;
}
export interface RecoveryOffer { plan?: RecoveryPlan; reason: string }

/** Bounded search: one sliding leaf, its obstructing drawers, sequential translations only. */
export function planSafeRecovery(scene: MotionScene, positions: MotionPositions, stops: Record<string, MotionStop>): RecoveryOffer {
  const pair = Object.entries(stops).filter(([, stop]) => stop.blocked).map(([id, stop]) => ({
    moving: scene.parts.find(part => part.id === id),
    blocker: scene.parts.find(part => part.id === stop.blockerId),
  })).find(({ moving, blocker }) => moving?.kind === 'drawer' && blocker?.kind === 'sliding'
    || moving?.kind === 'sliding' && blocker?.kind === 'drawer');
  if (!pair) return { reason: 'Sürgü–çekmece engeli için manuel hareket kullanın.' };
  const leaf = pair.moving!.kind === 'sliding' ? pair.moving! : pair.blocker!;
  const drawer = pair.moving!.kind === 'drawer' ? pair.moving! : pair.blocker!;
  if (scene.parts.some(part => !Number.isFinite(positions[part.id]))) {
    return { reason: 'Gerçek konumlar doğrulanamadı. Manuel hareket kullanın.' };
  }
  const check = createMotionConstraint(scene);
  const drawerStop = check(positions, drawer.id, drawer.home);
  const leafStop = check(positions, leaf.id, leaf.home);
  if (!(drawerStop.blocked && drawerStop.blockerId === leaf.id ||
        leafStop.blocked && leafStop.blockerId === drawer.id)) {
    return { reason: 'Güncel konumda karşılıklı kapanma engeli doğrulanamadı. Manuel hareket kullanın.' };
  }
  const parks = [...new Set([leaf.min, leaf.max, leaf.open])]
    .filter(target => target !== leaf.home && target !== positions[leaf.id])
    .sort((a, b) => Math.abs(a - positions[leaf.id]) - Math.abs(b - positions[leaf.id]) || a - b);
  parks.unshift(positions[leaf.id]);
  for (const park of parks) {
    const trial = { ...positions };
    const steps: RecoveryStep[] = [];
    const append = (id: string, target: number, label: string) => {
      if (trial[id] === target) return true;
      const result = check(trial, id, target);
      if (result.blocked || result.position !== target) return false;
      steps.push({ id, target, label });
      trial[id] = target;
      return true;
    };
    if (!append(leaf.id, park, leaf.label + ' geri park edilecek')) continue;
    if (!append(drawer.id, drawer.home, drawer.label + ' kapatılacak')) continue;
    // Other leaf or static blockers reject this park instead of extending the search.
    for (let attempt = 0; attempt <= scene.parts.length; attempt++) {
      const stop = check(trial, leaf.id, leaf.home);
      if (!stop.blocked && stop.position === leaf.home) {
        if (!append(leaf.id, leaf.home, leaf.label + ' kapatılacak')) break;
        if (!steps.length) break;
        return { plan: { scene, positions: { ...positions }, steps,
          description: steps.map((step, index) => (index + 1) + '. ' + step.label).join('. ') }, reason: '' };
      }
      const next = scene.parts.find(part => part.id === stop.blockerId && part.kind === 'drawer');
      if (!next || trial[next.id] === next.home || !append(next.id, next.home, next.label + ' kapatılacak')) break;
    }
  }
  return { reason: 'Tek kanatla güvenli park ve kapanış sırası doğrulanamadı. Manuel geri park yöntemini kullanın.' };
}
