# Research: cli-output-english

## Decisions

| 論点 | 採用案 | 代替案 | 根拠 |
|------|--------|--------|------|
| 実装方式 | ソースファイルの日本語リテラルを英語に直接置換 | i18n ライブラリ（i18next 等）を導入してロケールファイルに分離 | `@mspec/cli` に i18n ライブラリは未使用。bugfix スコープで範囲を最小限に保つ |
| 対象ファイル | `packages/cli/src/commands/upgrade.ts` のみ | `dist/index.js` を直接編集 | ソースを変更してビルドするのが正規フロー。dist は生成物 |
| テスト更新 | 日本語文字列を期待値にしているテストを英語に更新する | テストは変更しない | 文字列が変わるためテストも合わせて更新が必要 |

## Codebase Findings

対象ファイル: `packages/cli/src/commands/upgrade.ts`

| 行 | 現在の日本語文字列 | 英語への変換案 |
|----|------------------|--------------|
| 60 | `エラー:` | `Error:` |
| 60 | `バージョン情報の取得に失敗しました` | `Failed to fetch version info` |
| 67 | `現在のバージョン:` | `Current version:` |
| 68 | `最新バージョン:   ` | `Latest version:  ` |
| 71 | `すでに最新バージョンです (${currentVersion})` | `Already up to date (${currentVersion})` |
| 76 | `アップグレードしますか？ [y/N] ` | `Upgrade to ${latestVersion}? [y/N] ` |
| 78 | `キャンセルしました。` | `Cancelled.` |
| 91 | `✓ アップグレード完了` | `✓ Upgrade complete` |

テストファイル:
- `packages/cli/src/commands/upgrade.test.ts` — 上記文字列を期待値として使用している可能性があり、同時更新が必要
- `packages/cli/tests/e2e/upgrade-command.e2e.test.ts` — E2E テストにも日本語が含まれる可能性あり

i18n ディレクトリ: `packages/cli/` 配下に `locales/` や `i18n/` は存在しない。

## Web References

なし（ソース内文字列の置換のみで外部 API 仕様の参照は不要）

## Open Choices

なし（ユーザー確認済み: ソースを直接英語に書き換える方針）

## Constitution Check

| Principle | Phase 0 | Phase 1 |
|-----------|---------|---------|
| I ステップ独立性 | ✅ research は delta spec とソース調査のみ、実装には触れない | — |
| II 決定論的マージ | ✅ 変更対象ファイル・行番号が一意に特定されている | — |
| III 質問駆動の要件確定 | ✅ i18n 導入 vs 直接置換をユーザーに確認し、直接置換と決定 | — |
| IV 双方向アンカー | ✅ delta spec の FR-002/FR-004 が本調査の根拠となっている | — |
| V 強制ステップと拡張ステップの分離 | ✅ bugfix モードで force: [research] 指定、research は実行必須 | — |
