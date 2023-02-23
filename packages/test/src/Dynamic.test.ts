import { expect, test } from "vitest";
import { frameworkTest } from "./util/FrameworkTest";
import { ReactiveFramework } from "./util/ReactiveFramework";
import { reactivelyValue } from "./frameworks/ReactivelyValue";

[reactivelyValue].forEach(runTests);

function runTests(f: ReactiveFramework): void {
  /*
    a  b          a 
    | /     or    | 
    c             c
  */
  frameworkTest(f, "dynamic sources recalculate correctly", () => {
    const a = f.signal(false);
    const b = f.signal(2);
    let count = 0;

    const c = f.computed(() => {
      count++;
      a.read() || b.read();
    });

    c.read();
    expect(count).toBe(1);
    a.write(true);
    c.read();
    expect(count).toBe(2);

    b.write(4);
    c.read();
    expect(count).toBe(2);
  });

  /*
  dependency is dynamic: sometimes l depends on b, sometimes not.
     s          s
    / \        / \
   a   b  or  a   b
    \ /        \
     l          l
  */
  frameworkTest(
    f,
    "dynamic sources don't re-execute a parent unnecessarily",
    () => {
      const s = f.signal(2);
      const a = f.computed(() => s.read() + 1);
      let bCount = 0;
      const b = f.computed(() => {
        // b depends on s, so b's always dirty when s changes, but b may be unneeded.
        bCount++;
        return s.read() + 10;
      });
      const l = f.computed(() => {
        let result = a.read();
        if (result & 0x1) {
          result += b.read(); // only execute b if a is odd
        }
        return result;
      });

      expect(l.read()).toEqual(15);
      expect(bCount).toEqual(1);
      s.write(3);
      expect(l.read()).toEqual(4);
      expect(bCount).toEqual(1);
    }
  );

  /*
    s
    |
    l
  */
  frameworkTest(f, "dynamic source disappears entirely", () => {
    const s = f.signal(1);
    let done = false;
    let count = 0;

    const c = f.computed(() => {
      count++;

      if (done) {
        return 0;
      } else {
        const value = s.read();
        if (value > 2) {
          done = true; // break the link between s and c
        }
        return value;
      }
    });

    expect(c.read()).toBe(1);
    expect(count).toBe(1);
    s.write(3);
    expect(c.read()).toBe(3);
    expect(count).toBe(2);

    s.write(1); // we've now locked into 'done' state
    expect(c.read()).toBe(0);
    expect(count).toBe(3);

    // we're still locked into 'done' state, and count no longer advances
    // in fact, c() will never execute again..
    s.write(0);
    expect(c.read()).toBe(0);
    expect(count).toBe(3);
  });

  frameworkTest(f, `small dynamic graph with signal grandparents`, () => {
    const z = f.signal(3);
    const x = f.signal(0);

    const y = f.signal(0);
    const i = f.computed(() => {
      let a = y.read();
      z.read();
      if (!a) {
        return x.read();
      } else {
        return a;
      }
    });
    const j = f.computed(() => {
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
