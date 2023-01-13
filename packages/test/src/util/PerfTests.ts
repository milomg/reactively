import { TestWithFramework } from "./AllPerfTests";

export interface TestResult {
  sum: number;
  count: number;
}

export interface TimingResult<T> {
  result: T;
  timing: TestTiming;
}

export interface TestTiming {
  time: number;
  gcTime?: number;
}

export function verifyBenchResult(
  frameworkTest: TestWithFramework,
  timedResult: TimingResult<TestResult>
): void {
  const { perfFramework } = frameworkTest;
  const { testPullCounts, framework } = perfFramework;
  const { config } = frameworkTest;
  const { expected } = config;
  const { result } = timedResult;

  // console.log(result);
  if (expected.sum) {
    console.assert(
      result.sum == expected.sum,
      `sum ${framework.name} ${config.name} result:${result.sum} expected:${expected.sum}`
    );
  }
  // not working at the moment
  // if (expected.count && (config.readFraction === 1 || testPullCounts)) {
  //   console.assert(
  //     result.count === expected.count,
  //     `count ${framework.name} ${config.name} result:${result.count} expected:${expected.count}`
  //   );
  // }
}
