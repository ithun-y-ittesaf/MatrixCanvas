import type { Lesson3D } from '../lessons/types';
import type { Matrix3x3Values } from '../math/Matrix3x3';
import { E1, E2, E3, IDENTITY_3, UNIT_CUBE, preset3d } from './helpers3d';

// 3D mirror of the Intermediate track. The subspace lessons are where 3D pays
// off most: a null space or column space can be a point, a line or a whole
// plane, and the canvas draws it (see the `overlays` on each step).

// A tilted rank-2 matrix used by the Null Space and Column Space lessons.
// Its columns satisfy c3 = c1 + c2, so its column space is the plane spanned
// by (1,0,1) and (0,1,1), and (1, 1, -1) is sent to the origin.
export const TILTED_RANK_2: Matrix3x3Values = [[1, 0, 1], [0, 1, 1], [1, 1, 2]];

// Quarter-turns about x and z, used to show that 3D rotations don't commute.
export const ROT_X_90: Matrix3x3Values = [[1, 0, 0], [0, 0, -1], [0, 1, 0]];
export const ROT_Z_90: Matrix3x3Values = [[0, -1, 0], [1, 0, 0], [0, 0, 1]];
// Rz·Rx (rotate about x first, then z) and Rx·Rz (z first, then x).
export const ROT_X_THEN_Z: Matrix3x3Values = [[0, 0, 1], [1, 0, 0], [0, 1, 0]];
export const ROT_Z_THEN_X: Matrix3x3Values = [[0, -1, 0], [0, 0, -1], [1, 0, 0]];

// Symmetric, with three distinct eigenvalues: 4 (along z), 3 (along (1,1,0))
// and 1 (along (1,-1,0)).
export const SYMMETRIC_3: Matrix3x3Values = [[2, 1, 0], [1, 2, 0], [0, 0, 4]];

const matrixCompositionLesson: Lesson3D = {
  id: 'intermediate-matrix-composition-3d',
  track: 'intermediate',
  title: 'Matrix Composition',
  dimension: '3d',
  steps: [
    {
      id: 'rotate-about-x-first',
      title: 'Step one: rotate about x',
      explanation:
        "Let's apply two rotations one after another, starting with 90° about the x-axis. " +
        'Watch v = (1, 1, 0) swing up to (1, 0, 1).',
      matrix: ROT_X_90,
      vectors: [{ x: 1, y: 1, z: 0 }],
    },
    {
      id: 'then-rotate-about-z',
      title: 'Then rotate 90° about z',
      explanation:
        'Now take that result and rotate it 90° about the z-axis. This step loads the ' +
        'z-rotation on (1, 0, 1), where the first rotation left the vector, to show where the ' +
        'two-step process ends up: (0, 1, 1).',
      matrix: ROT_Z_90,
      vectors: [{ x: 1, y: 0, z: 1 }],
    },
    {
      id: 'one-matrix-does-both',
      title: 'One matrix can do both at once',
      explanation:
        'Composing "rotate about x, then about z" into a single matrix means multiplying ' +
        "them with the first rotation on the right: Rz·Rx. Load it on the original (1, 1, 0) " +
        'and it lands at (0, 1, 1) - exactly where the two-step process did. (It happens to ' +
        'be the 120° rotation about the (1, 1, 1) diagonal from the Rotation lesson.)',
      matrix: ROT_X_THEN_Z,
      vectors: [{ x: 1, y: 1, z: 0 }],
      katex:
        'R_z R_x=\\begin{bmatrix}0 & 0 & 1 \\\\ 1 & 0 & 0 \\\\ 0 & 1 & 0\\end{bmatrix}',
    },
    {
      id: 'order-matters',
      title: 'Order matters: Rx·Rz ≠ Rz·Rx',
      explanation:
        'Swap the order - rotate about z first, then about x - and you get a different ' +
        'matrix. Load it on the same (1, 1, 0) and it lands at (-1, 0, 1), somewhere else ' +
        "entirely. In 3D this is easy to feel: tilt a book forward then turn it, versus " +
        'turn it then tilt it forward. Rotations about different axes do not commute.',
      matrix: ROT_Z_THEN_X,
      vectors: [{ x: 1, y: 1, z: 0 }],
      katex:
        'R_x R_z=\\begin{bmatrix}0 & -1 & 0 \\\\ 0 & 0 & -1 \\\\ 1 & 0 & 0\\end{bmatrix}',
    },
  ],
};

