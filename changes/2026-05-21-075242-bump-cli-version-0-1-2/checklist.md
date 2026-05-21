---
doc_type: AI-Internal
---

# Checklist: bump-cli-version-0-1-2

## Delta Spec Coverage

- [ ] FR-005 がデザイン決定 D-001（`packages/cli/package.json` の `version` フィールドを `"0.1.2"` に直接編集）によってカバーされていること <!-- verify: fr-005 -->
- [ ] FR-005 の Scenario が `publish-prep.test.ts:26` の `expect(pkg.version).toBe('0.1.2')` によって E2E 的に検証されること <!-- verify: fr-005 -->
- [ ] D-002（テストの直値更新）が FR-005 の受け入れ基準と 1:1 で対応していること <!-- verify: human -->
- [ ] D-003（`npm install` による `package-lock.json` 再生成）が FR-005 の Scenario 外の副作用として設計文書に明記されていること <!-- verify: human -->

## Source-of-Truth Regression

### 既存 FR への影響評価

- [ ] FR-001（CLI output messages SHALL use colon format）はバージョン文字列と無関係であり、本変更によって回帰しないこと <!-- verify: human -->
- [ ] FR-002（Documentation files SHALL use colon format）はバージョン文字列と無関係であり、本変更によって回帰しないこと <!-- verify: human -->
- [ ] FR-003（archive コマンドの done-log 記録）はバージョン文字列と無関係であり、本変更によって回帰しないこと <!-- verify: human -->
- [ ] FR-004（`mspec mock` サブコマンド）はバージョン文字列と無関係であり、本変更によって回帰しないこと <!-- verify: human -->

### 横断リスク

- [ ] `packages/cli/tests/` 配下で `"0.1.1"` をハードコードしているファイルが `publish-prep.test.ts` 以外に存在しないこと（`grep -r "0\.1\.1" packages/cli/tests/` で 0 件または D-002 対象行のみ） <!-- verify: human -->
- [ ] `npm install` 実行後の `package-lock.json` の差分が `version` フィールドの更新（`0.1.0-alpha.1` → `0.1.2`）のみであり、予期しないトランジティブ依存の変更を含まないこと <!-- verify: human -->
- [ ] 関連するほかのケイパビリティ仕様（`cli-distribution`、`cli-upgrade` など）が CLI パッケージの特定バージョン番号を参照していないこと <!-- verify: human -->
- [ ] `npm-publish-package-config.e2e.test.ts` の semver 形式チェック（`/^\d+\.\d+\.\d+/`）が `0.1.2` に対して引き続き通ること <!-- verify: human -->

## Constitution

- [ ] Principle I（ステップ独立性）: design.md の Constitution Check で Phase 0「design.md のみ生成、実装なし」・Phase 1「他ステップの成果物に依存せず独立」が確認されていること <!-- verify: human -->
- [ ] Principle II（決定論的マージ）: design.md の Constitution Check で Phase 0「新規ファイルのみ、競合なし」・Phase 1「変更対象ファイルが一意に特定されている」が確認されていること <!-- verify: human -->
- [ ] Principle III（質問駆動の要件確定）: design.md の Constitution Check で Phase 0「research 段階で Open Choices 解消済み」・Phase 1「追加の判断事項なし」が確認されていること <!-- verify: human -->
- [ ] Principle IV（双方向アンカー）: design.md の Constitution Check で Phase 0「FR-005 と D-001 が対応付け済み」・Phase 1「Scenario が受け入れ基準に引き継がれている」が確認されていること。実装後に `@mspec-delta` アンカーが実装ファイルおよびテストに打たれること <!-- verify: human -->
- [ ] Principle V（強制ステップと拡張ステップの分離）: design.md の Constitution Check で Phase 0「強制ステップのみ実行」・Phase 1「拡張ステップへの依存なし」が確認されていること <!-- verify: human -->
- [ ] `memory/constitution.md` の全 5 原則（I〜V）すべてに design.md の Constitution Check テーブルで対応行が存在すること <!-- verify: human -->
