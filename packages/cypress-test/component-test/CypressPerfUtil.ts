
export function withPerf<T>(name: string, fn: () => T): T {
  const startName = name + ".start";
  performance.mark(startName);
  const result = fn();
  const time = performance.measure(name, startName);
  cy.log(name, "duration:", time.duration);
  console.log(name, "duration:", time.duration);
  return result;
}