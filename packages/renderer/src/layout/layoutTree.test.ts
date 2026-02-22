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

  it("orders siblings by age when born dates are available (older first)", () => {
    const dataset = makeRendererFixtureDataset();
    dataset.people = dataset.people.map((person) => {
      if (person.id === "p_child1") {
        return { ...person, name: "Younger", born: "2000-01-01" };
      }
      if (person.id === "p_child2") {
        return { ...person, name: "Older", born: "1995-01-01" };
      }
      return person;
    });

    const layout = layoutTree("p_root", dataset, { mode: "descendant" });
    const older = layout.nodes.find((node) => node.id === "p_child2");
    const younger = layout.nodes.find((node) => node.id === "p_child1");

    expect(older).toBeDefined();
    expect(younger).toBeDefined();
    expect((older?.x ?? 0)).toBeLessThan(younger?.x ?? 0);
  });
});
