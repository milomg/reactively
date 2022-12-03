import { Computed, ReactiveFramework, Signal } from "../util/ReactiveFramework";
import { $mol_wire_atom as Atom } from "mol_wire_lib";

export const molWireFramework: ReactiveFramework = {
  name: "$mol_wire_atom",
  signal: <T>(initialValue: T): Signal<T> => {
    const atom = new Atom("", (next: T = initialValue) => next);
    return {
      write: (v: T) => atom.put(v),
      read: () => atom.sync(),
    };
  },
  computed: <T>(fn: () => T): Computed<T> => {
    const atom = new Atom("", fn);
    return {
      read: () => atom.sync(),
    };
  },
  effect: <T>(fn: () => T) => new Atom("", fn).sync(),
  withBatch: (fn) => fn(),
  withBuild: (fn) => fn(),
  run: () => {},
};
