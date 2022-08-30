import { $r } from "@reactively/wrap";

test("dynamic sources", () => {
  const a = $r(false);
  const b = $r(2);
  let count = 0;

  const c = $r(() => {
    count++;
    a() || b();
  });

  c();
  expect(count).toBe(1);
  a.set(true);
  c();
  expect(count).toBe(2);

  b.set(4); 
  c();
  expect(count).toBe(2);
});
