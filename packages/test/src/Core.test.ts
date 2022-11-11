import { frameworkTest } from "./util/FrameworkTest";
import { ReactiveFramework } from "./util/ReactiveFramework";
import { reactivelyValue } from "./util/ReactivelyValue";

[reactivelyValue].forEach(runTests);

function runTests(f: ReactiveFramework): void {
  /* 
          a  b
          | /
          c
  */
  frameworkTest(f, "two signals", () => {
    const a = f.signal(7);
    const b = f.signal(1);
    let callCount = 0;

    const c = f.computed(() => {
      callCount++;
      return a.read() * b.read();
    });

    a.write(2);
    expect(c.read()).toBe(2);

    b.write(3);
    expect(c.read()).toBe(6);

    expect(callCount).toBe(2);
    c.read();
    expect(callCount).toBe(2);
  });

  /* 
        a  b
        | /
        c
        |
        d
  */
  frameworkTest(f, "dependent computed", () => {
    const a = f.signal(7);
    const b = f.signal(1);
    let callCount1 = 0;
    const c = f.computed(() => {
      callCount1++;
      return a.read() * b.read();
    });

    let callCount2 = 0;
    const d = f.computed(() => {
      callCount2++;
      return c.read() + 1;
    });

    expect(d.read()).toBe(8);
    expect(callCount1).toBe(1);
    expect(callCount2).toBe(1);
    a.write(3);
    expect(d.read()).toBe(4);
    expect(callCount1).toBe(2);
    expect(callCount2).toBe(2);
  });

  /*
        a
        |
        c
  */
  frameworkTest(f, "equality check", () => {
    let callCount = 0;
    const a = f.signal(7);
    const c = f.computed(() => {
      callCount++;
      return a.read() + 10;
    });
    c.read();
    c.read();
    expect(callCount).toBe(1);
    a.write(7);
    expect(callCount).toBe(1); // unchanged, equality check
  });

  /*
        a     b
        |     |
        cA   cB
        |   / (dynamically depends on cB)
        cAB
  */
  frameworkTest(f, "dynamic computed", () => {
    const a = f.signal(1);
    const b = f.signal(2);
    let callCountA = 0;
    let callCountB = 0;
    let callCountAB = 0;

    const cA = f.computed(() => {
      callCountA++;
      return a.read();
    });

    const cB = f.computed(() => {
      callCountB++;
      return b.read();
    });

    const cAB = f.computed(() => {
      callCountAB++;
      return cA.read() || cB.read();
    });

    expect(cAB.read()).toBe(1);
    a.write(2);
    b.write(3);
    expect(cAB.read()).toBe(2);

    expect(callCountA).toBe(2);
    expect(callCountAB).toBe(2);
    expect(callCountB).toBe(0);
    a.write(0);
    expect(cAB.read()).toBe(3);
    expect(callCountA).toBe(3);
    expect(callCountAB).toBe(3);
    expect(callCountB).toBe(1);
    b.write(4);
    expect(cAB.read()).toBe(4);
    expect(callCountA).toBe(3);
    expect(callCountAB).toBe(4);
    expect(callCountB).toBe(2);
  });

  // TBD test cleanup in api

  /* 
          a  
          | 
          b (=)
          |
          c
  */
  frameworkTest(f, "boolean equality check", () => {
    const a = f.signal(0);
    const b = f.computed(() => a.read() > 0);
    let callCount = 0;
    const c = f.computed(() => {
      callCount++;
      return b.read() ? 1 : 0;
    });

    expect(c.read()).toBe(0);
    expect(callCount).toBe(1);

    a.write(1);
    expect(c.read()).toBe(1);
    expect(callCount).toBe(2);

    a.write(2);
    expect(c.read()).toBe(1);
    expect(callCount).toBe(2); // unchanged, oughtn't run because bool didn't change
  });

  /*
        s
        |
        a
        | \ 
        b  c
         \ |
           d
  */
  frameworkTest(f, "diamond computeds", () => {
    const s = f.signal(1);
    const a = f.computed(s.read);
    const b = f.computed(() => a.read() * 2);
    const c = f.computed(() => a.read() * 3);
    let callCount = 0;
    const d = f.computed(() => {
      callCount++;
      return b.read() + c.read();
    });
    expect(d.read()).toBe(5);
    expect(callCount).toBe(1);
    s.write(2);
    expect(d.read()).toBe(10);
    expect(callCount).toBe(2);
    s.write(3);
    expect(d.read()).toBe(15);
    expect(callCount).toBe(3);
  });

  /*
        s
        | 
        l  a (sets s)
  */
  frameworkTest(f, "set inside reaction", () => {
    const s = f.signal(1);
    const a = f.computed(() => s.write(2));
    const l = f.computed(() => s.read() + 100);

    a.read();
    expect(l.read()).toEqual(102);
  });
}
