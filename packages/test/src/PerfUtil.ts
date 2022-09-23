/** run a function, logging how long it takes */
export function withPerfLog<T>(name: string, fn: () => T): T {
  const start = performance.now();
  const result = fn();
  const diff = performance.now() - start;
  console.log(name, "time:", diff);
  return result;
}
