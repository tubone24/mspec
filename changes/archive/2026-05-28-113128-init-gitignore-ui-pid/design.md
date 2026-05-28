---
doc_type: Reference
---

<!-- See also: ./design-rationale.md for採用理由・代替案 -->

# Design: init-gitignore-ui-pid

## Summary

`mspec init` 実行時に `.mspec/.gitignore` を自動生成し、UIサーバーのPIDファイル（`ui.pid`）をgit管理対象外にする。実装は `packages/cli/src/commands/init.ts` の `PlannedFile[]` 配列に1エントリを追加し、`packages/cli/templates/` に静的テンプレートファイルを1件追加するのみ。既存の `collisions` チェック機構により `--force` フラグを用いた衝突制御が自動的に適用される。

## Technical Context

| コンポーネント | ファイル | 役割 |
|---|---|---|
| init コマンド | `packages/cli/src/commands/init.ts` | `PlannedFile[]` 配列に `.mspec/.gitignore` エントリを追加 |
| テンプレートファイル | `packages/cli/templates/mspec-gitignore` | `.mspec/.gitignore` の静的テンプレート内容 |
| PID マネージャー | `packages/cli/src/server/pidManager.ts` | `ui.pid` の生成元（変更なし・参照のみ） |
| PlannedFile 型 | `packages/cli/src/commands/init.ts` | `{ from, to, transform? }` 構造（`from`・`to` は絶対パス） |
| collisions チェック | `packages/cli/src/commands/init.ts:241-251` | 既存ファイルがあり `--force` なし → `process.exit(1)` |

## Project Structure

| ファイル | 操作 | 変更内容 |
|---|---|---|
| `packages/cli/src/commands/init.ts` | 修正 | `PlannedFile[]` 配列に `.mspec/.gitignore` エントリを追加（FR-012） |
| `packages/cli/templates/mspec-gitignore` | 新規作成 | `ui.pid` を含む静的テンプレートファイル |

### PlannedFile エントリの形式

```typescript
// packages/cli/src/commands/init.ts （PlannedFile[] 配列内）
{
  from: join(templatesDir, 'mspec-gitignore'),
  to: join(root, '.mspec', '.gitignore'),
  // transform なし — 静的ファイルのためそのままコピー
}
```

### テンプレートファイルの内容

```
# mspec runtime-generated files
ui.pid
```

### アンカーパターン

`init.ts` に以下のアンカーコメントを追加する：

```typescript
// @mspec-delta 2026-05-28-113128-init-gitignore-ui-pid/specs/cli-init/spec.md
// Requirements implemented: FR-012
// Change: init-gitignore-ui-pid
```

## Decisions

| 論点 | 採用案 | 受け入れ基準（Scenario） | 根拠 |
|------|--------|--------------------------|------|
| `.mspec/.gitignore` の生成方式 | `PlannedFile[]` に追加してテンプレートから生成 | FR-012 Scenario "Fresh init creates .mspec/.gitignore" — GIVEN `.mspec/.gitignore` が存在しない WHEN `mspec init` を実行 THEN `.mspec/.gitignore` が作成され `ui.pid` 行を含む | 既存パターンへの統合で `--force` 制御が自動適用される |
| `--force` なし時の上書き防止 | `collisions` チェックをそのまま利用 | FR-012 Scenario "Existing .mspec/.gitignore is not overwritten without --force" — GIVEN `.mspec/.gitignore` が存在する WHEN `--force` なしで `mspec init` を実行 THEN 内容が変更されない | `PlannedFile[]` への追加のみで既存制御が適用される（追加実装不要） |
| `--force` 時の再生成 | `collisions` チェックをスキップして `writeFile` 上書き | FR-012 Scenario "Force re-init regenerates .mspec/.gitignore" — GIVEN `.mspec/.gitignore` が存在する WHEN `mspec init --force` を実行 THEN `.mspec/.gitignore` が再生成され `ui.pid` 行を含む | `--force` フラグが `collisions` チェックをスキップする既存の動作（init.ts:241-251）に委ねる |
| テンプレートファイルの変数置換 | なし（静的ファイル） | `ui.pid` のみ含む固定内容のため transform 関数は不要 | `applyConfigTransforms()` のような transform 関数が不要なシンプルな実装 |

## Constitution Check

