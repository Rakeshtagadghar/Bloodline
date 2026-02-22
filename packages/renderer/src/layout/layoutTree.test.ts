import { describe, expect, it } from "vitest";

import { layoutTree } from "./layoutTree";
import { makeRendererFixtureDataset } from "../testUtils";

describe("layoutTree", () => {
  it("is deterministic for the same dataset/options", () => {
    const dataset = makeRendererFixtureDataset();
    const a = layoutTree("p_root", dataset, { seed: 42 });
    const b = layoutTree("p_root", dataset, { seed: 42 });

    expect(a).toEqual(b);
  });

  it("aligns partners horizontally", () => {
    const dataset = makeRendererFixtureDataset();
    const layout = layoutTree("p_root", dataset, { seed: 1 });
    const root = layout.nodes.find((n) => n.id === "p_root");
    const partner = layout.nodes.find((n) => n.id === "p_partner");

    expect(root).toBeDefined();
    expect(partner).toBeDefined();
    expect(root?.y).toBe(partner?.y);
    expect(root?.x).not.toBe(partner?.x);
  });

  it("places children below parents in descendant mode", () => {
    const dataset = makeRendererFixtureDataset();
    const layout = layoutTree("p_root", dataset, { mode: "descendant" });
    const root = layout.nodes.find((n) => n.id === "p_root");
    const child = layout.nodes.find((n) => n.id === "p_child1");

    expect(child?.y).toBeGreaterThan(root?.y ?? 0);
  });
});
