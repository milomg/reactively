import { Reactive } from "@reactively/core";

export interface ReactiveWrap<T> {
  (): T;
  set(value: T): void;
}

export function $r<T>(fn: () => T): ReactiveWrap<T>;
export function $r<T>(value: T): ReactiveWrap<T>;
export function $r<T>(fnOrValue: (() => T) | T): ReactiveWrap<T> {
  const r = new Reactive(fnOrValue);
  const fn = r.get.bind(r) as ReactiveWrap<T>;
  fn.set = r.set.bind(r);
  return fn;
}
