import type { LayoutResult } from "../layout/layoutTree";
import type { Viewport } from "./transform";
import { screenToWorld } from "./transform";

export function hitTestNode(
  screenX: number,
  screenY: number,
  layout: LayoutResult,
  viewport: Viewport
): string | null {
  const world = screenToWorld({ x: screenX, y: screenY }, viewport);

  for (let i = layout.nodes.length - 1; i >= 0; i -= 1) {
    const node = layout.nodes[i];
    const halfW = node.width / 2;
    const halfH = node.height / 2;
    if (
      world.x >= node.x - halfW &&
      world.x <= node.x + halfW &&
      world.y >= node.y - halfH &&
      world.y <= node.y + halfH
    ) {
      return node.id;
    }
  }

  return null;
}
