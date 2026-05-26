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
      mermaid.initialize({ startOnLoad: false, theme: 'default' });
      initialized = true;
    }

    const id = `mermaid-${Math.random().toString(36).slice(2)}`;
    mermaid
      .render(id, chart)
      .then(({ svg: rendered }) => setSvg(rendered))
      .catch((err: unknown) => setError(String(err)));
  }, [chart]);

  if (error) {
    return (
      <pre className="text-red-500 text-xs p-2 bg-red-50 dark:bg-red-900 rounded">{error}</pre>
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
