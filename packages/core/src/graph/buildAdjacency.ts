import type { FamilyDataset, Relationship } from "../schema/dataset.zod";

export type TraversalEdgeType = Relationship["type"];

export interface GraphNeighbor {
  to: string;
  type: TraversalEdgeType;
  relationshipId: string;
}

export interface AdjacencyGraph {
  people: Set<string>;
  childrenByParent: Map<string, Set<string>>;
  parentsByChild: Map<string, Set<string>>;
  partnersByPerson: Map<string, Set<string>>;
  neighborsByPerson: Map<string, GraphNeighbor[]>;
}

function ensureSet(map: Map<string, Set<string>>, key: string): Set<string> {
  let current = map.get(key);
  if (!current) {
    current = new Set<string>();
    map.set(key, current);
  }
  return current;
}

function ensureNeighbors(map: Map<string, GraphNeighbor[]>, key: string): GraphNeighbor[] {
  let current = map.get(key);
  if (!current) {
    current = [];
    map.set(key, current);
  }
  return current;
}

function addBidirectionalNeighbor(
  graph: AdjacencyGraph,
  a: string,
  b: string,
  relationship: Relationship
): void {
  ensureNeighbors(graph.neighborsByPerson, a).push({
    to: b,
    type: relationship.type,
    relationshipId: relationship.id
  });
  ensureNeighbors(graph.neighborsByPerson, b).push({
    to: a,
    type: relationship.type,
    relationshipId: relationship.id
  });
}

export function buildAdjacency(dataset: FamilyDataset): AdjacencyGraph {
  const graph: AdjacencyGraph = {
    people: new Set(dataset.people.map((person) => person.id)),
    childrenByParent: new Map(),
    parentsByChild: new Map(),
    partnersByPerson: new Map(),
    neighborsByPerson: new Map()
  };

  for (const personId of graph.people) {
    graph.childrenByParent.set(personId, new Set());
    graph.parentsByChild.set(personId, new Set());
    graph.partnersByPerson.set(personId, new Set());
    graph.neighborsByPerson.set(personId, []);
  }

  for (const relationship of dataset.relationships) {
    if (relationship.type === "parent" && relationship.parentId && relationship.childId) {
      ensureSet(graph.childrenByParent, relationship.parentId).add(relationship.childId);
      ensureSet(graph.parentsByChild, relationship.childId).add(relationship.parentId);
      addBidirectionalNeighbor(graph, relationship.parentId, relationship.childId, relationship);
      continue;
    }

    if (relationship.type === "partner" && relationship.from && relationship.to) {
      ensureSet(graph.partnersByPerson, relationship.from).add(relationship.to);
      ensureSet(graph.partnersByPerson, relationship.to).add(relationship.from);
      addBidirectionalNeighbor(graph, relationship.from, relationship.to, relationship);
      continue;
    }

    if (
      (relationship.type === "guardian" || relationship.type === "step_parent") &&
      relationship.parentId &&
      relationship.childId
    ) {
      addBidirectionalNeighbor(graph, relationship.parentId, relationship.childId, relationship);
    }
  }

  return graph;
}
