---
doc_type: Reference
---

# Design: Diátaxis Artifact Structure

## Summary

全成果物テンプレートに Diátaxis ドキュメントタイプ（`doc_type:` YAML フロントマター）を追加し、`mspec new` と同時に空の `glossary.md` を自動生成する。Delta Spec の ADDED Requirement スタブのデフォルトキーワードを `MUST` から `SHALL` に変更して EARS 形式を正式採用し、`mspec-delta` / `mspec-proposal` / `mspec-design` の SKILL.md を EARS+Scenario 形式の明示的指示に更新する。

## Goals

- 全成果物テンプレートに `doc_type: <Diátaxisタイプ>` YAML フロントマターを追加する
- `mspec new` 実行時に空の `glossary.md`（`doc_type: Reference`）を自動生成する
- `delta-init.ts` の ADDED スタブキーワードを `MUST` → `SHALL` に変更する（FR-011）
- `mspec-delta` / `mspec-proposal` / `mspec-design` の SKILL.md を EARS+Scenario 形式対応に更新する（FR-010）
- `memory/constitution.md` に MUST/SHALL/SHOULD 判定基準を追記する

## Non-Goals

- `artifact-validator.ts` への `doc_type` 機械バリデーション追加（AI チェックのみ）
- 既存 change / archive 済み成果物の遡及的修正
- CLI インターフェース（引数・サブコマンド名）変更
- EARS 構文の機械的バリデーション実装

## Technical Context

- Language / Runtime: TypeScript / Node.js ≥ 18
- Dependencies (new): なし（既存の `gray-matter` が `doc_type` フロントマターをそのままパース可能）
- Storage: ファイルシステム（`packages/cli/templates/`、`.claude/skills/`、`memory/`）
- Testing framework: Vitest
- Target platform: CLI (Node.js)
- Performance / Constraints: テンプレートへのフロントマター追加のみ。パフォーマンス影響なし

## Constitution Check (Phase 0)

| Principle | Compliant? | Notes |
|-----------|------------|-------|
| I. ステップ独立性 | ✅ | テンプレート変更は既存ステップ間の依存関係を増やさない |
| II. 決定論的マージ | ✅ | YAML フロントマターは archive の Markdown パーサーに影響しない（フロントマターは `---` ブロックとして無視される） |
| III. 質問駆動の要件確定 | ✅ | research の Open Choices 3 件をユーザー回答済み |
| IV. 双方向アンカー | ✅ | 実装ファイルに @mspec-delta アンカーを打つ。アンカー数: delta-init.ts, new.ts に各 1 箇所 |
| V. 強制ステップと拡張ステップの分離 | ✅ | glossary.md 生成を mspec new の副作用として追加するが、強制ステップ定義には触れない |

## Project Structure (changes)

### 新規作成

- `packages/cli/templates/artifacts/glossary.md` — glossary テンプレート（`doc_type: Reference` + `## Terms` セクション）

### 修正

