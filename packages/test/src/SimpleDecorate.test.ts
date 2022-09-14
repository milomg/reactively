import { HasReactive } from "./../../decorate/src/decorate";
import { hasReactive, reactive } from "@reactively/decorate";
import { CacheCheck, CacheClean, CacheDirty, Reactive } from "@reactively/core";

test("no reactive properties", () => {
  @hasReactive()
  class NotMuch {}

  const a = new NotMuch();
  expect(a).toBeDefined();
});

test("one signal", () => {
  @hasReactive
  class OneSignal {
    callCount1 = 0;
    @reactive a = 7;
  }

  const o = new OneSignal();
  o.a = 2;
  expect(o.a).toEqual(2);
});

test("one computed", () => {
  @hasReactive
  class OneComputed {
    @reactive c() {
      return 7;
    }
  }

  const o = new OneComputed();
  expect(o.c()).toEqual(7);
});

test.skip("one computed, destructured", () => {
  @hasReactive
  class OneComputed {
    @reactive c() {
      return 7;
    }
  }

  const o = new OneComputed();
  const { c } = o;
  expect(c()).toEqual(7); // doesn't work, because 'this' is undefined
});

test("one getter", () => {
  @hasReactive
  class OneGetter {
    @reactive get c() {
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
  @hasReactive
  class OneReaction {
    callCount1 = 0;
    @reactive a = 7;
    @reactive get c() {
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
  @hasReactive
  class OneReaction {
    callCount1 = 0;
    @reactive a = 7;
    @reactive c() {
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

function logReactives(o: any): void {
  const reactives = (o as HasReactive).__reactive;
  for (const key in reactives) {
    const r = reactives[key] as any;
    const msg = {
      value: r.value,
      fn: r.fn?.toString(),
      observers: r.observers,
      sources: r.sources,
      state: cacheState(r),
    };
    console.log(key, msg);
  }
}

function cacheState(reactive: Reactive<unknown>): string {
  const r = reactive as any;
  if (r.state == CacheClean) {
    return "clean";
  } else if (r.state == CacheCheck) {
    return "check";
  } else if (r.state == CacheDirty) {
    return "dirty";
  } else {
    return "unknown";
  }
}

function logObj(o: any): void {
  const proto = Object.getPrototypeOf(o);
  const protoProto = Object.getPrototypeOf(proto);
  const ppD = Object.getOwnPropertyDescriptors(protoProto);
  console.log("instance", Object.getOwnPropertyDescriptors(o));
  console.log("proto", Object.getOwnPropertyDescriptors(proto));
  console.log("protoProto", ppD);
  console.log("o.c", o.c.toString());
}
