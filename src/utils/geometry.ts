// Shoelace formula — works for any simple polygon, so it covers the
// rectangle and triangle presets as well as freeform custom polygons.
export function polygonArea(vertices: [number, number][]): number {
  let sum = 0;
  for (let i = 0; i < vertices.length; i++) {
    const [x1, y1] = vertices[i];
    const [x2, y2] = vertices[(i + 1) % vertices.length];
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum) / 2;
}

// Standard ray-casting point-in-polygon test — used to hit-test a
// click/drag against a shape's on-screen (already transformed) outline.
export function pointInPolygon(point: [number, number], vertices: [number, number][]): boolean {
  const [px, py] = point;
  let inside = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const [xi, yi] = vertices[i];
    const [xj, yj] = vertices[j];
    const intersects = (yi > py) !== (yj > py) &&
      px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}
