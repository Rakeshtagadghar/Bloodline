import type { FamilyDataset } from "@bloodline/core";

export function makeRendererFixtureDataset(): FamilyDataset {
  return {
    meta: {
      dataset: "renderer_fixture",
      version: "1.0.0",
      displayName: "Renderer Fixture House"
    },
    people: [
      { id: "p_root", name: "Root" },
      { id: "p_partner", name: "Partner" },
      { id: "p_child1", name: "Child One" },
      { id: "p_child2", name: "Child Two" },
      { id: "p_grand", name: "Grandchild" }
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
