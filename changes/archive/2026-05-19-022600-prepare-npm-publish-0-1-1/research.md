---
doc_type: Reference
---

# Research: prepare-npm-publish-0-1-1

## Decisions

| 論点 | 採用案 | 根拠 |
|------|--------|------|
| バージョン更新方法 | `packages/cli/package.json` を手動編集して `0.1.0` → `0.1.1` | 既存 `.github/workflows/publish.yml` は `tags: v*` push で `npm publish --tag beta` を実行する設計。手動編集 + 後続で `git tag v0.1.1` を打つフローが現行 workflow と整合し最小変更。 |
| `prepublishOnly` script の追加 | `"prepublishOnly": "npm run build"` を追加 | npm 公式推奨。ローカル誤 publish の保険になる。CI 側 `publish.yml` も build+test を冪等に実行するため重複 OK。テストは含めず摩擦を下げる。 |
| `repository` / `homepage` / `bugs` フィールド | GitHub URL ベースで追加 | npm registry の品質指標、`npm bugs` / `npm repo` コマンドの動作に必要。 |
| `keywords` | `["spec-driven-development", "claude-code", "cli", "tdd", "mspec"]` | ユーザー承認済み。registry 検索性確保。 |
| `author` | `"tubone24"` | ユーザー指定。 |
| `packages/cli/README.md` 作成 | 最小版（インストール手順 + root README へのリンク） | npm registry ページに表示される。root README は `files` whitelist で同梱されないため packages/cli/ 配下に必要。minor スコープに留めるため最小構成。 |
| `packages/cli/LICENSE` | root の MIT LICENSE を `packages/cli/LICENSE` にコピー | npm tarball にライセンスを含めるため。`publishConfig` だけでは tarball に LICENSE は含まれない。 |
| `publishConfig.access` | 現状の `"access": "public"` を維持 | スコープパッケージ `@mspec/cli` のデフォルト access は `restricted`。`public` 明示必須。 |
| `bin` の shebang | 現状維持（`tsup.config.ts` の `banner.js: '#!/usr/bin/env node'` で付与済み） | `dist/index.js` に shebang・実行ビット両方確認済み。 |
| `files` whitelist | 現状維持（`["dist", "templates"]`） | npm 公式は `files` whitelist を優先推奨。`package.json` / `README.md` / `LICENSE` / `bin` ファイルは自動同梱。 |

## Web References

- [npm publish (CLI v10)](https://docs.npmjs.com/cli/v10/commands/npm-publish) — `--tag beta` 指定時 `latest` タグは更新されない。scoped package は `publishConfig.access: public` 必須。
- [Adding dist-tags to packages](https://docs.npmjs.com/adding-dist-tags-to-packages/) — beta tag 公開と、誤って latest が付いた場合の `npm dist-tag add` 修復手順。
- [package.json fields reference](https://docs.npmjs.com/cli/v10/configuring-npm/package-json) — `bin` shebang 必須、`files` whitelist 優先、推奨フィールド一覧。
- [npm scripts: prepublishOnly vs prepare](https://docs.npmjs.com/cli/v11/using-npm/scripts/) — `prepublishOnly` は publish 前のみ、`prepare` は install / git-dep 時も実行。CLI ビルドには `prepublishOnly` が適切。
- [npm/cli #7553 — prerelease tag known behavior](https://github.com/npm/cli/issues/7553) — `--tag beta` を付け忘れると prerelease でも `latest` が更新される既知挙動。明示必須の根拠。
- [How to Prerelease an npm Package (Cloud Four)](https://cloudfour.com/thinks/how-to-prerelease-an-npm-package/) — `0.x.y` を beta tag で配る運用例（本 spec FR-003 と一致）。

## Codebase Findings

- `/Users/kagadminmac/project/mspec/packages/cli/package.json:3` — `"version": "0.1.0"` → `0.1.1` に更新が必要（本変更の主目的）。
- `/Users/kagadminmac/project/mspec/packages/cli/package.json:10-13` — `files: ["dist", "templates"]` 設定済み。両ディレクトリの実体を確認済み。
- `/Users/kagadminmac/project/mspec/packages/cli/package.json:14-21` — `scripts` に `prepublishOnly` 不在。`build` / `test` / `typecheck` は存在。
- `/Users/kagadminmac/project/mspec/packages/cli/package.json` — `repository` / `homepage` / `bugs` / `keywords` / `author` フィールド未設定。
- `/Users/kagadminmac/project/mspec/packages/cli/package.json:42-45` — `publishConfig.access: public` と `license: MIT` 設定済み（OK）。
- `/Users/kagadminmac/project/mspec/packages/cli/` — `README.md` が存在しない。npm registry ページが空白になるリスク。
- `/Users/kagadminmac/project/mspec/packages/cli/dist/index.js:1` — `#!/usr/bin/env node` shebang 出力済み。実行ビット (`-rwxr-xr-x`) 付与済み。
- `/Users/kagadminmac/project/mspec/packages/cli/tsup.config.ts:13-15` — `banner.js: '#!/usr/bin/env node'`。ESM (`format: ['esm']`) + `target: 'node18'`、`engines.node: >=18.0.0` と整合。
- `/Users/kagadminmac/project/mspec/packages/cli/templates/` — `artifacts/` / `claude/` / `config.default.yaml` / `constitution.md` / `questions/` / `workflow.default.yaml` を含む。`files` whitelist 経由で同梱。
- `/Users/kagadminmac/project/mspec/.github/workflows/publish.yml` — `tags: v*` push トリガで `npm ci && npm run build && npm test && npm publish --tag beta`。`NPM_TOKEN` secret 必須。
- `/Users/kagadminmac/project/mspec/packages/cli/` 直下に `.npmignore` / `.npmrc` 無し（`files` whitelist 採用のため不要）。
- `/Users/kagadminmac/project/mspec/LICENSE` — リポジトリ root に MIT LICENSE 存在。`packages/cli/LICENSE` は不在 → コピー必要。

## Open Choices

すべて解決済み（user 承認）：
- README 内容 → 最小版
- LICENSE → root からコピー
- author → `tubone24`
- keywords → `spec-driven-development, claude-code, cli, tdd, mspec`
- `prepublishOnly` 内容 → `npm run build`（テスト含まず）

## Constitution Check (Phase 0)

| 原則 | 評価 | 備考 |
|------|------|------|
| I. ステップ独立性 | PASS | research.md は他ステップに依存せず単独で完結。Delta Spec（cli-distribution）と独立した分析を提供。 |
| II. 決定論的マージ | PASS | 本研究は Delta Spec FR-003 の MODIFIED と整合。archive 時のマージで `cli-distribution/spec.md` の FR-003 が機械的に置換される構造を維持。 |
| III. 質問駆動の要件確定 | PASS | Open Choices 5 件を AskUserQuestion で確定し全て解決。曖昧性ゼロ。 |
| IV. 双方向アンカー | PASS | Delta Spec への参照（`changes/.../specs/cli-distribution/spec.md`）と既存 spec（`specs/cli-distribution/spec.md`）の双方向リンクを Decisions / Codebase Findings で明示。 |
| V. 強制ステップと拡張ステップの分離 | PASS | research は拡張ステップだが minor モードで簡略化し、後続の design/tasks/implement の判断材料を提供する。強制ステップ（new/delta/archive）の前提を侵害しない。 |
