import { describe, expect, it } from "vitest";

import { hitTestNode } from "./hitTest";
import type { LayoutResult } from "../layout/layoutTree";

describe("hitTestNode", () => {
  const layout: LayoutResult = {
    nodes: [{ id: "p_root", x: 100, y: 100, width: 120, height: 60, depth: 0 }],
    edges: []
  };
  const viewport = { x: 0, y: 0, scale: 1, width: 800, height: 600 };

  it("returns correct node at point", () => {
    expect(hitTestNode(100, 100, layout, viewport)).toBe("p_root");
  });

  it("returns null when empty", () => {
    expect(hitTestNode(10, 10, layout, viewport)).toBeNull();
  });
});
