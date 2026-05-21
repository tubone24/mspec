---
doc_type: AI-Internal
---

# Research: ui-visual-mock-workflow

## Decisions

| 論点 | 採用案 | 代替案 | 根拠 |
|------|--------|--------|------|
| HTTP サーバー実装 | `node:http` 内製（ゼロ依存） | sirv, serve-handler, http-server | `packages/cli/package.json` に HTTP サーバーライブラリなし。ゼロ依存追加方針と一致。50 行程度で静的配信が実装可能 |
| 対話プロンプト実装 | 既存 `src/lib/prompt.ts` の `ask()` 再利用 | inquirer, @clack/prompts | すでにゼロ依存の stdin ベース実装が存在。単純テキスト収集に高機能ライブラリ不要 |
| ポート衝突時の動作 | 自動インクリメント（3737 → 3738 → ...） | エラー終了 + `--port` 案内 | **ユーザー確認済み**。摩擦最小化のため自動探索が望ましい |
| フィードバック複数ラウンド | `mock-feedback.md` を上書き | 連番ファイル追記 | **ユーザー確認済み**。常に最新フィードバックのみ保持する。シンプルさ優先 |
| mock HTML スタイリング | プロジェクトの CSS フレームワークを自動検出して適用。未検出時はプレーン HTML+CSS | Tailwind CDN 固定 / 常にプレーン | **ユーザー確認済み**。「Material UI が導入されているならそれに準じた UI でないと意味がない」という方針。`package.json` / `tailwind.config.*` / `vite.config.*` 等からフレームワークを推定するヒューリスティックが必要 |
| ワークフロー内のステップ位置 | proposal の直後（Delta Spec FR-023 確定済み） | tasks の直前 | 早期フィードバックを優先。Delta Spec で解決済み |
| フィードバック収集方式 | CLI 対話入力（Delta Spec FR-003 確定済み） | mock ページ埋め込みフォーム | 外部依存なし。Delta Spec で解決済み |
| `block: true` フィールド名 | `block: true`（workflow.yaml の実フィールド名） | `block_after: true`（Delta Spec の記述） | `workflow.ts:19` の `StepSchema` は `block: z.boolean()` のみ定義。`continue.ts:150` が `block_after: step.block` に変換している |
| `produces` フィールド | `[mock-feedback.md]` | `[]` | `skip.ts` が glob なし単一ファイルなら placeholder 生成可能。skip 時に `mock-feedback.md` プレースホルダーが生成される |
| FR-004 反映実装箇所 | tasks スキルのプロンプトが `mock-feedback.md` を任意読み込み | `workflow.yaml` の requires に追加 | requires 追加だと visual-mock skip 時に tasks がブロックされる。スキルのソフト参照が安全 |

## Web References

