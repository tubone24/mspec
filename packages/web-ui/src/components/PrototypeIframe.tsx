// @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/artifact-preview/spec.md
// Requirements implemented: FR-005
// Change: mspec-web-ui

export function PrototypeIframe({ html }: { html: string }) {
  return (
    <iframe
      data-testid="prototype-iframe"
      sandbox="allow-scripts"
      srcDoc={html}
      className="w-full h-[80vh] border border-gray-200 dark:border-gray-700 rounded"
      title="Prototype preview"
    />
  );
}
