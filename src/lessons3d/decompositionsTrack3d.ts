import type { Lesson3D } from '../lessons/types';
import type { Matrix3x3Values } from '../math/Matrix3x3';
import { E1, E2, E3, UNIT_CUBE, preset3d } from './helpers3d';
import { SYMMETRIC_3 } from './intermediateTrack3d';

// 3D mirror of the Decompositions track. SVD is where 3D really pays off: the
// unit sphere turns into an ellipsoid whose three semi-axes ARE the singular
// values, and the decomposition player shows it happening one factor at a time
// (rotate the sphere, stretch it, rotate the result). Example matrices are
// chosen to be clean - lessons3d/decompositionsTrack3d.test.ts pins down every
// number the prose below claims.

// The 2D horizontal shear, embedded in 3D (z untouched). Singular values:
// the golden ratio φ ≈ 1.618, 1, and 1/φ ≈ 0.618.
export const SHEAR_3: Matrix3x3Values = preset3d('Shear X by Y');
// Same shear with the z axis flattened away: singular values φ, 1/φ, 0.
export const FLAT_SHEAR_3: Matrix3x3Values = [[1, 1, 0], [0, 1, 0], [0, 0, 0]];
// A nearly-flat ellipsoid: semi-axes 3, 2 and 0.1.
export const NEARLY_FLAT_3: Matrix3x3Values = [[3, 0, 0], [0, 2, 0], [0, 0, 0.1]];
// Its best rank-2 approximation (drop the smallest singular value).
export const TRUNCATED_3: Matrix3x3Values = [[3, 0, 0], [0, 2, 0], [0, 0, 0]];
// Textbook LU example: L = [[1,0,0],[2,1,0],[4,3,1]], U = [[2,1,1],[0,1,1],[0,0,2]].
export const LU_EXAMPLE_3: Matrix3x3Values = [[2, 1, 1], [4, 3, 3], [8, 7, 9]];
// QR example with clean Gram-Schmidt numbers: Q has columns (2,1,2)/3,
// (-2,2,1)/3, (1,2,-2)/3 and R = [[3,3,3],[0,3,3],[0,0,3]].
export const QR_EXAMPLE_3: Matrix3x3Values = [[2, 0, 1], [1, 3, 5], [2, 3, 1]];
export const QR_Q_3: Matrix3x3Values = [
  [2 / 3, -2 / 3, 1 / 3],
  [1 / 3, 2 / 3, 2 / 3],
  [2 / 3, 1 / 3, -2 / 3],
];

const eigendecompositionLesson: Lesson3D = {
  id: 'decompositions-eigendecomposition-3d',
  track: 'decompositions',
  title: 'Eigendecomposition',
  dimension: '3d',
  steps: [
    {
      id: 'eigen-recall',
      title: 'Eigenvectors, revisited',
      explanation:
        'Recall from the Intermediate track: an eigenvector is a direction the matrix only ' +
        'stretches. This symmetric matrix has three, drawn as lines: (0, 0, 1) stretched by ' +
        '4, (1, 1, 0) by 3 and (1, -1, 0) by 1. Watch the three vectors below - each just ' +
        'gets longer along its own line. If a matrix has three independent eigenvectors it ' +
        'can be rewritten entirely in terms of them: A = P·D·P⁻¹.',
      matrix: SYMMETRIC_3,
      vectors: [{ x: 1, y: 1, z: 0 }, { x: 1, y: -1, z: 0 }, E3],
      overlays: ['eigenvectors'],
      katex: 'Av=\\lambda v',
    },
    {
      id: 'eigen-decompose',
      title: 'Watching A = P·D·P⁻¹ unfold',
      explanation:
        'Press Next in the panel below to watch the transform build up in three moves: first ' +
        'change into the eigenbasis (P⁻¹) - the three eigenvectors swing onto the coordinate ' +
        'axes, since that is what "eigenbasis" means. Then D stretches along those axes by ' +
        'the eigenvalues 4, 3 and 1. Then P changes back, landing on the transform you just ' +
        'saw applied directly.',
      matrix: SYMMETRIC_3,
      vectors: [{ x: 1, y: 1, z: 0 }, { x: 1, y: -1, z: 0 }, E3],
      decomposition: 'eigen',
    },
    {
      id: 'eigen-wrapup',
      title: 'Why factor it this way?',
      explanation:
        "Check the Properties panel: eigenvalues read 4, 3, 1 - exactly D's diagonal - and " +
        'symmetric reads yes. Every symmetric matrix is diagonalizable with an orthogonal P ' +
        '(the spectral theorem), so P⁻¹ is just Pᵀ. And because D is diagonal, powers are ' +
        'easy: Aⁿ = P·Dⁿ·P⁻¹ just raises the eigenvalues to the n-th power.',
      matrix: SYMMETRIC_3,
      shapes: [UNIT_CUBE],
      overlays: ['eigenvectors'],
    },
  ],
};

