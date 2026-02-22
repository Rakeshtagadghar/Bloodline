"use client";

import { buildAdjacency } from "@bloodline/core";
import Link from "next/link";
import { useState } from "react";

import { makeWebFixtureDataset } from "../test/testFixtures";
import { ScrollPanel } from "./ScrollPanel";
import { WaxSealModal } from "./WaxSealModal";
import styles from "./ProductStorybookWorkbench.module.css";

type StorybookScreen =
  | "ImportOnboarding"
  | "TreeViewer"
  | "PersonProfile"
  | "StoryGenerator"
  | "Export"
  | "PrivateShare";

interface ScreenDef {
  id: StorybookScreen;
  title: string;
  subtitle: string;
  state: "implemented" | "prototype";
}

const SCREEN_DEFS: ScreenDef[] = [
  { id: "ImportOnboarding", title: "Import", subtitle: "Project setup + CSV intake", state: "prototype" },
  { id: "TreeViewer", title: "Tree Viewer", subtitle: "Reuse existing royal tree", state: "implemented" },
  { id: "PersonProfile", title: "Person Profile", subtitle: "Profile + relationships", state: "implemented" },
  { id: "StoryGenerator", title: "Story Generator", subtitle: "AI drafts + facts tracing", state: "prototype" },
  { id: "Export", title: "Export", subtitle: "PDF + poster pipeline", state: "prototype" },
  { id: "PrivateShare", title: "Private Share", subtitle: "Unlisted link controls", state: "prototype" }
];

const profileDataset = makeWebFixtureDataset();
const profileGraph = buildAdjacency(profileDataset);
const profileSelectedPersonId = "p_child1";

export function ProductStorybookWorkbench() {
  const [activeScreen, setActiveScreen] = useState<StorybookScreen>("ImportOnboarding");
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const activeDef = SCREEN_DEFS.find((screen) => screen.id === activeScreen) ?? SCREEN_DEFS[0];

  return (
    <div className={styles.shell}>
      <section className={styles.hero} aria-label="Bloodline Storybook overview">
        <div>
          <p className={styles.eyebrow}>Requirements Prototype</p>
          <h1 className={styles.heroTitle}>Bloodline Storybook MVP Screens</h1>
          <p className={styles.heroLead}>
            Product prototype derived from `requirements/storybook.jsoon`. The `TreeViewer` screen
            reuses the existing royal tree implementation already built in this project.
          </p>

          <div className={styles.kpiStrip} aria-label="MVP outcomes">
            <div className={styles.kpi}>
              <p className={styles.kpiValue}>6</p>
              <p className={styles.kpiLabel}>MVP screens represented</p>
            </div>
            <div className={styles.kpi}>
              <p className={styles.kpiValue}>Royal UI</p>
              <p className={styles.kpiLabel}>Shared visual language prototype</p>
            </div>
            <div className={styles.kpi}>
              <p className={styles.kpiValue}>/tree</p>
              <p className={styles.kpiLabel}>Existing interactive viewer reused</p>
            </div>
          </div>
        </div>

        <div className={styles.heroStats}>
          <div className={styles.statCard}>
            <p className={styles.statLabel}>Primary Outcome</p>
            <p className={styles.statValue}>Royal-grade interactive tree</p>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statLabel}>Primary Outcome</p>
            <p className={styles.statValue}>AI biographies + chapters (fact-based)</p>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statLabel}>Primary Outcome</p>
            <p className={styles.statValue}>Premium PDF + poster export</p>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statLabel}>Primary Outcome</p>
            <p className={styles.statValue}>Private unlisted sharing controls</p>
          </div>
        </div>
      </section>

      <nav className={styles.tabs} aria-label="MVP screens">
        {SCREEN_DEFS.map((screen) => (
          <button
            key={screen.id}
            type="button"
            className={`${styles.tabButton} ${activeScreen === screen.id ? styles.tabButtonActive : ""}`}
            onClick={() => setActiveScreen(screen.id)}
            aria-pressed={activeScreen === screen.id}
          >
            <span className={styles.tabTitle}>{screen.title}</span>
            <span className={styles.tabSubtitle}>{screen.subtitle}</span>
          </button>
        ))}
      </nav>

      <section className={styles.panel} aria-label={`${activeDef.title} screen`}>
        <div className={styles.panelInner}>
          <div className={styles.screenHeader}>
            <div>
              <h2 className={styles.screenTitle}>{activeDef.id}</h2>
              <p className={styles.screenHint}>{activeDef.subtitle}</p>
            </div>
            <span className={styles.badge}>{activeDef.state}</span>
          </div>
          {renderScreen(activeScreen, {
            onOpenShareModal: () => setShareModalOpen(true)
          })}
        </div>
      </section>

      <WaxSealModal
        open={shareModalOpen}
        title="Private Share Link Issued"
        onClose={() => setShareModalOpen(false)}
      >
        <p className={styles.screenHint}>
          Unlisted link created with password and 30-day expiry. In MVP read-only mode this is a UI
          prototype only.
        </p>
        <div className={styles.sharePreview}>
          https://bloodline.app/share/royal-archive-7f4d?expires=30d
        </div>
      </WaxSealModal>
    </div>
  );
}

