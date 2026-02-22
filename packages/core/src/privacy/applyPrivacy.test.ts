import { describe, expect, it } from "vitest";

import { applyPrivacy } from "./applyPrivacy";
import { makeBaseDataset } from "../testUtils";

describe("applyPrivacy", () => {
  it("hides living private people for public view", () => {
    const dataset = makeBaseDataset();
    dataset.people.push({
      id: "p_private",
      name: "Private Person",
      privacy: { visibility: "private", living: true }
    });
    dataset.relationships.push({
      id: "rel_partner_private",
      type: "partner",
      from: "p_private",
      to: "p_root"
    });

    const redacted = applyPrivacy(dataset, "public", true);

    expect(redacted.people.find((p) => p.id === "p_private")).toBeUndefined();
    expect(redacted.relationships.some((r) => r.id === "rel_partner_private")).toBe(false);
  });

  it("hides dates when hideDates=true", () => {
    const dataset = makeBaseDataset();
    dataset.people[0] = {
      ...dataset.people[0],
      born: "1990-01-01",
      privacy: { hideDates: true }
    };

    const redacted = applyPrivacy(dataset, "family", true);
    const person = redacted.people.find((p) => p.id === "p_root");
    expect(person?.born).toBeUndefined();
  });
});
