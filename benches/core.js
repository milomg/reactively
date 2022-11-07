"use strict";
let CurrentReaction = void 0;
let CurrentGets = null;
let EffectQueue = [];

export class Reactive {
  constructor(fnOrValue, effect) {
    this.observers = null;
    this.observerSlots = null;
    this.sources = null;
    this.sourceSlots = null;
    this.state = 2;
    if (typeof fnOrValue === "function") {
      this.fn = fnOrValue;
      this.value = void 0;
      this.effect = effect || false;
      if (effect) this.update();
    } else {
      this.fn = void 0;
      this.value = fnOrValue;
      this.effect = false;
    }
  }
  get() {
    if (CurrentGets) CurrentGets.push(this);
    if (this.fn) this.updateIfNecessary();
    return this.value;
  }
  set(value) {
    if (this.value !== value && this.observers) {
      for (let i = 0; i < this.observers.length; i++) {
        this.observers[i].stale(2);
      }
    }
    this.value = value;
  }
  stale(state) {
    if (this.state < state) {
      this.state = state;
      if (this.effect) EffectQueue.push(this);
      else if (this.observers) {
        for (let i = 0; i < this.observers.length; i++) {
          this.observers[i].stale(1);
        }
      }
    }
  }

  update() {
    const oldValue = this.value;
    const prevReaction = CurrentReaction;
    const prevGets = CurrentGets;
    CurrentReaction = this;
    CurrentGets = [];
    try {
      this.value = this.fn();
      if (!arrayEq(CurrentGets, this.sources)) {
        this.cleanNode();
        this.sources = CurrentGets;
        if (!this.sourceSlots) this.sourceSlots = Array(this.sources.length);
        else this.sourceSlots.length = this.sources.length;
        for (let i = 0; i < this.sources.length; i++) {
          const source = this.sources[i];
          if (!source.observers) {
            source.observers = [this];
            source.observerSlots = [i];
          } else {
            source.observers.push(this);
            source.observerSlots.push(i);
          }
          this.sourceSlots[i] = source.observerSlots.length - 1;
        }
      }
    } finally {
      CurrentGets = prevGets;
      CurrentReaction = prevReaction;
    }

    if (oldValue !== this.value && this.observers) {
      for (let i = 0; i < this.observers.length; i++) {
        this.observers[i].state = 2;
      }
    }
    this.state = 0;
  }

  updateIfNecessary() {
    if (this.state == 1 && this.sources) {
      for (const source of this.sources) {
        source.updateIfNecessary();
      }
    }
    if (this.state == 2) {
      this.update();
    }
    this.state = 0;
  }

  cleanNode() {
    if (!this.sources || !this.sourceSlots) return;
    while (this.sources.length) {
      const source = this.sources.pop();
      const index = this.sourceSlots.pop();
      const obs = source.observers;
      if (obs && obs.length) {
        const n = obs.pop(),
          s = source.observerSlots.pop();
        if (index < obs.length) {
          n.sourceSlots[s] = index;
          obs[index] = n;
          source.observerSlots[index] = s;
        }
      }
    }
  }
}

function arrayEq(a, b) {
  if (!b) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
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
