const LESSONS = [
  { phase: 'Beginner',       topics: ['Identity Matrix', 'Scaling', 'Reflection'] },
  { phase: 'Intermediate',   topics: ['Rotation', 'Shear', 'Composition of Transforms'] },
  { phase: 'Advanced',       topics: ['Determinant & Area', 'Eigenvalues & Eigenvectors', 'Rank & Nullspace'] },
  { phase: 'Decompositions', topics: ['LU Decomposition', 'QR Decomposition', 'SVD (Singular Value)'] },
];

export default function LearningPage() {
  return (
    <div className="flex flex-col items-center py-16 px-6 h-[calc(100vh-3.5rem)] overflow-y-auto">
      <div className="w-full max-w-lg">
        <h1 className="text-2xl font-bold text-white mb-1">Learning Pathway</h1>
        <p className="text-slate-400 text-sm mb-8">
          Structured lessons from Beginner to Decompositions — coming soon.
        </p>

        <div className="flex flex-col gap-6">
          {LESSONS.map((section) => (
            <div key={section.phase}>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                {section.phase}
              </p>
              <div className="flex flex-col gap-1">
                {section.topics.map((topic) => (
                  <div
                    key={topic}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg border border-white/5 bg-white/[0.02] opacity-40 cursor-not-allowed select-none"
                  >
                    <span className="w-2 h-2 rounded-full bg-slate-600 shrink-0" />
                    <span className="text-sm text-slate-300">{topic}</span>
                    <span className="ml-auto text-[10px] text-slate-600 uppercase tracking-wide">Soon</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-slate-700 text-center mt-10">Phase 3 of the timeline</p>
      </div>
    </div>
  );
}
