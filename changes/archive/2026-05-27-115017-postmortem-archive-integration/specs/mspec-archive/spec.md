# Delta Spec: mspec-archive

## Security Capabilities

<!-- 権限境界: ファイルシステムアクセス（changes/ 配下の readme.md 読み取り + memory/constitution.md への限定書き込み） -->
<!-- アクセス増加: ファイル読み書き範囲の拡大（Lessons/Next Steps 読み取り + constitution.md 書き込み追加） -->
<!-- エージェント権限: あり（mspec-lessons-analyzer / mspec-nextaction-planner サブエージェントへの読み取り権限委譲） -->
<!-- ロールバック手段: git revert -->

## ADDED Requirements

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

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
