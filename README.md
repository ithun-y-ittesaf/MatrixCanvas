# MatrixCanvas

**MatrixCanvas** is an interactive, visual learning tool for linear algebra and 2D matrix transformations.

It combines a coordinate-plane playground with guided lessons so that concepts such as vectors, matrix multiplication, scaling, rotation, shear, reflection, determinants, eigenvectors, and matrix decompositions can be explored visually rather than only through equations.

> Built as a third-semester university project.

## ✨ Features

### 2D and 3D Modes

A **2D | 3D** toggle in the navigation bar switches the whole app between the plane and space, with the same UI in both:

* A 3×3 matrix editor, 3D presets (axis rotations, shears, plane reflections, projections), draggable 3D vectors, and cube / pyramid / sphere shapes with a live volume readout.
* Animate and scrub, a properties panel (determinant as volume, rank, eigenvalues, singular values), and shareable links (`?mode=3d`).
* Optional overlays: the unit sphere and its ellipsoid image, singular axes, eigenvector lines, and null space / column space drawn as lines or planes.
* A full 3D version of every lesson in all three tracks, including SVD shown as sphere → rotation → stretch → rotation. Pick the dimension with the toggle, then open **Learn**.

### Interactive Transformation Playground

The main Playground provides a 2D coordinate canvas where you can:

* Edit a **2×2 transformation matrix** directly.
* Add and manipulate **vectors**.
* Add **rectangles, triangles, and custom polygons**.
* See vectors and shapes before and after transformation.
* Drag vectors and shapes directly on the canvas.
* Zoom and navigate around the coordinate plane.
* Visualize transformed basis vectors and coordinate axes.
* See the transformed area of shapes.
* Animate transformations between matrix states.
* Scrub through an animation manually.

The canvas is rendered using the browser's **Canvas 2D API**, with matrix transformations applied to the underlying world coordinates.

### Matrix–Vector Visualization

MatrixCanvas keeps the mathematical representation visible alongside the graphical representation.

For each vector, the equation panel can display:

```text
M · v = v′
```

with the matrix, input vector, and transformed vector shown using mathematical notation rendered with KaTeX. Editing the matrix or vector updates the visualization live.

### Matrix Properties

The application can inspect important properties of a 2×2 matrix, including:

* Determinant
* Trace
* Rank
* Invertibility
* Orthogonality
* Symmetry
* Eigenvalues
* Singular values

The underlying `Matrix2x2` implementation also provides matrix inversion and decomposed interpolation for smooth transformation animations.

### Matrix Presets

The Playground includes preset transformations so common transformations can be explored without manually entering every matrix value.

Examples used throughout the learning material include:

* Identity
* Scaling
* Non-uniform scaling
* Rotation
* Horizontal shear
* Vertical shear
* Reflection
* Projection

The preset system is also used by the lessons to create consistent examples.

### Guided Learning Pathway

MatrixCanvas includes a dedicated **Learn** section containing structured lessons.

Lessons are divided into three tracks:

#### Beginner

* Vectors
* Matrix Multiplication
* Identity
* Scaling
* Rotation
* Shear
* Reflection

These lessons introduce vectors and the geometric meaning of basic matrix transformations.

#### Intermediate

* Matrix Composition
* Determinant
* Null Space
* Column Space
* Invertibility
* Eigenvectors

These lessons connect the geometry of transformations with core linear-algebra properties.

#### Decompositions

* Eigendecomposition
* Singular Value Decomposition (SVD)
* LU Decomposition
* QR Decomposition

These lessons use animated sequences to show how a matrix can be broken down into simpler transformations.

### Animated Decompositions

Decomposition lessons go beyond simply displaying the final matrix.

For supported lessons, MatrixCanvas animates the individual stages of a decomposition so that users can see how the transformations combine.

For example:

```text
A = P · D · P⁻¹
A = U · Σ · Vᵀ
A = L · U
A = Q · R
```

The decomposition system drives the same transformation canvas used by the regular Playground.

### Shareable Playground Links

The current Playground state can be encoded into the URL.

A shared link can preserve:

* Matrix values
* Vectors
* Shapes and their vertices

The state is encoded compactly rather than storing the entire scene as JSON, making links easier to share. The application also places limits on encoded scene sizes to prevent excessively large URLs.

### Lesson Locking

When a lesson is active, the Playground becomes focused on the current lesson.

Free-play controls are temporarily disabled while the lesson controls, equation panel, and animation controls remain available. This prevents unrelated interactions from accidentally changing the state required by a lesson.

---

## 🧮 Mathematical Model

MatrixCanvas currently focuses on **2D linear transformations using 2×2 matrices**.

A matrix

```text
| a  b |
| c  d |
```

transforms a vector

```text
| x |
| y |
```

into

```text
| ax + by |
| cx + dy |
```

The application's `Matrix2x2` class implements this multiplication directly, along with other matrix operations.

### Supported Matrix Operations

The internal matrix implementation includes:

* Matrix-vector multiplication
* Determinant
* Trace
* Rank
* Inverse
* Invertibility checks
* Orthogonality checks
* Symmetry checks
* Eigenvalue calculation
* Singular-value calculation
* Linear interpolation
* Decomposition-aware interpolation

