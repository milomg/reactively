import { CacheState, Reactive } from "@reactively/core";

/** Access to internal core state */
interface ReactiveInternal {
  _value: any;
  fn?: () => any;
  observers: ReactiveInternal[] | null;
  sources: ReactiveInternal[] | null;
  state: CacheState;
  effect: boolean;
  label?: string;
  cleanups: ((oldValue: any) => void)[];
  equals?: (a: any, b: any) => boolean;
}

/**
 * @returns a Mermaid graph of the reactive sources of one or more reactive nodes.
 */
export function mermaidSources(
  target: Reactive<any> | Reactive<any>[],
  shortLabels = false
): string {
  const lines = ["graph TD"];
  const visited = new Set<ReactiveInternal>();
  let syntheticLabel = 0;
  const targets = Array.isArray(target) ? target : [target];
  for (const t of targets) {
    recursiveSources(t as unknown as ReactiveInternal);
  }
  return lines.join("\n");

  function label(node: ReactiveInternal): string {
    const nodeLabel = node.label;
    if (nodeLabel) {
      if (shortLabels) {
        const lastDot = nodeLabel.lastIndexOf(".");
        if (lastDot > 0) {
          return nodeLabel.slice(lastDot + 1);
        }
      }
      return nodeLabel;
    } else {
      return `#${syntheticLabel++}`;
    }
  }

  function recursiveSources(node: ReactiveInternal): void {
    if (visited.has(node)) {
      return;
    } else {
      visited.add(node);
      const { sources } = node;
      if (sources) {
        for (const s of sources) {
          const nodeLabel = label(node);
          const sourceLabel = label(s);
          lines.push(`    ${sourceLabel} --> ${nodeLabel}`);
          recursiveSources(s);
        }
      }
    }
  }
}
