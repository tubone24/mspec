---
doc_type: Reference
---

<!-- 用語定義は glossary.md を参照 -->

# Research: 目的別チェンジモード（typo / minor / bugfix）

## Decisions

| 論点 | 採用案 | 代替案 | 根拠 |
|------|--------|--------|------|
| `> Mode:` の保存場所 | `readme.md` ブロッククォート行として追記（`> Mode: typo`） | YAML frontmatter フィールドとして追加 | readme.md は既に `> Status:` / `> Created:` をブロッククォートで記述（`templates/artifacts/readme.md:7-8`）。フォーマットを統一するためブロッククォート方式を採用 |
| モードの決定方法 | AI が `/mspec:new` の説明文を解析して推定し、ユーザーに確認を取ってから書き込む。`--mode` 明示指定時は推定スキップ | ユーザーが常に `--mode` を明示指定（推定なし） | 多くの場合はキーワード（typo・バグ・修正など）から自明に判定可能。確認ステップを挟むことで誤判定時の訂正も可能。`--mode` 上書きによるエスケープハッチも維持 |
| モードの読み取り主体 | `state-engine.ts` 内で readme.md を読んでモードを取得し lazy にスキップを決定 | `mspec new` 実行時に即座に skip-log に書き込む（eager） | Lazy 方式はモード変更時に skip-log が陳腐化するリスクがない。`state-engine.ts` は既に `isSkipped()` で分岐済み（`state-engine.ts:73`） |
| モード定義の置き場 | `workflow.yaml` の `modes:` セクションにスキップ／フォースルールを宣言 | 各スキルが SKILL.md 内にハードコード | workflow.yaml が唯一の設定ソース。スキルN個に同じロジックを複製しない。`WorkflowSchema`（`types/workflow.ts:23-29`）を拡張するだけで対応可能 |
| bugfix の research 強制実装 | `commands/skip.ts:24-26` の `!step.skippable` チェックと並列にモード確認ガードを追加（CLI 側） | research スキル（SKILL.md）内でモードを確認しスキップを拒否 | CLI 側に集約することで、スキル直接呼び出しでも `mspec continue` 経由でも force ルールが一貫して機能する |
| `> Mode:` のパース実装 | 新規ヘルパー `src/lib/readme-parser.ts` に `parseMode()` を実装 | 各コマンド内でインライン regex | state-engine・skip・continue が同一パーサーを共有できる単一真実源パターン。将来の拡張（Status・Created パース等）にも対応しやすい |
| `minor` モードで research/design もスキップするか | proposal/quickstart のみスキップ（Proposal 定義通り） | minor にも research・design をスキップ対象として加える | Proposal の Goals に「minor は proposal と quickstart をスキップ」と明記。追加スキップは Open Question として将来検討 |
| モード未指定チェンジの後方互換 | `> Mode:` 行が存在しない = フルフロー維持（マイグレーション不要） | デフォルトモードを `full` として明示的に設定 | 既存チェンジへの影響ゼロを最優先。`parseMode()` が `null` を返す場合にフルフローとして扱う |

## Web References

- [Conventional Commits v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/) — `fix` / `feat` / `BREAKING CHANGE` という変更種別で自動的にパッチ/マイナー/メジャーを決定するパターン。mspec の typo / minor / bugfix モードと構造的に対応する
- [Changesets vs Semantic Release (Brian Schiller)](https://brianschiller.com/blog/2023/09/18/changesets-vs-semantic-release/) — changesets は「開発者が明示的に変更種別を宣言する」方式。mspec の `/mspec:new --mode` による明示指定と同じアプローチ

## Codebase Findings

- `packages/cli/src/types/workflow.ts:3-29` — `StepSchema` の Zod 定義。現在 `skippable: boolean` と `enabled: boolean` のみが制御フラグ。`WorkflowSchema` にトップレベルの `modes` フィールドを追加する必要がある
- `packages/cli/src/types/workflow.ts:31` — `REQUIRED_STEP_IDS = ['new', 'proposal', 'delta', 'tasks', 'implement', 'archive']`。`proposal` が必須ステップに含まれており `removable: false`。モードによるスキップは論理スキップ（skip-log 登録）として扱う必要がある
- `packages/cli/src/commands/skip.ts:24-26` — `!step.skippable` なら即 throw。bugfix の force ロジックはここにモード確認ガードとして追加する
- `packages/cli/src/lib/skip-log.ts:42-44` — `isSkipped(log, changeName, stepId)` が skip-log を参照して true/false を返す。state-engine がこれを呼ぶ唯一の分岐点
- `packages/cli/src/lib/state-engine.ts:70-97` — `evaluateStep()` が最初に `isSkipped()` を確認しステップを `'skipped'` とマーク。ここに `isModeDrivenSkip(mode, step.id)` の判定を差し込む
- `packages/cli/src/commands/continue.ts:44-62` — `continueCommand()` は `loadWorkflow` → `computeStatus` の順で動作。readme.md を読む処理は現在ない。モード読み取りはここで readme.md をパースして注入する形が最小変更
- `packages/cli/src/commands/new.ts:47-72` — `buildReadme()` が `> Status:` / `> Created:` ブロッククォートを生成。`> Mode:` を同列に追加する場合のテンプレート変更箇所
- `packages/cli/templates/artifacts/readme.md:7-8` — `> Status: <new|in-progress|archived>` / `> Created: __TODAY__` — ブロッククォート形式で記述済み。`> Mode:` の追加パターンと一致
- `packages/cli/templates/claude/skills/mspec-new/SKILL.md:14` — Step 4「Open `readme.md` and write a 1–3 line `## Request` summary」。ここにモード記述の手順を追加する
- `packages/cli/templates/workflow.default.yaml:18-26` — `proposal` ステップ: `removable: false`, `skippable` フラグなし。モード由来スキップは論理スキップとして扱う必要あり
- `packages/cli/templates/workflow.default.yaml:39-49` — `research` ステップ: `skippable: true`, `removable: true`。bugfix force はこのステップへの `mspec skip` を runtime に拒否する形で実装可能
- `packages/cli/templates/workflow.default.yaml:61-68` — `quickstart` ステップ: `skippable: true`, `removable: true`。typo/minor/bugfix でのスキップ対象
- `packages/cli/src/parser/frontmatter.ts:1-13` — `gray-matter` でフロントマター解析済み。`> Mode:` の解析には新規 `readme-parser.ts` の `parseMode()` を使用する

## Open Choices (要ユーザー判断)

- （なし — 全 Open Choices は Decisions テーブルおよびユーザー回答にて解決済み）

## Constitution Check

> Step: research | Constitution Version: 1.0.0

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | — | モードは readme.md に永続化。state-engine が各実行時に独立して再読み込みする（lazy 方式） |
| II. 決定論的マージ | ✅ | — | `modes:` セクションはメタデータのみ。マージロジック（lexicographic sort・純粋関数）への影響なし |
| III. 質問駆動の要件確定 | ✅ | — | Open Choices を AskUserQuestion で 1問1答して解決。`readme-parser.ts` 新設もユーザー確認済み |
| IV. 双方向アンカー | ✅ | — | 実装ファイル（readme-parser.ts・state-engine.ts・skip.ts）には `@mspec-delta` アンカーを付与する |
| V. 強制ステップと拡張ステップの分離 | ✅ | — | proposal の論理スキップは `removable: false` を変更せず skip-log 経由で実現。強制ステップの定義は変更しない |

### Complexity Tracking

None
