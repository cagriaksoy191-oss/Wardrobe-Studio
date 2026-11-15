import { buildCutListCsv } from '../core/production/csvExport';
import { fullManufacturingExportDenial, INVALID_MANUFACTURING_SNAPSHOT } from '../core/production/fullExportPolicy';
import { extractProduction } from '../core/production/productionModel';
import { buildTechnicalSheets } from '../core/production/technicalSheets';
import type { Design } from '../core/schema/types';
import { designSignature } from '../core/versions/designExchange';
import { useVersionArchive, type NamedVersion } from '../store/versionArchive';
import { useWardrobeStore } from '../store/useWardrobeStore';
import { downloadFile, safeFileName } from './download';

export function manufacturingVersion(design: Design, versions: NamedVersion[]) {
  if (!versions.length) return undefined;
  const signature = designSignature(design);
  return versions.find(version => designSignature(version.design) === signature);
}

/** The product download command. The serializers also serve diagnostic and QA callers. */
export async function downloadFullManufacturingFile(format: 'csv' | 'zip', signal: AbortSignal) {
  signal.throwIfAborted();
  const { design, resolved } = useWardrobeStore.getState();
  if (!design?.id || resolved?.designId !== design.id || !Array.isArray(resolved.issues)) {
    throw new Error(INVALID_MANUFACTURING_SNAPSHOT);
  }

  const currentVersion = () => manufacturingVersion(design, useVersionArchive.getState().versions);
  const version = currentVersion();
  const pkg = extractProduction(design, resolved, version?.name ?? 'Çalışma kopyası');
  const denial = fullManufacturingExportDenial(design, resolved, pkg);
  if (denial) throw new Error(denial);

  const stem = safeFileName(`${design.name}-${pkg.versionName}`);
  if (format === 'csv') {
    downloadFile(`${stem}-kesim.csv`, buildCutListCsv(pkg, true), 'text/csv;charset=utf-8');
    return `${pkg.parts.length} fiziksel parçanın tam CSV listesi için indirme başlatıldı.`;
  }

  // Invalidate the request even if the editor returns to the original snapshot
  // before the ZIP writer finishes loading.
  let snapshotChanged = false;
  const unsubscribeDesign = useWardrobeStore.subscribe(state => {
    if (state.design !== design || state.resolved !== resolved) snapshotChanged = true;
  });
  const unsubscribeArchive = useVersionArchive.subscribe((state, previous) => {
    if (state.versions !== previous.versions && currentVersion() !== version) snapshotChanged = true;
  });
  try {
    const { createTechnicalZip } = await import('./zipWriter');
    signal.throwIfAborted();
    if (snapshotChanged) {
      throw new Error('Paket hazırlanırken tasarım veya sürüm değişti. Güncel tasarım için yeniden indirin.');
    }
    const sheets = buildTechnicalSheets(design, resolved, pkg, true);
    downloadFile(`${stem}-teknik-paket.zip`, createTechnicalZip(design, pkg, sheets, true), 'application/zip');
    return `${sheets.length} SVG paftası, tam CSV ve kaynak JSON içeren teknik paket için indirme başlatıldı.`;
  } finally {
    unsubscribeDesign();
    unsubscribeArchive();
  }
}
