import { buildCutListCsv } from '../core/production/csvExport';
import { fullManufacturingExportDenial, INVALID_MANUFACTURING_SNAPSHOT } from '../core/production/fullExportPolicy';
import { assertProductionReady, extractProduction } from '../core/production/productionModel';
import { buildPrintableReport, buildTechnicalSheets } from '../core/production/technicalSheets';
import type { Design } from '../core/schema/types';
import { designSignature } from '../core/versions/designExchange';
import { useVersionArchive, type NamedVersion } from '../store/versionArchive';
import { useWardrobeStore } from '../store/useWardrobeStore';
import { downloadFile, safeFileName } from './download';

const STALE_SNAPSHOT_ERROR = 'Paket hazırlanırken tasarım veya sürüm değişti. Güncel tasarım için yeniden indirin.';

export function manufacturingVersion(design: Design, versions: NamedVersion[]) {
  if (!versions.length) return undefined;
  const signature = designSignature(design);
  return versions.find(version => designSignature(version.design) === signature);
}

function watchManufacturingSnapshot(design: Design, resolved: unknown, version: NamedVersion | undefined) {
  let snapshotChanged = false;
  const currentVersion = () => manufacturingVersion(design, useVersionArchive.getState().versions);
  const unsubscribeDesign = useWardrobeStore.subscribe(state => {
    if (state.design !== design || state.resolved !== resolved) snapshotChanged = true;
  });
  const unsubscribeArchive = useVersionArchive.subscribe((state, previous) => {
    if (state.versions !== previous.versions && currentVersion() !== version) snapshotChanged = true;
  });
  return {
    assertFresh(signal: AbortSignal) {
      signal.throwIfAborted();
      if (snapshotChanged) throw new Error(STALE_SNAPSHOT_ERROR);
    },
    dispose() {
      unsubscribeDesign();
      unsubscribeArchive();
    },
  };
}

/** The product download command. The serializers also serve diagnostic and QA callers. */
export async function downloadFullManufacturingFile(format: 'csv' | 'zip', signal: AbortSignal) {
  signal.throwIfAborted();
  const { design, resolved } = useWardrobeStore.getState();
  if (!design?.id || resolved?.designId !== design.id || !Array.isArray(resolved.issues)) {
    throw new Error(INVALID_MANUFACTURING_SNAPSHOT);
  }

  const version = manufacturingVersion(design, useVersionArchive.getState().versions);
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
  const watcher = watchManufacturingSnapshot(design, resolved, version);
  try {
    const { createTechnicalZip } = await import('./zipWriter');
    watcher.assertFresh(signal);
    const sheets = buildTechnicalSheets(design, resolved, pkg, true);
    const zipBytes = createTechnicalZip(design, pkg, sheets, true);
    watcher.assertFresh(signal);
    downloadFile(`${stem}-teknik-paket.zip`, zipBytes, 'application/zip');
    return `${sheets.length} SVG paftası, tam CSV ve kaynak JSON içeren teknik paket için indirme başlatıldı.`;
  } finally {
    watcher.dispose();
  }
}

/** Stale-safe diagnostic/technical PDF & printable HTML export with full MS-EXPORT-001 parity. */
export async function downloadProductionDocument(format: 'pdf' | 'printable', signal: AbortSignal) {
  signal.throwIfAborted();
  const { design, resolved } = useWardrobeStore.getState();
  if (!design?.id || resolved?.designId !== design.id || !Array.isArray(resolved.issues)) {
    throw new Error(INVALID_MANUFACTURING_SNAPSHOT);
  }

  const version = manufacturingVersion(design, useVersionArchive.getState().versions);
  const pkg = extractProduction(design, resolved, version?.name ?? 'Çalışma kopyası');
  assertProductionReady(pkg);

  const diagnostic = pkg.accessStatus === 'blocked';
  const stem = safeFileName(`${design.name}-${pkg.versionName}`);
  const watcher = watchManufacturingSnapshot(design, resolved, version);
  try {
    const { createProductionPdf, localPdfFont } = await import('./pdfWriter');
    watcher.assertFresh(signal);
    const font = await localPdfFont(signal);
    watcher.assertFresh(signal);
    const sheets = buildTechnicalSheets(design, resolved, pkg, true);
    watcher.assertFresh(signal);

    if (format === 'pdf') {
      const data = createProductionPdf(pkg, sheets, font, signal);
      watcher.assertFresh(signal);
      downloadFile(`${stem}-${diagnostic ? 'tani' : 'uretim'}.pdf`, data, 'application/pdf');
      return `${sheets.length} sayfalık ${diagnostic ? 'tanısal' : 'teknik'} PDF için indirme başlatıldı.`;
    }

    const html = buildPrintableReport(pkg, sheets).replace(
      "url('./fonts/NotoSans-Regular.ttf')",
      `url('data:font/ttf;base64,${font}')`
    );
    watcher.assertFresh(signal);
    downloadFile(`${stem}-yazdir.html`, html, 'text/html;charset=utf-8');
    return 'Yazdırılabilir rapor (.html) için indirme başlatıldı. Dosyayı açıp Yazdır / PDF düğmesini kullanın.';
  } finally {
    watcher.dispose();
  }
}
