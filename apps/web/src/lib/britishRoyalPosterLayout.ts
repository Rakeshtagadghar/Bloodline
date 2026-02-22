import type { FamilyDataset } from "@bloodline/core";
import type { LayoutNode, LayoutResult } from "@bloodline/renderer";

interface PosterNodePosition {
  x: number;
  y: number;
  depth: number;
}

interface PosterLayoutUnit {
  id: string;
  depth: number;
  memberIds: string[];
  parentUnitIds: string[];
  childUnitIds: string[];
  baseCenterX: number;
  desiredCenterX: number;
  centerX: number;
  width: number;
}

interface RowPlacementItem {
  id: string;
  desiredCenterX: number;
  width: number;
  baseCenterX: number;
}

const BRITISH_ROYAL_DATASET_ID = "british_royal_family_example";

const BRITISH_ROYAL_POSTER_POSITIONS: Readonly<Record<string, PosterNodePosition>> = {
  p_queen_elizabeth_ii: { x: -150, y: 0, depth: 0 },
  p_prince_philip: { x: 150, y: 0, depth: 0 },

  p_sarah_ferguson: { x: -650, y: 250, depth: 1 },
  p_andrew: { x: -360, y: 250, depth: 1 },
  p_edward: { x: 360, y: 250, depth: 1 },
  p_sophie: { x: 650, y: 250, depth: 1 },

  p_jack_brooksbank: { x: -790, y: 500, depth: 2 },
  p_princess_eugenie: { x: -540, y: 500, depth: 2 },
  p_princess_beatrice: { x: -290, y: 500, depth: 2 },
  p_lady_louise: { x: 430, y: 500, depth: 2 },
  p_james: { x: 650, y: 500, depth: 2 },

  p_diana: { x: -650, y: 820, depth: 3 },
  p_charles: { x: -370, y: 820, depth: 3 },
  p_camilla: { x: -90, y: 820, depth: 3 },
  p_mark_phillips: { x: 250, y: 820, depth: 3 },
  p_anne: { x: 530, y: 820, depth: 3 },
  p_timothy_laurence: { x: 810, y: 820, depth: 3 },

  p_kate_middleton: { x: -760, y: 1080, depth: 4 },
  p_prince_william: { x: -520, y: 1080, depth: 4 },
  p_prince_harry: { x: -280, y: 1080, depth: 4 },
  p_meghan_markle: { x: -40, y: 1080, depth: 4 },
  p_mike_tindall: { x: 300, y: 1080, depth: 4 },
  p_zara_phillips: { x: 520, y: 1080, depth: 4 },
  p_peter_phillips: { x: 780, y: 1080, depth: 4 },
  p_autumn_kelly: { x: 1020, y: 1080, depth: 4 },

  p_baby_wales: { x: -820, y: 1330, depth: 5 },
  p_princess_charlotte: { x: -640, y: 1330, depth: 5 },
  p_prince_george: { x: -460, y: 1330, depth: 5 },
  p_baby_tindall: { x: 260, y: 1330, depth: 5 },
  p_mia_tindall: { x: 430, y: 1330, depth: 5 },
  p_savannah_phillips: { x: 760, y: 1330, depth: 5 },
  p_isla_phillips: { x: 930, y: 1330, depth: 5 }
};

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

function isBritishRoyalExampleDataset(dataset: FamilyDataset): boolean {
  return dataset.meta.dataset === BRITISH_ROYAL_DATASET_ID;
}

function buildNodesById(layout: LayoutResult): Map<string, LayoutNode> {
  return new Map(layout.nodes.map((node) => [node.id, node] as const));
}

function buildDepthsByPerson(layout: LayoutResult): Map<string, number> {
  return new Map(layout.nodes.map((node) => [node.id, node.depth] as const));
}

function buildPartnerAdjacencyByDepth(
  dataset: FamilyDataset,
  depthsByPerson: ReadonlyMap<string, number>
): Map<string, Set<string>> {
  const adjacency = new Map<string, Set<string>>();

  for (const personId of depthsByPerson.keys()) {
    adjacency.set(personId, new Set<string>());
  }

  for (const relationship of dataset.relationships) {
    if (relationship.type !== "partner" || !relationship.from || !relationship.to) {
      continue;
    }

    const fromDepth = depthsByPerson.get(relationship.from);
    const toDepth = depthsByPerson.get(relationship.to);
    if (fromDepth === undefined || toDepth === undefined || fromDepth !== toDepth) {
      continue;
    }

    adjacency.get(relationship.from)?.add(relationship.to);
    adjacency.get(relationship.to)?.add(relationship.from);
  }

  return adjacency;
}

