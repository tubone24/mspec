---
doc_type: Explanation
---

# Proposal: fix-locale-spec-language

## Why

`locale: ja` を設定してもスペックの Requirements が英語の EARS 形式（`The system SHALL <behavior>.`）で出力される。原因は（1）`mspec-delta` スキルの EARS パターン例示が英語のみ、（2）スキルがロケールを取得する手段がない（`mspec status --json` が locale を返さない）、（3）`readme.md`/`glossary.md` 等に `.ja.md` テンプレートが存在せず "missing template" 警告が発生する、の3点。

## Goals

- `locale: ja` 設定時に、Requirements が `このシステムは SHALL <振る舞い>.` 形式で生成される
- `mspec new` 実行時に "missing template" 警告が出なくなる
- 既存の `locale: en` / テンプレート未設定環境の動作が壊れない
- ロケール切り替えのユニットテストが追加・パスする

## Non-Goals

- `ja` 以外の言語（`zh-CN` 等）への対応（将来課題）
- 既存の SoT スペック（`specs/*/spec.md`）の書き直し
- question bank やその他設定ファイルの翻訳

## Capabilities (touched)

- language-config
- artifact-templates-i18n
- claude-integration

## Details

### 1. language-config — `mspec status --json` / `mspec continue --json` にロケール情報を追加

スキルは `mspec status --change <dir> --json` を最初に実行する（手順ステップ1）。ここに `"locale": "ja"` フィールドを追加することで、スキルが LLM へ渡すプロンプト内でロケールを参照できるようになる。

```json
{
  "change": "...",
  "locale": "ja",
  "current_step": "...",
  ...
}
```

### 2. artifact-templates-i18n — ロケール別テンプレートファイルの追加

`resolveTemplate` は `<artifact>.<locale>.md` → `<artifact>.en.md` → `<artifact>.md` の優先順で解決する。現状 `readme.md`・`glossary.md` 等に `.ja.md` / `.en.md` バリアントがなくレガシーにフォールバックしている。

追加対象ファイル（`packages/cli/templates/artifacts/`）：

| ファイル | 内容 |
|---------|------|
| `readme.ja.md` | 現行 `readme.md` のまま（日本語コメント保持） |
| `readme.en.md` | 英語コメントに書き直し |
| `glossary.ja.md` | 現行 `glossary.md` のまま |
| `glossary.en.md` | 英語コメントに書き直し |
| `proposal.ja.md` / `proposal.en.md` | ロケール別分割 |
| `design.ja.md` / `design.en.md` | ロケール別分割 |
| `tasks.ja.md` / `tasks.en.md` | ロケール別分割 |
| `research.ja.md` / `research.en.md` | ロケール別分割 |
| `checklist.ja.md` / `checklist.en.md` | ロケール別分割 |
| `quickstart.ja.md` / `quickstart.en.md` | ロケール別分割 |
| `architecture-overview.ja.md` / `architecture-overview.en.md` | ロケール別分割 |

### 3. claude-integration — スキルの EARS パターン例示をロケール対応に

`mspec-delta/SKILL.md` の EARS パターンセクションを以下のように変更：

```markdown
- EARS pattern guidance — ロケールに応じたフォーマットを使うこと:
  - locale=ja の場合:
    - Ubiquitous: `このシステムは SHALL <振る舞い>.`
    - Event-Driven: `<トリガー> のとき、このシステムは SHALL <振る舞い>.`
    ...
  - locale=en の場合:
    - Ubiquitous: `The system SHALL <response>.`
    - Event-Driven: `When <trigger>, the system SHALL <response>.`
    ...
```

同様に、EARS 表記を参照する他のスキル（`mspec-proposal`、`mspec-tasks` 等）も確認・修正する。

## Open Questions

- `proposal.md` / `tasks.md` 等の他テンプレートも一斉に `.ja.md`/`.en.md` 分割するか、それとも `readme`・`glossary` に限定して段階的にやるか？（ユーザーは「全テンプレート対応」を選択済み）
- `mspec status --json` への `locale` フィールド追加は後方互換か？（追加のみなので問題なし）

## Constitution Check

| 原則 | Phase 0 | Phase 1 |
|------|---------|---------|
| 後方互換性 | 既存 `en` 動作は変更なし ✓ | — |
| 単一責任 | 各 capability が独立して修正可能 ✓ | — |
| テスト可能性 | locale 切り替えの単体テスト追加予定 ✓ | — |
| 最小変更 | legacy テンプレートは保持、`.ja.md` を追加するのみ ✓ | — |
