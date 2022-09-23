import { $r as _ } from "@reactively/wrap";
import { promiseDelay } from "./util/AsyncUtil";

test("async modify", async () => {
  const a = _(1);
  const b = _(() => a() + 10);
  await promiseDelay(10).then(() => a.set(2));
  expect(b()).toEqual(12);
});

test("async modify in reaction before await", async () => {
  const s = _(1);
  const a = _(async () => {
    s.set(2);
    await promiseDelay(10);
  });
  const l = _(() => s() + 100);

  a();
  expect(l()).toEqual(102);
});

test("async modify in reaction after await", async () => {
  const s = _(1);
  const a = _(async () => {
    await promiseDelay(10);
    s.set(2);
  });
  const l = _(() => s() + 100);

  await a();
  expect(l()).toEqual(102);
});

// test("async read/write in reaction after await", async () => {
//   const s = _(1);
//   const s2 = _(0);
//   const a = _(async () => {
//     await promiseDelay(10);
//     const plus = s() + 10;
//     s2.set(plus);
//   });

//   await a();
//   s.set(2);

//   await a();
//   expect(l()).toEqual(102);
// });
