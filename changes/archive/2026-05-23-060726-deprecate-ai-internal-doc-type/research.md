---
doc_type: Reference
---

# Research: deprecate-ai-internal-doc-type

## Decisions

| 論点 | 採用案 | 代替案 | 根拠 |
|---|---|---|---|
| `AI-Internal` 廃止方針 | 完全廃止。4種のDiátaxisタイプのみに制限 | 存続させてAI専用タイプとして維持 | Diátaxisはドキュメントの目的を読者の認知ニーズで分類する。「消費者がAIかどうか」はDiátaxisの軸ではなく、読者視点の軸（学習/作業/参照/理解）に基づかない独自拡張は哲学違反 |
| `tasks.md` の代替 doc_type | `Reference` | `How-to` | Diátaxis定義の通り、Referenceは「正確で完全な技術的記述——事実」であり、lookupテーブルとして機能する。`tasks.md`は番号付きタスク一覧・アンカーブロックの索引であり、読者（AIエージェント）が特定の情報を参照するための構造化ドキュメント。`How-to`は順序付き行動ガイドであり、`tasks.md`の役割と異なる |
| バリデーター実装の変更方向 | `VALID_DOC_TYPES`配列から`'AI-Internal'`を除去 | 別のvalidation関数を追加 | 単一ソース原則を維持。`VALID_DOC_TYPES`はすでにartifact-taxonomy FR-001の単一定義源として機能している |
| 既存変更ディレクトリの後方互換性 | 特別な移行処理不要 | バージョン付き移行スクリプト提供 | アクティブな変更ディレクトリに`doc_type: AI-Internal`を持つ`tasks.md`は存在しない。影響ゼロ |
| `workflow-visual-mock.e2e.test.ts:32`のproposal.mdモック | `Explanation`に変更（ユーザー確認済み） | スコープ外 | proposal.mdの正しいdoc_typeは`Explanation`。将来的なリグレッションを防ぐため保守的に修正する |
| `doc-type-enforcement.e2e.test.ts`の`AI-Internal`テスト | 「rejects AI-Internal」テストに反転して維持（ユーザー確認済み） | テストごと削除 | 廃止後の振る舞いを明示的に文書化できる。実装コスト増を許容する |
| アーカイブ済み変更ディレクトリの確認 | スコープ外・注記不要（ユーザー確認済み） | 確認して注記 | archiveコマンドはアーカイブ済みディレクトリをvalidateしないため実害なし |
| エラーメッセージの更新 | 許容値リストを4種に変更：`Reference, Explanation, How-to, Tutorial` | `AI-Internal`を括弧書きで「廃止済み」として表示 | メッセージはFR-001の許容値を正確に反映すべき |

## Web References

