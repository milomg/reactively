import { HasReactive, reactive } from "@reactively/decorate";
import { Counter, GraphAndCounter, graphName } from "./DependencyGraph";
import { Computed, ReactiveFramework, Signal } from "./ReactiveFramework";
import { reactivelyDecorate } from "./ReactivelyDecorateFramework";

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
  @reactive r0 = 0;
  @reactive r1 = 1;
  @reactive r2 = 2;
  @reactive r3 = 3;
  @reactive r4 = 4;
  @reactive r5 = 5;
  @reactive r6 = 6;
  @reactive r7 = 7;
  @reactive r8 = 8;
  @reactive r9 = 9;
}

class ComputeLayer extends HasReactive implements HasSources {
  source: HasSources;
  layerNumber: number;
  counter: Counter;

  @reactive get r0() {
    this.counter.count++;
    return this.source.r0 + this.source.r1;
  }
  @reactive get r1() {
    this.counter.count++;
    return this.source.r1 + this.source.r2;
  }
  @reactive get r2() {
    this.counter.count++;
    return this.source.r2 + this.source.r3;
  }
  @reactive get r3() {
    this.counter.count++;
    return this.source.r3 + this.source.r4;
  }
  @reactive get r4() {
    this.counter.count++;
    return this.source.r4 + this.source.r5;
  }
  @reactive get r5() {
    this.counter.count++;
    return this.source.r5 + this.source.r6;
  }
  @reactive get r6() {
    this.counter.count++;
    return this.source.r6 + this.source.r7;
  }
  @reactive get r7() {
    this.counter.count++;
    return this.source.r7 + this.source.r8;
  }
  @reactive get r8() {
    this.counter.count++;
    return this.source.r8 + this.source.r9;
  }
  @reactive get r9() {
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
  width: number,
  totalLayers: number,
  staticFraction: number
): GraphAndCounter {
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
  const name = graphName(reactivelyDecorate, width, totalLayers, 1);
  return { graph, counter, name };
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