const determinantLesson: Lesson3D = {
  id: 'intermediate-determinant-3d',
  track: 'intermediate',
  title: 'Determinant',
  dimension: '3d',
  steps: [
    {
      id: 'recall-volume-scaling',
      title: 'The determinant is a volume scale factor',
      explanation:
        'In 2D the determinant scaled area; in 3D it scales volume. The cube of side 1 has ' +
        'volume 1, so after any transform the "Vol" label next to the cube is the determinant ' +
        "(up to sign). For the identity, det reads 1 in the Properties panel: volumes don't change.",
      matrix: IDENTITY_3,
      shapes: [UNIT_CUBE],
      katex: '\\det A=\\text{signed volume of the image of the unit cube}',
    },
    {
      id: 'determinant-as-volume-scale',
      title: 'A matrix that multiplies volume by 8',
      explanation:
        'Doubling all three axes multiplies volume by 2 × 2 × 2 = 8. Check the Properties ' +
        'panel: det reads 8 - and so does the cube\'s volume label. The determinant of a ' +
        'diagonal matrix is the product of its diagonal entries.',
      matrix: preset3d('Scale ×2'),
      shapes: [UNIT_CUBE],
    },
    {
      id: 'shear-keeps-volume',
      title: 'A shear changes shape, not volume',
      explanation:
        'This shear slants the cube into a leaning box, yet det still reads 1 and the volume ' +
        "label doesn't move. Slide the layers of a deck of cards sideways: the deck leans, " +
        'but it holds the same amount of paper.',
      matrix: preset3d('Shear X by Z'),
      shapes: [UNIT_CUBE],
    },
    {
      id: 'zero-determinant-collapses',
      title: 'A zero determinant flattens space',
      explanation:
        'This matrix projects everything straight down onto the xy-plane. Check the ' +
        'Properties panel: det reads 0. The cube flattens into a square with no thickness, ' +
        'so its volume is 0 - a solid has been squashed onto a plane and can never be ' +
        'restored.',
      matrix: preset3d('Project onto XY plane'),
      shapes: [UNIT_CUBE],
    },
    {
      id: 'negative-determinant-flips-orientation',
      title: 'A negative determinant flips orientation',
      explanation:
        'A negative determinant keeps the volume but reverses handedness, like a mirror. ' +
        'Check the Properties panel: det reads -1 and an "Orientation reversed" note ' +
        'appears. Rotations always have det +1; anything that includes a reflection has det ' +
        'below zero.',
      matrix: preset3d('Reflect over XY plane'),
      shapes: [UNIT_CUBE],
    },
  ],
};

const nullSpaceLesson: Lesson3D = {
  id: 'intermediate-null-space-3d',
  track: 'intermediate',
  title: 'Null Space',
  dimension: '3d',
  steps: [
    {
      id: 'recall-determinant-zero',
      title: 'When det = 0, something vanishes',
      explanation:
        'Recall that projecting onto the xy-plane had det = 0. When det = 0, some nonzero ' +
        'vector is squashed all the way to the origin. Watch (0, 0, 1): projecting onto the ' +
        'xy-plane sends it straight to (0, 0, 0).',
      matrix: preset3d('Project onto XY plane'),
      vectors: [E3],
    },
    {
      id: 'null-space-is-a-line',
      title: 'Here the null space is a line',
      explanation:
        'The null space is every vector a matrix sends to the origin. For this projection ' +
        "that's the whole z-axis: every vector plotted has x = y = 0 and every one collapses " +
        'to the origin. The pink line on the canvas is the null space - one dimension ' +
        '(rank 2 plus a 1-dimensional null space adds up to 3).',
      matrix: preset3d('Project onto XY plane'),
      vectors: [E3, { x: 0, y: 0, z: 2 }, { x: 0, y: 0, z: -1.5 }],
      overlays: ['nullSpace'],
      katex: 'N(A)=\\{v : Av=0\\}',
    },
    {
      id: 'null-space-is-a-plane',
      title: 'It can be a whole plane',
      explanation:
        'Projecting onto just the x-axis throws away both y and z. Now the null space is ' +
        'the entire yz-plane - the pink sheet - and (0, 1, 0), (0, 0, 1) and (0, 1, 1) all ' +
        'collapse to the origin. Rank 1 leaves a 2-dimensional null space: the more the ' +
        'matrix squashes, the bigger the null space.',
      matrix: preset3d('Project onto X axis'),
      vectors: [E2, E3, { x: 0, y: 1, z: 1 }],
      overlays: ['nullSpace'],
    },
    {
      id: 'tilted-null-space',
      title: 'A tilted example',
      explanation:
        'Null spaces need not line up with the axes. This matrix has a null space along the ' +
        'diagonal (1, 1, -1): its rows all give 0 against that vector. Check the ' +
        'Properties panel: det reads 0, rank reads 2. The vector (1, 1, -1) collapses to ' +
        'the origin even though nothing about the matrix looks obviously flat.',
      matrix: TILTED_RANK_2,
      vectors: [{ x: 1, y: 1, z: -1 }],
      overlays: ['nullSpace'],
    },
    {
      id: 'invertible-has-trivial-null-space',
      title: 'Invertible matrices have only the origin',
      explanation:
        'Compare an invertible matrix like the identity: det is nonzero and invertible reads ' +
        'yes. Its null space is only the zero vector itself (no pink line or plane): nothing ' +
        'nonzero is squashed to the origin, which is exactly why the transform can be undone.',
      matrix: IDENTITY_3,
      vectors: [{ x: 1, y: 1, z: 1 }],
      overlays: ['nullSpace'],
    },
  ],
};

