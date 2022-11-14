import v8 from "v8-natives";
import { TestWithFramework } from "../../test/src/util/AllPerfTests";
import { runGraph } from "../../test/src/util/DependencyGraph";
import { testName } from "../../test/src/util/PerfTests";
import { runTimed } from "../../test/src/util/PerfUtil";
import { GarbageTrack } from "./GarbageTracking";

const gcTrack = new GarbageTrack();

export interface TimedResult<T> {
  result: T;
  timing: TestTiming;
}

export interface TestTiming {
  time: number;
  gcTime?: number;
}

export async function benchmarkTest(
  frameworkTest: TestWithFramework,
  testRepeats = 5
): Promise<void> {
  const { testPullCounts } = frameworkTest.perfFramework;
  const { config, perfFramework } = frameworkTest;
  const { framework } = perfFramework;
  const { expected, iterations, readFraction } = config;
  const name = testName(frameworkTest);

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

  const timeStr = timedResult.timing.time.toFixed(2).padStart(8, " ");
  const gcTime = timedResult.timing.gcTime?.toFixed(2).padStart(8, " ");
  const rate = (timedResult.result.count / timedResult.timing.time).toFixed(0);
  console.log(`${name} , ${timeStr} , ${gcTime} , ${rate}`);

  const { result } = timedResult;

  if (expected.sum) {
    console.assert(
      result.sum == expected.sum,
      `sum ${name} result:${result.sum} expected:${expected.sum}`
    );
  }
  if (expected.count && (config.readFraction === 1 || testPullCounts)) {
    console.assert(
      result.count === expected.count,
      `count ${name} result:${result.count} expected:${expected.count}`
    );
  }
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
  const fastest = results
    .slice(1)
    .reduce((a, b) => (a.timing.time < b.timing.time ? a : b), results[0]);

  return fastest;
}

/** run a function, reporting the wall clock time and garbage collection time. */
async function runTracked<T>(fn: () => T): Promise<TimedResult<T>> {
  v8.collectGarbage();
  const { result: wrappedResult, trackId } = gcTrack.watch(() => runTimed(fn));
  const gcTime = await gcTrack.oneResult(trackId);
  const { result, time } = wrappedResult;
  // console.log("trackId", trackId, " gcTime", gcTime, " time:", time);
  return { result, timing: { time, gcTime } };
}
