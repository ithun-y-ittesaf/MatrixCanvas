import { useAppStore } from '../store/appStore';
import { PlayIcon } from './icons';

// Compact, always-visible Play + scrub control under the equation panel.
// Used to be a wide bar with Identity/Scrub/Transformed labels, gated
// behind the first Animate press — now it's half that width, label-free
// (the slider's own position already says "how transformed"), with Play
// folded directly into it so there's one persistent control instead of a
// slider that only shows up after you've found Play elsewhere.
export default function AnimateScrubBar() {
  const animProgress = useAppStore((s) => s.animProgress);
  const setAnimProgress = useAppStore((s) => s.setAnimProgress);
  const setIsScrubbing = useAppStore((s) => s.setIsScrubbing);
  const triggerAnimation = useAppStore((s) => s.triggerAnimation);

  return (
    <div
      className="rounded-xl border border-line bg-surface/70 backdrop-blur-md shadow-2xl
                 pl-2 pr-3 py-2 w-[190px] flex items-center gap-2 font-sans"
    >
      <button
        onClick={triggerAnimation}
        aria-label="Animate"
        title="Animate"
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0
                   bg-accent hover:bg-accent-strong active:scale-90 text-white transition-all"
      >
        <PlayIcon className="w-3.5 h-3.5" />
      </button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.001}
        value={animProgress}
        onChange={(e) => setAnimProgress(parseFloat(e.target.value))}
        onPointerDown={() => setIsScrubbing(true)}
        onPointerUp={() => setIsScrubbing(false)}
        onPointerCancel={() => setIsScrubbing(false)}
        onBlur={() => setIsScrubbing(false)}
        className="flex-1 accent-accent cursor-pointer"
        aria-label="Animation progress"
      />
    </div>
  );
}
