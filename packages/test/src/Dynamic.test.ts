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
  const b = _(() => {
    // b depends on s, so b's always dirty when s changes, but b may be unneeded.
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

/*
  s
  |
  l
*/
test("dynamic source disappears entirely", () => {
  const s = _(1);
  let done = false;
  let count = 0;

  const c = _(() => {
    count++;

    if (done) {
      return 0;
    } else {
      const value = s();
      if (value > 2) {
        done = true; // break the link between s and c
      }
      return value;
    }
  });

  expect(c()).toBe(1);
  expect(count).toBe(1);
  s.set(3);
  expect(c()).toBe(3);
  expect(count).toBe(2);

  s.set(1); // we've now locked into 'done' state
  expect(c()).toBe(0);
  expect(count).toBe(3);

  // we're still locked into 'done' state, and count no longer advances
  // in fact, c() will never execute again..
  s.set(0); 
  expect(c()).toBe(0);
  expect(count).toBe(3);
});
