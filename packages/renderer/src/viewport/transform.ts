export interface Point {
  x: number;
  y: number;
}

export interface Viewport {
  x: number;
  y: number;
  scale: number;
  width: number;
  height: number;
}

export function worldToScreen(point: Point, viewport: Viewport): Point {
  return {
    x: (point.x - viewport.x) * viewport.scale,
    y: (point.y - viewport.y) * viewport.scale
  };
}

export function screenToWorld(point: Point, viewport: Viewport): Point {
  return {
    x: point.x / viewport.scale + viewport.x,
    y: point.y / viewport.scale + viewport.y
  };
}

export function panViewport(viewport: Viewport, dxScreen: number, dyScreen: number): Viewport {
  return {
    ...viewport,
    x: viewport.x - dxScreen / viewport.scale,
    y: viewport.y - dyScreen / viewport.scale
  };
}

export function zoomViewportAt(
  viewport: Viewport,
  factor: number,
  screenPoint: Point,
  minScale = 0.1,
  maxScale = 4
): Viewport {
  const before = screenToWorld(screenPoint, viewport);
  const nextScale = Math.min(maxScale, Math.max(minScale, viewport.scale * factor));
  const nextViewport = { ...viewport, scale: nextScale };
  const after = screenToWorld(screenPoint, nextViewport);
  return {
    ...nextViewport,
    x: nextViewport.x + (before.x - after.x),
    y: nextViewport.y + (before.y - after.y)
  };
}
