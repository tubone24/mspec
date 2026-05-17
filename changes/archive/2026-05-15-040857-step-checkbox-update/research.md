---
doc_type: Research
---

# Research: step-checkbox-update

## Decisions

| 論点 | 採用案 | 代替案 | 根拠 |
|------|--------|--------|------|
| どのスキルが readme.md Artifacts チェックボックスを更新するか | `produces: []` でない 7 ステップのみ（proposal / delta / research / design / quickstart / checklist / tasks） | 全 11 ステップ | `workflow.default.yaml` より: `new` は readme 自体を生成するため除外。`self-review`・`implement`・`archive` は `produces: []` であり Artifacts 行に対応エントリなし |
| Procedure 内の挿入位置 | 成果物書き込み後・`mspec validate` 実行前 | validate 後 | validate 時点では成果物は既に存在している。validate 失敗でもチェックボックス更新は行うべき（成果物は書かれたという事実を反映） |
| TNNN フォーマット | `T\d{3}` （例: `T001`, `T010`, `T101`） | 任意形式 | archived tasks.md の全行が `T001`〜`T203` の 3 桁固定ゼロパディング形式を使用 |
| tasks.md タスクチェックボックス更新タイミング | `--expect-green` 成功直後（FR-016 Scenario 参照） | 全タスク完了後 | 部分完了タスクは未更新とする仕様（FR-016 Scenario 2）と整合 |
| checklist-auditor の自己検証 | 全項目書き終え後に `verify:` なし行を再スキャンし、残存行があればアノテーション付与してから完了宣言 | 生成時に保証 | FR-011 Scenario 3 に明示。auditor agent の Constraints セクションにルール追加 |
| `specs/<capability>/spec.md` の行更新 | テンプレートのリテラル行 `- [ ] specs/*/spec.md (Delta Spec)` を `- [x] specs/*/spec.md (Delta Spec)` に更新（1 行のまま） | capability ごとに展開した行を個別更新 | ユーザー確認済み。Delta Spec FR-015 Scenario 2 と整合 |
| validate 失敗時のチェックボックス扱い | validate 失敗時は `- [x]` を `- [ ]` にロールバックする | 更新を維持 | ユーザー確認済み。無効な成果物を「完了」として扱わない |
| `design.md / architecture-overview.md` の 1 行をいつ更新するか | 両ファイル書き込み後に 1 回更新 | 最初のファイル書き込み後に更新 | ユーザー確認済み。readme の 1 行表現と整合 |

## Codebase Findings

### ランタイム スキルファイル（11 files）

各ファイルのチェックボックス更新ステップ挿入位置を示す。

| ファイル | Artifacts 対象行 | 挿入位置（Procedure ステップ番号の後） |
|----------|-----------------|---------------------------------------|
| `.claude/skills/mspec-proposal/SKILL.md` | `- [ ] proposal.md` | Step 5（proposal.md 書き込み）後、Step 6（Constitution Check）前 |
| `.claude/skills/mspec-delta/SKILL.md` | `- [ ] specs/*/spec.md (Delta Spec)` | Step 4（全 spec.md 生成）後、Step 5（mspec validate）前 |
| `.claude/skills/mspec-research/SKILL.md` | `- [ ] research.md` | Step 5（research.md 書き込み）後、Step 8（mspec validate）前 |
| `.claude/skills/mspec-design/SKILL.md` | `- [ ] design.md / architecture-overview.md` | Step 4（architecture-overview.md 書き込み）後、Step 5（Constitution Check 再評価）前 |
| `.claude/skills/mspec-quickstart/SKILL.md` | `- [ ] quickstart.md` | Step 3（quickstart.md 書き込み）後、Step 4（mspec validate）前 |
| `.claude/skills/mspec-checklist/SKILL.md` | `- [ ] checklist.md` | Step 5（checklist.md 書き込み）後、Step 6（mspec validate）前 |
| `.claude/skills/mspec-tasks/SKILL.md` | `- [ ] tasks.md` | Step 5（Constitution Check 追記）後、Step 7（mspec validate）前 |
| `.claude/skills/mspec-implement/SKILL.md` | N/A（readme checkbox なし） | Step 3（`--expect-green` 記録直後）に `tasks.md` の `- [ ] TNNN` → `- [x] TNNN` 更新を追加 |
| `.claude/skills/mspec-new/SKILL.md` | 除外（readme 自体を生成） | 変更なし |
| `.claude/skills/mspec-review/SKILL.md` | 除外（`produces: []`） | 変更なし |
| `.claude/skills/mspec-archive/SKILL.md` | 除外（`produces: []`） | 変更なし |

