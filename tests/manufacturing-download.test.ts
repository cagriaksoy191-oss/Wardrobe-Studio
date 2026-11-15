import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { strFromU8, unzipSync } from 'fflate';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildCutListCsv } from '../src/core/production/csvExport';
import { fullManufacturingExportDenial, INVALID_MANUFACTURING_SNAPSHOT } from '../src/core/production/fullExportPolicy';
import { extractProduction, type ProductionPackage } from '../src/core/production/productionModel';
import { buildPrintableReport, buildTechnicalSheets, sheetToSvg } from '../src/core/production/technicalSheets';
import { phase5Example } from '../src/core/presets/phase5Examples';
import { normalizeAndValidateDesign } from '../src/core/schema/designSchema';
import type { Design, ResolvedModel } from '../src/core/schema/types';
import { solveDesign } from '../src/core/solver/carcassSolver';
import { designSignature, previewDesignJson } from '../src/core/versions/designExchange';
import { downloadFullManufacturingFile } from '../src/export/manufacturingDownload';
import { createProductionPdf } from '../src/export/pdfWriter';
import { useVersionArchive } from '../src/store/versionArchive';
import { useWardrobeStore } from '../src/store/useWardrobeStore';

const { download } = vi.hoisted(() => ({ download: vi.fn() }));
vi.mock('../src/export/download', async importOriginal => ({
  ...await importOriginal<typeof import('../src/export/download')>(),
  downloadFile: download,
}));

const blockedModels = ['diagonal', 'asymmetric', 'blind'] as const;
const fixtures = new Map<string, { design: Design; resolved: ResolvedModel }>();
const stamp = '2026-11-04T12:00:00.000Z';
const taskSignal = () => new AbortController().signal;

function fixture(kind: 'straight' | typeof blockedModels[number]) {
  const cached = fixtures.get(kind);
  if (cached) return cached;
  const design = normalizeAndValidateDesign(phase5Example(kind));
  const entry = { design, resolved: solveDesign(design) };
  fixtures.set(kind, entry);
  return entry;
}

function production(snapshot: ReturnType<typeof fixture>) {
  return extractProduction(snapshot.design, snapshot.resolved, 'QA', stamp);
}

beforeEach(() => {
  download.mockReset();
  useVersionArchive.setState({ versions: [] });
  useWardrobeStore.setState(fixture('straight'));
});

