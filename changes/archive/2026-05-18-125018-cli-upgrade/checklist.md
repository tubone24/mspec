---
doc_type: AI-Internal
---

# Checklist: cli-upgrade

## Delta Spec Coverage

### capability: cli-upgrade

- [x] **cli-upgrade FR-001** — `mspec upgrade` サブコマンドの提供: `index.ts` に `program.command('upgrade')` が登録され、実行時にバージョン確認フローが起動すること (e2e) <!-- verify: fr-001 -->
- [x] **cli-upgrade FR-002** — 現在バージョンと最新バージョンの表示: `mspec upgrade` 実行後、stdout に「現在のバージョン: x.y.z」「最新バージョン: a.b.c」の2行形式が出力されること (e2e/integration) <!-- verify: fr-002 -->
- [x] **cli-upgrade FR-003** — アップグレードの実行: 新しいバージョンが存在する状態でユーザーが確認プロンプトに同意したとき、`npm install -g @mspec/cli@latest` が実行されアップグレード完了メッセージが表示されること (e2e/integration) <!-- verify: fr-003 -->
- [x] **cli-upgrade FR-004** — 既に最新版の場合のメッセージ: `currentVersion === latestVersion` のとき、npm install を実行せず「すでに最新バージョンです」旨のメッセージが表示されて exit 0 すること (unit/integration) <!-- verify: fr-004 -->

### capability: version-check

- [x] **version-check FR-001** — npm registry からの最新バージョン取得: ネットワーク正常時に `https://registry.npmjs.org/@mspec/cli/latest` の `.version` フィールドから最新バージョン文字列が取得できること (integration) <!-- verify: fr-001 -->
- [x] **version-check FR-002** — ネットワークエラー時のエラーメッセージ表示: fetch 失敗またはタイムアウト時に stderr にエラーメッセージが出力され、非ゼロ終了コードで終了すること (unit/integration) <!-- verify: fr-002 -->
- [x] **version-check FR-003** — ベータ・RC バージョンの除外: `latest` タグエンドポイントのみを使用することで beta/RC/pre-release を比較対象から自動除外すること (unit) <!-- verify: fr-003 -->

---

## Source-of-Truth Regression Risk

### cli-upgrade SoT (`specs/cli-upgrade/spec.md`) — EMPTY STUB
既存 SoT スペックはプレースホルダーのみでアクティブな FR を持たない。本チェンジが最初のマージとなるため、退行リスクなし。

### version-check SoT (`specs/version-check/spec.md`) — EMPTY STUB
既存 SoT スペックはプレースホルダーのみでアクティブな FR を持たない。退行リスクなし。

### cli-core SoT (`specs/cli-core/spec.md`)

- [x] **[MEDIUM] cli-core FR-001 — CLI output messages SHALL use colon format**: `upgrade.ts` が出力する次ステップ案内や確認プロンプト文字列にハイフン形式 `/mspec-*` の文字列が含まれていないこと。→ 自動確認済み: upgrade.ts の user-facing 出力に `/mspec-*` パターンなし（anchor コメントのみ）。 <!-- verify: human -->
- [ ] **[MEDIUM] cli-core FR-002 — Documentation files SHALL use colon format**: `upgrade` コマンドを README 等に記載する際、コマンド参照がコロン形式になっていること。本チェンジのドキュメント更新が対象。 <!-- verify: human -->
- [ ] **[LOW] cli-core FR-003 — archive コマンドの done-log 記録**: `index.ts` への変更は `archive` コマンドの処理フローに影響しないが、コマンド登録順序変更によるサイドエフェクトがないことを確認する。 <!-- verify: human -->

### cli-anchor SoT (`specs/cli-anchor/spec.md`)

- [x] **[HIGH] cli-anchor FR-001/FR-005 — `@mspec-delta` anchor block が必要**: 新規実装ファイル `packages/cli/src/commands/upgrade.ts` の先頭に正形式の 3 行アンカーブロックが存在すること。→ 自動確認済み: `mspec anchor check` で `upgrade.ts:1` のアンカーが解決（0 errors）。 <!-- verify: human -->
- [x] **[MEDIUM] cli-anchor FR-006/FR-007/FR-008 — anchor check が通ること**: `mspec anchor check` を実行したとき、`upgrade.ts` のアンカーが change-dir・capability spec・FR-ID すべてで解決でき、非ゼロ終了しないこと。→ 自動確認済み: `Scanned 124 anchor(s), 0 error(s)` で通過済み。 <!-- verify: human -->

### cli-distribution SoT (`specs/cli-distribution/spec.md`)

- [ ] **[HIGH] cli-distribution — beta タグのみ公開中は `latest` タグが存在しない**: 本チェンジ実装後、`mspec upgrade` は `https://registry.npmjs.org/@mspec/cli/latest` にアクセスするが、`@mspec/cli` が `--tag beta` でのみ公開されている間は `latest` タグが存在しないため 404 または空レスポンスとなる。`npm install -g @mspec/cli@latest` も同様に失敗する。**対処手順**: (1) 404/空レスポンス時は `version-check FR-002` のネットワークエラーパスと同様のエラーメッセージを表示して exit 1 すること（実装で確認）。(2) `latest` タグを付与してから本機能をリリースすること: `npm dist-tag add @mspec/cli@<version> latest`。これはリリースチェックリストに明記すること。 <!-- verify: human -->

---

## Constitution Check Coverage

- [ ] **原則 I — ステップ独立性**: `design.md` が `research.md` と Delta Spec のみを入力とし後続ステップへの依存なしと宣言している。`upgrade.ts` および `index.ts` の変更が既存ステップ間の依存関係を増やしていないこと。 <!-- verify: human -->
- [ ] **原則 II — 決定論的マージ**: `cli-upgrade` および `version-check` の両 SoT スペックが空スタブのため、Delta Spec → SoT マージは純粋な追加操作となり一意に定まる。`mspec archive` のマージ出力が同一入力で再実行しても一致すること。 <!-- verify: human -->
- [ ] **原則 III — 質問駆動の要件確定**: `--yes` フラグ仕様とタイムアウト値 (10秒) がユーザー確認済みであることが `research.md` の Open Choices 解決として記録されている。未解決の要件疑問点がないこと。 <!-- verify: human -->
- [x] **原則 IV — 双方向アンカー**: `upgrade.ts`（新規実装ファイル）と E2E テストファイルに `@mspec-delta` アンカーブロックが打たれていること。→ 自動確認済み: `mspec anchor check` 通過（upgrade.ts:1 / upgrade.test.ts:1,4 すべて解決）。 <!-- verify: human -->
- [ ] **原則 V — 強制ステップと拡張ステップの分離**: `upgrade` コマンドの追加が `workflow.yaml` の強制ステップ定義に干渉しないこと。`removable` フラグや既存ステップ構造に変更がないこと。 <!-- verify: human -->
- [ ] **Additional Constraints — 外部ネットワーク依存**: `memory/constitution.md` の Additional Constraints として外部ネットワーク依存の導入について `design.md` の Complexity Tracking に記録があるか、または許容済みであるかを確認すること。`design.md` の Constitution Check に Additional Constraints 行が欠落している点に注意。 <!-- verify: human -->
- [ ] **Additional Constraints — RFC 2119 キーワードセマンティクス**: `cli-upgrade` および `version-check` の Delta Spec 全 FR が `SHALL` / `MUST` を正しく使い分けていること（機能要件 = `SHALL`、制約・安全要件 = `MUST`）。 <!-- verify: human -->
