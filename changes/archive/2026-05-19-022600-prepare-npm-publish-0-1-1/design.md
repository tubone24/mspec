---
doc_type: Reference
---

<!-- See also: ./design-rationale.md for採用理由・代替案 -->

# Design: prepare-npm-publish-0-1-1

## Summary

`@mspec/cli` の `packages/cli/package.json` を `0.1.0` → `0.1.1` に更新し、npm registry に publish 可能な状態に必要なメタデータ（`prepublishOnly`, `repository`, `homepage`, `bugs`, `keywords`, `author`）を補完する。併せて `packages/cli/README.md`（最小版）と `packages/cli/LICENSE`（root からコピー）を追加し、tarball の品質を整える。

## Goals

- `packages/cli/package.json` の `version` を `0.1.1` に更新する
- npm publish 時に必要な推奨メタデータを補完する（registry 検索性と npm bugs/repo コマンド対応）
- `packages/cli/README.md` と `packages/cli/LICENSE` を追加し tarball 同梱物を整える
- `prepublishOnly` script でローカル誤 publish を防ぐ
- 既存 FR-003 が要求する `--tag beta` 公開ポリシーを 0.1.1 でも維持する

## Non-Goals

- npm tag 戦略の変更（FR-003 で既に定義済み）
- CI/CD ワークフロー（`.github/workflows/publish.yml`）の変更
- 機能追加・バグ修正（本変更は publish 準備のみ）
- バージョンスキームの大幅変更（semver 0.x.y を維持）

## Technical Context

- Language / Runtime: Node.js >=18.0.0 (`engines.node` で指定済み), TypeScript 5.6 + ESM
- Dependencies (new): なし（既存 `tsup`, `vitest` で完結）
- Storage: なし（package.json + 静的ファイル変更のみ）
- Testing framework: Vitest（既存テストは影響なし）
- Target platform: npm registry (`@mspec/cli` scoped, `publishConfig.access: public`)
- Performance / Constraints: tarball サイズの不要な増大を避ける（`files` whitelist 維持）

## Constitution Check (Phase 0)

| Principle | Compliant? | Notes |
|-----------|-----------|-------|
| I. ステップ独立性 | ✅ | design.md は research.md の決定を構造化するのみ、他ステップへの逆流なし |
| II. 決定論的マージ | ✅ | Delta Spec FR-003 (MODIFIED) と整合、archive 時の機械マージで一意に決まる |
| III. 質問駆動の要件確定 | ✅ | research 段階で 5 件の Open Choices を全て確定済み |
| IV. 双方向アンカー | ✅ | design.md ↔ design-rationale.md, research.md, Delta Spec の相互リンクを記述 |
| V. 強制ステップと拡張ステップの分離 | ✅ | design は拡張ステップ、強制ステップ（new/delta/archive）に副作用なし |

## Project Structure (changes)

- 修正: `packages/cli/package.json`
  - `version`: `"0.1.0"` → `"0.1.1"`
  - `scripts.prepublishOnly`: `"npm run build"` を追加
  - `repository`: `{ "type": "git", "url": "git+https://github.com/tubone24/mspec.git", "directory": "packages/cli" }` を追加
  - `homepage`: `"https://github.com/tubone24/mspec#readme"` を追加
  - `bugs`: `{ "url": "https://github.com/tubone24/mspec/issues" }` を追加
  - `keywords`: `["spec-driven-development", "claude-code", "cli", "tdd", "mspec"]` を追加
  - `author`: `"tubone24"` を追加
- 新規: `packages/cli/README.md`
  - インストール手順（`npm install -g @mspec/cli@beta`）と root README へのリンクのみの最小版
- 新規: `packages/cli/LICENSE`
  - リポジトリ root の `<repo-root>/LICENSE`（MIT License）の内容を実体コピー（symlink 不可：npm pack が解決しない可能性）

## Decisions

各決定は研究で全て確定済み。受け入れ基準を Delta Spec FR-003 の Scenario と対応付ける。

| 決定 | 対応する FR-003 Scenario | 受け入れ基準 |
|------|----------------------|------------|
| version `0.1.1` 手動編集 | パッチバージョン更新の継続的公開 | `npm pack` 後の tarball 内 package.json で `"version": "0.1.1"` が確認できる |
| `prepublishOnly: "npm run build"` 追加 | beta tag でのインストール | `npm publish --dry-run` 時に `prepublishOnly` が `tsup` を実行し `dist/` を再生成する |
| `repository`/`homepage`/`bugs` 追加 | beta tag でのインストール | `npm view @mspec/cli@beta repository.url` で GitHub URL が返る |
| `keywords` 追加 | （registry 品質向上、Scenario 非関連） | `npm view @mspec/cli@beta keywords` で 5 件返る |
| `author` 追加 | （registry 品質向上、Scenario 非関連） | `npm view @mspec/cli@beta author` で `"tubone24"` が返る |
| `packages/cli/README.md` 追加 | beta tag でのインストール | `npm view @mspec/cli@beta` の出力にパッケージ README の冒頭が表示される |
| `packages/cli/LICENSE` 追加 | beta tag でのインストール | `npm pack` 後の tarball に `LICENSE` ファイルが含まれる |

