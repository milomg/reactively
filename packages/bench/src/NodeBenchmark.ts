import { TestResult } from "./../../test/src/util/PerfTests";
import v8 from "v8-natives";
import { TestWithFramework } from "../../test/src/util/AllPerfTests";
import { runGraph } from "../../test/src/util/DependencyGraph";
import { testName, configRowStrings } from "../../test/src/util/PerfTests";
import { runTimed } from "../../test/src/util/PerfUtil";
import { GarbageTrack } from "./GarbageTracking";

export interface TimedResult<T> {
  result: T;
  timing: TestTiming;
}

export interface TestTiming {
  time: number;
  gcTime?: number;
}

/** benchmark a single test under single framework.
 * The test is run multiple times and the fastest result is logged to the console.
 */
export async function benchmarkTest(
  frameworkTest: TestWithFramework,
  testRepeats = 5
): Promise<void> {
  const { testPullCounts } = frameworkTest.perfFramework;
  const { config, perfFramework } = frameworkTest;
  const { framework } = perfFramework;
  const { expected, iterations, readFraction } = config;

  const { graph, counter } = perfFramework.makeGraph(frameworkTest);

  function runOnce(): number {
    return runGraph(graph, iterations, readFraction, framework);
  }

  // warm up
  v8.optimizeFunctionOnNextCall(runOnce);
  runOnce();

  const timedResult = await fastestTest(testRepeats, () => {
    counter.count = 0;
    const sum = runOnce();
    return { sum, count: counter.count };
  });

  logTestResult(frameworkTest, timedResult);

  const { result } = timedResult;

  if (expected.sum) {
    console.assert(
      result.sum == expected.sum,
      `sum ${framework.name} ${config.name} result:${result.sum} expected:${expected.sum}`
    );
  }
  if (expected.count && (config.readFraction === 1 || testPullCounts)) {
    console.assert(
      result.count === expected.count,
      `count ${framework.name} ${config.name} result:${result.count} expected:${expected.count}`
    );
  }
}

function logTestResult(
  test: TestWithFramework,
  timedResult: TimedResult<TestResult>
): void {
  const configRow = configRowStrings(test);
  const timingRow = timingRowStrings(timedResult);
  const row = {...configRow, ...timingRow};
  const line = Object.values(row).join(" , ");
  console.log(line);
}

export interface TimingRowStrings {
  time: string;
  gcTime: string;
  updateRate: string;
}

function timingRowStrings(timed: TimedResult<TestResult>): TimingRowStrings {
  const time = timed.timing.time.toFixed(2).padStart(8, " ");
  const gcTime = timed.timing.gcTime!.toFixed(2).padStart(8, " ");
  const updateRate = (timed.result.count! / timed.timing.time).toFixed(0);

  return { time, gcTime, updateRate };
}

/** benchmark a function n times, returning the fastest result and associated timing */
async function fastestTest<T>(
  times: number,
  fn: () => T
): Promise<TimedResult<T>> {
  const results: TimedResult<T>[] = [];
  for (let i = 0; i < times; i++) {
    const run = await runTracked(fn);
    results.push(run);
  }
  const fastest = results.reduce((a, b) =>
    a.timing.time < b.timing.time ? a : b
  );

  return fastest;
}

/** run a function, reporting the wall clock time and garbage collection time. */
async function runTracked<T>(fn: () => T): Promise<TimedResult<T>> {
  v8.collectGarbage();
  const gcTrack = new GarbageTrack();
  const { result: wrappedResult, trackId } = gcTrack.watch(() => runTimed(fn));
  const gcTime = await gcTrack.gcDuration(trackId);
  const { result, time } = wrappedResult;
  // console.log("trackId", trackId, " gcTime", gcTime, " time:", time);
  gcTrack.destroy();
  return { result, timing: { time, gcTime } };
}
