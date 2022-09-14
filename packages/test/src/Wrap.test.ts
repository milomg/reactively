import { $r } from "@reactively/wrap";

test("value getter syntax", () => {
  const a = $r(7);
  expect(a.value).toEqual(7);
  expect(a()).toEqual(7);
});

test("value setter syntax", () => {
  const a = $r(7);
  a.value = 6;
  expect(a.value).toEqual(6);
  expect(a()).toEqual(6);
});
