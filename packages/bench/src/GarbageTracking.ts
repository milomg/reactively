import { performance, PerformanceEntry, PerformanceObserver } from "perf_hooks";
import { promiseDelay } from "../../test/src/util/AsyncUtil";

/** Track garbage collection time and report
 * garbage collections that happened during watched function execution.  */
export class GarbageTrack {
  private trackId = 0;
  private observer = new PerformanceObserver((list) =>
    this.perfEntries.push(...list.getEntries())
  );
  private perfEntries: PerformanceEntry[] = [];
  private periods: WatchPeriod[] = [];

  /** look for gc events during the time this function is executing */
  watch<T>(fn: () => T): { result: T; trackId: number } {
    this.trackId++;
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    this.periods.push({ trackId: this.trackId, start, end });

    return { result, trackId: this.trackId };
  }

  async oneResult(trackId: number): Promise<number> {
    await promiseDelay(10); // wait one eventloop cycle until the perfEntries are populated

    const period = this.periods.find((period) => (period.trackId === trackId));
    if (!period) {
      return Promise.reject("no period found");
    }

    const entries = this.perfEntries.filter(
      (e) => e.startTime >= period.start && e.startTime < period.end
    );
    const totalTime = entries.reduce((t, e) => e.duration + t, 0);
    return totalTime;
  }

  destroy() {
    this.observer.disconnect();
  }

  constructor() {
    this.observer.observe({ entryTypes: ["gc"] });
  }
}

interface WatchPeriod {
  trackId: number;
  start: number;
  end: number;
}
