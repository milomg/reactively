import { reactivelyWrap } from "./util/ReactivelyWrapFramework";
import { solidFramework } from "./util/SolidFramework";
import { makeGraph, runGraph } from "./util/DependencyGraph";
import { ReactiveFramework } from "./util/ReactiveFramework";

const frameworks = [solidFramework, reactivelyWrap];

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
    const { graph, counter } = makeGraph(3, 3, 1, framework);
    const sum = runGraph(graph, 2, 1, framework);
    expect(sum).toEqual(16);
    expect(counter.count).toEqual(11);
  });

  test(`${name} | static graph, read 2/3 of leaves`, () => {
    const { counter, graph } = makeGraph(3, 3, 1, framework);
    const sum = runGraph(graph, 10, 2, framework);

    expect(sum).toEqual(71);
    if (framework !== solidFramework) {
      expect(counter.count).toEqual(41);
    }
  });

  test(`${name} | dynamic graph`, () => {
    const { graph, counter } = makeGraph(4, 2, 2, framework);
    const sum = runGraph(graph, 10, 1, framework);

    expect(sum).toEqual(74);
    expect(counter.count).toEqual(22);
  });
}
