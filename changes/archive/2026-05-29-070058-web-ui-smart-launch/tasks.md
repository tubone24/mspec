---
doc_type: Reference
---

<!-- @mspec-delta 2026-05-29-070058-web-ui-smart-launch/specs/cli-core/spec.md -->
<!-- Requirements implemented: FR-007, FR-008 -->
<!-- Change: web-ui-smart-launch -->

<!-- @mspec-delta 2026-05-29-070058-web-ui-smart-launch/specs/web-ui-server/spec.md -->
<!-- Requirements implemented: FR-008, FR-009, FR-010, FR-011, FR-012, FR-013, FR-014 -->
<!-- Change: web-ui-smart-launch -->

# Tasks: web-ui-smart-launch

## Phase 1: Setup

- [ ] T001 新規 npm 依存なし確認・TypeScript コンパイルが通ることを事前確認する — files: `packages/cli/tsconfig.json`

## Phase 2: Foundational — PID ファイル / ポート解決 / ヘルスエンドポイント

### Tests-first (Unit / E2E)

- [x] T101 Unit test (Red) — `pidManager.ts` が `{pid, port, projectRoot, token}` を JSON で read/write することを検証する。旧フォーマット（`pid:port` テキスト）の読み込みが `null` を返すことも確認する — files: `packages/cli/src/server/__tests__/pidManager.test.ts`
      anchor:
        @mspec-delta 2026-05-29-070058-web-ui-smart-launch/specs/web-ui-server/spec.md
        Requirements implemented: FR-011 <!-- verify: human -->
        Change: web-ui-smart-launch

- [x] T102 Unit test (Red) — `isPortFree(port, '127.0.0.1')` が 127.0.0.1 バインドで確認すること、`resolvePortFromList([3847,3848,...])` が使用中ポートをスキップして空きポートを返すことを検証する — files: `packages/cli/src/server/__tests__/portResolver.test.ts`
      anchor:
        @mspec-delta 2026-05-29-070058-web-ui-smart-launch/specs/web-ui-server/spec.md
        Requirements implemented: FR-008 <!-- verify: fr-008 -->
        Change: web-ui-smart-launch

- [x] T103 Unit test (Red) — `GET /__mspec/health` が `{projectRoot, token, port, pid}` を返すこと、`--token` / `--project-root` 引数がサーバーに渡されることを検証する — files: `packages/cli/src/server/__tests__/server-process.test.ts`
      anchor:
        @mspec-delta 2026-05-29-070058-web-ui-smart-launch/specs/web-ui-server/spec.md
        Requirements implemented: FR-011 <!-- verify: human -->
        Change: web-ui-smart-launch

### Implementation

- [x] T110 `pidManager.ts` JSON 拡張 — `PidEntry` に `projectRoot: string` と `token: string` を追加し、`writePid` を `JSON.stringify`、`readPid` を `JSON.parse` に変更する。旧テキスト形式は `null` 返しで無害化する — files: `packages/cli/src/server/pidManager.ts`
      anchor:
        @mspec-delta 2026-05-29-070058-web-ui-smart-launch/specs/web-ui-server/spec.md
        Requirements implemented: FR-011 <!-- verify: human -->
        Change: web-ui-smart-launch

- [x] T111 `isPortFree` を `127.0.0.1` 明示バインドに修正し、`resolvePortFromList(candidates: number[])` を `portResolver.ts` に追加する。デフォルト候補リスト `[3847, 3848, 3849, 3850, 3851]` と `ui.port` 設定の優先ロジック（D-011）も実装する — files: `packages/cli/src/server/portResolver.ts`, `packages/cli/src/lib/prototype-server.ts`
      anchor:
        @mspec-delta 2026-05-29-070058-web-ui-smart-launch/specs/web-ui-server/spec.md
        Requirements implemented: FR-008 <!-- verify: fr-008 -->
        Change: web-ui-smart-launch

- [x] T112 `server-process.ts` に `GET /__mspec/health` Fastify ルートを追加する。`--token` と `--project-root` をコマンドライン引数として受け取り、`{projectRoot, token, port, pid}` を返す — files: `packages/cli/src/server/server-process.ts`
      anchor:
        @mspec-delta 2026-05-29-070058-web-ui-smart-launch/specs/web-ui-server/spec.md
        Requirements implemented: FR-011, FR-013 <!-- verify: human -->
        Change: web-ui-smart-launch

## Phase 3: User Story — 起動ロジック改善 / mspec open / URL 表示

### Tests-first (E2E)

- [x] T201 E2E test (Red) — `launchWebUiIfNeeded` が PID + HTTP ヘルスチェック二重確認で「起動済み」を判定すること（FR-009）、ステール PID（HTTP 失敗）時に自動クリーンアップして再起動すること（FR-010）を検証する — files: `packages/cli/src/server/__tests__/index.test.ts`
      anchor:
        @mspec-delta 2026-05-29-070058-web-ui-smart-launch/specs/web-ui-server/spec.md
        Requirements implemented: FR-009, FR-010 <!-- verify: fr-009 -->
        Change: web-ui-smart-launch

- [x] T202 E2E test (Red) — `spawn` に `shell: false` が明示されていること、ポート値が整数バリデーションを通過してから引数に渡されることを検証する — files: `packages/cli/src/server/__tests__/index.test.ts`
      anchor:
        @mspec-delta 2026-05-29-070058-web-ui-smart-launch/specs/web-ui-server/spec.md
        Requirements implemented: FR-014 <!-- verify: human -->
        Change: web-ui-smart-launch

