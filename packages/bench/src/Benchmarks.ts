import { parseArgs, ParseArgsConfig } from "node:util";
import { makePerfList } from "../../test/src/util/AllPerfTests";
import { logPerfResultHeaders } from "../../test/src/util/PerfLogging";
import { benchmarkTest } from "./NodeBenchmark";

const options = {
  quick: { type: "boolean" },
  repeats: { type: "string" },
};

const { values } = parseArgs({ options } as ParseArgsConfig);
const testOptions = {
  quick: values?.quick as boolean,
};
const testRepeats = asNaturalNumber(values?.repeats);

main();

async function main() {
  const tests = makePerfList(testOptions);

  logPerfResultHeaders();
  for (const t of tests) {
    await benchmarkTest(t, testRepeats);
  }
}

function asNaturalNumber(value: any): number | undefined {
  if (typeof value !== "string") {
    return undefined;
  } else {
    const int = Math.abs(Number.parseInt(value));
    if (Number.isFinite(int)) {
      return int;
    } else {
      return undefined;
    }
  }
}