> Step: design | Constitution Version: 1.0

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | ✅ | `mspec init` コマンドは単独で完結。`.mspec/.gitignore` 生成は `plan` 配列への1エントリ追加で完結し、他ステップへの副作用なし |
| II. 決定論的マージ | ✅ | ✅ | `PlannedFile[]` からの静的ファイル書き込みは冪等。同じ入力に対して常に同じ出力が生成される |
| III. 質問駆動の要件確定 | ✅ | ✅ | Open Choice OC-001（追加パターン）をユーザーに確認済み（`ui.pid` のみで確定）。未確定事項なし |
| IV. 双方向アンカー | ✅ | ✅ | `init.ts` に `@mspec-delta` アンカーを追加予定。FR-012 が実装ファイルと spec を双方向参照 |
| V. 強制ステップと拡張ステップの分離 | ✅ | ✅ | `workflow.yaml` 不変。`mspec init` という既存の強制ステップ内への処理追加のみ |
| VI. Security by Default | ✅ | ✅ | PID ファイル（ポート情報含む）が git に混入するリスクを排除。セキュリティを強化する方向の変更 |

### Complexity Tracking

None — 違反 0 件。`PlannedFile[]` への1エントリ追加とテンプレートファイル1件の追加のみ。

<!-- LEARNING: PlannedFile配列への追加のみで --force 衝突制御が自動適用されるパターンは design でも明示すべき | source: FR-012 | confidence: high -->

## Self-Review

> Reviewer: mspec-self-reviewer | Pass: 1 | Overall: PASS WITH NOTES

### Findings

| Severity | Artifact | Finding | Action |
|----------|----------|---------|--------|
| blocker (修正済み) | `design.md` Technical Context / PlannedFile エントリ | `PlannedFile` 型のフィールド名が実際のコードと不一致。`{ dest, templateName }` と記述していたが実際は `{ from, to }` で絶対パスを使用（`init.ts:189-199`）。実装時に TypeScript エラーになる。 | `{ from: join(templatesDir, 'mspec-gitignore'), to: join(root, '.mspec', '.gitignore') }` に修正済み |
| blocker (修正済み) | `architecture-overview.md` System Diagram エッジラベル | 上記と同様に誤ったフィールド名 `dest/templateName` を使用しており、設計文書全体に誤情報が伝播していた。 | エッジラベルを `from: templates/mspec-gitignore\nto: .mspec/.gitignore` に修正済み |
| nit (no action) | `packages/cli/templates/mspec-gitignore` | テンプレートファイルに拡張子なし。既存テンプレート（`config.default.yaml` 等）は拡張子付き。実装時に規約を統一するか判断を明示すること。 | 実装者判断で可。blockerではない |
| ok | `architecture-overview.md` | Mermaid System Diagram が存在し要件を満たしている。 | no action |
| ok | `checklist.md` | FR-012 全3シナリオに `verify: fr-012` アノテーション付き。regression チェック（FR-001/004/005/006）も網羅。FR-004 は `[HIGH]` マーク済み。 | no action |
| ok | quickstart.md | minor change のため skip は意図的な決定であり文書化済み。 | no action |
| ok | `specs/cli-init/spec.md` | `## Security Capabilities` セクションが存在。Principle VI checklist 項目が `[x]` で検証済み。 | no action |

### Constitution 再確認（レビュアー評価）

| Principle | Phase 0 | Phase 1 | Verdict |
|-----------|---------|---------|---------|
| I. ステップ独立性 | ✅ | ✅ | AGREE — `mspec init` は単独完結。`ensureGitignoreEntry`（ルート `.gitignore` 追記）と `.mspec/.gitignore` 生成は別パス・別関数であり混在なし（`init.ts:266-267` 参照） |
| II. 決定論的マージ | ✅ | ✅ | AGREE — blocker 修正後の `PlannedFile` は静的テンプレートの idempotent コピーであり冪等性は保たれる |
| III. 質問駆動の要件確定 | ✅ | ✅ | AGREE — `research.md` の Open Choices（OC-001）に `ui.pid` のみで確定した判断が記録されており、追加パターンの代替案も文書化されている |
| IV. 双方向アンカー | ✅ | ✅ | AGREE — design.md にアンカーパターンが明示されている。blocker 修正後に正しいコードが実装されることで双方向参照が成立する |
| V. 強制ステップと拡張ステップの分離 | ✅ | ✅ | AGREE — `workflow.yaml` テンプレートへの変更なし。既存の `mspec init` 強制ステップ内への拡張のみ |
| VI. Security by Default | ✅ | ✅ | AGREE — `specs/cli-init/spec.md` に `## Security Capabilities` セクションあり。PID ファイルの git 混入リスクを排除する方向の変更 |

### Delta Spec → アーティファクト カバレッジ確認

**FR-012**: 全3シナリオ（Fresh init / No-force / Force re-init）が `specs/cli-init/spec.md:20-36` に定義され、`design.md` Decisions テーブルで各シナリオが受け入れ基準として参照されており、`checklist.md` に対応する `verify: fr-012` アイテムが3件存在する。カバレッジ完全。
