import v8 from "v8-natives";
import { withPerf } from "../../test/src/PerfUtil";
import { perfTests } from "../../test/src/util/PerfTests";

const tests = perfTests({
  withPerf,
  collectGarbage: v8.collectGarbage,
  optimizeFunctionOnNextCall: v8.optimizeFunctionOnNextCall,
});

tests.forEach(({ name, run, config, testPullCounts }) => {
  const result = run();
  const { expected } = config;
  if (expected.sum) {
    console.assert(result.sum == expected.sum);
  }
  if (expected.count && (config.readNth === 1 || testPullCounts)) {
    console.assert(result.count === expected.count);
  }
});
