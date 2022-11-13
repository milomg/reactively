import { TestWithFramework } from "./../../test/src/util/PerfConfigurations";
import v8 from "v8-natives";
import { mapN } from "../../test/src/util/Iterate";
import { allTests } from "../../test/src/util/PerfConfigurations";
import { PerfTest, testName } from "../../test/src/util/PerfTests";
import { runTimed } from "../../test/src/util/PerfUtil";
import { GarbageTrack } from "./GarbageTracking";
import { makeGraph, runGraph } from "../../test/src/util/DependencyGraph";
import { ReadableStreamDefaultController } from "stream/web";

const gcTrack = new GarbageTrack();

export interface TimedResult<T> {
  result: T;
  timing: TestTiming;
}

export interface TestTiming {
  time: number;
  gcTime?: number;
}

async function fastestTest<T>(
  name: string,
  times: number,
  fn: () => T
): Promise<TimedResult<T>> {
  const asyncResults = mapN(times, async () => {
    v8.collectGarbage();
    const { result, time } = gcTrack.watch(name, () => runTimed(fn));
    const gcTime = await gcTrack.oneResult(name);
    return { result, timing: { time, gcTime } };
  });
  const results = await Promise.all(asyncResults);
  const fastest = results
    .slice(1)
    .reduce((a, b) => (a.timing.time < b.timing.time ? a : b), results[0]);
  return fastest;
}

const asyncTests = allTests.map(async (frameworkTest) => {
  runTest(frameworkTest);
});

async function main() {
  await Promise.all(asyncTests);
}

main();

async function runTest(frameworkTest: TestWithFramework): Promise<void> {
  const { testPullCounts } = frameworkTest.perfFramework;
  const { config, perfFramework } = frameworkTest;
  const { framework } = perfFramework;
  const { expected, iterations, readFraction } = config;
  const name = testName(frameworkTest);


  const testRepeats = 5;
  const { graph, counter } = perfFramework.makeGraph(frameworkTest);

  function runOnce():number {
    return runGraph(graph, iterations, readFraction, framework);
  }

  v8.optimizeFunctionOnNextCall(runOnce);
  runOnce();

  const timedResult = await fastestTest(name, testRepeats, () => {
    counter.count = 0;
    const sum = runOnce();
    return { sum, count: counter.count };
  });

  const timeStr = timedResult.timing.time.toFixed(2).padStart(8, " ");
  const gcTime = timedResult.timing.gcTime?.toFixed(2).padStart(8, " ");
  const rate = (timedResult.result.count / timedResult.timing.time).toFixed(0);
  console.log(`${name} | ${timeStr} | ${gcTime} | ${rate}`);

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
