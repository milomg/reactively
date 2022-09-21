import { ReactiveFramework } from "./util/ReactiveFramework";
import { Graph, runGraph } from "./util/DependencyGraph";

// TBD
export function withPerf<T>(name: string, fn: () => T): T {
  const start = performance.now();
  const result = fn();
  const diff = performance.now() - start;
  console.log(name, "time:", diff);
  return result;
}

export function graphPerf(
  graph: Graph,
  graphName: string,
  iterations: number,
  readNth: number,
  framework: ReactiveFramework
): number {
  const perfName = `${graphName} i=${iterations} r=${readNth}`;
  return withPerf(perfName, () =>
    runGraph(graph, iterations, readNth, framework)
  );
}
