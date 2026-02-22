import type { AdjacencyGraph, TraversalEdgeType } from "./buildAdjacency";

export function shortestRelationshipPath(
  startId: string,
  endId: string,
  graph: AdjacencyGraph,
  allowedEdgeTypes: Set<TraversalEdgeType> = new Set(["parent", "partner", "guardian", "step_parent"])
): string[] | null {
  if (startId === endId) {
    return [startId];
  }
  if (!graph.people.has(startId) || !graph.people.has(endId)) {
    return null;
  }

  const queue: string[] = [startId];
  const visited = new Set<string>([startId]);
  const previous = new Map<string, string>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }

    for (const neighbor of graph.neighborsByPerson.get(current) ?? []) {
      if (!allowedEdgeTypes.has(neighbor.type) || visited.has(neighbor.to)) {
        continue;
      }
      visited.add(neighbor.to);
      previous.set(neighbor.to, current);
      if (neighbor.to === endId) {
        const path: string[] = [endId];
        let cursor = endId;
        while (previous.has(cursor)) {
          const prior = previous.get(cursor)!;
          path.push(prior);
          cursor = prior;
        }
        path.reverse();
        return path;
      }
      queue.push(neighbor.to);
    }
  }

  return null;
}
