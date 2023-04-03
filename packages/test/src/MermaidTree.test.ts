import { expect, test } from "vitest";
import { HasReactive, reactively } from "@reactively/decorate";
import { mermaidSources } from "@reactively/debug";

/* 
        a  b
        | /
        c
        |
        d
*/

// prettier-ignore
const expectedSimpleTree = 
`graph TD
    c --> d
    a --> c
    b --> c`;

test("simple mermaid tree", () => {
  class TwoComputed extends HasReactive {
    @reactively a = 7;
    @reactively b = 1;

    @reactively c(): number {
      return this.a * this.b;
    }

    @reactively d(): number {
      return this.c() + 1;
    }
  }
  const o = new TwoComputed();
  o.d();
  const tree = mermaidSources(o.__reactive!.d, true);
  expect(tree).toBe(expectedSimpleTree);
});

/* 
        a  b
        | /
        c    e
        | \ /
        d  f
*/

// prettier-ignore
const expectedDoubleTree = 
`graph TD
    c --> d
    a --> c
    b --> c
    c --> f
    e --> f`;

test("double mermaid tree", () => {
  class TwoComputed extends HasReactive {
    @reactively a = 7;
    @reactively b = 1;
    @reactively e = 4;

    @reactively c(): number {
      return this.a * this.b;
    }

    @reactively d(): number {
      return this.c() + 1;
    }

    @reactively f(): number {
      return this.c() + this.e;
    }
  }
  const o = new TwoComputed();
  o.d();
  o.f();

  const r = o.__reactive!;
  const nodes = [r.d, r.f];
  const tree = mermaidSources(nodes, true);
  expect(tree).toBe(expectedDoubleTree);
});
