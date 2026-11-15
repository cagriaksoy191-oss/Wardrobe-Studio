import type { Design, ResolvedModel } from '../schema/types';
import { summarizeProductionAccess, type ProductionPackage } from './productionModel';

export const INVALID_MANUFACTURING_SNAPSHOT =
  'Üretim bilgileri güncel tasarımla doğrulanamadı. Tasarımı yeniden açıp tekrar deneyin.';

/** Null means a user can request the full cut-list CSV or technical ZIP. */
export function fullManufacturingExportDenial(
  design: Design,
  model: ResolvedModel,
  pkg: ProductionPackage,
): string | null {
  if (pkg?.status === 'blocked') {
    return 'Kritik geometri hatası giderilmeden tam CSV veya ZIP indirilemez.';
  }
  if (!design?.id || model?.designId !== design.id || pkg?.designId !== design.id ||
      pkg.designName !== design.name || pkg.status !== 'review' ||
      !Array.isArray(pkg.issues) || !Array.isArray(pkg.parts) || pkg.parts.length === 0 ||
      pkg.issues.some(issue => !issue || !['info', 'warning', 'expert'].includes(issue.severity))) {
    return INVALID_MANUFACTURING_SNAPSHOT;
  }

  const entries = model.analysis?.functionalAccess;
  if (!Array.isArray(entries) || pkg.functionalAccess !== entries ||
      entries.some(entry => !entry || !['blocked', 'unverified', 'usable'].includes(entry.status)) ||
      pkg.accessStatus !== summarizeProductionAccess(entries)) {
    return INVALID_MANUFACTURING_SNAPSHOT;
  }

  if (pkg.accessStatus === 'blocked') {
    return 'Tam CSV ve ZIP, erişim engeli giderilince açılır. Tanısal paftaları inceleyin.';
  }
  return null;
}