const svdLesson: Lesson3D = {
  id: 'decompositions-svd-3d',
  track: 'decompositions',
  title: 'Singular Value Decomposition',
  dimension: '3d',
  steps: [
    {
      id: 'svd-recall',
      title: 'A shear you\'ve already met, and a sphere',
      explanation:
        'This is the horizontal shear from the Beginner track, with the z-axis along for ' +
        'the ride. A shear does not look like a rotation or a stretch, but here is a fact ' +
        'with no exceptions: every matrix factors into rotate, then stretch along three ' +
        'perpendicular axes, then rotate again - the Singular Value Decomposition, ' +
        'A = U·Σ·Vᵀ. To see it, look at what the matrix does to the unit sphere (the cyan ' +
        'surface): it comes out an ellipsoid. The ellipsoid\'s three semi-axes are the ' +
        'singular values.',
      matrix: SHEAR_3,
      shapes: [UNIT_CUBE],
      overlays: ['unitSphere'],
      katex: 'A=U\\Sigma V^{T}',
    },
    {
      id: 'svd-decompose',
      title: 'Watching A = U·Σ·Vᵀ unfold',
      explanation:
        'Press Next in the panel below to watch the sphere become that ellipsoid in three ' +
        'moves. First the input rotation Vᵀ turns the sphere - and since a sphere looks ' +
        'the same from every angle, all you see is the cube spin so its edges line up with ' +
        'the stretch axes. Then Σ stretches along exactly those three axes, and the sphere ' +
        'becomes an ellipsoid. Then the output rotation U tilts the ellipsoid into its final ' +
        'orientation, the purple axes marking its three semi-axes σ₁u₁, σ₂u₂, σ₃u₃.',
      matrix: SHEAR_3,
      shapes: [UNIT_CUBE],
      overlays: ['unitSphere', 'singularAxes'],
      decomposition: 'svd',
    },
    {
      id: 'svd-wrapup',
      title: 'Singular values measure the stretch',
      explanation:
        'Check the Properties panel: singular values read ≈1.618034, 1 and ≈0.618034. Those ' +
        'are the ellipsoid\'s semi-axis lengths - the golden ratio φ, 1 (the z-axis, which ' +
        'the shear leaves alone) and 1/φ. Their product is always |det A|: here ' +
        '1.618 × 1 × 0.618 ≈ 1, matching this shear\'s determinant of 1 - the ellipsoid has ' +
        'the same volume as the sphere it came from, even though its shape is very different.',
      matrix: SHEAR_3,
      shapes: [UNIT_CUBE],
      overlays: ['unitSphere', 'singularAxes'],
    },
    {
      id: 'svd-rank-deficient',
      title: 'When a singular value is 0, the ellipsoid goes flat',
      explanation:
        'Now flatten the z-axis away as well. Press Next to watch the decomposition: the ' +
        'sphere is stretched into an ellipsoid that keeps getting thinner along one axis ' +
        'until Σ crushes it into a flat disc. Check the Properties panel: singular values ' +
        'read 1.618, 0.618 and 0, det reads 0, and rank reads 2. The number of nonzero ' +
        'singular values is the rank - 3D shows it directly as the dimension of the ' +
        'ellipsoid (a solid, a disc, a needle or a point).',
      matrix: FLAT_SHEAR_3,
      overlays: ['unitSphere', 'singularAxes'],
      decomposition: 'svd',
    },
    {
      id: 'svd-truncation',
      title: 'Dropping the smallest singular value',
      explanation:
        'This matrix stretches the sphere to semi-axes 3, 2 and 0.1 - a very thin ellipsoid ' +
        'that is almost a disc. Watch what it does to the cube. Since the third singular ' +
        'value is tiny, you lose very little by setting it to zero: the next step does that.',
      matrix: NEARLY_FLAT_3,
      shapes: [UNIT_CUBE],
      overlays: ['unitSphere', 'singularAxes'],
    },
    {
      id: 'svd-best-approximation',
      title: 'The best rank-2 approximation',
      explanation:
        'Zeroing the smallest singular value gives a rank-2 matrix - the disc the ellipsoid ' +
        'was almost flat into. Among all rank-2 matrices this is the closest one to the ' +
        'original (the Eckart-Young theorem), and it is exactly how SVD compresses images ' +
        'and data: keep the few largest singular values, throw away the rest.',
      matrix: TRUNCATED_3,
      shapes: [UNIT_CUBE],
      overlays: ['unitSphere', 'singularAxes'],
    },
  ],
};

