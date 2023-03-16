import { withElement } from "./WithElement";
import { reactive, stabilizeContinuously } from "@reactively/core";
import { ReactiveLitElement, reactiveProperty } from "@reactively/lit";
import { html, TemplateResult } from "lit";
import { customElement } from "lit/decorators.js";

const reactiveSource = reactive(9);

/**
 * a test class for mixing reactively properties with lit
 */
@customElement("lit-effect")
export class LitEffectExample extends ReactiveLitElement {
  effectCount = 0;

  @reactiveProperty() get a() {
    this.effectCount++;
    return reactiveSource.get();
  }

  protected reactiveRender(): TemplateResult {
    return html`<div id="hello">${this.a}</div>`;
  }

  render2():TemplateResult {
    return html``;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "lit-effect": LitEffectExample;
  }
}

describe("lit element with an effect", () => {
  it("effect property triggers a rerender on stabilize()", () => {
    stabilizeContinuously();
    withElement("lit-effect", (selection, el) => {
      selection
        .get("#hello", { includeShadowDom: true })
        .contains("9")
        .then(() => {
          expect(el.effectCount).equals(1);
        })
        .then(() => {
          reactiveSource.set(21);
        })
        .contains("21")
        .then(() => expect(el.effectCount).equals(2))
        .then(() => stabilizeContinuously(false));
    });
  });
});
