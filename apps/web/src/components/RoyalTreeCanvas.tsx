"use client";

import {
  buildAdjacency,
  computeAncestors,
  computeDescendants,
  type AdjacencyGraph,
  type FamilyDataset,
  type Relationship
} from "@bloodline/core";
import {
  cullNodes,
  panViewport,
  zoomViewportAt,
  type LayoutResult,
  type Viewport
} from "@bloodline/renderer";
import { useEffect, useRef, useState, type RefObject } from "react";

import {
  buildMediaById,
  fetchBritishRoyalPortraitUrl,
  getPortraitUrlFromDatasetMedia,
  hasBritishRoyalPortraitLookup
} from "../lib/royalPortraits";
import { RoyalNodeCard } from "./RoyalNodeCard";
import styles from "./TreeWorkbench.module.css";

export interface RoyalTreeCanvasProps {
  dataset: FamilyDataset | null;
  layout: LayoutResult | null;
  graph: AdjacencyGraph | null;
  selectedPersonId: string | null;
  searchQuery: string;
  dimmedPersonIds?: ReadonlySet<string>;
  viewport: Viewport;
  centerOnSelectionKey: number;
  onViewportChange: (viewport: Viewport) => void;
  onSelectPerson: (personId: string) => void;
}

interface EdgeSvgBounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

type ConnectorLineVariant = "partner" | "trunk" | "rail" | "drop";

interface ConnectorLine {
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  variant: ConnectorLineVariant;
}

interface PartnerBadge {
  key: string;
  x: number;
  y: number;
  status: Relationship["status"];
}

interface ConnectorGeometry {
  lines: ConnectorLine[];
  badges: PartnerBadge[];
}

function sortedPairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function getPartnerBadgeVariant(status: Relationship["status"]): "married" | "divorced" | "neutral" {
  if (status === "divorced" || status === "separated") {
    return "divorced";
  }
  if (status === "married" || status === "partnered") {
    return "married";
  }
  return "neutral";
}

