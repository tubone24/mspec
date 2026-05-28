# Tasks: postmortem-archive-integration

## Phase 1: Setup — スキルファイル骨格の作成

### T-001: mspec-lessons-analyzer SKILL.md 骨格を作成する

2 箇所にスキルファイルのディレクトリとスケルトンを作成する。

- `.claude/skills/mspec-lessons-analyzer/SKILL.md` (runtime)
- `packages/cli/templates/claude/skills/mspec-lessons-analyzer/SKILL.md` (template)

anchor:
  @mspec-delta 2026-05-27-115017-postmortem-archive-integration/specs/mspec-lessons-analyzer/spec.md
  Requirements implemented: FR-001, FR-002
  Change: postmortem-archive-integration

<!-- verify: fr-001 -->

---

### T-002: mspec-nextaction-planner SKILL.md 骨格を作成する

2 箇所にスキルファイルのディレクトリとスケルトンを作成する。

- `.claude/skills/mspec-nextaction-planner/SKILL.md` (runtime)
- `packages/cli/templates/claude/skills/mspec-nextaction-planner/SKILL.md` (template)

anchor:
  @mspec-delta 2026-05-27-115017-postmortem-archive-integration/specs/mspec-nextaction-planner/spec.md
  Requirements implemented: FR-001, FR-002
  Change: postmortem-archive-integration

<!-- verify: fr-001 -->

---

## Phase 2: Foundational — サブエージェントスキルの実装

### T-003: [E2E] mspec-lessons-analyzer が LessonsProposal[] を返すことを確認する

テスト用チェンジの `readme.md` に `### Lessons` を含むフィクスチャを用意し、mspec-lessons-analyzer サブエージェントを手動起動して以下を確認する。
- 各エントリが `{ text, target_section, source_lesson }` の 3 フィールドを持つ
- `target_section` が `"Core Principles"` または `"Additional Constraints"` のいずれかである
- constitution.md の既存原則と重複する Lesson が除外される
- 全 Lessons が既存原則と重複する場合は空リストが返される

anchor:
  @mspec-delta 2026-05-27-115017-postmortem-archive-integration/specs/mspec-lessons-analyzer/spec.md
  Requirements implemented: FR-001, FR-002
  Change: postmortem-archive-integration

<!-- verify: fr-001 -->

---

### T-004: mspec-lessons-analyzer SKILL.md の手順を実装する

`mspec-lessons-analyzer/SKILL.md` に以下の手順を記述する。

1. 入力として受け取った `readme_path`（絶対パス）から `### Lessons` セクションの全エントリを読み取る
2. `memory/constitution.md` を読み込み、既存原則・制約と照合して重複エントリを除外する
3. 残ったエントリそれぞれについて、原則/制約本文・追記推奨セクション（固定 enum）・元 Lesson テキストの 3 要素を持つ `LessonsProposal` オブジェクトを生成する
4. 提案リストを呼び出し元（archive スキル）に返す
5. `### Lessons` が空または存在しない場合は空リスト `[]` を返す

anchor:
  @mspec-delta 2026-05-27-115017-postmortem-archive-integration/specs/mspec-lessons-analyzer/spec.md
  Requirements implemented: FR-001, FR-002
  Change: postmortem-archive-integration

<!-- verify: fr-001 -->

---

### T-005: [E2E] mspec-nextaction-planner が NextActionProposal[] を返すことを確認する

テスト用チェンジの `readme.md` に `### Next Steps` を含むフィクスチャ（日本語テキスト・特殊文字を含むケースを含む）を用意し、mspec-nextaction-planner サブエージェントを手動起動して以下を確認する。
- 各エントリが `{ priority, kebab_name, summary, source_next_step }` の 4 フィールドを持つ
- `priority` が `high` / `medium` / `low` のいずれかである
- `kebab_name` が `^[a-z0-9][a-z0-9-]*[a-z0-9]$` に適合する
- 特殊文字（`; rm -rf /` 等）が除去された安全な文字列であること

anchor:
  @mspec-delta 2026-05-27-115017-postmortem-archive-integration/specs/mspec-nextaction-planner/spec.md
  Requirements implemented: FR-001, FR-002
  Change: postmortem-archive-integration

<!-- verify: fr-001 -->

---

### T-006: mspec-nextaction-planner SKILL.md の手順を実装する

`mspec-nextaction-planner/SKILL.md` に以下の手順を記述する。

