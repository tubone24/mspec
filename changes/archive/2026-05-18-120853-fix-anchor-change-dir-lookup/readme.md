---
doc_type: Tutorial
---

<!-- @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md -->
<!-- Requirements implemented: FR-005 -->
<!-- Change: revise-artifact-taxonomy -->

# fix-anchor-change-dir-lookup

> Status: new
> Created: 2026-05-18
> Mode: bugfix

## Request

`packages/cli/src/parser/anchor.test.ts:7` において、`change_dir "2026-05-14-093015-apply-css" not found` というエラーが発生している。
アンカーパーサーのテストで参照している change_dir が見つからない問題を修正したい。

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

- **テストファイル除外は危険**: 当初 FR-018 を「テストファイルをスキャン除外」と設計したが、リサーチで13個の実アンカーを持つテストファイルが判明し SoT spec 違反と確定。
- **状態マシンの契約統一**: `blankOutStringLiterals` は既存関数と同一の「改行保持・同一長置換」契約を守り、行番号オフセット計算への影響をゼロに保った。
- **グローバルバイナリの落とし穴**: `createRequire(import.meta.url)` のパス解決は実行ファイル位置基準。`../../package.json` が global install 環境で壊れる pre-existing バグを副産物として発見・修正した（`../package.json` に変更）。
- **プレフィックス剥がしが誤認の原因**: アンカーパーサーが `*` を剥がしてから検出するため JSDoc スタイルのテストデータが実アンカーと誤認。根本原因（文字列リテラルマスク）の対処が必要だった。

### Next Steps

- `//` 行コメント内バッククォートによる誤マスク（Medium リスク FR-001/005/014/017）は「受け入れ済み」。問題が発生した場合は行コメント認識ロジックを追加する新規 change を推奨。
- `src/index.ts` の `../package.json` パス修正は未コミット。npm publish 前に確認・コミットが必要。
