import { test } from "vitest";
import { ReactiveFramework } from "./ReactiveFramework";
export function frameworkTest<T>(
  f: ReactiveFramework,
  testName: string,
  fn: () => T
): void {
  test(`${f.name} | ${testName}`, () => {
    f.withBatch(fn);
  });
}
