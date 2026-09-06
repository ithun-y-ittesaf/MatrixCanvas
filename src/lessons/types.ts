import type { Matrix2x2Values } from '../math/Matrix2x2';
import type { ShapeType } from '../store/appStore';

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
}

export interface Lesson {
  id: string;
  track: TrackType;
  title: string;
  steps: LessonStep[];
}
