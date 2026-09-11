import { useEffect, useRef, useState } from 'react';

// Copies the current page URL (the Playground's shareable link — see
// urlState.ts, which keeps matrix/vectors/shapes mirrored into it) and
// flips `copied` true for a short window so a caller can swap in a
// "Copied!" affordance — CanvasToolbar's Share icon uses it to show a
// small popup confirming the copy.
export function useCopyLink() {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const copyLink = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Fallback for browsers without Clipboard API access (e.g. non-secure
      // context) — a hidden textarea + the legacy copy command.
      const el = document.createElement('textarea');
      el.value = url;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopied(false), 1600);
  };

  return { copied, copyLink };
}
