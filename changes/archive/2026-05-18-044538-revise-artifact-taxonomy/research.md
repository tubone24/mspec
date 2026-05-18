---
doc_type: Reference
---

# Research: revise-artifact-taxonomy

## Decisions

### D1 — 既存 archive 配下は warning-only で grandfather する
- Question: 既存 `changes/archive/*` の grandfather 方針（Open Question 1）
- Decision: `mspec validate` は archived change（`changes/archive/` 配下）に対しては doc_type 値の不整合を **warning** として報告し fail させない。アクティブな `changes/<id>/` 配下と SoT 配下（`packages/cli/templates/artifacts/` および `specs/<capability>/spec.md` の参照テンプレ）は引き続き error とする。一括移行コマンドは Non-Goal なので提供しない。
- Rationale: 現行 `validate.ts` は `listChanges({ includeArchived: false })` を既定にしており archive は既定ターゲット外（`packages/cli/src/commands/validate.ts:43`）。さらに doc_type 値の許容セット enforcement は CLI 内には存在せず E2E テスト（`packages/cli/tests/e2e/artifact-taxonomy-doc-type.e2e.test.ts`）のみが行っているため、archived change で fail させたい強い動機がない。`--all` 明示時にも遡及移行を強制しない既定が proposal の Non-Goal と整合する。
- Source: `packages/cli/src/commands/validate.ts:42-50`, `packages/cli/src/lib/change-discovery.ts`（`listChanges` の `includeArchived` 既定 false）, proposal Non-Goals

