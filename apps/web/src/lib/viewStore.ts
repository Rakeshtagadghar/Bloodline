import type { LayoutResult } from "@bloodline/renderer";

export interface TreeViewportState {
  x: number;
  y: number;
  scale: number;
  width: number;
  height: number;
}

export interface TreeViewState {
  selectedPersonId: string | null;
  searchQuery: string;
  viewport: TreeViewportState;
  layout: LayoutResult | null;
}

export function createInitialViewport(width = 960, height = 640): TreeViewportState {
  return {
    x: -width * 0.15,
    y: -120,
    scale: 1,
    width,
    height
  };
}
