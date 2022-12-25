import {
  CacheCheck,
  CacheClean,
  CacheDirty,
  CacheState,
  Reactive,
} from "@reactively/core";
import { HasReactive } from "@reactively/decorate";

/** debug log a HasReactive instance */
export function logHasReactive(o: HasReactive & { c?: any }): void {
  const proto = Object.getPrototypeOf(o);
  const protoProto = Object.getPrototypeOf(proto);
  const ppD = Object.getOwnPropertyDescriptors(protoProto);
  logReactives(o);
  console.log("instance", Object.getOwnPropertyDescriptors(o));
  console.log("proto", Object.getOwnPropertyDescriptors(proto));
  console.log("protoProto", ppD);
}

/** log all of the reactive elements in a HasReactive instance */
export function logReactives(o: HasReactive): void {
  const reactives = o.__reactive;
  console.log("reactives:");
  for (const key in reactives) {
    const r = reactives[key] as any;
    const details = reactiveDetails(r);
    console.log(key, ":", details);
  }
}

/** return some pithy details about a reactive node for debug logging */
function reactiveDetails(r: Reactive<unknown>): Record<string, unknown> {
  // @ts-ignore
  const { state, value, fn, sources, observers } = r;

  return {
    value,
    fn: fn?.toString(),
    observers,
    sources,
    state: cacheState(state),
  };
}

function cacheState(state: CacheState): string {
  if (state == CacheClean) {
    return "clean";
  } else if (state == CacheCheck) {
    return "check";
  } else if (state == CacheDirty) {
    return "dirty";
  } else {
    return "unknown";
  }
}
