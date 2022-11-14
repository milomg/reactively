import { config } from "process";
import { makeGraph as doMakeGraph } from "./DependencyGraph";
import {
  baseTests,
  decorableTests,
  FrameworkInfo,
  frameworkInfo,
  TestConfig,
} from "./PerfConfigurations";
import { reactivelyDecorate } from "./ReactivelyDecorateFramework";

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

export interface TestOverrides {
  quick?: boolean;
}

export function makeTestList(overrides: TestOverrides): TestWithFramework[] {
  const decorable = allFrameworks.flatMap((perfFramework) => {
    return filterTests(decorableTests, perfFramework);
  });
  const base = basePerfFrameworks.flatMap((perfFramework) => {
    return filterTests(baseTests, perfFramework);
  });
  const tests = [...decorable, ...base];

  if (overrides?.quick) {
    return replaceConfig(tests, { iterations: 10 });
  } else {
    return tests;
  }
}

function replaceConfig(
  tests: TestWithFramework[],
  partialConfig: Partial<TestConfig>
): TestWithFramework[] {
  return tests.map((t) => ({
    ...t,
    config: { ...t.config, ...partialConfig },
  }));
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
