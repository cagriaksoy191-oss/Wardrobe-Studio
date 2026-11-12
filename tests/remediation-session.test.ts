import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { phase5Example } from '../src/core/presets/phase5Examples';
import { useWardrobeStore } from '../src/store/useWardrobeStore';
import { useVersionArchive, VERSION_ARCHIVE_KEY } from '../src/store/versionArchive';

const db = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn() }));
vi.mock('idb-keyval', () => db);

const localKey = 'wardrobe-studio:session-sync:v2';
const dbKey = 'wardrobe-studio:session:v2';
let stored: Map<string, string>;
const state = useWardrobeStore.getState;

beforeEach(() => {
  vi.unstubAllGlobals();
  db.get.mockReset().mockResolvedValue(undefined);
  db.set.mockReset().mockResolvedValue(undefined);
  state().loadPreset('straight-wardrobe');
  useWardrobeStore.setState({ recoveryJson: null });
  stored = new Map();
  vi.stubGlobal('indexedDB', {});
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => stored.get(key) ?? null,
    setItem: (key: string, value: string) => { stored.set(key, value); },
  });
});
afterEach(() => vi.unstubAllGlobals());

function oldSession() {
  const design = phase5Example('diagonal');
  return { version: 2, workingDesign: design, checkpointDesign: design, historyPast: [], historyFuture: [] };
}

describe('AUD-001 and AUD-007 — session durability', () => {
  it('offers first-use choices only after both working-session reads return empty', async () => {
    useWardrobeStore.setState({ persistenceStatus: 'idle', isFirstUse: false });
    const untouchedDesign = state().design;
    let finish!: (value: unknown) => void;
    db.get.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    const hydration = state().hydrateFromIndexedDB();
    expect(state().isFirstUse).toBe(false);
    finish(undefined);
    await hydration;
    expect(state().isFirstUse).toBe(true);
    expect(state().design).toBe(untouchedDesign);
    expect(stored.has(localKey)).toBe(false);
    state().saveCheckpoint();
    expect(state().isFirstUse).toBe(false);
    expect(JSON.parse(stored.get(localKey)!)).not.toHaveProperty('isFirstUse');
  });

  it('does not show first-use choices while restoring an IndexedDB-only working session', async () => {
    useWardrobeStore.setState({ persistenceStatus: 'idle', isFirstUse: false });
    const record = oldSession();
    let finish!: (value: unknown) => void;
    db.get.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    const hydration = state().hydrateFromIndexedDB();
    expect(state().isFirstUse).toBe(false);
    finish(record);
    await hydration;
    expect(state().isFirstUse).toBe(false);
    expect(state().design).toEqual(record.workingDesign);
  });

  it.each(['new', 'import', 'version', 'checkpoint', 'undo-redo'])(
    'keeps the user action %s when IndexedDB returns a late snapshot',
    async action => {
      let release!: (value: unknown) => void;
      db.get.mockImplementationOnce(() => new Promise(resolve => { release = resolve; }));
      const hydration = state().hydrateFromIndexedDB();
      if (action === 'new') state().startBlankDesign({ name: 'Yeni kullanıcı çalışması', layoutKind: 'straight' });
      if (action === 'import') expect(state().importJsonString(JSON.stringify(phase5Example('straight'))).ok).toBe(true);
      if (action === 'version') state().openNamedVersion(phase5Example('asymmetric'), 'Seçilen sürüm');
      if (action === 'checkpoint') state().saveCheckpoint();
      if (action === 'undo-redo') {
        state().updateRunDimension('run-A', 'lengthMm', 3100);
        state().undo();
        state().redo();
        state().undo();
      }
      const { design, checkpointDesign, historyPast, historyFuture } = state();
      release(oldSession());
      await hydration;
      expect(state()).toMatchObject({ design, checkpointDesign, historyPast, historyFuture });
    }
  );

  it('restores a v2 working copy, checkpoint and both history branches', async () => {
    const record = oldSession();
    const workingDesign = { ...record.workingDesign, name: 'Çalışma kopyası' };
    db.get.mockResolvedValueOnce({
      ...record, workingDesign,
      historyPast: [{ label: 'Önceki', snapshot: record.workingDesign }],
      historyFuture: [{ label: 'Sonraki', snapshot: { ...workingDesign, name: 'Sonraki çalışma' } }],
    });
    await state().hydrateFromIndexedDB();
    expect(state().design.name).toBe('Çalışma kopyası');
    expect(state().checkpointDesign.id).toBe('phase5-diagonal');
    expect(state().historyPast[0].label).toBe('Önceki');
    expect(state().historyFuture[0].label).toBe('Sonraki');
  });

  it.each([
    [false, false, 'saved'],
    [true, false, 'partial'],
    [false, true, 'partial'],
    [true, true, 'error'],
  ])('writes both channels independently (LS fails=%s, IDB fails=%s)', async (lsFails, dbFails, status) => {
    if (lsFails) vi.stubGlobal('localStorage', {
      getItem: () => null, setItem: () => { throw new Error('quota'); },
    });
    if (dbFails) db.set.mockRejectedValueOnce(new Error('quota'));
    state().saveCheckpoint();
    await vi.waitFor(() => expect(state().persistenceStatus).toBe(status));
    expect(db.set).toHaveBeenCalledWith(dbKey, expect.objectContaining({ version: 2 }));
    expect(stored.has(localKey)).toBe(!lsFails);
  });

  it('chooses the newer durable copy when the other channel is stale', async () => {
    const older = oldSession();
    stored.set(localKey, JSON.stringify({ ...older, savedAtMs: 100 }));
    const newer = { ...older, workingDesign: phase5Example('straight'), savedAtMs: 200 };
    db.get.mockResolvedValueOnce(newer);
    await state().hydrateFromIndexedDB();
    expect(state().design.id).toBe('phase5-straight');
  });

  it('retains a rejected late session in the current durable recovery envelope', async () => {
    const invalid = oldSession();
    invalid.workingDesign.junctions = [];
    let finish!: (value: unknown) => void;
    db.get.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    const loading = state().hydrateFromIndexedDB();
    state().startBlankDesign({ name: 'Yeni çalışma', layoutKind: 'straight' });
    finish(invalid);
    await loading;
    expect(state().design.name).toBe('Yeni çalışma');
    expect(JSON.parse(state().recoveryJson!)).toEqual(invalid);
    expect(JSON.parse(stored.get(localKey)!).recoveryJson).toBe(state().recoveryJson);
  });

  it('keeps a rejected named version through archive mutations', async () => {
    useVersionArchive.setState({ versions: [], recoveryDocuments: [], status: 'idle', error: null });
    const design = phase5Example('diagonal');
    const rejected = { id: 'old-invalid', name: 'Kurtarılacak', createdAt: '2026-11-04', updatedAt: '2026-11-04', design: { ...design, junctions: [] } };
    db.get.mockResolvedValueOnce({ schemaVersion: 1, versions: [rejected] });
    const archive = useVersionArchive.getState();
    await archive.hydrate();
    expect(useVersionArchive.getState().versions).toEqual([]);
    const id = archive.save('Geçerli', design)!;
    archive.rename(id, 'Yeniden adlandırıldı');
    const persisted = JSON.parse(stored.get(VERSION_ARCHIVE_KEY)!);
    expect(persisted.versions[0].name).toBe('Yeniden adlandırıldı');
    expect(JSON.parse(persisted.recoveryDocuments[0])).toEqual(rejected);
  });
});
