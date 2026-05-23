---
doc_type: AI-Internal
---

# Research: bump-cli-version-0-1-2

## Decisions

| 論点 | 採用案 | 代替案 | 根拠 |
|------|--------|--------|------|
| バージョン番号の正当性 | 0.1.1 → 0.1.2 (patch bump) | minor bump (0.2.0) / major bump (1.0.0) | semver.org: patch 番号はバグ修正・後方互換変更にのみ使用。本変更は version フィールド更新のみで機能追加なし。patch bump が正。 |
| テストファイルの更新要否 | `publish-prep.test.ts:26` の `'0.1.1'` → `'0.1.2'` に直値更新する | テストを削除 / バージョンを動的取得に変更 | ユーザー判断: 最小変更で直値更新を採用。テストの意図（バージョンが正しく定義されているか）は維持する。 |
| package-lock.json の扱い | 実装ステップで `npm install` を実行して再生成する | 手動編集 / 放置 | ユーザー判断: lock ファイルの乖離を解消する。`npm install` で正確に再生成。 |
| cli-distribution/spec.md の更新要否 | 更新不要 | 更新する | `specs/cli-distribution/spec.md` に登場する `0.1.1` はすべて過去の publish シナリオの例示であり、現行 spec の要件ではない。 |

## Web References

- [Semantic Versioning 2.0.0](https://semver.org/) — MAJOR.MINOR.PATCH の定義。patch は後方互換バグ修正。0.1.1 → 0.1.2 は正当な patch bump。
- [About semantic versioning | npm Docs](https://docs.npmjs.com/about-semantic-versioning/) — npm における semver 運用の公式ガイド。

## Codebase Findings

| ファイル | 行 | 内容 | 対応 |
|----------|-----|------|------|
| `packages/cli/package.json` | 3 | `"version": "0.1.1"` | **更新対象**（メイン変更箇所）|
| `packages/cli/tests/publish-prep.test.ts` | 26 | `expect(pkg.version).toBe('0.1.1')` | **更新対象**（`'0.1.2'` に変更）|
| `packages/cli/package-lock.json` | 3, 9 | version が `0.1.0-alpha.1` と乖離 | `npm install` で自動再生成（手動編集不要）|
| `specs/cli-distribution/spec.md` | 51, 58 | `0.1.1` の言及 | 更新不要（過去 publish 例示の記述のみ）|
| `changes/archive/2026-05-19-*/` | — | アーカイブ済み change | 参照のみ、変更不要 |
| `package.json` (root) | 12 | `"version": "0.1.0"` | 更新不要（cli とは独立管理）|

## Open Choices

（なし。すべてユーザー確認済み）

## Constitution Check

| Principle | Phase 0 | 評価 |
|-----------|---------|------|
| I. ステップ独立性 | ✅ research.md のみ生成、実装なし | 合格 |
| II. 決定論的マージ | ✅ 新規ファイルのみ、競合なし | 合格 |
| III. 質問駆動の要件確定 | ✅ 2問の Open Choices をユーザー確認で解消 | 合格 |
| IV. 双方向アンカー | ✅ delta ステップで付与済み（FR-005）| 合格 |
| V. 強制ステップと拡張ステップの分離 | ✅ 強制ステップのみ実行 | 合格 |
