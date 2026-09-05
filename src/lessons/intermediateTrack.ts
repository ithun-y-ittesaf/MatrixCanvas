import type { Lesson } from './types';
import { rectanglePresetVertices } from '../store/appStore';
import { presetValues, IDENTITY } from './presetValues';

// Intermediate track content per the proposal's Feature 4 spec: Matrix
// Composition, Determinant, Null Space, Column Space, Invertibility,
// Eigenvectors. These build directly on the Beginner track, and lean on the
// Properties panel (src/components/PropertiesPanel.tsx, bottom-right of the
// Playground) — steps point the learner at its det/rank/eigenvalues/
// invertible readouts rather than re-deriving those numbers in prose.

const matrixCompositionLesson: Lesson = {
  id: 'intermediate-matrix-composition',
  track: 'intermediate',
  title: 'Matrix Composition',
  steps: [
    {
      id: 'apply-shear-first',
      title: 'Step one: shear',
      explanation:
        "Let's apply two transforms one after another, starting with a horizontal shear. " +
        'Watch (0, 1) move to (1, 1).',
      matrix: presetValues('Horizontal Shear'),
      vectors: [{ x: 0, y: 1 }],
    },
    {
      id: 'then-rotate',
      title: 'Then rotate 90°',
      explanation:
        "Now take that sheared result and rotate it 90°. In practice you'd apply the " +
        "rotation matrix to wherever the shear already sent your vector — here that's " +
        '(1, 1), so this step loads the rotation matrix on (1, 1) directly to show where ' +
        'the two-step process ends up.',
      matrix: presetValues('Rotate 90°'),
      vectors: [{ x: 1, y: 1 }],
    },
    {
      id: 'one-matrix-does-both',
      title: 'One matrix can do both at once',
      explanation:
        "Composing \"shear, then rotate\" into a single matrix means matrix-multiplying " +
        "them, shear's matrix on the right since it happens first: R·S. Load that " +
        'combined matrix directly on the original vector (0, 1), and it lands in exactly ' +
        'the same place the two-step process did.',
      matrix: [[0, -1], [1, 1]],
      vectors: [{ x: 0, y: 1 }],
      katex: 'R\\cdot S=\\begin{bmatrix}0 & -1 \\\\ 1 & 1\\end{bmatrix}',
    },
    {
      id: 'order-matters',
      title: 'Order matters: S·R ≠ R·S',
      explanation:
        "Reverse the order — rotate first, then shear — and you get a different matrix, " +
        "S·R. Composing linear transforms is matrix multiplication, and matrix " +
        "multiplication generally isn't commutative. Load the same starting vector " +
        '(0, 1) here and watch it land somewhere different than it did with R·S.',
      matrix: [[1, -1], [1, 0]],
      vectors: [{ x: 0, y: 1 }],
      katex: 'S\\cdot R=\\begin{bmatrix}1 & -1 \\\\ 1 & 0\\end{bmatrix}',
    },
  ],
};

const determinantLesson: Lesson = {
  id: 'intermediate-determinant',
  track: 'intermediate',
  title: 'Determinant',
  steps: [
    {
      id: 'recall-area-scaling',
      title: 'The determinant is an area scale factor',
      explanation:
        'Recall from the Beginner track that a matrix stretches or shrinks shapes. The ' +
        "determinant is a single number that says exactly how much: it's the factor by " +
        'which area gets scaled. Check the Properties panel (bottom-right) — for the ' +
        "identity matrix here, det reads 1: areas don't change.",
      matrix: IDENTITY,
      shapes: [{ type: 'rectangle', vertices: rectanglePresetVertices() }],
      katex: '\\det\\begin{bmatrix}a & b \\\\ c & d\\end{bmatrix}=ad-bc',
    },
    {
      id: 'determinant-as-area-scale',
      title: 'A matrix that quadruples area',
      explanation:
        'This matrix scales both axes by 2, so every area should quadruple (2 × 2). ' +
        'Check the Properties panel: det now reads 4, exactly matching that prediction — ' +
        "the determinant of a diagonal scaling matrix is just the product of its " +
        'diagonal entries.',
      matrix: presetValues('Scale ×2'),
      shapes: [{ type: 'rectangle', vertices: rectanglePresetVertices() }],
    },
    {
      id: 'zero-determinant-collapses',
      title: 'A zero determinant collapses area',
      explanation:
        'Check the Properties panel for this matrix and you\'ll see det reads 0. A zero ' +
        'determinant means the transform squashes the plane down onto a line, destroying ' +
        'area entirely. Watch the rectangle flatten into a line segment.',
      matrix: presetValues('Project onto X'),
      shapes: [{ type: 'rectangle', vertices: rectanglePresetVertices() }],
    },
    {
      id: 'negative-determinant-flips-orientation',
      title: 'A negative determinant flips orientation',
      explanation:
        "A negative determinant doesn't change area, but it does flip the shape's " +
        'orientation — like turning a glove inside out. Check the Properties panel: det ' +
        'reads -1, and an amber "Orientation reversed" note appears beneath the yes/no ' +
        "properties. Watch the rectangle's corners now run the opposite way around.",
      matrix: presetValues('Reflect over X'),
      shapes: [{ type: 'rectangle', vertices: rectanglePresetVertices() }],
    },
  ],
};

