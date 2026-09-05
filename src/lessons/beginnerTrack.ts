import type { Lesson } from './types';
import type { Matrix2x2Values } from '../math/Matrix2x2';
import { PRESETS } from '../utils/presets';
import { rectanglePresetVertices } from '../store/appStore';

// Beginner track content per the proposal's Feature 4 spec: Vectors, Matrix
// Multiplication, Identity, Scaling, Rotation, Shear, Reflection. Written for
// a second-semester undergraduate audience — basic calculus is assumed, but
// no prior geometric intuition for matrices.

// Looks a transform up by its MatrixInput dropdown label, so lessons that use
// a "named" preset (rotation/shear/reflection/scale) stay in sync with
// PRESETS instead of re-typing the same numbers.
function presetValues(label: string): Matrix2x2Values {
  const preset = PRESETS.find((p) => p.label === label);
  if (!preset) throw new Error(`beginnerTrack: no preset labeled "${label}"`);
  return preset.values;
}

const IDENTITY = presetValues('Identity');

const vectorsLesson: Lesson = {
  id: 'beginner-vectors',
  track: 'beginner',
  title: 'Vectors',
  steps: [
    {
      id: 'what-is-a-vector',
      title: 'What is a vector?',
      explanation:
        "A vector in the plane is just a pair of numbers (x, y) — think of it as an arrow " +
        "starting at the origin and ending at the point (x, y). The first number tells you " +
        "how far to go along the horizontal axis, the second how far along the vertical axis. " +
        "Watch the arrow on the canvas: it's the vector (2, 1).",
      matrix: IDENTITY,
      vectors: [{ x: 2, y: 1 }],
      katex: 'v=\\begin{bmatrix}2 \\\\ 1\\end{bmatrix}',
    },
    {
      id: 'basis-vectors',
      title: 'The standard basis vectors',
      explanation:
        "Two special vectors get used constantly: e1 = (1, 0), pointing one unit right, and " +
        "e2 = (0, 1), pointing one unit up. They're called the standard basis vectors because " +
        "every other vector in the plane can be built out of them — you'll see exactly how in " +
        "the next step.",
      matrix: IDENTITY,
      vectors: [{ x: 1, y: 0 }, { x: 0, y: 1 }],
      katex: 'e_1=\\begin{bmatrix}1 \\\\ 0\\end{bmatrix},\\ e_2=\\begin{bmatrix}0 \\\\ 1\\end{bmatrix}',
    },
    {
      id: 'linear-combination',
      title: 'Any vector is a combination of e1 and e2',
      explanation:
        "The vector (2, 1) is just 2 copies of e1 plus 1 copy of e2: v = 2*e1 + 1*e2. In " +
        "general, any vector (x, y) equals x*e1 + y*e2. That might look obvious, but it's the " +
        'idea that makes matrix multiplication work — a matrix is defined entirely by where it ' +
        'sends e1 and e2.',
      matrix: IDENTITY,
      vectors: [{ x: 2, y: 1 }, { x: 1, y: 0 }, { x: 0, y: 1 }],
      katex: 'v=x\\begin{bmatrix}1 \\\\ 0\\end{bmatrix}+y\\begin{bmatrix}0 \\\\ 1\\end{bmatrix}',
    },
  ],
};

