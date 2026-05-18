---
doc_type: How-to
---

# Quickstart: revise-artifact-taxonomy

本 change で導入される新 5 doc_type 体系（Diátaxis 4 + `AI-Internal`）と design 2 ファイル化・archive Summary 追記を、手元で動作確認する手順。**本 change の implement / archive 完了後に実施**することを前提とする（bootstrap paradox 注: 本 change 自身は旧体系で進行している）。

## Prerequisites

- mspec リポジトリの clone と Node.js 環境（既存 README に従う）。
- 本 change（`changes/archive/2026-05-18-044538-revise-artifact-taxonomy/`）が archive 済みであること。
- `pnpm install` / `pnpm build` で CLI がビルドされていること。
- 適当な作業ブランチ（例: `quickstart-verify-taxonomy`）を切ってあること。

## Setup

```bash
# 1. リポジトリで CLI をビルド
pnpm install
pnpm --filter @mspec/cli build

# 2. ローカル CLI を PATH に通す（または npx 経由で実行）
export PATH="$PWD/packages/cli/bin:$PATH"

# 3. テンプレ更新が反映されていることを確認
mspec --version
ls packages/cli/templates/artifacts/ | grep -E '^(design-rationale|tasks|readme)\.'
# → design-rationale.{ja,en}.md, tasks.{ja,en}.md, readme.{ja,en}.md が表示される
```

## Try it (Golden Path)

新体系で 1 つ change を最後まで走らせ、各 doc_type と新動作を体感する手順。

1. **新 change を作成**
   ```bash
   mspec new try-new-taxonomy
   ```
   → `changes/<timestamp>-try-new-taxonomy/readme.md` が生成される。

2. **readme.md が Tutorial 型になっているか確認**
   ```bash
   head -5 changes/$(mspec status --json | jq -r '.change')/readme.md
   ```
   → frontmatter に `doc_type: Tutorial` が出ていること。
   ```bash
   tail -10 changes/$(mspec status --json | jq -r '.change')/readme.md
   ```
   → 末尾に `## Summary (Lessons / Next Steps)` セクションとプレースホルダコメントが出ていること。

3. **proposal → delta → research → design まで一気に進める**
   ```bash
   # それぞれ /mspec:continue 相当（Claude Code 経由 or 直接）
   mspec continue --change <id>
   # ... 各ステップを完走 ...
   ```

4. **design ステップ完了時に 2 ファイル揃うか確認**
   ```bash
   ls changes/<id>/
   ```
   → `design.md` (Reference) と `design-rationale.md` (Explanation) が **両方** 存在すること。`architecture-overview.md` も存在。

5. **tasks ステップを実行して `doc_type: AI-Internal` を確認**
   ```bash
   mspec continue --change <id>   # tasks ステップ
   head -5 changes/<id>/tasks.md
   ```
   → frontmatter に `doc_type: AI-Internal` が出ていること。

6. **implement → review → archive まで完走**
   ```bash
   # implement / review / archive を順次完走
   mspec continue --change <id>
   # ...
   ```

7. **archive 完了後に readme.md 末尾 Summary が埋まっているか確認**
   ```bash
   tail -30 changes/archive/<id>/readme.md
   ```
   → `## Summary (Lessons / Next Steps)` の下に `### Lessons`（3-5 bullet）と `### Next Steps`（2-4 bullet）が **AI 記述で埋められている** こと。プレースホルダコメント `<!-- archive ステップで AI が生成 -->` は削除されている。

## Verify

- **Expected output**:
  - 手順 1: `✓ Created <timestamp>-try-new-taxonomy / next: run /mspec:proposal`
  - 手順 2: `doc_type: Tutorial` と `## Summary (Lessons / Next Steps)` が確認できる。
  - 手順 4: `design.md`, `design-rationale.md`, `architecture-overview.md` の 3 ファイルが揃う。
  - 手順 5: `doc_type: AI-Internal`。
  - 手順 7: Summary 配下に Lessons / Next Steps の本文。

- **Expected file changes** (新 change を 1 本走らせた後):
  - `changes/archive/<id>/readme.md` — frontmatter `doc_type: Tutorial`、末尾に Summary 本文。
  - `changes/archive/<id>/design.md` — frontmatter `doc_type: Reference`、Decisions セクションを含まない。
  - `changes/archive/<id>/design-rationale.md` — frontmatter `doc_type: Explanation`、Decisions / Alternatives / Trade-offs を含む。
  - `changes/archive/<id>/tasks.md` — frontmatter `doc_type: AI-Internal`。
  - SoT spec (`specs/<capability>/spec.md`) に当該 change の Delta Spec が決定論的にマージ済み。

- **E2E テスト**:
  ```bash
  pnpm --filter @mspec/cli test:e2e -t "artifact-taxonomy-doc-type"
  pnpm --filter @mspec/cli test:e2e -t "template-doc-type-invariant"
  ```
  → どちらも green。

## Troubleshooting

| 症状 | 原因 | 対処 |
|------|------|------|
| `mspec new` で生成された readme.md の frontmatter が `doc_type: Reference` のまま | 本 change の implement 前、もしくは CLI が古いビルドのまま | `pnpm --filter @mspec/cli build` を再実行し PATH の `mspec` を確認 |
| design ステップが完了しても `design-rationale.md` が無い | `mspec-design` skill が旧版（本 change 適用前）のまま | `.claude/skills/mspec-design/SKILL.md` を本 change archive 後の最新に同期。Claude Code を再起動 |
| `mspec validate` が `doc_type: AI-Internal` を `unknown` で reject | E2E テストの `VALID_DOC_TYPES` 配列に `'AI-Internal'` が未追加（test 改修漏れ） | `packages/cli/tests/e2e/artifact-taxonomy-doc-type.e2e.test.ts` の `VALID_DOC_TYPES` 末尾に `'AI-Internal'` を追加して再 build |
| archive 完了後も readme.md 末尾が `<!-- archive ステップで AI が生成 -->` のまま | `mspec-archive` skill が step 3b（Summary 追記）をスキップしている | skill を Claude Code 経由で再実行（手動 archive リトライ）。`mspec validate --strict` で warning を error に昇格させて検知可能（research OC1/OC2） |
| 既存 `changes/archive/*` 配下で `mspec validate` が大量 warning を出す | 旧体系で archive された change が grandfather 対象（Decision 1） | warning は無視で OK。`--strict` を付けると error 化するため通常時は付けない |
| Mermaid 図が GitHub で描画されない | architecture-overview.md の Mermaid 構文エラー、または GitHub Mermaid renderer 制約 | ブラウザで mermaid live editor (https://mermaid.live) に貼って構文確認 |
