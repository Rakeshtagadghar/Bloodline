import { describe, expect, it } from "vitest";

import { validateDataset } from "./dataset.zod";
import { makeBaseDataset } from "../testUtils";

describe("validateDataset", () => {
  it("returns typed dataset on valid input", () => {
    const result = validateDataset(makeBaseDataset());

    expect(Array.isArray(result)).toBe(false);
    if (Array.isArray(result)) {
      throw new TypeError("Expected dataset");
    }
    expect(result.ui.defaultRootPersonId).toBe("p_root");
  });

  it("returns structured error list on invalid input", () => {
    const result = validateDataset({});

    expect(Array.isArray(result)).toBe(true);
    if (!Array.isArray(result)) {
      throw new TypeError("Expected errors");
    }
    expect(result.map((issue) => issue.path)).toEqual(
      expect.arrayContaining(["meta", "people", "relationships", "ui"])
    );
  });

  it("rejects relationship references to missing person IDs", () => {
    const dataset = makeBaseDataset();
    dataset.relationships.push({
      id: "rel_parent_bad",
      type: "parent",
      parentId: "p_missing",
      childId: "p_child2"
    });

    const result = validateDataset(dataset);
    expect(Array.isArray(result)).toBe(true);
    if (!Array.isArray(result)) {
      throw new TypeError("Expected errors");
    }
    expect(result.some((issue) => issue.message.includes("missing person"))).toBe(true);
  });
});
