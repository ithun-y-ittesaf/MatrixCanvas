import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { PRESETS } from '../utils/presets';
import type { Matrix2x2Values } from '../math/Matrix2x2';

function toRaw(v: number): string {
  // Keep it concise — no trailing .0 noise
  return parseFloat(v.toFixed(6)).toString();
}

type Raw = [[string, string], [string, string]];

function fromStore(vals: Matrix2x2Values): Raw {
  return [
    [toRaw(vals[0][0]), toRaw(vals[0][1])],
    [toRaw(vals[1][0]), toRaw(vals[1][1])],
  ];
}

export default function MatrixInput() {
  const { matrixValues, setMatrixValue, setMatrixValues, triggerAnimation } = useAppStore();
  const [raw, setRaw] = useState<Raw>(() => fromStore(matrixValues));
  const [presetsOpen, setPresetsOpen] = useState(false);
  const presetsRef = useRef<HTMLDivElement>(null);

  // Sync raw display when a preset changes the store values
  const prevValRef = useRef(matrixValues);
  useEffect(() => {
    if (prevValRef.current !== matrixValues) {
      prevValRef.current = matrixValues;
      setRaw(fromStore(matrixValues));
    }
  }, [matrixValues]);

  // Close presets dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (presetsRef.current && !presetsRef.current.contains(e.target as Node)) {
        setPresetsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleChange = (r: 0 | 1, c: 0 | 1, val: string) => {
    setRaw((prev) => {
      const next: Raw = [[...prev[0]], [...prev[1]]];
      next[r][c] = val;
      return next;
    });
    const n = parseFloat(val);
    if (!isNaN(n)) setMatrixValue(r, c, n);
  };

  const applyPreset = (values: Matrix2x2Values) => {
    setMatrixValues(values);
    setRaw(fromStore(values));
    setPresetsOpen(false);
  };

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      {/* Matrix display */}
      <div className="flex items-center gap-0">
        {/* Left bracket */}
        <div
          className="self-stretch"
          style={{
            width: 10,
            borderLeft: '2px solid #64748b',
            borderTop: '2px solid #64748b',
            borderBottom: '2px solid #64748b',
            borderRadius: '3px 0 0 3px',
          }}
        />

        {/* 2×2 inputs */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 px-3 py-2">
          {([0, 1] as const).map((r) =>
            ([0, 1] as const).map((c) => (
              <input
                key={`${r}${c}`}
                type="text"
                inputMode="decimal"
                value={raw[r][c]}
                onFocus={(e) => e.target.select()}
                onChange={(e) => handleChange(r, c, e.target.value)}
                className="w-16 text-center bg-transparent text-white font-mono text-lg
                           border-b-2 border-slate-600 focus:border-blue-400 focus:outline-none
                           transition-colors pb-0.5"
              />
            ))
          )}
        </div>

        {/* Right bracket */}
        <div
          className="self-stretch"
          style={{
            width: 10,
            borderRight: '2px solid #64748b',
            borderTop: '2px solid #64748b',
            borderBottom: '2px solid #64748b',
            borderRadius: '0 3px 3px 0',
          }}
        />
      </div>

      {/* Animate button */}
      <button
        onClick={triggerAnimation}
        className="w-full px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 active:scale-95
                   text-white text-sm font-semibold transition-all"
      >
        Animate
      </button>

      {/* Presets dropdown */}
      <div ref={presetsRef} className="relative w-full">
        <button
          onClick={() => setPresetsOpen((o) => !o)}
          className="w-full px-4 py-1.5 rounded-lg border border-white/10 text-slate-400
                     hover:text-white hover:border-white/20 text-xs transition-colors text-center"
        >
          Presets ▾
        </button>

        <div
          className={`absolute bottom-full mb-1 left-0 right-0 rounded-lg
                      bg-[#1a1d2e] border border-white/10 overflow-hidden z-10 shadow-xl
                      transition-all duration-150 ease-out origin-bottom
                      ${presetsOpen
                        ? 'opacity-100 translate-y-0 pointer-events-auto'
                        : 'opacity-0 translate-y-1 pointer-events-none'}`}
        >
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => applyPreset(p.values)}
              className="block w-full text-left px-3 py-2 text-sm text-slate-300
                         hover:bg-white/5 hover:text-white transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