## Constitution Check (Phase 1, 計画詳細後)

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | ✅ | Phase 1 でも design 内に閉じた構造変更、tasks 以降に依存ロジック注入なし |
| II. 決定論的マージ | ✅ | ✅ | Project Structure の変更は宣言的、archive 時の機械処理に矛盾なし |
| III. 質問駆動の要件確定 | ✅ | ✅ | 詳細化後も追加質問は不要（minor スコープ） |
| IV. 双方向アンカー | ✅ | ✅ | design.md ↔ design-rationale.md ↔ Delta Spec FR-003 リンク貫通 |
| V. 強制ステップと拡張ステップの分離 | ✅ | ✅ | implement で package.json 編集と新規ファイル追加のみ、強制ステップ侵害なし |

### Complexity Tracking

None

## Migration Plan / Rollout

1. `packages/cli/package.json` 編集（version + メタデータ）
2. `packages/cli/README.md` 新規作成
3. `packages/cli/LICENSE` を root からコピー
4. `npm run build` でビルド成果物を最新化
5. `npm pack --dry-run` で tarball 内容を検証（`dist/`, `templates/`, `package.json`, `README.md`, `LICENSE` のみが含まれること）
6. ユーザーがローカルで `git commit` → `git tag v0.1.1 && git push --tags` で CI workflow がトリガされ `npm publish --tag beta` が自動実行される
7. publish 後 `npm view @mspec/cli@beta` でメタデータ反映を確認

## Self-Review

### Findings (Pass)
- バージョン更新ターゲット整合: `packages/cli/package.json:3` `"0.1.0"` → research.md:11 / design.md:50 で `0.1.1` に統一済み
- `publish.yml:5-7,24-26` の `tags: v*` トリガと `npm publish --tag beta` が design.md:97 / architecture-overview.md:15-18 と整合
- Delta Spec FR-003 の一般化が妥当: `spec.md:9` で `1.0.0 未満（0.x.y …）` 表記となり、将来のパッチ更新でも SoT 修正不要
- スコープ規律: Non-Goals で `publish.yml` 変更を除外、Phase 0/1 Constitution Check が design.md / design-rationale.md / architecture-overview.md 三者で一致
- Mermaid System Diagram + Sequence Diagram の両方を architecture-overview.md に配置済み
- 双方向アンカー: readme.md:5-7 で Delta 出所をリンク、research.md Codebase Findings で全主張を絶対パス引用
- LICENSE 複製判断の根拠が明確（symlink を `npm pack` が解決しないリスク）
- `prepublishOnly` のトレードオフ（build のみ、test は CI 任せ）が明示
- メタデータ値が具体的に列挙（`repository.url`, `repository.directory: packages/cli`, `homepage`, `bugs.url`, `keywords` 5件, `author: tubone24`）

### Findings (Warnings)
- **W1 monorepo `prepublishOnly` 注意**: 本リポは monorepo（`packages/cli/...`）。`publish.yml:10-12` が `working-directory: packages/cli` を設定するため `npm run build` はローカル `tsup` に解決され安全。design-rationale.md に「`prepublishOnly` は `packages/cli/` スコープで実行、ワークスペース再帰なし」の一文追加を推奨。Action ではない。
- **W2 FR-003 Scenario "latest tag 汚染" 表現精度**: 初回 publish では `latest` 自体存在しないため Scenario THEN の「以前の `latest` バージョンがインストールされる」が成立しない（`npm install` がエラー）。`インストールが失敗するか…` への語句修正が望ましい。Minor。
- **W3 絶対パス問題（修正済み）**: design.md の `/Users/kagadminmac/...` を `<repo-root>/LICENSE` に書き換え済み
- **W4 tarball サイズチェック欠落**: README + LICENSE 追加で tarball がわずかに増える。`npm pack --dry-run` のサイズデルタ確認を checklist に追加するとよい。Nit。
- **W5 `mspec --version` 受け入れ基準**: design.md Decisions の version 更新行に「`mspec --version` で `0.1.1` が表示される」確認が欠ける（checklist.md:9 にはある）。トレーサビリティのため Decisions 表追加を推奨。
- **W6 SoT 事前確認**: archive 前に `specs/cli-distribution/spec.md` の FR-003 が想定通りの `0.1.0` 表記であるか確認すること。別チェンジで既に一般化済みなら merge が no-op か conflict になる。
- **W7 Principle IV のアンカー解釈**: 「アンカー必須対象が存在しない」と書いているが、`verify:` HTML コメントがアンカー役を果たしている。記載のニュアンス調整を検討。

### Findings (Action Required)
- なし。Action Required レベルのブロッカーは検出されず。

### Verdict
PASS_WITH_WARNINGS — Delta Spec の全 Scenario が design + checklist でカバーされ、FR-003 へのトレーサビリティが確立。メタデータ値は実装可能なレベルで具体化。`publish.yml` および現状の `package.json` を検証済み。警告事項は文書ポリッシュ・エッジケース注意（W3 は修正済み、W1/W4/W5/W6/W7 は本セクションに記録）。
