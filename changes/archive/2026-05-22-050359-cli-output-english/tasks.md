---
doc_type: AI-Internal
---

# Tasks: cli-output-english

## Phase 1: Setup

_なし — 既存ファイルの文字列置換のみ。新規モジュール・依存関係変更なし。_

## Phase 2: Foundational

_なし — インフラ・設定変更なし。_

## Phase 3: User Story

### Task 3-1 [E2E / red] — FR-002: version display の英語アサーション（unit test）

`packages/cli/src/commands/upgrade.test.ts` で `現在のバージョン:` / `最新バージョン:` を期待値にしているアサーションを `Current version:` / `Latest version:  ` に更新する（この時点で実装前なのでテストは失敗）。

```
anchor:
  @mspec-delta 2026-05-22-050359-cli-output-english/specs/cli-upgrade/spec.md
  Requirements implemented: FR-002
  Change: cli-output-english
```

---

### Task 3-2 [IMPL / green] — FR-002: upgrade.ts version display ラベルを英語に置換

`packages/cli/src/commands/upgrade.ts` の以下を修正してテストを green にする:
- L67: `現在のバージョン:` → `Current version:`
- L68: `最新バージョン:   ` → `Latest version:  `

```
anchor:
  @mspec-delta 2026-05-22-050359-cli-output-english/specs/cli-upgrade/spec.md
  Requirements implemented: FR-002
  Change: cli-output-english
```

---

### Task 3-3 [E2E / red] — FR-004: already up-to-date メッセージの英語アサーション（unit test）

`packages/cli/src/commands/upgrade.test.ts` で `すでに最新バージョンです` を期待値にしているアサーション（約 L103）を `Already up to date` に更新する（この時点でテストは失敗）。

```
anchor:
  @mspec-delta 2026-05-22-050359-cli-output-english/specs/cli-upgrade/spec.md
  Requirements implemented: FR-004
  Change: cli-output-english
```

---

### Task 3-4 [IMPL / green] — FR-004: upgrade.ts already up-to-date メッセージを英語に置換

`packages/cli/src/commands/upgrade.ts` の以下を修正してテストを green にする:
- L71: `すでに最新バージョンです (${currentVersion})` → `Already up to date (${currentVersion})`

```
anchor:
  @mspec-delta 2026-05-22-050359-cli-output-english/specs/cli-upgrade/spec.md
  Requirements implemented: FR-004
  Change: cli-output-english
```

---

### Task 3-5 [IMPL] — 残り5箇所の日本語文字列を英語に置換

`packages/cli/src/commands/upgrade.ts` の残り5箇所を英語に置換する:
- L60: `エラー:` → `Error:`
- L60: `バージョン情報の取得に失敗しました` → `Failed to fetch version info`
- L76: `アップグレードしますか？ [y/N] ` → `Upgrade to ${latestVersion}? [y/N] `（注: `${latestVersion}` 補間を追加 — 意図的な UX 改善）
- L78: `キャンセルしました。` → `Cancelled.`
- L91: `✓ アップグレード完了` → `✓ Upgrade complete`

```
anchor:
  @mspec-delta 2026-05-22-050359-cli-output-english/specs/cli-upgrade/spec.md
  Requirements implemented: FR-002, FR-004
  Change: cli-output-english
```

---

### Task 3-6 [E2E] — E2E テストの日本語アサーションを英語に一括更新

`packages/cli/tests/e2e/upgrade-command.e2e.test.ts` で日本語文字列を期待値にしているアサーション（FR-002、FR-004、エラーパス等）をすべて対応する英語文字列に更新する。

```
anchor:
  @mspec-delta 2026-05-22-050359-cli-output-english/specs/cli-upgrade/spec.md
  Requirements implemented: FR-002, FR-004
  Change: cli-output-english
```

---

### Task 3-7 [IMPL] — @mspec-delta アンカーブロックを変更ファイルに追加

以下の3ファイルの冒頭に `@mspec-delta` アンカーコメントブロックを追加する（Principle IV 双方向アンカー）:
- `packages/cli/src/commands/upgrade.ts`
- `packages/cli/src/commands/upgrade.test.ts`
- `packages/cli/tests/e2e/upgrade-command.e2e.test.ts`

アンカー形式:
```
// @mspec-delta 2026-05-22-050359-cli-output-english/specs/cli-upgrade/spec.md
// Requirements implemented: FR-002, FR-004
// Change: cli-output-english
```

```
anchor:
  @mspec-delta 2026-05-22-050359-cli-output-english/specs/cli-upgrade/spec.md
  Requirements implemented: FR-002, FR-004
  Change: cli-output-english
```

## Phase 4: Polish

### Task 4-1 — 全テスト実行・green 確認

`packages/cli` で `npm test`（または `pnpm test`）を実行してすべてのテストが green であることを確認する。

### Task 4-2 — チェックリスト項目の最終確認

`checklist.md` の各項目（Delta Spec Coverage 7項目、Source-of-Truth Regression 6項目、Constitution 6項目）を確認し、すべて ✅ であることを確認する。

## Constitution Check

| Principle | Phase 0 |
|-----------|---------|
| I ステップ独立性 | ✅ tasks.md は実装手順のみ記述し、設計決定を再定義しない |
| II 決定論的マージ | ✅ 各タスクで変更対象ファイル・行番号が一意に特定されている |
| III 質問駆動の要件確定 | ✅ 設計段階でユーザー確認済みの方針（直接置換）に従う |
| IV 双方向アンカー | ✅ Task 3-1〜3-6 すべてに anchor ブロック付与、Task 3-7 でソース側アンカーを追加 |
| V 強制ステップと拡張ステップの分離 | ✅ tasks.md はワークフロー必須ステップの成果物 |
