---
doc_type: Reference
---

# Design: fix-command-name-consistency

## Summary

スキルファイル・CLIソース・テンプレート・ドキュメントに混在するハイフン形式のスラッシュコマンド参照（`/mspec-XXX`）を、コロン形式（`/mspec:XXX`）へ純粋なテキスト置換で修正する。
対象 55 ファイルで、ロジックの変更・新機能追加・スキル構造変更は一切行わない。
サブエージェント名（`mspec-researcher` 等）とスキルレジストリ識別子（`name: mspec-new` 等）は変更しない。

## Goals

- 全ファイルで `grep -r '/mspec-'` のヒット数が 0 になること（コンテキスト限定）
- スキル・コマンドファイルの手順末尾が `/mspec:continue` を指示するようになること
- CLI 出力メッセージが `/mspec:proposal` 等のコロン形式を出力するようになること

## Non-Goals

- ハイフン形式コマンドの後方互換エイリアス追加
- スキル名・ディレクトリ名の変更
- ロジック変更・新機能追加
- サブエージェント名の変更

## Technical Context

- Language / Runtime: TypeScript (Node.js ≥18), Markdown
- Dependencies (new): なし
- Storage: ファイルシステム（`.md`, `.ts` ファイル）
- Testing framework: Vitest
- Target platform: CLI（ローカル実行）
- Performance / Constraints: なし（テキスト置換のみ）

## Project Structure (changes)

**ランタイム スキルファイル（11ファイル）**
- 修正: `.claude/skills/mspec-new/SKILL.md`
- 修正: `.claude/skills/mspec-proposal/SKILL.md`
- 修正: `.claude/skills/mspec-delta/SKILL.md`
- 修正: `.claude/skills/mspec-research/SKILL.md`
- 修正: `.claude/skills/mspec-design/SKILL.md`
- 修正: `.claude/skills/mspec-quickstart/SKILL.md`
- 修正: `.claude/skills/mspec-checklist/SKILL.md`
- 修正: `.claude/skills/mspec-tasks/SKILL.md`
- 修正: `.claude/skills/mspec-implement/SKILL.md`
- 修正: `.claude/skills/mspec-archive/SKILL.md`
- 修正: `.claude/skills/mspec-review/SKILL.md`

**ランタイム コマンドファイル（12ファイル）**
- 修正: `.claude/commands/mspec/new.md`
- 修正: `.claude/commands/mspec/proposal.md`
- 修正: `.claude/commands/mspec/delta.md`
- 修正: `.claude/commands/mspec/research.md`
- 修正: `.claude/commands/mspec/design.md`
- 修正: `.claude/commands/mspec/quickstart.md`
- 修正: `.claude/commands/mspec/checklist.md`
- 修正: `.claude/commands/mspec/tasks.md`
- 修正: `.claude/commands/mspec/implement.md`
- 修正: `.claude/commands/mspec/review.md`
- 修正: `.claude/commands/mspec/archive.md`
- 修正: `.claude/commands/mspec/continue.md`

**CLI ソース・テスト（3ファイル）**
- 修正: `packages/cli/src/commands/init.ts`（l.238）
- 修正: `packages/cli/src/commands/new.ts`（l.41）
- 修正: `packages/cli/src/commands/archive.test.ts`（l.12–43 フィクスチャ）

**CLI テンプレート（23ファイル）**
- 修正: `packages/cli/templates/claude/commands/mspec/*.md`（12ファイル）
- 修正: `packages/cli/templates/claude/skills/mspec-*/SKILL.md`（11ファイル）

**ワークフロー設定（2ファイル）**
- 修正: `.mspec/workflow.yaml`（全ステップの `command:` フィールド）
- 修正: `packages/cli/templates/workflow.default.yaml`（全ステップの `command:` フィールド）

**ドキュメント・仕様書（4ファイル）**
- 修正: `README.md`
- 修正: `docs/design/mspec-design.md`
- 修正: `specs/claude-integration/spec.md`
- 修正: `specs/cli-init/spec.md`

## Decisions

### Decision 1: スラッシュコマンド参照のみを修正し、識別子は保持する

- **採用**: `/mspec-XXX` がスラッシュコマンドとしてユーザーへ案内される文脈のみ `/mspec:XXX` に変換する。具体的には以下のルール：
  - **変換する**: プロシージャ本文・`when_to_use:` フィールド・CLI 出力文字列・ドキュメント内の `/mspec-<step>` スラッシュコマンド参照
  - **変換しない**: `name:` YAML フロントマター（スキルレジストリ識別子）・`skill:` フィールド・サブエージェント名（`mspec-researcher` 等）・ファイル/ディレクトリパス・`@mspec-delta` アンカー
- **代替**: 全ての `mspec-` 文字列を機械的に置換する
- **トレードオフ**: 機械的置換は実装が単純だが、スキルレジストリ識別子やサブエージェント名まで変えると CLI の動作が壊れる。識別子を保護する選択的置換を採用
- **受け入れ基準（FR-017 Scenario）**: `grep -r "mspec-" .claude/` を実行したとき、スラッシュコマンド参照のヒットが 0 件であること

### Decision 2: ランタイムファイルとテンプレートを同時に修正する

