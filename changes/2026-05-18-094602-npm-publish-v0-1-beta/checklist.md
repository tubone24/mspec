---
doc_type: AI-Internal
---

# Checklist: npm-publish-v0-1-beta

## Delta Spec Coverage

### cli-distribution

- [ ] **FR-001 — npm パッケージ公開設定**: `npm pack` で生成した tarball に `src/`・`node_modules/`・`.claude/` が含まれず、`dist/` と `templates/` のみが含まれること <!-- verify: fr-001 -->
- [ ] **FR-001 — npm パッケージ公開設定**: `npm install -g @mspec/cli@beta` 後に `mspec --version` が `0.1.0-beta.1` を出力し、終了コード 0 で終了すること <!-- verify: fr-001 -->
- [ ] **FR-001 — npm パッケージ公開設定**: `package.json` の `bin`・`files`・`publishConfig` が design.md D-001 の仕様どおりに設定されていること <!-- verify: human -->
- [ ] **FR-002 — npx 実行サポート**: グローバルインストールなし環境で `npx @mspec/cli init` を実行し、`init` コマンドが正常に起動してプロジェクトが初期化されること <!-- verify: fr-002 -->
- [ ] **FR-003 — ベータバージョンでの npm tag 管理**: `npm install -g @mspec/cli@beta` で beta バージョンがインストールされ `mspec` コマンドが使用可能になること <!-- verify: fr-003 -->
- [ ] **FR-003 — ベータバージョンでの npm tag 管理**: `--tag beta` なしの `npm install -g @mspec/cli` では `latest` タグが汚染されず、beta バージョンがデフォルトでインストールされないこと <!-- verify: fr-003 -->

### ci-cd

- [ ] **FR-001 — git tag トリガーによる自動 npm publish**: `git tag v0.1.0-beta.1 && git push --tags` 実行時に GitHub Actions が起動し、ビルド・テスト後に `@mspec/cli@0.1.0-beta.1 --tag beta` が npm に公開されること <!-- verify: fr-001 -->
- [ ] **FR-001 — git tag トリガーによる自動 npm publish**: 通常の `git push origin main`（tag なし）では npm publish が実行されず、CI チェックのみ実行されること <!-- verify: fr-001 -->
- [ ] **FR-002 — publish 前の CI ゲート**: テストが 1 件以上失敗する状態でタグをプッシュした場合、ワークフローがエラーで終了し npm publish が実行されないこと <!-- verify: fr-002 -->
- [ ] **FR-002 — publish 前の CI ゲート**: 全テスト通過・ビルド成功の状態でタグをプッシュした場合、npm publish が実行されて成功ログが残ること <!-- verify: fr-002 -->
- [ ] **FR-003 — GitHub Release トリガーによる publish**: GitHub UI または `gh release create` で Release を作成し `release: released` イベントで GitHub Actions が起動、npm publish が実行されること <!-- verify: fr-003 -->
- [ ] **ci-cd**: `NPM_TOKEN` が GitHub Secrets に設定されていることが前提であり、設定がない場合の publish 失敗挙動が明示されていること <!-- verify: human -->

## Source-of-Truth Regression Risk

- [ ] **[MEDIUM] cli-distribution SoT spec が空スタブ**: `/specs/cli-distribution/spec.md` には既存 Requirement がなく、このチェンジで FR-001〜FR-003 が初めて追加される。アーカイブ後のマージ結果が Delta Spec の内容を完全に含むことを確認すること <!-- verify: human -->
- [ ] **[MEDIUM] ci-cd SoT spec が空スタブ**: `/specs/ci-cd/spec.md` には既存 Requirement がなく、このチェンジで FR-001〜FR-003 が初めて追加される。アーカイブ後のマージ結果が Delta Spec の内容を完全に含むことを確認すること <!-- verify: human -->
- [ ] **[HIGH] D-002: `createRequire` によるバージョン動的参照のパス解決**: `dist/` 以下の実際のディレクトリ構造で `require('../../package.json')` が `packages/cli/package.json` を正しく指すか確認すること。ビルド後の `dist/` の深さが変わると `--version` が `undefined` または実行エラーになる <!-- verify: human -->
- [ ] **[HIGH] `files` ホワイトリストに `templates/` が含まれること**: `package.json` の `files` フィールドに `templates/` が含まれていない場合、インストール後に `mspec init` がテンプレートファイルを見つけられず cli-init 機能が破損する <!-- verify: human -->
- [ ] **[LOW] cli-core との干渉なし**: 本チェンジはテンプレートファイルや CLI 出力メッセージを変更しないため、変更後も `grep -r "mspec-" packages/cli/templates/` がゼロ件であることを確認 <!-- verify: human -->
- [ ] **[LOW] 全サブコマンドの実行可能性**: グローバルインストールした `@mspec/cli` が `mspec init` 以外のサブコマンドも正常に起動できること（`dist/` 配布物に全サブコマンドが含まれること） <!-- verify: human -->
- [ ] **[LOW] Node.js バージョン互換性**: `createRequire(import.meta.url)` は Node 18 以降で動作するが、ターゲット環境の最小 Node バージョンが `package.json` の `engines` フィールドに明記されていることを確認 <!-- verify: human -->

## Constitution Check

| Principle | Phase 0 | Phase 1 |
|-----------|---------|---------|
| I. ステップ独立性 | ✅ design のみ生成、実装なし | ✅ proposal / research / delta と独立したファイルを生成 |
| II. 決定論的マージ | ✅ 新規ファイルのみ追加 | ✅ 既存ファイルへの変更は patch として design.md に明示 |
| III. 質問駆動の要件確定 | ✅ research で Open Choices 解決済み | ✅ 追加の設計判断なし（全て research で確定） |
| IV. 双方向アンカー | ✅ `@mspec-delta` アンカーを冒頭に付与 | ✅ D-001〜D-003 が FR 番号と対応 |
| V. 強制ステップと拡張ステップの分離 | ✅ 強制ステップのみ | ✅ design-rationale・architecture-overview も必須成果物 |

- [ ] **Constitution I — ステップ独立性**: design.md が proposal/research/delta の成果物を再読込せずに自己完結した設計を提供していること <!-- verify: human -->
- [ ] **Constitution II — 決定論的マージ**: D-001〜D-003 で既存ファイルへの変更差分が patch 形式で明示されており、LLM に依存しないマージが可能であること <!-- verify: human -->
- [ ] **Constitution III — 質問駆動の要件確定**: research.md に Open Choices の解決記録が存在し、design.md の決定が全て追跡可能であること <!-- verify: human -->
- [ ] **Constitution IV — 双方向アンカー**: `publish.yml`・`package.json`・`src/index.ts` の実装ファイルおよびテストに `@mspec-delta` アンカーが付与されること（実装後に `mspec anchor check` でゼロ違反であること） <!-- verify: human -->
- [ ] **Constitution V — 強制ステップと拡張ステップの分離**: 本チェンジが `workflow.yaml` の `removable` フラグや強制ステップ定義を変更していないこと <!-- verify: human -->