const matrixMultiplicationLesson: Lesson = {
  id: 'beginner-matrix-multiplication',
  track: 'beginner',
  title: 'Matrix Multiplication',
  steps: [
    {
      id: 'identity-does-nothing',
      title: 'Multiplying by the identity matrix',
      explanation:
        'A 2×2 matrix is a table of four numbers that defines a transformation of the plane — ' +
        'feed it a vector, get a new vector out. The simplest matrix is the identity matrix: ' +
        'multiplying any vector by it gives back that same vector unchanged, the same way ' +
        'multiplying a number by 1 leaves it unchanged.',
      matrix: IDENTITY,
      vectors: [{ x: 1, y: 1 }],
      katex:
        '\\begin{bmatrix}1 & 0 \\\\ 0 & 1\\end{bmatrix}\\begin{bmatrix}1 \\\\ 1\\end{bmatrix}' +
        '=\\begin{bmatrix}1 \\\\ 1\\end{bmatrix}',
    },
    {
      id: 'how-the-multiply-works',
      title: 'How matrix-vector multiplication works',
      explanation:
        'For a matrix with rows (a, b) and (c, d), multiplying it by a vector (x, y) takes the ' +
        'dot product of each row with the vector: the first output component is ax + by, the ' +
        'second is cx + dy. Try it with the scaling matrix below on the vector (1, 1).',
      matrix: presetValues('Scale ×2'),
      vectors: [{ x: 1, y: 1 }],
      katex:
        '\\begin{bmatrix}a & b \\\\ c & d\\end{bmatrix}\\begin{bmatrix}x \\\\ y\\end{bmatrix}' +
        '=\\begin{bmatrix}ax+by \\\\ cx+dy\\end{bmatrix}',
    },
    {
      id: 'transform-the-whole-plane',
      title: 'A matrix moves the whole plane at once',
      explanation:
        "Every point gets multiplied by the same matrix — that's why a whole shape moves " +
        'together instead of falling apart. Watch the rectangle stretch uniformly as the same ' +
        'scaling matrix from the last step is applied to all four of its corners at once.',
      matrix: presetValues('Scale ×2'),
      shapes: [{ type: 'rectangle', vertices: rectanglePresetVertices() }],
    },
  ],
};

const identityLesson: Lesson = {
  id: 'beginner-identity',
  track: 'beginner',
  title: 'Identity',
  steps: [
    {
      id: 'the-identity-matrix',
      title: 'The identity matrix',
      explanation:
        "You already met this in the last lesson: the identity matrix leaves every vector " +
        "exactly where it is. It's the \"do nothing\" transformation — the baseline every " +
        'other matrix in this track gets compared against.',
      matrix: IDENTITY,
      vectors: [{ x: 1, y: 1 }],
      katex: '\\begin{bmatrix}1 & 0 \\\\ 0 & 1\\end{bmatrix}',
    },
    {
      id: 'columns-are-basis-images',
      title: 'Its columns are where e1 and e2 land',
      explanation:
        "Here's a fact that generalizes to every matrix: its first column is where it sends " +
        'e1 = (1, 0), and its second column is where it sends e2 = (0, 1). For the identity ' +
        'matrix, e1 stays at (1, 0) and e2 stays at (0, 1) — nothing moves, which is exactly ' +
        'why its columns are (1, 0) and (0, 1).',
      matrix: IDENTITY,
      vectors: [{ x: 1, y: 0 }, { x: 0, y: 1 }],
      katex:
        'e_1=\\begin{bmatrix}1 \\\\ 0\\end{bmatrix}\\rightarrow\\begin{bmatrix}1 \\\\ 0\\end{bmatrix},' +
        '\\quad e_2=\\begin{bmatrix}0 \\\\ 1\\end{bmatrix}\\rightarrow\\begin{bmatrix}0 \\\\ 1\\end{bmatrix}',
    },
    {
      id: 'shapes-unchanged-too',
      title: 'Shapes pass through unchanged too',
      explanation:
        'Because every point of a shape gets the same treatment, a rectangle under the ' +
        'identity matrix comes out exactly as it went in. Every lesson from here on shows you ' +
        'a matrix that actually does something to this same rectangle — starting with scaling, ' +
        'next.',
      matrix: IDENTITY,
      shapes: [{ type: 'rectangle', vertices: rectanglePresetVertices() }],
    },
  ],
};