const luLesson: Lesson3D = {
  id: 'decompositions-lu-3d',
  track: 'decompositions',
  title: 'LU Decomposition',
  dimension: '3d',
  steps: [
    {
      id: 'lu-recall',
      title: 'Solving systems by elimination',
      explanation:
        'Gaussian elimination clears the entries below the diagonal one at a time. In 3D ' +
        'there are three of them: below the first pivot in rows 2 and 3, then below the ' +
        'second pivot in row 3. Each row operation is itself a shear, and together they ' +
        'factor the matrix: A = L·U - the elimination shears (L) times the ' +
        'upper-triangular result (U).',
      matrix: LU_EXAMPLE_3,
      vectors: [E1, E2, E3],
    },
    {
      id: 'lu-decompose',
      title: 'Watching A = L·U unfold',
      explanation:
        'Press Next in the panel below: the multipliers for this matrix are 2 (row 2), 4 ' +
        '(row 3) and 3 (the entry below the second pivot). First the identity becomes the ' +
        'shear that clears row 2, then the shear that clears row 3, then the last shear - ' +
        'together they build L. Then U, the upper-triangular matrix elimination leaves ' +
        'behind, is applied on top, landing on the same transform e1, e2 and e3 followed a ' +
        'moment ago.',
      matrix: LU_EXAMPLE_3,
      vectors: [E1, E2, E3],
      decomposition: 'lu',
    },
    {
      id: 'lu-wrapup',
      title: 'Why factor it this way?',
      explanation:
        'Check the Properties panel: det reads 4. L is unit lower-triangular, so det(L) is ' +
        'always exactly 1 - all of the matrix\'s volume-scaling lives in U, whose ' +
        'determinant is the product of its diagonal (2 × 1 × 2 = 4). LU is the workhorse for ' +
        'solving Ax = b: two triangular systems (Ly = b, then Ux = y) are much cheaper than ' +
        'one general one.',
      matrix: LU_EXAMPLE_3,
      shapes: [UNIT_CUBE],
    },
  ],
};

const qrLesson: Lesson3D = {
  id: 'decompositions-qr-3d',
  track: 'decompositions',
  title: 'QR Decomposition',
  dimension: '3d',
  steps: [
    {
      id: 'qr-recall',
      title: 'Straightening out a matrix\'s columns',
      explanation:
        'A matrix\'s columns are where it sends e1, e2 and e3. Here they are (2, 1, 2), ' +
        '(0, 3, 3) and (1, 5, 1): not perpendicular, not unit length, and usually not. QR ' +
        'builds an orthonormal frame Q pointing the same way the columns do, plus a ' +
        'triangular R recording how to stretch it back: A = Q·R.',
      matrix: QR_EXAMPLE_3,
      vectors: [E1, E2, E3],
    },
    {
      id: 'qr-decompose',
      title: 'Watching A = Q·R unfold via Gram-Schmidt',
      explanation:
        'Press Next in the panel below: first column 1, (2, 1, 2) - length 3 - is straightened ' +
        'into the unit vector (2, 1, 2)/3. Then column 2 has its component along that ' +
        'direction subtracted off, and what remains is normalized into a second ' +
        'perpendicular unit vector. Then column 3 has both components removed and what ' +
        'is left becomes the third, completing the orthonormal frame Q. Finally R is applied ' +
        'on top, stretching Q back out to A.',
      matrix: QR_EXAMPLE_3,
      vectors: [E1, E2, E3],
      decomposition: 'qr',
    },
    {
      id: 'qr-wrapup',
      title: 'Q really is orthonormal',
      explanation:
        'This is Q itself, loaded directly - not A. Check the Properties panel: orthogonal ' +
        'now reads yes, confirming its three columns are perpendicular unit vectors, ' +
        'exactly what Gram-Schmidt promises. (det Q = -1 here, so this Q also flips ' +
        'orientation; the cube keeps its volume of 1 either way.) QR underlies ' +
        'least-squares fitting and is one of the more numerically stable ways to solve a ' +
        'linear system.',
      matrix: QR_Q_3,
      vectors: [E1, E2, E3],
      shapes: [UNIT_CUBE],
    },
  ],
};

export const DECOMPOSITIONS_TRACK_3D: Lesson3D[] = [
  eigendecompositionLesson,
  svdLesson,
  luLesson,
  qrLesson,
];
