import type { Bay, Design, Front, MaterialId, Run, SplitNode } from '../schema/types';
import { distributeIntegerMm } from '../solver/flexSolver';

export const FRONT_VERTICAL_REVEAL_MM = 2;
export const FRONT_REAR_GAP_MM = 1;

/** Nominal shop allowance in the absence of a selected hinge and edge treatment. */
export function hingeRevealMm(thicknessMm: number, angleDeg: number, inset = false) {
  return 2 + Math.ceil(Math.max(0, thicknessMm - 18) / 5) + Number(angleDeg === 165) + Number(inset);
}

const boardDensityKgPerM3 = 750;
export const planningSingleLeafKg = 22;
export function estimatedBoardMassKg(widthMm: number, heightMm: number, thicknessMm: number, material: MaterialId) {
  if (material === 'clearGlass' || material === 'smokedGlass' || material === 'clearMirror' || material === 'bronzeMirror') return null;
  return widthMm * heightMm * thicknessMm * boardDensityKgPerM3 / 1e9;
}

export function carcassFrontLevels(run: Run) {
  const base = run.plinthHeightMm;
  return { base, top: base + Math.max(400, run.heightMm - base - run.topFillerHeightMm) };
}

/** Only a full-width stack of exterior drawers moves the automatic door's lower edge. */
export function exposedDrawerHeight(bay: Bay, innerHeightMm: number, thicknessMm: number): number {
  const inspect = (node: SplitNode, heightMm: number): number => {
    if (node.kind === 'leaf') return node.insert?.type === 'drawerBank' && !node.insert.isInternalDrawer ? heightMm : 0;
    if (node.direction !== 'horizontal' || node.children.length < 2) return 0;
    const firstHeightMm = distributeIntegerMm(heightMm, node.children.map(({ id, size, locked }) => ({ id, size, locked })), thicknessMm)[0].resolvedMm;
    const first = node.children[0].node;
    const exposed = inspect(first, firstHeightMm);
    return exposed > 0 && first.kind === 'leaf' ? exposed + thicknessMm : exposed;
  };
  return inspect(bay.root, innerHeightMm);
}

export function autoDoorBottom(run: Run, bay: Bay) {
  const { base, top } = carcassFrontLevels(run);
  const t = run.panelThicknessMm;
  const exposed = exposedDrawerHeight(bay, Math.max(100, top - base - 2 * t), t);
  return exposed > 0 ? base + t + exposed : base + FRONT_VERTICAL_REVEAL_MM;
}

/** Resolve the coverage intent. Solvers may further subtract their installation clearances. */
export function frontVerticalRange(run: Run, front: Front) {
  const { base, top } = carcassFrontLevels(run);
  let start = front.yStartMm;
  if (front.yStartAnchor === 'carcass') start = base + front.yStartMm;
  if (front.yStartAnchor === 'top') start = top - front.yStartMm;
  if (front.yStartAnchor === 'drawers') {
    start = Math.max(base + FRONT_VERTICAL_REVEAL_MM, ...run.bays
      .filter(bay => front.bayIds.includes(bay.id))
      .map(bay => autoDoorBottom(run, bay))) + front.yStartMm;
  }
  return { start, end: front.yEndAnchor === 'top' ? top - front.yEndMm : front.yEndMm };
}

/**
 * Old exports lack anchors. Recognize only the exact old automatic body edges
 * when that body is edited. Arbitrary expert elevations retain their absolute intent.
 */
export function retainLegacyBodyAnchors(before: Design, after: Design) {
  for (const front of after.fronts) {
    const previous = before.fronts.find(f => f.id === front.id && f.runId === front.runId);
    const oldRun = before.runs.find(r => r.id === front.runId);
    const run = after.runs.find(r => r.id === front.runId);
    if (!previous || !oldRun || !run) continue;
    const old = carcassFrontLevels(oldRun);
    const next = carcassFrontLevels(run);
    const reveal = FRONT_VERTICAL_REVEAL_MM;
    if (old.top !== next.top && !previous.yEndAnchor && !front.yEndAnchor &&
        previous.yEndMm === old.top - reveal && front.yEndMm === previous.yEndMm) {
      front.yEndAnchor = 'top';
      front.yEndMm = reveal;
    }
    if (old.base !== next.base && !previous.yStartAnchor && !front.yStartAnchor &&
        previous.yStartMm === old.base + reveal && front.yStartMm === previous.yStartMm) {
      front.yStartAnchor = 'carcass';
      front.yStartMm = reveal;
    }
  }
}
