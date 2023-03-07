/** Create an single html element with the specified tag name in the 
 * texture fixture document.
 * 
 * returns the new element and the new element in a cypress selection.
 */
export function withElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  fn: (
    sel: Cypress.Chainable<JQuery<HTMLElement>>,
    el: HTMLElementTagNameMap[K]
  ) => void
): void {
  cy.get("body").then(async (bodySelector) => {
    const el = document.createElement(tag);
    bodySelector[0].appendChild(el);

    const sel = cy.get(el);
    fn(sel, el);
  });
}
