# Self-Review: 2026-05-14-022259-claude-core-completion

> Step: self-review | Reviewer: mspec-self-reviewer (independent pass)
> Produces: [] — this file is durable scratch, not a workflow artifact.

## Scope reviewed

proposal.md, readme.md, research.md, design.md, architecture-overview.md, quickstart.md,
checklist.md, 4 Delta Specs (`cli-spec-lint`, `cli-anchor`, `cli-archive`, `cli-workflow-engine`),
and the live codebase under `packages/cli/src` + `memory/constitution.md` + `.mspec/workflow.yaml`.

## Findings

### Findings

- **[blocker] `memory/constitution.md` is still the bare template; design.md's Constitution Check
  tables reference 5 named principles that do not exist in the file.** Confirmed real. The file
  (`memory/constitution.md:9-13`) contains only `### I. <Principle Name>` / `### II. <Principle Name>`
  with `<本文>` bodies — 2 placeholder headings, no names, no text. design.md (Phase 0 table
  lines 35-41, Phase 1 table lines 111-117) and architecture-overview.md (lines 171-177) all
  enumerate `I. ステップ独立性 / II. 決定論的マージ / III. 質問駆動 / IV. 双方向アンカー /
  V. 強制・拡張ステップ分離`. None of those names are in the constitution file. proposal.md
  line 48 and research.md line 65 are *honest* about this — they explicitly say they treat
  `docs/design/mspec-design.md §1.2`'s P1-P5 as the de-facto constitution. design.md does NOT
  carry that disclaimer; its tables read as if the constitution file actually defines these.
  This is the checklist's【重大】item and it is correctly flagged. **Severity: blocker** for
  internal consistency, **but not blocker for implementation** — see "Assessment" below.

- **[blocker] FR-016 (cli-workflow-engine) scenario hardcodes `I. Library-First` / `II. CLI Interface`,
  which exist in neither `memory/constitution.md` nor design.md's principle list.** Confirmed real
  (`specs/cli-workflow-engine/spec.md:22-24`). These names appear to be borrowed from a generic
  spec-kit example and were never reconciled with this project's principle set. The Delta Spec
  scenario is still *implementable* (it describes parser behavior over an arbitrary constitution
  file and an E2E can supply a fixture constitution containing exactly those two headings — research.md
  line 15 and checklist.md line 54 both anticipate a fixture). But it is a documentation smell:
  a reader comparing the scenario against the real constitution will be confused. **Severity: nit
  for implementability, blocker for spec hygiene** — the scenario should either use the project's
  real principle names or be explicitly annotated as using a synthetic fixture.

- **[nit] cli-workflow-engine FR-015 is mislabeled as ADDED but is "formalization of an
  already-shipped field".** `ContinueOutput.upstream_skipped` already exists and is populated
  (`commands/continue.ts:22` type field, `:39` + `:89` wiring, `:106` empty-array default). The
  Delta Spec puts FR-015 under `## ADDED Requirements` with no note. research.md line 14 and
  design.md (Goals line 12) are candid that this is "regression-fixing E2E formalization", and
  checklist.md line 36 explicitly flags the ADDED-vs-already-implemented ambiguity. The spec text
  itself gives no signal. This does not break the build, but an `archive` merge will insert FR-015
  into the SoT `cli-workflow-engine/spec.md` as a brand-new requirement when the behavior already
  shipped under the umbrella of existing SoT FR-010/011. **Severity: nit** — acceptable under the
  proposal's stated "spec化漏れの解消" intent, but the Delta Spec should say so in-line.

- **[nit] cli-spec-lint Delta FRs are entirely "formalization, zero code change" (design.md D5).**
  Confirmed: `specs/cli-spec-lint/spec.md` SoT is an empty skeleton (Purpose `<...>` placeholder,
  no Requirements), and `lib/spec-linter.ts` already implements 3-category linting, HTML-comment
  +fence masking (lines 62-63), stable sort (lines 93-97), and `validate --strict` integration
  (`commands/validate.ts:46-58`). FR-001~010 are clean ADDs (no ID collision — SoT has no FRs).
  The philosophical "can you ADD a requirement without writing code" question is acknowledged in
  design.md D5. Acceptable, but tasks.md must ensure each of these 10 FRs gets an `@mspec-delta`
  anchor on its E2E test file (checklist.md line 55 covers this) — otherwise P4 (bidirectional
  anchor) is violated for 10 FRs.