- **採用**: `.claude/` 配下のランタイムファイルと `packages/cli/templates/claude/` 配下のテンプレートを同一タスク内で両方修正する
- **代替**: ランタイムだけ修正し、テンプレートは別タスク
- **トレードオフ**: 同時修正すると `mspec init` で生成されるプロジェクトも即座に正しいコマンド形式を持つ。片方だけ修正すると乖離が生まれる
- **受け入れ基準（FR-001 Scenario）**: テンプレートファイルで `grep -r "mspec-" packages/cli/templates/` が 0 件

### Decision 3: workflow.yaml の `command:` フィールドをコロン形式に修正する

- **採用**: `.mspec/workflow.yaml` の `command: /mspec-new` 等を `command: /mspec:new` に変更する
- **代替**: workflow.yaml は変更しない
- **トレードオフ**: Claude Code のスラッシュコマンドは実際に `/mspec:new`（コロン）形式で登録されているため、`command:` 値もそれに合わせる必要がある。変更しないと workflow.yaml が誤ったコマンド名を記録し続ける
- **受け入れ基準**: `workflow.yaml` 内の全 `command:` 値がコロン形式

### Decision 4: SoT スペックファイルも直接修正する

- **採用**: `specs/claude-integration/spec.md`・`specs/cli-init/spec.md` 内の FR 本文・シナリオ内の `/mspec-XXX` 参照を直接修正する
- **代替**: archive ステップで delta spec をマージして間接的に修正する
- **トレードオフ**: SoT ファイルへの直接修正はアーキテクチャ的には archive ステップが担うが、これは「誤記の修正」であり新規 FR の追加ではない。Delta Spec（FR-017・FR-001・FR-002）は新規ルールを追加するものであり、既存 FR 本文内の誤記修正は別事象として直接修正が適切

## Constitution Check (Phase 0 + Phase 1)

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | ✅ | 各ファイルへの修正は独立；design は設計のみでコード変更なし |
| II. 決定論的マージ | ✅ | ✅ | テキスト置換は決定論的；除外ルール（識別子保護）が明確に文書化 |
| III. 質問駆動の要件確定 | ✅ | ✅ | スコープ・廃止方針・完了基準は proposal で確定済み |
| IV. 双方向アンカー | ✅ | ✅ | FR-017 → スキルファイル、FR-001/FR-002 → CLI/docs と対応が取れている |
| V. 強制ステップと拡張ステップの分離 | ✅ | ✅ | 既存ファイルの文字列修正のみ；ステップ・コマンド追加なし |

### Complexity Tracking

None

## Self-Review

> Reviewer: mspec-self-reviewer | Date: 2026-05-15

### Findings

| # | Severity | Artifact | Finding | Resolution |
|---|----------|----------|---------|------------|
| 1 | HIGH | design.md | `packages/cli/templates/workflow.default.yaml` がスコープ未記載（11件の `/mspec-` 参照が残る） | Project Structure に追加、total を 55 に修正済み |
| 2 | HIGH | design.md | コマンドファイルが 9 件ではなく 12 件（`archive.md`・`checklist.md`・`quickstart.md` が抜けていた） | ランタイムおよびテンプレート両方で 12 件に修正済み |
| 3 | HIGH | design.md | Decision 1 で `when_to_use:` フィールドの扱いが未定義（変換すべきなのに保護対象と誤解される恐れ） | Decision 1 に変換する/しないの明示的なリストを追加済み |
| 4 | MEDIUM | quickstart.md | Verify の grep スコープが `docs/` と `README.md` を除外していた | quickstart.md の grep コマンドを拡張 |
| 5 | MEDIUM | quickstart.md | Golden Path の実行ステップが placeholder のみだった | `/mspec:implement` の実行を明示するよう修正 |
| 6 | MEDIUM | checklist.md | `when_to_use` フィールドの変換確認項目が未記載 | checklist.md に追加 |
| 7 | LOW | design.md | ファイル数カウントの不整合 | 55 に統一済み |
| 8 | INFO | checklist.md | Constitution IV のアンカーチェックが docs-only 変更に非適用の可能性あり | 注記を追加 |

### Verdict

PASS_WITH_NOTES（修正適用後）

3 つの HIGH 問題（スコープ漏れ・カウント誤り・`when_to_use` 扱いの曖昧さ）はすべて design.md・checklist.md・quickstart.md の修正で解消した。

## Self-Review (Pass 2)

> Reviewer: mspec-self-reviewer | Date: 2026-05-15

### Resolution Check

| # | Original Finding | Severity | Status | Notes |
|---|-----------------|----------|--------|-------|
| 1 | workflow.default.yaml missing from scope | HIGH | RESOLVED | Project Structure に追加、ファイル数 55 に反映 |
| 2 | Command count 9→12 | HIGH | RESOLVED | ランタイム・テンプレート両方で 12 ファイルに修正済み |
| 3 | when_to_use: ambiguity | HIGH | RESOLVED | Decision 1 に「変換する/しない」の明示リストを追加。checklist.md に when_to_use 確認項目を追加 |
| 4 | Verify grep scope missing docs/ and README.md | MEDIUM | RESOLVED | quickstart.md の全 grep コマンドが docs/ と README.md をカバー |
| 5 | Golden Path placeholder | MEDIUM | RESOLVED | `/mspec:implement` の実行を明示するよう修正 |

### New Findings

なし（nit レベルの grep パス重複は機能に影響しない）

### Verdict

PASS

全 3 件の HIGH・2 件の MEDIUM 問題が適切に解消されており、実装に進んで問題ない。
