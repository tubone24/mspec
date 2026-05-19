---
doc_type: Explanation
---

<!-- See also: ./design.md -->

# Design Rationale: prepare-npm-publish-0-1-1

## Context

`@mspec/cli` は npm registry に scoped package として配布される設計だが、v0.1.0 の package.json は publish のために必要十分なメタデータが揃っていなかった。`repository` / `homepage` / `bugs` / `keywords` / `author` が未設定で、`packages/cli/README.md` と `packages/cli/LICENSE` も存在しなかったため、`npm publish` を実行しても registry ページが空白かつライセンス表示が欠ける状態だった。

本変更は「機能追加なし、純粋な公開準備」というスコープに限定される minor モードの作業である。Delta Spec FR-003 で既に `0.x.y` を `--tag beta` で公開するポリシーが定義済みなので、本作業はその要件を 0.1.1 で再現可能にする補完作業として位置づけられる。

加えて、`.github/workflows/publish.yml` が `tags: v*` push トリガで `npm publish --tag beta` を自動実行する CI 設計が既に存在するため、本変更は「CI が成功するための前提条件を package.json 側で整える」ことが本質的な目的である。

## Decisions

### バージョン更新方法（手動編集）

`npm version patch` は自動で git tag を付与するが、本変更は package.json メタデータの大規模補完を含むため、コミット粒度を分けたい。`packages/cli/package.json` の `version` フィールドを手動で `0.1.0` → `0.1.1` に書き換え、その後ユーザーが任意のタイミングで `git tag v0.1.1 && git push --tags` する方が、CI トリガと変更履歴の対応関係が明確になる（design.md の Migration Plan 参照）。

### `prepublishOnly` script の追加

npm 公式は「publish 前に必ず実行すべきステップは `prepublishOnly` に置く」を推奨している（research.md の Web References 参照）。CI の `publish.yml` は既に `npm ci && npm run build && npm test && npm publish --tag beta` を実行するため、`prepublishOnly: "npm run build"` を追加することは CI 上では冪等な重複でしかないが、**ローカルから誤って `npm publish` を実行した場合の保険**として価値がある。テスト (`npm test`) は CI に任せ、ローカルの摩擦を最小化する目的でビルドのみに留めた。

### `packages/cli/README.md` と `packages/cli/LICENSE` の追加

npm は **パッケージディレクトリの README.md** を registry ページに表示する。`files` whitelist が `["dist", "templates"]` のため、root の `README.md` と `LICENSE` は tarball に含まれない。`packages/cli/README.md` を最小版（インストール手順 + root README へのリンク）で追加することで、registry ページが空白になるリスクを回避する。LICENSE についても同じ理由で `packages/cli/LICENSE` に実体コピーを配置する（design.md の Project Structure 参照）。

## Alternatives Considered

- **`npm version patch` 自動コマンド**: バージョン更新 + git tag 自動付与で1コマンド化できるが、メタデータ追加と同時実行できないためコミット粒度が悪化する。
- **`.npmignore` ベースの除外設定**: `files` whitelist の代替として `.npmignore` で除外指定する案。npm 公式が whitelist を推奨しているため不採用。意図しない秘密ファイルの混入リスクが高い。
- **`packages/cli/README.md` のフル版**: コマンド一覧・quickstart 例を含むフルドキュメントを追加する案。minor スコープを超えるため不採用。次の major リリース時に拡充予定。
- **LICENSE の symlink**: monorepo で root LICENSE への symlink を貼る案。`npm pack` が symlink を解決しないケースがあるため不採用（research.md Codebase Findings 参照）。
- **`prepublishOnly` にテストを含める**: `"npm run build && npm test"` とする案。ローカル publish 時の摩擦を増やし、CI で既にテストが回るため不採用。

## Trade-offs

- **手動編集 vs 自動化**: `npm version patch` を使わないため、将来のバージョン更新も手動編集が必要。代わりにコミット粒度と CI トリガの対応関係が明確。
- **README 最小版の採用**: registry ページが質素になる代わりに、minor スコープ厳守で変更レビューが容易。
- **LICENSE の実体コピー**: ファイル重複が発生（root と packages/cli/）するが、npm tarball で確実にライセンス情報が同梱される。今後 LICENSE 内容を変更する際は両方を同期する運用ルールが必要。
- **`prepublishOnly` でビルドのみ**: ローカル publish 前に test 実行されないが、CI が保証する。ローカル運用時のリスクは低い。

## Rejected Options

- **`npm version patch`**: バージョン更新と git tag が同時で、メタデータ追加コミットと分離しにくいため却下。
- **`.npmignore` 方式**: npm 公式が `files` whitelist を推奨しているため却下。
- **README フル版**: minor スコープ違反のため却下。
- **LICENSE の symlink**: `npm pack` の symlink 解決が処理系依存のため却下。
- **`prepublishOnly` にテスト含有**: ローカル摩擦を増やし、CI と重複するため却下。

## Constitution Check

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | ✅ | design-rationale は design.md の補足説明、他ステップへの逆流なし |
| II. 決定論的マージ | ✅ | ✅ | 文書のみで spec への直接書き込みなし、archive 時に影響しない |
| III. 質問駆動の要件確定 | ✅ | ✅ | research 段階で全 Open Choices を確定、追加質問なし |
| IV. 双方向アンカー | ✅ | ✅ | design.md / research.md / Delta Spec への明示リンクを保持 |
| V. 強制ステップと拡張ステップの分離 | ✅ | ✅ | design-rationale は拡張ステップ、強制ステップ侵害なし |
