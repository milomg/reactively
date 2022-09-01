import { $r, ReactiveWrap } from "@reactively/wrap";

it("static dependency graph: 10 x 5, 100K iteration", () => {
  const graph = makeGraph(10, 5);

  const sum = withPerf("sg10x5.100K", () => runGraph(graph, 100000));
  expect(sum).equals(15999840);
});

it("static graph", () => {
  const graph = makeGraph(3, 3);
  const sum = runGraph(graph, 10);

  expect(sum).equal(108);
});

it("static graph, read 2/3 of leaves", () => {
  const graph = makeGraph(3, 3);
  const sum = runGraph(graph, 10, 2);

  expect(sum).equal(71);
});

it.only("static graph 10 x 10, read 1/5 of leaves, 100K iterations", () => {
  const graph = makeGraph(10, 10);
  const sum = withPerf("sg10x10/5.100K", () => runGraph(graph, 100000, 5));
  expect(sum).equals(102398976);
});

it("dynamic graph", () => {
  const graph = makeGraph(4, 2, 2);
  const sum = runGraph(graph, 10);
  // logGraph(graph);
  expect(sum).equal(74);
});

it("dynamic graph 10 x 5, 100K iterations", () => {
  const graph = makeGraph(10, 5, 2);
  const sum = withPerf("dynamicGraph", () => runGraph(graph, 100000));
  expect(sum).equals(11999955)
});


/*
TODO 
  count executions
DONE
  perf test with fewer leaf reads
  test with fewer leaf reads
*/

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
  dynamicNth = 1
): ReactiveWrap<number>[][] {
  const sources = new Array(width).fill(0).map((_, i) => $r(i));
  const rows = makeDependentRows(sources, layers - 1, dynamicNth);
  return [sources, ...rows];
}

/**
 * Execute the graph by writing one of the sources and reading some or all of the leaves.
 *
 * @return the sum of all leaf values
 */
function runGraph(graph: ReactiveWrap<number>[][], iterations: number, readNth = 1): number {
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
  dynamicNth: number
): ReactiveWrap<number>[][] {
  let prevRow = sources;
  const rows = [];
  for (let l = 0; l < numRows; l++) {
    const row = makeRow(prevRow, dynamicNth);
    rows.push(row);
    prevRow = row;
  }
  return rows;
}

function makeRow(
  sources: ReactiveWrap<number>[],
  dynamicNth = 1
): ReactiveWrap<number>[] {
  return sources.map((s, i) => {
    const sourceA = sources[i];
    const sourceIndexB = (i + 1) % sources.length;
    const sourceB = sources[sourceIndexB];
    if (i % dynamicNth === 0) {
      // static node, always reference both sources
      return $r(() => sourceA() + sourceB());
    } else {
      // dynamic node, references 2nd source only if 1st source is even
      const node = $r(() => {
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