### エージェントファイル（1 file）

- `.claude/agents/mspec-checklist-auditor.md` — 既に `verify:` アノテーションルールを Constraints として記述済み。FR-011 Scenario 3（自己検証ステップ）の実施指示が欠如しているため、Constraints に自己検証ルールを追加する

### CLI テンプレートファイル（ランタイムと同期必須）

ランタイムと CLI テンプレートは全ファイル同一であることを diff で確認済み（出力なし）。**ただし例外:**

- `.claude/skills/mspec-proposal/SKILL.md` と `packages/cli/templates/claude/skills/mspec-proposal/SKILL.md` に 1 行差分あり（CLI テンプレートに Step 5 のサブ箇条書きが欠落）。この差分は本 change のスコープ外（既存のズレ）。本 change の変更では両ファイルへ同一内容を追加する。

CLI テンプレート側の対象ファイル（ランタイムと 1:1 対応）:
- `packages/cli/templates/claude/skills/mspec-proposal/SKILL.md`
- `packages/cli/templates/claude/skills/mspec-delta/SKILL.md`
- `packages/cli/templates/claude/skills/mspec-research/SKILL.md`
- `packages/cli/templates/claude/skills/mspec-design/SKILL.md`
- `packages/cli/templates/claude/skills/mspec-quickstart/SKILL.md`
- `packages/cli/templates/claude/skills/mspec-checklist/SKILL.md`
- `packages/cli/templates/claude/skills/mspec-tasks/SKILL.md`
- `packages/cli/templates/claude/skills/mspec-implement/SKILL.md`
- `packages/cli/templates/claude/agents/mspec-checklist-auditor.md`

### readme.md テンプレート

`packages/cli/templates/artifacts/readme.md` — `## Artifacts` 節の 7 行すべてが `- [ ]` 形式。各スキルが更新すべき対象行のリテラル文字列が定義されている。

### workflow.default.yaml

`packages/cli/templates/workflow.default.yaml` — `produces:` の有無でチェックボックス更新対象ステップを決定:
- `produces: []`: `self-review`、`implement`、`archive` — 除外
- `produces: [readme.md]`: `new` — 除外（readme 生成者のため）

### 既存の archived changes でのチェックボックス状態

全 archived change（5 件）の `readme.md` の `## Artifacts` が全行 `- [ ]` のままであること、および `tasks.md` の全タスク行が `- [ ]` のまま（1 行も `- [x]` なし）であることを確認した。本変更が解決すべき問題が実在することを確認。

## Web References

- [GitHub Flavored Markdown - Task lists](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/about-task-lists) — `- [ ]` / `- [x]` の仕様。GFM では `- [x]` が checked 状態。
- [sed string replacement (POSIX)](https://pubs.opengroup.org/onlinepubs/9699919799/utilities/sed.html) — スキルファイルの指示として「Edit ツール / sed による exact-string 置換」を明示するか否かはデザインで決定。

## Open Choices

なし（全 3 件をユーザーへの質問で解決済み。Decisions テーブルに記録）

## Constitution Check

> Step: research | Constitution Version: 1.0

| Principle | Phase 0 | Notes |
|-----------|---------|-------|
| I. ステップ独立性 | ✅ | 各スキルが自ステップの成果物に対応する Artifacts 行のみを更新。他ステップの行には触れない |
| II. 決定論的マージ | ✅ | `- [ ]` → `- [x]` は exact-string 置換。`specs/*/spec.md` のリテラル行が readme に 1 行のみ存在する前提（Open Choices 参照）|
| III. 質問駆動の要件確定 | ✅ | 3 問の Q&A でスコープ確定済み（proposal.md 参照）。残存 Open Choices 3 件はデザインで解決 |
| IV. 双方向アンカー | ✅ | FR-015 / FR-016 が claude-integration Delta Spec に追記済み。実装時に anchor ブロックを各スキルファイルに挿入する |
| V. 強制ステップと拡張ステップの分離 | ✅ | 既存の強制ステップ内 Procedure への手順追加のみ。新ステップ・新スキル不要 |