function renderScreen(
  screen: StorybookScreen,
  actions: { onOpenShareModal: () => void }
): React.ReactNode {
  switch (screen) {
    case "ImportOnboarding":
      return <ImportOnboardingScreen />;
    case "TreeViewer":
      return <TreeViewerScreen />;
    case "PersonProfile":
      return <PersonProfileScreen />;
    case "StoryGenerator":
      return <StoryGeneratorScreen />;
    case "Export":
      return <ExportScreen />;
    case "PrivateShare":
      return <PrivateShareScreen onOpenShareModal={actions.onOpenShareModal} />;
    default:
      return null;
  }
}

function ImportOnboardingScreen() {
  return (
    <div className={styles.grid2}>
      <section className={styles.card} aria-label="Project setup">
        <h3 className={styles.cardTitle}>Create Storybook Project</h3>
        <div className={styles.fieldGrid}>
          <label className={styles.label}>
            Project Name
            <input className={styles.input} defaultValue="House Windsor Chronicle" />
          </label>
          <label className={styles.label}>
            House Name
            <input className={styles.input} defaultValue="House Windsor" />
          </label>
          <label className={styles.label}>
            Motto
            <input className={styles.input} defaultValue="Duty, Legacy, Memory" />
          </label>
          <label className={styles.label}>
            Privacy Default
            <select className={styles.select} defaultValue="unlisted">
              <option value="unlisted">Unlisted link</option>
              <option value="password">Unlisted + password</option>
              <option value="private">Private (local only)</option>
            </select>
          </label>
        </div>
        <div className={styles.fieldGridSingle}>
          <label className={styles.label}>
            Crest / House Note
            <textarea
              className={styles.textarea}
              defaultValue="Upload crest later. Royal Modern theme preselected with brushed gold and obsidian glass tokens."
            />
          </label>
        </div>
        <div className={styles.row}>
          <button type="button" className={`${styles.actionButton} ${styles.actionButtonPrimary}`}>
            Create Project
          </button>
          <button type="button" className={styles.actionButton}>
            Continue to Import
          </button>
        </div>
      </section>

      <section className={styles.card} aria-label="CSV import">
        <h3 className={styles.cardTitle}>CSV Import & Validation</h3>
        <div className={styles.row}>
          <button type="button" className={styles.actionButton}>
            Download CSV Template
          </button>
          <button type="button" className={`${styles.actionButton} ${styles.actionButtonPrimary}`}>
            Upload CSV
          </button>
        </div>
        <ul className={styles.list}>
          <li>Supports manual + CSV import (MVP in-scope)</li>
          <li>Cycle detection blocks import</li>
          <li>Missing parent references listed with row numbers</li>
          <li>Option to continue with orphans unlinked</li>
        </ul>
        <ul className={styles.issueList} aria-label="Validation preview">
          <li className={styles.issueItem}>
            <div className={styles.issueRow}>
              <span className={styles.issueTag}>Row 18</span>
              <span>Missing parent reference `p_queen_mother`</span>
            </div>
          </li>
          <li className={styles.issueItem}>
            <div className={styles.issueRow}>
              <span className={styles.issueTag}>Row 31</span>
              <span>Cycle detected involving `p_charles`, `p_william`</span>
            </div>
          </li>
        </ul>
      </section>
    </div>
  );
}

