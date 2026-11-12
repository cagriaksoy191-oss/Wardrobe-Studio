import { describe, expect, it } from 'vitest';
import { runEndControlsFit } from '../src/canvas/annotations/runEndControlFit';

describe('run-end add controls', () => {
  const a = { x: 860, y: 360, z: .8 };
  const b = { x: 250, y: 420, z: .8 };
  const fit = (...anchors: (typeof a)[]) => runEndControlsFit(anchors, 1280, 680, 58);

  it('keeps on-canvas controls for well separated anchors and a straight run', () => {
    expect(fit(a)).toBe(true);
    expect(fit(a, b)).toBe(true);
  });

  it.each([
    { ...b, x: -16.37 }, { ...b, x: 1269 }, { ...b, y: 77 },
    { ...b, y: 660 }, { ...b, z: 1.1 }, { ...b, z: -1.1 },
    { ...a, x: a.x + 20 }, { ...b, x: NaN },
  ])('uses the dock for an inaccessible anchor %o', anchor => {
    expect(fit(a, anchor)).toBe(false);
  });
});
