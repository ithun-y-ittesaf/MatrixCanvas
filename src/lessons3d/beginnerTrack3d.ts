import type { Lesson3D } from '../lessons/types';
import { E1, E2, E3, IDENTITY_3, UNIT_CUBE, preset3d } from './helpers3d';

// 3D mirror of the Beginner track: the same seven lessons, with the third axis
// doing real work - rotation happens about an axis, reflection across a plane,
// shear slides one axis in proportion to another. The cube of side 1 that
// stands in for the 2D rectangle has volume 1, so the canvas's "Vol" label
// doubles as a determinant readout.

const vectorsLesson: Lesson3D = {
  id: 'beginner-vectors-3d',
  track: 'beginner',
  title: 'Vectors',
  dimension: '3d',
  steps: [
    {
      id: 'what-is-a-vector',
      title: 'What is a 3D vector?',
      explanation:
        'A vector in space is a triple of numbers (x, y, z) - an arrow from the origin to the ' +
        'point (x, y, z). The three numbers say how far to go along each axis: x (red), y ' +
        '(blue) and z (green, pointing up). Drag the view to orbit around the arrow on the ' +
        "canvas: it's the vector (2, 1, 3).",
      matrix: IDENTITY_3,
      vectors: [{ x: 2, y: 1, z: 3 }],
      katex: 'v=\\begin{bmatrix}2 \\\\ 1 \\\\ 3\\end{bmatrix}',
    },
    {
      id: 'basis-vectors',
      title: 'The standard basis vectors',
      explanation:
        'Three special vectors get used constantly: e1 = (1, 0, 0) along the x-axis, ' +
        'e2 = (0, 1, 0) along y, and e3 = (0, 0, 1) along z. Together they are the standard ' +
        'basis - every other vector in space is built out of them, as the next step shows.',
      matrix: IDENTITY_3,
      vectors: [E1, E2, E3],
      katex:
        'e_1=\\begin{bmatrix}1 \\\\ 0 \\\\ 0\\end{bmatrix},\\ ' +
        'e_2=\\begin{bmatrix}0 \\\\ 1 \\\\ 0\\end{bmatrix},\\ ' +
        'e_3=\\begin{bmatrix}0 \\\\ 0 \\\\ 1\\end{bmatrix}',
    },
    {
      id: 'linear-combination',
      title: 'Any vector is a combination of e1, e2 and e3',
      explanation:
        'The vector (2, 1, 3) is 2 copies of e1, plus 1 of e2, plus 3 of e3: ' +
        'v = 2·e1 + 1·e2 + 3·e3. In general (x, y, z) = x·e1 + y·e2 + z·e3. This is the idea ' +
        'that makes matrix multiplication work - a 3×3 matrix is defined entirely by where it ' +
        'sends e1, e2 and e3.',
      matrix: IDENTITY_3,
      vectors: [{ x: 2, y: 1, z: 3 }, E1, E2, E3],
      katex:
        'v=x\\begin{bmatrix}1 \\\\ 0 \\\\ 0\\end{bmatrix}+y\\begin{bmatrix}0 \\\\ 1 \\\\ 0\\end{bmatrix}' +
        '+z\\begin{bmatrix}0 \\\\ 0 \\\\ 1\\end{bmatrix}',
    },
  ],
};

const matrixMultiplicationLesson: Lesson3D = {
  id: 'beginner-matrix-multiplication-3d',
  track: 'beginner',
  title: 'Matrix Multiplication',
  dimension: '3d',
  steps: [
    {
      id: 'identity-does-nothing',
      title: 'Multiplying by the identity matrix',
      explanation:
        'A 3×3 matrix is a table of nine numbers that defines a transformation of space - feed ' +
        'it a vector, get a new vector out. The simplest one is the identity matrix: ' +
        'multiplying any vector by it gives back that same vector, just as multiplying a ' +
        'number by 1 does.',
      matrix: IDENTITY_3,
      vectors: [{ x: 1, y: 1, z: 1 }],
      katex:
        '\\begin{bmatrix}1 & 0 & 0 \\\\ 0 & 1 & 0 \\\\ 0 & 0 & 1\\end{bmatrix}' +
        '\\begin{bmatrix}1 \\\\ 1 \\\\ 1\\end{bmatrix}=\\begin{bmatrix}1 \\\\ 1 \\\\ 1\\end{bmatrix}',
    },
    {
      id: 'how-the-multiply-works',
      title: 'How matrix-vector multiplication works',
      explanation:
        'Each output component is the dot product of one row of the matrix with the vector: ' +
        'row 1 gives the new x, row 2 the new y, row 3 the new z. Try it with the scaling ' +
        'matrix below on (1, 1, 1) - each row picks out one component and doubles it.',
      matrix: preset3d('Scale ×2'),
      vectors: [{ x: 1, y: 1, z: 1 }],
      katex:
        '\\begin{bmatrix}a & b & c \\\\ d & e & f \\\\ g & h & i\\end{bmatrix}' +
        '\\begin{bmatrix}x \\\\ y \\\\ z\\end{bmatrix}=' +
        '\\begin{bmatrix}ax+by+cz \\\\ dx+ey+fz \\\\ gx+hy+iz\\end{bmatrix}',
    },
    {
      id: 'transform-the-whole-space',
      title: 'A matrix moves all of space at once',
      explanation:
        "Every point gets multiplied by the same matrix - that's why a whole solid moves " +
        'together instead of falling apart. Watch the cube grow uniformly as the same scaling ' +
        'matrix is applied to all eight of its corners at once.',
      matrix: preset3d('Scale ×2'),
      shapes: [UNIT_CUBE],
    },
  ],
};

