import type { Lesson } from './types';
import { rectanglePresetVertices } from '../store/appStore';
import { presetValues } from './presetValues';

// Decompositions track content per the proposal's Feature 3 spec:
// Eigendecomposition, SVD, LU, QR/Gram-Schmidt. Each lesson builds on the
// Intermediate track (Determinant, Invertibility, Eigenvectors) and the
// Properties panel the same way that track leans on the Beginner track, then
// adds one new step per lesson: setting LessonStep.decomposition, which
// LessonRunner turns into a DecompositionPlayer (via
// math/decompositionSequences.ts's buildDecompositionSequence) that animates
// the matrix apart into the moves each decomposition is made of. Example
// matrices are chosen to be clean/illustrative rather than arbitrary — see
// decompositionsTrack.test.ts, which pins down the specific numbers each
// lesson's prose below claims.

const eigendecompositionLesson: Lesson = {
  id: 'decompositions-eigendecomposition',
  track: 'decompositions',
  title: 'Eigendecomposition',
  steps: [
    {
      id: 'eigen-recall',
      title: 'Eigenvectors, revisited',
      explanation:
        'Recall from the Intermediate track: an eigenvector of a matrix is a direction the ' +
        "matrix only stretches, never rotates off of. This matrix's eigenvectors are (1, 1) " +
        'and (1, -1) — watch them below: both just get longer, along their own line, while ' +
        'everything about their direction stays put. If a matrix has two independent ' +
        'eigenvectors like this, it can be rewritten entirely in terms of them — that ' +
        'rewrite is called eigendecomposition, A = P·D·P⁻¹.',
      matrix: [[3, 1], [1, 3]],
      vectors: [{ x: 1, y: 1 }, { x: 1, y: -1 }],
      katex: 'Av=\\lambda v',
    },
    {
      id: 'eigen-decompose',
      title: 'Watching A = P·D·P⁻¹ unfold',
      explanation:
        'Press Next in the panel below to watch the same transform build up in three moves: ' +
        "first change into the eigenbasis (P⁻¹) — watch (1, 1) and (1, -1) swing exactly " +
        'onto the coordinate axes, since that\'s what "eigenbasis" means. Then D scales along ' +
        "those axes by the eigenvalues. Then P changes back, landing exactly where the matrix " +
        'you just saw applied directly in the last step did.',
      matrix: [[3, 1], [1, 3]],
      vectors: [{ x: 1, y: 1 }, { x: 1, y: -1 }],
      decomposition: 'eigen',
    },
    {
      id: 'eigen-wrapup',
      title: 'Why factor it this way?',
      explanation:
        'Check the Properties panel: eigenvalues read 4, 2 — exactly D\'s diagonal — and ' +
        'symmetric reads yes. That\'s not a coincidence: every symmetric matrix is ' +
        'diagonalizable with an orthogonal P (spectral theorem), so P⁻¹ is just Pᵀ, no ' +
        'inverse to compute. And because D is diagonal, raising A to any power is as easy as ' +
        "raising its eigenvalues to that power — A^n = P·D^n·P⁻¹ — which is exactly why this " +
        'factorization shows up everywhere from Markov chains to vibration analysis.',
      matrix: [[3, 1], [1, 3]],
      shapes: [{ type: 'rectangle', vertices: rectanglePresetVertices() }],
    },
  ],
};

