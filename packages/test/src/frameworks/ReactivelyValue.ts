import { Reactive } from "@reactively/core";
import { ReactiveFramework, Signal } from "../util/ReactiveFramework";

function wrapReactive<T>(initialValue: T): Signal<T> {
  const r = new Reactive(initialValue);
  return {
    write: (v: T) => (r.value = v),
    read: () => r.value,
  };
}

export const reactivelyValue: ReactiveFramework = {
  name: "@reactively/value",
  signal: wrapReactive,
  computed: wrapReactive as any,
  effect: wrapReactive,
  withBatch: (fn) => fn(),
  withBuild: (fn) => fn(),
  run: () => {},
};
