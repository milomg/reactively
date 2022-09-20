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

  render(): TemplateResult {
    return html`<div id="hello">${this.doesGet}</div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "reactive-lit2": ReactiveLitExample2;
  }
}
