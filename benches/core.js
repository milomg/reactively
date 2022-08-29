let CurrentCompute = undefined;

let effectQueue = [];

export class Reactive {
  constructor(fnOrValue, effect) {
    this.state = 2 /* CacheState.DIRTY */;
    if (typeof fnOrValue === "function") {
      this.fn = fnOrValue;
      this.value = undefined;
      this.effect = effect;
      if (effect) this.update();
    } else {
      this.fn = undefined;
      this.value = fnOrValue;
      this.effect = false;
    }
    this.sources = null;
    this.sourceSlots = null;
    this.observers = null;
    this.observerSlots = null;
  }
  stale(state) {
    if (this.state < state) {
      this.state = state;
      if (this.effect) effectQueue.push(this);
      else if (this.observers) {
        for (let i = 0; i < this.observers.length; i++) {
          this.observers[i].stale(1 /* CacheState.CHECK */);
        }
      }
    }
  }
  set(value) {
    if (this.value !== value && this.observers) {
      for (let i = 0; i < this.observers.length; i++) {
        this.observers[i].stale(2 /* CacheState.DIRTY */);
      }
    }
    this.value = value;
  }

  update() {
    if (this.sources) {
      cleanNode(this);
    }
    const oldValue = this.value;
    const listener = CurrentCompute;
    CurrentCompute = this;
    try {
      this.value = this.fn();
    } finally {
      CurrentCompute = listener;
    }

    this.state = 0 /* CacheState.CURRENT */;
    if (oldValue !== this.value && this.observers) {
      for (let i = 0; i < this.observers.length; i++) {
        this.observers[i].stale(2 /* CacheState.DIRTY */);
      }
    }
  }

  updateIfNecessary() {
    if (this.state == 2 /* CacheState.DIRTY */) {
      return this.update();
    }
    if (this.state == 1 /* CacheState.CHECK */) {
      if (this.sources) {
        for (let i = 0; i < this.sources.length; i++) {
          this.sources[i].updateIfNecessary();
        }
        if ((this.state = 2) /* CacheState.DIRTY */) {
          return this.update();
        }
      }
      this.state = 0 /* CacheState.CURRENT */;
    }
  }
  get() {
    if (CurrentCompute) {
      const sSlot = this.observers ? this.observers.length : 0;
      if (!CurrentCompute.sources) {
        CurrentCompute.sources = [this];
        CurrentCompute.sourceSlots = [sSlot];
      } else {
        CurrentCompute.sources.push(this);
        CurrentCompute.sourceSlots.push(sSlot);
      }
      if (!this.observers) {
        this.observers = [CurrentCompute];
        this.observerSlots = [CurrentCompute.sources.length - 1];
      } else {
        this.observers.push(CurrentCompute);
        this.observerSlots.push(CurrentCompute.sources.length - 1);
      }
    }
    if (this.fn) this.updateIfNecessary();
    return this.value;
  }
}

function cleanNode(node) {
  while (node.sources.length) {
    const source = node.sources.pop(),
      index = node.sourceSlots.pop(),
      obs = source.observers;
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

export function stabilize() {
  for (let i = 0; i < effectQueue.length; i++) {
    effectQueue[i].get();
  }
  effectQueue.length = 0;
}
