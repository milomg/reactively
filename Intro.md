## Reactive programming

_Reactive programming is popular in web frameworks,
but fine grained reactivity is useful in many situations,
not just for HTML._

Let's say you have some code you want to re-run occasionally
but no more than necessary.

```ts
const expensive = () => {
  /* do something expensive */
};
```

What does your expensive operation do? Well that's up to you!
It could be buffer allocation, a network operation,
a gpu operation, a long mathematical calculation, DOM manipulation.
Anything that you have to redo occasionally but don't want to redo too often.

In this example, we sketch a class that generates configurable patterns
and saves them to the cloud.

```ts
export class PatternMaker {
  size = 10e5;
  fillOffset = -1;
  modulus = 100;

  publish(name: string) {
    return saveToCloud(name, this.patternBuffer());
  }

  // sum prev 2 array elements into a new array
  private patternBuffer() {
    const buf = this.expensiveBuffer();
    const prev = buf.slice(0, 2);
    return buf.slice(2).map((v) => {
      const result = (v + prev[0] + prev[1]) % this.modulus;
      prev.shift();
      prev.push(result);
      return result;
    });
  }

  // allocates an array with sequential values.
  private expensiveBuffer() {
    return Array.from({ length: this.size }).map(
      (_v, i) => this.fillOffset + i
    );
  }
}
```

The user of our PatternMaker class might publish a few pattern variations to the cloud:

```ts
const pattern = new PatternMaker();

function pushPattern(name: string, modulus = 99, fill = 1, size = 2 * 10e6) {
  pattern.size = size;
  pattern.fillOffset = fill;
  pattern.modulus = modulus;
  pattern.publish(name);
}

pushPattern("default");
pushPattern("mod: 99, offset: 1, size: 2m");
pushPattern("the answer", 42);
```

But some of those buffer allocations will be expensive if `size` is large.
And currently everytime the user calls `publish()`
we'll reallocate and recalculate everything.

Let's cache some of these expensive operations and not redo them every time
with **Reactively**.
It's awfully simple.
We just add a few `@reactive` and `@hasReactive` annotations.
That's it!

```ts
@hasReactive
export class ReactivePatternMaker {
  @reactive size = 10e5;
  @reactive fillOffset = -1;
  @reactive modulus = 100;

  publish(name: string): any {
    return saveToCloud(name, this.patternBuffer());
  }

  // sum prev 2 array elements into a new array
  @reactive private patternBuffer() {
    const buf = this.sequenceBuffer();
    const prev = buf.slice(0, 2);
    return buf.slice(2).map((v) => {
      const result = (v + prev[0] + prev[1]) % this.modulus;
      prev.shift();
      prev.push(result);
      return result;
    });
  }

  // allocates an array with sequential values.
  @reactive private sequenceBuffer() {
    return Array.from({ length: this.size }).map(
      (_v, i) => this.fillOffset + i
    );
  }
}
```

`@reactive` functions know what reactive values they depend on and they
recalculate only if necessary.
So `sequenceBuffer()` won't rerun unless `size` or `fillOffset` changes.
and `patternBuffer()` won't rerun unless `sequenceBuffer` or `modulus` changes.

### Vs. Manual Caching

You could build caching yourself of course, but using `@reactive` has several advantages.

- First, as you've seen, it's very simple.
- Second, `@reactive` functions and methods _automatically_ track their sources.
  Many approaches to caching (function memoization, react hooks, lit's changedProperties list, etc.) require that
  the programmer _manually_ list sources.
  That's not just more effort to maintain,
  a static source list is apt to include sources that are not needed every time,
  which means your reactive functions are apt to rerun unnecessarily.
- Third, `@reactive` dependency tracking extends beyond class/component boundaries,
  so the benefits of clever caching and smart recalculation extends across modules.
- Finally, **Reactively** includes some clever global optimization algorithms.
  A `@reactive` function is run only if needed and only runs once.
  Furthermore, even deep and complicated networks of dependencies are analyzed efficiently in linear time.
  Without something like *R*eactively,
  it's easy to end up with O(n log n) searches
  if every use of a reactive function needs to check every dependency,
  or every change needs to notify every dependent.

### Classes an Properties vs Functions and Variables

We provide both class and functional wrappers to **Reactively**.
You can mix and match depending on the javascript style you prefer.

Here's the same example w/o classes:

```ts
import { $r } from "@reactively/wrap";

export const size = $r(10e5);
export const fillOffset = $r(-1);
export const modulus = $r(100);

const sequenceBuffer = $r(() => {
  return Array.from({ length: size() }).map((_v, i) => fillOffset() + i);
});

const patternBuffer = $r(() => {
  const buf = sequenceBuffer();
  const prev = buf.slice(0, 2);
  return buf.slice(2).map((v) => {
    const result = (v + prev[0] + prev[1]) % modulus();
    prev.shift();
    prev.push(result);
    return result;
  });
});

export function publish(name: string): any {
  return saveToCloud(name, patternBuffer());
}
```

and you might use it like this

```ts
function pushPattern(name: string, mod = 99, fill = 1, length = 2 * 10e6) {
  size.set(length);
  fillOffset.set(fill);
  modulus.set(mod);
  publish(name);
}

pushPattern("default");
pushPattern("mod: 99, offset: 1, size: 2m");
pushPattern("the answer", 42);
```

If you prefer a functional style, you can wrap variables and functions with `$r`
rather than using the `@reactive` decorator on properties of a class.

You can use whichever style you prefer and feel free to mix and match both styles.
For example, you might use classes and @reactive decorators for `Reactively` enhanced lit webcomponents,
but use function style in other parts of your application.
See [`@reactively/lit`](https://www.npmjs.com/package/@reactively/lit)
for details of combining lit and and `Reactively`.
