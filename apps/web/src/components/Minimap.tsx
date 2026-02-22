"use client";

import type { LayoutResult, Viewport } from "@bloodline/renderer";

import styles from "./TreeWorkbench.module.css";

export interface MinimapProps {
  layout: LayoutResult | null;
  viewport: Viewport;
}

export function Minimap({ layout, viewport }: MinimapProps) {
  if (!layout || layout.nodes.length === 0) {
    return (
      <section className={styles.miniCard} aria-label="Minimap">
        <p className={styles.sectionLabel}>Minimap</p>
        <p className={styles.emptyState}>Tree not available</p>
      </section>
    );
  }

  const xs = layout.nodes.map((n) => n.x);
  const ys = layout.nodes.map((n) => n.y);
  const minX = Math.min(...xs) - 140;
  const maxX = Math.max(...xs) + 140;
  const minY = Math.min(...ys) - 100;
  const maxY = Math.max(...ys) + 100;
  const width = maxX - minX;
  const height = maxY - minY;

  const viewLeft = viewport.x;
  const viewTop = viewport.y;
  const viewWidth = viewport.width / viewport.scale;
  const viewHeight = viewport.height / viewport.scale;

  return (
    <section className={styles.miniCard} aria-label="Minimap">
      <p className={styles.sectionLabel}>Minimap</p>
      <svg
        className={styles.miniMap}
        viewBox={`${minX} ${minY} ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {layout.edges.map((edge) => {
          const from = layout.nodes.find((n) => n.id === edge.from);
          const to = layout.nodes.find((n) => n.id === edge.to);
          if (!from || !to) {
            return null;
          }
          return (
            <line
              key={`${edge.id ?? `${edge.from}-${edge.to}`}-mini`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={edge.type === "partner" ? "rgba(15,107,91,.65)" : "rgba(212,175,55,.35)"}
              strokeDasharray={edge.type === "partner" ? "4 3" : undefined}
              strokeWidth={2}
            />
          );
        })}

        {layout.nodes.map((node) => (
          <circle key={`${node.id}-mini`} cx={node.x} cy={node.y} r={8} fill="rgba(212,175,55,.8)" />
        ))}

        <rect
          x={viewLeft}
          y={viewTop}
          width={viewWidth}
          height={viewHeight}
          fill="rgba(212,175,55,.08)"
          stroke="rgba(212,175,55,.9)"
          strokeWidth={2}
        />
      </svg>
    </section>
  );
}
