import "./ReactiveLitTest1";

it("reactive lit element", () => {
  cy.get("body").then(async (bodySelector) => {
    const el = document.createElement("reactive-lit1");
    bodySelector[0].appendChild(el);

    cy.get("#hello", { includeShadowDom: true })
      .contains("Hello ?-?")
      .then(() => {
        // we've rendered once in the initial state, and computed once
        expect(el.computeCount).to.equal(1);

        el.intro = "Well"; // triggers a re-render
      })
      .contains("Well ?-?") // verify the re-render
      .then(() => {
        // doubleName is reactively memoized, and so it should not re-execute 
        // since name has not changed.
        // (whether lit calls it to render, or we call it again directly.)
        expect(el.computeCount).to.equal(1);
        expect(el.doubleName()).equal("?-?");
        expect(el.computeCount).to.equal(1);

        el.name = "Fred"; // triggers a re-render
      })
      .contains("Well Fred-Fred") // verify the re-render
      .then(() => {
        expect(el.computeCount).to.equal(2);
        expect(el.doubleName()).equal("Fred-Fred");
        expect(el.computeCount).to.equal(2);
      });
  });
});
