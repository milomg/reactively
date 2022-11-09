import { runGraph } from "./DependencyGraph";
import { allTests, TestConfig, TestWithFramework } from "./PerfConfigurations";

/* A table driven set of performance tests:
 * . can be run against multiple reactive frameworks (solid, reactively, etc.)
 * . can run inside jest or cypress
 */

/** wrapper for running a performance test on cypresss or jest  */
export interface TestLib {
  withPerf: <T>(name: string, times:number, fn: () => T) => T;
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
  const { width, totalLayers: l, staticNth, readNth, iterations } = config;
  const fm = perfFramework.framework.name.padEnd(20);

  return `${fm} | ${width}x${l} s=${staticNth} i=${iterations} r=${readNth}`;
}

function runTest(
  name: string,
  test: TestWithFramework,
  testLib: TestLib
): TestResult {
  testLib.collectGarbage();

  const { config, perfFramework } = test;
  const { makeGraph, framework } = perfFramework;
  const { width, totalLayers, staticNth, readNth, iterations } = config;

  function warmup() {
    const warmupIterations = 100;
    const warmupReadNth = 1;
    const { graph } = makeGraph(width, totalLayers, staticNth);
    runGraph(graph, warmupIterations, warmupReadNth, framework);
  }
  warmup();
  warmup();
  testLib.optimizeFunctionOnNextCall(runGraph);
  warmup();

  const { graph, counter } = makeGraph(width, totalLayers, staticNth);
  return testLib.withPerf(name, 10, () => {
    counter.count = 0;
    // resetDebugCounts();
    const sum = runGraph(graph, iterations, readNth, framework);
    // reportDebugCounts();
    return { sum, count: counter.count };
  });
}
