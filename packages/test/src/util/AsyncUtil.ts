/** return a promise that completes after a set number of milliseconds */
export function promiseDelay(timeout = 0): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, timeout));
}
