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

export const INTERMEDIATE_TRACK: Lesson[] = [
  matrixCompositionLesson,
  determinantLesson,
];
