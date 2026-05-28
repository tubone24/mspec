// @mspec-delta 2026-05-28-114434-fix-checklist-ui-sync/specs/artifact-preview/spec.md
// Requirements implemented: FR-013
// Change: fix-checklist-ui-sync

const CHECKBOX_RE = /^- \[[ x]\]/;

export function buildUpdatedChecklist(content: string, idx: number, checked: boolean): string {
  const lines = content.split('\n');
  let counter = 0;
  for (let i = 0; i < lines.length; i++) {
    if (CHECKBOX_RE.test(lines[i]!)) {
      if (counter === idx) {
        lines[i] = lines[i]!.replace(/^- \[[ x]\]/, checked ? '- [x]' : '- [ ]');
        break;
      }
      counter++;
    }
  }
  return lines.join('\n');
}

export function parseCheckedItems(content: string): Set<number> {
  const checked = new Set<number>();
  const lines = content.split('\n');
  let idx = 0;
  for (const line of lines) {
    if (CHECKBOX_RE.test(line)) {
      if (line.startsWith('- [x]')) checked.add(idx);
      idx++;
    }
  }
  return checked;
}
