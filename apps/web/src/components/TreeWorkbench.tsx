"use client";

import { buildAdjacency, type FamilyDataset, type ValidationIssue } from "@bloodline/core";
import { layoutTree, type LayoutResult } from "@bloodline/renderer";
import { startTransition, useDeferredValue, useEffect, useState } from "react";

import { loadDatasetFromUrl } from "../lib/datasetLoader";
import { applyBritishRoyalPosterLayout } from "../lib/britishRoyalPosterLayout";
import {
  collectFilterOptions,
  DEFAULT_PERSON_FILTERS,
  matchesPersonFilters,
  matchesPersonSearch,
  type PersonFilters
} from "../lib/personFilters";
import { createInitialViewport } from "../lib/viewStore";
import { Minimap } from "./Minimap";
import { RelationshipPathTool } from "./RelationshipPathTool";
import { RoyalToolbar } from "./RoyalToolbar";
import { RoyalTreeCanvas } from "./RoyalTreeCanvas";
import { ScrollPanel } from "./ScrollPanel";
import styles from "./TreeWorkbench.module.css";

type LoadState =
  | { kind: "idle" | "loading"; dataset: null; errors: ValidationIssue[]; source: string | null }
  | { kind: "valid"; dataset: FamilyDataset; errors: []; source: string | null }
  | { kind: "invalid"; dataset: null; errors: ValidationIssue[]; source: string | null };

function getStatusText(loadState: LoadState): string {
  if (loadState.kind === "loading") {
    return "Loading dataset...";
  }
  if (loadState.kind === "invalid") {
    return `Invalid dataset (${loadState.errors.length} issue${loadState.errors.length === 1 ? "" : "s"})`;
  }
  if (loadState.kind === "valid") {
    return `Loaded: ${loadState.dataset.meta.displayName}`;
  }
  return "No dataset loaded";
}

