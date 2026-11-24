import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  NumberField as SharedNumberField,
  evaluateNumberFieldCommit,
  shouldCancelNumberFieldEscape,
} from '../src/ui/NumberField';
import { NumberField as ReExportedNumberField } from '../src/ui/Phase4Panels';

const worktreeRoot = resolve(__dirname, '..');
const appSource = readFileSync(resolve(worktreeRoot, 'src/App.tsx'), 'utf8');
const phase4Source = readFileSync(resolve(worktreeRoot, 'src/ui/Phase4Panels.tsx'), 'utf8');
const frontEditorSource = readFileSync(resolve(worktreeRoot, 'src/ui/FrontSystemEditor.tsx'), 'utf8');
const cssSource = readFileSync(resolve(worktreeRoot, 'src/index.css'), 'utf8');

describe('Phase 2A WS-1 — PE-11 NumberField contract & coverage', () => {
  it('re-exports the shared NumberField from Phase4Panels for backward compatibility', () => {
    expect(ReExportedNumberField).toBe(SharedNumberField);
  });

  it('prevents spurious commits/Undo entries when draft is unchanged or numerically identical', () => {
    expect(evaluateNumberFieldCommit('2400', false, 2400, 1800, 3000)).toEqual({
      action: 'noop',
      nextDraft: '2400',
      problem: null,
    });
    expect(evaluateNumberFieldCommit(' 2400.0 ', false, 2400, 1800, 3000)).toEqual({
      action: 'noop',
      nextDraft: '2400',
      problem: null,
    });
  });

  it('commits valid changed integer millimetres once without mutating intermediate drafts', () => {
    expect(evaluateNumberFieldCommit('2550.4', false, 2400, 1800, 3000)).toEqual({
      action: 'commit',
      value: 2550,
      nextDraft: '2400',
      problem: null,
    });
  });

  it('reverts empty, invalid, and out-of-range drafts with an accessible Turkish alert message (WS-UX-004)', () => {
    const empty = evaluateNumberFieldCommit('', false, 2400, 1800, 3000);
    expect(empty.action).toBe('revert');
    expect(empty.nextDraft).toBe('2400');
    expect(empty.problem).toMatch(/1800 ile 3000/);

    const bad = evaluateNumberFieldCommit('', true, 2400, 1800, 3000);
    expect(bad.action).toBe('revert');
    expect(bad.nextDraft).toBe('2400');
    expect(bad.problem).toMatch(/Önceki değer korundu/);

    const outOfRange = evaluateNumberFieldCommit('9999', false, 2400, 1800, 3000);
    expect(outOfRange.action).toBe('revert');
    expect(outOfRange.nextDraft).toBe('2400');
    expect(outOfRange.problem).toMatch(/1800 ile 3000/);
  });

  it('cancels dirty Escape locally while letting pristine Escape bubble for modal dismissal (WS-UX-005 & WS-UX-017)', () => {
    expect(shouldCancelNumberFieldEscape('2500', 2400, false, null)).toBe(true);
    expect(shouldCancelNumberFieldEscape('', 2400, false, null)).toBe(true);
    expect(shouldCancelNumberFieldEscape('2400', 2400, true, null)).toBe(true);
    expect(shouldCancelNumberFieldEscape('2400', 2400, false, 'Hata')).toBe(true);
    expect(shouldCancelNumberFieldEscape('2400', 2400, false, null)).toBe(false);
  });

  it('replaces all 18 raw state-mutating <input type="number"> controls in App.tsx with NumberField', () => {
    const rawNumberInputs = appSource.match(/<input[^>]*type="number"/g) ?? [];
    // Only blankMeasureInput (which validates string drafts on submit via readBlankMeasurements) remains a raw number input
    expect(rawNumberInputs).toHaveLength(1);
    const numberFieldUsages = appSource.match(/<NumberField\b/g) ?? [];
    expect(numberFieldUsages.length).toBeGreaterThanOrEqual(19);
  });
});

