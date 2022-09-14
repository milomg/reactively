import { Reactive } from "@reactively/core";

/** Mark a class that contains reactive properties */
export function hasReactive(constructor: Function): any;
export function hasReactive(): (constructor: Function) => any;
export function hasReactive(constructor?: any) {
  if (!constructor) {
    return function (constructor: any): typeof constructor {
      return class extends constructor {
        constructor(...args: any[]) {
          super(...args);
          initialize(this);
        }
      } as typeof constructor;
    };
  } else {
    return class extends constructor {
      constructor(...args: any[]) {
        super(...args);
        initialize(this);
      }
    } as typeof constructor;
  }
}

/** Decorate a reactive property in a class. 
 * The decorated property can be a value, a method, or a get accessor. 
 * Note that the class must also be decorated with `@hasReactive` */
export function reactive(prototype: any, name: string): any;
export function reactive(): (prototype: any, name: string) => any;
export function reactive(
  prototype?: any,
  name?: any,
  descriptor?: PropertyDescriptor
): ((prototype: any, name: string) => void) | any {
  if (prototype) return queueReactives(prototype, name, descriptor!);
  else return queueReactives;
}

/** Properties added to the instance and prototype as the instance is constructed. */
export interface HasReactive {
  /* true if accessors have been installed on the prototype. stored on the prototype */
  __accessors?: boolean;

  /* list of reactive properties to setup per class and instance. stored on the prototype */
  __toInstall?: [string, PropertyDescriptor][];

  /* reactive nodes, one per reactive property. stored on the instance */
  __reactive?: Record<string, Reactive<unknown>>;
}

interface ReactiveClass extends Record<string, unknown>, HasReactive {}

/** Save a list of reactive properties that will be installed on each object instance 
 * and the prototype of the class. */
function queueReactives(
  proto: HasReactive,
  name: string,
  descriptor: PropertyDescriptor
): void {
  const reactives = proto.__toInstall || (proto.__toInstall = []);
  reactives.push([name, descriptor]);
}

/** Create Reactive nodes for every reactive property and save them
 * in the instance's __reactive property.  */
function initialize(instance: any) {
  const toInstall = (instance as HasReactive).__toInstall;
  initReactives(instance, toInstall);
  installAccessors(instance, toInstall);
  deleteKeys(instance, toInstall);
}

/** Install getter/setter accessors for reactive properties in the intance's
 * prototype chain. */
function installAccessors(
  instance: any,
  toInstall?: [string, PropertyDescriptor][]
): void {
  const proto = Object.getPrototypeOf(instance);
  const protoProto = Object.getPrototypeOf(proto) as ReactiveClass;

  /* We need to initialize the prototype's accessors only once. The accessors are part of the
    class, not the instance. Nonetheless we defer creating the class accessors on the prototype 
    until instance creation so that we can examine the first instance's property values.

    If the the property value is a method, we'll can create an accessor
    that returns a function, vs. an accessor that returns a value.

    installAccessors() is triggered by subclass constructor that runs after all 
    the properties have been initialized either by property assignment expressions 
    or by the instance's constructor.
  */
  if (!protoProto.__accessors) {
    protoProto.__accessors = true;
    toInstall?.forEach(([key, descriptor]) => {
      installOneAccessor(protoProto, instance, key, descriptor);
    });
  }
}

/** Add a Reactive node to the instance for each reactive property.
 *
 * The Reactive nodes are stored in the __reactive property on the instance.  */
function initReactives(
  instance: ReactiveClass,
  toInstall?: [string, PropertyDescriptor][]
) {
  if (!instance.__reactive) {
    instance.__reactive = {};
    for (const [key, descriptor] of toInstall || []) {
      if (descriptor.get) {
        instance.__reactive[key] = new Reactive(descriptor.get.bind(instance));
      } else if (typeof instance[key] === "function") {
        const boundFn = (instance[key] as Function).bind(instance);
        instance.__reactive[key] = new Reactive(boundFn);
      } else {
        instance.__reactive[key] = new Reactive(instance[key]);
      }
    }
  }
}

/** Remove the keys for all reactive properties from the instance.
 *
 * The prototype now has a get accessor for each reactive key (possibly a set accessor too),
 * and the original instance keys are in the way. */
function deleteKeys(instance: any, toInstall?: [string, PropertyDescriptor][]) {
  toInstall?.forEach(([key]) => {
    delete instance[key];
  });
}

/** Install get and set accessor functions on the prototype 
 * (internally the accessors reference a Reactive node
 * stored in the __reactive property on the instance.)  */
function installOneAccessor(
  proto: ReactiveClass,
  oneInstance: any,
  key: string,
  descriptor: PropertyDescriptor
): void {
  if (descriptor.get) {
    Object.defineProperty(proto, key, {
      get: function () {
        return this.__reactive[key].get();
      },
    });
  } else if (typeof oneInstance[key] === "function") {
    proto[key] = function () {
      return this.__reactive![key].get();
    };
  } else {
    Object.defineProperty(proto, key, {
      get: function () {
        return this.__reactive[key].get();
      },
      set: function (v: any) {
        return this.__reactive[key].set(v);
      },
    });
  }
}

// TODO currently used for lit only, DRY with above
export function installReactiveProperty(
  instance: any,
  key: string,
  descriptor: PropertyDescriptor
): void {
  const valueOrFn = instance[key];
  let reactive: Reactive<any>;
  if (descriptor.get) {
    const getFn = descriptor.get.bind(instance);
    reactive = new Reactive(getFn);
    Object.defineProperty(instance, key, {
      get: reactive.get.bind(reactive),
    });
  } else if (typeof valueOrFn === "function") {
    reactive = new Reactive(valueOrFn.bind(instance));
    instance[key] = () => reactive.get(); // TODO try bind
  } else {
    reactive = new Reactive(valueOrFn);
    Object.defineProperty(instance, key, {
      get: reactive.get.bind(reactive),
      set: reactive.set.bind(reactive),
    });
  }
}
