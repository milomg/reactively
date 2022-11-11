import "./ReactiveLitExample2";
import { withElement } from "./WithElement";

describe("reactive lit element with getter", () => {
  it.only("a reactive property change can trigger an update", () => {
    withElement("reactive-lit2", (selection, el) => {
      selection
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
