---
doc_type: Reference
---

# Research: Diátaxis Artifact Structure

## Decisions

| 論点 | 採用案 | 代替案 | 根拠 |
|------|--------|--------|------|
| doc_type の記載位置 | YAML フロントマター `doc_type:` フィールド | H1 直下のバッジ / インラインコメント | `gray-matter` が既にプロジェクトに導入済み（`packages/cli/src/parser/frontmatter.ts`）。フロントマターはパーサーが機械的に読めるため validate での構造チェックと親和性が高い |
| Diátaxis 型の制約 | Reference / Explanation / How-to / Tutorial の 4 値のみ | 独自タイプ（AI-Internal 等）を追加する | 独自タイプを設けると分類コストが増大し、人間レビュアーへの意味が薄れる。proposal で「独自タイプは設けない」と決定済み |
| glossary.md の必須/任意 | 全 change で必須生成（ワークフローに組み込む） | 任意追加 | 用語の単一ソース化が目的。任意だと導入されないまま運用されるリスクがある |
| ADDED Requirement のデフォルトキーワード | `SHALL`（機能要件のデフォルト） | `MUST`（現行デフォルト） | EARS 原典は `shall` を機能要件の標準動詞として用いる。RFC 2119 では MUST と SHALL は同義だが、mspec Constitution では「SHALL = 機能要件、MUST = 制約/安全要件」と使い分けることで intent を構造的に表現する。現行テンプレート（`delta-init.ts:69`）と `templates/artifacts/delta-spec.md:6` はいずれも `MUST` を ADDED のデフォルトとしており、要変更 |
| Scenario の必須化 | 全 Requirement に `#### Scenario:` を 1 つ以上必須 | 任意 | `mspec validate` が H4 Scenario の存在をすでにチェックしている（`cli-delta-spec` FR-006 / `artifact-validator.ts`）。必須化はバリデーション実装なしでスキルプロンプトの指示変更のみで達成可能 |
| Constitution での MUST/SHALL 判定基準追加 | constitution.md に判定基準を追記する | SKILL.md に都度説明を書く | 単一ソースの原則。constitution.md が判定基準の Source-of-Truth となる |
| doc_type バリデーション方針 | AI チェックのみ（mspec validate は追加しない） | artifact-validator.ts に機械バリデーション追加 | 実装コストゼロ、Non-Goal（EARS 構文の機械的バリデーション実装なし）と整合する |
| glossary.md の生成タイミング | `mspec new` と同時に空の glossary.md を自動生成 | proposal / research 直後 | チェンジ開始時から用語スロットが存在することで、後続ステップが参照先を持てる |
| EARS パターンの案内位置 | `mspec-delta` SKILL.md の Procedure のみ | Delta Spec テンプレートのコメント / constitution.md | テンプレートをシンプルに保ち、案内が必要な LLM だけが参照する SKILL.md に集約する |

## Web References

