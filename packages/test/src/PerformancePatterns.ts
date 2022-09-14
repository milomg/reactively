import { graphPerf, withPerf } from "./PerfUtil";
import { logGraph, makeGraph, runGraph } from "./util/DependencyGraph";
import { ReactiveFramework } from "./util/ReactiveFramework";

export function performanceTests(framework: ReactiveFramework) {
  test("static graph", () => {
    const { graph, counter } = makeGraph(3, 3, 1, framework);
    const sum = runGraph(graph, 2, 1, framework);
    expect(sum).toEqual(16);
    expect(counter.count).toEqual(11);
  });

  test("static graph, read 2/3 of leaves", () => {
    const { counter, graph } = makeGraph(3, 3, 1, framework);
    const sum = runGraph(graph, 10, 2, framework);

    expect(sum).toEqual(71);
    // expect(counter.count).toEqual(41);
  });

  test("dynamic graph", () => {
    const { graph, counter } = makeGraph(4, 2, 2, framework);
    const sum = runGraph(graph, 10, 1, framework);

    expect(sum).toEqual(74);
    expect(counter.count).toEqual(22);
  });

  test("static dependency graph: 10 x 5, 100K iteration", () => {
    const { graph, counter, name } = makeGraph(10, 5, 1, framework);

    const iterations = 100000;
    const sum = graphPerf(graph, name, iterations, 1, framework);
    expect(sum).toEqual(15999840);
    expect(counter.count).toEqual(1400026);
  });

  test("static graph 10 x 10, read 1/5 of leaves, 100K iterations", () => {
    const { graph, counter, name } = makeGraph(10, 10, 1, framework);
    const readNth = 5;
    const iterations = 100000;
    const sum = graphPerf(graph, name, iterations, readNth, framework);
    expect(sum).toEqual(102398976);
    // expect(counter.count).toEqual(3600036); // disabled for solidjs
  });

  test("dynamic graph 10 x 5, 100K iterations", () => {
    const { graph, counter, name } = makeGraph(10, 5, 2, framework);
    const iterations = 100000;
    const sum = graphPerf(graph, name, iterations, 1, framework);
    expect(sum).toEqual(11999955);
    expect(counter.count).toEqual(1250027);
  });

  test("dynamic graph 10 x 10, read 1/5 leaves. 100K iterations", () => {
    const { graph, counter, name } = makeGraph(10, 5, 2, framework);
    const iterations = 100000;
    const readNth = 5;
    const sum = graphPerf(graph, name, iterations, readNth, framework);
    expect(sum).toEqual(2399983);
    // expect(counter.count).toEqual(520016);
  });
}
