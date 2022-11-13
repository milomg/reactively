/** run a function, logging how long it takes */
export function withPerfLog<T>(name: string, fn: () => T): T {
  const start = performance.now();
  const result = fn();
  const diff = performance.now() - start;
  console.log(name, "time:", diff);
  return result;
}

export interface TimedResult<T> {
  result: T;
  time: number;
}

export function runTimed<T>(fn: () => T): TimedResult<T> {
  const start = performance.now();
  const result = fn();
  const time = performance.now() - start;
  return { result, time };
}
