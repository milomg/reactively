import { stabilizeContinuously } from "@reactively/core";
import { reactively } from "@reactively/decorate";
import { ReactiveLitElement, reactiveProperty } from "@reactively/lit";
import { html, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import { withElement } from "./WithElement";

/**
 * a test class for mixing reactively properties with lit
 */
@customElement("reactive-lit1")
export class ReactiveLitTest1 extends ReactiveLitElement {
  @property() litOnly = "Hello"; // not a reactively property
  @reactiveProperty() comboProp = "?"; // reactively and lit property
  @reactively nonLit = "!"; // not a lit property
  @reactively unusedNonLit = "whee"; // not a lit property

  @reactively computed(): string {
    this.computeCount++;
    return this.comboProp + this.nonLit;
  }

  computeCount = 0;

  protected reactiveRender(): TemplateResult {
    return html`<div id="hello">${this.litOnly} ${this.computed()}</div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "reactive-lit1": ReactiveLitTest1;
  }
}

describe("reactive lit element", () => {
  it("recomputes computed property when combo property changes", () => {
    withElement("reactive-lit1", (selection, e) => {
      stabilizeContinuously();
      selection
        .get("#hello", { includeShadowDom: true })
        .then(() => {
          // no recompute necessary even as we read computedCombo()
          expect(e.computeCount).to.equal(1);
          expect(e.computed()).equal("?!");
          expect(e.computeCount).to.equal(1);

          e.comboProp = "Fred"; // triggers a re-render
        })
        .contains("Hello Fred!") // verify the re-render
        .then(() => {
          expect(e.computeCount).to.equal(2);
          expect(e.computed()).equal("Fred!");
          expect(e.computeCount).to.equal(2);
        })
        .then(() => e.remove())
        .then(() => stabilizeContinuously(false));
    });
  });

  it("render() when a reactive property used in template changes", () => {
    withElement("reactive-lit1", (selection, e) => {
      stabilizeContinuously();
      selection
        .get("#hello", { includeShadowDom: true })
        .then(() => {
          e.nonLit = ","; // should trigger a re-render
        })
        .contains("Hello ?,") // verify re-render
        .then(() => {
          expect(e.computeCount).to.equal(2);
        })
        // .then(() => e.remove())
        .then(() => stabilizeContinuously(false));
    });
  });

  it("doesn't render() when unused non-lit reactive property changes", () => {
    withElement("reactive-lit1", (selection, e) => {
      stabilizeContinuously();
      selection
        .get("#hello", { includeShadowDom: true })
        .then(() => {
          e.unusedNonLit = "whoa"; // does not trigger a re-render
        })
        .wait(150)
        .contains("Hello ?!") // verify no re-render
        .then(() => e.remove())
        .then(() => stabilizeContinuously(false));
    });
  });
});