- [Diátaxis — Reference](https://diataxis.fr/reference/) — Reference guides contain "the technical description — facts — accurate, complete, reliable information, free of distraction and interpretation." Architecture should mirror the structure of the thing described (like a map).
- [Diátaxis — Home](https://diataxis.fr/) — Diátaxisの4象限（Tutorial/How-to/Reference/Explanation）の定義元。AIが消費するかどうかはDiátaxisの分類軸に含まれない。
- [Diátaxis — Start Here](https://diataxis.fr/start-here/) — 4種類の文書形式の概要。Referenceは情報志向（information-oriented）、How-toはタスク志向（task-oriented）と明記。
- [Diátaxis — The Map](https://diataxis.fr/map/) — 2×2マトリクスで学習/作業×理論/実践の軸を定義。AI専用型は軸のどこにも位置しない。

## Codebase Findings

### `packages/cli/src/lib/artifact-validator.ts`

- **L27–33**: `VALID_DOC_TYPES`配列に`'AI-Internal'`が含まれる。この1エントリを除去するだけで全バリデーションロジックが連動して変わる
- **L37**: `VALID_DOC_TYPES_LIST`は`VALID_DOC_TYPES`から`join`で生成されるため、個別修正不要
- **L151–155**: エラーメッセージ内の`VALID_DOC_TYPES_LIST`は動的参照のため、配列変更のみで正しいメッセージに自動更新される

### `packages/cli/templates/artifacts/tasks.en.md`

- **L1–3**: YAMLフロントマターが`doc_type: AI-Internal`を宣言 → `doc_type: Reference`に変更
- **L6–7**: アンカーコメントが`FR-001, FR-004`を参照 → `FR-001, FR-007`に更新

### `packages/cli/templates/artifacts/tasks.ja.md`

- **L1–3**: `doc_type: AI-Internal` → `doc_type: Reference`に変更
- **L6–7**: アンカーを`FR-001, FR-004` → `FR-001, FR-007`に更新

### `packages/cli/tests/e2e/artifact-taxonomy-doc-type.e2e.test.ts`

- **L22–28**: `VALID_DOC_TYPES`配列のローカル定義に`'AI-Internal'`を含む → 削除
- **L39–40**: `EXPECTED_DOC_TYPES`マップで`tasks.ja.md`と`tasks.en.md`が`'AI-Internal'`にマッピング → `'Reference'`に変更
- **L65–66**: describeブロックのタイトルが「five doc types (Diátaxis + AI-Internal)」→「four Diátaxis doc types」に変更

### `packages/cli/tests/e2e/template-doc-type-invariant.e2e.test.ts`

- **L15**: describeブロック名に`'FR-004: ...'`参照 → `'FR-007: ...'`に更新
- **L31–48**: `'AI-Internal識別子も ja/en テンプレート間で locale-invariant'`テストケース → `'Reference'`で置き換え（AI-Internalではなくtasks.mdがReferenceであることを検証）

### `packages/cli/tests/e2e/doc-type-enforcement.e2e.test.ts`

- **L119**: 期待文字列内の`AI-Internal`を許容値から除去した文字列に更新
- **L126–138**: `'accepts a template declaring doc_type: AI-Internal (exit 0)'`テスト → 「rejects AI-Internal (exit non-zero)」に反転して維持

### `packages/cli/tests/e2e/workflow-visual-mock.e2e.test.ts`

- **L32**: テスト用proposal.mdモックに`doc_type: AI-Internal` → `doc_type: Explanation`に変更（proposal.mdの正規doc_type）

### `specs/artifact-taxonomy/spec.md`（SoT — archive後に更新）

- **L15**: FR-001本文から`AI-Internal`を除去、「four Diátaxis types」に変更
- **L23–26**: Scenario「tasks.md template declares AI-Internal」を削除
- **L30, L37**: FR-002の許容値リストから`AI-Internal`を削除
- **L61–69**: FR-004全体を削除

### `specs/cli-spec-lint/spec.md`（SoT — archive後に更新）

- **L160–179**: FR-015全体をDelta Specの新定義に置き換え（`AI-Internal`を reject する方向に反転）

### `docs/reference/doc-types.md`

- **L20**: すでに「Custom or compound types (e.g. `AI-Internal`, `Mixed`) are explicitly forbidden」と記載 → 変更不要
- **L33**: `tasks.md`の行がすでに`Reference`と記載 → 変更不要
- **L50**: Roadmapセクションの `AI-Internal` 議論 → 「廃止された」旨に更新

### `README.md`

- 対象箇所がすでに`AI-Internal`を禁止として記述 → 変更不要

## Open Choices

（全てユーザーとの対話で解決済み）

---

## Constitution Check

| 原則 | Phase 0 評価 | Phase 1 |
|---|---|---|
| I: ステップ独立性 | ✅ research は他ステップの成果物を変更しない。Delta Spec（delta ステップ）と research は独立 | — |
| II: 決定論的マージ | ✅ FR-007 (ADDED)・FR-004 (REMOVED)・FR-001/FR-002/FR-015 (MODIFIED) はいずれも archive 時に機械的マージ可能。競合リスクなし | — |
| III: 質問駆動の要件確定 | ✅ Open Choices 3件をユーザーへの質問で解決済み。未解決事項なし | — |
| IV: 双方向アンカー | ✅ tasks.md テンプレートのアンカーを FR-004 → FR-007 に更新することで双方向アンカーを維持 | — |
| V: 強制ステップと拡張ステップの分離 | ✅ research は拡張ステップ。delta（強制ステップ）で確定した要件の調査のみを行い、要件の変更は行わない | — |
