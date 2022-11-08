"use strict";
let CurrentReaction = void 0;
let CurrentGets = null;
let CurrentGetsIndex = 0;
let EffectQueue = [];
export const CacheClean = 0;
export const CacheCheck = 1;
export const CacheDirty = 2;
export class Reactive {
  value;
  fn;
  observers = null;
  sources = null;
  observerSlots = null;
  sourceSlots = null;
  state = CacheDirty;
  effect;
  constructor(fnOrValue, effect) {
    if (typeof fnOrValue === "function") {
      this.fn = fnOrValue;
      this.value = void 0;
      this.effect = effect || false;
      if (effect)
        this.update();
    } else {
      this.fn = void 0;
      this.value = fnOrValue;
      this.effect = false;
    }
  }
  get() {
    if (CurrentReaction) {
      if (!CurrentGets && CurrentReaction.sources && CurrentReaction.sources[CurrentGetsIndex] == this) {
        CurrentGetsIndex++;
      } else {
        if (!CurrentGets)
          CurrentGets = [this];
        else
          CurrentGets.push(this);
      }
    }
    if (this.fn)
      this.updateIfNecessary();
    return this.value;
  }
  set(value) {
    if (this.value !== value && this.observers) {
      for (let i = 0; i < this.observers.length; i++) {
        this.observers[i].stale(CacheDirty);
      }
    }
    this.value = value;
  }
  stale(state) {
    if (this.state < state) {
      this.state = state;
      if (this.observers) {
        for (let i = 0; i < this.observers.length; i++) {
          this.observers[i].stale(CacheCheck);
        }
      }
    }
    if (this.state === CacheClean && this.effect)
      EffectQueue.push(this);
  }
  update() {
    const oldValue = this.value;
    const prevReaction = CurrentReaction;
    const prevGets = CurrentGets;
    const prevIndex = CurrentGetsIndex;
    CurrentReaction = this;
    CurrentGets = null;
    CurrentGetsIndex = 0;
    try {
      this.value = this.fn();
      if (CurrentGets) {
        this.removeParentObservers();
        if (this.sources && CurrentGetsIndex > 0) {
          this.sources.length = CurrentGetsIndex + CurrentGets.length;
          for (let i = 0; i < CurrentGets.length; i++) {
            this.sources[CurrentGetsIndex + i] = CurrentGets[i];
          }
        } else {
          this.sources = CurrentGets;
        }
        if (!this.sourceSlots)
          this.sourceSlots = Array(this.sources.length);
        else
          this.sourceSlots.length = this.sources.length;
        for (let i = CurrentGetsIndex; i < this.sources.length; i++) {
          const source = this.sources[i];
          if (!source.observers) {
            source.observers = [this];
            source.observerSlots = [i];
          } else {
            source.observers.push(this);
            source.observerSlots.push(i);
          }
          this.sourceSlots[i] = source.observers.length - 1;
        }
      } else if (this.sources && CurrentGetsIndex < this.sources.length) {
        this.removeParentObservers();
        this.sources.length = CurrentGetsIndex;
        this.sourceSlots.length = CurrentGetsIndex;
      }
    } finally {
      CurrentGets = prevGets;
      CurrentReaction = prevReaction;
      CurrentGetsIndex = prevIndex;
    }
    if (oldValue !== this.value && this.observers) {
      for (let i = 0; i < this.observers.length; i++) {
        this.observers[i].state = CacheDirty;
      }
    }
    this.state = CacheClean;
  }
  updateIfNecessary() {
    if (this.state === CacheCheck && this.sources) {
      for (const source of this.sources) {
        source.updateIfNecessary();
        if (this.state === CacheDirty) {
          break;
        }
      }
    }
    if (this.state === CacheDirty) {
      this.update();
    }
    this.state = CacheClean;
  }
  removeParentObservers() {
    if (!this.sources || !this.sourceSlots)
      return;
    for (let i = CurrentGetsIndex; i < this.sources.length; i++) {
      const source = this.sources[i];
      const index = this.sourceSlots[i];
      const observers = source.observers;
      if (observers && observers.length) {
        const observersLast = observers.pop();
        const observersLastSlot = source.observerSlots.pop();
        if (index < observers.length) {
          observers[index] = observersLast;
          source.observerSlots[index] = observersLastSlot;
          observersLast.sourceSlots[observersLastSlot] = index;
        }
      }
    }
  }
}
export function stabilize() {
  for (let i = 0; i < EffectQueue.length; i++) {
    EffectQueue[i].get();
  }
  EffectQueue.length = 0;
}


function setSignal(value) {
  this.set(value);
  stabilize();
}
export function signal(value) {
  const signal = new Reactive(value);
  return [signal.get.bind(signal), setSignal.bind(signal)];
}

export function computed(fn) {
  const computed = new Reactive(fn, true);
  return computed.get.bind(computed);
}
