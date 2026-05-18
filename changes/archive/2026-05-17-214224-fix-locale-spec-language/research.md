---
doc_type: Reference
---

# Research: fix-locale-spec-language

## Decisions

| 論点 | 採用案 | 代替案 | 根拠 |
|------|--------|--------|------|
| `status --json` への locale 追加箇所 | `statusCommand` (commands/status.ts) で `loadConfig` を呼び出し、得た locale を `Status` オブジェクトにマージしてから出力する | `computeStatus` に config を渡して Status 型自体に locale を含める | `computeStatus` は config を知らない設計（SkipLog/DoneLog/Workflow のみ）。status.ts 側でマージするのが責務分離として自然 |
| config.yaml 欠損時の locale フォールバック | `DEFAULT_LOCALE = 'ja'` を常に返す | `locale` フィールドを省略する | `new.ts` の既存パターンと一致。スキルが null チェック不要になる |
| `continue --json` への locale 追加 | `ContinueOutput` interface に `locale: string` を追加し、`continueCommand` 内で `loadConfig` から取得する | `status --json` のみ対応 | proposal.md 明記通り。スキルはどちらのコマンドを使っても locale を取得できる |
| SKILL.md のロケール対応スコープ | `mspec-delta/SKILL.md` の EARS パターン例示のみ変更 | `mspec-proposal`・`mspec-design`・`mspec-tasks` も変更 | grep 確認の結果、英語固定の EARS 例示テキストを持つのは `mspec-delta/SKILL.md` のみ。他スキルは変更不要 |
| artifact テンプレートのレガシー削除方針 | `.ja.md` と `.en.md` が揃った artifact の `.md` レガシーファイルは削除する | 保持する | ユーザー決定。フォールバックチェーン `<artifact>.<locale>.md` → `<artifact>.en.md` が機能する限り en が最終保護網となるため問題なし |

## Codebase Findings

- `packages/cli/src/types/status.ts:13-19` — `StatusSchema` の Zod 定義に `locale` フィールドが存在しない。追加対象
- `packages/cli/src/commands/status.ts:18-35` — `statusCommand` は `loadConfig` を呼ばない。JSON 出力分岐でマージする
- `packages/cli/src/commands/continue.ts:34-48` — `ContinueOutput` interface 定義。`locale: string` を追加する
- `packages/cli/src/commands/continue.ts:50-75` — `continueCommand` も `loadConfig` を呼ばない。追加対象
- `packages/cli/src/commands/new.ts:69-75` — config 欠損時に `locale = 'ja'` へ try/catch でフォールバック。`status.ts` と `continue.ts` も同パターンを踏襲する
- `packages/cli/src/lib/locale-resolver.ts:7` — `DEFAULT_LOCALE = 'ja'` が公開定数。フォールバック時に参照する
- `packages/cli/src/lib/state-engine.ts:41-77` — `computeStatus` は Workflow/SkipLog/DoneLog のみ受け取る。**変更不要**
- `packages/cli/templates/artifacts/` — `.ja.md` / `.en.md` バリアントが存在するのは `delta-spec` のみ。追加対象9種: `readme`・`glossary`・`proposal`・`research`・`design`・`architecture-overview`・`quickstart`・`checklist`・`tasks`
- `packages/cli/templates/claude/skills/mspec-delta/SKILL.md:25-30` — EARS パターン例示が英語のみ（5パターン）。locale 分岐を追加する対象
- `packages/cli/templates/claude/skills/mspec-proposal/SKILL.md:25` — 英語固定の EARS 例示なし（日本語説明のみ）。**変更不要**
- `packages/cli/src/lib/template-resolver.test.ts` — `resolveTemplate` の unit test 完備（locale match / en fallback / legacy fallback / TemplateNotFoundError）。レガシー削除後も en fallback テストが通る
- `packages/cli/tests/e2e/locale-config-new-ja.e2e.test.ts` — `newCommand` で locale:ja / locale:en 切り替えテスト既存。新規テスト追加の参考パターン
- `packages/cli/tests/e2e/claude-integration-skill-ears.e2e.test.ts:14-32` — `mspec-delta/SKILL.md` に EARS / SHALL / Scenario が含まれることを文字列検索で確認。SKILL.md 変更後もパスするよう記述維持が必要
- `packages/cli/src/workflow/config-loader.ts:25-55` — `loadConfig` が `resolveLocale` + `scanSupportedLocales` を呼び `resolvedLocale.locale` を返す。呼び出しのみで locale 取得が完結する

## Open Choices（解決済み）

| 選択肢 | 決定 |
|--------|------|
| config.yaml 欠損時の locale フォールバック | `DEFAULT_LOCALE = 'ja'` を返す |
| `continue --json` への locale 追加 | 追加する（proposal 通り） |
| レガシーテンプレートの扱い | `.ja.md` と `.en.md` が揃い次第削除する。フォールバックは en が担保 |
| `delta-spec.ja.md` / `delta-spec.en.md` の除外 | 既存完備のため今回タスクから除外 |

## Constitution Check

| 原則 | Phase 0 | Phase 1 |
|------|---------|---------|
| I. ステップ独立性 | `status.ts` と `continue.ts` の変更はそれぞれ独立。テンプレート追加も CLI 変更と独立 ✓ | — |
| II. 決定論的マージ | テンプレートファイルの追加は冪等。`StatusSchema` / `ContinueOutput` の変更は後方互換（フィールド追加のみ）✓ | — |
| III. 質問駆動の要件確定 | Open Choices 全4件をユーザーに確認して解決済み ✓ | — |
| IV. 双方向アンカー | 実装タスクで `@mspec-delta` アンカーを付与する予定 ✓ | — |
| V. 強制ステップと拡張ステップの分離 | 今回の変更は既存の強制ステップ（research が bugfix モードで必須）の対象。設計上問題なし ✓ | — |
