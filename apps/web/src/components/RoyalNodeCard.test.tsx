import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { RoyalNodeCard } from "./RoyalNodeCard";
import { makeWebFixtureDataset } from "../test/testFixtures";

describe("RoyalNodeCard", () => {
  it("renders display name fallback and title", () => {
    const person = makeWebFixtureDataset().people.find((entry) => entry.id === "p_root");
    if (!person) {
      throw new Error("Fixture person missing");
    }

    render(
      <RoyalNodeCard
        person={person}
        node={{ id: person.id, x: 10, y: 20, width: 160, height: 84, depth: 0 }}
        selected={false}
        highlighted={false}
        dimmed={false}
        onSelect={() => {}}
      />
    );

    expect(screen.getByRole("button", { name: "Select Rakesh I" })).toBeInTheDocument();
    expect(screen.getByText("Patriarch")).toBeInTheDocument();
  });

  it("calls onSelect with person id on click", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const person = makeWebFixtureDataset().people.find((entry) => entry.id === "p_child1");
    if (!person) {
      throw new Error("Fixture person missing");
    }

    render(
      <RoyalNodeCard
        person={person}
        node={{ id: person.id, x: 0, y: 0, width: 160, height: 84, depth: 1 }}
        selected
        highlighted={false}
        dimmed={false}
        onSelect={onSelect}
      />
    );

    await user.click(screen.getByTestId("node-p_child1"));
    expect(onSelect).toHaveBeenCalledWith("p_child1");
  });
});
