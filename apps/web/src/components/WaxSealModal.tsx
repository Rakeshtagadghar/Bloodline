"use client";

import styles from "./TreeWorkbench.module.css";

export interface WaxSealModalProps {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}

export function WaxSealModal({ open, title, children, onClose }: WaxSealModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div role="dialog" aria-modal="true" aria-label={title}>
      <div className={styles.miniCard}>
        <p className={styles.sectionLabel}>{title}</p>
        <div>{children}</div>
        <button type="button" className={styles.toolbarButton} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
