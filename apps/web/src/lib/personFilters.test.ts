import { describe, expect, it } from "vitest";

import {
  collectFilterOptions,
  getPersonLivingStatus,
  matchesPersonFilters,
  matchesPersonSearch,
  type PersonFilters
} from "./personFilters";
import { makeWebFixtureDataset } from "../test/testFixtures";

describe("personFilters", () => {
  const dataset = makeWebFixtureDataset();
  const root = dataset.people.find((p) => p.id === "p_root");
  const child1 = dataset.people.find((p) => p.id === "p_child1");
  const child2 = dataset.people.find((p) => p.id === "p_child2");

  if (!root || !child1 || !child2) {
    throw new Error("Fixture data missing required people");
  }

  it("computes living/deceased status from privacy and died fields", () => {
    expect(getPersonLivingStatus(root)).toBe("deceased");
    expect(getPersonLivingStatus(child1)).toBe("living");
    expect(getPersonLivingStatus(child2)).toBe("living");
  });

  it("matches tag / branch / living filters", () => {
    const filters: PersonFilters = {
      tag: "heir",
      branch: "Main Branch",
      living: "living"
    };

    expect(matchesPersonFilters(child1, filters)).toBe(true);
    expect(matchesPersonFilters(root, filters)).toBe(false);
  });

  it("matches search against name and displayName", () => {
    expect(matchesPersonSearch(child1, "aar")).toBe(true);
    expect(matchesPersonSearch(child1, "xyz")).toBe(false);
  });

  it("collects unique sorted tag and branch options", () => {
    expect(collectFilterOptions(dataset.people)).toEqual({
      tags: ["archivist", "elder", "founder", "heir", "main"],
      branches: ["Cadet Branch", "Main Branch"]
    });
  });
});
