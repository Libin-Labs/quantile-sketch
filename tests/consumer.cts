import * as api from '@lp-labs/quantile-sketch';
const sketch: api.QuantileSketch = api.createQuantileSketch(0.01, 100);
sketch.add(1);
const median: number = sketch.quantile(0.5);
const count: number = sketch.count;
const size: number = sketch.size;
void median;
void count;
void size;
// @ts-expect-error Invalid API input must be rejected.
api.createQuantileSketch(0.01).quantile('median');
