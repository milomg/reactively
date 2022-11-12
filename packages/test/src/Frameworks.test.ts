import { reactivelyRaw } from "./util/ReactivelyRaw";
import { solidFramework } from "./util/SolidFramework";
import { logGraph, makeGraph, runGraph } from "./util/DependencyGraph";
import { ReactiveFramework } from "./util/ReactiveFramework";
import { TestConfig, TestWithFramework } from "./util/PerfConfigurations";

// const frameworks = [solidFramework, reactivelyRaw];
const frameworks = [reactivelyRaw];

frameworks.forEach(frameworkTests);

/** some basic tests to validate the reactive framework
 * wrapper works and can run performance tests.
 */
function frameworkTests(framework: ReactiveFramework) {
  const name = framework.name;
  test(`${name} | simple dependency executes`, () => {
    const s = framework.signal(2);
    const c = framework.computed(() => s.read() * 2);
    framework.run();

    expect(c.read()).toEqual(4);
  });

  test(`${name} | static graph`, () => {
    const frameworkTest = baseTestConfig(framework);
    const { graph, counter } = makeGraph(frameworkTest);
    const sum = runGraph(graph, 2, 1, framework);
    expect(sum).toEqual(16);
    expect(counter.count).toEqual(11);
  });

  test(`${name} | static graph, read 2/3 of leaves`, () => {
    const frameworkTest = baseTestConfig(framework);
    frameworkTest.config.readFraction = 2 / 3;
    frameworkTest.config.iterations = 10;
    const { counter, graph } = makeGraph(frameworkTest);
    const sum = runGraph(graph, 10, 2/3, framework);

    expect(sum).toEqual(72);
    if (framework !== solidFramework) {
      expect(counter.count).toEqual(41);
    }
  });

  test(`${name} | dynamic graph`, () => {
    const frameworkTest = baseTestConfig(framework);
    const {config} = frameworkTest;
    config.staticFraction = .5;
    config.width = 4;
    config.totalLayers = 2;
    const { graph, counter } = makeGraph(frameworkTest);
    const sum = runGraph(graph, 10, 1, framework);

    expect(sum).toEqual(72);
    expect(counter.count).toEqual(22);
  });

  test(`${name} | small dynamic graph with signal grandparents`, () => {
    const z = framework.signal(3);
    const x = framework.signal(0);

    const y = framework.signal(0);
    const i = framework.computed(() => {
      let a = y.read();
      z.read();
      if (!a) {
        return x.read();
      } else {
        return a;
      }
    });
    const j = framework.computed(() => {
      let a = i.read();
      z.read();
      if (!a) {
        return x.read();
      } else {
        return a;
      }
    });
    j.read();
    x.write(1);
    j.read();
    y.write(1);
    j.read();
  });
}

function baseTestConfig(framework: ReactiveFramework): TestWithFramework {
  const config: TestConfig = {
    width: 3,
    totalLayers: 3,
    staticFraction: 1,
    nSources: 2,
    readFraction: 1,
    expected: {},
    iterations: 1,
  };
  const frameworkTest: TestWithFramework = {
    config,
    perfFramework: {
      makeGraph,
      framework,
      testPullCounts: false,
    },
  };
  return frameworkTest;
}
