import {
  makePerfList
} from "../../test/src/util/AllPerfTests";
import { runGraph } from "../../test/src/util/DependencyGraph";
import { logPerfResult } from "../../test/src/util/PerfLogging";
import { runTimed } from "../../test/src/util/PerfUtil";
import {
  TestResult,
  TimingResult,
  verifyBenchResult
} from "./../../test/src/util/PerfTests";

const benchmarks = makePerfList({});
benchmarks.forEach((frameworkTest) => {
  const { config, perfFramework } = frameworkTest;
  const { framework } = perfFramework;
  const { iterations, readFraction } = config;
  const name = `${perfFramework.framework.name}: ${config.name || ""}`;
  it(name, () => {
    const { graph, counter } = perfFramework.makeGraph(frameworkTest);

    const timedResult = runTimed(() =>
      runGraph(graph, iterations, readFraction, framework)
    );
    const timingResult: TimingResult<TestResult> = {
      result: { sum: timedResult.result, count: counter.count },
      timing: { time: timedResult.time },
    };
    logPerfResult(frameworkTest, timingResult);
    verifyBenchResult(frameworkTest, timingResult);
  });
});
