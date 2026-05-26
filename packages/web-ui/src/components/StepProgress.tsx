// @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/change-dashboard/spec.md
// Requirements implemented: FR-002
// Change: mspec-web-ui
// @mspec-delta 2026-05-25-062234-web-ui-viewer-improvements/specs/change-dashboard/spec.md
// Requirements implemented: FR-007
// Change: web-ui-viewer-improvements

import type { StepState } from '../api/client.js';

const STATE_COLORS: Record<string, string> = {
  done:    'bg-green-500',
  ready:   'bg-blue-400 animate-pulse',
  blocked: 'bg-gray-200 dark:bg-gray-600',
  skipped: 'bg-yellow-300',
  invalid: 'bg-red-400',
};

export function StepProgress({ steps }: { steps: StepState[] }) {
  return (
    <div className="flex gap-1 items-center" data-testid="step-progress">
      {steps.map((step) => (
        <div
          key={step.id}
          title={`${step.id}: ${step.state}`}
          className={`h-2 w-4 rounded-sm ${STATE_COLORS[step.state] ?? 'bg-gray-200'}`}
        />
      ))}
    </div>
  );
}