const columnSpaceLesson: Lesson3D = {
  id: 'intermediate-column-space-3d',
  track: 'intermediate',
  title: 'Column Space',
  dimension: '3d',
  steps: [
    {
      id: 'recall-columns-are-basis-images',
      title: 'Columns are where e1, e2 and e3 land',
      explanation:
        'A matrix\'s columns are where it sends e1, e2 and e3. The column space is everything ' +
        'those three columns (and all their combinations) can reach - where outputs can ' +
        'land. Check the Properties panel: rank reads 3, so outputs can land anywhere in ' +
        'space.',
      matrix: IDENTITY_3,
      vectors: [E1, E2, E3],
      overlays: ['columnSpace'],
    },
    {
      id: 'full-rank-fills-space',
      title: 'Full rank means all of space is reachable',
      explanation:
        'Any invertible matrix has rank 3: its column space is all of 3D space, so every ' +
        'point is the image of some input.',
      matrix: preset3d('Scale ×2'),
      vectors: [E1, E2, E3],
      overlays: ['columnSpace'],
    },
    {
      id: 'rank-two-column-space-is-a-plane',
      title: 'Rank 2: the outputs are trapped on a plane',
      explanation:
        'Project onto the xy-plane and check the Properties panel: rank reads 2. The column ' +
        'space is the xy-plane - the cyan sheet - and no matter what vector you feed in, the ' +
        'output lands on it. Space has been flattened onto a plane.',
      matrix: preset3d('Project onto XY plane'),
      vectors: [{ x: 1, y: 1, z: 1 }, { x: 2, y: -1, z: 3 }, { x: -1, y: 2, z: -2 }],
      overlays: ['columnSpace'],
    },
    {
      id: 'rank-one-column-space-is-a-line',
      title: 'Rank 1: the outputs are trapped on a line',
      explanation:
        'Project onto the x-axis: rank reads 1, and the column space is a single line. ' +
        'Every output lands on the x-axis. This is the companion to the Null Space lesson: ' +
        'the larger the null space, the smaller the set of possible outputs.',
      matrix: preset3d('Project onto X axis'),
      vectors: [{ x: 1, y: 1, z: 1 }, { x: 2, y: -1, z: 3 }],
      overlays: ['columnSpace'],
    },
    {
      id: 'tilted-plane',
      title: 'A tilted plane, with the null space that goes with it',
      explanation:
        "The matrix from the last lesson has c3 = c1 + c2, so its three columns only span a " +
        'plane: the cyan sheet, tilted in space. The pink line is its null space, the ' +
        'direction (1, 1, -1) that gets squashed away - here it stands perpendicular to the ' +
        'plane, as it does for every symmetric matrix. Rank 2 and null-space dimension 1 ' +
        'always add up to 3 - the rank-nullity theorem, visible at a glance.',
      matrix: TILTED_RANK_2,
      vectors: [E1, E2, E3],
      overlays: ['columnSpace', 'nullSpace'],
    },
  ],
};

