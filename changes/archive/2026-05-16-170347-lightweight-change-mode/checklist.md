---
doc_type: Checklist
---

# Checklist: 目的別チェンジモード（typo / minor / bugfix）

## Delta Spec Coverage

### claude-integration — FR-018: mspec:new skill infers mode from request text and stores it in readme.md

- [x] [claude-integration FR-018] 説明文からモードが AI 推定され確認後に readme.md に書き込まれる: mspec-new SKILL.md が説明文解析→推定モード確認→ `> Mode: typo` 書き込みの手順を持つ <!-- verify: fr-018 -->
- [x] [claude-integration FR-018] AI 推定が誤っていた場合にユーザーが訂正できる: スキル手順がユーザー訂正時に訂正後のモード値で readme.md を上書きする <!-- verify: fr-018 -->
- [x] [claude-integration FR-018] --mode 引数で明示指定した場合は AI 推定をスキップする: `--mode` フラグ検出時は AskUserQuestion を省略して直接書き込む手順が SKILL.md に存在する <!-- verify: fr-018 -->
- [x] [claude-integration FR-018] フルフロー対象の説明文では Mode フィールドを書き込まない: スキルがフルフロー判定時に `> Mode:` 行を readme.md へ追記しない <!-- verify: fr-018 -->

### claude-integration — FR-019: スキルはモードに基づいてステップを自動スキップする

- [x] [claude-integration FR-019] typo モードで /mspec:proposal が自動スキップされる: `readme.md` に `> Mode: typo` がある場合 mspec-proposal スキルが成果物を生成せず終了し `## Skipped Steps` に記録を追記する <!-- verify: fr-019 -->
- [x] [claude-integration FR-019] minor モードで /mspec:quickstart が自動スキップされる: `readme.md` に `> Mode: minor` がある場合 mspec-quickstart スキルが成果物を生成せず終了し `## Skipped Steps` に記録を追記する <!-- verify: fr-019 -->
- [x] [claude-integration FR-019] bugfix モードで /mspec:proposal が自動スキップされる: `readme.md` に `> Mode: bugfix` がある場合 mspec-proposal スキルが成果物を生成せず終了し `## Skipped Steps` に記録を追記する <!-- verify: fr-019 -->
- [x] [claude-integration FR-019] モード未指定チェンジではスキップが発生しない: `readme.md` に `Mode:` フィールドがない場合 mspec-proposal スキルが通常実行を継続する <!-- verify: fr-019 -->

### claude-integration — FR-020: bugfix モードは research ステップを強制する

- [x] [claude-integration FR-020] bugfix モードで /mspec:research がスキップ不可になる: `readme.md` に `> Mode: bugfix` がある状態でユーザーが research スキップを試みると「bugfix モードでは research は必須です」の通知と拒否が行われる <!-- verify: fr-020 -->
- [x] [claude-integration FR-020] bugfix モードで research が正常完了した場合は次ステップへ進む: bugfix モードで research.md が生成完了した場合は次ステップ（delta）への通常遷移が阻害されない <!-- verify: fr-020 -->

### cli-workflow-engine — FR-019: workflow.yaml に modes セクションを追加

- [x] [cli-workflow-engine FR-019] workflow.yaml の modes 定義が typo モードのスキップを制御する: `mspec continue` が `> Mode: typo` を持つ readme.md を読み `proposal` と `quickstart` ステップを `skipped` 状態として扱う <!-- verify: fr-019 -->
- [x] [cli-workflow-engine FR-019] modes 未定義のモード値は全ステップを実行する: `workflow.yaml` に存在しないモード値が readme.md に記載されている場合 システムは警告を出力して全ステップをスキップなしで実行する <!-- verify: fr-019 -->

### cli-workflow-engine — FR-020: Mode フィールドなしの既存チェンジは後方互換のままフルフローを実行

- [x] [cli-workflow-engine FR-020] Mode フィールドなしで全ステップが実行される: `readme.md` に `Mode:` フィールドが存在しない既存チェンジで `mspec continue` が全ワークフローステップをスキップなしで実行する <!-- verify: fr-020 -->

### cli-workflow-engine — FR-021: workflow.yaml の modes は force リストを受け付ける

- [x] [cli-workflow-engine FR-021] bugfix モードで force リストの research がスキップ不可になる: `modes.bugfix.force: [research]` が定義されている場合 `mspec continue` が research ステップを `skippable: false` として扱いスキップを拒否する <!-- verify: fr-021 -->
- [x] [cli-workflow-engine FR-021] force と skip に同じステップが指定された場合は force が優先される: 同一モード定義で `skip: [research]` と `force: [research]` が共存する場合 `force` が優先され research はスキップ不可となる <!-- verify: fr-021 -->

