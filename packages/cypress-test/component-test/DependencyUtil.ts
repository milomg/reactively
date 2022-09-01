import { $r, ReactiveWrap } from "@reactively/wrap";

export function withPerf<T>(name: string, fn: () => T): T {
  const startName = name + ".start";
  performance.mark(startName);
  const result = fn();
  const time = performance.measure(name, startName);
  cy.log(name, "duration:", time.duration);
  console.log(name, "duration:", time.duration);
  return result;
}

export interface GraphAndCounter {
  graph: ReactiveWrap<number>[][];
  counter:Counter;
}

/**
 * Make a rectangular dependency graph, with an equal number of source elements
 * and computation elements at every layer.
 *
 * @param width number of source elements and number of computed elements per layer
 * @param layers total number of source and computed layers
 * @param dynamicNth every nth computed node is static (1 = all static, 3 = 2/3rd are dynamic)
 * @returns the graph
 */
export function makeGraph(
  width: number,
  layers: number,
  dynamicNth = 1
): GraphAndCounter {
  const sources = new Array(width).fill(0).map((_, i) => $r(i));
  const counter = new Counter();
  const rows = makeDependentRows(sources, layers - 1, counter, dynamicNth);
  const graph = [sources, ...rows];
  return {graph, counter};
}

/**
 * Execute the graph by writing one of the sources and reading some or all of the leaves.
 *
 * @return the sum of all leaf values
 */
export function runGraph(
  graph: ReactiveWrap<number>[][],
  iterations: number,
  readNth = 1
): number {
  const sources = graph[0];
  const leaves = graph[graph.length - 1];
  const nthLeaves = leaves.filter((_, i) => i % readNth === 0);
  for (let i = 0; i < iterations; i++) {
    const sourceDex = i % sources.length;
    sources[sourceDex].set(i + sourceDex);
    nthLeaves.forEach((leaf) => leaf());
  }

  const sum = nthLeaves.reduce((total, leaf) => leaf() + total, 0);
  return sum;
}

export function logGraph(rows: ReactiveWrap<number>[][]): void {
  rows.forEach((row) => {
    console.log(
      row
        .map((elem) => {
          const value = elem();
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
  sources: ReactiveWrap<number>[],
  numRows: number,
  counter: Counter,
  dynamicNth: number
): ReactiveWrap<number>[][] {
  let prevRow = sources;
  const rows = [];
  for (let l = 0; l < numRows; l++) {
    const row = makeRow(prevRow, counter, dynamicNth);
    rows.push(row);
    prevRow = row;
  }
  return rows;
}

function makeRow(
  sources: ReactiveWrap<number>[],
  counter: Counter,
  dynamicNth = 1
): ReactiveWrap<number>[] {
  return sources.map((s, i) => {
    const sourceA = sources[i];
    const sourceIndexB = (i + 1) % sources.length;
    const sourceB = sources[sourceIndexB];
    if (i % dynamicNth === 0) {
      // static node, always reference both sources
      return $r(() => {
        counter.count++;
        return sourceA() + sourceB();
      });
    } else {
      // dynamic node, references 2nd source only if 1st source is even
      const node = $r(() => {
        counter.count++;
        let sum = sourceA() + 1;
        if (sum & 0x1) {
          sum += sourceB();
        }
        return sum;
      });
      (node as any)._dynamic = true; // mark dynamic nodes for logging the graph
      return node;
    }
  });
}