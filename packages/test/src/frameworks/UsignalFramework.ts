import { Computed, ReactiveFramework, Signal } from "../util/ReactiveFramework";
import { batch, computed, effect, signal } from "usignal";

function usignal<T>(initialValue: T): Signal<T> {
  const s = signal(initialValue);
  return {
    write: (v: T) => (s.value = v),
    read: (): T => s.value,
  };
}

function usignalComputed<T>(fn: () => T): Computed<T> {
  const c = computed(fn);
  return {
    read: (): T => c.value,
  };
}

function usignalEffect<T>(fn: () => T): void {
  // since the test runner pulls from the leaves, computed or effect should be equivalent
  computed(fn);
}

export const usignalFramework: ReactiveFramework = {
  name: "uSignal",
  signal: usignal,
  computed: usignalComputed,
  run: () => {},
  effect: usignalEffect,
  withBatch: batch,
  withBuild: (fn) => fn(),
};
