<!-- mspec: gaps in FR numbering are intentional. Removed requirements are archived under changes/archive/. -->

# mspec-archive Specification

## Purpose

`mspec archive` コマンド完了後に起動する AI 駆動のポストモーテムスキルであり、Lessons 分析・NextAction 評価・capability spec の Purpose 自動生成を順次実行する。ユーザーの明示的承認なしに `memory/constitution.md` や `changes/` への書き込みを行わない安全ガードを備え、承認されたエントリのみを永続化する。

## Requirements

<!-- archive コマンドが Delta Spec の ADDED/MODIFIED/REMOVED/RENAMED を機械的にマージします -->

### Requirement: FR-001 — Lessons 分析フロー起動

<!-- risk_tier: standard -->
<!-- blast_radius: module -->

`mspec archive` が完了したとき、このシステムは SHALL mspec-lessons-analyzer サブエージェントを起動し、アーカイブ対象チェンジの `readme.md` から Lessons セクションを読み取らせ、`memory/constitution.md` への追加提案を取得する。

#### Scenario: Lessons あり、提案が生成される
- GIVEN アーカイブ対象チェンジの `readme.md` に Lessons が 1 件以上記載されている
- WHEN `mspec archive` の最終ステップが完了する
- THEN mspec-lessons-analyzer サブエージェントが起動し、constitution.md への追加提案リストを返す

#### Scenario: Lessons なし、スキップされる
- GIVEN アーカイブ対象チェンジの `readme.md` に Lessons が記載されていない
- WHEN `mspec archive` の最終ステップが完了する
- THEN Lessons 分析フローをスキップし、NextAction 評価フローのみ実行する

### Requirement: FR-002 — NextAction 評価フロー起動

<!-- risk_tier: standard -->
<!-- blast_radius: module -->

`mspec archive` が完了したとき、このシステムは SHALL mspec-nextaction-planner サブエージェントを起動し、アーカイブ対象チェンジの `readme.md` から Next Steps セクションを読み取らせ、優先度付きの新規チェンジ登録提案を取得する。

#### Scenario: Next Steps あり、提案が生成される
- GIVEN アーカイブ対象チェンジの `readme.md` に Next Steps が 1 件以上記載されている
- WHEN Lessons 分析フローが完了（またはスキップ）する
- THEN mspec-nextaction-planner サブエージェントが起動し、優先度付きの NextAction リストを返す

### Requirement: FR-003 — ユーザー承認なしの自動書き込み禁止

<!-- risk_tier: critical -->
<!-- blast_radius: system -->

ユーザーが AskUserQuestion で却下した提案に対して、このシステムは MUST NOT `memory/constitution.md` への書き込みも `mspec new` の実行も行わない。

#### Scenario: ユーザーが Lessons 提案を却下する
- GIVEN mspec-lessons-analyzer が constitution.md への追加提案を返した
- WHEN ユーザーが AskUserQuestion で「却下」を選択する
- THEN そのエントリは constitution.md に追記されず、スキップ済みとしてログに残す

#### Scenario: ユーザーが NextAction 提案を却下する
- GIVEN mspec-nextaction-planner が NextAction の新規チェンジ登録提案を返した
- WHEN ユーザーが AskUserQuestion で「登録しない」を選択する
- THEN `mspec new` は実行されず、`changes/` 配下に新規ディレクトリは生成されない

### Requirement: FR-004 — 承認済み NextAction の自動チェンジ生成

<!-- risk_tier: standard -->
<!-- blast_radius: local -->

ユーザーが AskUserQuestion で NextAction の新規チェンジ登録を承認したとき、このシステムは SHALL mspec-nextaction-planner が生成した kebab-case 名を用いて `mspec new <feature-kebab>` を `changes/` 配下のみで実行し、新しいチェンジディレクトリを生成する。

#### Scenario: NextAction を新規チェンジとして登録する
- GIVEN mspec-nextaction-planner が NextAction "E2E テストのカバレッジ向上" の提案と kebab-case 名 "e2e-coverage-improvement" を返した
- WHEN ユーザーが AskUserQuestion で承認する
- THEN `mspec new e2e-coverage-improvement` が実行され、`changes/<timestamp>-e2e-coverage-improvement/` ディレクトリが生成される

### Requirement: FR-005 — アーカイブ後の Purpose フィールド自動生成

<!-- risk_tier: standard -->
<!-- blast_radius: module -->

`mspec archive` が完了したとき、このシステムは SHALL `## Purpose` セクションがテンプレートプレースホルダー（`<このスペックがカバーする外部から観測可能な振る舞いの概要>`）のままの capability spec.md に対して、そのスペック内容を基に 1〜2 文の外部観測可能な振る舞いの概要を生成し、プレースホルダーを置き換えて書き込む。

#### Scenario: アーカイブ後に Purpose が自動生成される
- GIVEN アーカイブ対象チェンジの Delta Spec が既存 capability に要件を追加するものである
- AND `specs/<capability>/spec.md` の `## Purpose` がテンプレートプレースホルダーのままである
- WHEN `mspec archive <change-name> -y` が完了する
- THEN mspec-archive スキルが `specs/<capability>/spec.md` の Purpose を 1〜2 文の意味のある記述で上書きし、プレースホルダーは残らない

#### Scenario: Purpose が既に記述済みの場合はスキップ
- GIVEN `specs/<capability>/spec.md` の `## Purpose` にプレースホルダー以外のテキストが記述されている
- WHEN `mspec archive` が完了する
- THEN Purpose フィールドは変更されない


