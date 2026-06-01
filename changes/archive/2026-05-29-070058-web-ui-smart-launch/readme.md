---
doc_type: Tutorial
---

<!-- @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md -->
<!-- Requirements implemented: FR-005 -->
<!-- Change: revise-artifact-taxonomy -->

# web-ui-smart-launch

> Status: new
> Created: 2026-05-29
> Mode: feature

## Request

`mspec new` 実行時に Web UI を自動起動する。他プロジェクトがポートを使用中の場合は別ポートを選択し、同プロジェクトの Web UI がすでに起動中であれば再起動しない。起動完了時にはアクセス可能な URL を表示する。

## Artifacts

- [x] proposal.md
- [x] specs/<capability>/spec.md (Delta Spec)
- [x] research.md
- [x] design.md / design-rationale.md / architecture-overview.md
- [ ] design-rationale.md
- [x] quickstart.md
- [x] checklist.md
- [x] tasks.md

## Skipped Steps

<!-- `mspec skip <step-id> --reason "..."` 実行時に追記される -->
<!-- 例: - research: typo 修正のみのため省略 (skipped at 2026-05-14T10:30:00Z) -->

## Summary (Lessons / Next Steps)

### Lessons

- **PidEntry 型変更は連鎖 regression を引き起こす**: `PidEntry` に必須フィールドを追加すると `api-server.ts`（web-ui E2E テスト用）など CLI 外のファイルも影響を受ける。型変更時は `grep -rn writePid/readPid` で全呼び出し箇所を事前確認するのが必須わん。
- **`produces: []` ステップは `mspec done <step>` で明示完了が必要**: self-review/implement のような成果物なしステップは自動完了検知できず、`mspec done` を忘れるとワークフローがループする。
- **web-ui E2E は `localhost:5173` の占有チェックが先決**: `reuseExistingServer: true` が別プロジェクトのサーバーを再利用して全テストが偽陰性になる。環境準備として `lsof -ti :5173` を事前確認する習慣が必要わん。
- **TDD Green エビデンスの `& wait` パターンは exit code を隠蔽する**: バックグラウンド並列実行で `echo done` の exit 0 が個々の失敗を隠す。Green エビデンスは必ずシーケンシャルに記録して exit code を確認するべきわん。
- **既存実装確認は D-009/D-010 のような "no-op Decision" として記録**: 変更不要な既存コード（`new.ts` の hook、`127.0.0.1` バインド）も明示的な Decision ブロックで記録しないと self-review で gap として検出される。

### Next Steps

- `web-ui-e2e` Playwright テストの環境安定化 — `localhost:5173` 占有チェックと Playwright `webServer.timeout` の適切な設定（FR-012 に関連）
- `web-ui-smart-launch` 機能の実際の動作確認 — `mspec new` 実行時に Web UI が起動し URL が表示されることをライブ環境で検証（FR-007/FR-008）
- `mspec open` コマンドの追加ドキュメント — `mspec --help` への open コマンドの記載確認
