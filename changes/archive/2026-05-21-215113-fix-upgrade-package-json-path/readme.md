---
doc_type: Tutorial
---

<!-- @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md -->
<!-- Requirements implemented: FR-005 -->
<!-- Change: revise-artifact-taxonomy -->

# fix-upgrade-package-json-path

> Status: archived
> Created: 2026-05-21
> Mode: bugfix

## Request

グローバルインストールされた `@mspec/cli` で `mspec upgrade` を実行すると、`Error: Cannot find module '../../package.json'` が発生してエラーになる。
`/opt/homebrew/lib/node_modules/@mspec/cli/dist/index.js` からの相対パス `../../package.json` が解決できないのが原因。
このパス解決バグを修正し、`mspec upgrade` コマンドが正常に動作するようにする。

## Artifacts

- [x] proposal.md
- [x] specs/<capability>/spec.md (Delta Spec)
- [x] research.md
- [x] design.md / design-rationale.md / architecture-overview.md
- [ ] quickstart.md
- [x] checklist.md
- [x] tasks.md

## Skipped Steps

<!-- `mspec skip <step-id> --reason "..."` 実行時に追記される -->
- quickstart: bugfix モードのため省略 (skipped at 2026-05-21T22:33:30.805Z)
<!-- 例: - research: typo 修正のみのため省略 (skipped at 2026-05-14T10:30:00Z) -->

## Summary (Lessons / Next Steps)

### Lessons

- **tsup シングルバンドルの相対パス罠**: `createRequire(import.meta.url)('../../package.json')` は元ソースファイル位置では正しく見えるが、tsup が `dist/index.js` に統合するとパス基準が変わりグローバルインストール時に破綻する。バンドル後のファイル位置を想定したパス設計が必要。
- **`fileURLToPath` candidates 配列パターン**: `init.ts` の既存イディオムを参考に、バンドル環境（`dist/`）とソース環境（`src/commands/`）の両方をカバーする candidates 配列で対応。単純な `'../package.json'` はバンドルのみ正常でテスト環境が壊れる。
- **`produces: []` ステップは `mspec done` が必要**: `self-review` と `implement` のように成果物ファイルを生成しないステップは `mspec done <step-id>` コマンドで done-log に記録しないと state machine が先に進まない。`mspec continue` の `next_action: execute` がループし続ける。
- **E2E テストファイルへのアンカーは `enforce_e2e` に必須**: 実装ファイルのアンカーだけでは `enforce_e2e` は通らない。`tests/e2e/` 配下のファイルにも `@mspec-delta` アンカーを追加する必要がある。
- **テスト環境の pre-existing failure 対策**: T102（npm publish バージョン衝突）のような既存失敗があると `expect-green` が全スイートで通らない。スコープを絞ったテストコマンドに一時切り替えて証拠を記録し復元するパターンが有効。

### Next Steps

- **`index.ts` の `require('../package.json')` を `fileURLToPath` パターンに統一**: 現状は正常動作しているが、同一の技術的負債を持つ。別変更で対応推奨（関連: FR-001 のアプローチ）。
- **T102 テスト（npm publish dry-run）の修正**: `publish-prep.test.ts` の `npm publish --dry-run` がバージョン衝突で常時失敗している。全スイートの CI green 化のために別変更での修正を推奨。
- **`upgrade-command` / `cli-upgrade` SoT 統合の検討**: 今回 `specs/upgrade-command/` に FR-001/FR-002 を追加したが、`specs/cli-upgrade/` も同一コマンドをカバーする。将来的に 2 SoT の統合または責務分離の明確化を推奨。
