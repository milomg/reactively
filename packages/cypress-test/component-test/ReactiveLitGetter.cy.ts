import { withElement } from "./WithElement";
import { html, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ReactiveLitElement, reactiveProperty } from "@reactively/lit";

/**
 * a test class for mixing reactively properties with lit
 */
@customElement("reactive-lit2")
export class ReactiveLitExample2 extends ReactiveLitElement {
  @reactiveProperty({ reflect: true }) a = 1;

  @reactiveProperty() get doesGet(): string {
    this.computeCount++;
    return `#${this.a}`;
  }

  computeCount = 0;

  protected override reactiveRender(): TemplateResult {
    return html`<div id="hello">${this.doesGet}</div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "reactive-lit2": ReactiveLitExample2;
  }
}

describe("reactive lit element with getter", () => {
  it("a reactive property change can trigger an update", () => {
    withElement("reactive-lit2", (selection, el) => {
      selection
        .get("#hello", { includeShadowDom: true })
        .contains("#1")
        .then(() => {
          el.a = 2;
        })
        .contains("#2") // confirm that we triggered a render
        .then(() => {
          // object property should be reflected to html attribute
          expect(el.getAttribute("a")).to.equal("2");

          // confirm that getter is cached by reactively
          el.doesGet;
          expect(el.computeCount).to.equal(2);

          el.a = 3;
          el.doesGet;
          expect(el.computeCount).to.equal(3);
        });
    });
  });
});
