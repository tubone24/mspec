---
doc_type: How-to
---

# Quickstart: Diátaxis Artifact Structure

このガイドでは、変更後の mspec を使って新しい change を作成し、Diátaxis doc_type フロントマター・自動生成 glossary.md・EARS 形式 SHALL スタブの動作を確認する手順を示す。

## Prerequisites

- Node.js ≥ 18
- `mspec` CLI がビルド済み（`node packages/cli/dist/index.js` で実行可能）
- mspec プロジェクト（`.mspec/` ディレクトリが存在する）

## Setup

```bash
# mspec CLI のビルド（未ビルドの場合）
cd packages/cli
npm run build
cd ../..

# エイリアスを設定しておくと便利
alias mspec="node $(pwd)/packages/cli/dist/index.js"
```

## Try it (Golden Path)

### 1. 新しい change を作成する

```bash
mspec new my-feature
```

**期待される出力:**
```
✓ Created 2026-05-14-HHMMSS-my-feature
  next: run /mspec-proposal
```

### 2. glossary.md が自動生成されたことを確認する

```bash
ls changes/2026-05-14-*-my-feature/
```

**期待される出力:**
```
glossary.md
readme.md
```

### 3. glossary.md の doc_type フロントマターを確認する

```bash
head -5 changes/2026-05-14-*-my-feature/glossary.md
```

**期待される出力:**
```yaml
---
doc_type: Reference
---
```

### 4. Delta Spec を生成して SHALL スタブを確認する

```bash
mspec delta init --capability my-cap --change 2026-05-14-*-my-feature
cat changes/2026-05-14-*-my-feature/specs/my-cap/spec.md
```

**期待される出力（ADDED スタブが SHALL）:**
```markdown
### Requirement: FR-001 — <Short Title>
The system SHALL <behavior>.
```

### 5. 既存の成果物テンプレートに doc_type が付いていることを確認する

```bash
head -4 packages/cli/templates/artifacts/proposal.md
```
```
---
doc_type: Explanation
---
```

```bash
head -4 packages/cli/templates/artifacts/research.md
```
```
---
doc_type: Reference
---
```

```bash
head -4 packages/cli/templates/artifacts/quickstart.md
```
```
---
doc_type: How-to
---
```

## Verify

- `changes/<name>/glossary.md` が `mspec new` 後に存在する
- `glossary.md` の冒頭に `doc_type: Reference` フロントマターがある
- `mspec delta init` 生成ファイルの ADDED スタブが `The system SHALL <behavior>.` になっている（`MUST` ではない）
- `packages/cli/templates/artifacts/` 配下の全テンプレートに `doc_type:` フロントマターが存在する
- `mspec validate` が変更後の change に対してパスする（Constitution Check ブロックおよび Mermaid フェンスの構造チェック。`doc_type` の機械バリデーションは行わない）

## Troubleshooting

| 症状 | 原因 | 対処 |
|------|------|------|
| `glossary.md` が生成されない | CLI が古いビルドを使用している | `npm run build` で再ビルドしてから実行する |
| ADDED スタブが `MUST` のまま | `delta-init.ts` の変更が反映されていない | CLI を再ビルドする |
| テンプレートに `doc_type` がない | テンプレートファイルの修正が未適用 | `packages/cli/templates/artifacts/` の各ファイルを確認する |
| `mspec validate` がフロントマターエラーを出す | （本変更では機械バリデーション非対象）| 現行バリデーターは doc_type を機械チェックしないため、このエラーは発生しない |