const svdLesson: Lesson = {
  id: 'decompositions-svd',
  track: 'decompositions',
  title: 'Singular Value Decomposition',
  steps: [
    {
      id: 'svd-recall',
      title: 'A shear you\'ve already met',
      explanation:
        "Recall the horizontal shear from the Beginner track's Shear lesson — it slants the " +
        "rectangle into a parallelogram. A shear doesn't look like a simple rotation or a " +
        "simple stretch, but here's a fact with no exceptions: every matrix, without " +
        'exception, factors into rotate, then stretch along perpendicular axes, then rotate ' +
        'again. That factorization is the Singular Value Decomposition, A = U·Σ·Vᵀ.',
      matrix: presetValues('Horizontal Shear'),
      shapes: [{ type: 'rectangle', vertices: rectanglePresetVertices() }],
      katex: '\\begin{bmatrix}1 & 1 \\\\ 0 & 1\\end{bmatrix}',
    },
    {
      id: 'svd-decompose',
      title: 'Watching A = U·Σ·Vᵀ unfold',
      explanation:
        'Press Next in the panel below to watch this shear build up in three moves: first an ' +
        "input rotation Vᵀ lines the rectangle's corners up with a pair of perpendicular " +
        'stretch axes (still a rectangle — rotation alone never distorts a shape). Then Σ ' +
        "stretches along exactly those axes. Then an output rotation U tilts the result into " +
        'the sheared parallelogram you saw a moment ago.',
      matrix: presetValues('Horizontal Shear'),
      shapes: [{ type: 'rectangle', vertices: rectanglePresetVertices() }],
      decomposition: 'svd',
    },
    {
      id: 'svd-wrapup',
      title: 'Singular values measure the stretch',
      explanation:
        'Check the Properties panel: singular values read ≈1.618034 and ≈0.618034 — the ' +
        'golden ratio φ and its reciprocal 1/φ, a small curiosity of this particular shear. ' +
        "In general, the two singular values are exactly Σ's stretch factors: their ratio " +
        'says how lopsided the stretch is, and their product always equals |det A| — here, ' +
        '1.618 × 0.618 ≈ 1, matching this shear\'s determinant of 1 (area is preserved even ' +
        'though the shape clearly isn\'t).',
      matrix: presetValues('Horizontal Shear'),
      shapes: [{ type: 'rectangle', vertices: rectanglePresetVertices() }],
    },
  ],
};

const luLesson: Lesson = {
  id: 'decompositions-lu',
  track: 'decompositions',
  title: 'LU Decomposition',
  steps: [
    {
      id: 'lu-recall',
      title: 'Solving systems by elimination',
      explanation:
        'Gaussian elimination — the standard way to solve a system of linear equations by ' +
        "hand — clears out entries below the diagonal one at a time. Run it on this matrix's " +
        'single entry below the diagonal and the row operation you\'d write down is itself a ' +
        'factorization: A = L·U, an elimination shear (L) times the upper-triangular result ' +
        'elimination leaves behind (U).',
      matrix: [[2, 1], [4, 3]],
      vectors: [{ x: 1, y: 0 }, { x: 0, y: 1 }],
    },
    {
      id: 'lu-decompose',
      title: 'Watching A = L·U unfold',
      explanation:
        'Press Next in the panel below: first the identity becomes L, the elimination shear ' +
        'that clears this matrix\'s (2, 1) entry (its multiplier, 2, is exactly c/a for this ' +
        'matrix). Then U — the upper-triangular matrix elimination leaves behind — is applied ' +
        'on top, landing on the same transform e1 and e2 followed a moment ago.',
      matrix: [[2, 1], [4, 3]],
      vectors: [{ x: 1, y: 0 }, { x: 0, y: 1 }],
      decomposition: 'lu',
    },
    {
      id: 'lu-wrapup',
      title: 'Why factor it this way?',
      explanation:
        'Check the Properties panel: det reads 2. L is unit lower-triangular, so det(L) is ' +
        'always exactly 1, no matter the matrix — all of a matrix\'s area-scaling lives in U, ' +
        'whose determinant is just the product of its diagonal entries (2 × 1 = 2, matching ' +
        'the panel). That\'s also why LU is the go-to for solving Ax = b in practice: two ' +
        'triangular systems (Ly = b, then Ux = y) are far cheaper to solve than one general one.',
      matrix: [[2, 1], [4, 3]],
      shapes: [{ type: 'rectangle', vertices: rectanglePresetVertices() }],
    },
  ],
};

export const DECOMPOSITIONS_TRACK: Lesson[] = [
  eigendecompositionLesson,
  svdLesson,
  luLesson,
];
