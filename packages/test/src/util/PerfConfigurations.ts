import { PerfFramework, TestWithFramework } from "./AllPerfTests";
import { GraphAndCounter } from "./DependencyGraph";
import { TestResult } from "./PerfTests";
import { preactSignalFramework } from "./PreactSignalFramework";
import { ReactiveFramework } from "./ReactiveFramework";
import { reactivelyRaw } from "./ReactivelyRaw";
import { solidFramework } from "./SolidFramework";

/** Parameters for a running a performance benchmark test 
 * 
 * The benchmarks create a rectangular grid of reactive elements, with
 * mutable signals in the first level, computed elements in the middle levels,
 * and read effect elements in the last level.
 * 
 * Each test iteration modifies one signal, and then reads specified
 * fraction of the effect elements.
 * 
 * Each non-signal node sums values from a specified number of elements 
 * in the preceding layer. Some nodes are dynamic, and read vary
 * the number of sources the read for the sum.
 * 
 * Tests may optionally provide result values to verify the sum
 * of all read effect elements in all iterations, and the total
 * number of non-signal updated.
*/
export interface TestConfig {
  /** friendly name for the test, should be unique */
  name?: string;

  /** width of dependency graph to construct */
  width: number;

  /** depth of dependency graph to construct */
  totalLayers: number;

  /** fraction of nodes that are static */ // TODO change to dynamicFraction
  staticFraction: number;

  /** construct a graph with number of sources in each node */
  nSources: number;

  /** fraction of [0, 1] elements in the last layer from which to read values in each test iteration */
  readFraction: number;

  /** number of test iterations */
  iterations: number;

  /** sum and count of all iterations, for verification */
  expected: TestResult;
}

export interface FrameworkInfo {
  framework: ReactiveFramework;
  skipTests?: string[];
  testPullCounts?: boolean;
  makeGraph?: (testWithFramework: TestWithFramework) => GraphAndCounter;
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

