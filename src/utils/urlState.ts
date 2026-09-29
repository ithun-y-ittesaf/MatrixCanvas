import type { Matrix2x2Values } from '../math/Matrix2x2';
import type { Matrix3x3Values } from '../math/Matrix3x3';
import {
  useAppStore,
  type CustomVector,
  type CustomVector3d,
  type ShapeType,
  type ShapeType3d,
  type TransformableShape,
  type TransformableShape3d,
} from '../store/appStore';

// Shareable-link encoding for the Playground's state (matrix, custom
// vectors, shapes). Kept deliberately compact — comma/underscore-joined
// numbers rather than JSON — so a scene with several vectors and shapes
// still produces a URL well under practical length limits. See
// buildSearchParams's length guard at the bottom for the fallback if a
// scene somehow still runs long.

const NUM_DECIMALS = 6;
// Sanity caps on what we'll parse out of a URL — a hand-crafted or corrupted
// query string shouldn't be able to make hydration allocate an unbounded
// number of vectors/shapes/vertices.
const MAX_VECTORS = 300;
const MAX_SHAPES = 200;
const MAX_VERTICES_PER_SHAPE = 200;

function numToStr(n: number): string {
  if (!Number.isFinite(n)) return '0';
  // Round to 6 decimals and trim trailing zeros, same convention MatrixBracket
  // uses for its display values.
  return parseFloat(n.toFixed(NUM_DECIMALS)).toString();
}

function strToNum(s: string): number | null {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

// --- matrix ---------------------------------------------------------------

function encodeMatrix(values: Matrix2x2Values): string {
  return [values[0][0], values[0][1], values[1][0], values[1][1]]
    .map(numToStr)
    .join(',');
}

function decodeMatrix(raw: string): Matrix2x2Values | null {
  const parts = raw.split(',').map(strToNum);
  if (parts.length !== 4 || parts.some((n) => n === null)) return null;
  const [a, b, c, d] = parts as number[];
  return [[a, b], [c, d]];
}

// --- vectors ----------------------------------------------------------------
// Encoded as "x_y" pairs, comma-joined: "1_1,2_-3,0.5_4"

function encodeVectors(vectors: CustomVector[]): string {
  return vectors.map((v) => `${numToStr(v.x)}_${numToStr(v.y)}`).join(',');
}

function decodeVectors(raw: string): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  for (const chunk of raw.split(',')) {
    if (out.length >= MAX_VECTORS) break;
    if (!chunk) continue;
    const [xs, ys] = chunk.split('_');
    if (xs === undefined || ys === undefined) continue;
    const x = strToNum(xs);
    const y = strToNum(ys);
    if (x === null || y === null) continue;
    out.push({ x, y });
  }
  return out;
}

// --- shapes -----------------------------------------------------------------
// Encoded as "code:x_y,x_y,..." per shape, semicolon-joined between shapes.
// Type is abbreviated to a single letter to keep polygon-heavy scenes small.

const SHAPE_CODE: Record<ShapeType, string> = { rectangle: 'r', triangle: 't', polygon: 'p' };
const CODE_SHAPE: Record<string, ShapeType> = { r: 'rectangle', t: 'triangle', p: 'polygon' };

function encodeShapes(shapes: TransformableShape[]): string {
  return shapes
    .map((s) => {
      const verts = s.vertices.map(([x, y]) => `${numToStr(x)}_${numToStr(y)}`).join(',');
      return `${SHAPE_CODE[s.type]}:${verts}`;
    })
    .join(';');
}

function decodeShapes(raw: string): { type: ShapeType; vertices: [number, number][] }[] {
  const out: { type: ShapeType; vertices: [number, number][] }[] = [];
  for (const chunk of raw.split(';')) {
    if (out.length >= MAX_SHAPES) break;
    if (!chunk) continue;
    const sep = chunk.indexOf(':');
    if (sep === -1) continue;
    const code = chunk.slice(0, sep);
    const type = CODE_SHAPE[code];
    if (!type) continue;

    const vertices: [number, number][] = [];
    const vertsRaw = chunk.slice(sep + 1);
    if (vertsRaw) {
      for (const pair of vertsRaw.split(',')) {
        if (vertices.length >= MAX_VERTICES_PER_SHAPE) break;
        const [xs, ys] = pair.split('_');
        if (xs === undefined || ys === undefined) continue;
        const x = strToNum(xs);
        const y = strToNum(ys);
        if (x === null || y === null) continue;
        vertices.push([x, y]);
      }
    }
    out.push({ type, vertices });
  }
  return out;
}

