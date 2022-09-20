import { withPerf } from "./PerfUtil";
import { perfTests } from "./util/PerfTests";

const tests = perfTests({ withPerf });
tests.forEach(({ name, run, config, testPullCounts }) => {
  it(name, () => {
    const result = run();
    const { expected } = config;
    expect(result.sum).toEqual(expected.sum);
    if (config.readNth === 1 || testPullCounts) {
      expect(result.count).toEqual(expected.count);
    }
  });
});
