import type { Design, ResolvedFunctionalAccess, ResolvedModel } from '../schema/types';
import { extractProduction } from '../production/productionModel';
import { solveDesign } from '../solver/carcassSolver';

export type AccessRemedy =
  | { kind: 'corner'; junctionId: string; mode: 'left' | 'right' | 'open' }
  | { kind: 'open-front'; frontId: string };

export function changeAccessLayout(design: Design, remedy: AccessRemedy) {
  if (remedy.kind === 'corner') {
    const junction = design.junctions.find(j => j.id === remedy.junctionId && j.type === 'diagonal');
    if (!junction) throw new Error('İncelenen beşgen köşe artık bu tasarımda bulunmuyor.');
    junction.doorMode = remedy.mode;
  } else {
    const front = design.fronts.find(f => f.id === remedy.frontId && f.type === 'sliding');
    if (!front) throw new Error('İncelenen sürgülü cephe artık bu tasarımda bulunmuyor.');
    front.type = 'open';
  }
}

export interface AccessOption {
  remedy: AccessRemedy;
  title: string;
  design: Design;
  model: ResolvedModel;
  entries: ResolvedFunctionalAccess[];
  removed: string[];
  added: string[];
  resized: string[];
  hardwareDelta: number;
}

export function evaluateAccessOptions(design: Design, model: ResolvedModel, bayId: string): AccessOption[] {
  const entries = model.analysis?.functionalAccess ?? [];
  const affected = entries.filter(entry => entry.bayId === bayId && entry.status === 'blocked');
  if (!affected.length || model.issues.some(issue => issue.severity === 'error')) return [];
  const junction = design.junctions.find(j => j.id === bayId && j.type === 'diagonal');
  const remedies: { title: string; remedy: AccessRemedy }[] = [];
  if (junction) {
    const old = junction.doorMode ?? 'left';
    if (old !== 'open') {
      const mode = old === 'left' ? 'right' : 'left';
      remedies.push({ title: `Köşe menteşesini ${mode === 'right' ? 'sağa' : 'sola'} al`, remedy: { kind: 'corner', junctionId: bayId, mode } });
      remedies.push({ title: 'Köşeyi açık bırak', remedy: { kind: 'corner', junctionId: bayId, mode: 'open' } });
    }
  } else {
    const coveringIds = new Set(affected.filter(entry => entry.kind === 'drawer').flatMap(entry => entry.coveringIds));
    const frontIds = new Set(model.slidingDoors?.filter(leaf => coveringIds.has(leaf.id)).map(leaf => leaf.frontId));
    for (const front of design.fronts.filter(f => f.type === 'sliding' && frontIds.has(f.id))) {
      remedies.push({ title: `${front.label ?? 'Çekmece önündeki sürgülü aralık'} · açık bırak`, remedy: { kind: 'open-front', frontId: front.id } });
    }
  }

  const original = extractProduction(design, model);
  const previousParts = new Map(original.parts.map(part => [part.code, part]));
  const previouslyBlocked = new Set(entries.filter(entry => entry.status === 'blocked').map(entry => entry.id));
  const result: AccessOption[] = [];
  for (const { title, remedy } of remedies) {
    const draft = structuredClone(design);
    changeAccessLayout(draft, remedy);
    const next = solveDesign(draft);
    const access = next.analysis?.functionalAccess ?? [];
    const byId = new Map(access.map(entry => [entry.id, entry]));
    const hinge = next.doors.find(door => door.isCornerDoor && door.bayIds.includes(bayId));
    if ((hinge && !hinge.hingeSupportPanelId) ||
      affected.some(entry => byId.get(entry.id)?.status !== 'usable') ||
      access.some(entry => entry.status === 'blocked' && !previouslyBlocked.has(entry.id))) continue;
    const pkg = extractProduction(draft, next);
    if (pkg.status === 'blocked') continue;
    const parts = new Map(pkg.parts.map(part => [part.code, part]));
    result.push({
      title, remedy, design: draft, model: next, entries: access.filter(entry => entry.bayId === bayId),
      removed: original.parts.filter(part => !parts.has(part.code)).map(part => part.code),
      added: pkg.parts.filter(part => !previousParts.has(part.code)).map(part => part.code),
      resized: pkg.parts.filter(part => {
        const old = previousParts.get(part.code);
        return old && (old.widthMm !== part.widthMm || old.heightMm !== part.heightMm || old.thicknessMm !== part.thicknessMm);
      }).map(part => part.code),
      hardwareDelta: pkg.hardware.length - original.hardware.length,
    });
  }
  return result;
}
