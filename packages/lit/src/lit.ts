import { LitElement, PropertyDeclaration } from "lit";
import {
  HasReactive,
  HasReactiveInternal,
  createReactives,
  queueReactiveToInstall,
} from "@reactively/decorate";
import { Reactive } from "@reactively/core";

/** An extension to LitElement that enables two additional property decorations (for a total of 3.)
 *  `@property` - lit properties that trigger an update/render when they change, optionally mirrored to html (unchanged from lit)
 *  `@reactive` - reactive properties that update when their @reactive dependencies change
 *                they do not trigger update/render (from @reactively/decorate)
 *  `@reactiveProperty` - a combination of the above two, a reactive property that tracks dependencies
 *                        and triggers an update/render when it changes. (from @reactively/decorate)
 */
export class ReactiveLitElement
  extends LitElement
  implements HasReactiveInternal
{
  /** reactively (only) props */
  __reactive?: Record<string, Reactive<unknown>>;

  /** lit+reactively combo props */
  _comboProps: string[] | undefined;

  /** We have two modes for getPropertyDescriptor, one for building regular lit properties, and
   * one for building reactive lit properties.  */
  static _buildingReactiveProperty = false;

  constructor() {
    super();
    createReactives(this);
  }

  /** Produce a lit property descriptor, and also a reactive node for the property
   * if the property is tagged '@reactiveProperty' */
  static getPropertyDescriptor(
    name: PropertyKey,
    key: string | symbol,
    options: PropertyDeclaration<unknown, unknown>
  ): PropertyDescriptor | undefined {
    const litDescriptor = super.getPropertyDescriptor(name, key, options);
    if (!this._buildingReactiveProperty) {
      // console.log("unmodified lit property", { name, key });
      return litDescriptor;
    } else {
      // console.log("reactive lit property", { name, key });
      return {
        get: function (this: HasReactive) {
          return this.__reactive![name as string].get();
        },
        set: function (this: ReactiveLitElement, value: unknown) {
          const reactive = this.__reactive![name as string];
          const oldValue = reactive.get();
          reactive.set(value);
          this.requestUpdate(name, oldValue, options);
        },
        configurable: true,
        enumerable: true,
      };
    }
  }
}

/** Mark a lit+reactively property that is tracked for dependency changes
 * and triggers a component update when set */
export function reactiveProperty(
  options?: PropertyDeclaration
):
  | ((
      prototype: LitElement,
      name: string,
      descriptor?: PropertyDescriptor
    ) => void)
  | any {
  return function reactiveComboProp(
    proto: ReactiveLitElement,
    key: string,
    descriptor?: PropertyDescriptor
  ): any {
    queueReactiveToInstall(proto as any, key, descriptor);
    installComboAccessor(proto, key, descriptor, options);
    return {};
  };
}

/** Install lit+reactive get/set accessors for an '@reactiveProperty' .  */
function installComboAccessor(
  proto: ReactiveLitElement,
  key: string,
  descriptor?: PropertyDescriptor,
  options?: PropertyDeclaration
): void {
  // console.log("installComboAccessor", { key, descriptor });
  if (descriptor?.get) {
    // lit will not install a get accessor if there is already one in the prototype.
    // so we manually our reactive accessor rather than relying on
    // lit's createProperty to call getPropertyDescriptor.
    installGetAccessor(proto, key);
  }
  ReactiveLitElement._buildingReactiveProperty = true;
  (proto.constructor as typeof ReactiveLitElement).createProperty(key, options);
  ReactiveLitElement._buildingReactiveProperty = false;
}

function installGetAccessor(proto: ReactiveLitElement, key: string): void {
  Object.defineProperty(proto, key, {
    get: function reactiveGet(this: HasReactiveInternal) {
      return this.__reactive![key].get();
    },
  });
}