| ファイル | 変更内容 |
|----------|----------|
| `packages/cli/src/commands/delta-init.ts` | `buildDeltaSkeleton()` 内の `The system MUST` → `The system SHALL`（1 箇所）|
| `packages/cli/templates/artifacts/delta-spec.md` | ADDED スタブ行 6 の `MUST` → `SHALL`（参照用テンプレートを実装と一致させる） |
| `packages/cli/src/commands/new.ts` | `glossary.md` の生成追加（`buildGlossary()` 関数追加）、`buildReadme()` の Artifacts リストに `glossary.md` を追加 |
| `packages/cli/templates/artifacts/proposal.md` | YAML フロントマター `doc_type: Explanation` を先頭に追加 |
| `packages/cli/templates/artifacts/research.md` | YAML フロントマター `doc_type: Reference` を先頭に追加。テンプレート本文に `glossary.md` への参照コメントを追加（FR-003 Scenario 2 対応） |
| `packages/cli/templates/artifacts/design.md` | YAML フロントマター `doc_type: Reference` を先頭に追加 |
| `packages/cli/templates/artifacts/tasks.md` | YAML フロントマター `doc_type: Reference` を先頭に追加 |
| `packages/cli/templates/artifacts/checklist.md` | YAML フロントマター `doc_type: Reference` を先頭に追加 |
| `packages/cli/templates/artifacts/quickstart.md` | YAML フロントマター `doc_type: How-to` を先頭に追加 |
| `packages/cli/templates/artifacts/architecture-overview.md` | YAML フロントマター `doc_type: Reference` を先頭に追加 |
| `packages/cli/templates/artifacts/readme.md` | YAML フロントマター `doc_type: Reference` を先頭に追加（参照用） |
| `.claude/skills/mspec-delta/SKILL.md` | Procedure step 4 に EARS 5 パターン・SHALL/MUST/SHOULD 使い分けの明示的指示を追加 |
| `.claude/skills/mspec-proposal/SKILL.md` | Proposal の Capabilities セクション記述手順に「後続 delta ステップで EARS+Scenario 形式が適用される」旨の注記を追加 |
| `.claude/skills/mspec-design/SKILL.md` | Procedure step 3 に「design.md の受け入れ基準を Delta Spec の Scenario（GIVEN/WHEN/THEN）と対応付ける」指示を追加 |
| `memory/constitution.md` | `## Additional Constraints` に「RFC 2119 キーワードセマンティクス」節を追記 |

## Decisions

### 1. readme.md への doc_type フロントマター追加

- 採用: `buildReadme()` のヘッダに `doc_type: Reference` フロントマターを追加する（参照用テンプレートとの一貫性）
- 代替: readme.md はワークフロー内部ドキュメントとして Diátaxis 分類対象外にする
- トレードオフ: 内部ドキュメントにも `doc_type` を付けることで「全成果物に doc_type を付ける」ルールの例外を設けない。一方、readme.md のフロントマターは `mspec new` の `buildReadme()` 関数内に直接埋め込む形になり、テンプレートと実装が二重管理になる。現状の new.ts がテンプレートファイルを使わない設計のため、この二重管理は既存の設計上の借り。

### 2. EARS パターンの案内位置

- 採用: `mspec-delta` SKILL.md の Procedure のみに記述する
- 代替: Delta Spec テンプレートのコメント、または `memory/constitution.md`
- トレードオフ: テンプレートをシンプルに保ち、SKILL.md を参照する LLM のみが EARS パターンを受け取る。Constitution は判定基準（MUST/SHALL/SHOULD 使い分け）のみを持ち、5 パターン詳細は SKILL.md に委譲することで単一ソースを維持する。

### 3. glossary.md の Artifacts リストへの追加

- 採用: `buildReadme()` の `## Artifacts` チェックリストに `- [ ] glossary.md` を追加する
- 代替: readme.md テンプレートを修正して glossary.md を一覧に含める
- トレードオフ: `buildReadme()` が直接生成するため、テンプレートとの二重管理問題に同じく該当する。今回のスコープ内で両方修正し一貫性を保つ。

## Constitution Check (Phase 1, 計画詳細後)

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | ✅ | テンプレート変更・SKILL.md 更新のいずれも既存ステップ間の依存関係を変えない。`mspec new` への glossary.md 追加はステップ実行前の初期化であり独立性を損なわない |
| II. 決定論的マージ | ✅ | ✅ | YAML フロントマターは `---` ブロックとして archive パーサーに透過的。`delta-init.ts` の文字列変更は archive ロジックに無関係 |
| III. 質問駆動の要件確定 | ✅ | ✅ | research の Open Choices 3 件・design の trade-off 確認をすべてユーザー回答済み。設計中に新たな未解決事項なし |
| IV. 双方向アンカー | ✅ | ✅ | 変更ファイル（delta-init.ts, new.ts）に `@mspec-delta` アンカーを追加する。SKILL.md / テンプレートはアンカー対象外（実装ファイルではない） |
| V. 強制ステップと拡張ステップの分離 | ✅ | ✅ | glossary.md は mspec new の副作用として追加するが、`workflow.yaml` の強制ステップ定義（removable フラグ）には一切触れない |

