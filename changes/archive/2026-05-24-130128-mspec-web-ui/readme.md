---
doc_type: Tutorial
---

<!-- @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md -->
<!-- Requirements implemented: FR-005 -->
<!-- Change: revise-artifact-taxonomy -->

# mspec-web-ui

> Status: archived
> Created: 2026-05-24

## Request

MSPEC の全機能を可視化する専用 Web UI を作成する。`mspec new` 実行時に未起動なら自動起動し、既存プロセスを再利用する。アーカイブ前のチェンジ一覧・進捗ダッシュボード・各種 MD のダーク/ライトモードプレビュー（Mermaid レンダリング、Gherkin/Ears 記法のハイライト、プロトタイプ HTML の iframe 表示）・E2E テスト結果のレッド/グリーン証跡確認・バグフィックス/マイナー修正のドキュメント出し分けなど MSPEC が持つ全機能を Web UI でわかりやすく提供する。

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

- **`packages/core` は実在しない**: 設計書に「packages/core」と誤記していたが実際は `packages/cli/src/{lib,parser,workflow}` に全て含まれている。新機能追加前に `ls packages/` で必ず構成を確認すること。
- **`produces: []` ステップは `mspec done <step-id>` が必要**: self-review と implement は成果物がないため `mspec validate` だけでは進まない。`mspec done` コマンドの存在を忘れると workflow が詰まる。
- **optional dependency の graceful degrade は `require.resolve` + `MODULE_NOT_FOUND` で実現**: `optionalDependencies` の宣言だけでは不十分で、ランタイムでの動的検出ロジックが必須。`try/catch` パターンを設計書（Optional Dependency Contract）に明示したことで実装ブレが防げた。
- **TDD 証跡は E2E テストタスクにも green が必要**: 実装タスク（T110 等）だけでなく E2E テストタスク（T101 等）にも実装後の `expect-green` 証跡が必要。red のみでは `mspec done implement` が失敗する。
- **Phase 3（Playwright E2E）は別チェンジで完結させる**: フロントエンド UI の Playwright テストはローカルサーバー起動・ブラウザ操作を要するため、CLI ユニットテストとは分離した専用チェンジで進めるのが適切。

### Next Steps

- **Phase 3 フロントエンド E2E 実装** — Dashboard / ArtifactPreview / TestResults の Playwright テスト（T201-T222）を別チェンジで実装する（change-dashboard FR-002、artifact-preview FR-001 〜 FR-005）
- **`@mspec/web-ui` の npm publish 設定** — monorepo 内 optional package を npm publish する際の `workspace:*` → バージョン番号への置換と `pnpm publish` フローを整備する
- **ファイルウォッチャーの追加検討** — 現状は 3 秒ポーリングだが、chokidar 等によるリアルタイム更新（change-dashboard FR-002 の体験向上）を将来チェンジで検討する
