import { HasReactive, reactive } from "@reactively/decorate";

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
  @reactive size = 10e5;
  @reactive fillOffset = -1;
  @reactive modulus = 100;

  publish(name: string): any {
    return saveToCloud(name, this.patternBuffer());
  }

  // sum prev 2 array elements into a new array
  @reactive private patternBuffer() {
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
  @reactive private sequenceBuffer() {
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

import { $r as $r } from "@reactively/wrap";

test.skip("functional pattern maker", () => {
  const size = $r(10e5);
  const fillOffset = $r(-1);
  const modulus = $r(100);

  const sequenceBuffer = $r(() => {
    return Array.from({ length: size() }).map((_v, i) => fillOffset() + i);
  });

  const patternBuffer = $r(() => {
    const buf = sequenceBuffer();
    const prev = buf.slice(0, 2);
    return buf.slice(2).map((v) => {
      const result = (v + prev[0] + prev[1]) % modulus();
      prev.shift();
      prev.push(result);
      return result;
    });
  });

  function publish(name: string): any {
    return saveToCloud(name, patternBuffer());
  }

  function pushPattern(name: string, mod = 99, fill = 1, length = 2 * 10e6) {
    size.set(length);
    fillOffset.set(fill);
    modulus.set(mod);
    publish(name);
  }

  pushPattern("default");
  pushPattern("mod: 99, offset: 1, size: 2m");
  pushPattern("the answer", 42);
});