describe('Phase 2A WS-1 — IA-04 & IA-12 Terminology and zero-jargon invariants', () => {
  const uiSources = [
    ['App.tsx', appSource],
    ['Phase4Panels.tsx', phase4Source],
    ['FrontSystemEditor.tsx', frontEditorSource],
  ] as const;

  it.each(uiSources)('contains zero raw markdown backticks or leaked internal code labels in %s UI copy', (_name, src) => {
    expect(src).not.toMatch(/`t`\s*&\s*`tb`/);
    expect(src).not.toMatch(/\(`Junction`\)/);
    expect(src).not.toMatch(/\(`Front`\)/);
    expect(src).not.toMatch(/\(`InsertRegistry`\)/);
    expect(src).not.toMatch(/`Seç & Düzenle`/);
    expect(src).not.toMatch(/`Y` Boyutlandırılabilir/);
    expect(src).not.toMatch(/`Kapaklarla Birlikte Hareket Eder`/);
    expect(src).not.toMatch(/`Çekmeceyle Birlikte Kayar`/);
  });

  it.each(uiSources)('removes 3D-engine jargon and legacy inconsistent save terms in %s', (_name, src) => {
    expect(src).not.toContain('PBR Katalog');
    expect(src).not.toContain('Dünya Ölçekli UV Aktif');
    expect(src).not.toContain('Stüdyo IBL + Gölge');
    expect(src).not.toContain('(Checkpoint)');
    expect(src).not.toContain('Manuel nokta ·');
    expect(src).not.toContain('Otomatik kurtarma ·');
  });

  it('uses unified canonical Turkish domain terminology in App.tsx', () => {
    expect(appSource).toContain('Kayıt noktası ·');
    expect(appSource).toContain('Otomatik kayıt ·');
    expect(appSource).toContain('Üst dolgu (klapa)');
    expect(appSource).toContain('Panel kalınlıkları (Gövde / Arkalık)');
    expect(appSource).toContain('Malzeme Kataloğu');
    expect(appSource).toContain('Stüdyo Işıklandırması');
    expect(appSource).toContain('Kapak Düzenle');
    expect(appSource).toContain('Son kayıt noktasına dön');
  });
});

describe('Phase 2A WS-1 — IA-01, IA-11, IA-06, IA-10, PE-04, 6.9 & CAD-08 Header Binding', () => {
  it('keeps Undo & Redo outside #studio-more-tools and labels every overflow tool (IA-01 & IA-11)', () => {
    const moreToolsStart = appSource.indexOf('id="studio-more-tools"');
    const undoIndex = appSource.indexOf('onClick={undo}');
    const redoIndex = appSource.indexOf('onClick={redo}');
    expect(moreToolsStart).toBeGreaterThan(-1);
    expect(undoIndex).toBeGreaterThan(-1);
    expect(redoIndex).toBeGreaterThan(-1);
    expect(undoIndex).toBeLessThan(moreToolsStart);
    expect(redoIndex).toBeLessThan(moreToolsStart);

    // Every collapsed secondary tool shows an explicit Turkish label inside Araçlar
    expect(appSource).toContain('<span className="studio-more-only-label">Çizgisel görünüm (Tel kafes)</span>');
    expect(appSource).toContain('<span className="studio-more-only-label">İşlem geçmişi</span>');
    expect(appSource).toContain('<span className="studio-more-only-label">JSON Yükle</span>');
    expect(cssSource).toMatch(/@media\s*\(max-width:\s*1660px\)/);
    expect(appSource).not.toContain('studio-front-toolbar flex min-w-0 items-stretch');
  });

  it('provides accessible Turkish names, keyboard-native bay cards, safe separated delete, and ARIA semantics (IA-06 & 6.9)', () => {
    expect(appSource).not.toMatch(/onClick=\{\(\)\s*=>\s*selectBay\(bay\.id\)\}\s*className="cursor-pointer/);
    expect(appSource).toContain('aria-label={');
    expect(appSource).toContain('Geri al (geçmiş boş)');
    expect(appSource).toContain('Yinele (ileri adım yok)');
    expect(appSource).toContain('aria-current={activeStep === \'room-carcass\' ? \'step\' : undefined}');
    expect(appSource).toContain('bölmesini sil');
    expect(appSource).toContain('genişliğini kilitle');
    expect(appSource).toContain('disabled={!canDelete}');
  });

  it('dismisses History menu on Escape and outside pointerdown with trigger focus return (PE-04)', () => {
    expect(appSource).toContain("document.addEventListener('pointerdown', handlePointerDown)");
    expect(appSource).toContain('if (showHistoryMenu)');
    expect(appSource).toContain('focusHistoryTrigger()');
    expect(appSource).toContain('id="studio-history-menu"');
  });

  it('eliminates WCAG AA failing text-slate-500 contrast and defines unified Workshop CAD CSS tokens (IA-10)', () => {
    expect(appSource).not.toContain('text-slate-500');
    expect(phase4Source).not.toContain('text-slate-500');
    expect(frontEditorSource).not.toContain('text-slate-500');
    for (const token of ['.studio-section', '.studio-section-title', '.studio-card', '.studio-helper', '.studio-input', '.studio-form-grid']) {
      expect(cssSource).toContain(token);
    }
    expect(cssSource).toContain('grid-template-rows: subgrid');
    expect(appSource).toContain('studio-form-grid');
    expect(phase4Source).toContain('studio-form-grid');
    expect(frontEditorSource).toContain('studio-form-grid');
  });

  it('binds CAD-08 live sliding-leaf open state into header anyDoorOpen', () => {
    expect(appSource).toContain('hasOpenSlidingLeaf');
    expect(appSource).toMatch(/const anyDoorOpen\s*=\s*hasOpenSlidingLeaf\s*\|\|/);
  });
});
