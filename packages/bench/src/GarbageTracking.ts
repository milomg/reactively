import { performance, PerformanceEntry, PerformanceObserver } from "perf_hooks";
import { promiseDelay } from "../../test/src/util/AsyncUtil";

/** Track garbage collection time and report 
 * garbage collections that happened during watched function execution.  */
export class GarbageTrack {
  private observer = new PerformanceObserver((list) =>
    this.perfEntries.push(...list.getEntries())
  );
  private perfEntries: PerformanceEntry[] = [];
  private periods: WatchPeriod[] = [];

  /** look for gc events during the time this function is executing */
  watch<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    this.periods.push({ name, start, end });

    return result;
  }

  /** report collected gc time for each watched function */
  async report(): Promise<void> {
    await promiseDelay(10); // wait one eventloop cycle until the perfEntries are populated
    this.periods.forEach((period) => {
      const entries = this.perfEntries.filter(
        (e) => e.startTime >= period.start && e.startTime < period.end
      );
      const totalTime = entries.reduce((t, e) => e.duration + t, 0);
      console.log(`${period.name} >> gcTime: ${totalTime}ms`);
    });
    this.observer.disconnect();
  }

  constructor() {
    this.observer.observe({ entryTypes: ["gc"] });
  }
}

interface WatchPeriod {
  name: string;
  start: number;
  end: number;
}
