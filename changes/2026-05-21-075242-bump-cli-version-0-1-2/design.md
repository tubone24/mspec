---
doc_type: Reference
---

<!-- See also: ./design-rationale.md for採用理由・代替案 -->

# Design: bump-cli-version-0-1-2

## Summary

`packages/cli/package.json` の `version` フィールドを `0.1.1` から `0.1.2` に更新するパッチバンプ。
あわせて `tests/publish-prep.test.ts` の直値検証とロックファイル再生成を実施する。

## Technical Context

| 項目 | 現在値 | 変更後 |
|------|--------|--------|
| `packages/cli/package.json` → `version` | `"0.1.1"` | `"0.1.2"` |
| `packages/cli/tests/publish-prep.test.ts:26` | `toBe('0.1.1')` | `toBe('0.1.2')` |
| `packages/cli/package-lock.json` | `"0.1.0-alpha.1"` (乖離) | `"0.1.2"` (npm install で再生成) |

変更対象は以上 3 点のみ。Root `package.json`、`specs/` 配下は変更しない。

## Project Structure

```
packages/cli/
├── package.json              ← version フィールドを更新 (line 3)
├── package-lock.json         ← npm install で自動再生成
└── tests/
    └── publish-prep.test.ts  ← toBe('0.1.1') → toBe('0.1.2') (line 26)
```

## Decisions

### D-001: package.json version フィールドの直接編集

`packages/cli/package.json` の `"version": "0.1.1"` を `"0.1.2"` に直接編集する。

**受け入れ基準（FR-005 との対応）:**
- GIVEN `packages/cli/package.json` が存在する
- WHEN `"version"` フィールドを参照する
- THEN その値が `"0.1.2"` であること

### D-002: テストファイルの直値更新

`publish-prep.test.ts:26` の `expect(pkg.version).toBe('0.1.1')` を `toBe('0.1.2')` に変更する。
動的取得方式への変更は scope 外とする。

**受け入れ基準:**
- GIVEN テストを実行する
- WHEN `pkg.version` を検証する
- THEN `'0.1.2'` と一致してテストが green であること

### D-003: package-lock.json の npm install による再生成

`npm install` を実行して `package-lock.json` を再生成する。手動編集は行わない。

**受け入れ基準:**
- GIVEN `packages/cli/package.json` の version が `0.1.2` に更新されている
- WHEN `npm install` を実行する
- THEN `package-lock.json` の version フィールドが `0.1.2` に更新されること

## Constitution Check

| Principle | Phase 0 | Phase 1 |
|-----------|---------|---------|
| I. ステップ独立性 | ✅ design.md のみ生成、実装なし | ✅ 他ステップの成果物に依存せず独立 |
| II. 決定論的マージ | ✅ 新規ファイルのみ、競合なし | ✅ 変更対象ファイルが一意に特定されている |
| III. 質問駆動の要件確定 | ✅ research 段階で Open Choices 解消済み | ✅ 追加の判断事項なし |
| IV. 双方向アンカー | ✅ FR-005 と D-001 が対応付け済み | ✅ Scenario が受け入れ基準に引き継がれている |
| V. 強制ステップと拡張ステップの分離 | ✅ 強制ステップのみ実行 | ✅ 拡張ステップへの依存なし |

### Complexity Tracking

None

## Self-Review

### Summary

全アーティファクトは内部一貫性があり、スコープが明確に保たれている。Delta Spec・設計決定・チェックリスト・アーキテクチャ図・Constitution Check テーブルは相互に整合している。`quickstart.md` のステップ4に CWD 依存の問題があったが修正済み。`architecture-overview.md` の絵文字スタイル問題も修正済み。

### Findings

| # | Artifact | Severity | Finding | Resolved? |
|---|----------|----------|---------|-----------|
| 1 | `quickstart.md` line 38 | warn | `node -e` コマンドのパスが Step 3 の `cd packages/cli` 後の CWD を前提としておらず不整合。`cd packages/cli` + `./package.json` 形式に修正。 | yes |
| 2 | `quickstart.md` Step 1 & 2 | info | 編集手順がコメント形式で記述されており、機械実行可能なコマンドではない。パッチバンプの手動編集ワークフローとして意図的。 | yes |
| 3 | `specs/cli-core/spec.md` | info | FR-005 は `package.json` の値のみをカバー。D-002（テスト更新）・D-003（lock 再生成）は FR-005 の実装上の帰結であり、独立 FR シナリオを持たない設計上の選択。 | yes |
| 4 | `architecture-overview.md` line 41 | info | シーケンス図に絵文字（`✅`）が含まれており、スタイルガイドに反する。絵文字を除去して修正済み。 | yes |

### Sign-off

**LGTM** — 全 findings 解消済み。スコープ・整合性・Constitution Check いずれも問題なし。