const scalingLesson: Lesson = {
  id: 'beginner-scaling',
  track: 'beginner',
  title: 'Scaling',
  steps: [
    {
      id: 'recall-identity-scaling',
      title: 'Starting point: identity',
      explanation:
        'Recall that the identity matrix leaves vectors unchanged. Scaling is the first ' +
        'matrix in this track that actually changes something: it stretches or shrinks ' +
        'vectors along the axes. The next three steps build that up from simplest to most ' +
        'general.',
      matrix: IDENTITY,
      vectors: [{ x: 1, y: 1 }],
    },
    {
      id: 'uniform-scaling',
      title: 'Uniform scaling',
      explanation:
        'This matrix has 2 on both diagonal entries and 0 elsewhere. Multiplying it by any ' +
        'vector doubles both components — every vector ends up twice as long, in the same ' +
        'direction. Because both axes scale by the same factor, this is called uniform ' +
        'scaling.',
      matrix: presetValues('Scale ×2'),
      vectors: [{ x: 1, y: 1 }],
      katex:
        '\\begin{bmatrix}2 & 0 \\\\ 0 & 2\\end{bmatrix}\\begin{bmatrix}1 \\\\ 1\\end{bmatrix}' +
        '=\\begin{bmatrix}2 \\\\ 2\\end{bmatrix}',
    },
    {
      id: 'non-uniform-scaling',
      title: 'Non-uniform scaling',
      explanation:
        'Nothing says the two diagonal entries have to match. This matrix stretches the ' +
        'x-axis by a factor of 2 and shrinks the y-axis to half size — watch the rectangle ' +
        'get wider and flatter instead of simply growing.',
      matrix: [[2, 0], [0, 0.5]],
      shapes: [{ type: 'rectangle', vertices: rectanglePresetVertices() }],
      katex: '\\begin{bmatrix}2 & 0 \\\\ 0 & 0.5\\end{bmatrix}',
    },
    {
      id: 'negative-scale-is-a-flip',
      title: 'A negative scale factor flips the axis',
      explanation:
        "What happens if a diagonal entry is negative? This matrix scales x by 1 " +
        "(unchanged) and y by -1 — every point flips to the opposite side of the x-axis. " +
        "Scaling by a negative number isn't really shrinking, it's a mirror image — you'll " +
        'meet this idea again, properly, in the Reflection lesson.',
      matrix: presetValues('Reflect over X'),
      shapes: [{ type: 'rectangle', vertices: rectanglePresetVertices() }],
      katex: '\\begin{bmatrix}1 & 0 \\\\ 0 & -1\\end{bmatrix}',
    },
  ],
};

const rotationLesson: Lesson = {
  id: 'beginner-rotation',
  track: 'beginner',
  title: 'Rotation',
  steps: [
    {
      id: 'recall-identity-rotation',
      title: 'Starting point: identity',
      explanation:
        'The identity matrix leaves every vector pointing the same way it started. Rotation ' +
        'instead turns every vector by the same fixed angle around the origin, without ' +
        'changing its length.',
      matrix: IDENTITY,
      vectors: [{ x: 1, y: 0 }],
    },
    {
      id: 'rotate-90',
      title: 'Rotating 90°',
      explanation:
        'This matrix rotates every vector 90° counter-clockwise. Watch the vector (1, 0), ' +
        'pointing right, swing up to (0, 1). A general rotation matrix by angle θ has cos θ ' +
        'and -sin θ across its top row, sin θ and cos θ across its bottom row — plug in ' +
        'θ = 90° (cos 90° = 0, sin 90° = 1) and you get exactly this matrix.',
      matrix: presetValues('Rotate 90°'),
      vectors: [{ x: 1, y: 0 }],
      katex:
        'R_\\theta=\\begin{bmatrix}\\cos\\theta & -\\sin\\theta \\\\ ' +
        '\\sin\\theta & \\cos\\theta\\end{bmatrix}',
    },
    {
      id: 'rotate-45',
      title: 'Rotating 45°',
      explanation:
        'This time the matrix rotates by 45° instead of 90° — half a right angle. Since ' +
        'cos 45° = sin 45° ≈ 0.7071, the vector (1, 0) lands exactly halfway between its ' +
        'starting position and where the 90° rotation sent it.',
      matrix: presetValues('Rotate 45°'),
      vectors: [{ x: 1, y: 0 }],
      katex: '\\begin{bmatrix}0.7071 & -0.7071 \\\\ 0.7071 & 0.7071\\end{bmatrix}',
    },
    {
      id: 'rotation-preserves-shape',
      title: 'Rotation preserves size and shape',
      explanation:
        "Unlike scaling, rotation never stretches or squashes anything — it's a rigid " +
        'motion. Watch the rectangle turn 90° without changing its side lengths or its area, ' +
        'just its orientation.',
      matrix: presetValues('Rotate 90°'),
      shapes: [{ type: 'rectangle', vertices: rectanglePresetVertices() }],
    },
  ],
};

