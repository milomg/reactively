# Reactively

Reactively is a library for fine grained reactive programming.
Use Reactively to add smart recalculation and caching almost anywhere.
Reactively provides fine grained reactivity and nothing more.

`@reactively/core` is currently less than 1K bytes gzipped.

```ts
import { reactive } from "@reactively/core";

// declare some reactive variables.
const counter = reactive(0);
const isEven = reactive(() => (counter.value & 1) == 0);
const render = reactive(() => {
  document.body.textContent = isEven.value ? "even" : "odd";
});

/* modify reactive variables.
  dependent reactives are recalculated but only if necessary
    (and note that dependencies do not need to be declared,
    they are tracked automatically: counter -> isEven -> render) */

counter.value = 1;
render.get(); // "odd"

counter.value = 3; // still odd
counter.set(5);    // still odd
render.get(); // no-op!

counter.set(2);
render.get(); // "even"
```

Reactively caches the results of the render() function automatically
and Reactively won't run render() again unless its inputs have changed.
So the second call to render() is optimized into a no-op.

Reactively is useful to avoid unnecessarily repeating expensive operations
(memory allocation, network operations, storage, long computations, DOM manipulation, etc.)
While you can manually write your own caching and dependency checking,
a declarative approach is easier, and the result is more maintainable.

---

## Discovering Reactively

Traditionally, if you want to memoize a function in JavaScript, you have to manually specify all the dependencies as parameters, even if sometimes you don't use all the parameters.

Reactively eschews that in favor of automatically detecting what variables you use in a reactive expression.

```ts
import { reactive } from "@reactively/core";
const a = reactive(0);
const b = reactive(0);

const sum = reactive(() => {
  let currentA = a.value; // tells sum to subscribe to a, and only rerun once a has changed
  let currentB = b.value; // tells sum to subscribe to b, and so only rerun once a or b have changed
  return currentA + currentB;
});
```

This allows you to structure your code differently than memoization allows you to, you don't have to know the dependencies up front.

Additionally, Reactively allows you to dynamically change which variables you depend on at runtime. If you are are waiting for a single variable `x` to be true before the rest of your code runs, your code won't execute as those other variables change.

```ts
import { reactive } from "@reactively/core";

const x = reactive(false);
const count = reactive(0);

const waitForX = reactive(() => {
  if (!x.value) return "Waiting for x...";

  return `The current count is ${count.value}`;
});

waitForX.get(); // "Waiting for x"
count.value = 1;
waitForX.get(); // no-op, immediately returns last value of "Waiting for x"
x.value = true;
waitForX.get(); // "The current count is 1"
```

Reactively has one final trick up its sleeve for running your code less often.
Reactive elements run an equality check, and dependent reactive elements are only rerun if the equality check fails.

```ts
import { reactive } from "@reactively/core";

const a = reactive(0);
const big = reactive(() => a.value > 0);

const isABig = reactive(() => {
  return big.value ? "A is big" : "A is not big";
});

isABig.get(); // "A is not big"
a.value = 1;
isABig.get(); // "A is big"
a.value = 3;
isABig.get(); // no-op, still returns "A is big"
```

---

# Reactive Programming Paradigms

Reactive programming allows you to define program segments called reactive elements that run automatically as needed. The main goal of a reactive API is to make it easy to define _reactive elements_ and their _sources_.

- Reactive elements rely on other reactive elements or external data as sources.
- Reactive elements run automatically when their sources change.
- The reactive system orchestrates the execution of the reactive elements for efficiency and consistency.

Reactively uses a single annotation `@reactive` to identify reactive elements.
And in Reactively, sources for reactive elements are detected automatically.

**Reactively Priorities**

1. Simplicity in the developer experience (lightweight, easy to add, small api, clean semantics)
2. minimal re-execution of user code
3. performance

Other frameworks have different priorities, in different orders.
That's just fine, we're exploring a different part of the design space.

For example, Reactively tries hard to not re-execute user code unnecessarily.
That's not always necessary. Any given segment of user code is probably cheap to run.
But Reactively is willing to trade off some time thinking about what not to re-execute
so the user can put expensive computations/allocations inside reactive elements
without extra protection.

**Reactive terminology**

_reactive, computed, signals, effects, state, memo_

In some lighter weight reactive systems,
sources that can be set externally from the reactive system
are distinguished from reaction code that runs within the system.
Reactive sources are variously called ‘signals’ or ‘events’ or ‘state’.

Reactive functions might be called
‘computed’ values, ‘effects’, ‘memo’, ‘reactions’, or ‘reactive’ values.
Some systems further distinguish between intermediate reactions that can be used by
other reactions ('computed') and leaf reactions ('effects').

In `Reactively`, all reactive sources and computations are simply labeled @reactive.

_streams_

The flow of data through the reactive graph can also be encapsulated in asynchronous streams.
Streams enable abstraction over patterns of data flow over time: debouncing, grouping, etc.
Streams are rich but complicated abstractions.
Most front end frameworks have chosen lighter weight approaches to reactivity, as we have here.

_fine grain vs coarse grain_

A reactive library tracks the sources and a reactive elements and smartly re-executes only when needed.
But what kind of thing can be a reactive element?
`Reactively` is fine grained - it applies to individual functions, variables and properties.
Some reactive libraries re-execute at a coarser level, by component. (e.g. lit or React)

**Execution model**

The set of reactive elements and their source dependencies forms a directed (and usually acyclic) graph. Conceptually, reactivity changes enter at the roots of the graph and propagate to the leaves.

But that doesn’t mean the reactive system needs to respond to a change at the root by immediately deeply traversing the tree and re-executing all of the related reactive elements. What if the user has made changes to two roots? We might unnecessarily execute elements twice, which is inefficient. What if the user doesn’t consume a reactive leaf element before a new change comes around? Why bother executing that element if it’s not used? If two changes are in flight through the execution system at the same time, might user code see an unexpected mixed state (this is called a ‘glitch’)?

These are the questions the reactive execution system needs to address.

_Push_ systems emphasize pushing changes from the roots down to the leaves.
Push algorithms are fast for the framework to manage
but can push changes even through unused parts of the graph,
which wastes time on unused user computations and may surprise the user.
For efficiency, push systems typically expect the user to specify a 'batch' of changes
to push at once.

_Pull_ systems emphasize traversing the graph in reverse order,
from user consumed reactive elements up towards roots.
Pull systems have a simple developer experience and don’t require explicit batching.
But pull systems are are apt to traverse the tree too often. Each leaf element needs to traverse all the way up the tree to detect changes, potentially resulting in many extra traversals.

Reactively is a hybrid _push-pull_ system. It pushes dirty notifications down the graph, and then executes reactive elements lazily on demand as they are pulled from leaves. This costs the framework some bookkeeping and an extra traversal of its internal graph.
But the developer wins by getting the simplicity of a pull system
and the most of the execution efficiency of a push system.
