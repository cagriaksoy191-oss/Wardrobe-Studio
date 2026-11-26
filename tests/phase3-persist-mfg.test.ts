import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MotionSimulator } from '../src/core/analysis/motionSimulator';
import { phase5Example } from '../src/core/presets/phase5Examples';
import { normalizeAndValidateDesign } from '../src/core/schema/designSchema';
import { solveDesign } from '../src/core/solver/carcassSolver';
import { downloadFullManufacturingFile, downloadProductionDocument, manufacturingVersion } from '../src/export/manufacturingDownload';
import { localPdfFont } from '../src/export/pdfWriter';
import { useVersionArchive } from '../src/store/versionArchive';
import { useWardrobeStore } from '../src/store/useWardrobeStore';
import {
  flushNumberFieldDraft,
  WARDROBE_FLUSH_DRAFTS_EVENT,
  type FlushDraftsEventDetail,
} from '../src/ui/NumberField';

const { download } = vi.hoisted(() => ({ download: vi.fn() }));
vi.mock('../src/export/download', async importOriginal => ({
  ...await importOriginal<typeof import('../src/export/download')>(),
  downloadFile: download,
}));

const db = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn() }));
vi.mock('idb-keyval', () => db);

const fontBytes = readFileSync('public/fonts/NotoSans-Regular.ttf');

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function makeFontResponse(): Response {
  return {
    ok: true,
    arrayBuffer: async () => fontBytes.buffer.slice(fontBytes.byteOffset, fontBytes.byteOffset + fontBytes.byteLength),
  } as unknown as Response;
}

