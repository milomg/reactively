import { makeDecoratedGraph } from "./DecoratedGraph";
import {
  GraphAndCounter,
  makeGraph as genericMakeGraph,
} from "./DependencyGraph";
import { TestResult } from "./PerfTests";
import { preactSignalFramework } from "./PreactSignalFramework";
import { ReactiveFramework } from "./ReactiveFramework";
import { reactivelyDecorate } from "./ReactivelyDecorateFramework";
import { reactivelyRaw } from "./ReactivelyRaw";
import { reactivelyValue } from "./ReactivelyValue";
import { solidFramework } from "./SolidFramework";

const frameworkInfo: FrameworkInfo[] = [
  { framework: reactivelyRaw, testPullCounts: true },
  { framework: reactivelyValue, testPullCounts: true },
  { framework: solidFramework },
  { framework: preactSignalFramework },
  {
    framework: reactivelyDecorate,
    testPullCounts: true,
    makeGraph: makeDecoratedGraph,
  },
];

/** The test generator for decorator tests is not as flexible (must be 10 wide, no dynamic nodes),
 * so only some configrations work for decorator tests too */
const decoratableTests: TestConfig[] = [
  {
    name: "read 20%",
    width: 10, // can't change for decorator tests
    staticFraction: 1, // can't change for decorator tests
    nSources: 2, // can't change for decorator tests
    totalLayers: 10,
    readFraction: .2,
    iterations: 100000,
    expected: {},
  },
];

const baseTests: TestConfig[] = [
  {
    name: "deep",
    width: 5,
    totalLayers: 1000,
    staticFraction: 1,
    nSources: 3,
    readFraction: 1,
    iterations: 500,
    expected: {},
  },
  {
    name: "deep and webbed",
    width: 5,
    totalLayers: 1000,
    staticFraction: 1,
    nSources: 5,
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
  // {
  //   name: "medium",
  //   width: 100,
  //   totalLayers: 15,
  //   staticFraction: 3 / 4,
  //   nSources: 6,
  //   readFraction: 1,
  //   iterations: 4000,
  //   expected: {},
  // },
  // {
  //   name: "medium read 20%",
  //   width: 100,
  //   totalLayers: 15,
  //   staticFraction: 3 / 4,
  //   nSources: 6,
  //   readFraction: 20,
  //   iterations: 4000,
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
  makeGraph: (
    width: number,
    totalLayers: number,
    staticFraction: number,
    nSources: number
  ) => GraphAndCounter;
  testPullCounts: boolean;
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

type FrameworkInfo = Partial<PerfFramework> & Pick<PerfFramework, "framework">;

function makeFrameworks(infos: FrameworkInfo[]): PerfFramework[] {
  return infos.map((frameworkInfo) => {
    function defaultMakeG(
      width: number,
      totalLayers: number,
      staticFraction: number,
      nSources: number
    ): GraphAndCounter {
      return genericMakeGraph(
        width,
        totalLayers,
        staticFraction,
        nSources,
        frameworkInfo.framework
      );
    }

    const {
      framework,
      testPullCounts = false,
      makeGraph = defaultMakeG,
    } = frameworkInfo;
    return {
      framework,
      testPullCounts,
      makeGraph,
    };
  });
}

export const allTests: TestWithFramework[] = makeTestList();

function makeTestList(): TestWithFramework[] {
  const decorable = decoratableTests.flatMap((config) => {
    return allFrameworks.map((perfFramework) => ({
      config,
      perfFramework,
    }));
  });
  const main = baseTests.flatMap((config) => {
    return basePerfFrameworks.map((perfFramework) => ({
      config,
      perfFramework,
    }));
  });

  return [...decorable, ...main];
}
