import { makePerfList } from "../../test/src/util/AllPerfTests";
import { withPerf } from "./CypressPerfUtil";

// const tests = perfTests({
//   withPerf,
//   collectGarbage: () => {},
//   optimizeFunctionOnNextCall: () => {},
// });

const f = makePerfList({});

// tests.forEach(({ name, run, config, testPullCounts }) => {
//   it(name, () => {
//     const result = run();
//     const { expected } = config;

//     if (expected.sum) {
//       expect(result.sum).equals(expected.sum);
//     }
//     if (expected.count && (config.readFraction === 1 || testPullCounts)) {
//       expect(result.count).equals(expected.count);
//     }
//   });
// });
