import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});

class ResizeObserverMock {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

if (!("ResizeObserver" in globalThis)) {
  Object.defineProperty(globalThis, "ResizeObserver", {
    value: ResizeObserverMock,
    writable: true
  });
}

const proto = globalThis.HTMLElement?.prototype;
if (proto) {
  if (!proto.setPointerCapture) {
    proto.setPointerCapture = function setPointerCapture(): void {};
  }
  if (!proto.releasePointerCapture) {
    proto.releasePointerCapture = function releasePointerCapture(): void {};
  }
  if (!proto.hasPointerCapture) {
    proto.hasPointerCapture = function hasPointerCapture(): boolean {
      return false;
    };
  }
}
