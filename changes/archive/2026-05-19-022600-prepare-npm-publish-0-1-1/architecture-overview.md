---
doc_type: Reference
---

# Architecture Overview: prepare-npm-publish-0-1-1

## System Diagram

```mermaid
graph LR
  Dev[Developer Local] -->|1. edit| PKG[packages/cli/package.json<br/>version 0.1.1 + metadata]
  Dev -->|2. add| README[packages/cli/README.md<br/>minimal]
  Dev -->|3. copy| LIC[packages/cli/LICENSE<br/>from root]
  Dev -->|4. build| DIST[packages/cli/dist/<br/>tsup output]
  Dev -->|5. git tag v0.1.1<br/>git push --tags| GH[GitHub Repo]
  GH -->|tags: v* trigger| CI[GitHub Actions<br/>publish.yml]
  CI -->|npm ci + build + test| BUILD[Built artifacts]
  CI -->|npm publish --tag beta<br/>NPM_TOKEN| NPM[npm registry<br/>&commat;mspec/cli&commat;0.1.1<br/>tag: beta]
  User[End User] -->|npm install -g<br/>&commat;mspec/cli&commat;beta| NPM
```

## Sequence

```mermaid
sequenceDiagram
  participant Dev as Developer
  participant Repo as Git Repo
  participant CI as GitHub Actions
  participant Registry as npm Registry
  participant User as End User

  Dev->>Dev: edit package.json (0.1.0 → 0.1.1)
  Dev->>Dev: add README.md / LICENSE
  Dev->>Repo: git commit + git tag v0.1.1
  Dev->>Repo: git push --tags
  Repo->>CI: tag push event (v*)
  CI->>CI: npm ci
  CI->>CI: npm run build (tsup → dist/)
  CI->>CI: npm test (vitest)
  CI->>Registry: npm publish --tag beta
  Note over Registry: tag 'beta' updated<br/>tag 'latest' unchanged
  User->>Registry: npm install -g @mspec/cli@beta
  Registry-->>User: tarball (dist + templates + README + LICENSE)
  User->>User: mspec --version → 0.1.1
```

## Data Model

該当なし（本変更は静的ファイル更新のみで永続データ構造の変更は無い）。

## UI Mockup

該当なし（CLI ツールの publish 準備のため UI 変更なし）。

## Constitution Check

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | ✅ | architecture-overview は静的な構造図のみで他ステップへの依存・逆流なし |
| II. 決定論的マージ | ✅ | ✅ | 図表のみで spec マージへの影響なし、archive 時の処理に矛盾を生じない |
| III. 質問駆動の要件確定 | ✅ | ✅ | design 段階で全要件確定済み、図表生成に追加質問不要 |
| IV. 双方向アンカー | ✅ | ✅ | System Diagram で design.md の Project Structure / Migration Plan を可視化、相互参照可能 |
| V. 強制ステップと拡張ステップの分離 | ✅ | ✅ | architecture-overview は拡張ステップ、強制ステップへの侵害なし |
