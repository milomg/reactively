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