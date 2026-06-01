// @mspec-delta 2026-05-30-223816-fix-mermaid-error-display/specs/artifact-preview/spec.md
// Requirements implemented: FR-015, FR-016
// Change: fix-mermaid-error-display

// @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/artifact-preview/spec.md
// Requirements implemented: FR-002
// Change: mspec-web-ui

import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

let initialized = false;

export function MermaidRenderer({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!initialized) {
      mermaid.initialize({ startOnLoad: false, theme: 'default', suppressErrorRendering: true });
      initialized = true;
    }

    let cancelled = false;
    const id = `mermaid-${Math.random().toString(36).slice(2)}`;

    void (async () => {
      try {
        await mermaid.parse(chart);
      } catch {
        if (!cancelled) setError('Mermaid 構文エラー');
        return;
      }
      try {
        const { svg: rendered } = await mermaid.render(id, chart);
        if (!cancelled) setSvg(rendered);
      } catch {
        if (!cancelled) setError('Mermaid 構文エラー');
      }
    })();

    return () => { cancelled = true; };
  }, [chart]);

  if (error) {
    return (
      <div
        data-testid="mermaid-error"
        className="text-amber-600 text-xs p-2 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-800"
      >
        ⚠ {error}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      data-testid="mermaid-svg"
      className="my-4"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
