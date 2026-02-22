"use client";

import type { LivingFilter } from "../lib/personFilters";
import styles from "./TreeWorkbench.module.css";

export interface RoyalToolbarProps {
  title: string;
  statusText: string;
  searchQuery: string;
  selectedTag: string;
  selectedBranch: string;
  selectedLiving: LivingFilter;
  tagOptions: string[];
  branchOptions: string[];
  onSearchChange: (value: string) => void;
  onTagChange: (value: string) => void;
  onBranchChange: (value: string) => void;
  onLivingChange: (value: LivingFilter) => void;
  onClearFilters: () => void;
  onReloadValid: () => void;
  onLoadBritishExample: () => void;
  onLoadInvalid: () => void;
}

export function RoyalToolbar({
  title,
  statusText,
  searchQuery,
  selectedTag,
  selectedBranch,
  selectedLiving,
  tagOptions,
  branchOptions,
  onSearchChange,
  onTagChange,
  onBranchChange,
  onLivingChange,
  onClearFilters,
  onReloadValid,
  onLoadBritishExample,
  onLoadInvalid
}: RoyalToolbarProps) {
  return (
    <header className={styles.toolbar} aria-label="Royal Toolbar">
      <div className={styles.brand}>
        <div className={styles.crest} aria-hidden="true">
          R
        </div>
        <div>
          <p className={styles.eyebrow}>Royal Archive</p>
          <h1 className={styles.brandTitle}>{title}</h1>
          <p className={styles.eyebrow}>{statusText}</p>
        </div>
      </div>

      <div className={styles.toolbarActions}>
        <button type="button" className={styles.toolbarButton} onClick={onReloadValid}>
          Load Fixture
        </button>
        <button type="button" className={styles.toolbarButton} onClick={onLoadBritishExample}>
          Load British Example
        </button>
        <button type="button" className={styles.toolbarButton} onClick={onLoadInvalid}>
          Load Invalid
        </button>
        <label>
          <span className={styles.srOnly}>Search people</span>
          <input
            className={styles.searchInput}
            type="search"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(event) => onSearchChange(event.currentTarget.value)}
          />
        </label>
        <label>
          <span className={styles.srOnly}>Filter by tag</span>
          <select
            className={styles.filterSelect}
            aria-label="Filter by tag"
            value={selectedTag}
            onChange={(event) => onTagChange(event.currentTarget.value)}
          >
            <option value="">All tags</option>
            {tagOptions.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={styles.srOnly}>Filter by branch</span>
          <select
            className={styles.filterSelect}
            aria-label="Filter by branch"
            value={selectedBranch}
            onChange={(event) => onBranchChange(event.currentTarget.value)}
          >
            <option value="">All branches</option>
            {branchOptions.map((branch) => (
              <option key={branch} value={branch}>
                {branch}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={styles.srOnly}>Filter by living status</span>
          <select
            className={styles.filterSelect}
            aria-label="Filter by living status"
            value={selectedLiving}
            onChange={(event) => onLivingChange(event.currentTarget.value as LivingFilter)}
          >
            <option value="all">All status</option>
            <option value="living">Living</option>
            <option value="deceased">Deceased</option>
          </select>
        </label>
        <button type="button" className={styles.toolbarButton} onClick={onClearFilters}>
          Clear Filters
        </button>
      </div>
    </header>
  );
}
