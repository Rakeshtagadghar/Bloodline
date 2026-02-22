import { describe, expect, it } from "vitest";

import { createUndoRedoState, pushState, redo, undo } from "./undoRedo";

describe("undoRedo", () => {
  it("returns to prior state exactly", () => {
    let history = createUndoRedoState({ count: 0 });
    history = pushState(history, { count: 1 });
    history = pushState(history, { count: 2 });

    const undone = undo(history);
    expect(undone.present).toEqual({ count: 1 });

    const redone = redo(undone);
    expect(redone.present).toEqual({ count: 2 });
  });

  it("clears redo stack when pushing a new state", () => {
    let history = createUndoRedoState("a");
    history = pushState(history, "b");
    history = pushState(history, "c");
    history = undo(history);

    expect(history.future).toEqual(["c"]);

    history = pushState(history, "d");
    expect(history.future).toEqual([]);
  });
});