describe('Phase 3 — Persistence, Store Integrity, Motion Recovery & Manufacturing Safety', () => {
  let stored: Map<string, string>;

  beforeEach(() => {
    vi.unstubAllGlobals();
    download.mockReset();
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
    useVersionArchive.setState({ versions: [], error: null, status: 'idle', recoveryDocuments: [] });
    useWardrobeStore.getState().loadPreset('straight-wardrobe');
    useWardrobeStore.setState({ recoveryJson: null, commandError: null });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('PM-01 — MS-EXPORT-001 stale-export parity for PDF & printable HTML', () => {
    it('passes AbortSignal to fetch inside localPdfFont and aborts cleanly', async () => {
      let receivedSignal: AbortSignal | undefined;
      vi.stubGlobal('fetch', vi.fn((_url: string, init?: RequestInit) => {
        receivedSignal = init?.signal ?? undefined;
        return new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(Object.assign(new Error('Aborted'), { name: 'AbortError' }));
          });
        });
      }));
      const controller = new AbortController();
      const pending = localPdfFont(controller.signal);
      controller.abort();
      await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
      expect(receivedSignal).toBe(controller.signal);
    });

    it('cancels a pending PDF download when the design switches mid-font-fetch (straight -> blocked diagonal)', async () => {
      const straight = normalizeAndValidateDesign(phase5Example('straight'));
      const diagonal = normalizeAndValidateDesign(phase5Example('diagonal'));
      useWardrobeStore.setState({ design: straight, resolved: solveDesign(straight) });

      const gate = deferred<Response>();
      vi.stubGlobal('fetch', vi.fn(() => gate.promise));

      const pending = downloadProductionDocument('pdf', new AbortController().signal);
      // Wait a tick for dynamic import & fetch to start
      await Promise.resolve();
      await Promise.resolve();

      useWardrobeStore.setState({ design: diagonal, resolved: solveDesign(diagonal) });
      gate.resolve(makeFontResponse());

      await expect(pending).rejects.toThrow(/tasarım veya sürüm değişti/i);
      expect(download).not.toHaveBeenCalled();
    });

    it('cancels a pending printable HTML download when AbortController aborts on unmount/hide', async () => {
      const straight = normalizeAndValidateDesign(phase5Example('straight'));
      useWardrobeStore.setState({ design: straight, resolved: solveDesign(straight) });

      vi.stubGlobal('fetch', vi.fn((_url: string, init?: RequestInit) => new Promise((_res, rej) => {
        init?.signal?.addEventListener('abort', () => {
          rej(Object.assign(new Error('Aborted'), { name: 'AbortError' }));
        });
      })));

      const controller = new AbortController();
      const pending = downloadProductionDocument('printable', controller.signal);
      await Promise.resolve();
      await Promise.resolve();
      controller.abort();

      await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
      expect(download).not.toHaveBeenCalled();
    });

    it('cancels a pending PDF download when active named version changes mid-fetch', async () => {
      const straight = normalizeAndValidateDesign(phase5Example('straight'));
      useWardrobeStore.setState({ design: straight, resolved: solveDesign(straight) });
      const versionId = useVersionArchive.getState().save('İlk Sürüm', straight)!;

      const gate = deferred<Response>();
      vi.stubGlobal('fetch', vi.fn(() => gate.promise));

      const pending = downloadProductionDocument('pdf', new AbortController().signal);
      await Promise.resolve();
      await Promise.resolve();

      useVersionArchive.getState().rename(versionId, 'Güncel Sürüm');
      gate.resolve(makeFontResponse());

      await expect(pending).rejects.toThrow(/tasarım veya sürüm değişti/i);
      expect(download).not.toHaveBeenCalled();
    });

    it('downloads real PDF and printable HTML when snapshot remains fresh through selection-only changes', async () => {
      const straight = normalizeAndValidateDesign(phase5Example('straight'));
      useWardrobeStore.setState({ design: straight, resolved: solveDesign(straight) });
      vi.stubGlobal('fetch', vi.fn(async () => makeFontResponse()));

      const pdfPromise = downloadProductionDocument('pdf', new AbortController().signal);
      useWardrobeStore.setState({ selectedCellId: 'selection-only' });
      await expect(pdfPromise).resolves.toMatch(/teknik PDF için indirme başlatıldı/);
      expect(download).toHaveBeenCalledTimes(1);
      expect(download.mock.calls[0][0]).toMatch(/-uretim\.pdf$/);

      const htmlPromise = downloadProductionDocument('printable', new AbortController().signal);
      await expect(htmlPromise).resolves.toMatch(/Yazdırılabilir rapor/);
      expect(download).toHaveBeenCalledTimes(2);
      expect(download.mock.calls[1][0]).toMatch(/-yazdir\.html$/);
    });

    it('permanently invalidates pending PDF and printable HTML downloads after transient A -> B -> A return', async () => {
      const straight = normalizeAndValidateDesign(phase5Example('straight'));
      const straightResolved = solveDesign(straight);
      const diagonal = normalizeAndValidateDesign(phase5Example('diagonal'));
      const diagonalResolved = solveDesign(diagonal);

      for (const format of ['pdf', 'printable'] as const) {
        download.mockReset();
        useWardrobeStore.setState({ design: straight, resolved: straightResolved, activeVersionId: null });
        const gate = deferred<Response>();
        vi.stubGlobal('fetch', vi.fn(() => gate.promise));

        const pending = downloadProductionDocument(format, new AbortController().signal);
        await Promise.resolve();
        await Promise.resolve();

        // Transient switch A -> B -> exact original A reference before fetch settles
        useWardrobeStore.setState({ design: diagonal, resolved: diagonalResolved });
        useWardrobeStore.setState({ design: straight, resolved: straightResolved });
        expect(useWardrobeStore.getState().design).toBe(straight);
        expect(useWardrobeStore.getState().resolved).toBe(straightResolved);

        gate.resolve(makeFontResponse());
        await expect(pending).rejects.toThrow(/tasarım veya sürüm değişti/i);
        expect(download).not.toHaveBeenCalled();
      }
    });

    it('invalidates a pending PDF download when activeVersionId switches between duplicate-signature versions mid-fetch', async () => {
      const straight = normalizeAndValidateDesign(phase5Example('straight'));
      useWardrobeStore.setState({ design: straight, resolved: solveDesign(straight), activeVersionId: null });
      const v1Id = useVersionArchive.getState().save('V1 — İlk', straight)!;
      const v2Id = useVersionArchive.getState().save('V2 — Onay', straight)!;
      useWardrobeStore.getState().setActiveVersionId(v1Id);

      const gate = deferred<Response>();
      vi.stubGlobal('fetch', vi.fn(() => gate.promise));

      const pending = downloadProductionDocument('pdf', new AbortController().signal);
      await Promise.resolve();
      await Promise.resolve();

      useWardrobeStore.getState().setActiveVersionId(v2Id);
      gate.resolve(makeFontResponse());

      await expect(pending).rejects.toThrow(/tasarım veya sürüm değişti/i);
      expect(download).not.toHaveBeenCalled();
    });
  });

  describe('PM-14b — Duplicate-signature version identity & export filename fidelity', () => {
    it('resolves non-archived V2 over archived V1 with identical signature and stamps V2 on export filenames', async () => {
      const straight = normalizeAndValidateDesign(phase5Example('straight'));
      useWardrobeStore.setState({ design: straight, resolved: solveDesign(straight), activeVersionId: null });
      vi.stubGlobal('fetch', vi.fn(async () => makeFontResponse()));

      const v1Id = useVersionArchive.getState().save('V1 — İlk', straight)!;
      useVersionArchive.getState().setArchived(v1Id, true);
      const v2Id = useVersionArchive.getState().save('V2 — Müşteri Onayı', straight)!;

      // Even before explicit open, manufacturingVersion prefers non-archived V2 over archived V1
      expect(manufacturingVersion(straight, useVersionArchive.getState().versions, null)?.id).toBe(v2Id);

      // Opening V2 sets activeVersionId to V2 even when active design already matches V2's signature
      const opened = useWardrobeStore.getState().openNamedVersion(straight, 'V2 — Müşteri Onayı', v2Id);
      expect(opened).toBe(true);
      expect(useWardrobeStore.getState().activeVersionId).toBe(v2Id);
      expect(
        manufacturingVersion(
          useWardrobeStore.getState().design,
          useVersionArchive.getState().versions,
          useWardrobeStore.getState().activeVersionId
        )?.name
      ).toBe('V2 — Müşteri Onayı');

      // CSV & PDF exports stamp V2 (never archived V1)
      await downloadFullManufacturingFile('csv', new AbortController().signal);
      expect(download).toHaveBeenCalledTimes(1);
      expect(download.mock.calls[0][0]).toContain('V2');
      expect(download.mock.calls[0][0]).not.toContain('V1');

      await downloadProductionDocument('pdf', new AbortController().signal);
      expect(download).toHaveBeenCalledTimes(2);
      expect(download.mock.calls[1][0]).toContain('V2');
      expect(download.mock.calls[1][0]).not.toContain('V1');

      // Two non-archived duplicates disambiguate cleanly via activeVersionId
      useVersionArchive.getState().setArchived(v1Id, false);
      expect(manufacturingVersion(straight, useVersionArchive.getState().versions, v2Id)?.id).toBe(v2Id);
      expect(manufacturingVersion(straight, useVersionArchive.getState().versions, v1Id)?.id).toBe(v1Id);

      // Mutating the design clears activeVersionId
      useWardrobeStore.getState().updateRunDimension('run-A', 'lengthMm', 3100);
      expect(useWardrobeStore.getState().activeVersionId).toBeNull();

      // Time travel & design-replacing operations clear activeVersionId as well
      useWardrobeStore.getState().setActiveVersionId(v2Id);
      useWardrobeStore.getState().undoSteps(1);
      expect(useWardrobeStore.getState().activeVersionId).toBeNull();

      useWardrobeStore.getState().setActiveVersionId(v2Id);
      useWardrobeStore.getState().redo();
      expect(useWardrobeStore.getState().activeVersionId).toBeNull();

      useWardrobeStore.getState().setActiveVersionId(v2Id);
      useWardrobeStore.getState().revertToCheckpoint();
      expect(useWardrobeStore.getState().activeVersionId).toBeNull();

      useWardrobeStore.getState().setActiveVersionId(v2Id);
      useWardrobeStore.getState().loadPreset('straight-wardrobe');
      expect(useWardrobeStore.getState().activeVersionId).toBeNull();

      useWardrobeStore.getState().setActiveVersionId(v2Id);
      useWardrobeStore.getState().startBlankDesign({ layoutKind: 'straight', lengthAMm: 2600 });
      expect(useWardrobeStore.getState().activeVersionId).toBeNull();

      useWardrobeStore.getState().setActiveVersionId(v2Id);
      expect(useWardrobeStore.getState().importJsonString(JSON.stringify(straight)).ok).toBe(true);
      expect(useWardrobeStore.getState().activeVersionId).toBeNull();
    });
  });

  describe('PM-02 — Behavioral wardrobe:flush-drafts integration with store & checkpoint', () => {
    it('commits valid focused draft before saveCheckpoint and aborts save on invalid draft without touching prior checkpoint', () => {
      const bus = new EventTarget();
      const focusMock = vi.fn();
      const fakeInput = { focus: focusMock } as unknown as HTMLInputElement;
      let draftText = '3350';
      let badInput = false;

      // Mirror NumberField's wardrobe:flush-drafts handler wired to updateRunDimension
      bus.addEventListener(WARDROBE_FLUSH_DRAFTS_EVENT, (event) => {
        const detail = (event as CustomEvent<FlushDraftsEventDetail>).detail;
        const currentLength = useWardrobeStore.getState().design.runs[0].lengthMm;
        const result = flushNumberFieldDraft(draftText, badInput, currentLength, 600, 6000, detail, fakeInput);
        if (result.action === 'commit' && result.committedValue !== undefined) {
          useWardrobeStore.getState().updateRunDimension('run-A', 'lengthMm', result.committedValue);
        }
      });

      // Mirror App's handleSaveCheckpoint coordinator
      const triggerSaveCheckpoint = () => {
        const detail: FlushDraftsEventDetail = { hadInvalid: false, firstInvalidEl: null };
        bus.dispatchEvent(new CustomEvent(WARDROBE_FLUSH_DRAFTS_EVENT, { detail }));
        if (detail.hadInvalid) {
          detail.firstInvalidEl?.focus();
          return { saved: false, detail };
        }
        useWardrobeStore.getState().saveCheckpoint();
        return { saved: true, detail };
      };

      // 1) Valid draft commits to store and updates checkpoint cleanly
      const validOutcome = triggerSaveCheckpoint();
      expect(validOutcome.saved).toBe(true);
      expect(validOutcome.detail.hadInvalid).toBe(false);
      expect(useWardrobeStore.getState().design.runs[0].lengthMm).toBe(3350);
      expect(useWardrobeStore.getState().checkpointDesign.runs[0].lengthMm).toBe(3350);
      expect(useWardrobeStore.getState().hasUnsavedChanges).toBe(false);
      expect(focusMock).not.toHaveBeenCalled();

      const historyLenAfterValid = useWardrobeStore.getState().historyPast.length;

      // 2) Out-of-range invalid draft aborts save, focuses invalid input, and preserves prior checkpoint
      draftText = '99999';
      badInput = false;
      const invalidOutcome = triggerSaveCheckpoint();
      expect(invalidOutcome.saved).toBe(false);
      expect(invalidOutcome.detail.hadInvalid).toBe(true);
      expect(invalidOutcome.detail.firstInvalidEl).toBe(fakeInput);
      expect(focusMock).toHaveBeenCalledTimes(1);
      expect(useWardrobeStore.getState().design.runs[0].lengthMm).toBe(3350);
      expect(useWardrobeStore.getState().checkpointDesign.runs[0].lengthMm).toBe(3350);
      expect(useWardrobeStore.getState().historyPast).toHaveLength(historyLenAfterValid);

      // 3) Empty/badInput draft also aborts save and leaves checkpoint intact
      draftText = '';
      badInput = true;
      const badInputOutcome = triggerSaveCheckpoint();
      expect(badInputOutcome.saved).toBe(false);
      expect(badInputOutcome.detail.hadInvalid).toBe(true);
      expect(focusMock).toHaveBeenCalledTimes(2);
      expect(useWardrobeStore.getState().checkpointDesign.runs[0].lengthMm).toBe(3350);
    });
  });

  describe('CF-02, CF-08, CF-13 & PM-05 — Store selection, selectedFrontId & doorEditorMode integrity', () => {
    it('supports selectedFrontId contract: preserves on same-bay selectDoor(null), clears on bay change or explicit door select', () => {
      const s = useWardrobeStore.getState();
      const bay1 = s.design.runs[0].bays[0].id;
      const bay2 = s.design.runs[0].bays[1].id;
      const door1 = s.resolved.doors.find(d => d.bayId === bay1)!.id;

      s.selectBay(bay1);
      s.setSelectedFrontId('front-test-1');
      expect(useWardrobeStore.getState().selectedFrontId).toBe('front-test-1');

      // Same-bay selectDoor(null, bay1) preserves selectedFrontId (needed for Açık split range in DoorInspectorPanel)
      useWardrobeStore.getState().selectDoor(null, bay1);
      expect(useWardrobeStore.getState().selectedFrontId).toBe('front-test-1');

      // Explicit door selection clears selectedFrontId
      useWardrobeStore.getState().selectDoor(door1, bay1);
      expect(useWardrobeStore.getState().selectedFrontId).toBeNull();

      // Switching bay clears selectedFrontId
      useWardrobeStore.getState().setSelectedFrontId('front-test-2');
      useWardrobeStore.getState().selectBay(bay2);
      expect(useWardrobeStore.getState().selectedFrontId).toBeNull();
    });

    it('CF-08: selectBay in doorEditorMode auto-selects bay door and clears internal cell selection', () => {
      const s = useWardrobeStore.getState();
      const bay3 = s.design.runs[0].bays[2].id;
      s.setDoorEditorMode(true);
      expect(useWardrobeStore.getState().doorEditorMode).toBe(true);

      useWardrobeStore.getState().selectBay(bay3);
      const next = useWardrobeStore.getState();
      expect(next.selectedBayId).toBe(bay3);
      expect(next.selectedCellId).toBeNull();
      expect(next.selectedCellIds).toEqual([]);
      expect(next.selectedDoorId).toBeTruthy();
      expect(next.resolved.doors.find(d => d.id === next.selectedDoorId)?.bayId).toBe(bay3);
    });

    it('PM-05 & CF-13: prunes stale drawer/door/open/front IDs and exits doorEditorMode on design replacement & time travel', () => {
      const s = useWardrobeStore.getState();
      const drawerId = s.resolved.drawers[0].id;
      s.selectDrawer(drawerId);
      s.setDoorEditorMode(true);
      s.setSelectedFrontId('front-stale');
      useWardrobeStore.setState({ commandError: 'Eski hata' });

      // startBlankDesign exits doorEditorMode and clears stale state
      useWardrobeStore.getState().startBlankDesign({ layoutKind: 'straight', lengthAMm: 2600 });
      expect(useWardrobeStore.getState().doorEditorMode).toBe(false);
      expect(useWardrobeStore.getState().selectedDrawerId).toBeNull();
      expect(useWardrobeStore.getState().selectedDoorId).toBeNull();
      expect(useWardrobeStore.getState().selectedFrontId).toBeNull();
      expect(useWardrobeStore.getState().commandError).toBeNull();

      // importJsonString exits doorEditorMode and clears stale drawer/error
      useWardrobeStore.getState().setDoorEditorMode(true);
      useWardrobeStore.setState({ selectedDrawerId: 'drawer-ghost', selectedDrawerIds: ['drawer-ghost'], commandError: 'Eski hata' });
      const res = useWardrobeStore.getState().importJsonString(JSON.stringify(phase5Example('straight')));
      expect(res.ok).toBe(true);
      expect(useWardrobeStore.getState().doorEditorMode).toBe(false);
      expect(useWardrobeStore.getState().selectedDrawerId).toBeNull();
      expect(useWardrobeStore.getState().commandError).toBeNull();

      // openNamedVersion exits doorEditorMode
      useWardrobeStore.getState().setDoorEditorMode(true);
      expect(useWardrobeStore.getState().openNamedVersion(phase5Example('blind'), 'Kör')).toBe(true);
      expect(useWardrobeStore.getState().doorEditorMode).toBe(false);

      // undoSteps prunes stale drawer IDs that don't exist in restored snapshot
      useWardrobeStore.setState({ selectedDrawerId: 'drawer-nonexistent', selectedDrawerIds: ['drawer-nonexistent'] });
      useWardrobeStore.getState().undoSteps(1);
      expect(useWardrobeStore.getState().selectedDrawerId).toBeNull();
      expect(useWardrobeStore.getState().selectedDrawerIds).toEqual([]);

      // loadPreset exits doorEditorMode
      useWardrobeStore.getState().setDoorEditorMode(true);
      useWardrobeStore.getState().loadPreset('l-blind-corner');
      expect(useWardrobeStore.getState().doorEditorMode).toBe(false);
    });
  });

  describe('PM-03, PM-06 & PM-08 — Orphan checkpoint revert, Redo timestampMs & transaction reset', () => {
    it('PM-03: revertToCheckpoint on an orphaned Redo branch preserves prior historyPast and uses Turkish labels', () => {
      const s = useWardrobeStore.getState();
      s.updateRunDimension('run-A', 'lengthMm', 3100); // step 1
      s.updateRunDimension('run-A', 'depthMm', 640);   // step 2
      useWardrobeStore.getState().undo();              // back to 3100/600 (past=1, future=1)
      useWardrobeStore.getState().saveCheckpoint();    // checkpoint at 3100/600
      useWardrobeStore.getState().undo();              // back to 3000/600 (past=0, future=2)
      useWardrobeStore.getState().updateRunDimension('run-A', 'lengthMm', 3200); // orphans checkpoint 3100/600!
      useWardrobeStore.getState().updateRunDimension('run-A', 'depthMm', 620);   // past=2

      expect(useWardrobeStore.getState().historyPast).toHaveLength(2);
      useWardrobeStore.getState().revertToCheckpoint();

      const afterRevert = useWardrobeStore.getState();
      expect(afterRevert.design.runs[0].lengthMm).toBe(3100);
      expect(afterRevert.design.runs[0].depthMm).toBe(600);
      expect(afterRevert.hasUnsavedChanges).toBe(false);
      // MUST NOT wipe historyPast to []!
      expect(afterRevert.historyPast.length).toBe(3);
      expect(afterRevert.historyPast[afterRevert.historyPast.length - 1].label).toBe('Son kayıt noktasına dönüldü');
      expect(afterRevert.historyFuture[0].label).not.toContain('Checkpoint');

      // Undo returns to pre-revert working copy (3200/620) with prior steps still intact!
      useWardrobeStore.getState().undo();
      expect(useWardrobeStore.getState().design.runs[0].lengthMm).toBe(3200);
      expect(useWardrobeStore.getState().design.runs[0].depthMm).toBe(620);
      expect(useWardrobeStore.getState().historyPast).toHaveLength(2);
    });

    it('PM-06: redo() preserves timestampMs on re-pushed historyPast entries', () => {
      const s = useWardrobeStore.getState();
      s.updateRunDimension('run-A', 'lengthMm', 3150);
      const originalTs = useWardrobeStore.getState().historyPast[0].timestampMs;
      expect(typeof originalTs).toBe('number');

      useWardrobeStore.getState().undo();
      expect(useWardrobeStore.getState().historyFuture[0].timestampMs).toBe(originalTs);

      useWardrobeStore.getState().redo();
      expect(useWardrobeStore.getState().historyPast[0].timestampMs).toBe(originalTs);
    });

    it('PM-08: unclosed beginHistoryTransaction resets on step switch, save, undo, loadPreset', () => {
      const s = useWardrobeStore.getState();
      s.beginHistoryTransaction();
      s.setLedLighting({ intensity: 0.6 });
      expect(useWardrobeStore.getState().historyPast).toHaveLength(1);

      // Step switch resets unclosed transaction -> subsequent edits are separate Undo steps
      useWardrobeStore.getState().setActiveStep('room-carcass');
      useWardrobeStore.getState().updateRunDimension('run-A', 'lengthMm', 3100);
      useWardrobeStore.getState().updateRunDimension('run-A', 'depthMm', 640);
      expect(useWardrobeStore.getState().historyPast).toHaveLength(3);

      // saveCheckpoint also resets an unclosed transaction
      useWardrobeStore.getState().beginHistoryTransaction();
      useWardrobeStore.getState().setLedLighting({ intensity: 0.9 });
      useWardrobeStore.getState().saveCheckpoint();
      useWardrobeStore.getState().updateRunDimension('run-A', 'lengthMm', 3200);
      expect(useWardrobeStore.getState().historyPast).toHaveLength(5);
    });
  });

  describe('PM-07 & CF-22 — MotionSimulator design-switch recovery cleanup & part.home close target', () => {
    it('PM-07: clears recovery banner on different design.id when clearRecoveryOnDesignChange is set, preserves same-design cancel', () => {
      const straight = phase5Example('straight');
      const straightModel = solveDesign(straight);
      const sim = new MotionSimulator();
      sim.load(straight, straightModel, { clearRecoveryOnDesignChange: true });

      const [leaf, second] = straightModel.slidingDoors!;
      sim.dragTo(second.id, second.maxOffsetMm);
      sim.dragTo(leaf.id, leaf.maxOffsetMm);
      for (let i = 0; i < 180; i++) {
        sim.step(1 / 60, {}, Object.fromEntries(straightModel.drawers.map(d => [d.id, true])));
      }
      sim.dragTo(leaf.id, 0);
      for (let i = 0; i < 180; i++) sim.step(1 / 60, {}, {});

      const plan = sim.recoveryOffer().plan;
      expect(plan).toBeDefined();
      expect(sim.startRecovery(plan)).toBe(true);
      sim.step(1 / 60, {}, {});

      // Same design geometry edit -> keeps cancelled status
      const editedStraight = structuredClone(straight);
      editedStraight.runs[0].lengthMm += 100;
      sim.load(editedStraight, solveDesign(editedStraight), { clearRecoveryOnDesignChange: true });
      expect(sim.recovery?.status).toBe('cancelled');

      // Different design.id -> clears recovery completely so banner never leaks onto new wardrobe
      const blind = phase5Example('blind');
      sim.load(blind, solveDesign(blind), { clearRecoveryOnDesignChange: true });
      expect(sim.recovery).toBeNull();
    });

    it('CF-22: closing a sliding leaf targets part.home rather than hardcoded 0', () => {
      const sim = new MotionSimulator();
      sim.scene = {
        parts: [
          {
            id: 'slide-nonzero-home',
            label: 'Sürgü 2',
            kind: 'sliding',
            home: 450,
            min: 0,
            max: 900,
            open: 0,
            volumes: () => [],
            translation: [1, 0],
            ignoredStaticIds: new Set(),
          },
        ],
        staticVolumes: [],
      };
      sim.positions['slide-nonzero-home'] = 100;
      sim.targets['slide-nonzero-home'] = 100;

      // Explicit close command (flag=false) should target part.home (450), NOT 0!
      sim.step(1 / 60, { 'slide-nonzero-home': false }, {}, { revision: 1, ids: ['slide-nonzero-home'] });
      expect(sim.targets['slide-nonzero-home']).toBe(450);
    });
  });

  describe('PM-09 & CF-07 — Human Turkish history labels & clean front validation errors', () => {
    it('emits clean Turkish history labels without raw schema fields, English enums, or internal IDs', () => {
      const s = useWardrobeStore.getState();
      s.loadPreset('l-diagonal-asymmetric');
      const bayId = useWardrobeStore.getState().design.runs[0].bays[0].id;
      const cellId = useWardrobeStore.getState().resolved.cells.find(c => c.bayId === bayId)!.id;

      useWardrobeStore.getState().updateRunDimension('run-A', 'lengthMm', 3200);
      useWardrobeStore.getState().updateCornerParam('diagonalArmAMm', 980);
      useWardrobeStore.getState().setCornerDoorMode('right');
      useWardrobeStore.getState().setBayOwner('run-A', bayId, 'anne');
      useWardrobeStore.getState().updateDoorFrontConfig(bayId, undefined, 'singleLeft');
      useWardrobeStore.getState().setCellInsert(cellId, { type: 'shoeRack', shoeTiers: 4 });

      const labels = useWardrobeStore.getState().historyPast.map(h => h.label);
      expect(labels[0]).toBe('A Kolu uzunluğu: 3200 mm');
      expect(labels[1]).toBe('Köşe A kolu: 980 mm');
      expect(labels[2]).toBe('Köşe kapak yönü: Sağ menteşe');
      expect(labels[3]).toContain('Anne');
      expect(labels[4]).toContain('Sol menteşe');
      expect(labels[5]).toContain('Ayakkabılık');

      const joined = labels.join('\n');
      expect(joined).not.toMatch(/run-A|lengthMm|diagonalArmAMm|singleLeft|shoeRack|bay-|cell-|Checkpoint/);
    });

    it('CF-07: patchFrontSystem rejects empty or non-adjacent bays with clean Turkish errors (no raw Zod JSON or front-ID)', () => {
      const d = phase5Example('straight');
      useWardrobeStore.getState().openNamedVersion(d, 'Front error test');
      useWardrobeStore.getState().addBay('run-A');
      const frontId = useWardrobeStore.getState().design.fronts[0].id;
      const bays = useWardrobeStore.getState().design.runs[0].bays;
      expect(bays.length).toBeGreaterThanOrEqual(3);

      useWardrobeStore.getState().patchFrontSystem(frontId, { bayIds: [] });
      const emptyErr = useWardrobeStore.getState().commandError ?? '';
      expect(emptyErr).toContain('en az bir bölme');
      expect(emptyErr).not.toContain('too_small');
      expect(emptyErr).not.toContain('[');

      useWardrobeStore.getState().patchFrontSystem(frontId, { bayIds: [bays[0].id, bays[2].id] });
      const nonAdjErr = useWardrobeStore.getState().commandError ?? '';
      expect(nonAdjErr).toContain('bitişik');
      expect(nonAdjErr).not.toMatch(/front-[a-z0-9-]+/i);
    });
  });

  describe('PM-10..PM-14, VF-04, VF-07 & VF-12 — UI component contracts', () => {
    it('enforces ProductionPanel stale-safe export, modal compaction, non-stacking AccessReview & WCAG borders', () => {
      const src = readFileSync('src/ui/ProductionPanel.tsx', 'utf8');
      expect(src).toContain("downloadProductionDocument('pdf', signal)");
      expect(src).toContain("downloadProductionDocument('printable', signal)");
      expect(src).toContain('wardrobe:cancel-production-exports');
      expect(src).toContain('if (activeTask.current === operation) activeTask.current = null;');
      expect(src).toContain('manufacturingVersion(design,versions,activeVersionId)');
      expect(src).toContain("setRenderPrompt('');");
      expect(src).toContain("color: 'Görünüm'");
      expect(src).toContain("depth: 'Derinlik'");
      expect(src).toContain("edges: 'Tel / kenar'");
      expect(src).toContain('modalExportToolbar');
      expect(src).toContain('openAccessFromModal');
      expect(src).toContain('disabled={hasNoSearchMatches}');
      expect(src).toContain('border-slate-500');
      // Only 1 Erişim ölçümlerini incele in main panel + 1 in compact modal bar
      const accessBtnMatches = src.match(/Erişim ölçümlerini incele/g) ?? [];
      expect(accessBtnMatches).toHaveLength(2);
    });

    it('enforces AccessReview immediate current AccessPlan SVG and WCAG border-slate-500', () => {
      const src = readFileSync('src/ui/AccessReview.tsx', 'utf8');
      expect(src).toContain('border-slate-500');
      expect(src).toContain('{!option && <AccessPlan model={model} entry={representative} label="Mevcut düzen" />}');
    });

    it('enforces VersionPanel accessible error bindings, archive desync fix, file upload catch & Turkish copy', () => {
      const src = readFileSync('src/ui/VersionPanel.tsx', 'utf8');
      expect(src).toContain('newNameErrorId');
      expect(src).toContain('renameErrorId');
      expect(src).toContain('aria-invalid={newNameError ? true : undefined}');
      expect(src).toContain('aria-describedby={newNameError ? newNameErrorId : undefined}');
      expect(src).toContain('aria-invalid={renameError ? true : undefined}');
      expect(src).toContain('aria-describedby={renameError ? renameErrorId : undefined}');
      expect(src).toContain('border-slate-500');
      expect(src).toContain('fileReadSerial');
      expect(src).toContain('manufacturingVersion(design,versions,activeVersionId)');
      expect(src).toContain('open(selected.design,selected.name,selected.id)');
      expect(src).toContain('setActiveVersionId(id)');
      expect(src).toContain("tasarım JSON'unu");
      expect(src).not.toContain("Design JSON'u");
    });

    it('enforces MotionController persistent landmark focus on recovery dismiss', () => {
      const src = readFileSync('src/canvas/scene/MotionController.tsx', 'utf8');
      expect(src).toContain("document.querySelector<HTMLElement>('main')");
      expect(src).toContain('clearRecoveryOnDesignChange: true');
    });
  });
});