function buildPosterUnits(
  layout: LayoutResult,
  dataset: FamilyDataset
): { units: PosterLayoutUnit[]; unitByPersonId: Map<string, string> } {
  const nodesById = buildNodesById(layout);
  const depthsByPerson = buildDepthsByPerson(layout);
  const partnerAdjacency = buildPartnerAdjacencyByDepth(dataset, depthsByPerson);
  const visited = new Set<string>();
  const units: PosterLayoutUnit[] = [];
  const unitByPersonId = new Map<string, string>();

  const nodeWidthDefault = Math.max(...layout.nodes.map((node) => node.width), 190);
  const memberGap = Math.max(nodeWidthDefault + 34, 210);

  for (const node of [...layout.nodes].sort((a, b) => a.depth - b.depth || a.x - b.x || a.id.localeCompare(b.id))) {
    if (visited.has(node.id)) {
      continue;
    }

    const queue = [node.id];
    const component = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current || visited.has(current)) {
        continue;
      }

      visited.add(current);
      component.add(current);

      for (const partnerId of partnerAdjacency.get(current) ?? []) {
        if (visited.has(partnerId)) {
          continue;
        }
        if (depthsByPerson.get(partnerId) !== node.depth) {
          continue;
        }
        queue.push(partnerId);
      }
    }

    const memberIds = [...component].sort((a, b) => {
      const aNode = nodesById.get(a);
      const bNode = nodesById.get(b);
      if (!aNode || !bNode) {
        return a.localeCompare(b);
      }
      return aNode.x - bNode.x || a.localeCompare(b);
    });

    const memberCenters = memberIds
      .map((id) => nodesById.get(id)?.x)
      .filter((x): x is number => x !== undefined);
    const baseCenterX = average(memberCenters) ?? node.x;
    const width = Math.max(nodeWidthDefault, (memberIds.length - 1) * memberGap + nodeWidthDefault);

    const unitId = `u_${node.depth}_${memberIds.join("_")}`;
    for (const memberId of memberIds) {
      unitByPersonId.set(memberId, unitId);
    }

    units.push({
      id: unitId,
      depth: node.depth,
      memberIds,
      parentUnitIds: [],
      childUnitIds: [],
      baseCenterX,
      desiredCenterX: baseCenterX,
      centerX: baseCenterX,
      width
    });
  }

  const unitById = new Map(units.map((unit) => [unit.id, unit] as const));

  for (const relationship of dataset.relationships) {
    if (relationship.type !== "parent" || !relationship.parentId || !relationship.childId) {
      continue;
    }

    const parentUnitId = unitByPersonId.get(relationship.parentId);
    const childUnitId = unitByPersonId.get(relationship.childId);
    if (!parentUnitId || !childUnitId || parentUnitId === childUnitId) {
      continue;
    }

    const parentUnit = unitById.get(parentUnitId);
    const childUnit = unitById.get(childUnitId);
    if (!parentUnit || !childUnit) {
      continue;
    }

    if (!parentUnit.childUnitIds.includes(childUnitId)) {
      parentUnit.childUnitIds.push(childUnitId);
    }
    if (!childUnit.parentUnitIds.includes(parentUnitId)) {
      childUnit.parentUnitIds.push(parentUnitId);
    }
  }

  for (const unit of units) {
    unit.parentUnitIds.sort((a, b) => a.localeCompare(b));
    unit.childUnitIds.sort((a, b) => a.localeCompare(b));
  }

  return { units, unitByPersonId };
}

function placeRow(items: RowPlacementItem[], minGap: number): Map<string, number> {
  if (items.length === 0) {
    return new Map<string, number>();
  }

  const ordered = [...items].sort(
    (a, b) => a.desiredCenterX - b.desiredCenterX || a.baseCenterX - b.baseCenterX || a.id.localeCompare(b.id)
  );

  const placed = new Map<string, number>();
  let previousRight = Number.NEGATIVE_INFINITY;

  for (const item of ordered) {
    const halfWidth = item.width / 2;
    const minCenter = previousRight + minGap + halfWidth;
    const centerX = Math.max(item.desiredCenterX, minCenter);
    placed.set(item.id, centerX);
    previousRight = centerX + halfWidth;
  }

  const desiredAverage = average(ordered.map((item) => item.desiredCenterX)) ?? 0;
  const actualAverage = average(ordered.map((item) => placed.get(item.id) ?? item.desiredCenterX)) ?? 0;
  const shift = desiredAverage - actualAverage;

  for (const item of ordered) {
    const current = placed.get(item.id);
    if (current === undefined) {
      continue;
    }
    placed.set(item.id, current + shift);
  }

  return placed;
}

