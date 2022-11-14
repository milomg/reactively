import { PerfFramework } from "./AllPerfTests";
import { TestResult } from "./PerfTests";
import { preactSignalFramework } from "./PreactSignalFramework";
import { reactivelyRaw } from "./ReactivelyRaw";
import { solidFramework } from "./SolidFramework";

/** parameters for a running a performance benchmark test */
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

export interface FrameworkInfo extends Partial<PerfFramework> {
  framework: PerfFramework["framework"];
  skipTests?: string[];
}

export const frameworkInfo: FrameworkInfo[] = [
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
export const decorableTests: TestConfig[] = [
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

export const baseTests: TestConfig[] = [
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
    readFraction: .2,
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

