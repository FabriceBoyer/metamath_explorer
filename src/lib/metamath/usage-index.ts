import type { MetamathIndex, UsageIndex } from "./types";

const cache = new WeakMap<MetamathIndex, UsageIndex>();

/** Reverse-dependency map (label -> labels whose proof uses it), computed
 * lazily once per index and cached by reference identity. */
export function getUsageIndex(index: MetamathIndex): UsageIndex {
  const cached = cache.get(index);
  if (cached) return cached;

  const usage: UsageIndex = {};
  for (const label of index.labelOrder) {
    const deps = index.statements[label]?.proof?.dependencies;
    if (!deps) continue;
    for (const dep of deps) {
      (usage[dep] ??= []).push(label);
    }
  }

  cache.set(index, usage);
  return usage;
}