### Complexity Tracking

None

## Migration Plan / Rollout

1. テンプレートファイル（`packages/cli/templates/artifacts/`）の doc_type フロントマター追加 — 既存 change への影響なし（テンプレートは新規 change 生成時のみ使用）
2. `delta-init.ts` の SHALL 変更 — 次回以降の `mspec delta init` 実行から適用。既存 Delta Spec は変更なし
3. `new.ts` の glossary.md 生成追加 — 次回以降の `mspec new` 実行から適用。既存 change には glossary.md なし（遡及的生成は Non-Goal）
4. SKILL.md 更新 — 即時適用（次回の Claude セッションから有効）
5. `memory/constitution.md` 更新 — 即時適用

## Self-Review

> Reviewer: mspec-self-reviewer | Step: self-review | Constitution Version: 1.0.0

### Findings

| # | Severity | Area | Finding | Resolution |
|---|----------|------|---------|------------|
| 1 | ⚠️ | FR-003 / design.md | FR-003 の Scenario 2「research.md が glossary.md の用語参照先を含む」が design.md Project Structure の `research.md` 行に記載されていない（フロントマター追加のみ記載）。checklist 項目が実装時に判断できない。 | design.md の `research.md` 修正行に「glossary.md への参照コメントを追加」を明記 |
| 2 | ⚠️ | quickstart.md / Verify | Verify の `mspec validate` 項目は doc_type を機械検証しないため非決定的。Non-Goal と矛盾する印象を与える。 | `mspec validate` の Verify 項目を既存構造チェック（Constitution Check ブロック・Mermaid フェンス）に限定する旨を明記するよう修正 |
| 3 | ⚠️ | quickstart.md / Golden Path | Step 5 の `head -4` 複数ファイル同時実行はファイルセパレータ (`==> file ==>`) が出力に含まれ期待出力と一致しない。 | 各ファイルを別コマンドに分割するか `-q` フラグを追加 |
| 4 | ⚠️ | artifact-taxonomy FR-001 | FR-001 本文が `MUST` を使用しているが、本変更が導入する新セマンティクスでは機能要件は `SHALL` を使う。FR-001 はテンプレート出力形式（機能要件）を記述している。 | FR-001 本文を `The system SHALL include` に変更 |
| 5 | ✅ | Proposal ↔ Delta Spec 整合 | 全 5 ゴールが FR にマップ済み。 | なし |
| 6 | ✅ | FR 完全性 | 全 FR が H3 ヘッダ・RFC 2119 本文・H4 Scenario（GIVEN/WHEN/THEN）を保持。 | なし |
| 7 | ✅ | Research → Design トレーサビリティ | 全 9 決定事項が design.md に追跡可能。 | なし |
| 8 | ✅ | Mermaid ダイアグラム | architecture-overview.md に 3 つの Mermaid ブロックが存在。 | なし |
| 9 | ✅ | Non-Goal 遵守 | CLI インターフェース変更・EARS 構文機械バリデーション・遡及的書き直しは一切提案されていない。 | なし |
| 10 | ✅ | Constitution Phase 0 / Phase 1 | design.md・architecture-overview.md の Constitution Check が両フェーズとも ✅。 | なし |
| 11 | ✅ | Checklist FR カバレッジ | 全 FR に checklist 項目あり。主要リグレッションリスクに ⚠️ 付与済み。 | なし |
| 12 | ✅ | スコープクリープなし | 提案スコープ外の変更なし。 | なし |

### Summary

全体的な構成は堅牢で、FR 構造・Research→Design トレーサビリティ・Constitution チェックはすべて合格。Finding 1（FR-003 Scenario 2 の design.md 未記載）と Finding 4（FR-001 の MUST→SHALL）は tasks ステップ前に修正を推奨する。Finding 2・3 は quickstart の軽微な記述修正であり、いずれもブロッカーではない。修正後、tasks ステップへ進められる状態にある。