---

## Source-of-Truth Regression

### cli-workflow-engine SoT への回帰リスク

- [x] [回帰リスク: cli-workflow-engine FR-006] mode-driven lazy スキップが `ready`/`blocked` の上流評価に正しくカウントされるか確認する: `evaluateStep()` がモード由来スキップステップを skip-log 記録済みと同等に扱い下流ステップの `ready` 判定を妨げないこと <!-- verify: human -->
- [x] [回帰リスク: cli-workflow-engine FR-008] `skipped` 状態の取得元が skip-log 単一である前提が崩れる: lazy モードスキップが skip-log に書かれない場合 `mspec status` が当該ステップを `skipped` と報告できないリスクがあること、FR-008 との整合を検証すること <!-- verify: human -->
- [x] [回帰リスク: cli-workflow-engine FR-015] `upstream_skipped[]` 配列にモード由来スキップが含まれるか確認する: lazy スキップが skip-log に記録されないならば `upstream_skipped` に現れず下流エージェントが欠落に気づけないリスクがある <!-- verify: human -->
- [x] [回帰リスク: cli-workflow-engine FR-001] `modes:` セクションを持つ malformed `workflow.yaml` で fatal エラーが発生することを確認する: `ModeRuleSchema` バリデーション失敗時にコマンドが非ゼロ終了することを検証 <!-- verify: human -->
- [x] [回帰リスク: cli-workflow-engine FR-002] `proposal` ステップが `removable: false` を維持したまま mode-driven 論理スキップが共存することを確認する: `REQUIRED_STEP_IDS` の不変性と lazy スキップの両立を検証 <!-- verify: human -->

### claude-integration SoT への回帰リスク

- [x] [回帰リスク: claude-integration FR-002] mspec-new SKILL.md 修正後も frontmatter (`name`, `description`, `when_to_use`) と `## Procedure` 見出しが保持されていることを確認する <!-- verify: human -->
- [x] [回帰リスク: claude-integration FR-003] mspec-new SKILL.md の Procedure 先頭ステップが `mspec status --change <name> --json` 実行であり続けることを確認する <!-- verify: human -->
- [x] [回帰リスク: claude-integration FR-015] mode-driven スキップ時に対象ステップの `## Artifacts` チェックボックスが未チェックのまま残るか、または適切に処理されるかを確認する（仕様に明記なし）<!-- verify: human -->
- [x] [回帰リスク: claude-integration FR-017] mspec-new SKILL.md に追加されるテキストに `/mspec:<step>` コロン形式のみが使われ `mspec-continue` 等のハイフン形式が含まれないことを確認する <!-- verify: human -->

### cli-skip-questions SoT への回帰リスク

- [x] [回帰リスク: cli-skip-questions FR-001] `commands/skip.ts` に force チェックを追加した後も `skippable: true` 以外のステップに対する `mspec skip` が依然として非ゼロ終了することを確認する <!-- verify: human -->

---

## Constitution

- [x] [原則 I. ステップ独立性] `parseMode()` が毎回 `readme.md` を読むため前段セッションのコンテキストに依存せず、`mspec continue` エンベロープへの `mode` 追加が後方互換な追加であることを確認する <!-- verify: human -->
- [x] [原則 II. 決定論的マージ] `modes:` はスキップルール定義のみでマージロジック（CLI パーサー）に影響せず、`mspec archive` が同一入力に対してバイト単位で同一出力を生成し続けることを確認する <!-- verify: human -->
- [x] [原則 III. 質問駆動の要件確定] mspec-new SKILL.md が推定モード確認を AskUserQuestion による 1 問 1 答で実施し、決定根拠が `readme.md` の `> Mode:` 行に永続化されることを確認する <!-- verify: human -->
- [x] [原則 IV. 双方向アンカー] `readme-parser.ts`・`state-engine.ts`・`skip.ts` の各実装ファイルおよび対応する E2E テストに `@mspec-delta` アンカーが付与され、`mspec anchor check` がすべての FR（FR-018〜FR-021）を最低 1 つのアンカーブロックに紐付けることを確認する <!-- verify: human -->
- [x] [原則 V. 強制ステップと拡張ステップの分離] `proposal` ステップが `workflow.yaml` スキーマで `removable: false` のまま変更されておらず、mode-driven スキップが skip-log 経由の論理スキップとして実現されていることを確認する <!-- verify: human -->
