import { makeDecoratedGraph } from "./DecoratedGraph";
import { GraphAndCounter, makeGraph as doMakeGraph } from "./DependencyGraph";
import {
  baseTests,
  decorableTests,
  FrameworkInfo,
  frameworkInfo,
  TestConfig,
} from "./PerfConfigurations";
import { TestResult } from "./PerfTests";
import { preactSignalFramework } from "./PreactSignalFramework";
import { ReactiveFramework } from "./ReactiveFramework";
import { reactivelyDecorate } from "./ReactivelyDecorateFramework";
import { reactivelyRaw } from "./ReactivelyRaw";
import { reactivelyValue } from "./ReactivelyValue";
import { solidFramework } from "./SolidFramework";

export interface TestWithFramework {
  config: TestConfig;
  perfFramework: PerfFramework;
}

export type PerfFramework = FrameworkInfo &
  Required<Pick<FrameworkInfo, "makeGraph">>;

const allFrameworks: PerfFramework[] = makeFrameworks(frameworkInfo);
const basePerfFrameworks: PerfFramework[] = allFrameworks.filter(
  (f) => f.framework !== reactivelyDecorate
)!;

function makeFrameworks(infos: FrameworkInfo[]): PerfFramework[] {
  return infos.map((frameworkInfo) => {
    const {
      framework,
      testPullCounts = false,
      makeGraph = doMakeGraph,
      skipTests,
    } = frameworkInfo;

    return {
      framework,
      testPullCounts,
      makeGraph,
      skipTests,
    };
  });
}

export const allTests: TestWithFramework[] = makeTestList();

function makeTestList(): TestWithFramework[] {
  const decorable = allFrameworks.flatMap((perfFramework) => {
    return filterTests(decorableTests, perfFramework);
  });
  const base = basePerfFrameworks.flatMap((perfFramework) => {
    return filterTests(baseTests, perfFramework);
  });
  return [...decorable, ...base];
}

// remove 'skipTests' from the test config for this framework
function filterTests(
  tests: TestConfig[],
  perfFramework: PerfFramework
): TestWithFramework[] {
  const unSkipped = tests.filter(
    (test) => !perfFramework.skipTests?.includes(test.name || "unknown test")
  );
  return unSkipped.map((config) => {
    return {
      config,
      perfFramework,
    };
  });
}
