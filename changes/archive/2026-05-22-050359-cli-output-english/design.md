---
doc_type: Reference
---

<!-- See also: ./design-rationale.md for採用理由・代替案 -->

# Design: cli-output-english

## Summary

`packages/cli/src/commands/upgrade.ts` 内の8箇所の日本語出力文字列を英語に直接置換する。新規モジュール・依存関係・インターフェース変更は一切なし。

## Technical Context

- 対象ファイル: `packages/cli/src/commands/upgrade.ts`
- 関数: `upgradeCommand()` (L51–L92)
- 使用ライブラリ: `picocolors`（色付け）、`ask()`（prompt.js）— 変更なし
- i18n ライブラリ: 未使用（導入しない）

## Project Structure

```
packages/cli/src/commands/upgrade.ts   ← 変更（文字列置換のみ）
packages/cli/src/commands/upgrade.test.ts  ← 変更（期待値の日本語 → 英語）
packages/cli/tests/e2e/upgrade-command.e2e.test.ts  ← 変更（同上）
```

## Decisions

### D-001 — 文字列置換マッピング

| 行 | 変更前（日本語） | 変更後（英語） | 対応 FR |
|----|-----------------|----------------|---------|
| L60 | `エラー:` | `Error:` | — |
| L60 | `バージョン情報の取得に失敗しました` | `Failed to fetch version info` | — |
| L67 | `現在のバージョン:` | `Current version:` | FR-002 |
| L68 | `最新バージョン:   ` | `Latest version:  ` | FR-002 |
| L71 | `すでに最新バージョンです (${currentVersion})` | `Already up to date (${currentVersion})` | FR-004 |
| L76 | `アップグレードしますか？ [y/N] ` | `Upgrade to ${latestVersion}? [y/N] ` (注: `${latestVersion}` 補間を追加 — 意図的な UX 改善) | — |
| L78 | `キャンセルしました。` | `Cancelled.` | — |
| L91 | `✓ アップグレード完了` | `✓ Upgrade complete` | — |

**受け入れ基準（FR-002 Scenario より）:**
- GIVEN mspec がインストールされネットワーク利用可能
- WHEN `mspec upgrade` を実行
- THEN `"Current version: x.y.z"` `"Latest version:  a.b.c"` が表示される

**受け入れ基準（FR-004 Scenario より）:**
- GIVEN 現在バージョン = 最新バージョン
- WHEN `mspec upgrade` を実行
- THEN `"Already up to date (x.y.z)"` が表示されて終了

### D-002 — テスト期待値の更新

`upgrade.test.ts` と `upgrade-command.e2e.test.ts` で日本語文字列を期待値としているアサーションを、D-001 のマッピングに従って英語に更新する。

## Constitution Check

| Principle | Phase 0 | Phase 1 |
|-----------|---------|---------|
| I ステップ独立性 | ✅ design は実装に触れず設計のみ記述 | ✅ |
| II 決定論的マージ | ✅ 変更行が一意に特定されている | ✅ |
| III 質問駆動の要件確定 | ✅ i18n 導入 vs 直接置換をユーザー確認済み | ✅ |
| IV 双方向アンカー | ✅ D-001 が FR-002/FR-004 に対応付け済み | ✅ |
| V 強制ステップと拡張ステップの分離 | ✅ design は mspec ワークフローの必須ステップ | ✅ |

### Complexity Tracking

None

## Self-Review

**Overall verdict: PASS WITH NOTES** (blockers resolved before implementation)

1. **[resolved]** design.md Summary と architecture-overview.md の "7箇所" → "8箇所" に修正済み（D-001 テーブルの8行と一致）
2. **[resolved]** L76 の `${latestVersion}` 補間追加を D-001 に意図的な UX 改善として明記済み
3. **[nit]** checklist の upgrade.test.ts エラーパスアサーション行番号が L64 → 実際は L63（オフバイワン）。実装時に確認のこと
4. **[nit]** architecture-overview.md の Mermaid ノードラベルに日本語 (`ユーザー` 等) が残るが、CLI 出力ではないため要件違反なし
5. **Constitution re-eval**: 原則 I–V すべて Phase 0/1 ✅。Principle IV のアンカーブロックは実装ステップで追加必須
