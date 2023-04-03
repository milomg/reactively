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
 * @returns a tree of the reactive sources of a reactive node in Mermaid syntax.
 */
export function mermaidSources(target: Reactive<any>, shortLabels = false): string {
  const lines = ["graph TD"];
  let syntheticLabel = 0;
  recursiveSources(target as unknown as ReactiveInternal);
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
