---
doc_type: AI-Internal
---

# Tasks: prepare-npm-publish-0-1-1

## Phase 1: Setup
- [x] T001 [P] 現状確認: `packages/cli/package.json` が version 0.1.0 のまま、`packages/cli/README.md` と `packages/cli/LICENSE` が未存在であることを確認 — files: `packages/cli/package.json`, `packages/cli/`

## Phase 2: Foundational
- [x] T010 リポジトリ root の `LICENSE` を `packages/cli/LICENSE` に実体コピー — files: `LICENSE`, `packages/cli/LICENSE`
      anchor:
        @mspec-delta 2026-05-19-022600-prepare-npm-publish-0-1-1/specs/cli-distribution/spec.md
        Requirements implemented: FR-003
        Change: prepare-npm-publish-0-1-1
- [x] T011 `packages/cli/README.md` を最小版（インストール手順 + root README へのリンク）で新規作成 — files: `packages/cli/README.md`
      anchor:
        @mspec-delta 2026-05-19-022600-prepare-npm-publish-0-1-1/specs/cli-distribution/spec.md
        Requirements implemented: FR-003
        Change: prepare-npm-publish-0-1-1

## Phase 3: User Story 1 (P1) — npm publish 0.1.1 可能化

### Tests-first (E2E)
- [x] T101 E2E for FR-003 "beta tag でのインストール": `npm pack --dry-run` を実行し、tarball 内に `dist/`, `templates/`, `package.json`, `README.md`, `LICENSE` のみが含まれ、`src/`/`node_modules/`/`.claude/` が含まれないことを確認する — files: `packages/cli/`
      anchor:
        @mspec-delta 2026-05-19-022600-prepare-npm-publish-0-1-1/specs/cli-distribution/spec.md
        Requirements implemented: FR-003
        Change: prepare-npm-publish-0-1-1
- [x] T102 E2E for FR-003 "latest tag が汚染されない": `npm view @mspec/cli dist-tags`（公開後）で `latest` タグが新バージョンに更新されず、`beta` タグのみが `0.1.1` を指すことを確認する。初回 publish では `latest` 自体存在しないことを許容する — files: `packages/cli/`
      anchor:
        @mspec-delta 2026-05-19-022600-prepare-npm-publish-0-1-1/specs/cli-distribution/spec.md
        Requirements implemented: FR-003
        Change: prepare-npm-publish-0-1-1
- [x] T103 E2E for FR-003 "パッチバージョン更新の継続的公開": `git tag v0.1.1 && git push --tags` で `.github/workflows/publish.yml` が起動し `npm publish --tag beta` 経由で `0.1.1` が beta タグに追加されることを CI ログで確認する — files: `.github/workflows/publish.yml`
      anchor:
        @mspec-delta 2026-05-19-022600-prepare-npm-publish-0-1-1/specs/cli-distribution/spec.md
        Requirements implemented: FR-003
        Change: prepare-npm-publish-0-1-1

### Implementation
- [x] T110 `packages/cli/package.json` の `version` を `0.1.0` → `0.1.1` に更新する — files: `packages/cli/package.json`
      anchor:
        @mspec-delta 2026-05-19-022600-prepare-npm-publish-0-1-1/specs/cli-distribution/spec.md
        Requirements implemented: FR-003
        Change: prepare-npm-publish-0-1-1
- [x] T111 `packages/cli/package.json` の `scripts` に `"prepublishOnly": "npm run build"` を追加する — files: `packages/cli/package.json`
      anchor:
        @mspec-delta 2026-05-19-022600-prepare-npm-publish-0-1-1/specs/cli-distribution/spec.md
        Requirements implemented: FR-003
        Change: prepare-npm-publish-0-1-1
- [x] T112 `packages/cli/package.json` に publish メタデータ（`repository` / `homepage` / `bugs` / `keywords` / `author`）を追加する。各値は design.md Project Structure に従う — files: `packages/cli/package.json`
      anchor:
        @mspec-delta 2026-05-19-022600-prepare-npm-publish-0-1-1/specs/cli-distribution/spec.md
        Requirements implemented: FR-003
        Change: prepare-npm-publish-0-1-1

## Phase 4: Polish
- [x] T201 `cd packages/cli && npm run build` でビルドを実行し `dist/index.js` の shebang と実行ビットが維持されていることを確認する — files: `packages/cli/dist/`
- [x] T202 `cd packages/cli && npm pack --dry-run` で tarball 内容のサイズと同梱物（dist/templates/package.json/README/LICENSE）を最終確認する — files: `packages/cli/`
- [x] T203 SoT 反映前確認: `specs/cli-distribution/spec.md` の FR-003 が `0.1.0` 固定表記のままであり、archive 時に Delta の MODIFIED で機械置換されることを目視確認する — files: `specs/cli-distribution/spec.md`

## Dependencies
- T001 blocks T010, T011, T110, T111, T112
- T010 blocks T101, T102, T103
- T011 blocks T101, T102, T103
- T110 blocks T101, T102, T103
- T111 blocks T101, T102, T103
- T112 blocks T101, T102, T103
- T101, T102, T103 block T201, T202
- T201 blocks T202
- T203 は archive 前確認のため Phase 4 末尾で独立実行

## Constitution Check

> Step: tasks | Constitution Version: 1

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | — | tasks は design/checklist の入力のみ参照、他ステップ逆流なし |
| II. 決定論的マージ | ✅ | — | T110-T112 の package.json 変更は宣言的、T203 で SoT 事前確認 |
| III. 質問駆動の要件確定 | ✅ | — | research 段階で全 Open Choices 確定済み、追加質問不要 |
| IV. 双方向アンカー | ✅ | — | 全実装/E2E タスクに `@mspec-delta` アンカー 3 行を付与 |
| V. 強制ステップと拡張ステップの分離 | ✅ | — | 強制ステップ（new/delta/archive）への副作用なし |

### Complexity Tracking

None
