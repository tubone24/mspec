---
doc_type: Explanation
---

# Proposal: fix-archive-record-done

## Why

`mspec archive` コマンドは `changes/<name>` → `changes/archive/<name>` へのディレクトリ移動（`rename()`）を行うが、
その後 `recordDone(paths, change.name, 'archive')` を呼び出していない。

`archive` ステップは `produces: []` のため、mspec はファイル生成で完了を検知できず、
done-log への明示的な記録が唯一の完了通知手段となる。この呼び出し漏れにより、
`mspec continue` が archive ステップを未完了と判断し、永遠に `next_action: "execute"` を返し続けてしまう。

## Goals

- `rename()` 呼び出し成功後のみ `await recordDone(paths, change.name, 'archive')` を呼び出す
- `recordDone` が例外を投げた場合、エラーを呼び出し元に伝播する（サイレント無視しない）
- `rename()` が失敗した場合は `recordDone` を呼ばない（部分成功の防止）
- 上記動作を検証する単体テストを追加し、テストが green になる
- 修正後に `mspec continue` が archive ステップを done と認識し、正しい次アクションを返す

## Non-Goals

- `archive.ts` 全体のリファクタリング（コードスタイル変更、責務分割など）
- 他ステップの `recordDone` 呼び出し漏れ調査・修正（別 Issue で対応）
- テストカバレッジの大幅拡充（今回追加は最小限の 1 ケースのみ）
- `done-log` のフォーマット変更や `recordDone` 関数自体の API 変更

## Capabilities (touched)

- cli-core

## Open Questions

- `recordDone` が失敗した場合にすでに移動済みのディレクトリをロールバックすべきか？
  （現時点では伝播のみ・ロールバックなしとする方針だが、実装時に要確認）

## Constitution Check

> Step: proposal | Constitution Version: 1

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | — | archive ステップへの 1 行追加のみで他ステップに影響なし |
| II. 決定論的マージ | ✅ | — | 単一ファイル・単一箇所への追加でマージ競合リスクなし |
| III. 質問駆動の要件確定 | ✅ | — | Non-Goals・完了条件・エッジケースをユーザーへの質問で確定済み |
| IV. 双方向アンカー | — | — | delta ステップ以降で評価 |
| V. 強制ステップと拡張ステップの分離 | ✅ | — | archive は強制ステップ、変更範囲は最小限に限定 |

### Complexity Tracking

None