1. 入力として受け取った `readme_path`（絶対パス）から `### Next Steps` セクションの全エントリを読み取る
2. 各エントリの緊急度・影響範囲・実装コストを評価し `priority: high | medium | low` を付与する
3. 各エントリを要約・正規化して `^[a-z0-9][a-z0-9-]*[a-z0-9]$` に適合する `kebab_name` を生成する（元テキストをそのまま使わない）
4. 特殊文字・記号・大文字を kebab_name から除去する
5. 提案リストを呼び出し元（archive スキル）に返す
6. `### Next Steps` が空または存在しない場合は空リスト `[]` を返す

anchor:
  @mspec-delta 2026-05-27-115017-postmortem-archive-integration/specs/mspec-nextaction-planner/spec.md
  Requirements implemented: FR-001, FR-002
  Change: postmortem-archive-integration

<!-- verify: fr-001 -->

---

## Phase 3: User Story — archive スキルへのポストモーテムフック統合

### T-007: [E2E] archive 完了後に Lessons 分析フローが起動することを確認する

Lessons あり・なしの 2 種類のフィクスチャチェンジで `/mspec:archive` を実行し、以下を確認する。
- Lessons がある場合: mspec-lessons-analyzer が起動し、AskUserQuestion（multi-select）が表示される
- Lessons がない場合: Lessons 分析フローがスキップされ通知のみが表示される

anchor:
  @mspec-delta 2026-05-27-115017-postmortem-archive-integration/specs/mspec-archive/spec.md
  Requirements implemented: FR-001
  Change: postmortem-archive-integration

<!-- verify: fr-001 -->

---

### T-008: archive SKILL.md にポストモーテムフック（Lessons フロー）を追加する

`.claude/skills/mspec-archive/SKILL.md` のステップ 3b と 4 の間に以下を追加する。

**[新規] ステップ 3c: Lessons 分析フック**

1. アーカイブ済み readme.md のパスを確認する（`changes/archive/<change>/readme.md`）
2. `### Lessons` セクションの存在と内容を確認する
3. 空の場合はスキップして通知する
4. 存在する場合は `mspec-lessons-analyzer` サブエージェントを Agent tool でインライン起動する（入力: `{ readme_path: "<絶対パス>" }`）
5. 返ってきた `LessonsProposal[]` を AskUserQuestion（multi-select）で提示する
6. ユーザーが承認したエントリのみ `memory/constitution.md` の `target_section` に追記する

anchor:
  @mspec-delta 2026-05-27-115017-postmortem-archive-integration/specs/mspec-archive/spec.md
  Requirements implemented: FR-001
  Change: postmortem-archive-integration

<!-- verify: fr-001 -->

---

### T-009: [E2E] constitution.md 書き込みがユーザー承認後のみ実行されることを確認する

テスト実行中に以下の 2 パターンを検証する。
- ユーザーが全提案を却下 → constitution.md が変更されていないこと（`git diff memory/constitution.md` が空）
- ユーザーが提案を承認 → 承認したエントリのみが constitution.md に追記されていること

anchor:
  @mspec-delta 2026-05-27-115017-postmortem-archive-integration/specs/memory-constitution/spec.md
  Requirements implemented: FR-001, FR-002
  Change: postmortem-archive-integration

<!-- verify: human -->

---

### T-010: archive SKILL.md にポストモーテムフック（Next Steps フロー）を追加する

ステップ 3c の Lessons フロー完了後に続けて以下を追加する。

**Next Steps 評価フック**

1. アーカイブ済み readme.md の `### Next Steps` セクションの存在と内容を確認する
2. 空の場合はスキップして通知する
3. 存在する場合は `mspec-nextaction-planner` サブエージェントを Agent tool でインライン起動する（入力: `{ readme_path: "<絶対パス>" }`）
4. 返ってきた `NextActionProposal[]` を優先度付きで AskUserQuestion（multi-select）で提示する
5. ユーザーが承認したエントリに対して `mspec new <kebab_name>` を実行する（`changes/` 配下のみ）

anchor:
  @mspec-delta 2026-05-27-115017-postmortem-archive-integration/specs/mspec-archive/spec.md
  Requirements implemented: FR-002, FR-004
  Change: postmortem-archive-integration

<!-- verify: fr-002 -->

---

### T-011: [E2E] 承認された NextAction が新規チェンジとして生成されることを確認する

