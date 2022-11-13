import { Computed, ReactiveFramework, Signal } from "./ReactiveFramework";
import {
  batch,
  createEffect,
  createMemo,
  createRoot,
  createSignal,
} from "solid-js/dist/solid.cjs";

function solidSignal<T>(initialValue: T): Signal<T> {
  const [getter, setter] = createSignal(initialValue);
  return {
    write: setter,
    read: getter,
  };
}

function solidComputed<T>(fn: () => T): Computed<T> {
  const memo = createMemo(fn);
  return {
    read: memo,
  };
}

function solidEffect<T>(fn: () => T): void {
  createEffect(fn);
}

export const solidFramework: ReactiveFramework = {
  name: "SolidJS",
  signal: solidSignal,
  computed: solidComputed,
  run: () => {},
  effect: solidEffect,
  withBatch: batch,
  withBuild: createRoot,
};