- **[nit] Mermaid hard-fail in *non-strict* validate — wiring is sound, worth a confirmation note.**
  design.md D3 + research.md line 12 require Mermaid enforcement in plain `mspec validate` (not
  just `--strict`). `validateArtifact` receives `filePath` and `produces` unconditionally
  (`commands/validate.ts:88-93`); only `constitutionRequired` is strict-gated. So a new branch
  `filePath.endsWith('/architecture-overview.md')` inside `validateArtifact`
  (`lib/artifact-validator.ts:17-41`) will correctly fire in non-strict mode. No contradiction —
  but note that `validateArtifact` currently early-returns for delta-spec files (line 26-31);
  the new branch must be placed so it is reached for `architecture-overview.md` (it will be, since
  that path does not end with `/spec.md`). Implementation ordering matters; flag for tasks/implement.

- **[nit] Quickstart Golden Path step 1 may fail today due to the【重大】constitution gap.**
  quickstart.md step 1 runs `mspec validate --change <self> --strict`. Under `--strict`,
  `validateOne` sets `constitutionRequired = true` for constitution_check steps and
  `validateArtifact` requires a `## Constitution Check` section — every produced artifact here
  has one, so that passes. But step 3 (`mspec continue --json | ... constitution_principles`)
  expects the array to contain `I. ステップ独立性 ... V. 強制/拡張ステップ分離` (quickstart.md
  line 45, 70). FR-016's parser extracts H3 names from `memory/constitution.md` — which currently
  yields `<Principle Name>` x2, NOT the 5 names. So quickstart step 3 / Verify line 70 is
  **not executable as written against the current constitution file**. This is a direct downstream
  consequence of the【重大】finding and confirms its blocking nature for the dogfooding promise
  (proposal.md Goals line 17-18). The Troubleshooting row at quickstart.md:84 hints at the H3
  format but does not call out that the repo's own constitution is a placeholder.

- **[nit] cli-anchor FR-005 MODIFIED — verify the SoT original is genuinely being narrowed, not
  contradicted.** SoT `cli-anchor/spec.md:53` "FR-005 — Incomplete anchor block is a hard failure"
  with scenario at :57 (`Change:` line missing → non-zero exit). The Delta MODIFIED FR-005
  (`specs/cli-anchor/spec.md:46-57`) keeps that exact scenario ("`Change:` 行欠落で check が失敗する")
  and *adds* a narrowing clause (only block-shaped neighborhoods fail) plus a new negative scenario.
  This is a proper MODIFY: the original hard-fail contract is preserved, the false-positive surface
  is reduced. Consistent. No blocker — listed so the human knows it was checked.

- **[nit] All design.md "existing file" claims verified true.** `parser/anchor.ts`,
  `lib/anchor-scanner.ts`, `lib/spec-linter.ts`, `commands/archive.ts`, `commands/continue.ts`,
  `lib/artifact-validator.ts`, `commands/spec-lint.ts`, `lib/archive-merger.ts`,
  `lib/spec-forbidden.ts`, `commands/constitution.ts`, `commands/validate.ts` all exist. Line-number
  citations in research.md spot-checked: `anchor.ts:4-8` (PATH_RE/REQS_RE/CHANGE_RE) ✓,
  `anchor.ts:42-50` (early-push warning loop) ✓, `anchor-scanner.ts:5-14` DEFAULT_IGNORE is 8
  entries not "7 directories" (research.md line 32 says 7 — minor miscount, harmless),
  `archive.ts:163-186` printReport ✓, `continue.ts:14-27` ContinueOutput with `upstream_skipped`
  present and `constitution_principles` absent ✓, `validate.ts:46-58` strict lint wiring ✓,
  `artifact-validator.ts:17-45` validateArtifact switch ✓, `spec-linter.ts:62-63` blankOutRegex/
  blankOutFences ✓.

