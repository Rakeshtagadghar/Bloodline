import { buildAdjacency, type FamilyDataset } from "@bloodline/core";
import { layoutTree, type LayoutResult, type Viewport } from "@bloodline/renderer";

export function makeWebFixtureDataset(): FamilyDataset {
  return {
    meta: {
      dataset: "web_fixture",
      version: "1.0.0",
      displayName: "House Atlas"
    },
    people: [
      {
        id: "p_root",
        name: "Rakesh I",
        display: { styleTitle: "Patriarch" },
        born: "1954-01-01",
        died: "2024-01-01",
        house: "Main Branch",
        tags: ["founder", "elder"],
        privacy: { living: false }
      },
      {
        id: "p_partner",
        name: "Mira",
        display: { styleTitle: "Matriarch" },
        house: "Main Branch",
        tags: ["elder"],
        privacy: { living: true }
      },
      {
        id: "p_child1",
        name: "Aarav",
        display: { styleTitle: "Heir" },
        house: "Main Branch",
        tags: ["heir", "main"],
        privacy: { living: true }
      },
      {
        id: "p_child2",
        name: "Kavya",
        house: "Cadet Branch",
        tags: ["archivist", "main"],
        privacy: { living: true }
      },
      {
        id: "p_grand",
        name: "Nila",
        display: { styleTitle: "Grandchild" },
        house: "Cadet Branch",
        privacy: { living: true }
      }
    ],
    relationships: [
      { id: "rel_partner_1", type: "partner", from: "p_root", to: "p_partner" },
      { id: "rel_parent_1", type: "parent", parentId: "p_root", childId: "p_child1" },
      { id: "rel_parent_2", type: "parent", parentId: "p_partner", childId: "p_child1" },
      { id: "rel_parent_3", type: "parent", parentId: "p_root", childId: "p_child2" },
      { id: "rel_parent_4", type: "parent", parentId: "p_child1", childId: "p_grand" }
    ],
    ui: {
      theme: "royal-archive",
      defaultRootPersonId: "p_root",
      layout: "descendant"
    }
  };
}

export function makeWebFixtureGraph(dataset: FamilyDataset = makeWebFixtureDataset()) {
  return buildAdjacency(dataset);
}

export function makeWebFixtureLayout(dataset: FamilyDataset = makeWebFixtureDataset()): LayoutResult {
  return layoutTree(dataset.ui.defaultRootPersonId, dataset, { mode: "descendant", seed: 1 });
}

export function makeViewport(partial?: Partial<Viewport>): Viewport {
  return {
    x: -300,
    y: -120,
    scale: 1,
    width: 960,
    height: 640,
    ...partial
  };
}
