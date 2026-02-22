export interface UndoRedoState<T> {
  past: T[];
  present: T;
  future: T[];
}

export function createUndoRedoState<T>(initial: T): UndoRedoState<T> {
  return {
    past: [],
    present: initial,
    future: []
  };
}

export function pushState<T>(
  state: UndoRedoState<T>,
  next: T,
  isEqual: (a: T, b: T) => boolean = Object.is
): UndoRedoState<T> {
  if (isEqual(state.present, next)) {
    return state;
  }
  return {
    past: [...state.past, state.present],
    present: next,
    future: []
  };
}

export function undo<T>(state: UndoRedoState<T>): UndoRedoState<T> {
  if (state.past.length === 0) {
    return state;
  }
  const nextPast = state.past.slice(0, -1);
  const previous = state.past[state.past.length - 1];
  return {
    past: nextPast,
    present: previous,
    future: [state.present, ...state.future]
  };
}

export function redo<T>(state: UndoRedoState<T>): UndoRedoState<T> {
  if (state.future.length === 0) {
    return state;
  }
  const [nextPresent, ...restFuture] = state.future;
  return {
    past: [...state.past, state.present],
    present: nextPresent,
    future: restFuture
  };
}
