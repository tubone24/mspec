# Delta Spec: e2e-stability

## Security Capabilities

権限境界: e2e テストコードのみ影響範囲。プロダクションコードへの変更なし。
ロールバック手段: テストコードのみの変更であり、本番機能に対するリスクなし。

## ADDED Requirements

### Requirement: FR-001 — Playwright e2e テストにおける条件ベース待機の使用

<!-- risk_tier: trivial -->
<!-- blast_radius: local -->

このシステムは SHALL Web-UI Playwright e2e テスト内の `page.waitForTimeout()` の固定時間待機を、DOM 状態や要素の可視性を検査する条件ベース待機（`waitForSelector`・`expect(locator).toBeVisible()` 等）に置き換える.

#### Scenario: waitForTimeout が条件ベース待機に置き換えられる
- GIVEN web-ui/tests/e2e/ 配下のテストファイルに `waitForTimeout()` 呼び出しが存在する
- WHEN テストリファクタリングを適用する
- THEN `waitForTimeout()` の呼び出し数が 0 になり、代わりに DOM 状態を検査する待機に変更されている

#### Scenario: 条件ベース待機への移行後もテストが通過する
- GIVEN `waitForTimeout()` を `expect(locator).toBeVisible()` 等に置き換えたテストが存在する
- WHEN テストスイートを実行する
- THEN 全テストが通過する（スキップは許可、失敗は不可）

### Requirement: FR-002 — vitest CLI e2e テストにおける process.cwd() スパイの分離

<!-- risk_tier: trivial -->
<!-- blast_radius: local -->

このシステムは SHALL `vi.spyOn(process, 'cwd')` を使用する CLI e2e テストを、`afterEach` で確実に `vi.restoreAllMocks()` を呼び出す形式に統一し、テスト間でグローバル状態が漏れないようにする.

#### Scenario: vi.restoreAllMocks が各テスト後に呼ばれる
- GIVEN `vi.spyOn(process, 'cwd')` を使用するテストファイルが存在する
- WHEN テストファイルを検査する
- THEN 全ての `vi.spyOn(process, 'cwd')` 呼び出しに対して、対応する `vi.restoreAllMocks()` または `spy.mockRestore()` が `afterEach` ブロックに存在する

#### Scenario: 並列実行でも他のテストに干渉しない
- GIVEN `vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)` を持つテストが並列で実行される
- WHEN テストスイートを `vitest run` で実行する
- THEN 任意のテストで `process.cwd()` が期待値外の値を返す失敗が発生しない

### Requirement: FR-003 — e2e テストスイートのフレーク率ゼロ保証

<!-- risk_tier: trivial -->
<!-- blast_radius: local -->

このシステムは SHALL e2e テストスイートを 3 回連続で実行した場合に、いずれの実行でも同一のパス/スキップ/フェイル結果を返す.

#### Scenario: 3 回連続実行で結果が安定している
- GIVEN e2e テストの修正（FR-001・FR-002）が適用されている
- WHEN `vitest run` または `playwright test` を 3 回連続で実行する
- THEN テスト結果（pass/skip/fail の件数）が 3 回全て一致する

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
