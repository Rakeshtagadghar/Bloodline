import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { RoyalTreeCanvas } from "./RoyalTreeCanvas";
import {
  makeViewport,
  makeWebFixtureDataset,
  makeWebFixtureGraph,
  makeWebFixtureLayout
} from "../test/testFixtures";

describe("RoyalTreeCanvas", () => {
  it("renders nodes and applies search dimming to non-matches", () => {
    const dataset = makeWebFixtureDataset();
    const graph = makeWebFixtureGraph(dataset);
    const layout = makeWebFixtureLayout(dataset);
    const onViewportChange = vi.fn();

    render(
      <RoyalTreeCanvas
        dataset={dataset}
        layout={layout}
        graph={graph}
        selectedPersonId="p_root"
        searchQuery="nila"
        viewport={makeViewport()}
        centerOnSelectionKey={0}
        onViewportChange={onViewportChange}
        onSelectPerson={() => {}}
      />
    );

    expect(screen.getByTestId("node-p_grand")).toBeInTheDocument();
    expect(screen.getByTestId("node-p_root")).toHaveClass(/nodeDimmed/);
    expect(screen.getByTestId("node-p_grand")).not.toHaveClass(/nodeDimmed/);
  });

  it("calls onSelectPerson when a node is clicked", async () => {
    const user = userEvent.setup();
    const dataset = makeWebFixtureDataset();
    const graph = makeWebFixtureGraph(dataset);
    const layout = makeWebFixtureLayout(dataset);
    const onSelectPerson = vi.fn();

    render(
      <RoyalTreeCanvas
        dataset={dataset}
        layout={layout}
        graph={graph}
        selectedPersonId="p_root"
        searchQuery=""
        viewport={makeViewport()}
        centerOnSelectionKey={0}
        onViewportChange={() => {}}
        onSelectPerson={onSelectPerson}
      />
    );

    await user.click(screen.getByTestId("node-p_child1"));
    expect(onSelectPerson).toHaveBeenCalledWith("p_child1");
  });

  it("requests viewport updates on wheel zoom", () => {
    const dataset = makeWebFixtureDataset();
    const graph = makeWebFixtureGraph(dataset);
    const layout = makeWebFixtureLayout(dataset);
    const onViewportChange = vi.fn();

    render(
      <RoyalTreeCanvas
        dataset={dataset}
        layout={layout}
        graph={graph}
        selectedPersonId="p_root"
        searchQuery=""
        viewport={makeViewport()}
        centerOnSelectionKey={0}
        onViewportChange={onViewportChange}
        onSelectPerson={() => {}}
      />
    );

    const stage = screen.getByLabelText("Interactive family tree");
    Object.defineProperty(stage, "getBoundingClientRect", {
      value: () => ({ left: 0, top: 0, width: 960, height: 640, right: 960, bottom: 640, x: 0, y: 0, toJSON: () => ({}) }),
      configurable: true
    });

    fireEvent.wheel(stage, { clientX: 200, clientY: 200, deltaY: -120 });
    expect(onViewportChange).toHaveBeenCalled();
  });
});
