import { $r, ReactiveWrap } from "@reactively/wrap";

it.only("static graph: 10 x 5 deep, many times", () => {
  const graph = makeGraph(10, 5);

  const startName = "sg5x3.10.start";
  performance.mark(startName);
  const sum = runGraph(graph, 100000);
  const time = performance.measure("sg5x3.10", startName);
  console.log("sum:", sum);
  console.log("duration:", time.duration);
});

it("static graph", () => {
  const graph = makeGraph(3, 3);
  const sum = runGraph(graph, 10);

  expect(sum).equal(108);
});

function makeGraph(
  elemsPerLayer: number,
  layers: number
): ReactiveWrap<number>[][] {
  const sources = new Array(elemsPerLayer).fill(0).map((_, i) => $r(i));
  const rows = makeDependentRows(sources, layers - 1);
  return [sources, ...rows];
}

function runGraph(graph: ReactiveWrap<number>[][], iterations: number): number {
  const sources = graph[0];
  const leaves = graph[graph.length - 1];
  for (let i = 0; i < iterations; i++) {
    const sourceDex = i % sources.length;
    sources[sourceDex].set(i + sourceDex);
    leaves.forEach((leaf) => leaf());
  }

  const sum = leaves.reduce((total, elem) => elem() + total, 0);
  return sum;
}

function logGraph(rows: ReactiveWrap<number>[][]): void {
  rows.forEach((row) => {
    console.log(row.map((row) => row()).join(" "));
  });
}

function makeDependentRows(
  sources: ReactiveWrap<number>[],
  numRows: number
): ReactiveWrap<number>[][] {
  let prevRow = sources;
  const rows = [];
  for (let l = 0; l < numRows; l++) {
    const row = makeRow(prevRow);
    rows.push(row);
    prevRow = row;
  }
  return rows;
}

function makeRow(sources: ReactiveWrap<number>[]): ReactiveWrap<number>[] {
  return sources.map((s, i) => {
    const sourceA = sources[i];
    const sourceIndexB = (i + 1) % sources.length;
    const sourceB = sources[sourceIndexB];
    return $r(() => sourceA() + sourceB());
  });
}