const identityLesson: Lesson3D = {
  id: 'beginner-identity-3d',
  track: 'beginner',
  title: 'Identity',
  dimension: '3d',
  steps: [
    {
      id: 'the-identity-matrix',
      title: 'The identity matrix',
      explanation:
        'The identity matrix leaves every vector exactly where it is. It is the "do nothing" ' +
        'transformation - the baseline every other matrix in this track gets compared against.',
      matrix: IDENTITY_3,
      vectors: [{ x: 1, y: 1, z: 1 }],
      katex: 'I=\\begin{bmatrix}1 & 0 & 0 \\\\ 0 & 1 & 0 \\\\ 0 & 0 & 1\\end{bmatrix}',
    },
    {
      id: 'columns-are-basis-images',
      title: 'Its columns are where e1, e2 and e3 land',
      explanation:
        'A fact that generalizes to every matrix: column 1 is where it sends e1, column 2 is ' +
        'where it sends e2, column 3 is where it sends e3. The identity leaves all three ' +
        'where they are, which is exactly why its columns are (1, 0, 0), (0, 1, 0) and (0, 0, 1).',
      matrix: IDENTITY_3,
      vectors: [E1, E2, E3],
    },
    {
      id: 'shapes-unchanged-too',
      title: 'Solids pass through unchanged too',
      explanation:
        'Because every point gets the same treatment, a cube under the identity comes out ' +
        'exactly as it went in - and its volume label still reads 1. Every lesson from here ' +
        'shows a matrix that does something to this same cube.',
      matrix: IDENTITY_3,
      shapes: [UNIT_CUBE],
    },
  ],
};

const scalingLesson: Lesson3D = {
  id: 'beginner-scaling-3d',
  track: 'beginner',
  title: 'Scaling',
  dimension: '3d',
  steps: [
    {
      id: 'recall-identity-scaling',
      title: 'Starting point: identity',
      explanation:
        'The identity leaves vectors unchanged. Scaling is the first matrix that actually ' +
        'changes something: it stretches or shrinks space along the axes.',
      matrix: IDENTITY_3,
      vectors: [{ x: 1, y: 1, z: 1 }],
    },
    {
      id: 'uniform-scaling',
      title: 'Uniform scaling',
      explanation:
        'This matrix has 2 on every diagonal entry and 0 elsewhere, so it doubles all three ' +
        'components: every vector ends up twice as long in the same direction. Equal factors ' +
        'on all three axes is called uniform scaling.',
      matrix: preset3d('Scale ×2'),
      vectors: [{ x: 1, y: 1, z: 1 }],
      katex:
        '\\begin{bmatrix}2 & 0 & 0 \\\\ 0 & 2 & 0 \\\\ 0 & 0 & 2\\end{bmatrix}' +
        '\\begin{bmatrix}1 \\\\ 1 \\\\ 1\\end{bmatrix}=\\begin{bmatrix}2 \\\\ 2 \\\\ 2\\end{bmatrix}',
    },
    {
      id: 'non-uniform-scaling',
      title: 'Non-uniform scaling',
      explanation:
        'The three diagonal entries need not match. This one stretches x by 2, leaves y ' +
        'alone, and squashes z to half - the cube becomes a long, flat slab. Notice the ' +
        'volume label still reads 1: 2 × 1 × 0.5 = 1, so the stretch and the squash cancel ' +
        'exactly even though the shape changed a lot.',
      matrix: preset3d('Stretch (2, 1, 0.5)'),
      shapes: [UNIT_CUBE],
      katex: '\\begin{bmatrix}2 & 0 & 0 \\\\ 0 & 1 & 0 \\\\ 0 & 0 & 0.5\\end{bmatrix}',
    },
    {
      id: 'negative-scale-is-a-flip',
      title: 'A negative scale factor flips an axis',
      explanation:
        'A negative diagonal entry flips that axis. This matrix keeps x and y and sends z to ' +
        '-z, so every point lands on the opposite side of the xy-plane - a mirror image. ' +
        "You'll meet this properly in the Reflection lesson.",
      matrix: preset3d('Reflect over XY plane'),
      shapes: [UNIT_CUBE],
      katex: '\\begin{bmatrix}1 & 0 & 0 \\\\ 0 & 1 & 0 \\\\ 0 & 0 & -1\\end{bmatrix}',
    },
  ],
};