- [sirv vs http-server vs serve — npm trends](https://npmtrends.com/http-server-vs-serve-vs-sirv): sirv は ~12,600 req/s で最速だが依存追加が必要。本プロジェクトはゼロ依存方針のため `node:http` 内製を採用
- [GitHub — lukeed/sirv](https://github.com/lukeed/sirv): `node:http` と直接組み合わせ可能なミドルウェア。依存追加が許容される場合の第一候補
- [Using LLMs to Generate UX Wireframes — Sony Interactive Entertainment](https://sonyinteractive.com/en/news/blog/using-llms-to-generate-ux-wireframes/): LLM でナプキンスケッチからワイヤーフレームを生成。Tailwind CSS ワンファイル HTML が最良品質を示した（参考として有用だが本案件はプロジェクト自動検出を優先）
- [Generating Automatic Feedback on UI Mockups with LLMs (CHI 2024)](https://dl.acm.org/doi/10.1145/3613904.3642782): LLM による UI モックアップ自動フィードバック生成の研究事例（Figma プラグイン実装）
- [Top 8 CLI UX Patterns (Medium, 2025)](https://medium.com/@kaushalsinh73/top-8-cli-ux-patterns-users-will-brag-about-4427adb548b7): dry-run with diff、honest progress 等。`mspec mock` の UX 設計参考
- [CLI UX best practices — Evil Martians](https://evilmartians.com/chronicles/cli-ux-best-practices-3-patterns-for-improving-progress-displays): サーバー起動中のスピナー・進捗表示設計の参考

## Codebase Findings

| ファイル | 行 | 内容 |
|----------|-----|------|
| `packages/cli/src/types/workflow.ts` | 19 | `block: z.boolean()` — `block_after` というフィールドは存在しない |
| `packages/cli/src/commands/continue.ts` | 150 | `block_after: step.block` として JSON 出力に変換している |
| `packages/cli/src/types/workflow.ts` | 42 | `REQUIRED_STEP_IDS = ['new','proposal','delta','tasks','implement','archive']` — visual-mock は任意 |
| `packages/cli/templates/workflow.default.yaml` | 1-138 | ワークフロー定義テンプレート。proposal と delta の間に visual-mock を追加する |
| `packages/cli/src/lib/prompt.ts` | 1-28 | `ask(question): Promise<string>` — 単行 stdin 入力。複数行収集には空行終了ループが必要 |
| `packages/cli/src/commands/skip.ts` | 55-61 | glob なし単一ファイルであれば placeholder 生成が機能する |
| `packages/cli/src/index.ts` | 1-208 | `commander` ベース。`mspec mock` は `program.command('mock')` として追加 |
| `packages/cli/src/commands/continue.ts` | 207-218 | `mapSubagentName()` switch 文。visual-mock に subagent が必要なら case 追加が必要 |
| `packages/cli/src/lib/artifact-validator.ts` | 18 | `SKIPPED_PLACEHOLDER_MARKER` — skip 時の `mock-feedback.md` プレースホルダーがこのマーカーで始まる |
| `packages/cli/templates/claude/commands/mspec/` | — | 各ステップに対応する `.md` コマンドファイル。`mock.md` の新規追加が必要 |
| `packages/cli/templates/claude/skills/` | — | 各ステップに対応する `SKILL.md`。`mspec-visual-mock/SKILL.md` の新規追加が必要 |

### CSS フレームワーク自動検出ヒューリスティック（設計方針）

`mspec mock` 実行時に以下の順でプロジェクトのフレームワークを検出する:

1. `package.json` の `dependencies` / `devDependencies` を検査
   - `@mui/material` → Material UI
   - `tailwindcss` → Tailwind CSS
   - `bootstrap` → Bootstrap
   - `@chakra-ui/react` → Chakra UI
   - `antd` → Ant Design
2. `tailwind.config.*` / `vite.config.*` / `next.config.*` の存在確認（補助的）
3. 未検出時はプレーン HTML+CSS（外部 CDN なし）でフォールバック

検出結果を LLM プロンプトのコンテキストとして渡し、mock 生成品質を向上させる。

## Open Choices（解決済み）

- ✅ **ポート衝突時の動作**: 自動インクリメント（3737→3738→...）
- ✅ **フィードバック複数ラウンド**: `mock-feedback.md` 上書き
- ✅ **mock HTML スタイリング**: プロジェクト CSS フレームワーク自動検出 → 適用。未検出時はプレーン HTML+CSS

## Open Choices（未解決）

- **`mspec mock` コマンドとワークフローステップの関係**: コマンド直接実行 vs `mspec continue` 経由での動作差異（design ステップで設計）
- **スキルの subagent 化**: `visual-mock` ステップを専用サブエージェントに委譲するか否か（design ステップで決定）
- **`mock-feedback.md` の archive 後保持**: archive 時に他の成果物と同じく `changes/` ごと保持（現状の動作に準ずる）

## Constitution Check

| Principle | Phase 0 | Phase 1 |
|-----------|---------|---------|
| I  ステップ独立性 | ✅ research は proposal と Delta Spec を読み込むのみで他を書き換えない | — |
| II  決定論的マージ | ✅ `research.md` は changes/ 以下に配置され SoT spec と衝突しない | — |
| III  質問駆動の要件確定 | ✅ Open Choices 3 項目をユーザーに確認し決定済み | — |
| IV  双方向アンカー | ✅ `@mspec-delta` アンカーは proposal.md に記載済み | — |
| V  強制ステップと拡張ステップの分離 | ✅ visual-mock は任意ステップ。research ステップ自体は必須ステップ | — |
