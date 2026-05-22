---
doc_type: AI-Internal
---

# Tasks: fix-upgrade-package-json-path

## Phase 1 — Setup

（セットアップ不要。`upgrade.ts` 1 ファイルの修正のみで既存の開発環境で実施可能）

## Phase 2 — Foundational

### Task 2-1: 既存テストの Red 確認（E2E 事前検証）

修正前の状態で既存テストが通っていることを確認する。特に `upgrade.test.ts:91-107` の
`it('shows already up-to-date message...')` は `getCurrentVersion()` を実際に呼び出しており、
修正後も継続して動作する必要がある。

**ファイル**: `packages/cli/src/commands/upgrade.test.ts:91-107`
**確認コマンド**:
```bash
cd packages/cli && npm test -- upgrade.test.ts
```

```
anchor:
  @mspec-delta 2026-05-21-215113-fix-upgrade-package-json-path/specs/upgrade-command/spec.md
  Requirements implemented: FR-001, FR-002
  Change: fix-upgrade-package-json-path
```

**完了条件**:
- 既存テストが全件 PASS すること（修正前の Green ベースラインの記録）

### Task 2-2: グローバルインストール環境でのバグ再現確認

修正前の状態でバグが再現することを確認する。

**確認方法**:
```bash
# グローバルインストール環境での再現確認
/opt/homebrew/bin/mspec upgrade 2>&1 | head -5
# → Error: Cannot find module '../../package.json' が出ること
```

```
anchor:
  @mspec-delta 2026-05-21-215113-fix-upgrade-package-json-path/specs/upgrade-command/spec.md
  Requirements implemented: FR-002
  Change: fix-upgrade-package-json-path
```

**完了条件**:
- GIVEN グローバルインストール環境
- WHEN `mspec upgrade` を実行
- THEN `Cannot find module '../../package.json'` エラーが出ること（バグ再現）

## Phase 3 — User Story

### Task 3-1: `getCurrentVersion()` のパス解決修正（Green フェーズ）

`packages/cli/src/commands/upgrade.ts` の `getCurrentVersion()` 関数を修正する。

**注意**: `join(here, '../package.json')` の単純な 1 段上参照はバンドル環境（`dist/index.js`）では
正しいが、vitest がソースを直接実行するテスト環境（`src/commands/upgrade.ts`）では
`src/package.json`（存在しない）を参照してしまう。`init.ts` と同様に candidates 配列で
両環境を吸収すること。

**ファイル**: `packages/cli/src/commands/upgrade.ts`

**変更内容**:

import セクションを以下に置き換える:
```typescript
// 削除: import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
```

`getCurrentVersion()` 関数を以下に置き換える:
```typescript
export function getCurrentVersion(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  // candidates: dist/index.js 環境と src/commands/upgrade.ts 環境の両方に対応
  const candidates = [
    join(here, '../package.json'),    // dist/ → packages/cli/package.json
    join(here, '../../package.json'), // src/commands/ → packages/cli/package.json
  ];
  for (const c of candidates) {
    try {
      return (JSON.parse(readFileSync(c, 'utf8')) as { version: string }).version;
    } catch {
      // 次の候補を試す
    }
  }
  throw new Error('Cannot resolve package.json from getCurrentVersion()');
}
```

```
anchor:
  @mspec-delta 2026-05-21-215113-fix-upgrade-package-json-path/specs/upgrade-command/spec.md
  Requirements implemented: FR-001, FR-002
  Change: fix-upgrade-package-json-path
```

**完了条件**:
- GIVEN `@mspec/cli` がローカルインストールされている（テスト環境）
- WHEN `npm test -- upgrade.test.ts` を実行する
- THEN 既存テスト全件 PASS すること（Green）

### Task 3-2: tsup build でビルド成果物を再生成

ソース修正後に `dist/index.js` を再ビルドする。

**コマンド**:
```bash
cd packages/cli && npm run build
```

```
anchor:
  @mspec-delta 2026-05-21-215113-fix-upgrade-package-json-path/specs/upgrade-command/spec.md
  Requirements implemented: FR-001, FR-002
  Change: fix-upgrade-package-json-path
```

**完了条件**:
- `dist/index.js` が再生成されること
- `grep "createRequire" packages/cli/dist/index.js` が upgrade 関連の行で 0 件になること

## Phase 4 — Polish

### Task 4-1: グローバルインストール環境でのバグ修正確認

再ビルド後の `dist/index.js` をグローバル環境で動作確認する。

**確認手順**:
```bash
# ローカルビルドをグローバルにリンク（または npm install -g で再インストール）
cd packages/cli && npm install -g .

# グローバル環境でテスト
mspec upgrade --yes 2>&1
# → "Cannot find module" が出ないこと
```

**完了条件**:
- GIVEN `@mspec/cli` がグローバルインストールされている
- WHEN `mspec upgrade` を実行する
- THEN プロセスが exit code 0 で終了し、標準エラーに `Cannot find module` が含まれないこと（FR-002）
- THEN バージョン情報が正しく表示されること（FR-001）

### Task 4-2: ローカル環境の regression 確認

```bash
cd packages/cli && npm test
```

**完了条件**:
- 全テストが PASS すること（regression なし）
- `upgrade.test.ts` の `it('shows already up-to-date message...')` が PASS すること

## Constitution Check

| Principle | Phase 0 | 評価 |
|-----------|---------|------|
| I. ステップ独立性 | ✅ tasks.md のみ生成、実装なし | 合格 |
| II. 決定論的マージ | ✅ 変更対象が `upgrade.ts` 1 ファイルに一意に特定されている | 合格 |
| III. 質問駆動の要件確定 | ✅ research + self-review で全 Open Choices 解消済み。candidates 配列の必要性は tasks 段階で特定。 | 合格 |
| IV. 双方向アンカー | ✅ 全実装タスクに `@mspec-delta` anchor ブロックを付与 | 合格 |
| V. 強制ステップと拡張ステップの分離 | ✅ 強制ステップのみ実行 | 合格 |
