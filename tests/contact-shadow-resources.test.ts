import { describe, expect, it, vi } from 'vitest';
import { Texture } from 'three';
import { createContactShadowResources } from '../src/canvas/scene/contactShadowResources';

function observe(pass: ReturnType<typeof createContactShadowResources>) {
  return [pass.target, pass.scratch, pass.geometry, pass.depth, pass.horizontal, pass.vertical]
    .map(resource => vi.spyOn(resource, 'dispose'));
}

describe('Contact shadow resource ownership', () => {
  it('retires every owned object once, leaving render-target attachments to the renderer', async () => {
    const pass = createContactShadowResources(512, 8, '#020617');
    const disposed = observe(pass);
    const texture = vi.spyOn(pass.target.texture, 'dispose');
    const scratchTexture = vi.spyOn(pass.scratch.texture, 'dispose');
    const detach = pass.attach();
    expect(pass.active).toBe(true);
    detach();
    detach();
    expect(pass.active).toBe(false);
    disposed.forEach(call => expect(call).not.toHaveBeenCalled());
    await Promise.resolve();
    disposed.forEach(call => expect(call).toHaveBeenCalledOnce());
    expect(texture).not.toHaveBeenCalled();
    expect(scratchTexture).not.toHaveBeenCalled();
  });

  it('keeps an attached pass alive through synchronous StrictMode effect replay', async () => {
    const pass = createContactShadowResources(512, 8, '#020617');
    const disposed = observe(pass);
    const detachFirst = pass.attach();
    detachFirst();
    const detachCurrent = pass.attach();
    await Promise.resolve();
    expect(pass.active).toBe(true);
    disposed.forEach(call => expect(call).not.toHaveBeenCalled());
    detachFirst();
    expect(pass.active).toBe(true);
    detachCurrent();
    await Promise.resolve();
    disposed.forEach(call => expect(call).toHaveBeenCalledOnce());
  });

  it('releases replaced resources without retiring the next pass', async () => {
    const first = createContactShadowResources(512, 8, '#020617');
    const second = createContactShadowResources(256, 6, '#020617');
    const old = observe(first);
    const current = observe(second);
    const detachFirst = first.attach();
    detachFirst();
    const detachSecond = second.attach();
    second.horizontal.uniforms.tDiffuse.value = second.target.texture;
    second.vertical.uniforms.tDiffuse.value = second.scratch.texture;
    await Promise.resolve();
    old.forEach(call => expect(call).toHaveBeenCalledOnce());
    current.forEach(call => expect(call).not.toHaveBeenCalled());
    expect(second.horizontal.uniforms.tDiffuse.value).toBe(second.target.texture);
    expect(second.vertical.uniforms.tDiffuse.value).toBe(second.scratch.texture);
    expect(second.active).toBe(true);
    detachSecond();
    await Promise.resolve();
    expect(second.horizontal.uniforms.tDiffuse.value).toBeNull();
    expect(second.vertical.uniforms.tDiffuse.value).toBeNull();
  });

  it('leaves borrowed textures and their references intact', async () => {
    const pass = createContactShadowResources(512, 8, '#020617');
    const shared = new Texture();
    const disposeShared = vi.spyOn(shared, 'dispose');
    const previous = pass.horizontal.uniforms.tDiffuse.value;
    pass.horizontal.uniforms.tDiffuse.value = shared;
    const detach = pass.attach();
    detach();
    await Promise.resolve();
    expect(pass.horizontal.uniforms.tDiffuse.value).toBe(shared);
    expect(disposeShared).not.toHaveBeenCalled();
    pass.horizontal.uniforms.tDiffuse.value = previous;
    shared.dispose();
  });
});