- [Diátaxis — Start here](https://diataxis.fr/start-here/) — 4 タイプ（Tutorial / How-to / Reference / Explanation）の概要。用途の違いを「学習 vs 作業、実践 vs 理論」の 2 軸で整理している
- [Diátaxis — diataxis.fr](https://diataxis.fr/) — フレームワーク公式サイト。Reference は「作業中に参照する正確な事実」、Explanation は「背景・文脈・理由を提供する理解のための文書」と区別されている
- [EARS: Easy Approach to Requirements Syntax — alistairmavin.com](https://alistairmavin.com/ears/) — EARS 原典。基本構文は `While <pre-condition>, when <trigger>, the <system> shall <response>`。`shall` が機能要件の標準動詞であることを明示している
- [EARS — QRA Corp Guide](https://qracorp.com/guides_checklists/the-easy-approach-to-requirements-syntax-ears/) — EARS の 5 パターン（Ubiquitous / Event-Driven / Unwanted Behavior / State-Driven / Optional Feature）を解説。いずれも `shall` を使用
- [RFC 2119 — IETF](https://datatracker.ietf.org/doc/html/rfc2119) — MUST / SHALL は同義（絶対要件）。SHOULD は推奨だが逸脱可能。mspec での MUST/SHALL 使い分けは RFC 2119 の同義性を敢えて崩した独自セマンティクスであり、constitution への明記が必要
- [gray-matter — npm](https://www.npmjs.com/package/gray-matter) — プロジェクトが利用中の YAML フロントマターパーサー。`parseFrontmatter()` が既に `packages/cli/src/parser/frontmatter.ts` でラップ済み

## Codebase Findings

- `packages/cli/src/commands/delta-init.ts:69` — `buildDeltaSkeleton()` が ADDED Requirement のデフォルトとして `MUST` を埋め込んでいる。FR-011（SHALL をデフォルトにする）はここを変更する
- `packages/cli/templates/artifacts/delta-spec.md:6` — テンプレートファイルの ADDED スタブも `MUST`。`delta-init.ts` の `buildDeltaSkeleton()` が実際に使われているため、このファイルの変更は参照用にとどまる
- `packages/cli/templates/artifacts/delta-spec.md:14` — MODIFIED スタブは既に `SHALL` を使用している（現行テンプレートで ADDED と MODIFIED のキーワードが不統一）
- `packages/cli/src/parser/frontmatter.ts` — `gray-matter` ベースの `parseFrontmatter()` が実装済み。`doc_type` フィールドの追加はパーサー変更不要
- `packages/cli/src/lib/artifact-validator.ts:17-49` — 現行バリデーターは Constitution Check 節と Mermaid フェンスのみチェック。`doc_type` フロントマター検証はここに追加する必要がある（Open Choice 参照）
- `packages/cli/templates/artifacts/proposal.md` — フロントマターなし（現行）。`doc_type: Explanation` を追加対象
- `packages/cli/templates/artifacts/research.md` — フロントマターなし（現行）。`doc_type: Reference` を追加対象
- `packages/cli/templates/artifacts/design.md` — フロントマターなし（現行）。`doc_type: Reference` を追加対象
- `packages/cli/templates/artifacts/tasks.md` — フロントマターなし（現行）。`doc_type: Reference` を追加対象
- `packages/cli/templates/artifacts/checklist.md` — フロントマターなし（現行）。`doc_type: Reference` を追加対象
- `packages/cli/templates/artifacts/quickstart.md` — フロントマターなし（現行）。`doc_type: How-to` を追加対象
- `packages/cli/templates/artifacts/architecture-overview.md` — フロントマターなし（現行）。`doc_type: Reference` を追加対象
- `packages/cli/templates/artifacts/readme.md` — フロントマターなし（現行）。`doc_type: Reference` を追加対象
- `specs/artifact-taxonomy/spec.md` — Purpose と Requirements が空。新規 capability のため FR-001〜FR-003 はここに初めてマージされる
- `specs/cli-delta-spec/spec.md:80-88` — FR-007 がすでに「RFC 2119 キーワードと GIVEN/WHEN/THEN を含む雛形」を要件として定義している。FR-011（SHALL デフォルト）は FR-007 の補足・細分化として整合する
- `specs/claude-integration/spec.md:1-117` — FR-001〜FR-009 が定義済み。FR-010（EARS+Scenario 形式への SKILL.md 更新）はここに ADDED される
- `.claude/skills/mspec-delta/SKILL.md:14` — Procedure step 4 が「MUST/SHALL/SHOULD/MAY (RFC 2119) clauses」と記載済み。EARS パターン（`When <trigger>`, `While <state>`）への言及がない。FR-010 で EARS 形式の明示が必要

## Artifact Diátaxis 分類マッピング

| 成果物 | Diátaxis タイプ | 理由 |
|--------|----------------|------|
| proposal.md | Explanation | 背景・動機・目標を説明する理解のための文書 |
| research.md | Reference | 決定根拠・参照情報を正確に記述した参照文書 |
| design.md | Reference | 技術的事実と決定を記述した参照文書 |
| architecture-overview.md | Reference | システム構造の正確な記述 |
| tasks.md | Reference | タスクリストとアンカー情報の参照文書 |
| checklist.md | Reference | チェック項目の参照リスト |
| quickstart.md | How-to | 実際のゴール達成を支援する手順書 |
| readme.md | Reference | change のステータスと成果物一覧 |
| glossary.md（新規） | Reference | 用語の正確な定義を提供する参照文書 |

## Open Choices

*すべて解決済み（以下参照）*

| 論点 | 決定 |
|------|------|
| doc_type バリデーション方針 | AI チェックのみ（mspec validate は追加しない）。Checklist / Constitution Check で自己確認する |
| glossary.md の生成タイミング | `mspec new` と同時に空の glossary.md を自動生成する。以降のステップで用語が確定したら埋める |
| EARS パターンの案内位置 | `mspec-delta` の SKILL.md の Procedure のみに記述する。Delta Spec テンプレートはシンプルに保つ |

## Constitution Check

> Step: research | Constitution Version: 1.0.0

| Principle | Phase 0 | Notes |
|---|---|---|
| I. ステップ独立性 | ✅ | research.md は他のステップに依存せず、proposal.md と Delta Specs のみを入力とする |
| II. 決定論的マージ | ✅ | research.md はアーカイブ対象外（archive は spec.md のみをマージする）。競合リスクなし |
| III. 質問駆動の要件確定 | ✅ | Open Choices をユーザーに提示し、回答後に research.md を更新する手順で対応済み |
| IV. 双方向アンカー | ✅ | Codebase Findings が具体的なファイルパス・行番号でコードと仕様を双方向に結びつけている |
| V. 強制ステップと拡張ステップの分離 | ✅ | research ステップは強制ステップ（spec 生成前の調査）として適切に機能している |
