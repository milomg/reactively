import { makeDecoratedGraph } from "./DecoratedGraph";
import { GraphAndCounter, makeGraph as doMakeGraph } from "./DependencyGraph";
import { TestResult } from "./PerfTests";
import { preactSignalFramework } from "./PreactSignalFramework";
import { ReactiveFramework } from "./ReactiveFramework";
import { reactivelyDecorate } from "./ReactivelyDecorateFramework";
import { reactivelyRaw } from "./ReactivelyRaw";
import { reactivelyValue } from "./ReactivelyValue";
import { solidFramework } from "./SolidFramework";

const frameworkInfo: FrameworkInfo[] = [
  { framework: reactivelyRaw, testPullCounts: true },
  // { framework: reactivelyValue, testPullCounts: true },
  { framework: solidFramework },
  {
    framework: preactSignalFramework,
    skipTests: ["medium", "medium read 20%"],
  },
  // {
  //   framework: reactivelyDecorate,
  //   testPullCounts: true,
  //   makeGraph: makeDecoratedGraph,
  // },
];

/** The test generator for decorator tests is not as flexible (must be 10 wide, no dynamic nodes),
 * so only some configrations work for decorator tests too */
const decorableTests: TestConfig[] = [
  {
    name: "read 20%",
    width: 10, // can't change for decorator tests
    staticFraction: 1, // can't change for decorator tests
    nSources: 2, // can't change for decorator tests
    totalLayers: 10,
    readFraction: 0.2,
    iterations: 100000,
    expected: {},
  },
];

const baseTests: TestConfig[] = [
  {
    name: "deep",
    width: 5,
    totalLayers: 500,
    staticFraction: 1,
    nSources: 3,
    readFraction: 1,
    iterations: 500,
    expected: {},
  },
  {
    name: "wide",
    width: 1000,
    totalLayers: 5,
    staticFraction: 1,
    nSources: 2,
    readFraction: 1,
    iterations: 10000,
    expected: {},
  },
  {
    name: "wide and webbed",
    width: 1000,
    totalLayers: 5,
    staticFraction: 1,
    nSources: 25,
    readFraction: 1,
    iterations: 3000,
    expected: {},
  },
  {
    name: "medium",
    width: 100,
    totalLayers: 15,
    staticFraction: 3 / 4,
    nSources: 6,
    readFraction: 1,
    iterations: 4000,
    expected: {},
  },
  {
    name: "medium read 20%",
    width: 100,
    totalLayers: 15,
    staticFraction: 3 / 4,
    nSources: 6,
    readFraction: 20,
    iterations: 4000,
    expected: {},
  },
  // {
  //   name: "tiny",
  //   width: 10,
  //   totalLayers: 5,
  //   staticFraction: 3 / 4,
  //   nSources: 4,
  //   readFraction: 1,
  //   iterations: 100,
  //   expected: {},
  // },
  // {
  //   name: "tiny2",
  //   width: 5,
  //   totalLayers: 5,
  //   staticFraction: 3 / 4,
  //   nSources: 4,
  //   readFraction: 1,
  //   iterations: 10,
  //   expected: {},
  // },

  // {
  //   name: "verifying", // seems to take a very long time in preact..
  //   width: 100,
  //   totalLayers: 15,
  //   staticFraction: 3/4,
  //   nSources: 6,
  //   readFraction: 1,
  //   iterations: 20,
  //   expected: {},
  // },
];

export interface PerfFramework {
  framework: ReactiveFramework;
  makeGraph: (testWithFramework: TestWithFramework) => GraphAndCounter;
  testPullCounts: boolean;
  skipTests?: string[];
}

export interface TestConfig {
  name?: string;
  width: number;
  totalLayers: number;
  staticFraction: number;
  nSources: number;
  readFraction: number;
  iterations: number;
  expected: TestResult;
}

export interface TestWithFramework {
  config: TestConfig;
  perfFramework: PerfFramework;
}

const allFrameworks: PerfFramework[] = makeFrameworks(frameworkInfo);
const basePerfFrameworks: PerfFramework[] = allFrameworks.filter(
  (f) => f.framework !== reactivelyDecorate
)!;

interface FrameworkInfo extends Partial<PerfFramework> {
  framework: PerfFramework["framework"];
  skipTests?: string[];
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
