import { TestWithFramework } from "./AllPerfTests";
import { TestConfig } from "./PerfConfigurations";
import { TimedResult } from "./PerfUtil";

/* A table driven set of performance tests:
 * . can be run against multiple reactive frameworks (solid, reactively, etc.)
 * . can run inside jest or cypress
 */

/** wrapper for running a performance test on cypresss or jest  */
export interface TestLib {
  withPerf: <T>(
    name: string,
    times: number,
    fn: () => T
  ) => Promise<TimedResult<T>>;
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

export interface TestResult {
  sum: number;
  count: number;
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
  return `${fmName} , ${widthStr} ${sourcesStr} ${staticStr} ${readStr} ${iterStr} , ${nameStr}`;
}

export interface TimingResult<T> {
  result: T;
  timing: TestTiming;
}

export interface TestTiming {
  time: number;
  gcTime?: number;
}

export function logTestResult(
  test: TestWithFramework,
  timedResult: TimingResult<TestResult>
): void {
  const row = testRowStrings(test, timedResult);
  const line = Object.values(row).join(" , ");
  console.log(line);
}

export function logTestResultHeaders(): void {
  const row = testReportHeaders();
  const line = Object.values(row).join(" , ");
  console.log(line);
}

export interface PerfRowStrings {
  framework: string;
  size: string;
  nSources: string;
  "read%": string;
  "static%": string;
  nTimes: string;
  test: string;
  time: string;
  gcTime: string;
  updateRate: string;
}

const columnWidth = {
  framework: 20,
  size: 8,
  nSources: 8,
  "read%": 5,
  "static%": 6,
  nTimes: 6,
  test: 20,
  time: 8,
  gcTime: 6,
  updateRate: 10,
};

function testReportHeaders(): PerfRowStrings {
  const keys: (keyof PerfRowStrings)[] = Object.keys(columnWidth) as any;
  const kv = keys.map((key) => [key, key]);
  const untrimmed = Object.fromEntries(kv);
  return trimColumns(untrimmed);
}

function testRowStrings(
  test: TestWithFramework,
  timed: TimingResult<TestResult>
): PerfRowStrings {
  const { config, perfFramework } = test;
  // prettier-ignore
  const { width, totalLayers, staticFraction, nSources, readFraction, iterations } = config;
  const time = timed.timing.time.toFixed(2);
  const rawGC = timed.timing.gcTime || 0;
  const gcTime = rawGC.toFixed(2);
  const updateRate = (timed.result.count! / timed.timing.time).toFixed(0);

  const untrimmed = {
    framework: perfFramework.framework.name,
    size: `${width}x${totalLayers}`,
    nSources: `${nSources}`,
    "read%": `${readFraction}`,
    "static%": `${staticFraction}`,
    nTimes: `${iterations}`,
    test: test.config.name || "",
    time,
    gcTime,
    updateRate,
  };
  return trimColumns(untrimmed);
}

function trimColumns(row: PerfRowStrings): PerfRowStrings {
  const keys: (keyof PerfRowStrings)[] = Object.keys(row) as any;
  const trimmed = { ...row };
  const e = keys.map((key) => {
    const length = columnWidth[key];
    const value = row[key].slice(0, length).padEnd(length);
    trimmed[key] = value;
  });
  return trimmed;
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
