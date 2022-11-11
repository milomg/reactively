import { reactively, HasReactive } from "@reactively/decorate";
import { logHasReactive } from "./util/ReactiveLogging";

test("no reactive properties", () => {
  class NotMuch extends HasReactive {}

  const a = new NotMuch();
  expect(a).toBeDefined();
});

test("one signal", () => {
  class OneSignal extends HasReactive {
    @reactively a = 7;
  }

  const o = new OneSignal();
  expect(o.a).toEqual(7);
  o.a = 2;
  expect(o.a).toEqual(2);
});

test("one computed", () => {
  class OneComputed extends HasReactive {
    @reactively c() {
      return 7;
    }
  }

  const o = new OneComputed();
  expect(o.c()).toEqual(7);
});

test("one getter", () => {
  class OneGetter extends HasReactive {
    @reactively get c() {
      return 7;
    }
  }
  const o = new OneGetter();
  expect(o.c).toEqual(7);
});

/* 
        a
        |
        c
*/
test("one reaction, getter", () => {
  class OneReaction extends HasReactive {
    callCount1 = 0;
    @reactively a = 7;
    @reactively get c() {
      this.callCount1++;
      const result = this.a + 10;
      return result;
    }
  }

  const o = new OneReaction();

  expect(o.c).toBe(17);
  o.a = 2;
  expect(o.c).toBe(12);
  expect(o.callCount1).toEqual(2);

  // extra get via value1() doesn't recalculate
  expect(o.c).toBe(12);
  expect(o.callCount1).toEqual(2);

  // set() w/o a change doesn't recalculate
  o.a = 2;
  expect(o.callCount1).toEqual(2);
});

/* 
        a
        |
        c
*/
test("one reaction, computed method", () => {
  class OneReaction extends HasReactive {
    callCount1 = 0;
    @reactively a = 7;
    @reactively c() {
      this.callCount1++;
      const result = this.a + 10;
      return result;
    }
  }

  const o = new OneReaction();
  expect(o.c()).toBe(17);
  o.a = 2;
  expect(o.c()).toBe(12);
  expect(o.callCount1).toEqual(2);

  // extra get via value1() doesn't recalculate
  expect(o.c()).toBe(12);
  expect(o.callCount1).toEqual(2);

  // set() w/o a change doesn't recalculate
  o.a = 2;
  expect(o.callCount1).toEqual(2);
});

test.skip("one computed, destructured", () => {
  class OneComputed extends HasReactive {
    @reactively c() {
      return 7;
    }
  }

  const o = new OneComputed();
  const { c } = o;
  expect(c()).toEqual(7); // doesn't work, because 'this' is undefined
});
