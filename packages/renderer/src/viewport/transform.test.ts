import { describe, expect, it } from "vitest";

import { screenToWorld, worldToScreen } from "./transform";

describe("viewport transforms", () => {
  it("world<->screen transforms are invertible", () => {
    const viewport = { x: 120, y: -80, scale: 1.5, width: 1000, height: 700 };
    const world = { x: 240, y: 300 };

    const screen = worldToScreen(world, viewport);
    const roundTrip = screenToWorld(screen, viewport);

    expect(roundTrip.x).toBeCloseTo(world.x, 8);
    expect(roundTrip.y).toBeCloseTo(world.y, 8);
  });
});
