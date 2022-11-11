import { Graph, runGraph } from "../../test/src/util/DependencyGraph";
import { ReactiveFramework } from "../../test/src/util/ReactiveFramework";

export function withPerf<T>(name: string, times: number, fn: () => T): T {
  const startName = name + ".start";
  performance.mark(startName);
  const result = fn();
  const time = performance.measure(name, startName);
  const msg = `${name} time: ${time.duration}`;
  cy.log(msg);
  console.log(msg);
  return result;
}

export interface GraphTestResult {
  name: string;
  sum: number;
}

export function graphPerf(
  graph: Graph,
  graphName: string,
  iterations: number,
  readFraction: number,
  framework: ReactiveFramework
): GraphTestResult {
  const name = `${graphName} i=${iterations} r=${readFraction}`;
  const sum = withPerf(name, 1, () =>
    runGraph(graph, iterations, readFraction, framework)
  );
  return { name, sum };
}
