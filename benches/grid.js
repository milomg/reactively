import { Reactive, stabilize } from "./core.js";

// The following is an implementation of the cellx benchmark https://codesandbox.io/s/cellx-bench-forked-s6kusj

const cellx = (layers) => {
  const start = {
    prop1: new Reactive(1),
    prop2: new Reactive(2),
    prop3: new Reactive(3),
    prop4: new Reactive(4),
  };

  let layer = start;

  for (let i = layers; i > 0; i--) {
    const m = layer;
    const s = {
      prop1: new Reactive(() => m.prop2.get()),
      prop2: new Reactive(() => m.prop1.get() - m.prop3.get()),
      prop3: new Reactive(() => m.prop2.get() + m.prop4.get()),
      prop4: new Reactive(() => m.prop3.get()),
    };

    new Reactive(() => s.prop1.get(), true);
    new Reactive(() => s.prop2.get(), true);
    new Reactive(() => s.prop3.get(), true);
    new Reactive(() => s.prop4.get(), true);

    s.prop1.get();
    s.prop2.get();
    s.prop3.get();
    s.prop4.get();

    layer = s;
  }

  const end = layer;

  const startTime = performance.now();

  const before = [
    end.prop1.get(),
    end.prop2.get(),
    end.prop3.get(),
    end.prop4.get(),
  ];

  start.prop1.set(4);
  start.prop2.set(3);
  start.prop3.set(2);
  start.prop4.set(1);

  stabilize();

  const after = [
    end.prop1.get(),
    end.prop2.get(),
    end.prop3.get(),
    end.prop4.get(),
  ];

  const endTime = performance.now();
  const elapsedTime = endTime - startTime;

  return [elapsedTime, before, after];
};

const arraysEqual = (a, b) => {
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }

  return true;
};

const benchmark = () => {
  let total = 0;

  const expected = {
    10: [
      [3, 6, 2, -2],
      [2, 4, -2, -3],
    ],
    20: [
      [2, 4, -1, -6],
      [-2, 1, -4, -4],
    ],
    30: [
      [-1, -2, -3, -4],
      [-4, -3, -2, -1],
    ],
    50: [
      [-2, -4, 1, 6],
      [2, -1, 4, 4],
    ],
    100: [
      [-3, -6, -2, 2],
      [-2, -4, 2, 3],
    ],
    1000: [
      [-3, -6, -2, 2],
      [-2, -4, 2, 3],
    ],
    2500: [
      [-3, -6, -2, 2],
      [-2, -4, 2, 3],
    ],
    5000: [
      [2, 4, -1, -6],
      [-2, 1, -4, -4],
    ],
  };

  const results = {};

  const runs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  for (const layers in expected) {
    console.log("----");

    for (const run of runs) {
      const [elapsed, before, after] = cellx(Number(layers));

      results[layers] = [before, after];

      console.log(`Layers ${layers}: ${elapsed}`);

      total += elapsed;
    }
  }

  console.log("----");
  console.log(`Total: ${total}`);

  for (const layers in expected) {
    const [before, after] = results[layers];
    const [expectedBefore, expectedAfter] = expected[layers];

    if (!arraysEqual(before, expectedBefore)) {
      throw new Error(
        `Expected first layer ${expectedBefore}, found first layer ${before}`
      );
    }
    if (!arraysEqual(after, expectedAfter)) {
      throw new Error(
        `Expected last layer ${expectedAfter}, found last layer ${after}`
      );
    }
  }
};

benchmark();
