import katex from 'katex';

// Renders a KaTeX source string to an { __html } object suitable for
// dangerouslySetInnerHTML. Safe here specifically because every caller
// builds its `tex` string from numbers we've already parsed with
// parseFloat/fmt (never from raw user text), plus a small set of
// hardcoded hex colors — there's no path for arbitrary user HTML/LaTeX to
// reach this function.
export function katexHtml(tex: string, displayMode = false): { __html: string } {
  return {
    __html: katex.renderToString(tex, { throwOnError: false, displayMode }),
  };
}