function applyDynamicRoyalPosterLayout(dataset: FamilyDataset, baseLayout: LayoutResult): LayoutResult {
  if (baseLayout.nodes.length === 0) {
    return baseLayout;
  }

  const nodesById = buildNodesById(baseLayout);
  const { units, unitByPersonId } = buildPosterUnits(baseLayout, dataset);
  const unitById = new Map(units.map((unit) => [unit.id, unit] as const));

  const unitsByDepth = new Map<number, PosterLayoutUnit[]>();
  for (const unit of units) {
    const list = unitsByDepth.get(unit.depth);
    if (list) {
      list.push(unit);
    } else {
      unitsByDepth.set(unit.depth, [unit]);
    }
  }

  const sortedDepths = [...unitsByDepth.keys()].sort((a, b) => a - b);
  const unitGap = 56;

  const recalcDesireds = () => {
    for (const depth of sortedDepths) {
      for (const unit of unitsByDepth.get(depth) ?? []) {
        const parentCenters = unit.parentUnitIds
          .map((id) => unitById.get(id)?.centerX)
          .filter((value): value is number => value !== undefined);
        if (parentCenters.length > 0) {
          unit.desiredCenterX = average(parentCenters) ?? unit.desiredCenterX;
        } else {
          unit.desiredCenterX = unit.baseCenterX;
        }
      }
    }

    for (const depth of [...sortedDepths].reverse()) {
      for (const unit of unitsByDepth.get(depth) ?? []) {
        const childCenters = unit.childUnitIds
          .map((id) => unitById.get(id)?.centerX)
          .filter((value): value is number => value !== undefined);
        if (childCenters.length === 0) {
          continue;
        }
        const childAverage = average(childCenters) ?? unit.desiredCenterX;
        unit.desiredCenterX = unit.parentUnitIds.length > 0 ? unit.desiredCenterX * 0.55 + childAverage * 0.45 : childAverage;
      }
    }
  };

  const placeAllRows = () => {
    for (const depth of sortedDepths) {
      const rowUnits = unitsByDepth.get(depth) ?? [];
      const rowPlacement = placeRow(
        rowUnits.map((unit) => ({
          id: unit.id,
          desiredCenterX: unit.desiredCenterX,
          width: unit.width,
          baseCenterX: unit.baseCenterX
        })),
        unitGap
      );

      for (const unit of rowUnits) {
        unit.centerX = rowPlacement.get(unit.id) ?? unit.desiredCenterX;
      }
    }
  };

  placeAllRows();
  for (let iteration = 0; iteration < 4; iteration += 1) {
    recalcDesireds();
    placeAllRows();
  }

  const memberGap = Math.max(Math.max(...baseLayout.nodes.map((node) => node.width), 190) + 34, 210);

  const positionedNodes = baseLayout.nodes.map((node) => {
    const unitId = unitByPersonId.get(node.id);
    const unit = unitId ? unitById.get(unitId) : undefined;
    if (!unit) {
      return node;
    }

    const orderedMembers = [...unit.memberIds].sort((a, b) => {
      const aNode = nodesById.get(a);
      const bNode = nodesById.get(b);
      if (!aNode || !bNode) {
        return a.localeCompare(b);
      }
      return aNode.x - bNode.x || a.localeCompare(b);
    });

    const memberIndex = orderedMembers.indexOf(node.id);
    const offset = (memberIndex - (orderedMembers.length - 1) / 2) * memberGap;

    return {
      ...node,
      x: unit.centerX + offset
    };
  });

  positionedNodes.sort((a, b) => a.depth - b.depth || a.y - b.y || a.x - b.x || a.id.localeCompare(b.id));

  return {
    ...baseLayout,
    nodes: positionedNodes
  };
}

function applyBritishRoyalManualPosterPositions(baseLayout: LayoutResult): LayoutResult {
  const nodes = baseLayout.nodes.map((node) => {
    const poster = BRITISH_ROYAL_POSTER_POSITIONS[node.id];
    if (!poster) {
      return node;
    }
    return {
      ...node,
      x: poster.x,
      y: poster.y,
      depth: poster.depth
    };
  });

  nodes.sort((a, b) => a.depth - b.depth || a.y - b.y || a.x - b.x || a.id.localeCompare(b.id));
  return { ...baseLayout, nodes };
}

export function applyBritishRoyalPosterLayout(dataset: FamilyDataset, baseLayout: LayoutResult): LayoutResult {
  const dynamicLayout = applyDynamicRoyalPosterLayout(dataset, baseLayout);
  if (!isBritishRoyalExampleDataset(dataset)) {
    return dynamicLayout;
  }
  return applyBritishRoyalManualPosterPositions(dynamicLayout);
}
