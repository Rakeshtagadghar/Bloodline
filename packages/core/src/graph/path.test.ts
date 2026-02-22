import { describe, expect, it } from "vitest";

import { buildAdjacency } from "./buildAdjacency";
import { shortestRelationshipPath } from "./path";
import { makeBaseDataset } from "../testUtils";

describe("shortestRelationshipPath", () => {
  it("returns shortest path when exists", () => {
    const graph = buildAdjacency(makeBaseDataset());
    expect(shortestRelationshipPath("p_partner", "p_grand", graph)).toEqual([
      "p_partner",
      "p_child1",
      "p_grand"
    ]);
  });

  it("returns null if none exists", () => {
    const dataset = makeBaseDataset();
    dataset.people.push({ id: "p_isolated", name: "Isolated" });
    const graph = buildAdjacency(dataset);

    expect(shortestRelationshipPath("p_root", "p_isolated", graph)).toBeNull();
  });

  it("respects allowed edge types", () => {
    const graph = buildAdjacency(makeBaseDataset());
    expect(
      shortestRelationshipPath("p_root", "p_grand", graph, new Set(["partner"]))
    ).toBeNull();
  });
});
