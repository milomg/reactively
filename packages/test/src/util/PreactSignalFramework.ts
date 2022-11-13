import { Computed, ReactiveFramework, Signal } from "./ReactiveFramework";
import { batch, computed, effect, signal } from "@preact/signals";

function preactSignal<T>(initialValue: T): Signal<T> {
  const s = signal(initialValue);
  return {
    write: (v: T) => (s.value = v),
    read: (): T => s.value,
  };
}

function preactComputed<T>(fn: () => T): Computed<T> {
  const c = computed(fn);
  return {
    read: (): T => c.value,
  };
}

function preactEffect<T>(fn: () => T): void {
  // since the test runner pulls from the leaves, computed or effect should be equivalent
  computed(fn);
}

export const preactSignalFramework: ReactiveFramework = {
  name: "Preact Signals",
  signal: preactSignal,
  computed: preactComputed,
  run: () => {},
  effect: preactEffect,
  withBatch: batch,
  withBuild: (fn) => fn(),
};
