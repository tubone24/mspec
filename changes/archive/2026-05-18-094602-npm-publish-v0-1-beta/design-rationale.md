---
doc_type: Explanation
---

<!-- See also: ./design.md -->

# Design Rationale: npm-publish-v0-1-beta

## Context

`@mspec/cli` は mspec ワークフローの CLI 実装であり、現在はローカルの `npm link` によってのみ使用可能である。`npx @mspec/cli init` や `npm install -g @mspec/cli && mspec init` でどの環境からでも利用できるようにするためには、npm registry への公開と CI/CD パイプラインの整備が必要である。

0.1beta は「外部から動かせる最初のマイルストーン」と位置づける。API の安定性や機能の完全性よりも、「インストールして init が打てる」ことを最優先とした。このため、破壊的変更や大規模リファクタリングは Non-Goal として除外し、最小限の変更で動く状態を目指す。

スコープ付きパッケージ（`@mspec/cli`）は初回 publish 時に `publishConfig.access: "public"` がなければ 402 エラーになる。また `src/index.ts` のバージョンがハードコードされたままでは、version bump のたびに 2 箇所の同期が必要になるヒューマンエラーリスクがある。これらを今回のリリースで解消する。

## Decisions

### スコープ付きパッケージ名を維持する理由

`@mspec/cli` という名前は名前空間を明示し、将来の `@mspec/sdk`・`@mspec/vscode` などの関連パッケージとの一貫性を保つ。`npx @mspec/cli init` という呼び出し形式は、単一 `bin` エントリ（`"mspec"`）がある場合、npm exec が自動的にバイナリ名でマッチングするため、スコープなしパッケージと同等の UX を実現できる。

unscoped 名 `mspec` を追加 publish するオプションも検討したが、npm の名前空間を消費するリスク、二重メンテコスト、0.1beta という実験段階の性質を考慮して除外した。

### --tag beta で latest を汚染しない理由

semver では `0.1.0` のようなプレリリース識別子付きバージョンは `npm publish` 実行時に `latest` タグが更新されない仕様だが、npm CLI の実装には `latest` を上書きするバグ報告が存在する。`--tag beta` を明示することで意図を確実に伝え、`npm install @mspec/cli`（tag 指定なし）でベータが降ってこないことを保証する。

### バージョンを package.json から動的参照する理由

`src/index.ts` に `program.version('0.1.0-alpha.1')` をハードコードすると、`npm version` コマンドや version bump スクリプトを実行しても CLI の `--version` 出力が更新されない。動的参照にすることで「package.json が唯一の真実」となり、CI での version bump → publish フローを自動化できる。

ESM 環境での `package.json` の import には `createRequire(import.meta.url)` を使用する。`import ... assert { type: 'json' }` は Node 22+ での仕様変更（`with { type: 'json' }` に移行）があり、Node 18 との互換性を保つには `createRequire` が安全である。

### CI/CD に git tag + GitHub Release の両方を使う理由

FR-001（tag push）と FR-003（GitHub Release）は実運用上で使い分けが必要になるユースケースが異なる。tag push は CLI から高速にリリースしたいケース、GitHub Release は CHANGELOG やリリースノートを伴う正式公開フローに適している。両方のトリガーを同一 job で処理することで DRY を保ちつつ、どちらのフローでも同一の publish 処理が走ることを保証する。

`on: release: types: [released]` を選んだのは、`published` だとドラフトをそのまま公開した際にも発火するため誤 publish リスクがあるからである。`released` は Draft → Publish の 2 段階フローを強制し、意図せぬリリースを防ぐ。

## Alternatives Considered

- **OIDC Trusted Publishing (`--provenance`)**: `NPM_TOKEN` シークレット不要でセキュリティが向上するが、npm registry 側の設定が必要で初期コストが高い。0.1beta では Automation Token + GitHub Secret で十分。
- **`import ... assert { type: 'json' }` によるバージョン参照**: Node 22 で `with` 構文に移行済みで Node 18 では experimental。`createRequire` の方が安定。
- **Node.js matrix (18 / 20 / 22)**: `engines: ">=18.0.0"` を謳うなら 18 での smoke test は有用だが、CI 時間増加とのトレードオフで 0.1beta では 20 LTS のみとした。

## Trade-offs

- `--tag beta` 運用は `npm install @mspec/cli@beta` の明示が必要で、インストールの簡便さが若干下がる。これは 0.1beta という不安定な段階では意図したトレードオフである。
- `createRequire` は ESM のベストプラクティスから少し外れるが、Node 18-22 の全バージョンで動作することを優先した。

## Rejected Options

- **unscoped `mspec` 追加 publish**: 名前スカッティングリスク・二重メンテコストで却下。`@mspec/cli` の単一 `bin` エントリで同等 UX が得られる。
- **手動 version bump（2 箇所）**: ヒューマンエラーリスクが高く、自動化フローと相性が悪いため却下。
- **`on: release: types: [published]`**: ドラフト公開で誤トリガーするリスクがあるため `released` に変更。

## Constitution Check

| Principle | Phase 0 | Phase 1 |
|-----------|---------|---------|
| I. ステップ独立性 | ✅ design-rationale のみ生成 | ✅ proposal/research の内容を参照するが独立したファイル |
| II. 決定論的マージ | ✅ 新規ファイルのみ | ✅ 既存ファイルとの競合なし |
| III. 質問駆動の要件確定 | ✅ research の Open Choices 解決済み | ✅ 追加の判断なし |
| IV. 双方向アンカー | ✅ design.md と相互参照コメントあり | ✅ `See also: ./design.md` で双方向参照 |
| V. 強制ステップと拡張ステップの分離 | ✅ 強制ステップのみ | ✅ Explanation として適切に分離 |
