import { HasReactive, reactively } from "@reactively/decorate";
import { TestWithFramework } from "./AllPerfTests";
import { Counter, GraphAndCounter } from "./DependencyGraph";
import { Computed, Signal } from "./ReactiveFramework";

interface HasSources {
  layerNumber: number;
  readonly r0: number;
  readonly r1: number;
  readonly r2: number;
  readonly r3: number;
  readonly r4: number;
  readonly r5: number;
  readonly r6: number;
  readonly r7: number;
  readonly r8: number;
  readonly r9: number;
}

class Sources extends HasReactive implements HasSources {
  source: HasSources = this;
  layerNumber = 0;
  @reactively r0 = 0;
  @reactively r1 = 1;
  @reactively r2 = 2;
  @reactively r3 = 3;
  @reactively r4 = 4;
  @reactively r5 = 5;
  @reactively r6 = 6;
  @reactively r7 = 7;
  @reactively r8 = 8;
  @reactively r9 = 9;
}

class ComputeLayer extends HasReactive implements HasSources {
  source: HasSources;
  layerNumber: number;
  counter: Counter;

  @reactively get r0() {
    this.counter.count++;
    return this.source.r0 + this.source.r1;
  }
  @reactively get r1() {
    this.counter.count++;
    return this.source.r1 + this.source.r2;
  }
  @reactively get r2() {
    this.counter.count++;
    return this.source.r2 + this.source.r3;
  }
  @reactively get r3() {
    this.counter.count++;
    return this.source.r3 + this.source.r4;
  }
  @reactively get r4() {
    this.counter.count++;
    return this.source.r4 + this.source.r5;
  }
  @reactively get r5() {
    this.counter.count++;
    return this.source.r5 + this.source.r6;
  }
  @reactively get r6() {
    this.counter.count++;
    return this.source.r6 + this.source.r7;
  }
  @reactively get r7() {
    this.counter.count++;
    return this.source.r7 + this.source.r8;
  }
  @reactively get r8() {
    this.counter.count++;
    return this.source.r8 + this.source.r9;
  }
  @reactively get r9() {
    this.counter.count++;
    return this.source.r9 + this.source.r0;
  }

  constructor(source: HasSources, layerNumber: number, counter: Counter) {
    super();
    this.source = source;
    this.layerNumber = layerNumber;
    this.counter = counter;
  }
}
export const debugLayers: ComputeLayer[] = [];

export function makeDecoratedGraph(
  frameworkTest: TestWithFramework
): GraphAndCounter {
  const { width, totalLayers } = frameworkTest.config;
  const counter = new Counter();
  const sources = new Sources();

  const signals = Array.from({ length: width }).map((_, i) =>
    signalWrapper(sources, i)
  );

  const layers: Computed<number>[][] = [];
  let prevLayer = sources;

  for (let i = 1; i < totalLayers; i++) {
    const compLayer = new ComputeLayer(prevLayer, i, counter);
    debugLayers.push(compLayer);
    const layer = Array.from({ length: width }).map((_, i) =>
      computedWrapper(compLayer, i)
    );
    layers.push(layer);
    prevLayer = compLayer;
  }

  const graph = { sources: signals, layers };
  return { graph, counter };
}

function signalWrapper(sources: Sources, i: number): Signal<number> {
  const index = `r${i}` as "r0" | "r1";
  const sig: Signal<number> = {
    read: () => sources[index] as number,
    write: (v: number) => (sources[index] = v),
  };
  return sig;
}

function computedWrapper(sources: HasSources, i: number): Computed<number> {
  const index = `r${i}` as keyof HasSources;
  const computed: Computed<number> = {
    read: () => sources[index],
  };
  return computed;
}