- [x] T203 E2E test (Red) — `mspec open` コマンドが `launchWebUiIfNeeded` を呼び出し、ブラウザ open を実行することを検証する — files: `packages/cli/tests/e2e/open.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-29-070058-web-ui-smart-launch/specs/cli-core/spec.md
        Requirements implemented: FR-008 <!-- verify: fr-008 -->
        Change: web-ui-smart-launch

### Implementation

- [x] T210 `server/index.ts` の `launchWebUiIfNeeded` を改善する: (1) `crypto.randomUUID()` でトークン生成、(2) `readPid` → HTTP `/__mspec/health` 二重確認 → 一致で再利用 / 不一致で `deletePid` → 新規起動、(3) 戻り値を `{ url: string; reused: boolean }` に変更 — files: `packages/cli/src/server/index.ts`
      anchor:
        @mspec-delta 2026-05-29-070058-web-ui-smart-launch/specs/web-ui-server/spec.md
        Requirements implemented: FR-009, FR-010, FR-012 <!-- verify: fr-009 -->
        Change: web-ui-smart-launch

- [x] T211 `waitForPid` を `waitForHealth(port, token, projectRoot, timeoutMs)` に置換する。`/__mspec/health` に 200ms 間隔・5 秒タイムアウトで組み込み `fetch` を使用してポーリングする — files: `packages/cli/src/server/index.ts`
      anchor:
        @mspec-delta 2026-05-29-070058-web-ui-smart-launch/specs/web-ui-server/spec.md
        Requirements implemented: FR-012 <!-- verify: fr-012 -->
        Change: web-ui-smart-launch

- [x] T212 `spawn` 呼び出しに `shell: false` を明示追加し、ポート値を `Number.isInteger(portNum) && portNum >= 1024 && portNum <= 65535` で検証してから引数配列に渡す — files: `packages/cli/src/server/index.ts`
      anchor:
        @mspec-delta 2026-05-29-070058-web-ui-smart-launch/specs/web-ui-server/spec.md
        Requirements implemented: FR-014 <!-- verify: human -->
        Change: web-ui-smart-launch

- [x] T213 `packages/cli/src/commands/open.ts` を新規作成し、`launchWebUiIfNeeded` 呼び出し後に `open`/`xdg-open`/`start` でブラウザを開く実装を行う。`packages/cli/src/index.ts` に `.command('open')` を登録する — files: `packages/cli/src/commands/open.ts`, `packages/cli/src/index.ts`
      anchor:
        @mspec-delta 2026-05-29-070058-web-ui-smart-launch/specs/cli-core/spec.md
        Requirements implemented: FR-008 <!-- verify: fr-008 -->
        Change: web-ui-smart-launch

- [x] T214 URL 表示メッセージを `new.ts` と `open.ts` の呼び出し側に追加する: 新規起動時 `Web UI started at <url>`、再利用時 `Web UI already running at <url>` — files: `packages/cli/src/commands/new.ts`, `packages/cli/src/commands/open.ts`
      anchor:
        @mspec-delta 2026-05-29-070058-web-ui-smart-launch/specs/web-ui-server/spec.md
        Requirements implemented: FR-012
        Change: web-ui-smart-launch

## Phase 4: Polish — 確認 / 統合テスト

- [x] T301 D-009 確認: `packages/cli/src/commands/new.ts:114` に `launchWebUiIfNeeded` 呼び出しが存在することを確認する（コード変更なし）
      anchor:
        @mspec-delta 2026-05-29-070058-web-ui-smart-launch/specs/cli-core/spec.md
        Requirements implemented: FR-007 <!-- verify: fr-007 -->
        Change: web-ui-smart-launch

- [x] T302 D-010 確認: `packages/cli/src/server/server-process.ts` の `app.listen` に `host: '127.0.0.1'` が維持されていることを確認する（コード変更なし）<!-- verify: human -->
      anchor:
        @mspec-delta 2026-05-29-070058-web-ui-smart-launch/specs/web-ui-server/spec.md
        Requirements implemented: FR-013 <!-- verify: human -->
        Change: web-ui-smart-launch

- [x] T303 統合 E2E テスト — `mspec new` 実行後に Web UI が自動起動し URL が表示されること、同プロジェクトで再実行時に二重起動しないこと、別ポートへのフォールバックが動作することを端から端まで検証する — files: `packages/cli/tests/e2e/web-ui-smart-launch.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-29-070058-web-ui-smart-launch/specs/cli-core/spec.md
        Requirements implemented: FR-007, FR-008 <!-- verify: fr-007 -->
        Change: web-ui-smart-launch

- [x] T304 `npm run build && npm test` ですべてのテストが Green になることを確認する

## Constitution Check

> Step: tasks | Constitution Version: 1.1.0

| 原則 | Phase 0 | Notes |
|------|---------|-------|
| I. ステップ独立性 | ✅ | tasks.md のみ生成。実装はしない |
| II. 決定論的マージ | ✅ | 全タスクの実行順序と対象ファイルが一意に特定されている |
| III. 質問駆動の要件確定 | ✅ | research / self-review で全 Open Choices 確定済み |
| IV. 双方向アンカー | ✅ | 全実装・E2E タスクに `@mspec-delta` anchor ブロックを付与 |
| V. 強制ステップと拡張ステップの分離 | ✅ | `mspec open` 追加は workflow.yaml 変更なし |
| VI. Security by Default | ✅ | FR-011 / FR-013 / FR-014（`risk_tier: critical`）に `<!-- verify: human -->` を付与 |
| VII. 設計意図と実装の対応確認 | ✅ | D-001〜D-011 が T101〜T303 のタスクと対応 |

### Complexity Tracking

None