const nullSpaceLesson: Lesson = {
  id: 'intermediate-null-space',
  track: 'intermediate',
  title: 'Null Space',
  steps: [
    {
      id: 'recall-determinant-zero',
      title: 'When det = 0, something vanishes',
      explanation:
        'Recall the projection matrix from the Determinant lesson had det = 0 (check the ' +
        'Properties panel). When det = 0, some nonzero vector gets squashed all the way ' +
        'to the origin. Watch (0, 1) here: projecting onto the x-axis sends it straight ' +
        'down to (0, 0).',
      matrix: presetValues('Project onto X'),
      vectors: [{ x: 0, y: 1 }],
    },
    {
      id: 'null-space-defined',
      title: 'The null space is every vector that vanishes',
      explanation:
        'The null space of a matrix is the set of every vector it sends to the origin. ' +
        "For this projection matrix, that's the entire y-axis — every vector plotted " +
        'here has x = 0, and every one of them collapses to (0, 0). Only the x-component ' +
        'of a vector survives this transform; any vector with none to begin with vanishes ' +
        'completely.',
      matrix: presetValues('Project onto X'),
      vectors: [{ x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: -1.5 }],
      katex: 'N(A)=\\{v : Av=0\\}',
    },
    {
      id: 'invertible-has-trivial-null-space',
      title: 'Invertible matrices have no null space to speak of',
      explanation:
        'Compare that to an invertible matrix like this identity matrix — check the ' +
        'Properties panel: det is nonzero and invertible reads yes. Its null space ' +
        "contains only the zero vector itself: no nonzero vector gets squashed to the " +
        'origin, which is exactly why the transform can be undone.',
      matrix: IDENTITY,
      vectors: [{ x: 1, y: 1 }],
    },
    {
      id: 'the-flip-side-is-column-space',
      title: "The flip side: where everything lands",
      explanation:
        "Null space asks what gets sent to zero. There's a flip side: what's the actual " +
        'range of outputs? Watch the rectangle collapse onto a flat line segment along ' +
        "the x-axis under this same matrix — that line is exactly what the next lesson, " +
        'Column Space, is about.',
      matrix: presetValues('Project onto X'),
      shapes: [{ type: 'rectangle', vertices: rectanglePresetVertices() }],
    },
  ],
};

