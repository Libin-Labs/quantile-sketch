export interface QuantileSketch {
  add(value: number): void;
  quantile(q: number): number;
  readonly count: number;
  readonly size: number;
}
interface Tuple {
  v: number;
  g: number;
  delta: number;
}
export function createQuantileSketch(epsilon = 0.01, capacity = 1_000_000): QuantileSketch {
  if (!Number.isFinite(epsilon) || epsilon < 0.001 || epsilon > 0.25)
    throw new RangeError('epsilon must be .001..0.25.');
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 1_000_000)
    throw new RangeError('Capacity must be 1..1000000.');
  const summary: Tuple[] = [];
  let n = 0;
  return {
    add(value) {
      if (!Number.isFinite(value)) throw new TypeError('Value must be finite.');
      if (n === capacity) throw new RangeError('Capacity exceeded.');
      let lo = 0,
        hi = summary.length;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (summary[mid]!.v <= value) lo = mid + 1;
        else hi = mid;
      }
      n++;
      summary.splice(lo, 0, {
        v: value,
        g: 1,
        delta: lo === 0 || lo === summary.length ? 0 : Math.max(0, Math.floor(2 * epsilon * n) - 1),
      });
      const threshold = Math.floor(2 * epsilon * n);
      for (let j = summary.length - 2; j > 0; j--) {
        const a = summary[j]!,
          b = summary[j + 1]!;
        if (a.g + b.g + b.delta <= threshold) {
          b.g += a.g;
          summary.splice(j, 1);
        }
      }
    },
    quantile(q) {
      if (!Number.isFinite(q) || q < 0 || q > 1) throw new RangeError('q must be in [0,1].');
      if (!n) throw new RangeError('Empty sketch.');
      if (q === 0) return summary[0]!.v;
      if (q === 1) return summary[summary.length - 1]!.v;
      const rank = Math.max(1, Math.ceil(q * n));
      let lower = 0,
        previous = summary[0]!.v;
      for (const item of summary) {
        lower += item.g;
        if (lower + item.delta > rank + epsilon * n) return previous;
        previous = item.v;
      }
      return previous;
    },
    get count() {
      return n;
    },
    get size() {
      return summary.length;
    },
  };
}
