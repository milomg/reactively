import { Reactive } from "@reactively/core";
import { ReactiveFramework, Signal } from "./ReactiveFramework";

function wrapReactive<T>(initialValue: T): Signal<T> {
  const r = new Reactive(initialValue);
  return {
    write: (v: T) => r.set(v),
    read: () => r.get(),
  };
}

export const reactivelyRaw: ReactiveFramework = {
  name: "@reactively",
  signal: wrapReactive,
  computed: wrapReactive as any,
  effect: wrapReactive,
  withBatch: (fn) => fn(),
  withBuild: (fn) => fn(),
  run: () => {},
};
