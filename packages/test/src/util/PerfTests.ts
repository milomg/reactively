import { runGraph } from "./DependencyGraph";
import { allTests, TestConfig, TestWithFramework } from "./PerfConfigurations";

/* A table driven set of performance tests:
 * . can be run against multiple reactive frameworks (solid, reactively, etc.)
 * . can run inside jest or cypress
 */

/** wrapper for running a performance test on cypresss or jest  */
export interface TestLib {
  withPerf: <T>(name: string, times: number, fn: () => T) => T;
  collectGarbage: () => void;
  optimizeFunctionOnNextCall: (fn: Function) => void;
}

/** runnable test with confguration info */
export interface PerfTest {
  name: string;
  run: () => TestResult;
  testPullCounts: boolean;
  config: TestConfig;
}

/** return all configured performance tests in a form easy to map to a test runner */
export function perfTests(testLib: TestLib): PerfTest[] {
  return allTests.map((test) => {
    const name = testName(test);
    const run = () => runTest(name, test, testLib);

    const testPullCounts = test.perfFramework.testPullCounts;
    const { config } = test;
    return { name, run, testPullCounts, config };
  });
}

export interface TestResult {
  sum?: number;
  count?: number;
}

function testName(test: TestWithFramework): string {
  const { config, perfFramework } = test;
  const { width, totalLayers: l, staticFraction, readNth, iterations } = config;
  const fm = perfFramework.framework.name.padEnd(20);

  const widthStr = `${width}x${l}`.padEnd(8, " ");
  const iterStr = `i=${iterations}`.padStart(8, " ");
  const readStr = `r=${readNth}`.padStart(4, " ");
  const staticStr = `s=${staticFraction}`.padStart(6, " ");
  const nameStr = (test.config.name || "").slice(0, 20).padStart(20, " ");
  return `${fm} | ${widthStr} ${staticStr} ${readStr} ${iterStr} ${nameStr}`;
}

function runTest(
  name: string,
  test: TestWithFramework,
  testLib: TestLib
): TestResult {
  testLib.collectGarbage();

  const { config, perfFramework } = test;
  const { makeGraph, framework } = perfFramework;
  const { width, totalLayers, staticFraction, readNth, iterations, nSources } = config;

  function warmup() {
    const warmupIterations = 100;
    const warmupReadNth = 1;
    const { graph } = makeGraph(width, totalLayers, staticFraction, nSources);
    runGraph(graph, warmupIterations, warmupReadNth, framework);
  }
  warmup();
  warmup();
  testLib.optimizeFunctionOnNextCall(runGraph);
  warmup();

  const { graph, counter } = makeGraph(width, totalLayers, staticFraction, nSources);
  const testRepeats = 8;
  return testLib.withPerf(name, testRepeats, () => {
    counter.count = 0;
    // resetDebugCounts();
    const sum = runGraph(graph, iterations, readNth, framework);
    // reportDebugCounts();
    return { sum, count: counter.count };
  });
}