export function TreeWorkbench() {
  const [loadState, setLoadState] = useState<LoadState>({
    kind: "idle",
    dataset: null,
    errors: [],
    source: null
  });
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<PersonFilters>(DEFAULT_PERSON_FILTERS);
  const [centerOnSelectionKey, setCenterOnSelectionKey] = useState(0);
  const [viewport, setViewport] = useState(createInitialViewport());
  const [layout, setLayout] = useState<LayoutResult | null>(null);
  const [datasetGraph, setDatasetGraph] = useState<ReturnType<typeof buildAdjacency> | null>(null);

  const deferredSearchQuery = useDeferredValue(searchQuery);

  const dataset = loadState.kind === "valid" ? loadState.dataset : null;

  useEffect(() => {
    void (async () => {
      await handleLoad("/data/family.json");
    })();
  }, []);

  useEffect(() => {
    if (!dataset) {
      setLayout(null);
      setDatasetGraph(null);
      return;
    }

    const autoLayout = layoutTree(dataset.ui.defaultRootPersonId, dataset, {
      mode: dataset.ui.layout,
      seed: 1,
      nodeWidth: 190,
      nodeHeight: 182,
      xGap: 240,
      yGap: 260
    });
    const nextLayout = applyBritishRoyalPosterLayout(dataset, autoLayout);
    setLayout(nextLayout);
    setDatasetGraph(buildAdjacency(dataset));

    setSelectedPersonId((current) => {
      if (current && dataset.people.some((person) => person.id === current)) {
        return current;
      }
      return dataset.ui.defaultRootPersonId;
    });
    setCenterOnSelectionKey((value) => value + 1);
  }, [dataset]);

  async function handleLoad(path: string) {
    setLoadState({
      kind: "loading",
      dataset: null,
      errors: [],
      source: path
    });

    const result = await loadDatasetFromUrl(path);
    if (!result.ok) {
      setLayout(null);
      setDatasetGraph(null);
      setSelectedPersonId(null);
      setLoadState({
        kind: "invalid",
        dataset: null,
        errors: result.errors,
        source: path
      });
      return;
    }

    setLoadState({
      kind: "valid",
      dataset: result.dataset,
      errors: [],
      source: path
    });
  }

  const searchResults =
    dataset && deferredSearchQuery.trim()
      ? dataset.people
          .filter((person) => matchesPersonSearch(person, deferredSearchQuery))
          .filter((person) => matchesPersonFilters(person, filters))
          .sort((a, b) => (a.displayName ?? a.name).localeCompare(b.displayName ?? b.name))
          .slice(0, 8)
      : [];

  const filterOptions = dataset ? collectFilterOptions(dataset.people) : { tags: [], branches: [] };
  const dimmedPersonIds = new Set(
    (dataset?.people ?? [])
      .filter((person) => !(matchesPersonSearch(person, deferredSearchQuery) && matchesPersonFilters(person, filters)))
      .map((person) => person.id)
  );

  const datasetSummary =
    dataset &&
    JSON.stringify(
      {
        meta: dataset.meta,
        peopleCount: dataset.people.length,
        relationshipCount: dataset.relationships.length,
        defaultRoot: dataset.ui.defaultRootPersonId
      },
      null,
      2
    );

  return (
    <div className={styles.shell}>
      <RoyalToolbar
        title="HouseAtlas"
        statusText={getStatusText(loadState)}
        searchQuery={searchQuery}
        selectedTag={filters.tag}
        selectedBranch={filters.branch}
        selectedLiving={filters.living}
        tagOptions={filterOptions.tags}
        branchOptions={filterOptions.branches}
        onSearchChange={setSearchQuery}
        onTagChange={(value) => setFilters((current) => ({ ...current, tag: value }))}
        onBranchChange={(value) => setFilters((current) => ({ ...current, branch: value }))}
        onLivingChange={(value) => setFilters((current) => ({ ...current, living: value }))}
        onClearFilters={() => setFilters(DEFAULT_PERSON_FILTERS)}
        onReloadValid={() => void handleLoad("/data/family.json")}
        onLoadBritishExample={() => void handleLoad("/data/british-royal-family.json")}
        onLoadInvalid={() => void handleLoad("/data/family.invalid.json")}
      />

      <div className={styles.layout}>
        <section className={`${styles.card} ${styles.stageCard}`} aria-label="Tree workspace">
          <div className={styles.stageMeta}>
            <span data-testid="dataset-status">{getStatusText(loadState)}</span>
            <span data-testid="viewport-readout">
              x:{viewport.x.toFixed(0)} y:{viewport.y.toFixed(0)} z:{viewport.scale.toFixed(2)}
            </span>
          </div>

          {loadState.kind === "invalid" ? (
            <div
              className={styles.errorPanel}
              role="alert"
              aria-live="polite"
              data-testid="error-panel"
            >
              <p className={styles.errorTitle}>Dataset validation failed</p>
              <ul className={styles.errorList} data-testid="error-list">
                {loadState.errors.map((issue, index) => (
                  <li key={`${issue.path}-${index}`}>
                    {issue.path}: {issue.message}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <RoyalTreeCanvas
            dataset={dataset}
            layout={layout}
            graph={datasetGraph}
            selectedPersonId={selectedPersonId}
            searchQuery={deferredSearchQuery}
            dimmedPersonIds={dimmedPersonIds}
            viewport={viewport}
            centerOnSelectionKey={centerOnSelectionKey}
            onViewportChange={setViewport}
            onSelectPerson={(personId) => {
              startTransition(() => {
                setSelectedPersonId(personId);
                setCenterOnSelectionKey((value) => value + 1);
              });
            }}
          />

          <div className={styles.searchResultRow} aria-live="polite">
            {searchResults.map((person) => (
              <button
                key={person.id}
                type="button"
                className={styles.pillButton}
                data-testid={`search-result-${person.id}`}
                onClick={() => {
                  startTransition(() => {
                    setSelectedPersonId(person.id);
                    setCenterOnSelectionKey((value) => value + 1);
                  });
                }}
              >
                {person.displayName ?? person.name}
              </button>
            ))}
          </div>

          <details className={styles.inspector}>
            <summary className={styles.inspectorSummary}>Dataset inspector (debug)</summary>
            <pre className={styles.inspectorPre}>
              {loadState.kind === "valid"
                ? datasetSummary
                : JSON.stringify(
                    {
                      kind: loadState.kind,
                      errors: loadState.errors.slice(0, 10)
                    },
                    null,
                    2
                  )}
            </pre>
          </details>
        </section>

        <div className={styles.detailsCard}>
          <ScrollPanel
            dataset={dataset}
            graph={datasetGraph}
            selectedPersonId={selectedPersonId}
            onJumpToPerson={(personId) => {
              startTransition(() => {
                setSelectedPersonId(personId);
                setCenterOnSelectionKey((value) => value + 1);
              });
            }}
          />

          <Minimap layout={layout} viewport={viewport} />

          <RelationshipPathTool />

          <p className={styles.footerNote}>
            Free-tier ready: local JSON source, no backend required for read-only mode.
          </p>
        </div>
      </div>
    </div>
  );
}