describe('Full manufacturing downloads', () => {
  describe.each(blockedModels)('%s canonical access blocker', kind => {
    it.each(['csv', 'zip'] as const)('denies %s at the button policy and command', async format => {
      const snapshot = fixture(kind);
      useWardrobeStore.setState(snapshot);
      const pkg = production(snapshot);
      expect([pkg.status, pkg.accessStatus]).toEqual(['review', 'blocked']);
      const denial = fullManufacturingExportDenial(snapshot.design, snapshot.resolved, pkg);
      expect(denial).toMatch(/erişim engeli/i);
      await expect(downloadFullManufacturingFile(format, taskSignal())).rejects.toThrow(denial!);
      expect(download).not.toHaveBeenCalled();
    });

    it('keeps the same diagnostic PDF, SVG and printable HTML contract', () => {
      const { design, resolved } = fixture(kind);
      const pkg = production({ design, resolved });
      const sheets = buildTechnicalSheets(design, resolved, pkg, true);
      expect(sheets.every(sheet => sheetToSvg(sheet).includes('KULLANIM ENGELİ · TANISAL PAFTA'))).toBe(true);
      expect(buildPrintableReport(pkg, sheets)).toContain('TANISAL PAFTA');
      const font = readFileSync('public/fonts/NotoSans-Regular.ttf').toString('base64');
      const pdf = Buffer.from(createProductionPdf(pkg, sheets, font)).toString('latin1');
      expect(pdf.startsWith('%PDF-')).toBe(true);
      expect(pdf.match(/\/Type \/Page\b/g)).toHaveLength(sheets.length);
    });
  });

  it('downloads the real 69-part CSV with the prior file name, BOM and bytes', async () => {
    await expect(downloadFullManufacturingFile('csv', taskSignal())).resolves.toMatch(/69 fiziksel/);
    expect(download).toHaveBeenCalledTimes(1);
    const { design, resolved } = fixture('straight');
    const [name, data, type] = download.mock.calls[0];
    expect([name, type]).toEqual([`${design.name}-Çalışma kopyası-kesim.csv`, 'text/csv;charset=utf-8']);
    const expected = extractProduction(design, resolved);
    expect(data).toBe(buildCutListCsv(expected, true));
    expect(data.charCodeAt(0)).toBe(0xfeff);
    expect(data.trim().split('\r\n')).toHaveLength(70);
  });

  it('downloads the real ZIP with 69 parts, 25 sheets and the same CSV bytes', async () => {
    await expect(downloadFullManufacturingFile('zip', taskSignal())).resolves.toMatch(/25 SVG/);
    expect(download).toHaveBeenCalledTimes(1);
    const { design, resolved } = fixture('straight');
    const [name, data, type] = download.mock.calls[0];
    expect([name, type]).toEqual([`${design.name}-Çalışma kopyası-teknik-paket.zip`, 'application/zip']);
    const zip = unzipSync(data);
    expect(Object.keys(zip)).toHaveLength(29);
    expect(Object.keys(zip).filter(path => path.startsWith('svg/'))).toHaveLength(25);
    expect(JSON.parse(strFromU8(zip['design.json']))).toEqual(design);
    const archivedPackage: ProductionPackage = JSON.parse(strFromU8(zip['uretim-modeli.json']));
    expect(archivedPackage.parts).toHaveLength(69);
    const expected = extractProduction(design, resolved);
    expect(zip['kesim-listesi.csv']).toEqual(new TextEncoder().encode(buildCutListCsv(expected, true)));
    expect(zip['OKU.txt']).toBeDefined();
  });

  it('continues to refuse critical geometry for full and diagnostic files', async () => {
    const design = phase5Example('straight');
    design.fronts[0].sliding!.trackDepthMm = 50;
    const resolved = solveDesign(design);
    useWardrobeStore.setState({ design, resolved });
    const pkg = production({ design, resolved });
    expect(pkg.status).toBe('blocked');
    for (const format of ['csv', 'zip'] as const) {
      await expect(downloadFullManufacturingFile(format, taskSignal())).rejects.toThrow(/kritik geometri/i);
    }
    const sheets = buildTechnicalSheets(design, resolved, pkg, true);
    expect(() => buildPrintableReport(pkg, sheets)).toThrow(/kritik/i);
    expect(() => createProductionPdf(pkg, sheets, '')).toThrow(/kritik/i);
    expect(download).not.toHaveBeenCalled();
  });

  it('keeps warned full exports for a genuinely unresolved service access check', async () => {
    const design = phase5Example('straight');
    design.runs[0].bays[1].root = {
      kind: 'leaf', id: 'service-check', label: 'Servis', owner: 'ortak',
      insert: { type: 'serviceNiche' },
    };
    const resolved = solveDesign(design);
    const pkg = production({ design, resolved });
    expect([pkg.status, pkg.accessStatus]).toEqual(['review', 'unverified']);
    expect(pkg.statusLabel).toContain('USTA KONTROLÜ');
    useWardrobeStore.setState({ design, resolved });
    await downloadFullManufacturingFile('csv', taskSignal());
    await downloadFullManufacturingFile('zip', taskSignal());
    expect(download).toHaveBeenCalledTimes(2);
    expect(download.mock.calls[0][1]).toContain('ERİŞİM VE USTA KONTROLÜ GEREKİR');
    expect(strFromU8(unzipSync(download.mock.calls[1][1])['OKU.txt'])).toContain(pkg.statusLabel);
  });

  it('rejects missing, unknown or inconsistent eligibility and mismatched identities', async () => {
    const { design, resolved } = fixture('straight');
    const pkg = production({ design, resolved });
    const badPackages = [
      { ...pkg, status: undefined },
      { ...pkg, accessStatus: 'approved' },
      { ...pkg, functionalAccess: [] },
      { ...pkg, accessStatus: 'unverified' },
      { ...pkg, issues: [{ severity: 'error' }] },
      { ...pkg, designId: 'another-design' },
    ] as ProductionPackage[];
    for (const bad of badPackages) {
      expect(fullManufacturingExportDenial(design, resolved, bad)).toBe(INVALID_MANUFACTURING_SNAPSHOT);
    }
    useWardrobeStore.setState({ design, resolved: { ...resolved, analysis: undefined } });
    await expect(downloadFullManufacturingFile('zip', taskSignal())).rejects.toThrow(INVALID_MANUFACTURING_SNAPSHOT);
    useWardrobeStore.setState({ design, resolved: fixture('blind').resolved });
    await expect(downloadFullManufacturingFile('csv', taskSignal())).rejects.toThrow(INVALID_MANUFACTURING_SNAPSHOT);
    expect(download).not.toHaveBeenCalled();
  });

  it('evaluates the newly active design when an earlier render allowed both formats', async () => {
    const before = fixture('straight');
    expect(fullManufacturingExportDenial(before.design, before.resolved, production(before))).toBeNull();
    const newDesign = { ...fixture('blind').design, id: before.design.id };
    expect(useWardrobeStore.getState().openNamedVersion(newDesign, 'Kör sürüm')).toBe(true);
    for (const format of ['csv', 'zip'] as const) {
      await expect(downloadFullManufacturingFile(format, taskSignal())).rejects.toThrow(/erişim engeli/i);
    }
    expect(download).not.toHaveBeenCalled();
  });

  it('re-solves normal JSON import and ignores stored claims of export eligibility', async () => {
    const json = JSON.stringify({ ...fixture('asymmetric').design, status: 'review',
      accessStatus: 'usable', analysis: { functionalAccess: [] } });
    expect(useWardrobeStore.getState().importJsonString(json)).toEqual({ ok: true });
    expect(useWardrobeStore.getState().design).not.toHaveProperty('accessStatus');
    await expect(downloadFullManufacturingFile('csv', taskSignal())).rejects.toThrow(/erişim engeli/i);
    expect(download).not.toHaveBeenCalled();
  });

  it('keeps previews read-only and uses the named version only when it is active', async () => {
    const preview = previewDesignJson(JSON.stringify(fixture('diagonal').design));
    expect(preview.errors).toEqual([]);
    const id = useVersionArchive.getState().save('Kapak incelemesi', preview.design!, 'json');
    expect(id).toBeTruthy();
    await downloadFullManufacturingFile('csv', taskSignal());
    expect(download.mock.calls[0][0]).toContain('Çalışma kopyası');
    download.mockClear();
    const archived = useVersionArchive.getState().versions[0];
    expect(useWardrobeStore.getState().openNamedVersion(archived.design, archived.name)).toBe(true);
    await expect(downloadFullManufacturingFile('zip', taskSignal())).rejects.toThrow(/erişim engeli/i);
    expect(download).not.toHaveBeenCalled();
  });

  it('cancels a pending ZIP on a same-id design edit, even after returning to the first snapshot', async () => {
    const before = fixture('straight');
    const pending = downloadFullManufacturingFile('zip', taskSignal());
    const result = expect(pending).rejects.toThrow(/tasarım veya sürüm değişti/i);
    useWardrobeStore.setState({ design: { ...before.design, name: 'Yeni tasarım adı' } });
    useWardrobeStore.setState(before);
    await result;
    expect(download).not.toHaveBeenCalled();
  });

  it('cancels a pending ZIP when the active named version changes', async () => {
    const { design } = fixture('straight');
    const id = useVersionArchive.getState().save('İlk sürüm', design)!;
    const pending = downloadFullManufacturingFile('zip', taskSignal());
    const result = expect(pending).rejects.toThrow(/tasarım veya sürüm değişti/i);
    useVersionArchive.getState().rename(id, 'Yeni sürüm adı');
    await result;
    expect(download).not.toHaveBeenCalled();
  });

  it('cancels when the owning panel ends the operation while the ZIP is pending', async () => {
    const controller = new AbortController();
    const pending = downloadFullManufacturingFile('zip', controller.signal);
    const result = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    controller.abort();
    await result;
    expect(download).not.toHaveBeenCalled();
  });

  it('allows a pending ZIP to finish through unrelated selection changes', async () => {
    const pending = downloadFullManufacturingFile('zip', taskSignal());
    useWardrobeStore.setState({ selectedCellId: 'selection-only' });
    await expect(pending).resolves.toMatch(/indirme başlatıldı/);
    expect(download).toHaveBeenCalledTimes(1);
  });
});

describe('Canonical fingerprints', () => {
  const baseline = JSON.parse(
    readFileSync('tests/fixtures/d3-panel-centering-fingerprints.json', 'utf8'),
  ) as { reference: string; models: Record<string, [string, string, string]> };
  it.each([['straight', 69], ['diagonal', 94], ['blind', 81], ['asymmetric', 94]] as const)(
    'preserves %s Design, geometry and production hashes', (kind, parts) => {
      const item = fixture(kind);
      const pkg = production(item);
      expect(baseline.reference).toBe('POST_D3_BASELINE_001');
      const signatures = [item.design, item.resolved, pkg].map(value => createHash('sha256')
        .update(designSignature(value as Design)).digest('hex'));
      expect(signatures).toEqual(baseline.models[kind]);
      expect(pkg.parts).toHaveLength(parts);
    });
});
