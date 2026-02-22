"use client";

import { useEffect, useState, type CSSProperties } from "react";

import type { Person } from "@bloodline/core";
import type { LayoutNode } from "@bloodline/renderer";

import styles from "./TreeWorkbench.module.css";

export interface RoyalNodeCardProps {
  person: Person;
  node: LayoutNode;
  portraitUrl?: string | null;
  selected: boolean;
  highlighted: boolean;
  dimmed: boolean;
  onSelect: (personId: string) => void;
}

export function RoyalNodeCard({
  person,
  node,
  portraitUrl,
  selected,
  highlighted,
  dimmed,
  onSelect
}: RoyalNodeCardProps) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [portraitUrl]);

  const className = [
    styles.nodeButton,
    selected ? styles.nodeSelected : "",
    highlighted ? styles.nodeHighlight : "",
    dimmed ? styles.nodeDimmed : ""
  ]
    .filter(Boolean)
    .join(" ");

  const displayName = person.displayName ?? person.name;
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  const statusLabel =
    person.privacy?.living === false || person.died ? "Deceased" : person.privacy?.living === true ? "Living" : "Unknown";
  const showPortraitImage = Boolean(portraitUrl) && !imageFailed;
  const titleText = person.display?.styleTitle ?? "House Member";
  const houseText = person.house ?? "House Branch";
  const statusTone =
    statusLabel === "Living" ? "living" : statusLabel === "Deceased" ? "deceased" : "unknown";

  const style = {
    left: node.x,
    top: node.y,
    "--node-depth": String(node.depth)
  } as CSSProperties;

  return (
    <button
      type="button"
      className={className}
      style={style}
      onClick={() => onSelect(person.id)}
      aria-label={`Select ${person.name}`}
      aria-pressed={selected}
      data-testid={`node-${person.id}`}
    >
      <span className={styles.nodePortraitWrap} aria-hidden="true">
        <span className={styles.nodePortraitHalo} />
        <span className={styles.nodePortraitPediment} />
        <span className={styles.nodePortraitFrame}>
          <span className={styles.nodePortraitInner}>
            {showPortraitImage ? (
              <img
                className={styles.nodePortraitImage}
                src={portraitUrl ?? undefined}
                alt=""
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={() => setImageFailed(true)}
              />
            ) : (
              <span className={styles.nodeMonogram}>{initials || "?"}</span>
            )}
          </span>
        </span>
      </span>
      <span className={styles.nodePlate}>
        <span className={styles.nodePlateFiligree} aria-hidden="true" />
        <span className={styles.nodePlateInner}>
          <span className={styles.nodeName}>{displayName}</span>
          <span className={styles.nodeTitle}>{titleText}</span>
          <span className={styles.nodeRule} aria-hidden="true" />
          <span className={styles.nodeMetaRow}>
            <span className={styles.nodeHouse}>{houseText}</span>
            <span className={styles.nodeStatusPill} data-tone={statusTone}>
              {statusLabel}
            </span>
          </span>
        </span>
        <span className={styles.nodeSubline} aria-hidden="true">
          Royal Registry
        </span>
      </span>
    </button>
  );
}
