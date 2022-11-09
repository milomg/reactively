/** run a function, logging how long it takes */
export function withPerfLog<T>(name: string, fn: () => T): T {
  const start = performance.now();
  const result = fn();
  const diff = performance.now() - start;
  console.log(name, "time:", diff);
  return result;
}

/** run a function n times, logging the minimum time */
export function withPerfLogN<T>(name: string, times: number, fn: () => T): T {
  const results = Array.from({ length: times }).map(() => runTimed(fn));
  const fastest = results.sort((a, b) => a.time - b.time).slice(0, 1)[0];
  const timeStr = fastest.time.toFixed(2).padStart(8, " ");
  console.log(`${name} : ${timeStr}`);
  return fastest.result;
}

export interface TimedResult<T> {
  result: T;
  time: number;
}

function runTimed<T>(fn: () => T): TimedResult<T> {
  const start = performance.now();
  const result = fn();
  const time = performance.now() - start;
  return { result, time };
}
