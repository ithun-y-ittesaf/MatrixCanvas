import type { Lesson } from './types';
import { rectanglePresetVertices } from '../store/appStore';

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

export const DECOMPOSITIONS_TRACK: Lesson[] = [
  eigendecompositionLesson,
];
