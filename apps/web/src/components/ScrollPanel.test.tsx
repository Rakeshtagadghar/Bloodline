import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ScrollPanel } from "./ScrollPanel";
import { makeWebFixtureDataset, makeWebFixtureGraph } from "../test/testFixtures";

describe("ScrollPanel", () => {
  it("shows empty state when no selection", () => {
    render(
      <ScrollPanel dataset={null} graph={null} selectedPersonId={null} onJumpToPerson={() => {}} />
    );

    expect(screen.getByText(/select a person in the tree/i)).toBeInTheDocument();
  });

  it("renders selected person details and relationship jump links", async () => {
    const user = userEvent.setup();
    const dataset = makeWebFixtureDataset();
    const graph = makeWebFixtureGraph(dataset);
    const onJumpToPerson = vi.fn();

    render(
      <ScrollPanel
        dataset={dataset}
        graph={graph}
        selectedPersonId="p_child1"
        onJumpToPerson={onJumpToPerson}
      />
    );

    expect(screen.getByText("Aarav")).toBeInTheDocument();
    expect(screen.getByText("Heir")).toBeInTheDocument();
    expect(screen.getByText("Born: Unknown")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rakesh I" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mira" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nila" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Nila" }));
    expect(onJumpToPerson).toHaveBeenCalledWith("p_grand");
  });
});
