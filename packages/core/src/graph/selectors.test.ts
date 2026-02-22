import { describe, expect, it } from "vitest";

import { buildAdjacency } from "./buildAdjacency";
import { computeAncestors, computeDescendants } from "./selectors";
import { makeBaseDataset } from "../testUtils";

describe("graph selectors", () => {
  it("computeAncestors returns all ancestors and handles multiple parents", () => {
    const graph = buildAdjacency(makeBaseDataset());
    expect(computeAncestors("p_grand", graph)).toEqual(new Set(["p_child1", "p_root", "p_partner"]));
  });

  it("computeDescendants returns all descendants breadth-first with no duplicates", () => {
    const graph = buildAdjacency(makeBaseDataset());
    expect(computeDescendants("p_root", graph)).toEqual(new Set(["p_child1", "p_child2", "p_grand"]));
  });
});
