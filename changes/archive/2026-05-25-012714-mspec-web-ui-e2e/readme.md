---
doc_type: Tutorial
---

<!-- @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md -->
<!-- Requirements implemented: FR-005 -->
<!-- Change: revise-artifact-taxonomy -->

# mspec-web-ui-e2e

> Status: archived
> Created: 2026-05-25

## Request

`mspec-web-ui` チェンジ（Phase 1/2 完了済み）の続きとして、Phase 3 のフロントエンド Playwright E2E テストを実装する。Dashboard・ArtifactPreview（Mermaid/EARS-Gherkin ハイライト/dark-light テーマ/prototype iframe）・TestResults（red/green/skip バッジ・トレース展開）の全画面を実際にブラウザ上で動作確認し、tasks.md の T201〜T302 タスクを TDD（red→green）で完走させる。

## Artifacts

- [x] proposal.md
- [x] specs/<capability>/spec.md (Delta Spec)
- [x] research.md
- [x] design.md / design-rationale.md / architecture-overview.md
- [x] quickstart.md
- [x] checklist.md
- [x] tasks.md

## Skipped Steps

<!-- `mspec skip <step-id> --reason "..."` 実行時に追記される -->
<!-- 例: - research: typo 修正のみのため省略 (skipped at 2026-05-14T10:30:00Z) -->

## Summary (Lessons / Next Steps)

### Lessons

- **`workspace:*` は npm pack を壊す**: CLI の `optionalDependencies` に `@mspec/web-ui: "workspace:*"` を記載すると `npm pack --dry-run` が失敗する。真のオプショナル機能は `require.resolve` ランタイム検出のみで管理し、`package.json` には書かないのが正しいパターン。
- **`node --import tsx/esm` と CJS 混在は `npx tsx` CLI で回避**: tsx の ESM フック (`--import tsx/esm`) は Fastify の CJS 内部依存（ajv 等）と非互換。`npx tsx` CLI は CJS/ESM 両方を透過的に処理できる。
- **システム Node と pnpm Node のバージョン差異**: システムの `node` が v25 を指し pnpm が v18 を使う環境では `test.command` に `node /path/to/vitest` を使うとバージョン不整合で失敗する。`pnpm --dir ... exec vitest` 形式を使うことで pnpm 管理の Node 18 が使われる。
- **playwright.config.ts の `baseURL` バグを research フェーズで早期発見**: 実装前の研究段階で `baseURL: 3847`（Fastify）を `5173`（Vite）に修正できた。ドキュメントレビューが実装エラーを防いだ好例。
- **テストがない状態での宣言的 TDD 証跡**: Playwright の `webServer` は `api-server.ts` 不在で exit 1 → 正しい red 証跡。宣言的アプローチでも TDD サイクルの意図が明確に記録された。

### Next Steps

- **`mspec ui start` コマンドの実装** — `web-ui-server-cmd` チェンジとして Fastify サーバーを独立起動できるコマンドを実装し、`playwright.config.ts` の api-server.ts 起動スクリプトをそちらに移行する（web-ui-server FR-001）
- **test-result-viewer FR-006 の実証** — fail テストが存在するチェンジでのみ trace-panel 展開テストが実行できる。E2E 結果ファイルを含む fixture チェンジを用意して完全カバレッジを達成する（test-result-viewer FR-006）
- **`@mspec/web-ui` npm publish 設定** — pnpm workspace の `workspace:*` を実バージョンに変換して独立パッケージとして公開するフローを整備する（web-ui-server FR-001 関連）
