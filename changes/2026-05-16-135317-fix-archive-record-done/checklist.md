---
doc_type: Checklist
---

# Checklist: fix-archive-record-done

## Delta Spec Coverage

| FR-ID | Scenario | Test Plan | Risk |
|-------|----------|-----------|------|
| FR-003 | 正常アーカイブ後の done-log 記録 | `archive.test.ts` に新規追加: `archiveCommand` 成功後に `.mspec/cache/done-log.json` が存在し、`log[changeName].archive.done_at` が文字列であることをアサート | Low |
| FR-003 | rename 失敗時の recordDone 未呼び出し | `rename()` が失敗してスローした場合、`archiveCommand` も再スローし done-log が変更されないことをアサート（既存の `fails when change is already archived` テストの派生で確認可能） | Low |
| FR-003 | recordDone 例外のエラー伝播 | `writeFile` を mock してスローさせ、`archiveCommand` が同じエラーを呼び出し元に伝播することをアサート | Medium（mock 必要だが、自然伝播パターンは `done.ts` テストで既に検証済み） |

## Source-of-Truth Regression

| 既存 FR | 説明 | 影響 | 緩和済み？ |
|---------|------|------|-----------|
| FR-001 | CLI output のコロン形式 | archive.ts は出力変更なし | ✅ 影響なし |
| FR-002 | ドキュメントのコロン形式 | ドキュメント変更なし | ✅ 影響なし |

### 既存テストへの回帰分析

| 既存テスト | 回帰リスク | 根拠 |
|-----------|-----------|------|
| `merges delta into source spec and moves change to archive/` | **なし** | `recordDone` は L40 で `mkdir({ recursive: true })` を自前で実行するため、`setupProject()` が `.mspec/cache/` を作らなくても ENOENT にならない |
| `dry-run does not modify any file` | **なし** | dry-run は `opts.dryRun` で早期 return するため `rename()` にも `recordDone` にも到達しない |
| `fails when change is already archived` | **なし** | `findChange` で早期エラースローするため `recordDone` に到達しない |
| `creates a new source spec when the capability has none` | **なし** | rename 成功後に `recordDone` が呼ばれるが、既存アサートに影響なし |
| `aborts without writing when delta parse has warnings` | **なし** | parse エラーで早期スローするため `rename()` も `recordDone` も到達しない |

## Constitution

| 原則 | 状態 | Notes |
|------|------|-------|
| I. ステップ独立性 | ✅ | archive.ts のみ変更、他コマンドへの波及なし |
| II. 決定論的マージ | ✅ | import 1 行 + await 1 行の追加。FR-ID FR-003 は既存 FR-001/002 と衝突しない |
| III. 質問駆動の要件確定 | ✅ | Non-Goals・完了条件・OC-001 をユーザー質問で確定 |
| IV. 双方向アンカー | ✅ | design.md の DEC-001/002 が FR-003 の各 Scenario に対応付け済み |
| V. 強制ステップと拡張ステップの分離 | ✅ | archive は強制ステップ、追加コードは最小限 |
