import { useAppStore, type CustomVector, type CustomVector3d } from '../store/appStore';
import VectorBracket from './VectorBracket';
import { seqLabel } from '../utils/labels';
import { CloseIcon } from './icons';

interface VectorPopupsProps {
  // The vector added most recently this session — its popup starts blank
  // with the cursor in x (see VectorBracket's autoFocusX) instead of
  // showing a default the user has to notice and clear first.
  freshVectorId: string | null;
}

// One small floating bracket per custom vector, stacked below the legend —
// replaces the itemized a/b/c list. Each is editable right here (via
// VectorBracket) and stays in sync with that same vector's chip in the
// always-visible equation panel underneath, since both read/write the
// same store entry. In 3D mode the brackets have a third (z) cell.
export default function VectorPopups({ freshVectorId }: VectorPopupsProps) {
  const mode = useAppStore((s) => s.mode);
  const customVectors = useAppStore((s) => s.customVectors);
  const customVectors3d = useAppStore((s) => s.customVectors3d);
  const removeVector = useAppStore((s) => s.removeVector);
  const removeVector3d = useAppStore((s) => s.removeVector3d);

  const is3d = mode === '3d';
  const vectors: (CustomVector | CustomVector3d)[] = is3d ? customVectors3d : customVectors;
  if (vectors.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 max-h-[55vh] overflow-y-auto font-sans">
      {vectors.map((v) => (
        <div
          key={v.id}
          className="group relative w-fit flex items-center gap-1.5 rounded-lg border border-line
                     bg-surface/70 backdrop-blur-md shadow-xl px-2.5 py-2"
        >
          <span className="text-xs font-semibold shrink-0" style={{ color: v.color }}>
            {seqLabel(v.seq)}
          </span>
          <VectorBracket
            id={v.id}
            x={v.x}
            y={v.y}
            z={'z' in v ? v.z : undefined}
            color={v.color}
            autoFocusX={v.id === freshVectorId}
          />
          <button
            onClick={() => (is3d ? removeVector3d(v.id) : removeVector(v.id))}
            aria-label="Remove vector"
            className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-ink-faint hover:text-danger
                       transition-opacity shrink-0"
          >
            <CloseIcon className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
