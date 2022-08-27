import { LitElement, PropertyDeclaration } from "lit";
import { dlog } from "../util/DebugLog";
import { installReactiveProperty, reactivesToInit } from "./Decorators";
import { Reactive } from "./ReactiveNodes";

export class ReactiveLitElement extends LitElement {
  constructor() {
    super();
    reactiveInit(this);
  }

  /** We have two modes for getPropertyDescriptor, one for building regular lit properties, and
   * one for building reactive properties.
   */
  static _buildingReactiveProperty = false;
  _reactiveProps: string[] | undefined;

  /** Produce a lit property descriptor, and also a reactive node for the property
   * if the property is tagged '@reactive'
   */
  static getPropertyDescriptor(
    name: PropertyKey,
    key: string | symbol,
    options: PropertyDeclaration<unknown, unknown>
  ): PropertyDescriptor | undefined {
    const litDescriptor = super.getPropertyDescriptor(name, key, options);
    if (!this._buildingReactiveProperty) {
      dlog("unmodified lit property", { name, key });
      return litDescriptor;
    }
    dlog("reactive lit property", { name, key });
    const reactiveNode = new Reactive<any>(null);
    if (!litDescriptor) {
      return undefined;
    } else {
      const setter = litDescriptor.set;
      return {
        get() {
          reactiveNode.get();
          return litDescriptor.get?.call(this);
        },
        set(value) {
          // dlog("set", { elem: this, value });
          reactiveNode.set(value);
          setter?.call(this, value);
        },
        configurable: true,
        enumerable: true,
      };
    }
  }
}

// TODO take options from lit's @property

/** Mark a mutable property that can be tracked for changes. */
export function reactiveProperty(prototype: ReactiveLitElement, name: string): any;
export function reactiveProperty(): (prototype: ReactiveLitElement, name: string) => any;
export function reactiveProperty(
  prototype?: ReactiveLitElement,
  name?: string
): ((prototype: LitElement, name: string) => void) | any {
  if (prototype) return buildReactivePropMap(prototype, name);
  else return buildReactivePropMap;
}

/** we can't store the properties in the class, because the decorator is being called before
 * the class exists.
 */
function buildReactivePropMap(prototype: ReactiveLitElement, name?: string): void {
  dlog("buildReactivePropMap", prototype, { name });
  if (name) {
    if (!prototype._reactiveProps) {
      prototype._reactiveProps = [];
    }
    prototype._reactiveProps.push(name);
  }
}

/** Install lit+reactive get/set accessors '@reactiveProperty' properties.
 *  intall reactive get/set accessors for '@reactive' properties */
function reactiveInit(instance: ReactiveLitElement): void {
  const reactiveProto = Object.getPrototypeOf(instance) as ReactiveLitElement;

  ReactiveLitElement._buildingReactiveProperty = true;
  reactiveProto._reactiveProps?.forEach((name) => {
    ReactiveLitElement.createProperty(name)
  });
  ReactiveLitElement._buildingReactiveProperty = false;

  /* this should installReactiveProperty on every key that's not a lit property */
  reactivesToInit.get(reactiveProto)?.forEach((key) => {
    if (key === "doubleName") {
      installReactiveProperty(instance, key);
    }
  });
}