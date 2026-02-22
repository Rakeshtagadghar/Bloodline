import { describe, expect, it } from "vitest";

import { cullNodes } from "./cull";
import type { LayoutResult } from "../layout/layoutTree";

describe("cullNodes", () => {
  it("returns subset within viewport", () => {
    const layout: LayoutResult = {
      nodes: [
        { id: "a", x: 50, y: 50, width: 40, height: 40, depth: 0 },
        { id: "b", x: 500, y: 500, width: 40, height: 40, depth: 1 }
      ],
      edges: []
    };

    const visible = cullNodes(layout, { x: 0, y: 0, scale: 1, width: 200, height: 200 });
    expect(visible.map((n) => n.id)).toEqual(["a"]);
  });
});
