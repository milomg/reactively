import "./ReactiveLitTest1";
import { withElement } from "./WithElement";

describe("reactive lit element", () => {
  it("re-renders when lit only property is changed", () => {
    withElement("reactive-lit1", (selection, elem) => {
      selection
        .contains("Hello ?!")
        .then(() => {
          // we've rendered once in the initial state, and computed once
          expect(elem.computeCount).to.equal(1);

          elem.litOnly = "Well"; // triggers a re-render

          // we've rendered once in the initial state, and computed once
          expect(elem.computeCount).to.equal(1);
        })
        .contains("Well ?!"); // verify the re-render
    });
  });

  it("recomputes computed property when combo property changes", () => {
    withElement("reactive-lit1", (selection, e) => {
      selection
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
        });
    });
  });

  it("does not re-render when a non-lit reactive property changes", () => {
    withElement("reactive-lit1", (selection, e) => {
      selection
        .then(() => {
          e.nonLit = ","; // does not trigger a re-render
        })
        .contains("Hello ?!") // verify no re-render
        .then(() => {
          expect(e.computeCount).to.equal(1);

          e.litOnly = "Well"; // triggers a re-render
        })
        .contains("Well ?,"); // verify re-render picked up non-lit change
    });
  });
});
