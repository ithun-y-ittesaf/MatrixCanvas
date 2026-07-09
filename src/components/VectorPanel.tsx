import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { Matrix2x2 } from '../math/Matrix2x2';

function fmt(n: number): string {
  return parseFloat(n.toFixed(4)).toString();
}

export default function VectorPanel() {
  const { matrixValues, customVectors, addVector, removeVector } = useAppStore();
  const [x, setX] = useState('1');
  const [y, setY] = useState('1');

  const m = new Matrix2x2(matrixValues);

  const handleAdd = () => {
    const nx = parseFloat(x);
    const ny = parseFloat(y);
    if (isNaN(nx) || isNaN(ny)) return;
    addVector(nx, ny);
  };

  return (
    <div
      className="rounded-xl border border-white/10 px-4 py-3 text-xs font-mono
                 bg-black/50 backdrop-blur-md flex flex-col gap-2"
      style={{ minWidth: 210 }}
    >
      <p className="text-slate-500 uppercase tracking-widest text-[10px] font-sans">
        Vectors
      </p>

      <div className="flex items-center gap-1.5">
        <span className="text-slate-400">(</span>
        <input
          type="text"
          inputMode="decimal"
          value={x}
          onFocus={(e) => e.target.select()}
          onChange={(e) => setX(e.target.value)}
          className="w-12 text-center bg-transparent text-white border-b border-slate-600
                     focus:border-blue-400 focus:outline-none transition-colors"
        />
        <span className="text-slate-400">,</span>
        <input
          type="text"
          inputMode="decimal"
          value={y}
          onFocus={(e) => e.target.select()}
          onChange={(e) => setY(e.target.value)}
          className="w-12 text-center bg-transparent text-white border-b border-slate-600
                     focus:border-blue-400 focus:outline-none transition-colors"
        />
        <span className="text-slate-400">)</span>
        <button
          onClick={handleAdd}
          className="ml-auto px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-500
                     active:scale-95 text-white font-sans transition-all"
        >
          Add
        </button>
      </div>

      {customVectors.length > 0 && (
        <div className="flex flex-col gap-1 border-t border-white/5 pt-1.5 max-h-40 overflow-y-auto">
          {customVectors.map((v) => {
            const [tx, ty] = m.multiply([v.x, v.y]);
            return (
              <div key={v.id} className="flex items-center justify-between gap-2">
                <span style={{ color: v.color }}>
                  ({fmt(v.x)}, {fmt(v.y)}) → ({fmt(tx)}, {fmt(ty)})
                </span>
                <button
                  onClick={() => removeVector(v.id)}
                  className="text-slate-500 hover:text-red-400 font-sans transition-colors"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