const columnSpaceLesson: Lesson = {
  id: 'intermediate-column-space',
  track: 'intermediate',
  title: 'Column Space',
  steps: [
    {
      id: 'recall-columns-are-basis-images',
      title: 'Columns are where e1 and e2 land',
      explanation:
        "Recall from the Identity lesson that a matrix's columns are where it sends e1 " +
        'and e2. The column space is the set of every point those two columns (and every ' +
        "combination of them) can reach — everywhere the transform's output can land. " +
        'Check the Properties panel: rank reads 2 here, meaning outputs can land anywhere ' +
        'in the plane.',
      matrix: IDENTITY,
      vectors: [{ x: 1, y: 0 }, { x: 0, y: 1 }],
    },
    {
      id: 'full-rank-fills-the-plane',
      title: 'Full rank means the whole plane is reachable',
      explanation:
        'Any invertible matrix, like this one, has rank 2 — check the Properties panel. ' +
        'Its column space is the entire plane: every point is reachable as the image of ' +
        'some input vector.',
      matrix: presetValues('Scale ×2'),
      vectors: [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
    },
    {
      id: 'rank-one-column-space-is-a-line',
      title: 'Rank 1 means the outputs are trapped on a line',
      explanation:
        'Now check the Properties panel for this projection matrix: rank reads 1. Its ' +
        'column space collapses to a single line — the x-axis — no matter what vector ' +
        'you feed in, the output always lands somewhere on it. This is the companion ' +
        "fact to Null Space: a whole line's worth of inputs collapses to zero, and " +
        'correspondingly, every output is trapped on a line too.',
      matrix: presetValues('Project onto X'),
      vectors: [{ x: 1, y: 1 }, { x: 2, y: -1 }, { x: -1, y: 2 }],
    },
  ],
};

const invertibilityLesson: Lesson = {
  id: 'intermediate-invertibility',
  track: 'intermediate',
  title: 'Invertibility',
  steps: [
    {
      id: 'recall-determinant-nonzero',
      title: 'Invertible means det ≠ 0',
      explanation:
        'A matrix is invertible exactly when its determinant is nonzero. Check the ' +
        'Properties panel: for this matrix, det is nonzero and invertible reads yes. An ' +
        'invertible matrix can always be undone — there\'s another matrix, its inverse, ' +
        'that reverses the transform exactly.',
      matrix: presetValues('Scale ×2'),
      vectors: [{ x: 1, y: 1 }],
    },
    {
      id: 'the-inverse-matrix',
      title: 'The inverse undoes the transform',
      explanation:
        'The inverse of the scale-by-2 matrix from the last step is scale-by-0.5 — it ' +
        'exactly undoes the doubling. This matrix is loaded on (2, 2), where (1, 1) ' +
        'landed after scaling, and it returns to (1, 1). In general, a matrix\'s inverse ' +
        'can be written directly from its four entries, no bigger than the matrix itself.',
      matrix: [[0.5, 0], [0, 0.5]],
      vectors: [{ x: 2, y: 2 }],
      katex: 'A^{-1}=\\frac{1}{\\det A}\\begin{bmatrix}d & -b \\\\ -c & a\\end{bmatrix}',
    },
    {
      id: 'no-inverse-when-det-zero',
      title: 'No inverse when det = 0',
      explanation:
        'This projection matrix has det = 0 — check the Properties panel: invertible now ' +
        "reads no. That makes sense: it already collapsed the y-axis to the origin (the " +
        'Null Space lesson), so there\'s no way to reverse-engineer which original ' +
        "y-value a squashed point came from. Lost information can't be recovered by any " +
        'matrix.',
      matrix: presetValues('Project onto X'),
      shapes: [{ type: 'rectangle', vertices: rectanglePresetVertices() }],
    },
    {
      id: 'putting-it-together',
      title: 'Several ways to say the same thing',
      explanation:
        "Invertible, det ≠ 0, and rank 2 are all exactly the same condition on a matrix — " +
        "check any one of them in the Properties panel and you've checked them all. This " +
        'is one of the most useful facts in linear algebra: several seemingly different ' +
        'questions boil down to a single yes/no answer.',
      matrix: presetValues('Rotate 90°'),
      vectors: [{ x: 1, y: 0 }],
    },
  ],
};

const eigenvectorsLesson: Lesson = {
  id: 'intermediate-eigenvectors',
  track: 'intermediate',
  title: 'Eigenvectors',
  steps: [
    {
      id: 'what-is-an-eigenvector',
      title: 'A vector that only gets longer, not turned',
      explanation:
        'Recall the non-uniform scaling matrix, diag(2, 0.5), from the Beginner track\'s ' +
        'Scaling lesson. Watch the vector (1, 0): it stretches to (2, 0) — same direction, ' +
        'just longer. A vector like this, whose direction a matrix leaves unchanged (only ' +
        'its length rescales), is called an eigenvector.',
      matrix: [[2, 0], [0, 0.5]],
      vectors: [{ x: 1, y: 0 }],
      katex: 'Av=\\lambda v',
    },
    {
      id: 'the-eigenvalue',
      title: 'The eigenvalue is the scale factor',
      explanation:
        '(0, 1) is an eigenvector too, but with a different scale factor: it shrinks to ' +
        '(0, 0.5) instead of stretching. That scale factor — 2 for the last vector, 0.5 ' +
        'for this one — is called the eigenvalue. Check the Properties panel: eigenvalues ' +
        'reads 2, 0.5, exactly the two numbers you just watched play out.',
      matrix: [[2, 0], [0, 0.5]],
      vectors: [{ x: 0, y: 1 }],
    },
    {
      id: 'not-every-vector-is-an-eigenvector',
      title: "Most vectors aren't eigenvectors",
      explanation:
        "Watch (1, 1) under this same matrix: it becomes (2, 0.5) — a completely " +
        'different direction, not just a rescaled version of (1, 1). Only vectors that ' +
        "already point along one of a matrix's special axis directions keep their " +
        'direction; everything else gets turned as well as stretched.',
      matrix: [[2, 0], [0, 0.5]],
      vectors: [{ x: 1, y: 1 }],
    },
    {
      id: 'complex-eigenvalues',
      title: 'Rotation has no real eigenvectors',
      explanation:
        'Rotation is the opposite extreme: no real vector keeps its direction under a 90° ' +
        'turn — every single one changes direction. Check the Properties panel: ' +
        'eigenvalues shows a ± pair with an i in it instead of two plain numbers. A ' +
        "matrix's eigenvalues aren't always real, and for a pure rotation other than 0° " +
        'or 180°, they never are.',
      matrix: presetValues('Rotate 90°'),
      vectors: [{ x: 1, y: 0 }],
    },
  ],
};

export const INTERMEDIATE_TRACK: Lesson[] = [
  matrixCompositionLesson,
  determinantLesson,
  nullSpaceLesson,
  columnSpaceLesson,
  invertibilityLesson,
  eigenvectorsLesson,
];
