import type { SizeSpec } from '../schema/types';

export interface DistributableItem { id: string; size: SizeSpec; locked?: boolean }
export interface DistributedResult { id: string; resolvedMm: number }
export class DistributionError extends Error {
  constructor(message: string) { super(message); this.name = 'DistributionError'; }
}

/** Sınırlandırılmış ağırlıklı dağıtım. Sabitleri değiştirmez; olanaksız ölçüyü reddeder. */
export function distributeIntegerMm(totalSpanMm: number, items: DistributableItem[], dividerThicknessMm = 0): DistributedResult[] {
  const count = items.length;
  if (!Number.isFinite(totalSpanMm) || !Number.isFinite(dividerThicknessMm)) throw new DistributionError('Ölçü sonlu bir sayı olmalıdır.');
  const net = Math.round(totalSpanMm) - Math.max(0, count - 1) * Math.round(dividerThicknessMm);
  if (!count) return [];
  const values = Array<number>(count).fill(0);
  const flex: number[] = [];
  let fixedSum = 0;
  const lower = (i: number) => items[i].size.kind === 'flex' ? Math.max(1, Math.ceil((items[i].size as Extract<SizeSpec, {kind:'flex'}>).minMm ?? 10)) : 0;
  const upper = (i: number) => items[i].size.kind === 'flex' ? Math.floor((items[i].size as Extract<SizeSpec, {kind:'flex'}>).maxMm ?? Number.MAX_SAFE_INTEGER) : 0;
  for (let i = 0; i < count; i++) {
    const spec = items[i].size;
    if (spec.kind === 'fixed') {
      if (!Number.isFinite(spec.mm) || spec.mm <= 0) throw new DistributionError('Sabit ölçü pozitif olmalıdır.');
      fixedSum += values[i] = Math.round(spec.mm);
    } else {
      if (items[i].locked) throw new DistributionError('Kilitli esnek öğe önce mevcut mm ölçüsüne sabitlenmelidir.');
      if (!Number.isFinite(spec.weight) || spec.weight <= 0 || upper(i) < lower(i)) throw new DistributionError('Esnek ağırlık veya minimum/maksimum aralığı geçersiz.');
      flex.push(i);
    }
  }
  const remaining = net - fixedSum;
  const minSum = flex.reduce((s,i) => s + lower(i), 0);
  const maxSum = flex.reduce((s,i) => s + upper(i), 0);
  if (remaining < minSum || remaining > maxSum || (!flex.length && remaining !== 0))
    throw new DistributionError(`Ölçüler sığmıyor: ${net} mm net alanda sabitler ${fixedSum} mm; esnek alan ${minSum}–${maxSum >= Number.MAX_SAFE_INTEGER ? 'sınırsız' : maxSum} mm olmalıdır. Sabit/kilitli ölçüler korunmuştur.`);
  if (flex.length) {
    const weight = (i: number) => (items[i].size as Extract<SizeSpec, {kind:'flex'}>).weight;
    let low = 0;
    let high = remaining / Math.min(...flex.map(weight));
    // Aynı anda etkin olan min/max sınırlarında da monoton ağırlıklı su-doldurma.
    for (let pass = 0; pass < 72; pass++) {
      const scale = (low + high) / 2;
      const sum = flex.reduce((s,i) => s + Math.max(lower(i), Math.min(upper(i), scale * weight(i))), 0);
      if (sum < remaining) low = scale; else high = scale;
    }
    for (const i of flex) values[i] = Math.max(lower(i), Math.min(upper(i), Math.floor(high * weight(i) + 1e-9)));
    let remainder = net - values.reduce((s,v) => s+v, 0);
    // Son serbest öğeden başlayarak yalnızca sınır içinde kalanlara yuvarlama farkını ver.
    for (let cursor = flex.length - 1; cursor >= 0 && remainder !== 0; cursor--) {
      const i = flex[cursor];
      const delta = remainder > 0
        ? Math.min(remainder, upper(i) - values[i])
        : -Math.min(-remainder, values[i] - lower(i));
      values[i] += delta;
      remainder -= delta;
    }
    if (remainder !== 0) throw new DistributionError('Yuvarlama farkı esnek sınırlar içinde dağıtılamadı.');
  }
  if (values.reduce((s,v) => s+v, 0) !== net) throw new DistributionError('Ölçü sınırları toplam alanı karşılamıyor.');
  return items.map((item,i) => ({ id:item.id, resolvedMm:values[i] }));
}
