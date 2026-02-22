import type { FamilyDataset } from "@bloodline/core";
import { buildAdjacency } from "@bloodline/core";

import { layoutPartners } from "./layoutPartners";

export interface LayoutNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
}

export interface LayoutEdge {
  id?: string;
  from: string;
  to: string;
  type: string;
}

export interface LayoutResult {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
}

export interface LayoutOptions {
  mode?: "descendant" | "ancestor" | "both" | "radial";
  seed?: number;
  nodeWidth?: number;
  nodeHeight?: number;
  xGap?: number;
  yGap?: number;
}

function sortIds(ids: Iterable<string>): string[] {
  return [...ids].sort((a, b) => a.localeCompare(b));
}

function average(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  let total = 0;
  for (const value of values) {
    total += value;
  }
  return total / values.length;
}

function computeDescendantDepths(rootId: string, dataset: FamilyDataset): Map<string, number> {
  const graph = buildAdjacency(dataset);
  const depths = new Map<string, number>([[rootId, 0]]);
  const queue: string[] = [rootId];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }
    const currentDepth = depths.get(current) ?? 0;
    const partners = sortIds(graph.partnersByPerson.get(current) ?? []);
    for (const partner of partners) {
      if (!depths.has(partner)) {
        depths.set(partner, currentDepth);
        queue.push(partner);
      }
    }
    const children = sortIds(graph.childrenByParent.get(current) ?? []);
    for (const child of children) {
      const nextDepth = currentDepth + 1;
      const knownDepth = depths.get(child);
      if (knownDepth === undefined || nextDepth < knownDepth) {
        depths.set(child, nextDepth);
        queue.push(child);
      }
    }
  }

  return depths;
}

function buildLayoutEdges(dataset: FamilyDataset, depths: Map<string, number>): LayoutEdge[] {
  const edges: LayoutEdge[] = [];

  for (const relationship of dataset.relationships) {
    if (relationship.type === "parent" && relationship.parentId && relationship.childId) {
      if (depths.has(relationship.parentId) && depths.has(relationship.childId)) {
        edges.push({
          id: relationship.id,
          from: relationship.parentId,
          to: relationship.childId,
          type: relationship.type
        });
      }
      continue;
    }
    if (relationship.type === "partner" && relationship.from && relationship.to) {
      if (depths.has(relationship.from) && depths.has(relationship.to)) {
        edges.push({
          id: relationship.id,
          from: relationship.from,
          to: relationship.to,
          type: relationship.type
        });
      }
    }
  }

  edges.sort((a, b) =>
    `${a.type}:${a.from}:${a.to}:${a.id ?? ""}`.localeCompare(`${b.type}:${b.from}:${b.to}:${b.id ?? ""}`)
  );

  return edges;
}

function buildLevelNodes(
  levels: Map<number, string[]>,
  nodeWidth: number,
  nodeHeight: number,
  xGap: number,
  yGap: number
): LayoutNode[] {
  const nodes: LayoutNode[] = [];
  const sortedDepths = [...levels.keys()].sort((a, b) => a - b);

  for (const depth of sortedDepths) {
    const ids = levels.get(depth) ?? [];
    const startX = -((ids.length - 1) * xGap) / 2;
    ids.forEach((id, index) => {
      nodes.push({
        id,
        x: startX + index * xGap,
        y: depth * yGap,
        width: nodeWidth,
        height: nodeHeight,
        depth
      });
    });
  }

  return nodes;
}

function reorderLevelsByAnchors(
  levels: Map<number, string[]>,
  depths: Map<string, number>,
  graph: ReturnType<typeof buildAdjacency>,
  referenceXById: ReadonlyMap<string, number>
): Map<number, string[]> {
  const next = new Map<number, string[]>();

  for (const [depth, ids] of levels) {
    if (depth === 0) {
      next.set(depth, [...ids]);
      continue;
    }

    const scored = ids.map((id) => {
      const parentAnchors = [...(graph.parentsByChild.get(id) ?? [])]
        .filter((parentId) => depths.get(parentId) === depth - 1)
        .map((parentId) => referenceXById.get(parentId))
        .filter((x): x is number => x !== undefined);
      const parentScore = average(parentAnchors);

      const partnerAnchors = [...(graph.partnersByPerson.get(id) ?? [])]
        .filter((partnerId) => depths.get(partnerId) === depth)
        .map((partnerId) => referenceXById.get(partnerId))
        .filter((x): x is number => x !== undefined);
      const partnerScore = average(partnerAnchors);

      if (parentScore !== null) {
        return { id, rank: 0, score: parentScore };
      }
      if (partnerScore !== null) {
        return { id, rank: 1, score: partnerScore };
      }
      return { id, rank: 2, score: 0 };
    });

    scored.sort((a, b) => a.rank - b.rank || a.score - b.score || a.id.localeCompare(b.id));
    next.set(
      depth,
      scored.map((entry) => entry.id)
    );
  }

  return next;
}

export function layoutTree(
  rootPersonId: string,
  dataset: FamilyDataset,
  options: LayoutOptions = {}
): LayoutResult {
  const mode = options.mode ?? "descendant";
  const nodeWidth = options.nodeWidth ?? 160;
  const nodeHeight = options.nodeHeight ?? 84;
  const xGap = options.xGap ?? 220;
  const yGap = options.yGap ?? 160;

  if (mode !== "descendant") {
    // Descendant mode is implemented first; other modes fall back deterministically.
  }

  const depths = computeDescendantDepths(rootPersonId, dataset);
  if (!depths.has(rootPersonId)) {
    depths.set(rootPersonId, 0);
  }
  const graph = buildAdjacency(dataset);

  const levels = new Map<number, string[]>();
  for (const [id, depth] of depths) {
    const level = levels.get(depth) ?? [];
    level.push(id);
    levels.set(depth, level);
  }
  for (const [depth, ids] of levels) {
    levels.set(depth, ids.sort((a, b) => a.localeCompare(b)));
  }

  const edges = buildLayoutEdges(dataset, depths);
  const partnerGap = Math.min(xGap - 40, 180);

  const provisionalNodes = layoutPartners(
    buildLevelNodes(levels, nodeWidth, nodeHeight, xGap, yGap),
    edges,
    partnerGap
  );
  const referenceXById = new Map(provisionalNodes.map((node) => [node.id, node.x] as const));
  const reorderedLevels = reorderLevelsByAnchors(levels, depths, graph, referenceXById);

  const nodes = layoutPartners(
    buildLevelNodes(reorderedLevels, nodeWidth, nodeHeight, xGap, yGap),
    edges,
    partnerGap
  );
  nodes.sort((a, b) => a.depth - b.depth || a.id.localeCompare(b.id));

  return { nodes, edges };
}
