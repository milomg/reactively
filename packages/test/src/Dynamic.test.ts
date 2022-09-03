import { $r as _ } from "@reactively/wrap";

/*
a-c
 %
b
*/
test("dynamic sources recalculate correctly", () => {
  const a = _(false);
  const b = _(2);
  let count = 0;

  const c = _(() => {
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

/*
dependency is dynamic: sometimes l depends on b, sometimes not.
  s          s
 / \        / \
a   b  or  a   b
 \ /        \
  l          l
*/
test("dynamic sources don't re-execute a parent unnecessarily", () => {
  const s = _(2);
  const a = _(() => s() + 1);
  let bCount = 0;
  const b = _(() => { // b depends on s, so b's always dirty when s changes, but b may be unneeded.
    bCount++;
    return s() + 10;
  });
  const l = _(() => {
    let result = a();
    if (result & 0x1) {
      result += b(); // only execute b if a is odd
    }
    return result;
  });

  expect(l()).toEqual(15);
  expect(bCount).toEqual(1);
  s.set(3);
  expect(l()).toEqual(4);
  expect(bCount).toEqual(1); 
});
