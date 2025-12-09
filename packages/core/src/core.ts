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
let CurrentGets: Reactive<any>[] | null = null;
let CurrentGetsIndex = 0;

/** A list of non-clean 'effect' nodes that will be updated when stabilize() is called */
let EffectQueue: Reactive<any>[] = [];
let EffectQueueIndex = 0;

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

  // Stored in a single array to improve cache locality
  // [source1, slot1, source2, slot2, ... sourceN, slotN, observer1, slot1, observer2, slot2, ...]
  // Sources are stored from 0 to observersStart
  // Observers are stored from observersStart to the end
  private sourcesAndObservers: (Reactive<any> | number | undefined)[] = [];
  private observersStart: number = 0;

  private state: CacheState;
  private effect: boolean;
  cleanups: ((oldValue: T) => void)[] = [];

  constructor(fnOrValue: (() => T) | T, effect?: boolean) {
    if (typeof fnOrValue === "function") {
      this.fn = fnOrValue as () => T;
      this._value = undefined as any;
      this.effect = effect || false;
      this.state = CacheDirty;
      if (effect) this.update();
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
      if (
        !CurrentGets &&
        CurrentReaction.sourcesAndObservers[CurrentGetsIndex] == this
      ) {
        CurrentGetsIndex += 2;
      } else {
        if (!CurrentGets) CurrentGets = [this];
        else CurrentGets.push(this);
      }
    }
    if (this.fn) this.updateIfNecessary();
    return this._value;
  }

  set(value: T): void {
    if (this._value !== value && this.observersStart < this.sourcesAndObservers.length) {
      for (let i = this.observersStart; i < this.sourcesAndObservers.length; i += 2) {
        (this.sourcesAndObservers[i] as Reactive<any>).stale(CacheDirty);
      }
    }
    this._value = value;
  }

  private stale(state: CacheNonClean): void {
    if (this.state < state) {
      // If we were previously clean, then we know that we may need to update to get the new value
      if (this.state === CacheClean && this.effect) EffectQueue[EffectQueueIndex++] = this;

      this.state = state;
      if (this.observersStart < this.sourcesAndObservers.length) {
        for (let i = this.observersStart; i < this.sourcesAndObservers.length; i += 2) {
          (this.sourcesAndObservers[i] as Reactive<any>).stale(CacheCheck);
        }
      }
    }
  }

  /** run the computation fn, updating the cached value */
  private update(): void {
    const oldValue = this._value;

    /* Evalute the reactive function body, dynamically capturing any other reactives used */
    const prevReaction = CurrentReaction;
    const prevGets = CurrentGets;
    const prevIndex = CurrentGetsIndex;

    CurrentReaction = this;
    CurrentGets = null as any; // prevent TS from thinking CurrentGets is null below
    CurrentGetsIndex = 0;

    try {
      if (this.cleanups.length) {
        this.cleanups.forEach((c) => c(this._value));
        this.cleanups = [];
      }
      this._value = this.fn!();

      // remove all old sources' .observers links to us
      this.removeParentObservers();

      // if the sources have changed, update source & observer links
      if (CurrentGets) {
        // Write sources
        for (let i = 0; i < CurrentGets.length; i++) {
          const targetIndex = CurrentGetsIndex + i * 2;
          if (targetIndex >= this.observersStart && targetIndex < this.sourcesAndObservers.length) {
            // We are about to overwrite an observer. Move it to the end.
            const obs = this.sourcesAndObservers[targetIndex] as Reactive<any>;
            const slot = this.sourcesAndObservers[targetIndex + 1] as number;

            const newIndex = this.sourcesAndObservers.length;
            this.sourcesAndObservers.push(obs, slot);

            // Update the observer's pointer to us
            // stored slot is logical index `k` such that `obs.sourcesAndObservers[k]` is us.
            // `slot` is absolute logical index.

            // We moved `obs`. `obs` stores `slot`. `slot` is index in `obs.sources`.
            // `obs.sources[slot+1]` points to index in OUR observers array.
            // We moved `obs` in OUR observers array.
            // We need to update `obs`'s stored index for US.

            const observerParamsOffset = slot + 1;
            obs.sourcesAndObservers[observerParamsOffset] = newIndex; // Store absolute logical index
          }

          this.sourcesAndObservers[targetIndex] = CurrentGets[i];
          const source = CurrentGets[i];

          // Add us to source's observers
          source.sourcesAndObservers.push(this, targetIndex);

          // Store the slot (index in source's observers)
          // Stored as logical index
          this.sourcesAndObservers[targetIndex + 1] = (source.sourcesAndObservers.length - 2); // Store absolute logical index
        }

        // 2. Handle shrinking (gap filling with holes)
        // If we used fewer sources than before, we leave a gap.
        // We do NOT shift observers. We just null out the stale sources.

        const newSourcesEnd = CurrentGetsIndex + CurrentGets.length * 2;

        if (newSourcesEnd < this.observersStart) {
          // Fill gap with undefined
          for (let i = newSourcesEnd; i < this.observersStart; i += 2) {
            if (!this.sourcesAndObservers[i]) break;
            this.sourcesAndObservers[i] = undefined;
            this.sourcesAndObservers[i + 1] = -1;
          }
          // observersStart remains unchanged
        } else {
          // We grew (or stayed same size but filled holes).
          // If we grew beyond old observersStart, we pushed observers to the end.
          this.observersStart = newSourcesEnd;
        }

        // We moved observers in step 1 if we overlapped. 
        // If we did NOT overlap (because we filled holes), observersStart was not crossed.
      } else if (CurrentGetsIndex < this.observersStart) {
        const newSourcesEnd = CurrentGetsIndex;
        for (let i = newSourcesEnd; i < this.observersStart; i += 2) {
          if (!this.sourcesAndObservers[i]) break;
          this.sourcesAndObservers[i] = undefined;
          this.sourcesAndObservers[i + 1] = -1;
        }
      }
    } finally {
      CurrentGets = prevGets;
      CurrentReaction = prevReaction;
      CurrentGetsIndex = prevIndex;
    }

    // handle diamond depenendencies if we're the parent of a diamond.
    if (oldValue !== this._value) {
      // We've changed value, so mark our children as dirty so they'll reevaluate
      if (this.observersStart < this.sourcesAndObservers.length) {
        for (let i = this.observersStart; i < this.sourcesAndObservers.length; i += 2) {
          const observer = this.sourcesAndObservers[i] as Reactive<any>;
          observer.state = CacheDirty;
        }
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
      for (let i = 0; i < this.observersStart; i += 2) {
        const source = this.sourcesAndObservers[i] as Reactive<any>;
        if (!source) break; // Skip holes

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
  private removeParentObservers(): void {
    for (let i = CurrentGetsIndex; i < this.observersStart; i += 2) {
      const source: Reactive<any> = this.sourcesAndObservers[i] as Reactive<any>;
      if (!source) break; // Skip holes

      const index = this.sourcesAndObservers[i + 1] as number; // This is logical index in source's observers list

      // pointer to the last observer in source.sourcesAndObservers
      const obsLastIndex = source.sourcesAndObservers.length - 2;
      const observersLast = source.sourcesAndObservers[obsLastIndex] as Reactive<any>;
      const observersLastSlot = source.sourcesAndObservers[obsLastIndex + 1] as number; // Index in observersLast's sources array

      // We are reducing source.sourcesAndObservers size by 2
      source.sourcesAndObservers.length -= 2;

      // If we happened to be the last element, we are done
      if (index < obsLastIndex) {
        // move last element to our spot
        source.sourcesAndObservers[index] = observersLast;
        source.sourcesAndObservers[index + 1] = observersLastSlot;

        // Update the observerLast's slot pointing to this new location
        // observersLastSlot is the logical index in observersLast.sourcesAndObservers
        // We need to update observersLast.sourcesAndObservers[observersLastSlot * 2 + 1] to be `index`
        observersLast.sourcesAndObservers[observersLastSlot + 1] = index;
      }
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
  for (let i = 0; i < EffectQueueIndex; i++) {
    EffectQueue[i].get();
    EffectQueue[i] = undefined as any;
  }
  EffectQueueIndex = 0;
}
