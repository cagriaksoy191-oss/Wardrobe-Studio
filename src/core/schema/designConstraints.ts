import type { Design, Run, SplitNode } from './types';
import { validationConfig } from '../solver/validationConfig';
import { frontVerticalRange } from '../fronts/frontGeometry';

export class DesignConstraintError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
  }
}

export function runFrontMm(run: Run): number {
  return (run.rearOffsetMm ?? 0) + run.depthMm;
}

/** Shared by decoded designs, the typed solver boundary and production preflight. */
export function assertDesignStructure(design: Design): void {
  const invalid = (message: string): never => {
    throw new DesignConstraintError('DESIGN_STRUCTURE_INVALID', message);
  };
  const a = design.runs.find(run => run.wallAxis === 'A');
  const b = design.runs.find(run => run.wallAxis === 'B');
  if (design.layoutKind !== 'straight' && design.layoutKind !== 'l-shape') invalid('layoutKind: Yerleşim düz veya L olmalıdır.');
  const isL = design.layoutKind === 'l-shape';
  if (!a || (isL ? !b || design.runs.length !== 2 : design.runs.length !== 1)) {
    invalid('runs.wallAxis: Düz dolapta bir A kolu, L dolapta bir A ve bir B kolu gerekir.');
  }
  if (design.junctions.length !== (isL ? 1 : 0)) {
    invalid('junctions: L dolap tam bir köşe birleşimi içermeli, düz dolap birleşim içermemelidir.');
  }
  if (design.runs.reduce((sum, run) => sum + run.bays.length, 0) > 60) {
    invalid('runs.bays: En fazla 60 bölme desteklenir.');
  }

  const ids = new Set<string>();
  const remember = (id: string) => {
    if (!id || ids.has(id)) invalid('Tekrarlanan veya eksik nesne kimliği: ' + id);
    ids.add(id);
  };
  const walk = (node: SplitNode) => {
    remember(node.id);
    if (node.kind === 'split') {
      for (const child of node.children) {
        remember(child.id);
        walk(child.node);
      }
    }
  };
  for (const run of design.runs) {
    remember(run.id);
    if (run.bays.length === 0) invalid(run.id + ': En az bir gövde bölmesi gerekir.');
    const rear = run.rearOffsetMm ?? 0;
    if (!Number.isInteger(rear) || rear < 0 || runFrontMm(run) > validationConfig.maxRunFrontMm) {
      invalid(run.id + ': Arka ofset negatif olamaz ve cephe duvardan en fazla 1000 mm uzaklıkta olabilir.');
    }
    for (const bay of run.bays) {
      remember(bay.id);
      walk(bay.root);
    }
  }
  const frontsByBay = new Map<string, { id: string; start: number; end: number }[]>();
  for (const front of design.fronts) {
    remember(front.id);
    if (front.type !== 'hinged' && front.type !== 'sliding' && front.type !== 'open') {
      invalid(front.id + ': Bağımsız çekmece önü desteklenmez. Çekmece takımı iç modülünü kullanın.');
    }
    const run = design.runs.find(item => item.id === front.runId);
    if (!run || !front.bayIds.length || !Number.isInteger(front.yStartMm) || !Number.isInteger(front.yEndMm) ||
        front.yStartMm < 0 || front.yEndMm < 0) {
      invalid('Kapak kolu, kapsamı veya yükseklik aralığı geçersiz: ' + front.id);
    }
    const range = frontVerticalRange(run!, front);
    if (range.start < 0 || range.end <= range.start || range.end > run!.heightMm) {
      invalid('Kapak yükseklik aralığı gövdeyle uyumsuz: ' + front.id);
    }
    const indices = front.bayIds.map(id => run?.bays.findIndex(bay => bay.id === id) ?? -1).sort((x, y) => x - y);
    if (indices[0] < 0 || indices.some((n, i) => i > 0 && n !== indices[i - 1] + 1)) {
      invalid('Ortak kapak yalnızca aynı koldaki bitişik bölmeleri örtebilir: ' + front.id);
    }
    for (const bayId of front.bayIds) {
      const prior = frontsByBay.get(bayId) ?? [];
      const conflict = prior.find(other => other.start < range.end && range.start < other.end);
      if (conflict) throw new DesignConstraintError(
        'FRONT_COVERAGE_OVERLAP', `${bayId}: ${conflict.id} ve ${front.id} cephe kapsamları düşeyde çakışıyor.`
      );
      prior.push({ id: front.id, ...range });
      frontsByBay.set(bayId, prior);
    }
  }
  for (const junction of design.junctions) {
    remember(junction.id);
    if (junction.type !== 'diagonal' && junction.type !== 'blind') invalid(junction.id + ': Köşe türü desteklenmiyor.');
    if (!a || !b || junction.runAId !== a.id || junction.runBId !== b.id ||
        (junction.priorityRunId !== a.id && junction.priorityRunId !== b.id)) {
      invalid(junction.id + ': Köşe A ve B kollarına bağlı olmalı. Öncelikli kol bu ikisinden biri olmalıdır.');
    }
    if (junction.type === 'diagonal' && a && b) {
      const minA = runFrontMm(b) + validationConfig.diagonalLegBeyondFrontMm;
      const minB = runFrontMm(a) + validationConfig.diagonalLegBeyondFrontMm;
      if (junction.diagonalArmAMm < minA || junction.diagonalArmBMm < minB) {
        throw new DesignConstraintError('CORNER_ARM_TOO_SHORT',
          `${junction.id}: Beşgen köşe kolları bu cephe derinliklerinde en az A ${minA} mm ve B ${minB} mm olmalıdır.`);
      }
    }
    if (a && b && (a.panelThicknessMm !== b.panelThicknessMm || a.backPanelThicknessMm !== b.backPanelThicknessMm)) {
      throw new DesignConstraintError('CORNER_THICKNESS_MISMATCH',
        junction.id + ': L birleşimi için iki kolda aynı ana panel ve arkalık kalınlığı gerekir.');
    }
    if (junction.type === 'blind' && junction.fillerWidthMm < validationConfig.blindFillerMinimumMm) {
      throw new DesignConstraintError('BLIND_CORNER_FILLER_TOO_NARROW',
        `${junction.id}: Kör köşe klapası en az ${validationConfig.blindFillerMinimumMm} mm olmalıdır.`);
    }
  }
  for (const obstacle of design.obstacles ?? []) remember(obstacle.id);
  for (const target of design.inventory ?? []) remember(target.id);
}
