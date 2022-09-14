import { Reactive } from "@reactively/core";

// LATER rename to something shorter?
export interface ReactiveWrap<T> {
  (): T;
  set(value: T): void;
  get value(): T;
  set value(v: T);
}

export function $r<T>(fn: () => T): ReactiveWrap<T>;
export function $r<T>(value: T): ReactiveWrap<T>;
export function $r<T>(fnOrValue: (() => T) | T): ReactiveWrap<T> {
  const r = new Reactive(fnOrValue);
  const fn = r.get.bind(r) as ReactiveWrap<T>;
  fn.set = r.set.bind(r);
  Object.defineProperty(fn, "value", {
    get() {
      return r.get();
    },
    set(v: T) {
      r.set(v);
    },
  });
  return fn;
}

// CONSIDER would a protoype based approach be faster here?
// * We could patch the prototype chain to get instance -> set,value -> Function
// * or use Object.create() (instance w/ set,value) -> Function
