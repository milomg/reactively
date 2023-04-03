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
