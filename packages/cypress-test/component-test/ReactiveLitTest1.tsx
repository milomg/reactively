import { html, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import {
  ReactiveLitElement,
  reactiveProperty,
} from "@reactively/lit";
import { reactive } from "@reactively/decorate";

/**
 * a test class for mixing reactively properties with lit
 */
@customElement("reactive-lit1")
export class ReactiveLitTest1 extends ReactiveLitElement {
  @property() intro = "Hello"; // not a reactively property

  @reactiveProperty() name = "?"; // reactively and lit property

  @reactive doubleName(): string { // not a lit property
    this.computeCount++;
    return this.name + "-" + this.name;
  }

  computeCount = 0;

  render(): TemplateResult {
    return html`<div id="hello">${this.intro} ${this.doubleName()}</div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "reactive-lit1": ReactiveLitTest1;
  }
}