const shearLesson: Lesson = {
  id: 'beginner-shear',
  track: 'beginner',
  title: 'Shear',
  steps: [
    {
      id: 'recall-identity-shear',
      title: 'Starting point: identity',
      explanation:
        'Starting again from a plain rectangle under the identity matrix, unchanged. A shear ' +
        'slides one axis sideways in proportion to the other, turning this same rectangle ' +
        'into a parallelogram.',
      matrix: IDENTITY,
      shapes: [{ type: 'rectangle', vertices: rectanglePresetVertices() }],
    },
    {
      id: 'horizontal-shear',
      title: 'Horizontal shear',
      explanation:
        "This matrix leaves e1 = (1, 0) exactly where it is, but sends e2 = (0, 1) to " +
        "(1, 1) — every point's x-coordinate shifts right by an amount equal to its " +
        "y-coordinate, while y itself doesn't move. That's why the rectangle slants sideways " +
        'into a parallelogram, more so the higher up you go.',
      matrix: presetValues('Horizontal Shear'),
      shapes: [{ type: 'rectangle', vertices: rectanglePresetVertices() }],
      katex: '\\begin{bmatrix}1 & 1 \\\\ 0 & 1\\end{bmatrix}',
    },
    {
      id: 'vertical-shear',
      title: 'Vertical shear',
      explanation:
        "The mirror-image idea: this matrix shifts each point's y-coordinate up by an " +
        'amount equal to its x-coordinate, while x stays put. The same rectangle now slants ' +
        'upward instead of sideways.',
      matrix: presetValues('Vertical Shear'),
      shapes: [{ type: 'rectangle', vertices: rectanglePresetVertices() }],
      katex: '\\begin{bmatrix}1 & 0 \\\\ 1 & 1\\end{bmatrix}',
    },
  ],
};

const reflectionLesson: Lesson = {
  id: 'beginner-reflection',
  track: 'beginner',
  title: 'Reflection',
  steps: [
    {
      id: 'recall-identity-reflection',
      title: 'Starting point: identity',
      explanation:
        "One more time from the identity matrix: the vector (2, 1) sits exactly where it's " +
        'plotted, unchanged. A reflection instead sends it to its mirror image across some ' +
        'line through the origin.',
      matrix: IDENTITY,
      vectors: [{ x: 2, y: 1 }],
    },
    {
      id: 'reflect-over-x-axis',
      title: 'Reflecting over the x-axis',
      explanation:
        'This matrix keeps x the same and flips the sign of y. Every point ends up as its ' +
        'mirror image across the x-axis — watch (2, 1) land at (2, -1), the same distance ' +
        'below the axis that it started above it.',
      matrix: presetValues('Reflect over X'),
      vectors: [{ x: 2, y: 1 }],
      katex:
        '\\begin{bmatrix}1 & 0 \\\\ 0 & -1\\end{bmatrix}\\begin{bmatrix}2 \\\\ 1\\end{bmatrix}' +
        '=\\begin{bmatrix}2 \\\\ -1\\end{bmatrix}',
    },
    {
      id: 'reflect-over-y-equals-x',
      title: 'Reflecting over the line y = x',
      explanation:
        "This matrix swaps the two coordinates outright: (x, y) becomes (y, x). " +
        "Geometrically, that's a mirror image across the diagonal line y = x — watch " +
        '(2, 1) land at (1, 2).',
      matrix: presetValues('Reflect over Y=X'),
      vectors: [{ x: 2, y: 1 }],
      katex:
        '\\begin{bmatrix}0 & 1 \\\\ 1 & 0\\end{bmatrix}\\begin{bmatrix}2 \\\\ 1\\end{bmatrix}' +
        '=\\begin{bmatrix}1 \\\\ 2\\end{bmatrix}',
    },
  ],
};

export const BEGINNER_TRACK: Lesson[] = [
  vectorsLesson,
  matrixMultiplicationLesson,
  identityLesson,
  scalingLesson,
  rotationLesson,
  shearLesson,
  reflectionLesson,
];
