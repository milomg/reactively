export function withElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  fn: (
    sel: Cypress.Chainable<JQuery<HTMLElement>>,
    el: HTMLElementTagNameMap[K]
  ) => void
): void {
  cy.get("body").then(async (bodySelector) => {
    document.querySelectorAll(tag).forEach((e) => e.remove());
    const el = document.createElement(tag);
    bodySelector[0].appendChild(el);

    const sel = cy.get("#hello", { includeShadowDom: true });
    fn(sel, el);
  });
}
