// @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/change-dashboard/spec.md
// Requirements implemented: FR-002
// Change: mspec-web-ui
// @mspec-delta 2026-05-25-062234-web-ui-viewer-improvements/specs/change-dashboard/spec.md
// Requirements implemented: FR-007
// Change: web-ui-viewer-improvements

import type { StepState } from '../api/client.js';

export const STEP_LABELS: Record<string, string> = {
  discover: 'Discover',
  spec:     'Spec',
  plan:     'Plan',
  impl:     'Impl',
  test:     'Test',
  docs:     'Docs',
  ship:     'Ship',
};

export function StepProgress({ steps, compact = false }: { steps: StepState[]; compact?: boolean }) {
  return (
    <div
      role="list"
      aria-label="Step progress"
      data-testid="step-progress"
      style={{ display: 'inline-flex', gap: compact ? 3 : 5, alignItems: 'center' }}
    >
      {steps.map((step) => (
        <span
          key={step.id}
          role="listitem"
          title={`${STEP_LABELS[step.id] ?? step.id}: ${step.state}`}
          style={{
            width: compact ? 18 : 22,
            height: compact ? 5 : 6,
            borderRadius: 2,
            background: `var(--${step.state})`,
            opacity: step.state === 'blocked' ? 0.6 : 1,
            transition: 'background-color .2s',
            display: 'inline-block',
          }}
        />
      ))}
    </div>
  );
}

export function StepProgressLabeled({ steps }: { steps: StepState[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${steps.length}, 1fr)`, gap: 4 }}>
      {steps.map((step) => (
        <div key={step.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{
            height: 4, borderRadius: 2,
            background: `var(--${step.state})`,
            opacity: step.state === 'blocked' ? 0.5 : 1,
            display: 'block',
          }} />
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10, letterSpacing: '0.5px',
            color: step.state === 'blocked' ? 'var(--ink-mute)' : 'var(--ink-soft)',
            textTransform: 'uppercase',
          }}>{STEP_LABELS[step.id] ?? step.id}</span>
        </div>
      ))}
    </div>
  );
}

export function StepLegend() {
  const entries: Array<{ state: StepState['state']; label: string }> = [
    { state: 'done',    label: 'Done' },
    { state: 'ready',   label: 'Ready' },
    { state: 'blocked', label: 'Blocked' },
    { state: 'skipped', label: 'Skipped' },
    { state: 'invalid', label: 'Invalid' },
  ];
  return (
    <div style={{ display: 'flex', gap: 14, fontSize: 11.5, color: 'var(--ink-mute)' }}>
      {entries.map((e) => (
        <span key={e.state} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={{
            width: 8, height: 8, borderRadius: 2,
            background: `var(--${e.state})`,
            opacity: e.state === 'blocked' ? 0.6 : 1,
            display: 'inline-block',
          }} />
          {e.label}
        </span>
      ))}
    </div>
  );
}
