import { ReactiveFramework } from "../util/ReactiveFramework";

export const reactivelyDecorate: ReactiveFramework = {
  name: "@reactively/decorate",
  signal: undefined as any,
  computed: undefined as any,
  effect: undefined as any,
  withBatch: (fn) => fn(),
  withBuild: (fn) => fn(),
  run: () => {},
};