### D2 — design.md / design-rationale.md は recommended-but-not-enforced 章立て
- Question: 2 ファイルの境界をテンプレートでどこまで強制するか（Open Question 2）
- Decision: テンプレートには推奨章立て（design.md: Summary / Technical Context / Project Structure / API・Data Model / Constitution Check、 design-rationale.md: Context / Decisions / Alternatives Considered / Trade-offs / Rejected Options / Constitution Check）を**雛形コメントとして提示**するが、`validate` は frontmatter (`doc_type`) と末尾の Constitution Check 表のみを必須化する。章見出しの厳格 enforcement は行わない。
- Rationale: Diátaxis 公式は Reference / Explanation の **目的（intent）** を区別すべきと説くが具体的セクション名は規定しない（[diataxis.fr](https://diataxis.fr/) "neutral … not concerned with what the user is doing" vs Explanation "answer the question why?"）。現行 design.md テンプレが Decisions を含み Reference 純度が崩れているのが分割動機であり、Decisions を rationale 側へ移すだけで目的は達成できる。固定章立て enforcement は実装コスト高で本 change のスコープを膨らませる。
- Source: `packages/cli/templates/artifacts/design.ja.md:35-50`（現状 Decisions が Reference に混入）, https://diataxis.fr/reference/, https://diataxis.fr/explanation/

### D3 — Summary セクションは `### Lessons` + `### Next Steps` の固定 2 サブ見出し
- Question: archive で生成する readme まとめの章立て・長さ基準（Open Question 3）
- Decision: テンプレ末尾の `## Summary (Lessons / Next Steps)` を、archive 時に AI が以下の固定 2 サブセクションで埋める。
  - `### Lessons` — bullet 3〜5 件、各 1〜2 行。当該 change で確定した教訓（うまく行った点・つまずいた点・Constitution Check で⚠️/❌が付いた原則と理由）。
  - `### Next Steps` — bullet 2〜4 件、各 1 行＋関連 FR-ID / capability ハイパーリンク。次に類似変更を起こす際の入口（参照すべき archive change 名・残った Open Choices・後続 change で扱うべき RENAMED 等）。
  - 全体 30 行・1,500 字以内を目安。プレースホルダ `<!-- archive ステップで AI が生成 -->` を保持したままだと validate は warning を出す（Delta Spec claude-integration FR-023 Scenario 2）。
- Rationale: Tutorial の Diátaxis 原典は「end-to-end の学習体験」を要求しており（idratherbewriting.com Diátaxis 解説）、末尾の振り返りで「次に何を学ぶか」を提示するのは Tutorial パターンに整合。固定 2 サブ見出しは AI 生成のばらつきを抑え、CLI の正規表現検証も容易。
- Source: https://diataxis.fr/tutorials/, https://idratherbewriting.com/blog/what-is-diataxis-documentation-framework, Delta Spec `claude-integration/spec.md` FR-023

### D4 — `tasks.md` のみを AI-Internal に再分類、`checklist.md` `glossary.md` は据え置き
- Question: tasks.md 以外の AI-Internal 候補（Open Question 4）
- Decision: 本 change では **tasks.md のみ** を AI-Internal に再分類する。`checklist.md` は Reference のまま、`glossary.md` も Reference のまま、`architecture-overview.md` も Reference のまま据え置く。
- Rationale:
  - `tasks.md` (`packages/cli/templates/artifacts/tasks.ja.md`): TNNN 粒度・anchor ブロック・E2E ファイル名直書きで、人間が通読するより `mspec-implement` が機械的に消費する性格（[tasksmd/tasks.md](https://github.com/tasksmd/tasks.md) が示すまさに AI agent task queue パターン）。AI-Internal に最適。
  - `checklist.md` (`packages/cli/templates/artifacts/checklist.ja.md`): `<!-- verify: fr-NNN -->` / `<!-- verify: human -->` というアノテーション付き Markdown チェックボックスで、`mspec-implement` の自動 check と人間レビュアの両方が読む。**両方が一次読者**であり Reference のまま据え置きが妥当。
  - `glossary.md`: 用語定義の lookup（人間 + AI 双方の参照）で Reference の典型。
  - `architecture-overview.md`: Mermaid 図含む構造記述で人間レビュアの読解前提。
- Source: `packages/cli/templates/artifacts/tasks.ja.md:1-44`, `packages/cli/templates/artifacts/checklist.ja.md:1-18`, https://github.com/tasksmd/tasks.md, https://addyosmani.com/blog/good-spec/

### D5 — テスト最小差分は 2 ファイル両方を更新（baseline 修正＋invariant の許容拡張）
- Question: `template-doc-type-invariant.e2e.test.ts` の最小差分（Open Question 5）
- Decision: 実コードを読むと、proposal が言う「template-doc-type-invariant.e2e.test.ts」相当の **doc_type 許容値 enforcement は `packages/cli/tests/e2e/artifact-taxonomy-doc-type.e2e.test.ts` 側にある**（`template-doc-type-invariant.e2e.test.ts` は ja/en 間の locale-invariant のみを検証）。よって最小差分は次の 2 ファイル：
  1. `artifact-taxonomy-doc-type.e2e.test.ts` — `VALID_DOC_TYPES` 配列に `'AI-Internal'` を追加し、`EXPECTED_DOC_TYPES` の `tasks.{ja,en}.md` を `'AI-Internal'` に、`readme.{ja,en}.md` を `'Tutorial'` に、`design.{ja,en}.md` は `'Reference'` 維持、`design-rationale.{ja,en}.md` の 2 エントリ（`'Explanation'`）を**新規追加**、describe テキスト `"four Diátaxis types"` を `"five doc types (Diátaxis + AI-Internal)"` に修正。
  2. `template-doc-type-invariant.e2e.test.ts` — 改修不要（識別子文字列のみを検査するため `'AI-Internal'` 識別子に対する追加テストを 1 件付け足すかは任意）。
- Rationale: 既存テストはハードコードされた allow-list と filename→type 対応表が唯一の enforcement 源。CLI の `validate` には doc_type 値の enforcement が無く、差分は test 表組のみで済む。
- Source: `packages/cli/tests/e2e/artifact-taxonomy-doc-type.e2e.test.ts:18-39`, `packages/cli/tests/e2e/template-doc-type-invariant.e2e.test.ts:14-25`, `packages/cli/src/commands/validate.ts`（doc_type 値 enforcement 無しを確認）

### D6 — `AI-Internal` は Diátaxis 4 種を置き換えず「5 番目の直交ラベル」として位置付ける
- Question: Diátaxis に対する位置付け（research 過程で派生）
- Decision: Web 上に Diátaxis を 5 種に拡張した前例は確認できなかった（公式 [diataxis.fr](https://diataxis.fr/) は 4 種で完結、各種 AI 拡張 skill ([keithpatton/diataxis-agent-skill](https://github.com/keithpatton/diataxis-agent-skill), [sammcj writing-documentation-with-diataxis](https://explainx.ai/skills/sammcj/agentic-coding/writing-documentation-with-diataxis)) も 4 quadrant を保持）。本 change は **novel extension**。design-rationale.md 側で「Diátaxis の 4 種は『誰の何の知的活動を支援するか』で分けられるが、AI agent の機械消費は人間の 4 ニーズのいずれにも当てはまらないため 5 番目の直交軸として `AI-Internal` を導入する」と明記する。FR-002 の SoT タイトル "four Diátaxis types" は注記で乖離を明示しタイトル改名は後続 change（既に Delta Spec で言及済み）に委ねる。
- Rationale: AGENTS.md / CLAUDE.md / tasks.md など「AI agent 専用ドキュメント」の業界実装は急増中（[GitBook skill.md](https://www.gitbook.com/blog/skill-md), [Cloudflare docs for agents](https://developers.cloudflare.com/docs-for-agents/)）。一方 Diátaxis 公式は AI を意識した型増設を行っていない。mspec が独自に追加することの正当性は「artifact ごとの一次読者 (primary consumer) を明示する」というラベル目的に照らして自然。
- Source: https://diataxis.fr/, https://github.com/keithpatton/diataxis-agent-skill, https://www.gitbook.com/blog/skill-md, https://developers.cloudflare.com/docs-for-agents/

## Web References

| # | Title | URL | Relevance |
|---|-------|-----|-----------|
| 1 | Diátaxis 公式（4 quadrant の definitive source） | https://diataxis.fr/ | D2, D6 の典拠。4 種が完結体系であることの一次資料 |
| 2 | Diátaxis: start here (5 minutes 概説) | https://diataxis.fr/start-here/ | 4 種の目的差を簡潔に再確認 |
| 3 | I'd Rather Be Writing — Diátaxis 解説 | https://idratherbewriting.com/blog/what-is-diataxis-documentation-framework | D3（Tutorial の end-to-end 体験要件）の根拠 |
| 4 | keithpatton/diataxis-agent-skill | https://github.com/keithpatton/diataxis-agent-skill | D6: AI 拡張でも 4 quadrant が維持されている実例 |
| 5 | sammcj writing-documentation-with-diataxis | https://explainx.ai/skills/sammcj/agentic-coding/writing-documentation-with-diataxis | D6: 同上、AI 文脈での Diátaxis 利用例 |
| 6 | tasksmd/tasks.md — AI agent task queue spec | https://github.com/tasksmd/tasks.md | D4: tasks.md が AI 一次消費型である業界傍証 |
| 7 | Addy Osmani — How to write a good spec for AI agents | https://addyosmani.com/blog/good-spec/ | D4, D6: AI agent 専用 spec という概念の補強 |
| 8 | GitBook — skill.md: structure your product for AI agents | https://www.gitbook.com/blog/skill-md | D6: AGENTS.md/CLAUDE.md 系の AI-Internal 業界トレンド |
| 9 | Cloudflare — Docs for agents | https://developers.cloudflare.com/docs-for-agents/ | D6: 「human docs と分けた agent docs」のベンダー実装 |
| 10 | Fern — API Docs for AI Agents (llms.txt guide May 2026) | https://buildwithfern.com/post/optimizing-api-docs-ai-agents-llms-txt-guide | D6: AI 向け machine-readable doc 標準化動向 |

## Codebase Findings

### Current doc_type assignments (baseline)

`packages/cli/templates/artifacts/` 配下の現状と本 change 適用後の対応表。`*.ja.md` / `*.en.md` は同一 doc_type（FR-004 invariant）。

| Template (ja & en) | Current doc_type | After change | 備考 |
|---|---|---|---|
| `proposal.{ja,en}.md` | Explanation | Explanation | 据え置き |
| `research.{ja,en}.md` | Reference | Reference | 据え置き |
| `design.{ja,en}.md` | Reference | Reference | Decisions セクションを削除し純 Reference 化 |
| `design-rationale.{ja,en}.md` | （存在せず） | Explanation | **新規追加**（artifact-taxonomy FR-006） |
| `architecture-overview.{ja,en}.md` | Reference | Reference | 据え置き |
| `quickstart.{ja,en}.md` | How-to | How-to | 据え置き |
| `checklist.{ja,en}.md` | Reference | Reference | 据え置き（D4） |
| `tasks.{ja,en}.md` | Reference | **AI-Internal** | artifact-taxonomy FR-004 |
| `readme.{ja,en}.md` | Reference | **Tutorial** | 末尾に `## Summary (Lessons / Next Steps)` 追加（FR-005） |
| `glossary.{ja,en}.md` | Reference | Reference | 据え置き |
| `delta-spec.{ja,en,}.md` | （frontmatter 無し） | （現状維持） | テンプレ変数置換用で frontmatter 持たない設計 |

### Skill / workflow files to modify

- `packages/cli/templates/claude/skills/mspec-design/SKILL.md` — 現状 Procedure step 3 が「`design.md` を template から書く」となっており Decisions を design.md に記述させている (`packages/cli/templates/claude/skills/mspec-design/SKILL.md:19-20`)。**追加**: step 3a として「`design-rationale.md` を template から書き、Decisions / Alternatives / Trade-offs を移す」、step 5 を両ファイルに Phase 1 Constitution Check を埋める、step 7a の readme 更新で `- [ ] design.md / architecture-overview.md` 行を `- [ ] design.md / design-rationale.md / architecture-overview.md` に変更（または別エントリ化）。
- `packages/cli/templates/claude/skills/mspec-archive/SKILL.md` — 現状 4 ステップで完結 (`packages/cli/templates/claude/skills/mspec-archive/SKILL.md:11-20`)。**追加**: step 3 と step 4 の間に「step 3b: 当該 change の差分・確定 Delta Spec を読み、`readme.md` 末尾の `## Summary (Lessons / Next Steps)` を `### Lessons` + `### Next Steps` の固定 2 サブ見出しで埋める。プレースホルダコメントを削除」を挿入。
- `packages/cli/templates/workflow.default.yaml:51-59` — `design` ステップの `produces: [design.md, architecture-overview.md]` を `[design.md, design-rationale.md, architecture-overview.md]` に変更（cli-workflow-engine FR-022）。
- `packages/cli/templates/workflow.default.yaml:114-120` — `archive` ステップに `block: false`, `produces: []` の制約は保ったまま、readme.md 末尾更新は SKILL の責務（CLI 強制ではない）として workflow.yaml は変更不要。ただし FR-023 Scenario 2 で「Summary 未記入が validate warning」を成立させるには `packages/cli/src/lib/artifact-validator.ts` に readme.md 用ルール追加が必要。
- `packages/cli/src/commands/new.ts:117-126` — `buildReadmeFallback` の `## Artifacts` リストに `- [ ] design-rationale.md` を追加。fallback の readme には末尾 `## Summary (Lessons / Next Steps)` プレースホルダ追記が必要。
- `packages/cli/templates/artifacts/readme.ja.md:14-23` と `readme.en.md` — frontmatter を `doc_type: Tutorial` に書き換え、Artifacts リストに `design-rationale.md` を追加、ファイル末尾に `## Summary (Lessons / Next Steps)` セクション＋プレースホルダコメントを追加。
- `packages/cli/templates/artifacts/design.ja.md` / `design.en.md` — `## Decisions` セクションを削除（design-rationale 側に移動）し純 Reference 化。
- `packages/cli/templates/artifacts/design-rationale.ja.md` / `design-rationale.en.md` — **新規作成**。frontmatter `doc_type: Explanation`、章立て案: `## Context` / `## Decisions` / `## Alternatives Considered` / `## Trade-offs` / `## Rejected Options` / `## Constitution Check`。
- `packages/cli/templates/artifacts/tasks.ja.md:2` と `tasks.en.md:2` — `doc_type: Reference` → `doc_type: AI-Internal`。

### Test file diff sketch

主たる差分は `artifact-taxonomy-doc-type.e2e.test.ts`（許容値 enforcement の唯一の場）。`template-doc-type-invariant.e2e.test.ts` 本体は識別子文字列の locale-invariance のみを検査するため、AI-Internal に対する確認テストを 1 ケース追加するのが minimum-diff。

`packages/cli/tests/e2e/artifact-taxonomy-doc-type.e2e.test.ts` — 該当箇所と提案差分：

現行 (line 18):
```ts
const VALID_DOC_TYPES = ['Reference', 'Explanation', 'How-to', 'Tutorial'] as const;
```
↓
```ts
const VALID_DOC_TYPES = ['Reference', 'Explanation', 'How-to', 'Tutorial', 'AI-Internal'] as const;
```

現行 (line 20-39 の `EXPECTED_DOC_TYPES` 表)：
```ts
  'design.ja.md': 'Reference',
  'design.en.md': 'Reference',
  'tasks.ja.md': 'Reference',
  'tasks.en.md': 'Reference',
  ...
  'readme.ja.md': 'Reference',
  'readme.en.md': 'Reference',
```
↓
```ts
  'design.ja.md': 'Reference',
  'design.en.md': 'Reference',
  'design-rationale.ja.md': 'Explanation',   // ADDED
  'design-rationale.en.md': 'Explanation',   // ADDED
  'tasks.ja.md': 'AI-Internal',              // MODIFIED
  'tasks.en.md': 'AI-Internal',              // MODIFIED
  ...
  'readme.ja.md': 'Tutorial',                // MODIFIED
  'readme.en.md': 'Tutorial',                // MODIFIED
```

現行 (line 53-54)：
```ts
// FR-002: doc_type value is constrained to four Diátaxis types
describe('FR-002: doc_type values are valid Diátaxis types', () => {
```
↓
```ts
// FR-002 (revised): doc_type value is one of five types (4 Diátaxis + AI-Internal)
describe('FR-002: doc_type values are valid (Diátaxis + AI-Internal)', () => {
```

現行 (line 56)：
```ts
    it(`${filename} doc_type is one of Reference/Explanation/How-to/Tutorial`, async () => {
```
↓
```ts
    it(`${filename} doc_type is one of Reference/Explanation/How-to/Tutorial/AI-Internal`, async () => {
```

合計差分: 1 ファイル、追加 2 行（design-rationale エントリ）+ 修正 6 行。新規 spec は test を追加しない最小差分で十分（許容値拡張＋filename 対応表更新だけで Delta Spec の Scenario 群（artifact-taxonomy FR-004/005/006、cli-spec-lint FR-015）が green になる）。

`packages/cli/tests/e2e/template-doc-type-invariant.e2e.test.ts` — 改修必須ではないが、`AI-Internal` 識別子が ja/en 間で invariant であることを示す確認ケースを 1 件追加する案：
```ts
  it('AI-Internal 識別子も locale-invariant である', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'mspec-tpl-dt-ai-'));
    await writeFile(join(dir, 'tasks.ja.md'), '---\ndoc_type: AI-Internal\n---\n\n# タスク\n');
    await writeFile(join(dir, 'tasks.en.md'), '---\ndoc_type: AI-Internal\n---\n\n# Tasks\n');
    const ja = await resolveTemplate('tasks', 'ja', dir);
    const en = await resolveTemplate('tasks', 'en', dir);
    expect(ja.content).toContain('doc_type: AI-Internal');
    expect(en.content).toContain('doc_type: AI-Internal');
  });
```

## Open Choices

> すべてユーザー確認の上 Recommend を採用済み（2026-05-18）。design ステップは下記の確定方針に従って進める。

### Resolved (Recommend 採用)

| # | 論点 | 確定方針 |
|---|------|----------|
| OC1 | `mspec validate` の warning 終了コード | `--strict` 指定時のみ exit 1、既定は exit 0 |
| OC2 | `readme.md` Summary 未記入時の validate severity | プレースホルダコメントが残存していれば **warning**（archive 完了は阻害しない） |
| OC3 | `design.md` ↔ `design-rationale.md` 相互リンク | テンプレに **コメントで誘導**（自動生成は Non-Goal、手書きを促す注記のみ） |
| OC4 | 軽量モード（typo / minor）での `design-rationale.md` スキップ | 本 change では `workflow.yaml` の `modes` を **触らない**（design ステップ全体スキップは別 change で扱う） |
| OC5 | FR-002 タイトル（"four Diátaxis types"）の RENAMED 起票タイミング | 本 change archive **直後** に後続 change を起票する（例: `mspec new rename-fr-002-doc-type-title`） |
| OC6 | `architecture-overview.md` の AI-Internal 化検討 | 本 change では **Reference のまま据え置き**（人間レビュアの読解前提を維持） |

### Unresolved

なし。design ステップ開始時点で全 Open Question が解消済み。

## Constitution Check

> Step: research | Constitution Version: current

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | — | research は読み取り＋外部検索のみで他成果物を改変しない |
| II. 決定論的マージ | ✅ | — | research.md 生成は Delta Spec のマージ仕様に影響しない |
| III. 質問駆動の要件確定 | ✅ | — | Open Questions 5 件を D1-D5 で resolve、新出 1 件を Open Choices に提示 |
| IV. 双方向アンカー | — | — | research 成果物にアンカー要件は無い |
| V. 強制ステップと拡張ステップの分離 | ✅ | — | research は拡張ステップで本 change の境界を侵さない |

### Complexity Tracking

None
