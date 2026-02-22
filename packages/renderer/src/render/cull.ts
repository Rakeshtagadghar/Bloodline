import type { LayoutNode, LayoutResult } from "../layout/layoutTree";
import type { Viewport } from "../viewport/transform";

export function cullNodes(layout: LayoutResult, viewport: Viewport, margin = 0): LayoutNode[] {
  const left = viewport.x - margin;
  const top = viewport.y - margin;
  const right = viewport.x + viewport.width / viewport.scale + margin;
  const bottom = viewport.y + viewport.height / viewport.scale + margin;

  return layout.nodes.filter((node) => {
    const halfW = node.width / 2;
    const halfH = node.height / 2;
    return (
      node.x + halfW >= left &&
      node.x - halfW <= right &&
      node.y + halfH >= top &&
      node.y - halfH <= bottom
    );
  });
}
