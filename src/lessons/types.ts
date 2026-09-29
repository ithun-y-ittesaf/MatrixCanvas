import type { Matrix2x2Values } from '../math/Matrix2x2';
import type { Matrix3x3Values } from '../math/Matrix3x3';
import type { DecompositionKind } from '../math/decompositionSequences';
import type { Overlay3d, ShapeType, ShapeType3d } from '../store/appStore';

// Curriculum track a lesson belongs to. Mirrors the phases on LearningPage
// (Beginner/Intermediate/Decompositions) minus "Advanced", which the
// proposal's class diagram doesn't call out as its own track.
export type TrackType = 'beginner' | 'intermediate' | 'decompositions';

// A vector/shape to pre-load for a step, described the same lightweight way
// urlState.ts's DecodedState does (plain x/y, or type+vertices) rather than
// the store's full CustomVector/TransformableShape — lesson content doesn't
// need to author an id or color, those are assigned when the step is applied
// via the store's addVector/addShape.
export interface LessonVector {
  x: number;
  y: number;
}

export interface LessonShape {
  type: ShapeType;
  vertices: [number, number][];
}

export interface LessonStep {
  id: string;
  title: string;
  // Body copy shown alongside the step. Written as plain text for now — the
  // field also accepts markdown source (e.g. "**bold**", inline `code`, or
  // $inline math$) so a markdown renderer can be dropped in later without a
  // type change, but nothing in this pass parses it as markdown.
  explanation: string;
  // Matrix the canvas should show while this step is active.
  matrix: Matrix2x2Values;
  // Vectors/shapes to load alongside the matrix. Optional — a step that's
  // purely about the matrix itself (e.g. explaining determinant) can omit
  // both. Each step fully replaces the previous step's vectors/shapes when
  // applied (see applyLessonStep in appStore.ts), so omitting these means
  // "no vectors/shapes for this step", not "keep the previous step's".
  vectors?: LessonVector[];
  shapes?: LessonShape[];
  // Raw KaTeX source (no surrounding $ / $$ delimiters), e.g.
  // "\\begin{bmatrix}1 & 0\\\\0 & 1\\end{bmatrix}". Rendered by
  // LessonRunner via katex.render() into a container div.
  katex?: string;
  // When set, this step's canvas visualization is driven by
  // DecompositionPlayer (src/components/DecompositionPlayer.tsx) stepping
  // through `matrix`'s svd/eigen/lu/qr decomposition one stop at a time,
  // instead of the single static application of `matrix` every other step
  // uses. LessonRunner builds the sequence via decompositionSequences.ts's
  // buildDecompositionSequence(decomposition, matrix) and renders the
  // player alongside this step's card when it's set. Leave unset for a
  // step that's just explaining a matrix, not animating a decomposition of
  // it — e.g. every beginner/intermediate step today.
  decomposition?: DecompositionKind;
}

export interface Lesson {
  id: string;
  track: TrackType;
  title: string;
  // Omitted on 2D lessons (they predate 3D mode); `isLesson3D` below is the
  // canonical discriminator.
  dimension?: '2d';
  steps: LessonStep[];
}

// ---------------------------------------------------------------------------
// 3D lessons - the same shape as 2D, with 3x3 matrices, z components, 3D shapes
// and optional geometric overlays computed from the step's matrix.
// ---------------------------------------------------------------------------

export interface LessonVector3D {
  x: number;
  y: number;
  z: number;
}

export interface LessonShape3D {
  type: ShapeType3d;
  // cube: 8 corners in bit order (index = x + 2y + 4z); pyramid: 4 base
  // corners then the apex; sphere: [center].
  vertices: [number, number, number][];
  radius?: number;
}

export interface LessonStep3D {
  id: string;
  title: string;
  explanation: string;
  matrix: Matrix3x3Values;
  vectors?: LessonVector3D[];
  shapes?: LessonShape3D[];
  katex?: string;
  decomposition?: DecompositionKind;
  // Geometric overlays the 3D canvas should draw for this step (eigenvector
  // lines, null-space line/plane, column-space plane, the unit sphere and its
  // ellipsoid image, ...). Computed from `matrix` by the canvas.
  overlays?: Overlay3d[];
}

export interface Lesson3D {
  id: string;
  track: TrackType;
  title: string;
  dimension: '3d';
  steps: LessonStep3D[];
}

export type AnyLesson = Lesson | Lesson3D;
export type AnyLessonStep = LessonStep | LessonStep3D;

export function isLesson3D(lesson: AnyLesson): lesson is Lesson3D {
  return lesson.dimension === '3d';
}
