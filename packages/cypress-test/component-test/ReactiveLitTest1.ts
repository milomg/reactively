import { html, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ReactiveLitElement, reactiveProperty } from "@reactively/lit";
import { reactively } from "@reactively/decorate";

/**
 * a test class for mixing reactively properties with lit
 */
@customElement("reactive-lit1")
export class ReactiveLitTest1 extends ReactiveLitElement {
  @property() litOnly = "Hello"; // not a reactively property
  @reactiveProperty() comboProp = "?"; // reactively and lit property
  @reactively nonLit = "!"; // not a lit property

  @reactively computed(): string {
    this.computeCount++;
    return this.comboProp + this.nonLit;
  }

  computeCount = 0;

  render(): TemplateResult {
    return html`<div id="hello">${this.litOnly} ${this.computed()}</div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "reactive-lit1": ReactiveLitTest1;
  }
}
