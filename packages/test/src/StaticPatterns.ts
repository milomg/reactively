import { ReactiveFramework } from "./util/ReactiveFramework";

export function staticTests(r: ReactiveFramework) {
  test("simple dependency executes", () => {
    const s = r.signal(2);
    const c = r.computed(() => s.read() * 2);
    r.run();

    expect(c.read()).toEqual(4);
  });

}