// --- public API ---------------------------------------------------------------

export interface ShareableState {
  matrixValues: Matrix2x2Values;
  customVectors: CustomVector[];
  shapes: TransformableShape[];
}

// Conservative soft cap on the query string length (not counting origin +
// path). Comfortably under the ~2000-character limit some older browsers
// and link-sharing surfaces still enforce, with headroom to spare.
const MAX_QUERY_LENGTH = 1800;

// Builds the URL query params for the current playground state. Rather than
// JSON.stringify + encodeURIComponent-ing the whole state (which balloons
// fast once shapes have several vertices each), each slice gets its own
// compact delimiter-joined encoding. As a last-resort safety net for scenes
// that are still too large (a great many shapes/vertices), shapes are
// dropped from the link first since they're the bulkiest and least likely
// to be missed versus a matrix + vectors link.
export function buildSearchParams(state: ShareableState): URLSearchParams {
  const params = new URLSearchParams();
  params.set('m', encodeMatrix(state.matrixValues));

  const v = encodeVectors(state.customVectors);
  if (v) params.set('v', v);

  const s = encodeShapes(state.shapes);
  if (s) params.set('s', s);

  if (params.toString().length > MAX_QUERY_LENGTH && params.has('s')) {
    console.warn(
      '[urlState] Shareable link exceeded the safe length with shapes included; omitting shapes from the link.'
    );
    params.delete('s');
  }

  return params;
}

export interface DecodedState {
  mode: '2d' | '3d';
  matrixValues: Matrix2x2Values | null;
  vectors: { x: number; y: number }[];
  shapes: { type: ShapeType; vertices: [number, number][] }[];
  matrixValues3d: Matrix3x3Values | null;
  vectors3d: { x: number; y: number; z: number }[];
  shapes3d: { type: ShapeType3d; vertices: [number, number, number][]; radius?: number }[];
}

export function parseSearchParams(params: URLSearchParams): DecodedState {
  const mRaw = params.get('m');
  const vRaw = params.get('v');
  const sRaw = params.get('s');

  const m3Raw = params.get('m3');
  const v3Raw = params.get('v3');
  const s3Raw = params.get('s3');

  return {
    mode: params.get('mode') === '3d' ? '3d' : '2d',
    matrixValues: mRaw ? decodeMatrix(mRaw) : null,
    vectors: vRaw ? decodeVectors(vRaw) : [],
    shapes: sRaw ? decodeShapes(sRaw) : [],
    matrixValues3d: m3Raw ? decodeMatrix3(m3Raw) : null,
    vectors3d: v3Raw ? decodeVectors3(v3Raw) : [],
    shapes3d: s3Raw ? decodeShapes3(s3Raw) : [],
  };
}

// Applies decoded URL state to the Zustand store via its existing public
// actions (setMatrixValues/addVector/addShape) — same as any other caller,
// so this doesn't need to know about the store's internals. Safe to call
// with an empty/absent query string (it's then a no-op past the identity
// matrix already in the store's initial state).
export function hydrateStoreFromSearchParams(params: URLSearchParams): void {
  const decoded = parseSearchParams(params);
  const store = useAppStore.getState();

  if (decoded.matrixValues) store.setMatrixValues(decoded.matrixValues);
  for (const v of decoded.vectors) store.addVector(v.x, v.y);
  for (const s of decoded.shapes) store.addShape(s.type, s.vertices);

  if (decoded.matrixValues3d) store.setMatrixValues3d(decoded.matrixValues3d);
  for (const v of decoded.vectors3d) store.addVector3d(v.x, v.y, v.z);
  for (const s of decoded.shapes3d) store.addShape3d(s.type, s.vertices, s.radius);
}

// The mode a link asks for, or null when it doesn't say (a bare "/" must not
// reset the mode the user chose). Deliberately NOT applied inside
// hydrateStoreFromSearchParams: that runs in PlaygroundPage's render body, and
// NavBar subscribes to `mode`, so changing it there would update NavBar
// mid-render. PlaygroundPage applies it in a layout effect instead.
export function modeFromSearchParams(params: URLSearchParams): '2d' | '3d' | null {
  const raw = params.get('mode');
  return raw === '3d' ? '3d' : raw === '2d' ? '2d' : null;
}

// --- 3D ---------------------------------------------------------------------
// Same compact conventions as 2D, one more coordinate. `mode=3d` marks the link;
// the 3D slice lives under its own keys (m3 / v3 / s3) so existing 2D links keep
// working unchanged.

