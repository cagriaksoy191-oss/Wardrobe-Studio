import { polygonBounds, polygonsIntersect } from '../analysis/kinematics';
import type { Point2DMm, ResolvedModel, ValidationIssue } from '../schema/types';
import type { ProductionPart } from './productionModel';

const structuralRoles = new Set([
  'sidePanel', 'topPanel', 'bottomPanel', 'backPanel', 'verticalDivider', 'shelf',
  'cornerSidePanel', 'cornerBackPanel', 'cornerPolygonShelf',
]);

function partVolume(part: ProductionPart) {
  const [x, y, z] = part.worldCenterMm;
  const [width, height, depth] = part.worldSizeMm;
  let footprint: Point2DMm[];
  if (part.verticesMm && part.originWorldMm) {
    const [ox, oz] = part.originWorldMm;
    footprint = part.verticesMm.map(p => ({ xMm: ox + p.xMm, zMm: oz + p.zMm }));
  } else {
    const cosine = Math.cos(part.rotationYRad), sine = Math.sin(part.rotationYRad);
    const hx = width / 2, hz = depth / 2;
    const corners = [[-hx, -hz], [hx, -hz], [hx, hz], [-hx, hz]];
    footprint = corners.map(([u, v]) => ({
      xMm: x + u * cosine + v * sine,
      zMm: z - u * sine + v * cosine,
    }));
  }
  return {
    part, footprint, ...polygonBounds(footprint),
    minY: part.verticesMm ? y : y - height / 2,
    maxY: part.verticesMm ? y + part.thicknessMm : y + height / 2,
  };
}

export function staticProductionIssues(model: ResolvedModel, parts: ProductionPart[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const check = (members: ProductionPart[], tolerance: number, code: string) => {
    const volumes = members.map(partVolume).sort((a, b) => a.minX - b.minX);
    for (const [i, a] of volumes.entries()) {
      for (let j = i + 1; j < volumes.length; j++) {
        const b = volumes[j];
        if (b.minX >= a.maxX - tolerance) break;
        if (Math.min(a.maxY, b.maxY) - Math.max(a.minY, b.minY) <= tolerance ||
            Math.min(a.maxZ, b.maxZ) - Math.max(a.minZ, b.minZ) <= tolerance) continue;
        if (!polygonsIntersect(a.footprint, b.footprint, -tolerance)) continue;
        issues.push({
          id: code + '-' + a.part.code + '-' + b.part.code, code, severity: 'error',
          title: 'Sabit üretim parçaları kesişiyor',
          description: a.part.code + ' ' + a.part.label + ' / ' + b.part.code + ' ' + b.part.label,
          targetId: a.part.sourceId,
        });
      }
    }
  };
  // Earlier body models place some odd-width centres on integer coordinates.
  // Half-millimetre edge contact at those joints is treated as a fit allowance.
  check(parts.filter(part => structuralRoles.has(part.role)), 0.500001, 'STATIC_PANEL_INTERSECTION');
  const organizers = new Map<string, ProductionPart[]>();
  for (const part of parts) {
    if (part.role !== 'drawerOrganizer' || !part.unitId) continue;
    const siblings = organizers.get(part.unitId) ?? [];
    siblings.push(part);
    organizers.set(part.unitId, siblings);
  }
  for (const members of organizers.values()) check(members, 0.000001, 'ORGANIZER_INTERSECTION');

  for (const [i, a] of model.bays.entries()) {
    for (const b of model.bays.slice(i + 1)) {
      if (a.runId === b.runId) continue;
      const intersects = a.worldCenterMm.every((center, axis) => {
        const halfA = a.worldSizeMm[axis] / 2, halfB = b.worldSizeMm[axis] / 2;
        const other = b.worldCenterMm[axis];
        return Math.min(center + halfA, other + halfB) - Math.max(center - halfA, other - halfB) > 0.500001;
      });
      if (intersects) issues.push({
        id: 'body-overlap-' + a.id + '-' + b.id, code: 'STATIC_BODY_INTERSECTION', severity: 'error',
        title: 'İki gövde hacmi kesişiyor', description: a.label + ' / ' + b.label, targetId: a.id,
      });
    }
  }
  return issues;
}
