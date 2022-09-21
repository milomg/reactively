import { preactSignalFramework } from './PreactSignalFramework';
import { reactivelyDecorate } from "./ReactivelyDecorateFramework";
import { reactivelyWrap } from "./ReactivelyWrapFramework";
import { solidFramework } from "./SolidFramework";
import { TestResult } from "./PerfTests";
import { makeDecoratedGraph } from "./DecoratedGraph";
import { ReactiveFramework } from "./ReactiveFramework";
import { GraphAndCounter, makeGraph } from "./DependencyGraph";

export interface TestConfig {
  width: number;
  totalLayers: number;
  staticNth: number;
  readNth: number;
  iterations: number;
  expected: TestResult;
}

export interface PerfFramework {
  framework: ReactiveFramework;
  makeGraph: (
    width: number,
    totalLayers: number,
    staticNth: number
  ) => GraphAndCounter;
  testPullCounts: boolean;
}

export interface TestWithFramework {
  config: TestConfig;
  perfFramework: PerfFramework;
}

const baseTests: TestConfig[] = [
  {
    width: 10,
    totalLayers: 5,
    staticNth: 1,
    readNth: 1,
    iterations: 100000,
    expected: {
      sum: 15999840,
      count: 1400026,
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
      count: 1250027,
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
      count: 520016,
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
      count: 3600036,
    },
  },
];

const basePerfFrameworks: PerfFramework[] = [
  {
    framework: reactivelyWrap,
    makeGraph: (width: number, totalLayers: number, staticNth: number) =>
      makeGraph(width, totalLayers, staticNth, reactivelyWrap),
    testPullCounts: true,
  },
  {
    framework: solidFramework,
    makeGraph: (width: number, totalLayers: number, staticNth: number) =>
      makeGraph(width, totalLayers, staticNth, solidFramework),
    testPullCounts: false,
  },
  {
    framework: preactSignalFramework,
    makeGraph: (width: number, totalLayers: number, staticNth: number) =>
      makeGraph(width, totalLayers, staticNth, solidFramework),
    testPullCounts: false,
  },
];

const decoratePerfFramework: PerfFramework = {
  framework: reactivelyDecorate,
  makeGraph: makeDecoratedGraph,
  testPullCounts: true,
};

const allFrameworks = [...basePerfFrameworks, decoratePerfFramework];

export const allTests: TestWithFramework[] = makeTestList();

function makeTestList(): TestWithFramework[] {
  const compatList = decoratableTests.flatMap((config) => {
    return allFrameworks.map((perfFramework) => ({
      config,
      perfFramework,
    }));
  });
  const baseList = baseTests.flatMap((config) => {
    return basePerfFrameworks.map((perfFramework) => ({
      config,
      perfFramework,
    }));
  });

  return [...compatList, ...baseList];
}