function TreeViewerScreen() {
  return (
    <div>
      <div className={styles.grid2}>
        <section className={styles.card}>
          <h3 className={styles.cardTitle}>Tree Viewer (Existing Implementation)</h3>
          <p className={styles.screenHint}>
            This screen intentionally reuses the existing `/tree` route in the project: royal UI,
            pan/zoom, search, filters, details panel, minimap, screenshots, and e2e coverage are
            already implemented.
          </p>
          <div className={styles.row}>
            <Link href="/tree" className={styles.linkButton}>
              Open Interactive Tree Viewer
            </Link>
            <Link href="/tree" className={styles.actionButton}>
              Open in new page
            </Link>
          </div>
          <ul className={styles.list}>
            <li>Smooth pan/zoom canvas with minimap</li>
            <li>Search + filters (branch, tags, living/deceased)</li>
            <li>Relationship icons and reduced connector noise routing</li>
            <li>Royal poster visual styling and portrait fallbacks</li>
          </ul>
        </section>

        <section className={styles.card}>
          <h3 className={styles.cardTitle}>Acceptance Test Mapping</h3>
          <ul className={styles.list}>
            <li>AT2.1.1: tree loads and remains interactive within budget (tracked in e2e/perf notes)</li>
            <li>AT2.1.2: zoom/pan bounded by viewport extents</li>
            <li>AT2.2.1: node selection highlights + details panel</li>
            <li>AT2.3.1/AT2.3.2: search and living filter behavior covered</li>
          </ul>
        </section>
      </div>

      <div className={styles.treeViewerFrame}>
        <iframe
          title="Royal Tree Viewer Preview"
          src="/tree"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  );
}

function PersonProfileScreen() {
  return (
    <div className={styles.profileLayout}>
      <div className={styles.profileStage}>
        <section className={`${styles.card} ${styles.spotlightCard}`}>
          <div className={styles.portrait} aria-hidden="true">
            A
          </div>
          <div>
            <h3 className={styles.spotlightName}>Aarav</h3>
            <p className={styles.spotlightMeta}>Heir · Main Branch · Living</p>
            <div className={styles.pillRow}>
              <span className={styles.pill}>Titles: Heir</span>
              <span className={styles.pill}>Tags: heir, main</span>
              <span className={styles.pill}>Bio Drafts: 2</span>
            </div>
          </div>
        </section>

        <section className={styles.card}>
          <h3 className={styles.cardTitle}>Events & Media (MVP profile context)</h3>
          <div className={styles.timeline}>
            <div className={styles.timelineItem}>
              <div className={styles.timelineYear}>1993</div>
              <p className={styles.timelineText}>Birth recorded in family registry (place unknown).</p>
            </div>
            <div className={styles.timelineItem}>
              <div className={styles.timelineYear}>2014</div>
              <p className={styles.timelineText}>Branch stewardship ceremony; tagged as `heir`.</p>
            </div>
            <div className={styles.timelineItem}>
              <div className={styles.timelineYear}>2022</div>
              <p className={styles.timelineText}>
                Portrait and achievements submitted by relatives via shareable form prototype.
              </p>
            </div>
          </div>
        </section>
      </div>

      <ScrollPanel
        dataset={profileDataset}
        graph={profileGraph}
        selectedPersonId={profileSelectedPersonId}
        onJumpToPerson={() => {
          return;
        }}
      />
    </div>
  );
}

