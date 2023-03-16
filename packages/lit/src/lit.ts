import { Reactive, ReactivelyParams } from "@reactively/core";
import {
  createReactives,
  HasReactive,
  HasReactiveInternal,
  queueReactiveToInstall,
  reactively,
} from "@reactively/decorate";
import { LitElement, PropertyDeclaration, TemplateResult } from "lit";

/** An extension to LitElement for reactive support.
 *
 * Users should implement reactiveRender() instead of render(), so that ReactiveLitElement
 * can internally track reactive sources used while rendering.
 *
 * Users should use these decorations:
 *  `@reactively` - reactive property that updates lazily if its @reactively sources change
 *  `@reactiveProperty` - reactively property that's also a lit web component property
 */
export abstract class ReactiveLitElement
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
    this.validateRender();
  }

  /** subclasses should implement this, returning the contents that will be render()d */
  protected abstract reactiveRender(): TemplateResult;

  @reactively({ effect: true }) private get template(): TemplateResult {
    this.requestUpdate(); // effect stabilization has called us, trigger a lit render
    return this.reactiveRender();
  }

  override render(): TemplateResult {
    return this.template;
  }

  /** log if the user has implmented render() instead of reactiveRender() */
  private validateRender(): void {
    const renderProto = hasRender(this);
    if (renderProto?.constructor?.name !== ReactiveLitElement.name) {
      console.error(
        "ReactiveLitElement subclasses should not implement render(). \n" +
          "Implement reactiveRender() instead.\n",
        "class:",
        this.constructor.name,
        "\n",
        "instance:",
        this
      );
    }

    function hasRender(self: any): any {
      if (self === undefined) {
        return undefined;
      }
      if (Object.getOwnPropertyNames(self).includes("render")) {
        return self;
      }
      return hasRender(Object.getPrototypeOf(self));
    }
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
      return litDescriptor;
    } else {
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
  options?: PropertyDeclaration & ReactivelyParams,
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
    queueReactiveToInstall(proto as any, key, descriptor, options);
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
