# @lp-labs/quantile-sketch

Deterministic Greenwald-Khanna tuple quantile sketch with specified rank error and bounded stream capacity.

Standalone Node.js >=18 package. ESM and CommonJS with separate strict TypeScript declarations. No runtime, peer or sibling dependencies.

## Install

```sh
npm install @lp-labs/quantile-sketch
```

## Example

```js
import { createQuantileSketch } from '@lp-labs/quantile-sketch';
const sketch = createQuantileSketch(0.01, 10000);
for (let i = 0; i < 1000; i++) sketch.add(i);
console.log(sketch.quantile(0.5)); // near median, bounded rank error
console.log(sketch.count, sketch.size);
```

## API, customization, numerical behavior and limits

createQuantileSketch(epsilon=0.01,capacity=1000000) requires epsilon in [0.001,0.25] and integer capacity in [1,1000000]. QuantileSketch.add accepts one finite observation. count is accepted observations; size is retained tuples, not observations. Capacity errors and invalid inputs do not mutate state. Empty quantile queries throw RangeError. quantile(q) requires finite q in [0,1], targets one-based rank r=max(1,ceil(q*count)), and returns an observed value with rank error at most ceil(epsilon*count); for duplicates, the value's occupied rank interval intersects this band. q=0/1 return exact min/max. This is a true GK summary, not sampling: tuples store value, minimum rank increment g and rank uncertainty delta; interior insertion uses max(0,floor(2*epsilon*n)-1), endpoints delta=0, and right-to-left compression merges only when g_left+g_right+delta_right <= floor(2*epsilon*n), preserving the first tuple. The GK rank invariant bounds query uncertainty; the query returns the previous tuple when cumulative g+delta exceeds r+epsilon*n. No value-space error bound is claimed. Binary insertion plus linear array compression is O(S) time per add, query O(S), storage O(S); S is data dependent, at most count, with GK-style sublinear compression for long streams. No serialization, merging, weighted observations or callbacks are supported. Seeded rank-oracle tests cover prefixes, adversarial orders, duplicates and multiple epsilon values.

## Full declarations

```ts
export interface QuantileSketch {
  add(value: number): void;
  quantile(q: number): number;
  readonly count: number;
  readonly size: number;
}
export declare function createQuantileSketch(epsilon?: number, capacity?: number): QuantileSketch;
```

## Development

```sh
npm ci --offline --no-audit --no-fund
npm run build
npm run typecheck
npm test
npm run format:check
```

Tests use Node's built-in runner and include independent or analytic reference cases. No runtime global browser access, I/O or hidden dependencies.

## Support

If this library is useful to you, consider supporting its maintenance with a [donation via PayPal](https://www.paypal.me/LibinPrasanth).

## Author

Created by [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/). Connect on LinkedIn for updates and discussion.