function buildConnectorGeometry(
  dataset: FamilyDataset,
  nodesById: ReadonlyMap<string, LayoutResult["nodes"][number]>
): ConnectorGeometry {
  const lines: ConnectorLine[] = [];
  const badges: PartnerBadge[] = [];

  const parentsByChild = new Map<string, Set<string>>();
  const partnerRelationshipByPair = new Map<string, Relationship>();

  for (const relationship of dataset.relationships) {
    if (relationship.type === "partner" && relationship.from && relationship.to) {
      if (!nodesById.has(relationship.from) || !nodesById.has(relationship.to)) {
        continue;
      }
      partnerRelationshipByPair.set(sortedPairKey(relationship.from, relationship.to), relationship);
      continue;
    }

    if (relationship.type === "parent" && relationship.parentId && relationship.childId) {
      if (!nodesById.has(relationship.parentId) || !nodesById.has(relationship.childId)) {
        continue;
      }
      let parentSet = parentsByChild.get(relationship.childId);
      if (!parentSet) {
        parentSet = new Set<string>();
        parentsByChild.set(relationship.childId, parentSet);
      }
      parentSet.add(relationship.parentId);
    }
  }

  const partnerLineYFromNode = (y: number) => y - 38;
  const partnerLineInset = 58;
  const parentTrunkStartYFromNode = (y: number) => y + 96;
  const childConnectorEndYFromNode = (y: number) => y - 96;

  for (const relationship of partnerRelationshipByPair.values()) {
    const from = nodesById.get(relationship.from ?? "");
    const to = nodesById.get(relationship.to ?? "");
    if (!from || !to) {
      continue;
    }

    const left = from.x <= to.x ? from : to;
    const right = from.x <= to.x ? to : from;
    const y = partnerLineYFromNode((left.y + right.y) / 2);

    const x1 = Math.min(left.x + partnerLineInset, right.x - 24);
    const x2 = Math.max(right.x - partnerLineInset, left.x + 24);

    if (x2 - x1 > 8) {
      lines.push({
        key: relationship.id,
        x1,
        y1: y,
        x2,
        y2: y,
        variant: "partner"
      });
    }

    badges.push({
      key: `${relationship.id}-badge`,
      x: (left.x + right.x) / 2,
      y,
      status: relationship.status
    });
  }

  const groupByParentsAndDepth = new Map<string, { parentIds: string[]; childIds: string[] }>();

  for (const [childId, parentSet] of parentsByChild) {
    const childNode = nodesById.get(childId);
    if (!childNode) {
      continue;
    }
    const parentIds = [...parentSet]
      .filter((parentId) => nodesById.has(parentId))
      .sort((a, b) => {
        const aNode = nodesById.get(a);
        const bNode = nodesById.get(b);
        if (!aNode || !bNode) {
          return a.localeCompare(b);
        }
        return aNode.x - bNode.x || a.localeCompare(b);
      });

    if (parentIds.length === 0) {
      continue;
    }

    const key = `${childNode.depth}:${parentIds.join("|")}`;
    const current = groupByParentsAndDepth.get(key);
    if (current) {
      current.childIds.push(childId);
    } else {
      groupByParentsAndDepth.set(key, { parentIds, childIds: [childId] });
    }
  }

  type FamilyConnectorGroup = {
    groupKey: string;
    parentNodes: LayoutResult["nodes"];
    childNodes: LayoutResult["nodes"];
    trunkX: number;
    topParentY: number;
    minChildX: number;
    maxChildX: number;
    spanStart: number;
    spanEnd: number;
    depth: number;
  };

  const groupsByDepth = new Map<number, FamilyConnectorGroup[]>();

  for (const [groupKey, group] of groupByParentsAndDepth) {
    const parentNodes = group.parentIds
      .map((parentId) => nodesById.get(parentId))
      .filter((node): node is NonNullable<typeof node> => Boolean(node));
    const childNodes = group.childIds
      .map((childId) => nodesById.get(childId))
      .filter((node): node is NonNullable<typeof node> => Boolean(node))
      .sort((a, b) => a.x - b.x || a.id.localeCompare(b.id));

    if (parentNodes.length === 0 || childNodes.length === 0) {
      continue;
    }

    const trunkX =
      parentNodes.length >= 2
        ? (parentNodes[0].x + parentNodes[parentNodes.length - 1].x) / 2
        : parentNodes[0].x;
    const topParentY = Math.max(...parentNodes.map((node) => node.y));
    const minChildX = childNodes[0].x;
    const maxChildX = childNodes[childNodes.length - 1].x;
    const depth = childNodes[0].depth;

    const familyGroup: FamilyConnectorGroup = {
      groupKey,
      parentNodes,
      childNodes,
      trunkX,
      topParentY,
      minChildX,
      maxChildX,
      spanStart: Math.min(minChildX, trunkX),
      spanEnd: Math.max(maxChildX, trunkX),
      depth
    };

    const depthGroups = groupsByDepth.get(depth);
    if (depthGroups) {
      depthGroups.push(familyGroup);
    } else {
      groupsByDepth.set(depth, [familyGroup]);
    }
  }

  const railLaneStep = 18;
  const railLaneReuseGap = 120;
  const childClusterGapThreshold = 300;

  for (const depth of [...groupsByDepth.keys()].sort((a, b) => a - b)) {
    const depthGroups = groupsByDepth.get(depth) ?? [];
    depthGroups.sort(
      (a, b) => a.spanStart - b.spanStart || a.trunkX - b.trunkX || a.groupKey.localeCompare(b.groupKey)
    );

    const laneEndX: number[] = [];

    for (const group of depthGroups) {
      let laneIndex = 0;
      while (laneIndex < laneEndX.length && group.spanStart <= laneEndX[laneIndex] + railLaneReuseGap) {
        laneIndex += 1;
      }
      laneEndX[laneIndex] = group.spanEnd;

      const trunkStartY = parentTrunkStartYFromNode(group.topParentY);
      const childAnchorY = childConnectorEndYFromNode(group.childNodes[0].y);
      const baseRailY = group.childNodes.length > 1 ? childAnchorY - 20 : childAnchorY - 8;
      const railY = baseRailY - laneIndex * railLaneStep;
      const clusterRailY = railY;

      const childClusters: Array<LayoutResult["nodes"]> = [];
      for (const childNode of group.childNodes) {
        const currentCluster = childClusters[childClusters.length - 1];
        if (!currentCluster) {
          childClusters.push([childNode]);
          continue;
        }
        const previous = currentCluster[currentCluster.length - 1];
        if (childNode.x - previous.x > childClusterGapThreshold) {
          childClusters.push([childNode]);
        } else {
          currentCluster.push(childNode);
        }
      }

      const isMultiCluster = childClusters.length > 1;

      const clusterAnchors = childClusters.map((cluster) => {
        const minX = cluster[0].x;
        const maxX = cluster[cluster.length - 1].x;
        const centerX = (minX + maxX) / 2;
        return { cluster, minX, maxX, centerX };
      });

      const branchLaneBaseY = clusterRailY - 22;
      const branchLaneStep = 16;
      const branchLaneYs = isMultiCluster
        ? clusterAnchors.map((_, index) => branchLaneBaseY - index * branchLaneStep)
        : [clusterRailY];
      const trunkEndY = Math.max(...branchLaneYs);

      if (trunkEndY - trunkStartY > 4) {
        lines.push({
          key: `${group.groupKey}-trunk`,
          x1: group.trunkX,
          y1: trunkStartY,
          x2: group.trunkX,
          y2: trunkEndY,
          variant: "trunk"
        });
      }

      for (const [anchorIndex, anchor] of clusterAnchors.entries()) {
        const branchLaneY = branchLaneYs[anchorIndex] ?? clusterRailY;

        if (Math.abs(anchor.centerX - group.trunkX) > 2 && childClusters.length === 1) {
          lines.push({
            key: `${group.groupKey}-single-cluster-rail`,
            x1: group.trunkX,
            y1: clusterRailY,
            x2: anchor.centerX,
            y2: clusterRailY,
            variant: "rail"
          });
        } else if (childClusters.length > 1) {
          if (Math.abs(anchor.centerX - group.trunkX) > 6) {
            lines.push({
              key: `${group.groupKey}-branch-lane-${anchorIndex}`,
              x1: group.trunkX,
              y1: branchLaneY,
              x2: anchor.centerX,
              y2: branchLaneY,
              variant: "trunk"
            });
          }

          if (clusterRailY - branchLaneY > 2) {
            lines.push({
              key: `${group.groupKey}-branch-drop-${anchorIndex}`,
              x1: anchor.centerX,
              y1: branchLaneY,
              x2: anchor.centerX,
              y2: clusterRailY,
              variant: "trunk"
            });
          }
        }

        if (anchor.maxX - anchor.minX > 6) {
          lines.push({
            key: `${group.groupKey}-cluster-rail-${anchor.centerX}`,
            x1: anchor.minX,
            y1: clusterRailY,
            x2: anchor.maxX,
            y2: clusterRailY,
            variant: "rail"
          });
        }

        for (const childNode of anchor.cluster) {
          const childEndY = childConnectorEndYFromNode(childNode.y);
          if (childNode.x === group.trunkX && clusterRailY === childEndY) {
            continue;
          }

          if (Math.abs(childNode.x - group.trunkX) > 2 && group.childNodes.length === 1) {
            lines.push({
              key: `${group.groupKey}-${childNode.id}-elbow`,
              x1: group.trunkX,
              y1: clusterRailY,
              x2: childNode.x,
              y2: clusterRailY,
              variant: "rail"
            });
          }

          if (childEndY - clusterRailY > 2) {
            lines.push({
              key: `${group.groupKey}-${childNode.id}-drop`,
              x1: childNode.x,
              y1: clusterRailY,
              x2: childNode.x,
              y2: childEndY,
              variant: "drop"
            });
          }
        }
      }
    }
  }

  return { lines, badges };
}

