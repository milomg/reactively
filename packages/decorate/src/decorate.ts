import { Reactive, ReactivelyParams } from "@reactively/core";

/*
This module supports creating Typescript classes with reactive properties. 
The user should inherit from HasReactive and decorate reactive properties with the @reactive decorator.
Decorated properties will track their interdependencies automatically and update only when needed.

Some properties on HasReactive instances and prototypes are added/rewritten to support reactivity.
. Every instance gets a __reactive property containing an internal `Reactive` node
  for each reactive property.
. The prototype gets accessor functions (get, possibly set) for each property.
  The accessor function references the instance's reactive node to read write property values
  and trigger reactivity.

The decorator API is not implemented in the browser. Decoration is instead implemented 
by the typescript compiler, and also implemented by babel, esbuild, etc. The 
implementation by those different compilers are not quite the same as each other and is not
as specified in the typescript handbook (Sep 2022). Some differences:
. decorator functions may return a property descriptor, which babel builds will use.
  Returning {} from a decorator function will not add an instance property on babel builds.
. babel builds provide an additional property 'initializer' on the descriptor, which
  specifies a function that initialize the value of a property on the instance.
. babel builds and ts/esbuild builds construct objects differently wrt property 
  inititialization.  
*/

/** Decorate a `@reactively` property in a class.
 *
 * The decorated property can be a value, a method, or a get accessor.
 * The class must inherit from HasReactive (or ReactiveLitElement) */
export function reactively(prototype: HasReactiveInternal, name: string): any;
export function reactively(): (
  prototype: HasReactiveInternal,
  name: string
) => any;
export function reactively(
  params: ReactivelyParams
): (prototype: HasReactiveInternal, name: string) => any;
export function reactively(
  prototypeOrParams?: HasReactiveInternal | ReactivelyParams,
  name?: any,
  descriptor?: PropertyDescriptor
): ((prototype: any, name: string) => void) | any {
  // '@reactively()' parens so 'decorator factory' style but no parameters
  if (!prototypeOrParams) {
    return addReactive;
  }

  // '@reactively({equals: ...})' parens so 'decorator factory' style with parameters
  if (Object.getPrototypeOf(prototypeOrParams) === Object.prototype) {
    return (
      proto: HasReactiveInternal,
      key: string,
      descriptor: PropertyDescriptor
    ) =>
      addReactive(
        proto,
        key,
        descriptor,
        prototypeOrParams as ReactivelyParams
      );
  } else {
    // '@reactively' with no parens so 'decorator style'. We're provided the proto immediately.
    return addReactive(
      prototypeOrParams as HasReactiveInternal,
      name,
      descriptor!
    );
  }
}

/** Classes that contain `@reactive` properties should extend `HasReactive`
 * (or another class that implements the HasReactive contract).
 */
export class HasReactive implements HasReactiveInternal {
  __reactive?: Record<string, Reactive<unknown>>;

  constructor() {
    createReactives(this);
  }
}

/** Properties added to the instance and prototype as the instance is constructed. */
interface DecoratedInternal {
  /* list of reactive properties to setup per instance. stored on the prototype */
  __toInstall?: InstallEntry[];
}

export interface HasReactiveInternal {
  /* reactive nodes, one per reactive property. stored on the instance */
  __reactive?: Record<string, Reactive<unknown>>;
}

/** Create Reactive nodes for every reactive property.
 *
 * The list of property names and descriptions is stored in the prototype in __toInstall
 * The Reactive nodes are stored in the __reactive property on the instance.
 *
 * This is called when every new HasReactive instance is constructed.
 */
export function createReactives(r: HasReactiveInternal) {
  const reactives = r.__reactive || (r.__reactive = {});
  for (const { key, descriptor, params } of installList(
    r as DecoratedInternal
  )) {
    const label = `${r.constructor.name}.${key}`;
    if (descriptor?.get) {
      // getter
      reactives[key] = new Reactive(descriptor.get.bind(r), false, label);
    } else if (typeof descriptor?.value === "function") {
      // method
      const boundFn = descriptor.value.bind(r);
      reactives[key] = new Reactive(boundFn, false, label);
    } else {
      // signal

      /* babel builds have initializer fns on the descriptor, so we call that now.
         tsc builds don't have initializer functions, but they call this.prop = value in the constructor,
         so the set accessor will set the initial value */
      const initializer = (descriptor as any)?.initializer;
      const value = initializer ? initializer.call(r) : undefined;

      reactives[key] = new Reactive<unknown>(value, false, label);
    }
    if (params?.equals) reactives[key].equals = params.equals;
  }
}
interface InstallEntry {
  key: string;
  descriptor: PropertyDescriptor | undefined;
  params: ReactivelyParams | undefined;
}

/** collect the list of reactive properties to install up the prototype chain */
function installList(d: DecoratedInternal): InstallEntry[] {
  const installEntries: InstallEntry[] = []; // entries in lexical order within each class
  const installKeys = new Set<string>();

  for (
    let proto = d;
    proto !== Object.prototype;
    proto = Object.getPrototypeOf(proto)
  ) {
    if (proto.hasOwnProperty("__toInstall")) {
      proto.__toInstall!.forEach((property) => {
        // if class and subclass have like named property, use the subclass's property
        if (!installKeys.has(property.key)) {
          installKeys.add(property.key);
          installEntries.push(property);
        }
      });
    }
  }
  return installEntries;
}

/** Save a list of reactive properties that will be installed on each object instance
 * on the prototype for the class. */
function addReactive(
  proto: HasReactiveInternal,
  key: string,
  descriptor: PropertyDescriptor,
  params: ReactivelyParams = {}
): any {
  installOneAccessor(proto, key, descriptor);
  queueReactiveToInstall(proto as DecoratedInternal, key, descriptor, params);
  return {}; // so babel builds don't create a property on the instance
}

/** Save info about a reactive property for installation on every instance */
export function queueReactiveToInstall(
  proto: DecoratedInternal,
  key: string,
  descriptor?: PropertyDescriptor,
  params: ReactivelyParams = {}
) {
  if (!proto.hasOwnProperty("__toInstall")) {
    // Accumulate entries onto our class's prototype.
    // (We don't want to mix our entries with a superclass.  Our properties don't
    //  belong on other subclasses of that superclass.)
    Object.defineProperty(proto, "__toInstall", {
      value: [],
    });
  }
  proto.__toInstall!.push({ key, descriptor, params });
}

/** Install get and set accessor functions for reactive propertes on the prototype
 *
 * (internally the accessors reference a Reactive node
 * stored in the __reactive property on the instance.)  */
function installOneAccessor(
  proto: HasReactive,
  key: string,
  descriptor: PropertyDescriptor
): void {
  function reactiveGet(this: HasReactiveInternal) {
    return this.__reactive![key].get();
  }
  if (descriptor?.get) {
    Object.defineProperty(proto, key, {
      get: reactiveGet,
    });
  } else if (typeof descriptor?.value === "function") {
    (proto as Record<string, unknown>)[key] = reactiveGet;
  } else {
    Object.defineProperty(proto, key, {
      get: reactiveGet,
      set: function (this: HasReactiveInternal, v: any) {
        return this.__reactive![key].set(v);
      },
    });
  }
}
