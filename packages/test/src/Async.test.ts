import { promiseDelay } from "./util/AsyncUtil";
import { frameworkTest } from "./util/FrameworkTest";
import { ReactiveFramework } from "./util/ReactiveFramework";
import { reactivelyValue } from "./util/ReactivelyValue";

[reactivelyValue].forEach(runTests);

function runTests(f: ReactiveFramework) {
  frameworkTest(f, "async modify", async () => {
    return f.withBatch(async () => {
      const a = f.signal(1);
      const b = f.computed(() => a.read() + 10);
      await promiseDelay(10).then(() => a.write(2));
      expect(b.read()).toEqual(12);
    });
  });

  frameworkTest(f, "async modify in reaction before await", async () => {
    return f.withBatch(async () => {
      const s = f.signal(1);
      const a = f.computed(async () => {
        s.write(2);
        await promiseDelay(10);
      });
      const l = f.computed(() => s.read() + 100);

      a.read();
      expect(l.read()).toEqual(102);
    });
  });

  frameworkTest(f, "async modify in reaction after await", async () => {
    return f.withBatch(async () => {
      const s = f.signal(1);
      const a = f.computed(async () => {
        await promiseDelay(10);
        s.write(2);
      });
      const l = f.computed(() => s.read() + 100);

      await a.read();
      expect(l.read()).toEqual(102);
    });
  });
}
