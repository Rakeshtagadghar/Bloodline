"use client";

import type { AdjacencyGraph, FamilyDataset } from "@bloodline/core";

import styles from "./TreeWorkbench.module.css";

export interface ScrollPanelProps {
  dataset: FamilyDataset | null;
  graph: AdjacencyGraph | null;
  selectedPersonId: string | null;
  onJumpToPerson: (personId: string) => void;
}

export function ScrollPanel({
  dataset,
  graph,
  selectedPersonId,
  onJumpToPerson
}: ScrollPanelProps) {
  const selectedPerson = dataset?.people.find((person) => person.id === selectedPersonId) ?? null;
  const personNameById = new Map(dataset?.people.map((person) => [person.id, person.name]) ?? []);

  const renderNamedList = (ids: Iterable<string>) => {
    const sortedIds = [...ids].sort((a, b) => {
      const aName = personNameById.get(a) ?? a;
      const bName = personNameById.get(b) ?? b;
      return aName.localeCompare(bName);
    });

    if (sortedIds.length === 0) {
      return <li>None</li>;
    }

    return sortedIds.map((id) => (
      <li key={id}>
        <button type="button" className={styles.linkButton} onClick={() => onJumpToPerson(id)}>
          {personNameById.get(id) ?? id}
        </button>
      </li>
    ));
  };

  return (
    <aside className={`${styles.card} ${styles.detailsCard}`} aria-label="Royal Details Panel">
      <h2 className={styles.panelTitle}>Royal Details</h2>

      {!selectedPerson || !graph ? (
        <p className={styles.emptyState}>Select a person in the tree to inspect details.</p>
      ) : (
        <>
          <div>
            <p className={styles.detailTitle} data-testid="details-person-name">
              {selectedPerson.displayName ?? selectedPerson.name}
            </p>
            <p className={styles.detailSubtitle}>
              {selectedPerson.display?.styleTitle ?? "House Member"}
            </p>
            <ul className={styles.factList}>
              <li>ID: {selectedPerson.id}</li>
              <li>Born: {selectedPerson.born ?? "Unknown"}</li>
              <li>House: {selectedPerson.house ?? "Unspecified"}</li>
            </ul>
          </div>

          <div className={styles.grid3}>
            <section className={styles.miniCard}>
              <p className={styles.sectionLabel}>Parents</p>
              <ul className={styles.linkList}>
                {renderNamedList(graph.parentsByChild.get(selectedPerson.id) ?? [])}
              </ul>
            </section>

            <section className={styles.miniCard}>
              <p className={styles.sectionLabel}>Children</p>
              <ul className={styles.linkList}>
                {renderNamedList(graph.childrenByParent.get(selectedPerson.id) ?? [])}
              </ul>
            </section>

            <section className={styles.miniCard}>
              <p className={styles.sectionLabel}>Partners</p>
              <ul className={styles.linkList}>
                {renderNamedList(graph.partnersByPerson.get(selectedPerson.id) ?? [])}
              </ul>
            </section>
          </div>
        </>
      )}
    </aside>
  );
}
