# Reactively

Reactively is a library for fine grained reactive programming.

See [documentation](https://github.com/modderme123/reactively#readme])
for details.

This part of the library (`@reactively/wrap`)
contains a simple wrapper function
for creating reactive elements out of values or functions.

```ts
import { $r } from "@reactively/wrap";

// declare some reactive variables.
const counter = $r(0);
const isEven = $r(() => (counter() & 1) == 0);
const render = $r(() => {
  document.body.textContent = isEven() ? "even" : "odd";
});

/* modify reactive variables.
   dependent reactives are recalculated but only if necessary
     (and note that dependencies do not need to be declared,
      they are tracked automatically: counter -> isEven -> render) */

counter.set(1);
render(); // "odd"

counter.set(3);
counter.set(5); // still odd
render(); // no-op!

counter.set(2);
render(); // "even"
```
