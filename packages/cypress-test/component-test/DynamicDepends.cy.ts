import { $r, ReactiveWrap } from "@reactively/wrap";


it("static graph", () => {
  const counter = new Counter();
  const graph = makeGraph(3, 3, counter);
  const sum = runGraph(graph, 10);

  expect(sum).equal(108);
  expect(counter.count).equals(51);
});

it("static graph, read 2/3 of leaves", () => {
  const counter = new Counter();
  const graph = makeGraph(3, 3, counter);
  const sum = runGraph(graph, 10, 2);

  expect(sum).equal(71);
  expect(counter.count).equals(41);
});

it("dynamic graph", () => {
  const counter = new Counter();
  const graph = makeGraph(4, 2, counter, 2);
  const sum = runGraph(graph, 10);

  expect(sum).equal(74);
  expect(counter.count).equal(22);
});

// perf tests 
it("static dependency graph: 10 x 5, 100K iteration", () => {
  const counter = new Counter();
  const graph = makeGraph(10, 5, counter);

  const sum = withPerf("sg10x5.100K", () => runGraph(graph, 100000));
  expect(sum).equals(15999840);
  expect(counter.count).equals(1400026);
});

it("static graph 10 x 10, read 1/5 of leaves, 100K iterations", () => {
  const counter = new Counter();
  const graph = makeGraph(10, 10, counter);
  const sum = withPerf("sg10x10/5.100K", () => runGraph(graph, 100000, 5));
  expect(sum).equals(102398976);
  expect(counter.count).equals(3600036);
});

it("dynamic graph 10 x 5, 100K iterations", () => {
  const counter = new Counter();
  const graph = makeGraph(10, 5, counter, 2);
  const sum = withPerf("dynamicGraph", () => runGraph(graph, 100000));
  expect(sum).equals(11999955);
  expect(counter.count).equals(1250027);
});

// TODO perf test with dynamic graph, read only some leaves
// it("dynamic graph 10 x 10, read 1/5 leaves. 100K iterations", () => {
//   const counter = new Counter();
//   const graph = makeGraph(10, 5, counter, 2);
//   const sum = withPerf("dynamicGraph 10x10 1/5 leaves", () => runGraph(graph, 100000, 5));
//   expect(sum).equals(2399983);
//   expect(counter.count).equals(520016);
// });

function withPerf<T>(name: string, fn: () => T): T {
  const startName = name + ".start";
  performance.mark(startName);
  const result = fn();
  const time = performance.measure(name, startName);
  cy.log(name, "duration:", time.duration);
  console.log(name, "duration:", time.duration);
  return result;
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
function makeGraph(
  width: number,
  layers: number,
  counter:Counter,
  dynamicNth = 1
): ReactiveWrap<number>[][] {
  const sources = new Array(width).fill(0).map((_, i) => $r(i));
  const rows = makeDependentRows(sources, layers - 1, counter, dynamicNth);
  return [sources, ...rows];
}

/**
 * Execute the graph by writing one of the sources and reading some or all of the leaves.
 *
 * @return the sum of all leaf values
 */
function runGraph(
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

function logGraph(rows: ReactiveWrap<number>[][]): void {
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

class Counter {
  count = 0;
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
