import { TestWithFramework } from "./AllPerfTests";
import { TestConfig } from "./PerfConfigurations";
import { TestResult, TimingResult } from "./PerfTests";

export function logPerfResult(
  test: TestWithFramework,
  timedResult: TimingResult<TestResult>
): void {
  const row = perfRowStrings(test, timedResult);
  const line = Object.values(row).join(" , ");
  console.log(line);
}

export function logPerfResultHeaders(): void {
  const row = perfReportHeaders();
  const line = Object.values(row).join(" , ");
  console.log(line);
}

export interface PerfRowStrings {
  framework: string;
  size: string;
  nSources: string;
  "read%": string;
  "static%": string;
  nTimes: string;
  test: string;
  time: string;
  gcTime: string;
  updateRate: string;
  title: string;
}

const columnWidth = {
  framework: 20,
  size: 8,
  nSources: 8,
  "read%": 5,
  "static%": 7,
  nTimes: 6,
  test: 20,
  time: 8,
  gcTime: 6,
  updateRate: 10,
  title: 40,
};

function perfReportHeaders(): PerfRowStrings {
  const keys: (keyof PerfRowStrings)[] = Object.keys(columnWidth) as any;
  const kv = keys.map((key) => [key, key]);
  const untrimmed = Object.fromEntries(kv);
  return trimColumns(untrimmed);
}

function perfRowStrings(
  test: TestWithFramework,
  timed: TimingResult<TestResult>
): PerfRowStrings {
  const { config, perfFramework } = test;
  // prettier-ignore
  const { width, totalLayers, staticFraction, nSources, readFraction, iterations } = config;
  const { timing } = timed;

  const untrimmed = {
    framework: perfFramework.framework.name,
    size: `${width}x${totalLayers}`,
    nSources: `${nSources}`,
    "read%": `${readFraction}`,
    "static%": `${staticFraction}`,
    nTimes: `${iterations}`,
    test: test.config.name || "",
    time: timing.time.toFixed(2),
    gcTime: (timing.gcTime || 0).toFixed(2),
    updateRate: (timed.result.count! / timed.timing.time).toFixed(0),
    title: makeTitle(config),
  };

  return trimColumns(untrimmed);
}

export function makeTitle(config: TestConfig): string {
  const { width, totalLayers, staticFraction, nSources, readFraction } = config;
  const dyn = staticFraction < 1 ? "  dynamic" : "";
  const read = readFraction < 1 ? `  read ${percent(readFraction)}` : "";
  const sources = ` ${nSources} sources`;
  return `${width}x${totalLayers} ${sources}${dyn}${read}`;
}

function percent(n: number): string {
  return Math.round(n * 100) + "%";
}

function trimColumns(row: PerfRowStrings): PerfRowStrings {
  const keys: (keyof PerfRowStrings)[] = Object.keys(row) as any;
  const trimmed = { ...row };
  for (const key of keys) {
    const length = columnWidth[key];
    const value = row[key].slice(0, length).padEnd(length);
    trimmed[key] = value;
  }
  return trimmed;
}
