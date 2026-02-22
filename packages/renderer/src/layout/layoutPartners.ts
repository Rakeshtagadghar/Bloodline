import type { LayoutNode } from "./layoutTree";

export interface PartnerEdgeLike {
  from: string;
  to: string;
  type: string;
}

export function layoutPartners(
  nodes: LayoutNode[],
  edges: PartnerEdgeLike[],
  partnerGap = 180
): LayoutNode[] {
  const byId = new Map(nodes.map((node) => [node.id, node] as const));
  const next = nodes.map((node) => ({ ...node }));
  const nextById = new Map(next.map((node) => [node.id, node] as const));

  for (const edge of edges) {
    if (edge.type !== "partner") {
      continue;
    }
    const left = nextById.get(edge.from);
    const right = nextById.get(edge.to);
    if (!left || !right || left.depth !== right.depth) {
      continue;
    }
    const originalLeft = byId.get(edge.from);
    const originalRight = byId.get(edge.to);
    if (!originalLeft || !originalRight) {
      continue;
    }
    const center = (originalLeft.x + originalRight.x) / 2;
    left.x = center - partnerGap / 2;
    right.x = center + partnerGap / 2;
  }

  return next;
}