const rotationLesson: Lesson3D = {
  id: 'beginner-rotation-3d',
  track: 'beginner',
  title: 'Rotation',
  dimension: '3d',
  steps: [
    {
      id: 'recall-identity-rotation',
      title: 'Starting point: identity',
      explanation:
        'In the plane, a rotation turns everything about the origin. In space you must say ' +
        'which axis you rotate about - the line that stays put while everything else swings ' +
        'around it.',
      matrix: IDENTITY_3,
      vectors: [E1],
    },
    {
      id: 'rotate-about-z',
      title: 'Rotating about the z-axis',
      explanation:
        'This matrix rotates 90° counter-clockwise about the z-axis (seen from above). Watch ' +
        'e1, pointing along x, swing to (0, 1, 0) along y. Look at its top-left 2×2 block: ' +
        "it's exactly the 2D rotation matrix, with a 1 in the corner because z doesn't move. " +
        "Anything you learned about 2D rotation is happening in the xy-plane here.",
      matrix: preset3d('Rotate Z 90°'),
      vectors: [E1, E3],
      katex:
        'R_z(\\theta)=\\begin{bmatrix}\\cos\\theta & -\\sin\\theta & 0 \\\\ ' +
        '\\sin\\theta & \\cos\\theta & 0 \\\\ 0 & 0 & 1\\end{bmatrix}',
    },
    {
      id: 'rotate-about-x-and-y',
      title: 'Rotating about the other axes',
      explanation:
        'The same idea about the x-axis: e2 = (0, 1, 0) swings up to (0, 0, 1) while e1 ' +
        'stays put. About the y-axis, e3 swings to (1, 0, 0). Each axis of rotation has its ' +
        'own matrix, with the 1 sitting on that axis. Here: 90° about x.',
      matrix: preset3d('Rotate X 90°'),
      vectors: [E1, E2],
      katex:
        'R_x(\\theta)=\\begin{bmatrix}1 & 0 & 0 \\\\ 0 & \\cos\\theta & -\\sin\\theta \\\\ ' +
        '0 & \\sin\\theta & \\cos\\theta\\end{bmatrix}',
    },
    {
      id: 'rotation-about-a-diagonal',
      title: 'Rotating about any axis',
      explanation:
        'You can rotate about any line through the origin, not just the coordinate axes. This ' +
        'matrix rotates 120° about the diagonal through (1, 1, 1): it sends e1 to e2, e2 to ' +
        'e3 and e3 back to e1. The yellow line is that axis - the one direction the rotation ' +
        'leaves fixed (an eigenvector, which you will meet in the Intermediate track).',
      matrix: preset3d('Rotate 120° about (1,1,1)'),
      vectors: [E1, E2, E3],
      overlays: ['eigenvectors'],
    },
    {
      id: 'rotation-preserves-shape',
      title: 'Rotation preserves size and shape',
      explanation:
        "Like in 2D, rotation is a rigid motion: it never stretches or squashes. Watch the " +
        'cube turn about the axis without changing its edge lengths - its volume label stays ' +
        'at exactly 1.',
      matrix: preset3d('Rotate 120° about (1,1,1)'),
      shapes: [UNIT_CUBE],
    },
  ],
};

