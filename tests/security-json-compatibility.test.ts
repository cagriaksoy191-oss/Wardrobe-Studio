import { describe, expect, it } from 'vitest';
import { phase5Example } from '../src/core/presets/phase5Examples';
import { parseDesignJson } from '../src/core/schema/designSchema';
import type { Design } from '../src/core/schema/types';
import { solveDesign } from '../src/core/solver/carcassSolver';
import { previewDesignJson } from '../src/core/versions/designExchange';
import { useWardrobeStore } from '../src/store/useWardrobeStore';
import { parseVersionArchive } from '../src/store/versionArchive';

describe('Design JSON compatibility after the validation dependency upgrade', () => {
  it.each(['straight', 'diagonal', 'blind', 'asymmetric'] as const)(
    'preserves the %s fixture through JSON and the AI preview',
    (kind) => {
      const text = JSON.stringify(phase5Example(kind));
      const serialized = JSON.parse(text) as Design;
      const design = parseDesignJson(text);
      const preview = previewDesignJson(text);

      expect(design).toStrictEqual(serialized);
      expect(preview.design).toStrictEqual(design);
      expect(preview.resolved).toEqual(solveDesign(serialized));
    },
  );

  it('preserves schema v1 defaults and the legacy construction mode in the archive', () => {
    const legacy: Partial<Design> = phase5Example('straight');
    delete legacy.schemaVersion;
    delete legacy.fronts;
    delete legacy.junctions;
    delete legacy.materials;
    delete legacy.runs?.[0].constructionMode;

    const normalized = parseDesignJson(JSON.stringify(legacy));
    expect(normalized.schemaVersion).toBe(1);
    expect(normalized.fronts).toEqual([]);
    expect(normalized.junctions).toEqual([]);
    expect(normalized.materials).toEqual({ carcassMaterialId: 'warmOak', frontMaterialId: 'linenBeige' });
    expect(normalized.runs[0].constructionMode).toBeUndefined();

    const date = '2026-11-04T12:00:00.000Z';
    const archive = parseVersionArchive({
      schemaVersion: 1,
      versions: [{
        id: 'legacy-test', name: 'QA', createdAt: date, updatedAt: date,
        archived: false, source: 'manual', design: legacy,
      }],
    });
    expect(archive).toHaveLength(1);
    expect(archive[0].design).toStrictEqual(normalized);
  });

  it('reports the invalid nested field in the AI preview and leaves the active design intact', () => {
    const design = phase5Example('straight');
    const run = design.runs[0];
    const text = JSON.stringify({
      ...design,
      runs: [{ ...run, bays: [{ ...run.bays[0], label: 123 }, ...run.bays.slice(1)] }],
    });
    const before = useWardrobeStore.getState().design;
    const result = useWardrobeStore.getState().importJsonString(text);
    const preview = previewDesignJson(text);

    expect(result.ok).toBe(false);
    expect(preview.errors).toEqual([expect.stringMatching(/^runs\.0\.bays\.0\.label:/)]);
    expect(preview.design).toBeUndefined();
    expect(useWardrobeStore.getState().design).toBe(before);
  });

  it.each([
    ['UTF-8 byte', () => JSON.stringify('ğ'.repeat(1_000_000)), 'JSON en fazla 2 MB olabilir.'],
    ['node', () => JSON.stringify(Array.from({ length: 30_000 }, () => null)), 'JSON çok büyük veya çok derin.'],
    ['depth', () => '['.repeat(71) + 'null' + ']'.repeat(71), 'JSON çok büyük veya çok derin.'],
  ] as const)('enforces the %s limit in both JSON entry points', (_limit, input, message) => {
    const text = input();
    const before = useWardrobeStore.getState().design;
    const result = useWardrobeStore.getState().importJsonString(text);
    const preview = previewDesignJson(text);

    expect(result).toMatchObject({ ok: false, error: expect.stringContaining(message) });
    expect(preview.errors).toEqual([expect.stringContaining(message)]);
    expect(preview.design).toBeUndefined();
    expect(useWardrobeStore.getState().design).toBe(before);
  });
});
