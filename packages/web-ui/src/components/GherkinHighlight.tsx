// @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/artifact-preview/spec.md
// Requirements implemented: FR-003
// Change: mspec-web-ui
// @mspec-delta 2026-05-26-041226-reading-mode-themes/specs/web-ui-themes/spec.md
// Requirements implemented: FR-002
// Change: reading-mode-themes

const EARS_RE = /\b(SHALL|MUST|SHOULD NOT|SHOULD|MAY|MUST NOT)\b/g;
const GHERKIN_RE = /^(GIVEN|WHEN|THEN|AND|BUT)(\s)/m;

// Use theme-neutral colors that work across light, sepia, green, and dark backgrounds
const EARS_CLASSES: Record<string, string> = {
  SHALL: 'text-red-700 [data-theme="dark"_&]:text-red-400 font-semibold',
  MUST: 'text-red-700 [data-theme="dark"_&]:text-red-400 font-semibold',
  'MUST NOT': 'text-red-700 [data-theme="dark"_&]:text-red-400 font-semibold',
  'SHOULD NOT': 'text-yellow-700 [data-theme="dark"_&]:text-yellow-400 font-semibold',
  SHOULD: 'text-yellow-700 [data-theme="dark"_&]:text-yellow-400 font-semibold',
  MAY: 'text-yellow-600 [data-theme="dark"_&]:text-yellow-300',
};

const GHERKIN_CLASSES: Record<string, string> = {
  GIVEN: 'text-green-800 [data-theme="dark"_&]:text-green-400 font-semibold',
  WHEN: 'text-green-800 [data-theme="dark"_&]:text-green-400 font-semibold',
  THEN: 'text-green-800 [data-theme="dark"_&]:text-green-400 font-semibold',
  AND: 'text-green-700 [data-theme="dark"_&]:text-green-500 font-semibold',
  BUT: 'text-green-700 [data-theme="dark"_&]:text-green-500 font-semibold',
};

export function GherkinHighlight({ code }: { code: string }) {
  const parts = tokenize(code);
  return (
    <code data-testid="gherkin-highlight">
      {parts.map((p, i) =>
        p.cls ? (
          <span key={i} className={p.cls}>
            {p.text}
          </span>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </code>
  );
}

interface Token {
  text: string;
  cls?: string;
}

function tokenize(code: string): Token[] {
  const tokens: Token[] = [];
  let remaining = code;

  while (remaining.length > 0) {
    EARS_RE.lastIndex = 0;
    const earsMatch = EARS_RE.exec(remaining);
    const gherkinMatch = GHERKIN_RE.exec(remaining);

    let match: RegExpExecArray | null = null;
    let cls = '';

    if (earsMatch && (!gherkinMatch || earsMatch.index <= gherkinMatch.index)) {
      match = earsMatch;
      cls = EARS_CLASSES[earsMatch[0]] ?? '';
    } else if (gherkinMatch) {
      match = gherkinMatch;
      cls = GHERKIN_CLASSES[gherkinMatch[1]] ?? '';
    }

    if (!match) {
      tokens.push({ text: remaining });
      break;
    }

    const before = remaining.slice(0, match.index);
    if (before) tokens.push({ text: before });

    const word = match[1] ?? match[0];
    tokens.push({ text: word, cls });

    remaining = remaining.slice(match.index + word.length);
  }

  return tokens;
}
