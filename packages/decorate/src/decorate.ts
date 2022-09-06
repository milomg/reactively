import { Reactive } from "@reactively/core";

/** Collection of properties to transform into reactive properties, indexed by class.
 *
 * In the map, the key is the constructor function for a class, and the value is
 * a list of property names.
 *
 * Motivation: the property decorators fire _before_ the class prototype is constructed,
 * so we defer modification of the prototype until the class is initialized.
 *
 * The map is used to initialize reactive properties in every new reactive object of this class.
 */
export const reactivesToInit: WeakMap<object, string[]> = new Map();

/** mark a class that contains reactive properties */
export function hasReactive(constructor: Function): any;
export function hasReactive(): (constructor: Function) => any;
export function hasReactive(constructor?: any) {
  if (!constructor) {
    return function (constructor: any): typeof constructor {
      return class extends constructor {
        constructor(...args: any[]) {
          super(...args);
          initializeReactives(this);
        }
      } as typeof constructor;
    };
  } else {
    return class extends constructor {
      constructor(...args: any[]) {
        super(...args);
        initializeReactives(this);
      }
    } as typeof constructor;
  }
}

/** save a reference to a reactive property so that we can later modify the property getters and setters */
function buildReactiveMap(prototype: any, name: string): void {
  if (!reactivesToInit.has(prototype)) reactivesToInit.set(prototype, []);
  const props = reactivesToInit.get(prototype)!;
  props.push(name);
}

/** Mark a mutable property that can be tracked for changes. */
export function reactive(prototype: any, name: string): any;
export function reactive(): (prototype: any, name: string) => any;
export function reactive(
  prototype?: any,
  name?: any
): ((prototype: any, name: string) => void) | any {
  if (prototype) return buildReactiveMap(prototype, name);
  else return buildReactiveMap;
}

/** Mark a 0-ary function property for memoization.
 *
 * The property will return a cached value on subsequent calls, and re-run the
 * function body only if a source signal or source computed property has changed */

/** Initialize reactive graph nodes for reactive values and reactive functions. The links between
 * graph nodes are added later (and dynamically updated as reactive functions are evaluated.)  */
function initializeReactives(instance: any): void {
  // the reactives map is indexed by the original class constructor,
  // not the subclass we built via class decoraotor
  // so we walk up up one prototype here.
  const reactiveProto = Object.getPrototypeOf(instance);
  const origProto = Object.getPrototypeOf(reactiveProto);

  reactivesToInit.get(origProto)?.forEach((key) => {
    installReactiveProperty(instance, key);
  });
}

export function installReactiveProperty(instance: any, key: string): void {
  const valueOrFn = instance[key];
  let reactive: Reactive<any>;
  if (typeof valueOrFn === "function") {
    reactive = new Reactive(valueOrFn.bind(instance));
    instance[key] = () => reactive.get();
  } else {
    reactive = new Reactive(valueOrFn);
    Object.defineProperty(instance, key, {
      get: reactive.get.bind(reactive),
      set: reactive.set.bind(reactive),
    });
  }
}
// LATER compare performace of alternate approach:
// . define get/set on prototype, rather than repeatedly on every instance
// . (then need to delete the instance property so it doesn't shadow the prototype.)
//
