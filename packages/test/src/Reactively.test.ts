import { reactive } from "@reactively/core";
test("setting a memo to a different memo", () => {
  const a = reactive(1);
  const b = reactive(() => a.value * 2);
  const c = reactive(() => b.value);

  expect(c.value).toBe(2);
  b.set(() => a.value * 3);
  expect(c.value).toBe(3);
});

test("setting a memo to a signal", () => {
    const a = reactive(1);
    const b = reactive(() => a.value * 2);
    const c = reactive(() => b.value);
    
    expect(c.value).toBe(2);
    b.set(8);
    expect(c.value).toBe(8);
    
    a.set(0);
    expect(c.value).toBe(8);
});

test("setting a signal to a memo", () => {
    const a = reactive(1);
    const b = reactive(2);
    const c = reactive(() => b.value);
    
    expect(c.value).toBe(2);
    b.set(() => a.value * 4);
    expect(c.value).toBe(4);

    a.set(3);
    expect(c.value).toBe(12);
});
