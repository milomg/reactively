import { getConsoleOutput } from "@jest/console";
import { Computed, ReactiveFramework, Signal } from "./ReactiveFramework";

export interface Graph {
  sources: Signal<number>[];
  layers: Computed<number>[][];
}

export interface GraphAndCounter {
  graph: Graph;
  counter: Counter;
  name: string;
}

/**
 * Make a rectangular dependency graph, with an equal number of source elements
 * and computation elements at every layer.
 *
 * @param width number of source elements and number of computed elements per layer
 * @param totalLayers total number of source and computed layers
 * @param staticFraction every nth computed node is static (1 = all static, 3 = 2/3rd are dynamic)
 * @returns the graph
 */
export function makeGraph(
  width: number,
  totalLayers: number,
  staticFraction = 1,
  nSources = 2,
  framework: ReactiveFramework
): GraphAndCounter {
  return framework.withBuild(() => {
    const sources = new Array(width).fill(0).map((_, i) => framework.signal(i));
    const counter = new Counter();
    const rows = makeDependentRows(
      sources,
      totalLayers - 1,
      counter,
      staticFraction,
      nSources,
      framework
    );
    const graph = { sources, layers: rows };
    const name = graphName(framework, width, totalLayers, staticFraction);
    // logGraph(graph);
    return { graph, counter, name };
  });
}

export function graphName(
  framework: ReactiveFramework,
  width: number,
  totalLayers: number,
  staticFraction: number
): string {
  return `${framework.name.padEnd(
    20
  )} | ${totalLayers}x${width} s=${staticFraction}`;
}

/**
 * Execute the graph by writing one of the sources and reading some or all of the leaves.
 *
 * @return the sum of all leaf values
 */
export function runGraph(
  graph: Graph,
  iterations: number,
  readNth = 1,
  framework: ReactiveFramework
): number {
  const { sources, layers } = graph;
  const leaves = layers[layers.length - 1];
  const nthLeaves = leaves.filter((_, i) => i % readNth === 0);
  for (let i = 0; i < iterations; i++) {
    // console.log("writing signals");
    framework.withBatch(() => {
      const sourceDex = i % sources.length;
      sources[sourceDex].write(i + sourceDex);
    });
    // console.log("reading nth leaves");
    nthLeaves.forEach((leaf) => {
      // console.log("reading leaf", "layer:", leaf.layer.layerNumber);
      leaf.read();
    });
  }

  // console.log("summing all leaves");
  const sum = nthLeaves.reduce((total, leaf) => leaf.read() + total, 0);
  return sum;
}

export function logGraph(graph: Graph): void {
  const rows = [graph.sources, ...graph.layers];
  rows.forEach((row) => {
    console.log(
      row
        .map((elem) => {
          const value = elem.read();
          const dynamic = (elem as any)._dynamic ? "*" : "";
          return `${value}${dynamic}`;
        })
        .join(" ")
    );
  });
}

export class Counter {
  count = 0;
}

function makeDependentRows(
  sources: Computed<number>[],
  numRows: number,
  counter: Counter,
  staticFraction: number,
  nSources: number,
  framework: ReactiveFramework
): Computed<number>[][] {
  let prevRow = sources;
  const rows = [];
  for (let l = 0; l < numRows; l++) {
    const row = makeRow(prevRow, counter, staticFraction, nSources, framework, l);
    rows.push(row);
    prevRow = row;
  }
  return rows;
}

function makeRow(
  sources: Computed<number>[],
  counter: Counter,
  staticFraction: number,
  nSources: number,
  framework: ReactiveFramework,
  layer: number
): Computed<number>[] {
  return sources.map((_, myDex) => {
    const mySourceIndices = [];
    for (let sourceDex = 0; sourceDex < nSources; sourceDex++) {
      mySourceIndices.push((myDex + sourceDex) % sources.length);
    }
    const mySources = mySourceIndices.map((i) => sources[i]);
    const staticNode = (myDex / sources.length) < staticFraction;
    if (staticNode) {
      // static node, always reference sources
      return framework.computed(() => {
        counter.count++;

        let sum = 0;
        for (const src of mySources) {
          sum += src.read();
        }
        // mySources.forEach((s) => s.read()); // causes stack overflow
        return sum;
      });
    } else {
      // dynamic node, drops one of the sources depending on the value of the first element
      const node = framework.computed(() => {
        counter.count++;
        const first = mySources[0].read();
        let toRead: Computed<number>[];
        if (first & 0x1) {
          const drop = first % mySources.length;
          toRead = mySources.filter((_, i) => i !== drop);
        } else {
          toRead = mySources;
        }
        const sum = toRead.reduce((total, s) => s.read() + total, 0);
        return sum;
      });
      (node as any)._dynamic = true; // mark dynamic nodes for logging the graph
      return node;
    }
  });
}
