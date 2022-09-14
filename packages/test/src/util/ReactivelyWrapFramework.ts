import { $r } from "@reactively/wrap";
import { ReactiveFramework, Signal } from "./ReactiveFramework";

function wrapReactive<T>(initialValue: T): Signal<T> {
  const r = $r(initialValue);
  return {
    write: r.set,
    read: () => r(),
  };
}

export const reactivelyWrap: ReactiveFramework = {
  name: "@reactively/wrap",
  signal: wrapReactive,
  computed: wrapReactive as any,
  effect: wrapReactive,
  withBatch: (fn) => fn(),
  withBuild: (fn) => fn(),
  run: () => {},
};