const shearLesson: Lesson3D = {
  id: 'beginner-shear-3d',
  track: 'beginner',
  title: 'Shear',
  dimension: '3d',
  steps: [
    {
      id: 'recall-identity-shear',
      title: 'Starting point: identity',
      explanation:
        'Starting from the plain cube. A shear slides one axis sideways in proportion to ' +
        'another, turning right angles into slanted ones.',
      matrix: IDENTITY_3,
      shapes: [UNIT_CUBE],
    },
    {
      id: 'shear-x-by-y',
      title: 'Shearing x by y',
      explanation:
        'This matrix leaves e1 and e3 alone but sends e2 = (0, 1, 0) to (1, 1, 0): each ' +
        "point's x shifts by an amount equal to its y. The face at larger y slides along x " +
        'while the face at y = 0 stays put, so the cube leans. The z direction is ' +
        "untouched, so this is exactly the 2D horizontal shear applied to every layer.",
      matrix: preset3d('Shear X by Y'),
      shapes: [UNIT_CUBE],
      katex: '\\begin{bmatrix}1 & 1 & 0 \\\\ 0 & 1 & 0 \\\\ 0 & 0 & 1\\end{bmatrix}',
    },
    {
      id: 'shear-x-by-z',
      title: 'Shearing x by z',
      explanation:
        'A shear can use the new axis too. Here x shifts by an amount equal to z: the top ' +
        'face of the cube slides along x while the bottom stays put. Look at the volume ' +
        'label: a shear changes the shape a lot but the volume stays exactly 1 - sliding ' +
        'layers past each other never changes how much room they take up.',
      matrix: preset3d('Shear X by Z'),
      shapes: [UNIT_CUBE],
      katex: '\\begin{bmatrix}1 & 0 & 1 \\\\ 0 & 1 & 0 \\\\ 0 & 0 & 1\\end{bmatrix}',
    },
  ],
};

const reflectionLesson: Lesson3D = {
  id: 'beginner-reflection-3d',
  track: 'beginner',
  title: 'Reflection',
  dimension: '3d',
  steps: [
    {
      id: 'recall-identity-reflection',
      title: 'Starting point: identity',
      explanation:
        "In the plane you reflect across a line; in space you reflect across a plane - a " +
        'mirror. The vector (2, 1, 1) sits exactly where it is plotted. A reflection sends it ' +
        'to its mirror image on the other side of the plane.',
      matrix: IDENTITY_3,
      vectors: [{ x: 2, y: 1, z: 1 }],
    },
    {
      id: 'reflect-over-xy-plane',
      title: 'Reflecting over the xy-plane',
      explanation:
        'This matrix keeps x and y and flips the sign of z. The xy-plane is the mirror: ' +
        '(2, 1, 1) lands at (2, 1, -1), the same distance below the plane as it started above.',
      matrix: preset3d('Reflect over XY plane'),
      vectors: [{ x: 2, y: 1, z: 1 }],
      katex:
        '\\begin{bmatrix}1 & 0 & 0 \\\\ 0 & 1 & 0 \\\\ 0 & 0 & -1\\end{bmatrix}' +
        '\\begin{bmatrix}2 \\\\ 1 \\\\ 1\\end{bmatrix}=\\begin{bmatrix}2 \\\\ 1 \\\\ -1\\end{bmatrix}',
    },
    {
      id: 'reflect-over-yz-plane',
      title: 'Reflecting over the yz-plane',
      explanation:
        'Flip the sign of x instead and the yz-plane is the mirror: (2, 1, 1) lands at ' +
        '(-2, 1, 1). Each coordinate plane has its own reflection.',
      matrix: preset3d('Reflect over YZ plane'),
      vectors: [{ x: 2, y: 1, z: 1 }],
      katex:
        '\\begin{bmatrix}-1 & 0 & 0 \\\\ 0 & 1 & 0 \\\\ 0 & 0 & 1\\end{bmatrix}' +
        '\\begin{bmatrix}2 \\\\ 1 \\\\ 1\\end{bmatrix}=\\begin{bmatrix}-2 \\\\ 1 \\\\ 1\\end{bmatrix}',
    },
    {
      id: 'reflection-flips-handedness',
      title: 'A reflection turns a solid inside out',
      explanation:
        'A mirror image of your right hand is a left hand - no rotation can turn one into ' +
        'the other. The same holds here: the reflected cube looks identical, but its ' +
        'orientation is reversed, which the determinant records as -1 (see the Intermediate ' +
        "track's Determinant lesson).",
      matrix: preset3d('Reflect over XY plane'),
      shapes: [UNIT_CUBE],
    },
  ],
};

export const BEGINNER_TRACK_3D: Lesson3D[] = [
  vectorsLesson,
  matrixMultiplicationLesson,
  identityLesson,
  scalingLesson,
  rotationLesson,
  shearLesson,
  reflectionLesson,
];
