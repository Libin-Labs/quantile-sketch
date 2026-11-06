import assert from 'node:assert/strict';
import test from 'node:test';
import * as api from '../dist/esm/index.js';
test('empty validation and capacity atomicity', () => {
  const s = api.createQuantileSketch(0.1, 2);
  assert.throws(() => s.quantile(0.5));
  s.add(2);
  assert.throws(() => s.add(NaN));
  s.add(1);
  assert.throws(() => s.add(3), RangeError);
  assert.equal(s.count, 2);
  assert.equal(s.quantile(0), 1);
  assert.equal(s.quantile(1), 2);
});
test('parameters and query validation', () => {
  for (const e of [0, 0.0001, 0.3, NaN, Infinity]) assert.throws(() => api.createQuantileSketch(e));
  for (const c of [0, 1.5, 1000001]) assert.throws(() => api.createQuantileSketch(0.01, c));
  const s = api.createQuantileSketch();
  s.add(1);
  for (const q of [-1, 2, NaN]) assert.throws(() => s.quantile(q));
});
test('exact singleton and duplicate ranks', () => {
  const s = api.createQuantileSketch(0.1);
  for (let i = 0; i < 1000; i++) s.add(7);
  for (let j = 0; j <= 100; j++) assert.equal(s.quantile(j / 100), 7);
  assert.equal(s.count, 1000);
  assert.ok(s.size < 100);
});
test('prefix rank oracle exhaustive quantile grid', () => {
  for (const epsilon of [0.001, 0.01, 0.1, 0.25])
    for (let seed = 1; seed <= 12; seed++) {
      let rng = seed;
      const s = api.createQuantileSketch(epsilon),
        a = [];
      for (let n = 1; n <= 150; n++) {
        rng = (1664525 * rng + 1013904223) >>> 0;
        const value = rng % 47;
        a.push(value);
        s.add(value);
        const sorted = a.slice().sort((x, y) => x - y);
        for (let j = 0; j <= 20; j++) {
          const q = j / 20,
            v = s.quantile(q),
            rank = Math.max(1, Math.ceil(q * n)),
            err = Math.ceil(epsilon * n),
            first = sorted.indexOf(v) + 1,
            last = sorted.lastIndexOf(v) + 1;
          assert.ok(
            first <= rank + err && last >= rank - err,
            JSON.stringify({ epsilon, seed, n, q, v, rank, first, last, err }),
          );
        }
      }
    }
});
test('ascending descending alternating rank oracle', () => {
  for (const order of [
    Array.from({ length: 2000 }, (_, i) => i),
    Array.from({ length: 2000 }, (_, i) => 1999 - i),
    Array.from({ length: 2000 }, (_, i) => (i % 2 ? 2000 - i : i)),
  ]) {
    const s = api.createQuantileSketch(0.01);
    order.forEach((v) => s.add(v));
    const sorted = order.slice().sort((a, b) => a - b);
    for (let j = 0; j <= 1000; j++) {
      const q = j / 1000,
        v = s.quantile(q),
        rank = Math.max(1, Math.ceil(q * 2000)),
        error = 20;
      assert.ok(sorted.indexOf(v) + 1 <= rank + error && sorted.lastIndexOf(v) + 1 >= rank - error);
    }
    assert.ok(s.size < 500);
  }
});
test('deterministic compression and extremes', () => {
  const a = api.createQuantileSketch(0.02),
    b = api.createQuantileSketch(0.02);
  for (let i = 0; i < 10000; i++) {
    const v = Math.sin(i) * 1e300;
    a.add(v);
    b.add(v);
  }
  assert.equal(a.size, b.size);
  for (let q = 0; q <= 10; q++) assert.equal(a.quantile(q / 10), b.quantile(q / 10));
  assert.ok(a.size < 1000);
});
test('exhaustive small ternary streams rank oracle', () => {
  for (let code = 0; code < 3 ** 7; code++) {
    let remaining = code;
    const stream = [],
      sketch = api.createQuantileSketch(0.25);
    for (let i = 0; i < 7; i++) {
      stream.push(remaining % 3);
      remaining = Math.floor(remaining / 3);
    }
    stream.forEach((value) => sketch.add(value));
    const sorted = stream.slice().sort((a, b) => a - b);
    for (let j = 0; j <= 100; j++) {
      const q = j / 100,
        value = sketch.quantile(q),
        target = Math.max(1, Math.ceil(q * 7));
      assert.ok(
        sorted.indexOf(value) + 1 <= target + 2 && sorted.lastIndexOf(value) + 1 >= target - 2,
      );
    }
  }
});
