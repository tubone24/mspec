---
doc_type: AI-Internal
---

# Tasks: bump-cli-version-0-1-2

## Phase 1 — Setup

（セットアップ不要。バージョンバンプのみのため既存の開発環境で実施可能）

## Phase 2 — Foundational

### Task 2-1: E2E テスト更新（Red フェーズ）

`publish-prep.test.ts:26` のバージョン期待値を `'0.1.2'` に変更し、まず Red 状態を確認する。

**ファイル**: `packages/cli/tests/publish-prep.test.ts`
**変更**: `expect(pkg.version).toBe('0.1.1')` → `expect(pkg.version).toBe('0.1.2')`

```
anchor:
  @mspec-delta 2026-05-21-075242-bump-cli-version-0-1-2/specs/cli-core/spec.md
  Requirements implemented: FR-005
  Change: bump-cli-version-0-1-2
```

**完了条件**:
- `npm test` を実行し、`publish-prep.test.ts` が FAIL すること（期待値 `0.1.2` に対して実際値 `0.1.1`）

## Phase 3 — User Story

### Task 3-1: package.json バージョン更新（Green フェーズ）

`packages/cli/package.json` の `version` フィールドを `0.1.2` に更新し、テストを Green にする。

**ファイル**: `packages/cli/package.json`
**変更**: `"version": "0.1.1"` → `"version": "0.1.2"`

```
anchor:
  @mspec-delta 2026-05-21-075242-bump-cli-version-0-1-2/specs/cli-core/spec.md
  Requirements implemented: FR-005
  Change: bump-cli-version-0-1-2
```

**完了条件**:
- GIVEN `packages/cli/package.json` が存在する
- WHEN `"version"` フィールドを参照する
- THEN その値が `"0.1.2"` であること
- `npm test` を実行し、`publish-prep.test.ts` が PASS すること

## Phase 4 — Polish

### Task 4-1: package-lock.json 再生成

`npm install` を実行して `package-lock.json` を最新化する。

**コマンド**:
```bash
cd packages/cli && npm install
```

**完了条件**:
- `package-lock.json` の `"version"` フィールドが `"0.1.2"` になっていること
- `npm test` 全体が PASS すること

### Task 4-2: 最終確認

```bash
cd packages/cli
node -e "console.log(require('./package.json').version)"
# → 0.1.2

npm test
# → All tests pass
```

**チェックリスト確認事項**:
- [ ] `grep -r "0\.1\.1" packages/cli/tests/` で 0 件（D-002 以外に漏れがないこと）
- [ ] `package-lock.json` の差分が version フィールドのみであること

## Constitution Check

| Principle | Phase 0 | 評価 |
|-----------|---------|------|
| I. ステップ独立性 | ✅ tasks.md のみ生成、実装なし | 合格 |
| II. 決定論的マージ | ✅ タスクの実行順序と対象ファイルが一意に特定されている | 合格 |
| III. 質問駆動の要件確定 | ✅ research + self-review で全 Open Choices 解消済み | 合格 |
| IV. 双方向アンカー | ✅ 全タスクに `@mspec-delta` anchor ブロックを付与 | 合格 |
| V. 強制ステップと拡張ステップの分離 | ✅ 強制ステップのみ実行 | 合格 |
