---
doc_type: How-to
---

# Quickstart: 成果物の言語を `locale` 設定で統制する

## Prerequisites

- Node.js >= 18 がインストール済み
- 本リポジトリ（mspec）をクローン済みで、`packages/cli` のビルドが完了している（`pnpm -C packages/cli build` または `npm --workspace packages/cli run build`）
- 動作確認用の作業ディレクトリ（クリーンな git 状態を推奨）

## Setup

```bash
# 1. リポジトリルートで CLI をビルド
cd /Users/kagadminmac/project/mspec
node ./packages/cli/dist/index.js --version

# 2. 動作確認用に新しい mspec project を init する場合
mkdir -p /tmp/mspec-locale-demo && cd /tmp/mspec-locale-demo
node /Users/kagadminmac/project/mspec/packages/cli/dist/index.js init

# 3. 生成された .mspec/config.yaml にロケールを追記（既存フィールドを上書きしない）
#    トップレベルに locale: ja を追加（未指定でも既定 ja で動作）
printf '\nlocale: ja\n' >> .mspec/config.yaml
```

## Try it (Golden Path)

```bash
# 作業ディレクトリに移動（Setup で cd した場所）
cd /tmp/mspec-locale-demo
```


1. **新規 change を作成し、readme が日本語見出しで生成されることを確認**
   ```bash
   node /Users/kagadminmac/project/mspec/packages/cli/dist/index.js new sample-feature
   cat changes/*-sample-feature/readme.md
   ```

2. **質問バンクが日本語で返ることを確認**
   ```bash
   node /Users/kagadminmac/project/mspec/packages/cli/dist/index.js questions --phase proposal --json | head -30
   ```

3. **`locale: en` に切り替えて再度新規 change を作成し、英語見出しで生成されることを確認**
   ```bash
   sed -i.bak 's/^locale: ja$/locale: en/' .mspec/config.yaml
   node /Users/kagadminmac/project/mspec/packages/cli/dist/index.js new sample-en-feature
   cat changes/*-sample-en-feature/readme.md
   ```

4. **未対応 locale を指定して `mspec validate` がエラーを返すことを確認**
   ```bash
   sed -i.bak 's/^locale: en$/locale: xx/' .mspec/config.yaml
   LATEST_CHANGE=$(ls -1t changes | head -1)
   node /Users/kagadminmac/project/mspec/packages/cli/dist/index.js validate --change "$LATEST_CHANGE"
   # exit code != 0、stderr に "unsupported locale: xx" と "supported: ja, en" を含む出力
   # 注: mspec new / mspec questions など他コマンドは warning のみで処理継続する（exit 0）
   ```

5. **Delta Spec が EARS キーワード英語のまま日本語本文を許容することを確認**
   ```bash
   sed -i.bak 's/^locale: xx$/locale: ja/' .mspec/config.yaml
   LATEST_CHANGE=$(ls -1t changes | head -1)
   node /Users/kagadminmac/project/mspec/packages/cli/dist/index.js delta init --capability demo --change "$LATEST_CHANGE"
   cat "changes/$LATEST_CHANGE/specs/demo/spec.md"
   # → "Requirement: FR-001" / "Scenario:" / "SHALL" 等が英語、placeholder 部分は日本語
   ```

6. **(Optional) サードパーティ言語追加の拡張性を確認**
   ```bash
   mkdir -p .mspec/templates/artifacts
   cp /Users/kagadminmac/project/mspec/packages/cli/templates/artifacts/readme.en.md \
      .mspec/templates/artifacts/readme.zh.md
   # 日本語＝コードなしで zh が supported locale に自動認識されること
   sed -i.bak 's/^locale: ja$/locale: zh/' .mspec/config.yaml
   node /Users/kagadminmac/project/mspec/packages/cli/dist/index.js new sample-zh
   ```

## Verify

- **Expected output (Step 1 / 3)**: `# <タイムスタンプ>-sample-feature` の見出し以下、`## リクエスト` / `## 成果物` 等の日本語セクション見出し（ja 設定時）または `## Request` / `## Artifacts`（en 設定時）。
- **Expected output (Step 2)**: JSON 内の `question` 文字列と `options` 配列が日本語。
- **Expected output (Step 4)**: `mspec validate` の exit code が 0 以外、stderr に `unsupported locale: xx` と対応 locale 一覧（`supported: ja, en`）が出力される。
- **Expected output (Step 5)**: `specs/demo/spec.md` 内に `### Requirement: FR-001 — ...`、`#### Scenario: ...`、本文に `The system SHALL ...` 等の英語キーワード。placeholder（例: `<前提>`, `<操作>`, `<結果>`）は ja 設定なので日本語のまま。
- **Expected file changes**: 
  - `changes/<timestamp>-sample-feature/readme.md` が生成される
  - 翻訳欠落時は stderr に `missing template: <artifact> for locale '<code>', falling back to 'en'` が 1 回だけ出力される
- **Regression check**: 既存の英語のみで書かれた `specs/*/spec.md` （archive 済み SoT）は `locale: ja` 下でも `mspec validate` を通過する。

## Troubleshooting

| 症状 | 原因 | 対処 |
|------|------|------|
| `unsupported locale: <code>` で停止する | `templates/artifacts/*.<code>.md` と `templates/questions/*.<code>.yaml` の両方が未配置 | 両方のリソースを配置するか、`config.yaml` の `locale` を `ja` / `en` に戻す |
| 生成物が想定言語と違う（英語が混ざる） | 該当 artifact / question の locale 翻訳が欠落しフォールバック動作 | stderr の `missing template: ...` 警告で欠落箇所を特定し、`templates/artifacts/<name>.<locale>.md` を追加 |
| `## Constitution Check` 見出しが日本語化されない | 構造識別見出し（Constitution Check, Scenario, Requirement 等）は仕様上英語固定 | これは設計通りの挙動（D4 参照）。validate が依存しているため変更しないこと |
| 既存 `.mspec/config.yaml` を更新したのに反映されない | `locale` キーがネスト位置に書かれている（例: `project.locale`） | トップレベル直下に `locale: ja` を配置する（`project.language` とは別） |
| 質問バンクが英語のまま返る（ja 設定なのに） | 質問エントリが旧スカラ表記（`question: "..."`）のまま | スカラ表記は en 互換扱い。`question: { ja: "...", en: "..." }` 形式に書き換える |
| サードパーティ追加ロケールが認識されない | リソース置き場が `node_modules` 内部 | ユーザー project の `.mspec/templates/artifacts/` 配下に配置すること（パッケージ内直書き禁止） |