テスト実行中に以下を確認する。
- ユーザーが NextAction を承認 → `changes/<timestamp>-<kebab_name>/` ディレクトリが生成されている
- ユーザーが NextAction を却下 → `changes/` 配下に該当ディレクトリが生成されていない
- `mspec validate --change <new-change-dir>` が正常終了する

anchor:
  @mspec-delta 2026-05-27-115017-postmortem-archive-integration/specs/mspec-archive/spec.md
  Requirements implemented: FR-004
  Change: postmortem-archive-integration

<!-- verify: fr-004 -->

---

### T-012: [E2E] 却下した提案が一切書き込まれないことを確認する（FR-003 検証）

全提案を却下した状態で archive を実行し、以下をすべて確認する。
- `memory/constitution.md` が変更されていない
- `changes/` 配下に新規ディレクトリが生成されていない
- `git diff` がクリーンである（readme.md 移動以外の変更なし）

anchor:
  @mspec-delta 2026-05-27-115017-postmortem-archive-integration/specs/mspec-archive/spec.md
  Requirements implemented: FR-003
  Change: postmortem-archive-integration

<!-- verify: human -->

---

## Phase 4: Polish — 同期・アンカー・整合性確認

### T-013: template ディレクトリのスキルファイルを runtime と同期する

以下のファイルを runtime 版と同一内容にする。

- `packages/cli/templates/claude/skills/mspec-archive/SKILL.md`
- `packages/cli/templates/claude/skills/mspec-lessons-analyzer/SKILL.md`
- `packages/cli/templates/claude/skills/mspec-nextaction-planner/SKILL.md`

anchor:
  @mspec-delta 2026-05-27-115017-postmortem-archive-integration/specs/mspec-archive/spec.md
  Requirements implemented: FR-001, FR-002, FR-003, FR-004
  Change: postmortem-archive-integration

<!-- verify: fr-001 -->

---

### T-014: 全 SKILL.md に @mspec-delta アンカーを付与する

新規作成・修正した全 SKILL.md ファイルのヘッダ部に `@mspec-delta` アンカーを追加する。

対象ファイル（runtime + template の計 6 ファイル）:
- `.claude/skills/mspec-archive/SKILL.md` → FR-001, FR-002, FR-003, FR-004
- `.claude/skills/mspec-lessons-analyzer/SKILL.md` → FR-001, FR-002
- `.claude/skills/mspec-nextaction-planner/SKILL.md` → FR-001, FR-002

anchor:
  @mspec-delta 2026-05-27-115017-postmortem-archive-integration/specs/mspec-lessons-analyzer/spec.md
  Requirements implemented: FR-001, FR-002
  Change: postmortem-archive-integration

<!-- verify: fr-001 -->

---

### T-015: `mspec anchor check` で全アンカーが解決することを確認する

```bash
mspec anchor check --change 2026-05-27-115017-postmortem-archive-integration
```

全アンカーがエラーなく解決することを確認する。

anchor:
  @mspec-delta 2026-05-27-115017-postmortem-archive-integration/specs/mspec-archive/spec.md
  Requirements implemented: FR-001, FR-002, FR-003, FR-004
  Change: postmortem-archive-integration

<!-- verify: fr-001 -->

---

## Constitution Check

| 原則 | Phase 0 | Phase 1 |
|------|---------|---------|
| I. ステップ独立性 | OK — 各サブエージェントタスクが独立したコンテキストで完結するよう実装手順に明記した | — |
| II. 決定論的マージ | OK — constitution.md への追記は target_section 固定 enum で決定論的に行う実装手順を記載した | — |
| III. 質問駆動の要件確定 | OK — T-008・T-010 で AskUserQuestion（multi-select）経由の承認フローを実装タスクに組み込んだ | — |
| IV. 双方向アンカー | OK — T-014 で全 SKILL.md へのアンカー付与、T-015 でアンカー解決確認タスクを設けた | — |
| V. 強制ステップと拡張ステップの分離 | OK — workflow.yaml の変更タスクは存在しない。postmortem は SKILL.md 内の追加手順として実装する | — |
| VI. Security by Default | OK — T-009 と T-012 に `<!-- verify: human -->` を付与し、書き込み禁止・却下時動作の人間レビューを必須化した | — |

<!-- LEARNING: produces:[] のステップは mspec done <step-id> コマンドで完了マークが必要。mspec validate + mspec continue だけでは前進しない | source: FR-001 | confidence: high -->
