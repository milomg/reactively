import { makeGraph as doMakeGraph } from "./DependencyGraph";
import {
  FrameworkInfo,
  frameworkInfo,
  perfTests,
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

export interface TestOverrides {
  quick?: boolean;
}

/** return a list of all benchmarks  */
export function makePerfList(overrides: TestOverrides): TestWithFramework[] {
  const { decorableConfigs, baseConfigs } = decorableTestConfigs(perfTests);
  const decorable = allFrameworks.flatMap((perfFramework) => {
    return testsForFramework(decorableConfigs, perfFramework);
  });
  const base = basePerfFrameworks.flatMap((perfFramework) => {
    return testsForFramework(baseConfigs, perfFramework);
  });
  const tests = [...decorable, ...base];

  if (overrides?.quick) {
    return replaceConfig(tests, { iterations: 10 });
  } else {
    return tests;
  }
}

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


/** The test generator for decorator tests is not as flexible (must be 10 wide, no dynamic nodes),
 * so only some configrations work for decorator tests too */

function decorableTestConfigs(configs: TestConfig[]): {
  decorableConfigs: TestConfig[];
  baseConfigs: TestConfig[];
} {
  const decorableConfigs = configs.filter(isDecorableTest);
  const baseConfigs = configs.filter((c) => !isDecorableTest(c));
  return { decorableConfigs, baseConfigs };
}

function isDecorableTest(config: TestConfig): boolean {
  return (
    config.width === 10 && config.staticFraction === 1 && config.nSources === 2
  );
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
function testsForFramework(
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