function StoryGeneratorScreen() {
  return (
    <div className={styles.generatorLayout}>
      <section className={styles.card}>
        <h3 className={styles.cardTitle}>Generate Biography / Chapter</h3>
        <label className={styles.label}>
          Person / Scope
          <select className={styles.select} defaultValue="aarav">
            <option value="aarav">Aarav (bio)</option>
            <option value="branch-main">Main Branch (chapter)</option>
            <option value="house-overview">House Overview (chapter)</option>
          </select>
        </label>
        <div className={styles.fieldGrid}>
          <label className={styles.label}>
            Tone
            <select className={styles.select} defaultValue="Formal">
              <option>Formal</option>
              <option>Warm</option>
              <option>Celebratory</option>
              <option>Minimal</option>
            </select>
          </label>
          <label className={styles.label}>
            Length
            <select className={styles.select} defaultValue="Medium">
              <option>Short</option>
              <option>Medium</option>
              <option>Long</option>
            </select>
          </label>
        </div>
        <label className={styles.label}>
          Exclude topics
          <input className={styles.input} defaultValue="medical history, private notes" />
        </label>
        <label className={styles.label}>
          Instruction (optional)
          <textarea
            className={styles.textarea}
            defaultValue="Use only known facts. If a date or place is missing, explicitly mark as unknown and suggest additions."
          />
        </label>
        <div className={styles.row}>
          <button type="button" className={`${styles.actionButton} ${styles.actionButtonPrimary}`}>
            Generate Draft
          </button>
          <button type="button" className={styles.actionButton}>
            Regenerate Paragraph 2
          </button>
        </div>
      </section>

      <section className={styles.draftPanel}>
        <div>
          <p className={styles.eyebrow}>Draft Output (Prototype)</p>
          <h3 className={styles.draftHeading}>Biography: Aarav</h3>
        </div>
        <p className={styles.draftBody}>
          Aarav is recorded in the family registry as a living member of the Main Branch and is
          identified in the tree as the heir. His exact place of birth is unknown in the current
          dataset. The registry links Aarav to Rakesh I and Mira as parents, and to Nila as a
          descendant through the next generation. Additional verified milestones may be added to
          strengthen this biography.
        </p>
        <div className={styles.factsGrid}>
          <div className={styles.factBox}>
            <h4>Facts Used</h4>
            <ul className={styles.list}>
              <li>Person:p_child1.display.styleTitle</li>
              <li>Person:p_child1.house</li>
              <li>Relationship parent links (p_root/p_partner → p_child1)</li>
              <li>Relationship parent link (p_child1 → p_grand)</li>
            </ul>
          </div>
          <div className={styles.factBox}>
            <h4>Missing Info Checklist</h4>
            <ul className={styles.list}>
              <li>Birth place</li>
              <li>Key achievements / milestones</li>
              <li>Portrait credits</li>
              <li>Public biography notes</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

function ExportScreen() {
  return (
    <div>
      <div className={styles.exportGrid}>
        <section className={styles.exportCard}>
          <h3 className={styles.cardTitle}>PDF Storybook</h3>
          <span className={styles.exportStatus}>
            <span className={styles.dot} aria-hidden="true" />
            Ready to queue
          </span>
          <p className={styles.screenHint}>
            A4/Letter output with cover, TOC, chapters, bios, timeline, gallery, index.
          </p>
          <div className={styles.row}>
            <button type="button" className={`${styles.actionButton} ${styles.actionButtonPrimary}`}>
              Export A4
            </button>
            <button type="button" className={styles.actionButton}>
              Export Letter
            </button>
          </div>
        </section>

        <section className={styles.exportCard}>
          <h3 className={styles.cardTitle}>Poster Export</h3>
          <span className={styles.exportStatus}>
            <span className={styles.dot} aria-hidden="true" />
            Vector-first
          </span>
          <p className={styles.screenHint}>
            A2 / A1 poster with royal title, legend, optional crest and QR to private share link.
          </p>
          <div className={styles.row}>
            <button type="button" className={`${styles.actionButton} ${styles.actionButtonPrimary}`}>
              Export A2
            </button>
            <button type="button" className={styles.actionButton}>
              Export A1
            </button>
          </div>
        </section>

        <section className={styles.exportCard}>
          <h3 className={styles.cardTitle}>Privacy Rules Applied</h3>
          <ul className={styles.list}>
            <li>Hide exact birthdates for living people in shared views</li>
            <li>Anonymize living toggle available for exports</li>
            <li>Hide contact fields in PDF</li>
            <li>Hide children photos in shared views (default)</li>
          </ul>
        </section>
      </div>

      <div className={styles.grid2} style={{ marginTop: 14 }}>
        <section className={styles.card}>
          <h3 className={styles.cardTitle}>Export Queue (Prototype)</h3>
          <ul className={styles.list}>
            <li>`PDF_BOOK` · queued · created 10:04</li>
            <li>`POSTER_A2` · rendering · created 10:06</li>
            <li>`POSTER_A1` · done · fileUrl pending backend integration</li>
          </ul>
        </section>

        <section className={styles.card}>
          <h3 className={styles.cardTitle}>Quality Checklist</h3>
          <ul className={styles.list}>
            <li>No clipped text</li>
            <li>Page numbers and TOC enabled</li>
            <li>Poster minimum readable font size respected</li>
            <li>PrivacyConfig applied to all exported artifacts</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

function PrivateShareScreen(props: { onOpenShareModal: () => void }) {
  return (
    <div className={styles.privacyGrid}>
      <section className={styles.card}>
        <h3 className={styles.cardTitle}>Private Share Link</h3>
        <div className={styles.fieldGrid}>
          <label className={styles.label}>
            Link Visibility
            <select className={styles.select} defaultValue="unlisted">
              <option value="unlisted">Unlisted</option>
              <option value="unlisted-password">Unlisted + password</option>
            </select>
          </label>
          <label className={styles.label}>
            Expiry
            <select className={styles.select} defaultValue="30d">
              <option value="none">No expiry</option>
              <option value="7d">7 days</option>
              <option value="30d">30 days</option>
              <option value="90d">90 days</option>
            </select>
          </label>
          <label className={styles.label}>
            Password
            <input className={styles.input} defaultValue="royal-guest-2026" />
          </label>
          <label className={styles.label}>
            Access Mode
            <select className={styles.select} defaultValue="view">
              <option value="view">View only</option>
              <option value="contribute">Contribute form only</option>
            </select>
          </label>
        </div>

        <div className={styles.row} style={{ marginTop: 12 }}>
          <button
            type="button"
            className={`${styles.actionButton} ${styles.actionButtonPrimary}`}
            onClick={props.onOpenShareModal}
          >
            Generate Share Link
          </button>
          <button type="button" className={styles.actionButton}>
            Copy Viewer Link
          </button>
        </div>
      </section>

      <section className={styles.card}>
        <h3 className={styles.cardTitle}>Privacy Defaults (Requirements)</h3>
        <div className={styles.toggleList}>
          <div className={styles.toggleItem}>
            <p className={styles.toggleText}>Hide exact birthdates for living in shared views</p>
            <div className={styles.switch} aria-hidden="true" />
          </div>
          <div className={styles.toggleItem}>
            <p className={styles.toggleText}>Hide contact fields in PDF exports</p>
            <div className={styles.switch} aria-hidden="true" />
          </div>
          <div className={styles.toggleItem}>
            <p className={styles.toggleText}>Hide children photos in shared views</p>
            <div className={styles.switch} aria-hidden="true" />
          </div>
          <div className={styles.toggleItem}>
            <p className={styles.toggleText}>Robots noindex for shared pages</p>
            <div className={styles.switch} aria-hidden="true" />
          </div>
        </div>

        <div className={styles.sharePreview} style={{ marginTop: 12 }}>
          `noindex`, tokenized URL, optional password, optional expiry, no edit actions visible
          to viewer.
        </div>
      </section>
    </div>
  );
}
