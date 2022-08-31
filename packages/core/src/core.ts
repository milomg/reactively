/**
 * Nodes for constructing a reactive graph of reactive values and reactive computations.
 * The graph is acyclic.
 * The user inputs new values into the graph by calling set() on one more more reactive nodes.
 * The user retrieves computed results from the graph by calling get() on one or more reactive nodes.
 * The library is responsible for running any necessary reactive computations so that get() is
 * up to date with all prior set() calls anywhere in the graph.
 *
 * We call input nodes 'roots' and the output nodes 'leaves' of the graph here in discussion,
 * but the distinction is based on the use of the graph, all nodes have the same internal structure.
 * Changes flow from roots to leaves. It would be effective but inefficient to immediately propagate
 * all changes from a root through the graph to descendant leaves. Instead we defer change
 * most change progogation computation until a leaf is accessed. This allows us to coalesce computations
 * and skip altogether recalculating unused sections of the graph.
 *
 * Each reactive node tracks its sources and its observers (observers are other
 * elements that have this node as a source). Source and observer links are updated automatically
 * as observer reactive computations re-evaluate and call get() on their sources.
 *
 * Each node stores a cache state to support the change propogation algorithm: 'clean', 'check', or 'dirty'
 * In general, execution proceeds in three passes:
 *  1. set() propogates changes some flags down the graph to the leaves
 *     children are marked as dirty and their deeper descendants marked as check
 *     (no reactive computations are evaluated)
 *  2. get() requests that parent nodes updateIfNecessary(), which proceeds recursively up the tree
 *     to decide whether the node is clean (parents unchanged) or dirty (parents changed)
 *  3. updateIfNecessary() evaluates the reactive computation if the node is dirty
 *     (the computations are executed in root to leaf order because of the traversal order)
 */

/** current capture context for identifying @reactive sources (other reactive elements)
 * - active while evaluating a reactive function body  */
let CurrentReaction: Reactive<any> | undefined = undefined;

let gets: Reactive<any>[] = [];

/** reactive nodes are marked dirty when their source values change TBD*/
const CacheCurrent = 0; // reactive value is valid, no need to recompute
const CacheCheck = 1; // reactive value might be stale, check parent nodes to decide whether to recompute
const CacheDirty = 2; // reactive value is invalid, parents have changed, valueneeds to be recomputed
type CacheState = typeof CacheCurrent | typeof CacheCheck | typeof CacheDirty;

/** A reactive element contains a mutable value that can be observed by other reactive elements.
 *
 * The property can be modified externally by calling set().
 *
 * Reactive elements may also contain a 0-ary function body that produces a new value using
 * values from other reactive elements.
 *
 * Dependencies on other elements are captured dynamically as the 'reactive' function body executes.
 *
 * The reactive function is re-evaluated when any of its dependencies change, and the result is
 * cached.
 */
export class Reactive<T> {
  private value: T;
  private fn?: () => T;
  private observers?: Set<Reactive<any>>;
  private sources?: Set<Reactive<any>>;
  private rawSources?: Reactive<any>[]; // sources in reference order, not deduplicated
  private state: CacheState = CacheDirty;
  cleanups: ((oldValue: T) => void)[] = [];

  constructor(fnOrValue: (() => T) | T) {
    if (typeof fnOrValue === "function") {
      this.fn = fnOrValue as () => T;
      this.value = undefined as any;
    } else {
      this.fn = undefined;
      this.value = fnOrValue;
    }
  }

  get(): T {
    gets.push(this);
    if (this.fn) this.updateIfNecessary();
    return this.value;
  }

  set(value: T): void {
    if (this.value !== value) {
      this.observers?.forEach((x) => x.stale(CacheDirty));
    }
    this.value = value;
  }

  private stale(state: CacheState): void {
    if (this.state < state) {
      this.state = state;
      this.observers?.forEach((x) => x.stale(CacheCheck));
    }
  }

  /** run the computation fn, updating the cached value */
  private update(): boolean {
    const oldValue = this.value;
    withCurrentCompute(this, () => {
      this.cleanups.forEach((c) => c(this.value));
      this.cleanups = [];
      this.value = this.fn!();

      // if the sources have changed, update source & observer links
      if (!arrayEq(gets, this.rawSources)) {
        // update source up links and clear observers
        const { sources } = this;
        this.rawSources = gets;
        if (sources) {
          sources.forEach((s) => s.observers?.delete(this));
          sources.clear();
          gets.forEach((e) => sources.add(e));
        } else {
          this.sources = new Set(gets);
        }

        // update observer down links
        this.sources?.forEach((source) => {
          if (!source.observers) {
            source.observers = new Set();
          }
          source.observers.add(this);
        });
      }
    });
    this.state = CacheCurrent;

    if (oldValue !== this.value) {
      this.observers?.forEach((x) => (x.state = CacheDirty));
      return true;
    } else {
      return false;
    }
  }

  /** update() if dirty, or a parent turns out to be dirty. */
  private updateIfNecessary(): boolean {
    if (this.state == CacheDirty) {
      return this.update();
    }

    if (this.state == CacheCheck) {
      if (this.sources) {
        let updated = false;
        for (const source of this.sources) {
          updated ||= source.updateIfNecessary();
        }
        if (updated) {
          return this.update();
        }
      }
      this.state = CacheCurrent; // no sources changed, so we don't need to update, and are current
    }

    // state is now CacheCurrent;
    return false;
  }
}

/* Evalute the reactive function body, dynamically capturing any other reactives used */
function withCurrentCompute(reactive: Reactive<any>, fn: () => any): any {
  const listener = CurrentReaction;
  const prevGets = gets;

  CurrentReaction = reactive;
  gets = [];
  try {
    return fn();
  } finally {
    gets = prevGets;
    CurrentReaction = listener;
  }
}

export function onCleanup<T = any>(fn: (oldValue: T) => void): void {
  if (CurrentReaction) {
    CurrentReaction.cleanups.push(fn);
  } else {
    console.error("onCleanup must be called from within a @reactive function");
  }
}

function arrayEq<T>(a: T[], b: T[] | undefined): boolean {
  if (!b) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
