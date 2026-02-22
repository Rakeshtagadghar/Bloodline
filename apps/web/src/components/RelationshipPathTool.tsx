"use client";

import styles from "./TreeWorkbench.module.css";

export function RelationshipPathTool() {
  return (
    <section className={styles.miniCard} aria-label="Relationship Path Tool">
      <p className={styles.sectionLabel}>How Are They Related?</p>
      <p className={styles.emptyState}>
        Path finder UI is planned for M2. Core graph/path utilities are already implemented in
        `packages/core`.
      </p>
    </section>
  );
}
