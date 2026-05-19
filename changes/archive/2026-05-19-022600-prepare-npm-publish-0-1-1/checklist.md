---
doc_type: Reference
---

# Checklist: prepare-npm-publish-0-1-1

## Delta Spec Coverage

- [x] FR-003 Scenario "beta tag でのインストール": `npm pack --dry-run` 後の tarball が `dist/`, `templates/`, `package.json`, `README.md`, `LICENSE` を含み、publish 後 `npm install -g @mspec/cli@beta` で `mspec --version` が `0.1.1` を返すことを確認する <!-- verify: fr-003 -->
- [x] FR-003 Scenario "latest tag が汚染されない": `npm view @mspec/cli dist-tags` で `latest` タグが存在しない（または旧版を指す）こと、`beta` タグのみが `0.1.1` を指すことを確認する <!-- verify: fr-003 -->
- [x] FR-003 Scenario "パッチバージョン更新の継続的公開": `git tag v0.1.1 && git push --tags` で publish.yml が起動し、`npm publish --tag beta` により `0.1.1` が `beta` タグに追加されつつ `latest` が更新されないことを確認する <!-- verify: fr-003 -->
- [x] FR-003 文言整合: SoT 反映後、Requirement 本文の "バージョン `0.1.0`" が "バージョン `1.0.0` 未満（`0.x.y` の初期開発フェーズ）" に置換されていることを `specs/cli-distribution/spec.md` で目視確認する <!-- verify: human -->

## Source-of-Truth Regression

- [ ] cli-distribution FR-001 "配布物にソースが含まれない": `files` whitelist は `["dist","templates"]` のまま新規 `README.md`/`LICENSE` は package.json の root にあるため npm の慣例で自動同梱されるが、`npm pack --dry-run` で `src/`・`node_modules/`・`.claude/` が混入しないことを必ず再検証する（CRITICAL: メタデータ追加で同梱規則が変化していないか確認） <!-- verify: fr-001 -->
- [ ] cli-distribution FR-001 "グローバルインストール後のコマンド実行": `prepublishOnly: "npm run build"` 追加により publish 経路でも `dist/index.js` が再生成され、`bin` エントリ `mspec --version` が終了コード 0 を返すことを確認する <!-- verify: fr-001 -->
- [ ] cli-distribution FR-002 "npx で init を実行": `npx @mspec/cli@beta init` がインストールなしで `init` を実行できることを確認する（`bin` 設定と tarball 構成の変更で破壊されていないこと） <!-- verify: fr-002 -->
- [ ] ci-cd FR-001 "バージョンタグのプッシュで自動リリース": Scenario 内例示 `v0.1.0` は不変だが、実運用 `v0.1.1` タグで publish.yml が起動し `--tag beta` で公開されること（CRITICAL: ワークフロー未変更でも version bump が正しくトリガすることを確認） <!-- verify: human -->
- [ ] ci-cd FR-002 "ビルド・テスト通過後の publish 実行": publish.yml の `npm run build` + `npm test` が成功した後にのみ publish が走ること、`prepublishOnly` の重複ビルドがワークフローを破壊しないことを確認する <!-- verify: human -->
- [ ] ci-cd FR-003 "GitHub Release からの publish": Release イベント経路でも `0.1.1` が publish 可能であることを確認する（本変更では未テストだが回帰経路として記録） <!-- verify: human -->
- [ ] version-check FR-001 "最新バージョンの取得成功": `https://registry.npmjs.org/@mspec/cli/latest` への取得処理は `latest` タグ前提だが、本変更でも `latest` タグは更新されないため挙動不変であることを確認する <!-- verify: human -->
- [ ] version-check FR-003 "pre-release バージョンが最新の場合でも除外される": `0.1.1` が `beta` タグに公開されても version-check の比較対象から除外され続けることを確認する <!-- verify: human -->

## Constitution

- [ ] I. ステップ独立性: 本変更は design → tasks → implement で完結し、archive 後の SoT 反映後も他チェンジへの逆流がないことを確認する <!-- verify: human -->
- [ ] II. 決定論的マージ: Delta Spec FR-003 (MODIFIED) が `mspec archive` で SoT の FR-003 を機械的に置換し、同一入力で再実行してもバイト一致することを確認する <!-- verify: human -->
- [ ] III. 質問駆動の要件確定: research.md に 5 件の Open Choices 確定記録が残っており、追加質問なしで minor スコープが完結することを確認する <!-- verify: human -->
- [ ] IV. 双方向アンカー: 本変更は package.json/README/LICENSE のメタデータのみで実装コード変更なし、アンカー必須対象が存在しないことを `mspec anchor check` で確認する <!-- verify: human -->
- [ ] V. 強制ステップと拡張ステップの分離: 強制ステップ（new/delta/archive）に副作用を持ち込まず、`workflow.yaml` および `removable` フラグに変更がないことを確認する <!-- verify: human -->