function getEdgeSvgBounds(layout: LayoutResult): EdgeSvgBounds | null {
  if (layout.nodes.length === 0) {
    return null;
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const node of layout.nodes) {
    if (node.x < minX) {
      minX = node.x;
    }
    if (node.y < minY) {
      minY = node.y;
    }
    if (node.x > maxX) {
      maxX = node.x;
    }
    if (node.y > maxY) {
      maxY = node.y;
    }
  }

  const padding = 140;

  return {
    left: minX - padding,
    top: minY - padding,
    width: Math.max(1, maxX - minX + padding * 2),
    height: Math.max(1, maxY - minY + padding * 2)
  };
}

function useStageSize(
  stageRef: RefObject<HTMLDivElement | null>,
  viewport: Viewport,
  onViewportChange: (viewport: Viewport) => void
) {
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) {
      return;
    }

    const updateSize = () => {
      const rect = stage.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        return;
      }
      if (Math.round(rect.width) !== Math.round(viewport.width) || Math.round(rect.height) !== Math.round(viewport.height)) {
        onViewportChange({ ...viewport, width: rect.width, height: rect.height });
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [onViewportChange, stageRef, viewport]);
}

export function RoyalTreeCanvas({
  dataset,
  layout,
  graph,
  selectedPersonId,
  searchQuery,
  dimmedPersonIds,
  viewport,
  centerOnSelectionKey,
  onViewportChange,
  onSelectPerson
}: RoyalTreeCanvasProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [remotePortraitsByPersonId, setRemotePortraitsByPersonId] = useState<Record<string, string>>({});
  const dragStateRef = useRef<{ x: number; y: number; viewport: Viewport } | null>(null);

  useStageSize(stageRef, viewport, onViewportChange);

  useEffect(() => {
    setRemotePortraitsByPersonId({});
  }, [dataset?.meta.dataset]);

  useEffect(() => {
    if (!layout || !selectedPersonId || viewport.width <= 0 || viewport.height <= 0) {
      return;
    }
    const node = layout.nodes.find((entry) => entry.id === selectedPersonId);
    if (!node) {
      return;
    }
    onViewportChange({
      ...viewport,
      x: node.x - viewport.width / (2 * viewport.scale),
      y: node.y - viewport.height / (2 * viewport.scale)
    });
  }, [centerOnSelectionKey]);

  const query = searchQuery.trim().toLowerCase();
  const visibleNodes = layout ? cullNodes(layout, viewport, 180) : [];
  const peopleById = new Map(dataset?.people.map((person) => [person.id, person]) ?? []);
  const mediaById = buildMediaById(dataset);
  const nodesById = new Map(layout?.nodes.map((node) => [node.id, node]) ?? []);
  const edgeSvgBounds = layout ? getEdgeSvgBounds(layout) : null;
  const connectorGeometry =
    dataset && layout ? buildConnectorGeometry(dataset, nodesById) : { lines: [], badges: [] };

  useEffect(() => {
    if (!dataset || visibleNodes.length === 0) {
      return;
    }

    const candidates = visibleNodes
      .map((node) => peopleById.get(node.id))
      .filter((person): person is NonNullable<typeof person> => Boolean(person))
      .filter((person) => getPortraitUrlFromDatasetMedia(person, mediaById) === null)
      .filter((person) => hasBritishRoyalPortraitLookup(person.id))
      .map((person) => person.id)
      .filter((personId) => !remotePortraitsByPersonId[personId]);

    if (candidates.length === 0) {
      return;
    }

    let cancelled = false;

    void Promise.all(
      candidates.map(async (personId) => {
        const portraitUrl = await fetchBritishRoyalPortraitUrl(personId);
        return { personId, portraitUrl };
      })
    ).then((results) => {
      if (cancelled) {
        return;
      }

      setRemotePortraitsByPersonId((current) => {
        const next = { ...current };
        let changed = false;

        for (const result of results) {
          if (!result.portraitUrl || next[result.personId]) {
            continue;
          }
          next[result.personId] = result.portraitUrl;
          changed = true;
        }

        return changed ? next : current;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [dataset, mediaById, peopleById, remotePortraitsByPersonId, visibleNodes]);

  const highlighted = new Set<string>();
  if (graph && selectedPersonId) {
    for (const id of computeAncestors(selectedPersonId, graph)) {
      highlighted.add(id);
    }
    for (const id of computeDescendants(selectedPersonId, graph)) {
      highlighted.add(id);
    }
    for (const id of graph.partnersByPerson.get(selectedPersonId) ?? []) {
      highlighted.add(id);
    }
  }

  const worldTransform = `translate(${-viewport.x * viewport.scale}px, ${-viewport.y * viewport.scale}px) scale(${viewport.scale})`;

  return (
    <div className={styles.canvasWrap}>
      <div
        ref={stageRef}
        id="tree-stage"
        data-testid="tree-stage"
        className={`${styles.stage} ${dragging ? styles.stageDragging : ""}`}
        aria-label="Interactive family tree"
        onPointerDown={(event) => {
          if (event.button !== 0) {
            return;
          }
          const target = event.target as HTMLElement;
          if (target.closest("button")) {
            return;
          }
          (event.currentTarget as HTMLDivElement).setPointerCapture(event.pointerId);
          dragStateRef.current = { x: event.clientX, y: event.clientY, viewport };
          setDragging(true);
        }}
        onPointerMove={(event) => {
          const dragState = dragStateRef.current;
          if (!dragState) {
            return;
          }
          onViewportChange(
            panViewport(
              {
                ...dragState.viewport,
                width: viewport.width,
                height: viewport.height
              },
              event.clientX - dragState.x,
              event.clientY - dragState.y
            )
          );
        }}
        onPointerUp={(event) => {
          if ((event.currentTarget as HTMLDivElement).hasPointerCapture(event.pointerId)) {
            (event.currentTarget as HTMLDivElement).releasePointerCapture(event.pointerId);
          }
          dragStateRef.current = null;
          setDragging(false);
        }}
        onPointerCancel={() => {
          dragStateRef.current = null;
          setDragging(false);
        }}
        onWheel={(event) => {
          event.preventDefault();
          const rect = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
          const screenPoint = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
          };
          const factor = event.deltaY < 0 ? 1.08 : 0.92;
          onViewportChange(zoomViewportAt(viewport, factor, screenPoint, 0.35, 3.5));
        }}
      >
        <div className={styles.world} style={{ transform: worldTransform }}>
          {layout ? (
            <>
              {edgeSvgBounds ? (
                <svg
                  className={styles.edgeLayer}
                  width={edgeSvgBounds.width}
                  height={edgeSvgBounds.height}
                  viewBox={`${edgeSvgBounds.left} ${edgeSvgBounds.top} ${edgeSvgBounds.width} ${edgeSvgBounds.height}`}
                  aria-hidden="true"
                  style={{
                    left: edgeSvgBounds.left,
                    top: edgeSvgBounds.top,
                    width: edgeSvgBounds.width,
                    height: edgeSvgBounds.height
                  }}
                >
                  {connectorGeometry.lines.map((line) => (
                    <line
                      key={line.key}
                      className={[
                        styles.edge,
                        line.variant === "partner"
                          ? styles.edgePartner
                          : line.variant === "trunk"
                            ? styles.edgeTrunk
                            : line.variant === "rail"
                              ? styles.edgeRail
                              : styles.edgeDrop
                      ].join(" ")}
                      x1={line.x1}
                      y1={line.y1}
                      x2={line.x2}
                      y2={line.y2}
                    />
                  ))}

                  {connectorGeometry.badges.map((badge) => {
                    const badgeVariant = getPartnerBadgeVariant(badge.status);
                    return (
                      <g
                        key={badge.key}
                        transform={`translate(${badge.x} ${badge.y})`}
                        className={[
                          styles.partnerBadge,
                          badgeVariant === "married"
                            ? styles.partnerBadgeMarried
                            : badgeVariant === "divorced"
                              ? styles.partnerBadgeDivorced
                              : styles.partnerBadgeNeutral
                        ].join(" ")}
                      >
                        <circle className={styles.partnerBadgeDisc} r="13" />
                        <circle className={styles.partnerBadgeRing} cx="-4.5" cy="0" r="4.5" />
                        <circle className={styles.partnerBadgeRing} cx="4.5" cy="0" r="4.5" />
                        {badgeVariant === "divorced" ? (
                          <line className={styles.partnerBadgeSlash} x1="-8" y1="8" x2="8" y2="-8" />
                        ) : null}
                      </g>
                    );
                  })}
                </svg>
              ) : null}

              {visibleNodes.map((node) => {
                const person = peopleById.get(node.id);
                if (!person) {
                  return null;
                }
                const personName = (person.displayName ?? person.name).toLowerCase();
                const dimmedBySearch = query.length > 0 && !personName.includes(query);
                const dimmedByFilter = dimmedPersonIds?.has(person.id) ?? false;
                return (
                  <RoyalNodeCard
                    key={person.id}
                    person={person}
                    node={node}
                    portraitUrl={
                      getPortraitUrlFromDatasetMedia(person, mediaById) ?? remotePortraitsByPersonId[person.id] ?? null
                    }
                    selected={selectedPersonId === person.id}
                    highlighted={selectedPersonId !== person.id && highlighted.has(person.id)}
                    dimmed={dimmedBySearch || dimmedByFilter}
                    onSelect={onSelectPerson}
                  />
                );
              })}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function deriveGraph(dataset: FamilyDataset | null): AdjacencyGraph | null {
  if (!dataset) {
    return null;
  }
  return buildAdjacency(dataset);
}
