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
 *  1. set() propogates changes down the graph to the leaves
 *     direct children are marked as dirty and their deeper descendants marked as check
 *     (no reactive computations are evaluated)
 *  2. get() requests that parent nodes updateIfNecessary(), which proceeds recursively up the tree
 *     to decide whether the node is clean (parents unchanged) or dirty (parents changed)
 *  3. updateIfNecessary() evaluates the reactive computation if the node is dirty
 *     (the computations are executed in root to leaf order)
 */

/** current capture context for identifying @reactive sources (other reactive elements) and cleanups
 * - active while evaluating a reactive function body  */
let CurrentReaction: Reactive<any> | undefined = undefined;
let CurrentGetsIndex = 0;

/** A list of non-clean 'effect' nodes that will be updated when stabilize() is called */
let EffectQueue: Reactive<any>[] = [];

/** reactive nodes are marked dirty when their source values change TBD*/
export const CacheClean = 0; // reactive value is valid, no need to recompute
export const CacheCheck = 1; // reactive value might be stale, check parent nodes to decide whether to recompute
export const CacheDirty = 2; // reactive value is invalid, parents have changed, valueneeds to be recomputed
export type CacheState =
  | typeof CacheClean
  | typeof CacheCheck
  | typeof CacheDirty;
type CacheNonClean = typeof CacheCheck | typeof CacheDirty;


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
export function reactive<T>(fnOrValue: T | (() => T)): Reactive<T> {
  return new Reactive(fnOrValue);
}

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
  private _value: T;
  private fn?: () => T;
  private observers: Reactive<any>[] | null = null; // nodes that have us as sources (down links)
  private sources: Reactive<any>[] | null = null; // sources in reference order, not deduplicated (up links)

  // We use slots to allow for a constant time deletion of an edge connecting a source and an observer (while avoiding sets, which are slow to create)
  // The scheme is described in removeParentObservers() below
  private observerSlots: number[] | null = null; // index in the observer's sources array that points to us
  private sourceSlots: number[] | null = null; // index in the source's observer array that points to us
  private state: CacheState;
  private effect: boolean;
  cleanups: ((oldValue: T) => void)[] = [];

  constructor(fnOrValue: (() => T) | T, effect?: boolean) {
    if (typeof fnOrValue === "function") {
      this.fn = fnOrValue as () => T;
      this._value = undefined as any;
      this.effect = effect || false;
      this.state = CacheDirty;
      if (effect) this.update(); // CONSIDER removing this?
    } else {
      this.fn = undefined;
      this._value = fnOrValue;
      this.state = CacheClean;
      this.effect = false;
    }
  }

  get value(): T {
    return this.get();
  }

  set value(v: T) {
    this.set(v);
  }

  get(): T {
    if (CurrentReaction) {
      let added = true;
      // add source link from currently executing reaction to this node unless it's already there
      const l = this.observers ? this.observers.length : 0;
      if (!CurrentReaction.sources) {
        CurrentReaction.sources = [this];
        CurrentReaction.sourceSlots = [l];
      } else if (CurrentGetsIndex == CurrentReaction!.sources.length) {
        CurrentReaction.sources.push(this);
        CurrentReaction.sourceSlots!.push(l);
      } else if (CurrentReaction!.sources[CurrentGetsIndex] != this) {
        CurrentReaction.removeIndexFromParentObservers(CurrentGetsIndex);
        CurrentReaction.sources[CurrentGetsIndex] = this;
        CurrentReaction.sourceSlots![CurrentGetsIndex] = l;
      } else {
        added = false;
      }

      // if we added a source link, adjust reverse link from this node to currently reacting node
      if (added) {
        if (!this.observers) {
          this.observers = [CurrentReaction!];
          this.observerSlots = [CurrentGetsIndex];
        } else {
          this.observers.push(CurrentReaction!);
          this.observerSlots!.push(CurrentGetsIndex);
        }
      }
      CurrentGetsIndex++;
    }
    if (this.fn) this.updateIfNecessary();
    return this._value;
  }

  set(value: T): void {
    if (this._value !== value && this.observers) {
      for (let i = 0; i < this.observers.length; i++) {
        this.observers[i].stale(CacheDirty);
      }
    }
    this._value = value;
  }

  private stale(state: CacheNonClean): void {
    if (this.state < state) {
      this.state = state;
      if (this.observers) {
        for (let i = 0; i < this.observers.length; i++) {
          this.observers[i].stale(CacheCheck);
        }
      }
    }
    // If we were previously clean, then we know that we may need to update to get the new value
    if (this.state === CacheClean && this.effect) EffectQueue.push(this);
  }

  /** run the computation fn, updating the cached value */
  private update(): void {
    const oldValue = this._value;

    /* Evalute the reactive function body, dynamically capturing any other reactives used */
    const prevReaction = CurrentReaction;
    const prevIndex = CurrentGetsIndex;

    CurrentReaction = this;
    CurrentGetsIndex = 0;

    try {
      if (this.cleanups.length) {
        this.cleanups.forEach((c) => c(this._value));
        this.cleanups = [];
      }
      this._value = this.fn!();

      // if the sources have changed, update source & observer links
      if (this.sources && CurrentGetsIndex < this.sources.length) {
        // remove all old sources' .observers links to us
        for (let i = CurrentGetsIndex; i < this.sources.length; i++) {
          this.removeIndexFromParentObservers(i);
        }
        this.sources.length = CurrentGetsIndex;
        this.sourceSlots!.length = CurrentGetsIndex;
      }
    } finally {
      CurrentReaction = prevReaction;
      CurrentGetsIndex = prevIndex;
    }

    // handle diamond depenendencies if we're the parent of a diamond.
    if (oldValue !== this._value && this.observers) {
      // We've changed value, so mark our children as dirty so they'll reevaluate
      for (let i = 0; i < this.observers.length; i++) {
        this.observers[i].state = CacheDirty;
      }
    }

    // We've rerun with the latest values from all of our sources.
    // This means that we no longer need to update until a signal changes
    this.state = CacheClean;
  }

  /** update() if dirty, or a parent turns out to be dirty. */
  private updateIfNecessary(): void {
    // If we are potentially dirty, see if we have a parent who has actually changed value
    if (this.state === CacheCheck) {
      for (const source of this.sources!) {
        source.updateIfNecessary(); // updateIfNecessary() can change this.state
        if ((this.state as CacheState) === CacheDirty) {
          // Stop the loop here so we won't trigger updates on other parents unnecessarily
          // If our computation changes to no longer use some sources, we don't
          // want to update() a source we used last time, but now don't use.
          break;
        }
      }
    }

    // If we were already dirty or marked dirty by the step above, update.
    if (this.state === CacheDirty) {
      this.update();
    }

    // By now, we're clean
    this.state = CacheClean;
  }

  /** (Inspired by https://github.com/solidjs/solid/blob/eb63706ab4fa566478486b2b3b47ec6d39e0d4bc/packages/solid/src/reactive/signal.ts#L1580)
   *  Remove all sources' links to us by editing each sources' observers array and related slot numbers.
   *
   *  To enable quickly deletions of our entry from the observers array, we keep
   *  track of the array _index_ in each sources' observers array that holds the reference to our node.
   *  To delete our entry, we pop the last element from the sources observers array and overwrite our entry.
   */
  removeIndexFromParentObservers(i: number): void {
    const source: Reactive<any> = this.sources![i]; // We don't actually delete sources here because we're replacing the entire array soon
    const index = this.sourceSlots![i];

    // remove last element from observers and slot arrays (probably not us, but they can take our position instead)
    const observersLast = source.observers!.pop()!;
    const observersLastSlot = source.observerSlots!.pop()!;

    // If we happened to be the last element, hooray we're done. Otherwise, we have to actually swap positions
    if (index < source.observers!.length) {
      // place the just removed last element in our position (removing us)
      source.observers![index] = observersLast;
      source.observerSlots![index] = observersLastSlot;

      // Now, we update the sourceSlot of observersLast to its new position in the observers array
      observersLast.sourceSlots![observersLastSlot] = index;
    }
  }
}

export function onCleanup<T = any>(fn: (oldValue: T) => void): void {
  if (CurrentReaction) {
    CurrentReaction.cleanups.push(fn);
  } else {
    console.error("onCleanup must be called from within a @reactive function");
  }
}

/** run all non-clean effect nodes */
export function stabilize() {
  for (let i = 0; i < EffectQueue.length; i++) {
    EffectQueue[i].get();
  }
  EffectQueue.length = 0;
}
