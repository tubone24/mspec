---
doc_type: Tutorial
---

# Quickstart: bump-cli-version-0-1-2

## 概要

mspec CLI のパッケージバージョンを `0.1.1` から `0.1.2` にバンプする手順。

## 手順

### 1. package.json の更新

```bash
# packages/cli/package.json の version フィールドを編集
# "version": "0.1.1"  →  "version": "0.1.2"
```

### 2. テストの更新

```bash
# packages/cli/tests/publish-prep.test.ts の 26 行目を編集
# expect(pkg.version).toBe('0.1.1')  →  expect(pkg.version).toBe('0.1.2')
```

### 3. package-lock.json の再生成

```bash
cd packages/cli
npm install
```

### 4. 動作確認

```bash
# リポジトリルートに戻り、バージョンが正しく更新されているか確認
cd packages/cli
node -e "console.log(require('./package.json').version)"
# → 0.1.2

# テストが通ることを確認
npm test
```

## 確認ポイント

- `packages/cli/package.json` の `"version"` が `"0.1.2"` になっていること
- `publish-prep.test.ts` のテストが green であること
- `package-lock.json` の version が `0.1.2` に更新されていること
