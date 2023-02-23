import { expect, test } from "vitest";
import { HasReactive, reactively } from "@reactively/decorate";

function saveToCloud(name: string, buf: number[]): number[] {
  console.log(buf);
  return buf;
}

export class PatternMaker {
  size = 10e5;
  fillOffset = -1;
  modulus = 100;

  publish(name: string) {
    return saveToCloud(name, this.patternBuffer());
  }

  // sum prev 2 array elements into a new array
  private patternBuffer() {
    const buf = this.expensiveBuffer();
    const prev = buf.slice(0, 2);
    return buf.slice(2).map((v) => {
      const result = (v + prev[0] + prev[1]) % this.modulus;
      prev.shift();
      prev.push(result);
      return result;
    });
  }

  // allocates an array with sequential values.
  private expensiveBuffer() {
    return Array.from({ length: this.size }).map(
      (_v, i) => this.fillOffset + i
    );
  }
}

export class ReactivePatternMaker extends HasReactive {
  @reactively size = 10e5;
  @reactively fillOffset = -1;
  @reactively modulus = 100;

  publish(name: string): any {
    return saveToCloud(name, this.patternBuffer());
  }

  // sum prev 2 array elements into a new array
  @reactively private patternBuffer() {
    const buf = this.sequenceBuffer();
    const prev = buf.slice(0, 2);
    return buf.slice(2).map((v) => {
      const result = (v + prev[0] + prev[1]) % this.modulus;
      prev.shift();
      prev.push(result);
      return result;
    });
  }

  // allocates an array with sequential values.
  @reactively private sequenceBuffer() {
    return Array.from({ length: this.size }).map(
      (_v, i) => this.fillOffset + i
    );
  }
}

test.skip("classy pattern maker", () => {
  const pattern = new PatternMaker();

  function pushPattern(name: string, modulus = 99, fill = 1, size = 2 * 10e6) {
    pattern.size = size;
    pattern.fillOffset = fill;
    pattern.modulus = modulus;
    pattern.publish(name);
  }

  pushPattern("default");
  pushPattern("mod: 99, offset: 1, size: 2m");
  pushPattern("the answer", 42);
});

test.skip("classy reactive pattern maker", () => {
  const pattern = new ReactivePatternMaker();

  function pushPattern(name: string, modulus = 99, fill = 1, size = 2 * 10e6) {
    pattern.size = size;
    pattern.fillOffset = fill;
    pattern.modulus = modulus;
    pattern.publish(name);
  }

  pushPattern("default");
  pushPattern("mod: 99, offset: 1, size: 2m");
  pushPattern("the answer", 42);
});

import { reactive } from "@reactively/core";
test.skip("readme example1", () => {
  // declare some reactive variables.
  const counter = reactive(0);
  const isEven = reactive(() => (counter.value & 1) == 0);
  const render = reactive(() => {
    document.body.textContent = isEven.value ? "even" : "odd";
  });

  /* modify reactive variables.
   dependent reactives are recalculated but only if necessary
     (and note that dependencies do not need to be declared,
      they are tracked automatically: counter -> isEven -> render) */

  counter.value = 1;
  render.get(); // "odd"

  counter.value = 3; // still odd
  counter.set(5); // still odd
  render.get(); // no-op!

  counter.set(2);
  render.get(); // "even"
});

test("readme example 2", () => {
  const a = reactive(0);
  const b = reactive(0);

  const sum = reactive(() => {
    let currentA = a.value; // tells sum to subscribe to a, and only rerun once a has changed
    let currentB = b.value; // tells sum to subscribe to b, and so only rerun once a or b have changed
    return currentA + currentB;
  });
});

test("readme example 3", () => {
  const x = reactive(false);
  const count = reactive(0);

  const waitForX = reactive(() => {
    if (!x.value) return "Waiting for x...";

    return `The current count is ${count.value}`;
  });

  waitForX.get(); // "Waiting for x"
  count.value = 1;
  waitForX.get(); // no-op, immediately returns last value of "Waiting for x"
  x.value = true;
  waitForX.get(); // "The current count is 1"
});

test("readme example 4", () => {
  const a = reactive(0);
  const big = reactive(() => a.value > 0);

  const isABig = reactive(() => {
    return big.value ? "A is big" : "A is not big";
  });

  isABig.get(); // "A is not big"
  a.value = 1;
  isABig.get(); // "A is big"
  a.value = 3;
  isABig.get(); // no-op, still returns "A is big"
});

test.skip("decorate example", () => {
  class ResizeableBuffer extends HasReactive {
    @reactively size = 0;
    @reactively get blocks() { return Math.ceil(this.size / 2 ** 12); }
    @reactively get buffer(): any {
      const newBuf = Buffer.allocUnsafe(this.blocks * 2 ** 12);
      this._buf && newBuf.copy(this._buf);
      return (this._buf = newBuf);
    }
    private _buf: any;
  }

  const b = new ResizeableBuffer();
  b.size = 10 ** 5;

  /* Here we call buffer() twice. In an imperative system we'd allocate twice
   * which is inefficient. A reactive system will allocate only once.  */
  b.buffer.fill(-1);
  b.buffer.setAt(0, 100);

  /* A reactive system can find other efficiencies. Here's one example: */

  b.size += 1; // grow the number of elements, but blocks doesn't change
  b.buffer; // no new buffer allocated here!
});
