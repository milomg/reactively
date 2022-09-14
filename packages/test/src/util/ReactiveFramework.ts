export interface Signal<T> {
  read(): T;
  write(v: T): void;
}

export interface Computed<T> {
  read(): T;
}

export interface ReactiveFramework {
  name: string;
  signal<T>(initialValue: T): Signal<T>;
  computed<T>(fn: () => T): Computed<T>;
  effect(fn: () => void): void;
  withBatch<T>(fn: () => T): void;
  withBuild<T>(fn: () => T): T;
  run(): void;
}
