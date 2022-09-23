import v8 from "v8-natives";
import { withPerfLog } from "../../test/src/PerfUtil";
import { promiseDelay } from "../../test/src/util/AsyncUtil";
import { PerfTest, perfTests } from "../../test/src/util/PerfTests";
import { GarbageTrack } from "./GarbageTracking";

const tests = perfTests({
  withPerf,
  collectGarbage: v8.collectGarbage,
  optimizeFunctionOnNextCall: v8.optimizeFunctionOnNextCall,
});

const gcTrack = new GarbageTrack();
function withPerf<T>(name: string, fn: () => T): T {
  return withPerfLog(name, () => {
    return gcTrack.watch(name, fn);
  });
}

const asyncTests = tests.map(async (test) => {
  runTest(test);
  await promiseDelay(10); // leave time to run deferred items
});

async function main() {
  await Promise.all(asyncTests);
  await gcTrack.report();
}

main();

function runTest(test: PerfTest) {
  const { run, config, testPullCounts } = test;
  const result = run();
  const { expected } = config;

  if (expected.sum) {
    console.assert(result.sum == expected.sum);
  }
  if (expected.count && (config.readNth === 1 || testPullCounts)) {
    console.assert(result.count === expected.count);
  }
}
