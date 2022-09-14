import { graphPerf, withPerf } from "./PerfUtil";
import { runGraph } from "./util/DependencyGraph";
import {
  reactivelyDecorate,
  staticDecorateGraph,
} from "./util/ReactivelyDecorateFramework";

test("decorate test 2 layers", () => {
  const { graph, counter } = staticDecorateGraph(2);
  const sum = runGraph(graph, 1, 1, reactivelyDecorate);

  expect(sum).toEqual(90);
  expect(counter.count).toEqual(10);
});

test("decorate test 3 layers", () => {
  const { graph, counter } = staticDecorateGraph(3);
  const sum = runGraph(graph, 1, 1, reactivelyDecorate);

  expect(sum).toEqual(180);
  expect(counter.count).toEqual(20);
});

test("static graph 10 x 10 read 1/5 of leaves", () => {
  const { graph, counter, name } = staticDecorateGraph(10);

  const iterations = 100000;
  const readNth = 5;
  const sum = graphPerf(graph, name, iterations, readNth, reactivelyDecorate);
  expect(sum).toEqual(102398976);
  expect(counter.count).toEqual(3600036);
});
