import { Counter, runGraph, makeGraph, withPerf } from "./DependencyUtil";


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

it("dynamic graph 10 x 10, read 1/5 leaves. 100K iterations", () => {
  const counter = new Counter();
  const graph = makeGraph(10, 5, counter, 2);
  const sum = withPerf("dynamicGraph 10x10 1/5 leaves", () => runGraph(graph, 100000, 5));
  expect(sum).equals(2399983);
  expect(counter.count).equals(520016);
});