- **[nit] architecture-overview.md self-compliance with FR-017 (Mermaid requirement): PASS.**
  The file contains 5 ` ```mermaid ` fenced blocks (lines 7, 57, 84, 109, 143). The new
  validator rule `/^(`{3,}|~{3,})\s*mermaid(\b|$)/m` would match line 7 (` ```mermaid `).
  The change does not self-fail its own new rule.

- **[nit] FR coverage is complete: all 17 FRs traced.** cli-spec-lint FR-001~010 (10),
  cli-anchor FR-015/016/017 + MODIFIED FR-005 (4), cli-archive FR-013/014 (2),
  cli-workflow-engine FR-015/016/017 (3) = 19 FR mentions, but FR-005 is a MODIFY and the two
  FR-015s live in different capabilities, so the "17 FR" count in the task brief = 10 + 3(added)
  + 2 + 3 - reconciles as: 10 (spec-lint) + 4 (anchor incl. MODIFIED) + 2 (archive) + 3 (workflow)
  minus... actually the brief's "17" = 10 + 3 + 2 + 3 - 1 (FR-005 is MODIFIED not ADDED) is not
  clean either. Counting ADDED+MODIFIED requirement *entries*: 10 + 4 + 2 + 3 = 19. The "17"
  figure likely counts ADDED-only (10+3+2+3=18) or excludes the cli-workflow FR-015 already-shipped
  one. **Minor discrepancy in the FR count framing** — every Delta Spec requirement is nonetheless
  traced into design.md's "修正"/"新規" sections and into checklist.md's coverage table, and each
  has >=1 `#### Scenario:`. No coverage gap; only the headline number is loose.

- **[nit] Every ADDED requirement has at least one Scenario — verified.** Each `### Requirement:`
  block in all 4 Delta Specs is followed by 1-2 `#### Scenario:` blocks. cli-archive FR-013 has 2,
  FR-014 has 1; cli-anchor FR-015/016 have 2 each, FR-017 has 2, MODIFIED FR-005 has 2;
  cli-workflow FR-015/016/017 have 2 each; cli-spec-lint FR-001~010 have 1 each. No empty
  requirement.

## Constitution Re-Evaluation

design.md's Phase 0 / Phase 1 verdicts re-evaluated independently. The principle *names* used are
those from `docs/design/mspec-design.md §1.2` (P1-P5), since `memory/constitution.md` defines none —
that substitution is itself the blocker above, but given the substitution the verdicts hold.

| Principle | design Phase 0 | my Phase 0 | design Phase 1 | my Phase 1 | Note |
|-----------|----------------|------------|----------------|------------|------|
| I. ステップ独立性 (P1) | ✅ | ✅ agree | ✅ | ✅ agree | `continue` envelope gains 1 additive field; no workflow step added; backward compatible. |
| II. 決定論的マージ (P2) | ✅ | ✅ agree | ✅ | ✅ agree | archive summary is a pure function over `MergeSummary`, lexicographic sort, byte-identical re-run is an E2E (FR-013 scenario 2). LLM not involved. |
| III. 質問駆動 (P3) | ✅ | ⚠️ agree-with-caveat | ✅ | ⚠️ agree-with-caveat | AskUserQuestion was suppressed this run by explicit user instruction. design.md/research.md document decision rationale, so traceability is preserved — but the principle's *mechanism* was bypassed, not exercised. Verdict ✅ is defensible only because rationale is logged; a stricter reviewer could mark this ⚠️. Not a blocker. |
| IV. 双方向アンカー (P4) | ✅ | ✅ agree, with risk | ✅ | ✅ agree, with risk | All 17 FRs must get `@mspec-delta` anchors. RISK: cli-spec-lint's 10 FRs have ZERO production-code change (D5), so their anchors must live on E2E test files — and the SAME change widens the anchor-scanner walker to exclude `packages/cli/tests/**` and `packages/cli/src/**/*.test.ts` (design.md line 60). If anchors are placed on excluded test files, the scanner will never see them and P4 is silently unenforced. This is a real internal tension between FR-016 (cli-anchor, walker exclusion) and D5 (spec-lint anchors on tests). checklist.md line 43 flags the walker-exclusion regression but does not connect it to the spec-lint-anchors-on-tests problem. **Must be resolved in tasks.md**: either spec-lint anchors go on non-test files, or the exclusion must not blanket all of `tests/`. |
| V. 強制/拡張ステップ分離 (P5) | ✅ | ✅ agree | ✅ | ✅ agree | `.mspec/workflow.yaml` untouched; `removable` flags untouched; Mermaid enforcement is artifact-validation, not workflow structure. Confirmed `constitution_check` keys exist in workflow.yaml at lines 24/45/56/86/96 (=true) and 109 (=false), so FR-016's "Constitution Check 無効ステップ" scenario (the `new` step) is backed by real config. |

Disagreements with design.md: none on the final ✅/✅ verdicts, but two caveats — P3 is ✅ only
by virtue of logged rationale (mechanism bypassed), and P4's ✅ rests on an unresolved anchor-
placement vs walker-exclusion tension that tasks.md must settle.

## Suggested Edits

- **`memory/constitution.md`** → Choose ONE before `archive`:
  (a) Populate `### I.` … `### V.` with the 5 principle names design.md already uses
  (`I. ステップ独立性`, `II. 決定論的マージ`, `III. 質問駆動の要件確定`, `IV. 双方向アンカー`,
  `V. 強制ステップと拡張ステップの分離`) and real bodies; bump `Last Amended`. This is the
  dogfooding-honest fix and makes quickstart step 3 executable. OR
  (b) If constitution enrichment stays out of scope (proposal.md Non-Goals line 25), add a one-line
  disclaimer to design.md's two Constitution Check tables — e.g. `> 注: memory/constitution.md は
  テンプレ状態のため、本表は docs/design/mspec-design.md §1.2 の P1–P5 を実質憲法とみなす` —
  mirroring the disclaimer already in proposal.md:48 and research.md:65. Without (a) or (b) the
  artifact chain is internally inconsistent.

- **`changes/.../specs/cli-workflow-engine/spec.md`** → FR-016 scenario "design ステップが全宣言原則を
  列挙する" (lines 21-24): replace `I. Library-First` / `II. CLI Interface` with the project's real
  principle names, OR add a GIVEN clause making explicit that the scenario uses a synthetic fixture
  constitution (`GIVEN a fixture 憲法ファイル ...`). As written it references principles that exist
  nowhere in this repo.

- **`changes/.../specs/cli-workflow-engine/spec.md`** → FR-015: add an in-spec note (HTML comment or
  prose) that `upstream_skipped[]` is already implemented and this FR formalizes existing behavior +
  adds regression E2Es. Aligns the Delta Spec with research.md line 14 and design.md Goals line 12,
  and prevents a future reader from treating it as net-new behavior.

- **`changes/.../design.md`** → In the "Project Structure (修正)" section, line 60: add an explicit
  constraint that the `packages/cli/tests/**` and `packages/cli/src/**/*.test.ts` walker exclusions
  MUST NOT prevent P4 anchor enforcement for cli-spec-lint's 10 FRs. State where those 10 anchors
  will live (they cannot be on excluded test files). This pre-empts the P4 tension flagged above.

- **`changes/.../quickstart.md`** → Either (after constitution fix (a)) leave step 3 as-is, or add a
  Prerequisite line noting that `memory/constitution.md` must define the 5 principles for step 3 /
  Verify line 70 to produce a 5-element array. Currently step 3 is not executable against the repo
  as it stands.

- **`changes/.../research.md`** → line 32: "`DEFAULT_IGNORE` は 7 ディレクトリのみ" — the set has
  8 entries (`node_modules`, `.git`, `dist`, `build`, `.next`, `.turbo`, `coverage`, `.mspec`).
  Cosmetic; correct to 8 for accuracy.

## Assessment

The engineering plan is sound and the codebase claims are accurate. The 4-capability local-edit
strategy, the 3 new files (text-mask / archive-summary / constitution-principles), and the
validate/continue/archive/anchor touch-points all check out against the live source. FR coverage
is complete and every requirement has a scenario. architecture-overview.md self-complies with the
Mermaid rule it introduces.

The single material problem is the **constitution placeholder vs. 5 named principles** mismatch.
It is a genuine **blocker for artifact internal consistency and for the dogfooding promise**
(quickstart step 3 is not executable; FR-016's E2E needs a fixture; design.md's tables claim a
constitution that does not exist). It is **not a blocker for code implementation** — every FR can
be built and tested with a fixture constitution. Recommended resolution: option (a) (populate the
constitution) since proposal.md's whole thesis is "make mspec able to dogfood itself", and a
placeholder constitution defeats that. If the team insists on deferring constitution prose, option
(b) (disclaimer in design.md) is the minimum acceptable consistency fix.

Secondary blocker-hygiene items: FR-016's `Library-First`/`CLI Interface` hardcoding and FR-015's
silent "ADDED but already shipped" labeling — both should be cleaned in the Delta Spec before
`archive`, since `archive` merges Delta text verbatim into the SoT.

## Constitution Check

> Step: self-review | Constitution Version: 1.0.0

`memory/constitution.md` is in template state (placeholder headings, no principle names/bodies).
Per proposal.md:48 and research.md:65, this review evaluates against `docs/design/mspec-design.md
§1.2`'s 5 design principles (P1–P5) as the de-facto constitution. The fact that this substitution
is necessary is itself the blocker reported above. Phase 1 column re-evaluated as part of this
review's independent pass.

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 (P1) | ✅ | ✅ | self-review adds no workflow step and produces no named artifact (`produces: []`); state machine untouched. |
| II. 決定論的マージ (P2) | ✅ | ✅ | review is read-only; no merge logic exercised. |
| III. 質問駆動 (P3) | ✅ | ✅ | self-review is a subagent step, not an AskUserQuestion step; findings are logged with file/line evidence for traceability. |
| IV. 双方向アンカー (P4) | ✅ | ✅ | self-review.md is non-anchored scratch (no SoT spec link). Review explicitly flags the P4 anchor-placement risk for tasks.md to resolve. |
| V. 強制/拡張ステップ分離 (P5) | ✅ | ✅ | self-review's `removable` flag and workflow position unchanged. |

### Complexity Tracking

None — the review introduces no abstraction. It reports one blocker (constitution placeholder
mismatch) and two spec-hygiene blockers (FR-016 hardcoded principle names, FR-015 mislabeled
ADDED), all in existing artifacts, none requiring new structure to fix.
