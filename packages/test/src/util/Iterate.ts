export function times(n: number, fn: (i: number) => void): void {
  for (let i = 0; i < n; i++) {
    fn(i);
  }
}

export function mapN<T>(n: number, fn: (i: number) => T): T[] {
  const result = new Array(n);
  for (let i = 0; i < n; i++) {
    result[i] = fn(i);
  }
  return result;
}