const invertibilityLesson: Lesson3D = {
  id: 'intermediate-invertibility-3d',
  track: 'intermediate',
  title: 'Invertibility',
  dimension: '3d',
  steps: [
    {
      id: 'recall-determinant-nonzero',
      title: 'Invertible means det ≠ 0',
      explanation:
        'A matrix is invertible exactly when its determinant is nonzero. Check the ' +
        'Properties panel: for this scaling matrix, det reads 8 and invertible reads yes. ' +
        'An invertible matrix can always be undone by another matrix, its inverse.',
      matrix: preset3d('Scale ×2'),
      vectors: [{ x: 1, y: 1, z: 1 }],
    },
    {
      id: 'the-inverse-matrix',
      title: 'The inverse undoes the transform',
      explanation:
        'The inverse of scale-by-2 is scale-by-0.5. This matrix is loaded on (2, 2, 2), ' +
        'where (1, 1, 1) landed after scaling, and it returns to (1, 1, 1).',
      matrix: [[0.5, 0, 0], [0, 0.5, 0], [0, 0, 0.5]],
      vectors: [{ x: 2, y: 2, z: 2 }],
      katex: 'A^{-1}A=I',
    },
    {
      id: 'no-inverse-when-det-zero',
      title: 'No inverse when det = 0',
      explanation:
        'Projecting onto the xy-plane has det = 0 - invertible reads no. It already ' +
        'flattened the z-axis to the origin (the Null Space lesson), so there is no way to ' +
        'tell which height a flattened point came from. Lost information cannot be ' +
        'recovered by any matrix.',
      matrix: preset3d('Project onto XY plane'),
      shapes: [UNIT_CUBE],
    },
    {
      id: 'putting-it-together',
      title: 'Several ways to say the same thing',
      explanation:
        'Invertible, det ≠ 0, rank 3, and "null space is just the origin" are all the same ' +
        'condition on a 3×3 matrix. Check any one in the Properties panel and you have ' +
        'checked them all. Rotations are always invertible - their inverse is simply the ' +
        'rotation backwards.',
      matrix: preset3d('Rotate Z 90°'),
      vectors: [E1],
    },
  ],
};

const eigenvectorsLesson: Lesson3D = {
  id: 'intermediate-eigenvectors-3d',
  track: 'intermediate',
  title: 'Eigenvectors',
  dimension: '3d',
  steps: [
    {
      id: 'what-is-an-eigenvector',
      title: 'A vector that only gets longer, not turned',
      explanation:
        'Take the stretch diag(2, 1, 0.5). Watch e1 = (1, 0, 0): it becomes (2, 0, 0) - the ' +
        'same direction, just longer. A vector whose direction a matrix leaves unchanged ' +
        '(only its length rescales) is an eigenvector.',
      matrix: preset3d('Stretch (2, 1, 0.5)'),
      vectors: [E1],
      katex: 'Av=\\lambda v',
    },
    {
      id: 'the-eigenvalue',
      title: 'The eigenvalue is the scale factor',
      explanation:
        'e3 is an eigenvector too, with a different scale factor: it shrinks to (0, 0, 0.5). ' +
        'That factor - 2 for e1, 1 for e2, 0.5 for e3 - is the eigenvalue. Check the ' +
        'Properties panel: eigenvalues reads 2, 1, 0.5.',
      matrix: preset3d('Stretch (2, 1, 0.5)'),
      vectors: [E1, E2, E3],
      overlays: ['eigenvectors'],
    },
    {
      id: 'not-every-vector-is-an-eigenvector',
      title: "Most vectors aren't eigenvectors",
      explanation:
        'Watch (1, 1, 1) under the same matrix: it becomes (2, 1, 0.5) - a different ' +
        'direction, not a rescaled copy. Only vectors on the special axes keep their ' +
        'direction; everything else is turned as well as stretched.',
      matrix: preset3d('Stretch (2, 1, 0.5)'),
      vectors: [{ x: 1, y: 1, z: 1 }],
      overlays: ['eigenvectors'],
    },
    {
      id: 'tilted-eigenvectors',
      title: 'Eigenvectors needn\'t line up with the axes',
      explanation:
        'This symmetric matrix has three eigen-directions: the yellow line along z ' +
        '(eigenvalue 4), the orange line along (1, 1, 0) (eigenvalue 3) and the pink line ' +
        'along (1, -1, 0) (eigenvalue 1). Each line is carried onto itself, only stretched ' +
        'by its eigenvalue. Symmetric matrices always have three perpendicular ' +
        'eigen-directions like this.',
      matrix: SYMMETRIC_3,
      vectors: [{ x: 1, y: 1, z: 0 }, { x: 1, y: -1, z: 0 }, E3],
      overlays: ['eigenvectors'],
    },
    {
      id: 'rotation-axis-is-an-eigenvector',
      title: 'Every 3D rotation has a real eigenvector: its axis',
      explanation:
        'In 2D a rotation had no real eigenvectors - every direction turned. In 3D there is ' +
        'always one that does not: the axis of rotation. Here e3 stays exactly where it is ' +
        '(eigenvalue 1) while everything else swings around it. Check the Properties panel: ' +
        'eigenvalues shows one real value, 1, and a ± pair with an i - the turning happening ' +
        'in the plane perpendicular to the axis.',
      matrix: preset3d('Rotate Z 90°'),
      vectors: [E1, E3],
      overlays: ['eigenvectors'],
    },
  ],
};

export const INTERMEDIATE_TRACK_3D: Lesson3D[] = [
  matrixCompositionLesson,
  determinantLesson,
  nullSpaceLesson,
  columnSpaceLesson,
  invertibilityLesson,
  eigenvectorsLesson,
];
