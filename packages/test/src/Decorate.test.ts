import { onCleanup } from "@reactively/core";
import { hasReactive, reactive } from "@reactively/decorate";

@hasReactive
class OneComputed {
  callCount1 = 0;
  @reactive a = 7;
  @reactive value1 = (): number => {
    this.callCount1++;
    const result = this.a + 10;
    return result;
  };
}

test("one signal", () => {
  const simple = new OneComputed();
  expect(simple.value1()).toBe(17);
  simple.a = 2;
  expect(simple.value1()).toBe(12);
  expect(simple.callCount1).toEqual(2);

  // extra get via value1() doesn't recalculate
  expect(simple.value1()).toBe(12);
  expect(simple.callCount1).toEqual(2);

  // set() w/o a change doesn't recalculate
  simple.a = 2;
  expect(simple.callCount1).toEqual(2);
});

/*
a-v1-v2
 /
b
*/
@hasReactive()
class TwoComputed {
  @reactive a = 7;
  @reactive b = 1;

  callCount1 = 0;
  @reactive value1 = (): number => {
    this.callCount1++;
    const result = this.a * this.b;
    return result;
  };

  callCount2 = 0;
  @reactive value2 = (): number => {
    this.callCount2++;
    const result = this.value1() + 1;
    return result;
  };
}

test("two signals", () => {
  const simple = new TwoComputed();
  simple.a = 2;
  expect(simple.value1()).toBe(2);
  simple.b = 3;
  expect(simple.value1()).toBe(6);
  expect(simple.callCount1).toEqual(2);

  expect(simple.value1()).toBe(6);
  expect(simple.callCount1).toEqual(2);
});

test("dependent computed", () => {
  const simple = new TwoComputed();
  expect(simple.value2()).toBe(8);
  expect(simple.callCount1).toBe(1);
  expect(simple.callCount2).toBe(1);
  simple.a = 3;
  expect(simple.value2()).toBe(4);
  expect(simple.callCount1).toBe(2);
  expect(simple.callCount2).toBe(2);
});

test("equality check", () => {
  const simple = new TwoComputed();
  simple.value1();
  simple.value1();
  expect(simple.callCount1).toBe(1);

  simple.a = 7;

  simple.value1();
  expect(simple.callCount1).toBe(1); // unchanged, equality check
});

@hasReactive()
class DyanmicComputed {
  @reactive a = 1;
  @reactive b = 2;

  callCountA = 0;
  @reactive computedA = (): number => {
    this.callCountA++;
    return this.a;
  };

  callCountB = 0;
  @reactive computedB = (): number => {
    this.callCountB++;
    return this.b;
  };

  callCountAB = 0;
  @reactive computedAorB = (): number => {
    this.callCountAB++;
    return this.computedA() || this.computedB();
  };
}

test("dynamic computed", () => {
  const simple = new DyanmicComputed();
  expect(simple.computedAorB()).toBe(1);
  simple.a = 2;
  simple.b = 3;
  expect(simple.computedAorB()).toBe(2);
  expect(simple.callCountA).toBe(2);
  expect(simple.callCountAB).toBe(2);
  expect(simple.callCountB).toBe(0);
  simple.a = 0;
  expect(simple.computedAorB()).toBe(3);
  expect(simple.callCountA).toBe(3);
  expect(simple.callCountAB).toBe(3);
  expect(simple.callCountB).toBe(1);
  simple.b = 4;
  expect(simple.computedAorB()).toBe(4);
  expect(simple.callCountA).toBe(3);
  expect(simple.callCountAB).toBe(4);
  expect(simple.callCountB).toBe(2);
});

class CleanupCounter {
  oldValues: number[] = [];

  cleanup(old: number): void {
    this.oldValues.push(old);
  }
}

@hasReactive()
class Cleanup {
  counter = new CleanupCounter();

  @reactive source = 1;

  @reactive value = (): number => {
    onCleanup((old) => {
      this.counter.cleanup(old);
    });

    return this.source + 1;
  };
}

test("onCleanup", () => {
  const startValue = 2;
  const c = new Cleanup();
  expect(c.value()).toEqual(startValue);
  expect(c.counter.oldValues.length).toEqual(0);

  c.source = 3;
  expect(c.value()).toEqual(4);
  expect(c.counter.oldValues).toEqual([startValue]);
});

@hasReactive()
class NotMuch {}
test("no signals or compute", () => {
  const a = new NotMuch();
  expect(a).toBeDefined();
});

/* a -> bool -> result */
@hasReactive()
class BooleanCheck {
  @reactive a = 0;

  @reactive bool = (): boolean => {
    return this.a > 0;
  };

  callCount = 0;

  @reactive result = (): number => {
    this.callCount++;
    return this.bool() ? 1 : 0;
  };
}

test("boolean check", () => {
  const c = new BooleanCheck();
  expect(c.result()).toBe(0);
  expect(c.callCount).toBe(1);

  c.a = 1;
  expect(c.result()).toBe(1);
  expect(c.callCount).toBe(2);

  c.a = 2;
  expect(c.result()).toBe(1);
  expect(c.callCount).toBe(2); // unchanged, oughtn't run because bool didn't change
});

/*
s-a-b-d
   \ /
    c
*/
@hasReactive()
class DiamondComputeds {
  @reactive s = 1;
  @reactive a = () => this.s;
  @reactive b = () => this.a() * 2;
  @reactive c = () => this.a() * 3;

  callCount = 0;
  @reactive d = (): number => {
    this.callCount++;
    return this.b() + this.c();
  };
}

test("diamond computeds", () => {
  const c = new DiamondComputeds();
  expect(c.d()).toBe(5);
  expect(c.callCount).toBe(1);
  c.s = 2;
  expect(c.d()).toBe(10);
  expect(c.callCount).toBe(2);
  c.s = 3;
  expect(c.d()).toBe(15);
  expect(c.callCount).toBe(3);
});

@hasReactive()
class SetInsideReaction {
  @reactive s = 1;
  @reactive a = () => {
    this.s = 2;
  };
  @reactive l = () => this.s + 100;
}

test("set inside reaction", () => {
  const t = new SetInsideReaction();
  const { a, l } = t;
  a();
  expect(l()).toEqual(102);
});
