import { runGraph } from "./DependencyGraph";
import { allTests, TestConfig, TestWithFramework } from "./PerfConfigurations";
import { TimedResult } from "./PerfUtil";

/* A table driven set of performance tests:
 * . can be run against multiple reactive frameworks (solid, reactively, etc.)
 * . can run inside jest or cypress
 */

/** wrapper for running a performance test on cypresss or jest  */
export interface TestLib {
  withPerf: <T>(name: string, times: number, fn: () => T) => Promise<TimedResult<T>>;
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
// export function perfTests(testLib: TestLib): PerfTest[] {
//   return allTests.map((test) => {
//     const name = testName(test);
//     const run = () => runTest(name, test, testLib);

//     const testPullCounts = test.perfFramework.testPullCounts;
//     const { config } = test;
//     return { name, run, testPullCounts, config };
//   });
// }

export type TimedTestResult = TimedResult<TestResult> 

export interface TestResult {
  sum?: number;
  count?: number;
}

export function testName(test: TestWithFramework): string {
  const { config, perfFramework } = test;
  // prettier-ignore
  const { width, totalLayers, staticFraction, nSources, readFraction, iterations } = config;
  const fmName = perfFramework.framework.name.padEnd(20);

  const widthStr = `${width}x${totalLayers}`.padEnd(8, " ");
  const sourcesStr = `n=${nSources}`.padStart(4, " ");
  const readStr = `r=${readFraction}`.padStart(6, " ");
  const staticStr = `s=${staticFraction}`.padStart(6, " ");
  const iterStr = `i=${iterations}`.padStart(8, " ");
  const nameStr = (test.config.name || "").slice(0, 20).padStart(20, " ");
  return `${fmName} | ${widthStr} ${sourcesStr} ${staticStr} ${readStr} ${iterStr} ${nameStr}`;
}

// function runTest(
//   name: string,
//   testWithFramework: TestWithFramework,
//   testLib: TestLib
// ): TimedTestResult {
//   testLib.collectGarbage();

//   const { config, perfFramework } = testWithFramework;
//   const { makeGraph, framework } = perfFramework;
//   // prettier-ignore
//   const { readFraction, iterations } = config;

//   testLib.optimizeFunctionOnNextCall(runGraph);

//   const { graph, counter } = makeGraph(testWithFramework);
//   const testRepeats = 8;
//   return testLib.withPerf(name, testRepeats, () => {
//     counter.count = 0;
//     const sum = runGraph(graph, iterations, readFraction, framework);
//     return { sum, count: counter.count };
//   });
// }
