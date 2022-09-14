import { makeGraph, runGraph } from "../../test/src/util/DependencyGraph";
import { ReactiveFramework } from "./../../test/src/util/ReactiveFramework";
import { reactivelyWrap } from "./../../test/src/util/ReactivelyWrapFramework";
import { withPerf } from "./CypressPerfUtil";

performanceTest(reactivelyWrap);

function performanceTest(framework: ReactiveFramework) {
  it("static dependency graph: 10 x 5, 100K iteration", () => {
    const { graph, counter } = makeGraph(10, 5, 1, framework);

    const sum = withPerf("sg10x5.100K", () =>
      runGraph(graph, 100000, 1, framework)
    );
    expect(sum).equals(15999840);
    expect(counter.count).equals(1400026);
  });

  it("static graph 10 x 10, read 1/5 of leaves, 100K iterations", () => {
    const { graph, counter } = makeGraph(10, 10, 1, framework);
    const sum = withPerf("sg10x10/5.100K", () =>
      runGraph(graph, 100000, 5, framework)
    );
    expect(sum).equals(102398976);
    expect(counter.count).equals(3600036);
  });

  it("dynamic graph 10 x 5, 100K iterations", () => {
    const { graph, counter } = makeGraph(10, 5, 2, framework);
    const sum = withPerf("dynamicGraph", () =>
      runGraph(graph, 100000, 1, framework)
    );
    expect(sum).equals(11999955);
    expect(counter.count).equals(1250027);
  });

  it("dynamic graph 10 x 10, read 1/5 leaves. 100K iterations", () => {
    const { graph, counter } = makeGraph(10, 5, 2, framework);
    const sum = withPerf("dynamicGraph 10x10 1/5 leaves", () =>
      runGraph(graph, 100000, 5, framework)
    );
    expect(sum).equals(2399983);
    expect(counter.count).equals(520016);
  });
}
