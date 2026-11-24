import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { phase5Example } from '../src/core/presets/phase5Examples';
import { createBlankDesign, SAMPLE_DESIGNS } from '../src/core/presets/sampleDesigns';
import { extractProduction, MATERIAL_NAMES } from '../src/core/production/productionModel';
import { solveDesign } from '../src/core/solver/carcassSolver';
import { validationConfig } from '../src/core/solver/validationConfig';
import { designDimensions, designSignature, previewDesignJson } from '../src/core/versions/designExchange';
import { useWardrobeStore, type StudioStep } from '../src/store/useWardrobeStore';

const db = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn() }));
vi.mock('idb-keyval', () => db);

const LOCAL_KEY = 'wardrobe-studio:session-sync:v2';

describe('Phase 2B WS-5 — Persistence, Validation, Versions & Manufacturing UX', () => {
  let stored: Map<string, string>;

  beforeEach(() => {
    vi.unstubAllGlobals();
    db.get.mockReset().mockResolvedValue(undefined);
    db.set.mockReset().mockResolvedValue(undefined);
    stored = new Map();
    vi.stubGlobal('indexedDB', {});
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => stored.get(key) ?? null,
      setItem: (key: string, value: string) => {
        stored.set(key, value);
      },
    });
    useWardrobeStore.getState().loadPreset('straight-wardrobe');
    useWardrobeStore.setState({ recoveryJson: null });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('Contract 1 — 4-Step StudioStep enum & selection cleanup', () => {
    it('supports versions-production step and clears active selection/editor state', () => {
      const step: StudioStep = 'versions-production';
      const s = useWardrobeStore.getState();
      s.setDoorEditorMode(true);
      expect(useWardrobeStore.getState().doorEditorMode).toBe(true);
      useWardrobeStore.getState().setActiveStep(step);
      expect(useWardrobeStore.getState().activeStep).toBe('versions-production');
      expect(useWardrobeStore.getState().doorEditorMode).toBe(false);
      expect(useWardrobeStore.getState().selectedCellId).toBeNull();
      expect(useWardrobeStore.getState().selectedDoorId).toBeNull();
    });
  });

  describe('PE-01 — saveCheckpoint() preserves Undo/Redo + smart revertToCheckpoint() (10 scenarios)', () => {
    it('1-3. Save after edits preserves historyPast, Undo marks unsaved, Redo returns to clean checkpoint', () => {
      const s = useWardrobeStore.getState();
      s.updateRoomHeight('roomHeightMm', 2650);
      s.updateRoomHeight('roomHeightMm', 2700);
      expect(useWardrobeStore.getState().historyPast).toHaveLength(2);
      expect(useWardrobeStore.getState().hasUnsavedChanges).toBe(true);

      // 1. Save after edits
      useWardrobeStore.getState().saveCheckpoint();
      expect(useWardrobeStore.getState().hasUnsavedChanges).toBe(false);
      expect(useWardrobeStore.getState().historyPast).toHaveLength(2);
      expect(useWardrobeStore.getState().historyFuture).toHaveLength(0);

      // 2. Undo after save
      useWardrobeStore.getState().undo();
      expect(useWardrobeStore.getState().design.roomHeightMm).toBe(2650);
      expect(useWardrobeStore.getState().hasUnsavedChanges).toBe(true);
      expect(useWardrobeStore.getState().historyPast).toHaveLength(1);
      expect(useWardrobeStore.getState().historyFuture).toHaveLength(1);

      // 3. Redo back to checkpoint
      useWardrobeStore.getState().redo();
      expect(useWardrobeStore.getState().design.roomHeightMm).toBe(2700);
      expect(useWardrobeStore.getState().hasUnsavedChanges).toBe(false);
    });

    it('4. Save while Redo branch exists preserves both historyPast and historyFuture', () => {
      const s = useWardrobeStore.getState();
      s.updateRoomHeight('roomHeightMm', 2650);
      s.updateRoomHeight('roomHeightMm', 2700);
      useWardrobeStore.getState().undo(); // now at 2650, past=1, future=1

      useWardrobeStore.getState().saveCheckpoint();
      expect(useWardrobeStore.getState().hasUnsavedChanges).toBe(false);
      expect(useWardrobeStore.getState().historyPast).toHaveLength(1);
      expect(useWardrobeStore.getState().historyFuture).toHaveLength(1);

      useWardrobeStore.getState().redo();
      expect(useWardrobeStore.getState().design.roomHeightMm).toBe(2700);
      expect(useWardrobeStore.getState().hasUnsavedChanges).toBe(true);
    });

    it('5. revertToCheckpoint from AFTER checkpoint preserves earlier Undo history and creates Redo branch', () => {
      const s = useWardrobeStore.getState();
      s.updateRoomHeight('roomHeightMm', 2620); // step 1
      s.updateRoomHeight('roomHeightMm', 2660); // step 2 -> checkpoint here
      useWardrobeStore.getState().saveCheckpoint();
      s.updateRoomHeight('roomHeightMm', 2710); // step 3
      s.updateRoomHeight('roomHeightMm', 2760); // step 4

      expect(useWardrobeStore.getState().historyPast).toHaveLength(4);
      useWardrobeStore.getState().revertToCheckpoint();

      expect(useWardrobeStore.getState().design.roomHeightMm).toBe(2660);
      expect(useWardrobeStore.getState().hasUnsavedChanges).toBe(false);
      // Earlier 2 Undo steps BEFORE checkpoint remain intact!
      expect(useWardrobeStore.getState().historyPast).toHaveLength(2);
      // Reverted 2 edits are on Redo branch!
      expect(useWardrobeStore.getState().historyFuture).toHaveLength(2);

      useWardrobeStore.getState().undo();
      expect(useWardrobeStore.getState().design.roomHeightMm).toBe(2620);
      expect(useWardrobeStore.getState().hasUnsavedChanges).toBe(true);
    });

    it('6. revertToCheckpoint from BEFORE checkpoint (checkpoint in historyFuture) steps forward cleanly', () => {
      const s = useWardrobeStore.getState();
      s.updateRoomHeight('roomHeightMm', 2620); // step 1
      s.updateRoomHeight('roomHeightMm', 2660); // step 2 -> checkpoint here
      useWardrobeStore.getState().saveCheckpoint();
      s.updateRoomHeight('roomHeightMm', 2710); // step 3

      // Undo twice -> now at 2620, checkpoint (2660) is in historyFuture[0] and 2710 is in historyFuture[1]
      useWardrobeStore.getState().undoSteps(2);
      expect(useWardrobeStore.getState().design.roomHeightMm).toBe(2620);
      expect(useWardrobeStore.getState().hasUnsavedChanges).toBe(true);

      useWardrobeStore.getState().revertToCheckpoint();
      expect(useWardrobeStore.getState().design.roomHeightMm).toBe(2660);
      expect(useWardrobeStore.getState().hasUnsavedChanges).toBe(false);
      expect(useWardrobeStore.getState().historyPast).toHaveLength(2);
      expect(useWardrobeStore.getState().historyFuture).toHaveLength(1);
    });

    it('7. Save + F5 hydration restores checkpoint, workingDesign, and preserved Undo/Redo stacks', async () => {
      const s = useWardrobeStore.getState();
      s.updateRoomHeight('roomHeightMm', 2640);
      s.updateRoomHeight('roomHeightMm', 2680);
      useWardrobeStore.getState().undo();
      useWardrobeStore.getState().saveCheckpoint();

      const persisted = JSON.parse(stored.get(LOCAL_KEY)!);
      expect(persisted.historyPast).toHaveLength(1);
      expect(persisted.historyFuture).toHaveLength(1);

      // Simulate reload into a fresh session state, then hydrate
      useWardrobeStore.setState({ historyPast: [], historyFuture: [], hasUnsavedChanges: true });
      await useWardrobeStore.getState().hydrateFromIndexedDB();
      expect(useWardrobeStore.getState().design.roomHeightMm).toBe(2640);
      expect(useWardrobeStore.getState().hasUnsavedChanges).toBe(false);
      expect(useWardrobeStore.getState().historyPast).toHaveLength(1);
      expect(useWardrobeStore.getState().historyFuture).toHaveLength(1);
    });

    it('8. Save + openNamedVersion preserves checkpoint and Undo path back to saved work', () => {
      const s = useWardrobeStore.getState();
      s.updateRoomHeight('roomHeightMm', 2690);
      useWardrobeStore.getState().saveCheckpoint();
      const savedSig = designSignature(useWardrobeStore.getState().design);

      expect(useWardrobeStore.getState().openNamedVersion(phase5Example('straight'), 'Örnek A')).toBe(true);
      expect(useWardrobeStore.getState().hasUnsavedChanges).toBe(true);
      expect(useWardrobeStore.getState().historyPast.length).toBeGreaterThanOrEqual(2);

      useWardrobeStore.getState().undo();
      expect(designSignature(useWardrobeStore.getState().design)).toBe(savedSig);
      expect(useWardrobeStore.getState().hasUnsavedChanges).toBe(false);
    });

    it('9. startBlankDesign after save keeps Undo path and marks unsaved', () => {
      const s = useWardrobeStore.getState();
      s.updateRoomHeight('roomHeightMm', 2670);
      useWardrobeStore.getState().saveCheckpoint();
      const savedSig = designSignature(useWardrobeStore.getState().design);

      useWardrobeStore.getState().startBlankDesign({ layoutKind: 'straight', lengthAMm: 2800 });
      expect(useWardrobeStore.getState().hasUnsavedChanges).toBe(true);
      useWardrobeStore.getState().undo();
      expect(designSignature(useWardrobeStore.getState().design)).toBe(savedSig);
      expect(useWardrobeStore.getState().hasUnsavedChanges).toBe(false);
    });

    it('10. Loading older compatible JSON after save preserves Undo history and checkpoint', () => {
      const s = useWardrobeStore.getState();
      s.updateRoomHeight('roomHeightMm', 2680);
      useWardrobeStore.getState().saveCheckpoint();
      const savedSig = designSignature(useWardrobeStore.getState().design);

      const legacy: Record<string, unknown> = structuredClone(phase5Example('straight')) as unknown as Record<string, unknown>;
      delete legacy.schemaVersion;
      delete legacy.fronts;
      const res = useWardrobeStore.getState().importJsonString(JSON.stringify(legacy));
      expect(res.ok).toBe(true);
      expect(useWardrobeStore.getState().hasUnsavedChanges).toBe(true);
      expect(useWardrobeStore.getState().historyPast.length).toBeGreaterThanOrEqual(2);

      useWardrobeStore.getState().undo();
      expect(designSignature(useWardrobeStore.getState().design)).toBe(savedSig);
      expect(useWardrobeStore.getState().hasUnsavedChanges).toBe(false);
    });
  });

  describe('IA-02 — Clean first-use starter preset & untouched SAMPLE_DESIGNS', () => {
    it('boots with straight-wardrobe (0 critical errors, 0 access blocks) and preserves all 3 presets', () => {
      const storeSource = readFileSync('src/store/useWardrobeStore.ts', 'utf8');
      expect(storeSource).toContain("SAMPLE_DESIGNS['straight-wardrobe']");
      expect(Object.keys(SAMPLE_DESIGNS)).toEqual([
        'l-diagonal-asymmetric',
        'l-blind-corner',
        'straight-wardrobe',
      ]);

      const starter = solveDesign(SAMPLE_DESIGNS['straight-wardrobe']);
      const pkg = extractProduction(SAMPLE_DESIGNS['straight-wardrobe'], starter);
      expect(pkg.issues.filter(i => i.severity === 'error')).toEqual([]);
      expect(pkg.accessStatus).not.toBe('blocked');
    });
  });

  describe('IA-09 — Clean default blank wardrobes with zero SHELF_SPAN_EXCEEDED warnings', () => {
    it.each([
      ['default straight 2800', { layoutKind: 'straight' as const, lengthAMm: 2800 }],
      ['default straight omitted length', { layoutKind: 'straight' as const }],
      ['L-shape diagonal 2800x2200', { layoutKind: 'l-shape' as const, cornerType: 'diagonal' as const, lengthAMm: 2800, lengthBMm: 2200 }],
      ['L-shape blind 2800x2200', { layoutKind: 'l-shape' as const, cornerType: 'blind' as const, lengthAMm: 2800, lengthBMm: 2200 }],
      ['L-shape large 3600x2800', { layoutKind: 'l-shape' as const, cornerType: 'diagonal' as const, lengthAMm: 3600, lengthBMm: 2800 }],
    ])('%s produces 0 shelf-span warnings, 0 errors, and all bays >= 300 mm via startBlankDesign', (_label, opts) => {
      useWardrobeStore.getState().startBlankDesign(opts);
      const resolved = useWardrobeStore.getState().resolved;
      expect(resolved.issues.filter(i => i.severity === 'error')).toEqual([]);
      expect(resolved.issues.filter(i => i.code === 'SHELF_SPAN_EXCEEDED')).toEqual([]);
      expect(resolved.bays.every(b => b.outerWidthMm >= 300)).toBe(true);
      expect(resolved.bays.every(b => b.netInnerWidthMm <= validationConfig.shelfSpanWarningMm)).toBe(true);
    });

    it('gracefully handles minimum 1200x1200 L-shape diagonal without allocation error', () => {
      const design = createBlankDesign({ layoutKind: 'l-shape', cornerType: 'diagonal', lengthAMm: 1200, lengthBMm: 1200, autoFitBayCount: true });
      const resolved = solveDesign(design);
      expect(resolved.issues.filter(i => i.code === 'DIMENSION_ALLOCATION_INVALID')).toEqual([]);
    });
  });

  describe('PE-02 — Localized Turkish External AI JSON errors with preserved path prefixes', () => {
    it('rejects markdown code fences with clear Turkish guidance instead of stripping', () => {
      const res = previewDesignJson('```json\n{"id":"x"}\n```');
      expect(res.design).toBeUndefined();
      expect(res.errors[0]).toContain('Markdown kod bloğu');
      expect(res.errors[0]).not.toMatch(/Unexpected token/i);
    });

    it('localizes JS SyntaxError to clear Turkish', () => {
      const res = previewDesignJson('{ "id": "broken", }');
      expect(res.design).toBeUndefined();
      expect(res.errors[0]).toContain('JSON sözdizimi geçersiz');
      expect(res.errors[0]).not.toMatch(/Unexpected token|Expected property/i);
    });

    it('localizes Zod v4 schema errors to Turkish while strictly preserving <field.path>: prefix', () => {
      const wrongSchema = previewDesignJson(JSON.stringify({ schemaVersion: 2 }));
      expect(wrongSchema.errors.length).toBeGreaterThan(0);
      expect(wrongSchema.errors.some(e => /^schemaVersion:/.test(e))).toBe(true);
      expect(wrongSchema.errors.join('\n')).not.toMatch(/Invalid input|Too small|Expected string|received undefined/i);

      const d = phase5Example('straight');
      d.runs[0].panelThicknessMm = -1;
      const small = previewDesignJson(JSON.stringify(d));
      expect(small.errors[0]).toMatch(/^runs\.0\.panelThicknessMm:/);
      expect(small.errors[0]).toContain('0 değerinden büyük');
      expect(small.errors[0]).not.toMatch(/Too small/i);

      const badLabel = structuredClone(phase5Example('straight')) as unknown as Record<string, unknown>;
      (badLabel.runs as Array<{ bays: Array<Record<string, unknown>> }>)[0].bays[0].label = 123;
      const typeErr = previewDesignJson(JSON.stringify(badLabel));
      expect(typeErr.errors).toEqual([expect.stringMatching(/^runs\.0\.bays\.0\.label:/)]);
      expect(typeErr.errors[0]).toContain('metin');
    });
  });

  describe('PE-06 & PE-09 — VersionPanel & designDimensions contracts', () => {
    it('includes roomHeightMm and localized material names in designDimensions', () => {
      const d = phase5Example('straight');
      const dims = designDimensions(d);
      expect(dims.roomHeightMm).toBe(d.roomHeightMm);
      expect(dims.carcassMaterial).toBe(MATERIAL_NAMES[d.materials.carcassMaterialId]);
      expect(dims.frontMaterial).toBe(MATERIAL_NAMES[d.materials.frontMaterialId]);
    });

    it('enforces inline rename separation, blank validation, A/B roomHeight & materials, and zero slate-500 in VersionPanel', () => {
      const src = readFileSync('src/ui/VersionPanel.tsx', 'utf8');
      expect(src).not.toContain('text-slate-500');
      expect(src).toContain('Sürüm adı boş bırakılamaz.');
      expect(src).toContain('Seçili sürümün yeni adı');
      expect(src).toContain('Oda tavan yüksekliği (mm)');
      expect(src).toContain('Gövde malzemesi');
      expect(src).toContain('Kapak malzemesi');
      expect(src).toContain('Henüz kayıtlı sürüm yok');
      expect(src).toContain("const WORKING_SLOT_ID = '__working__'");
    });
  });

  describe('PE-07 & PE-08 — ProductionPanel search, grouping, labels & WS-UX-017 preservation', () => {
    it('preserves WS-UX-017 Escape handler, adds search auto-jump/empty state, active sheet SVG label, blocked grouping & prompt status', () => {
      const src = readFileSync('src/ui/ProductionPanel.tsx', 'utf8');
      expect(src).not.toContain('text-slate-500');
      // WS-UX-017 Escape preservation
      expect(src).toContain("event.key !== 'Escape' || event.nativeEvent.isComposing");
      // PE-07 search auto-jump, label spacing, empty state & empty-search SVG disable
      expect(src).toContain('matches.length} / {sheets.length} pafta');
      expect(src).toContain('Eşleşen pafta bulunamadı');
      expect(src).toContain('Aramayı temizle');
      expect(src).toContain('flex min-w-32 flex-1 flex-col gap-1.5');
      expect(src).toContain('const svgDisabled = busy || blocked || (show && hasNoSearchMatches);');
      // PE-08 active SVG ID, .html format, blocked grouping, prompt confirmation
      expect(src).toContain('Bu paftayı SVG indir ({sheet.id})');
      expect(src).toContain('Yazdırılabilir rapor (.html)');
      expect(src).toContain('Tanısal İnceleme Çıktıları (Açık)');
      expect(src).toContain('Üretim Kesim Paketi (Erişim Engeli Nedeniyle Kilitli)');
      expect(src).toContain('Görselleştirme promptu hazırlandı ve panoya kopyalandı.');
    });
  });

  describe('CAD-09 — AccessReview human-readable part labels and conditional open-access legend', () => {
    it('maps removed part codes to readable Turkish labels and guards sweep caption on solids.length', () => {
      const src = readFileSync('src/ui/AccessReview.tsx', 'utf8');
      expect(src).toContain('extractProduction(design, model)');
      expect(src).toContain('solids.length > 0');
      expect(src).toContain('Kapaksız açık erişim — bu görünümde kapak veya hareket zarfı bulunmaz.');

      // Verify extractProduction actually resolves a human-readable label for diagonal corner door code
      const d = phase5Example('diagonal');
      const m = solveDesign(d);
      const pkg = extractProduction(d, m);
      const part = pkg.parts.find(p => p.code === 'P-70570E4D');
      expect(part?.label).toBeTruthy();
      expect(part?.label).not.toBe('P-70570E4D');
    });
  });
});