Decomposition-aware interpolation is used to make animated transformations visually meaningful, particularly for rotations.

---

## 🏗️ Project Structure

The project is organized as a Vite + React + TypeScript application.

```text
MatrixCanvas/
├── docs/
│   └── design-report/
├── public/
├── src/
│   ├── components/
│   ├── lessons/
│   ├── lessons3d/
│   ├── math/
│   ├── pages/
│   ├── store/
│   ├── utils/
│   └── ...
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
└── vite.config.ts
```

### Important Areas

#### `src/components/`

Contains the interactive UI and visualization components, including:

* `TransformCanvas`
* `EquationPanel`
* `CanvasToolbar`
* `PropertiesPanel`
* `MatrixBracket`
* `VectorBracket`
* Lesson-related components
* Canvas controls and menus

#### `src/pages/`

The application currently has two primary routes:

```text
/       → Playground
/learn  → Learning Pathway
```

These are wired through React Router.

#### `src/math/`

Contains the mathematical implementation.

The central `Matrix2x2` class provides the matrix operations used throughout the application.

#### `src/store/`

Contains the application's Zustand state.

The main store keeps track of:

* Matrix values
* Animation state
* Vectors
* Shapes
* Lesson state
* Lesson progress

It also provides actions for adding, removing, and modifying vectors and shapes and for controlling lessons.

#### `src/lessons3d/`

3D versions of every lesson (`ALL_LESSONS_3D`), mirroring the 2D tracks. Tests pin every number the lesson text states.

#### `src/lessons/`

Contains the learning curriculum and lesson definitions.

The curriculum is assembled from:

```text
beginnerTrack
intermediateTrack
decompositionsTrack
```

through a single `ALL_LESSONS` collection.

#### `src/utils/`

Contains supporting functionality such as:

* URL state encoding/decoding
* Formatting
* Geometry calculations
* KaTeX rendering helpers
* Matrix presets
* Share-link functionality

---

## 🛠️ Tech Stack

MatrixCanvas is built with:

| Technology       | Purpose                              |
| ---------------- | ------------------------------------ |
| **React**        | UI and component architecture        |
| **TypeScript**   | Type-safe application code           |
| **Vite**         | Development server and build tooling |
| **React Router** | Application routing                  |
| **Zustand**      | Global application state             |
| **HTML Canvas**  | Interactive 2D visualization         |
| **mathjs**       | Mathematical utilities               |
| **KaTeX**        | Mathematical notation                |
| **GSAP**         | Animation                            |
| **Tailwind CSS** | Styling                              |
| **Vitest**       | Testing                              |
| **Inter**        | Application typography               |

These dependencies and development tools are defined in the project's `package.json`.

---

## 🚀 Getting Started

### Prerequisites

Make sure you have a recent version of **Node.js** and **npm** installed.

### 1. Clone the repository

```bash
git clone https://github.com/ithun-y-ittesaf/MatrixCanvas.git
cd MatrixCanvas
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

Vite will start the local development server and provide a URL to open in your browser.

### 4. Build for production

```bash
npm run build
```

### 5. Preview the production build

```bash
npm run preview
```

### 6. Run linting

```bash
npm run lint
```

### 7. Run tests

```bash
npm run test
```

The available npm scripts are defined in `package.json`.

---

## 🎮 Using MatrixCanvas

### Playground

Start at `/` to enter the interactive Playground.

A typical workflow is:

1. Choose a matrix preset or edit the matrix manually.
2. Add a vector or shape.
3. Observe how the matrix transforms it.
4. Modify the matrix values.
5. Compare the original and transformed geometry.
6. Use the Properties panel to inspect mathematical properties.
7. Animate the transformation to see the change continuously.

### Learning Mode

Open `/learn` to browse the learning tracks.

Selecting a lesson loads its initial state into the Playground and activates the guided lesson system.

Lessons progress through individual steps, with the canvas automatically configured for each concept.

### Sharing

Use the **Share** button in the Playground toolbar to create a link representing the current scene.

Opening the link reconstructs the matrix, vectors, and shapes from the URL parameters.

---

## 👥 Contributors

MatrixCanvas was created as a university project by:

* **Faiyaz Tahmid** — `230042107`
* **Abrar Faiyaz** — `230042108`
* **Ittesaf Ithun** — `230042125`
* **Tamim Naser** — `230042133`

The repository describes the project as a third-semester university project focused on learning linear algebra and transformations visually.

---

## 📚 Project Goal

Traditional linear algebra can be difficult to visualize.

MatrixCanvas is designed around the idea that a matrix should not only be presented as a grid of numbers, but also as a **transformation of space**.

Instead of only seeing:

```text
| a  b |
| c  d |
```

the user can see what that matrix actually does:

```text
vector → transformation → transformed vector
shape  → transformation → transformed shape
plane  → transformation → transformed plane
```

The learning system then builds from this geometric intuition toward more abstract concepts such as determinants, null spaces, eigenvectors, and matrix decompositions.

---

## 🔗 Repository

[MatrixCanvas on GitHub](https://github.com/ithun-y-ittesaf/MatrixCanvas)
