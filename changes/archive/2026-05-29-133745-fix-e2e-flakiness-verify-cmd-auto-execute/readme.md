---
doc_type: Tutorial
---

<!-- @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md -->
<!-- Requirements implemented: FR-005 -->
<!-- Change: revise-artifact-taxonomy -->

# fix-e2e-flakiness-verify-cmd-auto-execute

> Status: new
> Created: 2026-05-29
> Mode: bugfix

## Request

e2eテストが不安定なので修正する。Web-UI Playwright テストの `waitForTimeout()` 固定待機を適切な待機条件に置き換え、CLI vitest の `process.cwd()` スパイによる並列テスト干渉を解消する。また、`changes/2026-05-28-084519-verify-cmd-auto-execute` で着手予定だった「checklist の verify: cmd を自動実行する」機能もこの change で実装する。

## Artifacts

- [ ] proposal.md
- [x] specs/<capability>/spec.md (Delta Spec)
- [x] research.md
- [x] design.md / design-rationale.md / architecture-overview.md
- [ ] quickstart.md
- [x] checklist.md
- [x] tasks.md

## Skipped Steps

<!-- `mspec skip <step-id> --reason "..."` 実行時に追記される -->
<!-- 例: - research: typo 修正のみのため省略 (skipped at 2026-05-14T10:30:00Z) -->

## Summary (Lessons / Next Steps)

### Lessons

- **`localhost → ::1` IPv6先行解決がプロキシを壊していた**: Vite proxy と Playwright health check が `localhost` を IPv6 (`::1`) で解決するため、`vite.config.ts` の proxy target と `playwright.config.ts` の api-server URL を `127.0.0.1` に明示することで解決。`mspec open` が不在なため web UI 起動方法のドキュメントが必要。
- **`not.toHaveCount(0)` は初期ロード未完了時に危険**: `waitForTimeout` の置換として `await expect(items).not.toHaveCount(totalCount)` を使うと、`totalCount` が 0 のまま評価されてタイムアウトする。正しくは「items がロードされてから count を読む」パターン（`await expect(items.first()).toBeVisible()` → `const totalCount = await items.count()`）。
- **`checklist-persist.e2e.test.ts` がアクティブな checklist.md を破壊する**: テストがアクティブ change の checklist.md にフィクスチャ内容を PATCH で上書きしていた。テスト後に元のコンテンツを復元する処理を追加して解消。
- **`produces: []` タスクの TDD サイクル管理**: T2.1/T2.2 は RED 証跡を記録後、FR-014 実装（T3.3）完了まで GREEN 証跡が取れない。実装タスクと E2E RED タスクの証跡記録順序を tasks.md で明示することで迷いを防げる。
- **stale サーバー（IPv6 バインド）が silent failure を引き起こす**: 古い api-server が `127.0.0.1` にバインドされて残っていると、Playwright が `localhost:3847` 経由で IPv6 接続を試みて失敗し、テストが誤った理由で失敗する。ポート解放確認 (`lsof -ti:PORT`) を実装前後の手順に組み込む。

### Next Steps

- **verify:cmd 実行結果の色分け表示** (`artifact-preview/FR-015`): Run ボタン押下後に exit code に応じて結果エリアを緑（成功）/ 赤（失敗）で色分けする。現状は白地の `<pre>` のみ。
- **checklist-persist テストの専用フィクスチャ化** (`e2e-stability/FR-004`): アクティブ change の checklist.md を書き換えない専用の test-fixture change を用意し、`checklist-persist.e2e.test.ts` がそちらのみを参照するよう修正する。
- **`mspec open` コマンドの追加** (`cli-core/FR-NEW`): Vite dev server + api-server を同時起動するショートカットコマンドを CLI に追加する。`mspec open` で `http://localhost:5173` が開く体験を提供する。
