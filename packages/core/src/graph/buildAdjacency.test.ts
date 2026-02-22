import { describe, expect, it } from "vitest";

import { buildAdjacency } from "./buildAdjacency";
import { makeBaseDataset } from "../testUtils";

describe("buildAdjacency", () => {
  it("parent edges directional and partner edges undirected", () => {
    const graph = buildAdjacency(makeBaseDataset());

    expect(graph.childrenByParent.get("p_root")).toEqual(new Set(["p_child1", "p_child2"]));
    expect(graph.parentsByChild.get("p_child1")).toEqual(new Set(["p_root", "p_partner"]));
    expect(graph.partnersByPerson.get("p_root")).toEqual(new Set(["p_partner"]));
    expect(graph.partnersByPerson.get("p_partner")).toEqual(new Set(["p_root"]));
  });

  it("graph contains all people nodes", () => {
    const graph = buildAdjacency(makeBaseDataset());
    expect([...graph.people].sort()).toEqual([
      "p_child1",
      "p_child2",
      "p_grand",
      "p_partner",
      "p_root"
    ]);
  });
});
