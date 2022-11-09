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
import { solidFramework } from "./SolidFramework";

const frameworkInfo: FrameworkInfo[] = [
  { framework: reactivelyRaw, testPullCounts: true },
  // { framework: solidFramework },
  { framework: preactSignalFramework },
  // {
  //   framework: reactivelyDecorate,
  //   testPullCounts: true,
  //   makeGraph: makeDecoratedGraph,
  // },
];

const baseTests: TestConfig[] = [
  {
    width: 5,
    totalLayers: 1000,
    staticNth: 1,
    readNth: 1,
    iterations: 400,
    expected: {
      sum: 1.0688298356683017e304,
      // count: 1995600,
    },
  },
  {
    width: 10,
    totalLayers: 5,
    staticNth: 1,
    readNth: 1,
    iterations: 100000,
    expected: {
      sum: 15999840,
      //     count: 1400026,
    },
  },
  {
    width: 10,
    totalLayers: 5,
    staticNth: 2,
    readNth: 1,
    iterations: 100000,
    expected: {
      sum: 11999955,
      //    count: 1250027,
    },
  },
  {
    width: 10,
    totalLayers: 5,
    staticNth: 2,
    readNth: 5,
    iterations: 100000,
    expected: {
      sum: 2399983,
      //    count: 520016,
    },
  },
  {
    width: 1000,
    totalLayers: 5,
    staticNth: 2,
    readNth: 10,
    iterations: 40000,
    expected: {
      sum: 47993100,
      //    count: 112996,
    },
  },
];

/** The test generator for decorator tests is not as flexible, so we handle
 * it separately */
const decoratableTests: TestConfig[] = [
  {
    width: 10,
    totalLayers: 10,
    staticNth: 1,
    readNth: 5,
    iterations: 100000,
    expected: {
      sum: 102398976,
      // count: 3600036,
    },
  },
];

export interface PerfFramework {
  framework: ReactiveFramework;
  makeGraph: (
    width: number,
    totalLayers: number,
    staticNth: number
  ) => GraphAndCounter;
  testPullCounts: boolean;
}

export interface TestConfig {
  width: number;
  totalLayers: number;
  staticNth: number;
  readNth: number;
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

function makeFrameworks(info: FrameworkInfo[]): PerfFramework[] {
  return info.map((i) => {
    function defaultMakeG(
      width: number,
      totalLayers: number,
      staticNth: number
    ): GraphAndCounter {
      return genericMakeGraph(width, totalLayers, staticNth, i.framework);
    }
    const { framework, testPullCounts = false, makeGraph = defaultMakeG } = i;
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