function encodeMatrix3(values: Matrix3x3Values): string {
  return values.flat().map(numToStr).join(',');
}

function decodeMatrix3(raw: string): Matrix3x3Values | null {
  const parts = raw.split(',').map(strToNum);
  if (parts.length !== 9 || parts.some((n) => n === null)) return null;
  const p = parts as number[];
  return [[p[0], p[1], p[2]], [p[3], p[4], p[5]], [p[6], p[7], p[8]]];
}

// "x_y_z" triples, comma-joined.
function encodeVectors3(vectors: CustomVector3d[]): string {
  return vectors.map((v) => `${numToStr(v.x)}_${numToStr(v.y)}_${numToStr(v.z)}`).join(',');
}

function decodeTriple(chunk: string): [number, number, number] | null {
  const [xs, ys, zs] = chunk.split('_');
  if (xs === undefined || ys === undefined || zs === undefined) return null;
  const x = strToNum(xs);
  const y = strToNum(ys);
  const z = strToNum(zs);
  return x === null || y === null || z === null ? null : [x, y, z];
}

function decodeVectors3(raw: string): { x: number; y: number; z: number }[] {
  const out: { x: number; y: number; z: number }[] = [];
  for (const chunk of raw.split(',')) {
    if (out.length >= MAX_VECTORS) break;
    const t = chunk ? decodeTriple(chunk) : null;
    if (t) out.push({ x: t[0], y: t[1], z: t[2] });
  }
  return out;
}

// "code:x_y_z,x_y_z" per shape, semicolon-joined; a sphere appends "@radius".
const SHAPE3_CODE: Record<ShapeType3d, string> = { cube: 'c', pyramid: 'p', sphere: 's' };
const CODE_SHAPE3: Record<string, ShapeType3d> = { c: 'cube', p: 'pyramid', s: 'sphere' };

function encodeShapes3(shapes: TransformableShape3d[]): string {
  return shapes
    .map((s) => {
      const verts = s.vertices
        .map(([x, y, z]) => `${numToStr(x)}_${numToStr(y)}_${numToStr(z)}`)
        .join(',');
      const radius = s.type === 'sphere' && s.radius !== undefined ? `@${numToStr(s.radius)}` : '';
      return `${SHAPE3_CODE[s.type]}:${verts}${radius}`;
    })
    .join(';');
}

function decodeShapes3(
  raw: string,
): { type: ShapeType3d; vertices: [number, number, number][]; radius?: number }[] {
  const out: { type: ShapeType3d; vertices: [number, number, number][]; radius?: number }[] = [];
  for (const chunk of raw.split(';')) {
    if (out.length >= MAX_SHAPES) break;
    const sep = chunk.indexOf(':');
    if (sep === -1) continue;
    const type = CODE_SHAPE3[chunk.slice(0, sep)];
    if (!type) continue;

    let body = chunk.slice(sep + 1);
    let radius: number | undefined;
    const at = body.indexOf('@');
    if (at !== -1) {
      radius = strToNum(body.slice(at + 1)) ?? undefined;
      body = body.slice(0, at);
    }
    const vertices: [number, number, number][] = [];
    for (const triple of body.split(',')) {
      if (vertices.length >= MAX_VERTICES_PER_SHAPE) break;
      const t = triple ? decodeTriple(triple) : null;
      if (t) vertices.push(t);
    }
    // A cube/pyramid with the wrong vertex count would render garbage.
    if (type === 'cube' && vertices.length !== 8) continue;
    if (type === 'pyramid' && vertices.length !== 5) continue;
    if (type === 'sphere' && vertices.length !== 1) continue;
    out.push({ type, vertices, ...(radius !== undefined ? { radius } : {}) });
  }
  return out;
}

export interface ShareableState3d {
  matrixValues3d: Matrix3x3Values;
  customVectors3d: CustomVector3d[];
  shapes3d: TransformableShape3d[];
}

export function buildSearchParams3d(state: ShareableState3d): URLSearchParams {
  const params = new URLSearchParams();
  params.set('mode', '3d');
  params.set('m3', encodeMatrix3(state.matrixValues3d));

  const v = encodeVectors3(state.customVectors3d);
  if (v) params.set('v3', v);

  const s = encodeShapes3(state.shapes3d);
  if (s) params.set('s3', s);

  if (params.toString().length > MAX_QUERY_LENGTH && params.has('s3')) {
    console.warn(
      '[urlState] Shareable link exceeded the safe length with shapes included; omitting shapes from the link.'
    );
    params.delete('s3');
  }
  return params;
}
