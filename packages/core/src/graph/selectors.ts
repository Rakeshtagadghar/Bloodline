import type { AdjacencyGraph } from "./buildAdjacency";

export function computeAncestors(personId: string, graph: AdjacencyGraph): Set<string> {
  const result = new Set<string>();
  const queue = [...(graph.parentsByChild.get(personId) ?? [])];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || result.has(current)) {
      continue;
    }
    result.add(current);
    for (const parent of graph.parentsByChild.get(current) ?? []) {
      if (!result.has(parent)) {
        queue.push(parent);
      }
    }
  }

  return result;
}

export function computeDescendants(personId: string, graph: AdjacencyGraph): Set<string> {
  const result = new Set<string>();
  const queue = [...(graph.childrenByParent.get(personId) ?? [])];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || result.has(current)) {
      continue;
    }
    result.add(current);
    for (const child of graph.childrenByParent.get(current) ?? []) {
      if (!result.has(child)) {
        queue.push(child);
      }
    }
  }

  return result;
}
