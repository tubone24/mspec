---
doc_type: Reference
---

<!-- See also: ./design-rationale.md for採用理由・代替案 -->

# Design: web-ui-smart-launch

## Summary

このドキュメントは `web-ui-smart-launch` チェンジの技術設計を記述します。読者は実装エンジニアおよびレビュアーを想定しています。採用理由・代替案は `design-rationale.md` を参照してください。

`mspec new` / `mspec open` 実行時に Web UI を自動起動するスマートランチャーを設計します。ポート固定リスト選択・PID＋HTTP 二重確認による起動済み判定・ステール PID 自動回復・ヘルスエンドポイントでのプロジェクト同一性検証・exec 直接 spawn を実装します。

## Goals

- `mspec new` / `mspec open` 実行後に Web UI が自動的に起動する（または再利用される）
- ポート衝突が自動回避される
- 同プロジェクトの二重起動が防止される
- 起動完了時に URL が CLI に表示される

## Non-Goals

- Web UI 画面の新機能追加
- リモートアクセス対応
- 複数プロジェクトの一元管理
- `mspec new` / `mspec open` 以外のコマンドでの自動起動

## Technical Context

| 項目 | 値 |
|------|-----|
| Language / Runtime | TypeScript / Node.js >= 18.0.0 |
| Web フレームワーク | Fastify（既存） |
| プロセス管理 | Node.js `child_process.spawn` |
| HTTP クライアント | 組み込み `fetch` + `AbortController`（Node.js 18+） |
| ポートプローブ | `net.createServer` (127.0.0.1 明示バインド) |
| 暗号 | `crypto.randomUUID()`（Node.js 14.17+ 組み込み） |
| Storage | `.mspec/ui.pid`（JSON 形式に拡張） |
| 新規 npm 依存 | なし |

## Constitution Check (Phase 0)

| 原則 | 準拠 | Notes |
|------|------|-------|
| I. ステップ独立性 | ✅ | 設計は proposal / research のみを参照 |
| II. 決定論的マージ | ✅ | PID ファイル形式変更は既存 FR に干渉しない拡張 |
| III. 質問駆動の要件確定 | ✅ | Open Choices はすべて research ステップで確定済み |
| IV. 双方向アンカー | ✅ | 全変更ファイルに @mspec-delta アンカーを付与する |
| V. 強制ステップと拡張ステップの分離 | ✅ | `mspec open` 追加は CLI 拡張のみ |
| VI. Security by Default | ✅ | shell:false 明示・127.0.0.1 バインド・トークン照合を設計に組み込み済み |
| VII. 設計意図と実装の対応確認 | ✅ | Decisions テーブルが Delta Spec Scenario と 1:1 対応 |

## Project Structure

### 新規作成

| ファイル | 役割 |
|---------|------|
| `packages/cli/src/commands/open.ts` | `mspec open` コマンド（Web UI 起動 + ブラウザ open） |

### 修正

| ファイル | 変更内容 |
|---------|---------|
| `packages/cli/src/server/index.ts` | 起動済み判定改善・URL 戻り値追加・トークン生成・shell:false 明示 |
| `packages/cli/src/server/pidManager.ts` | `PidEntry` に `projectRoot: string`, `token: string` 追加・JSON 形式化 |
| `packages/cli/src/server/portResolver.ts` | `resolvePortFromList(candidates)` 追加 |
| `packages/cli/src/server/server-process.ts` | `/__mspec/health` Fastify ルート追加・`--token` / `--project-root` 引数受け取り |
| `packages/cli/src/lib/prototype-server.ts` | `isPortFree` を `127.0.0.1` 明示バインドに修正 |
| `packages/cli/src/index.ts` | `open` コマンド登録 |

## Decisions

### D-001: ポート固定リスト選択

`portResolver.ts` に `resolvePortFromList(candidates: number[]): Promise<number>` を追加する。各候補に対して `isPortFree(port, '127.0.0.1')` を順次呼び出し、最初に空きが見つかったポートを返す。

デフォルト候補リスト: `[3847, 3848, 3849, 3850, 3851]`

**受け入れ基準（FR-008 Scenario 対応）:**
- GIVEN ポート 3847 が他プロセスによって使用中である
- WHEN `resolvePortFromList([3847, 3848, ...])` が呼び出される
- THEN 3848 を返し、3848 で Web UI が起動する

### D-002: PID ファイルの JSON 拡張

`pidManager.ts` の `PidEntry` 型を拡張する。

```typescript
// Before
type PidEntry = { pid: number; port: number }

// After
type PidEntry = {
  pid: number;
  port: number;
  projectRoot: string;
  token: string;
}
```

`writePid` は JSON.stringify で書き込み、`readPid` は JSON.parse で読み込む。ファイルパス `.mspec/ui.pid` は変更しない。

**受け入れ基準（FR-011 Scenario 対応）:**
- GIVEN `/__mspec/health` が `{projectRoot, token}` を返す
- WHEN PID ファイルの値と照合する
- THEN 一致時のみ起動済みと判定して既存 URL を再利用する

### D-003: 起動済み判定の PID + HTTP 二重確認

`launchWebUiIfNeeded` の起動済み判定を以下に変更する:

1. `readPid()` で PID ファイルを読む
2. PID ファイルが存在しなければ新規起動
3. 存在する場合は `fetch(/__mspec/health)` を実行（タイムアウト 1 秒）
4. HTTP 成功 → `projectRoot` と `token` を PID ファイルの値と照合
5. 一致 → 再利用。URL を表示して終了
6. 不一致または HTTP 失敗 → `deletePid()` してステール回復フローへ

**受け入れ基準（FR-009/FR-010 Scenario 対応）:**
- GIVEN `.mspec/ui.pid` が存在し HTTP ヘルスチェックが成功する
- WHEN プロジェクト ID とトークンが一致する
- THEN 新規起動せず既存の URL を表示する

### D-004: HTTP ヘルスポーリングによる起動完了待機

既存 `waitForPid`（PID ファイルポーリング）を廃止し、`/__mspec/health` が 200 を返すまでポーリングする関数 `waitForHealth(port, token, projectRoot, timeoutMs = 5000)` に置換する。

ポーリング間隔: 200ms、タイムアウト: 5000ms

**受け入れ基準（FR-012 Scenario 対応）:**
- GIVEN Web UI が新規起動する
- WHEN `waitForHealth` が完了する
- THEN URL が CLI に表示される

### D-005: `/__mspec/health` エンドポイント

`server-process.ts` に Fastify ルートを追加する。

```typescript
// GET /__mspec/health
app.get('/__mspec/health', async () => ({
  projectRoot: options.projectRoot,
  token: options.token,
  port: options.port,
  pid: process.pid,
}))
```

サーバー起動引数に `--token <uuid>` と `--project-root <path>` を追加する。

**受け入れ基準（FR-011 Scenario 対応）:**
- GIVEN `/__mspec/health` にアクセスする
- WHEN レスポンスを確認する
- THEN `{projectRoot, token, port, pid}` が返る

### D-006: `shell: false` 明示とポート整数バリデーション

`server/index.ts` の spawn 呼び出しを修正する。

```typescript
// Before
spawn(process.execPath, [...args], { detached: true, stdio: 'ignore' })

// After
const portNum = Number(port);
if (!Number.isInteger(portNum) || portNum < 1024 || portNum > 65535) {
  throw new Error(`Invalid port: ${port}`);
}
spawn(process.execPath, [...args, '--port', String(portNum)], {
  detached: true,
  stdio: 'ignore',
  shell: false,
})
```

**受け入れ基準（FR-014 Scenario 対応）:**
- GIVEN ポート候補として 3848 が選択される
- WHEN プロセス spawn が実行される
- THEN `shell: false` が明示された引数配列形式で起動される

### D-007: `mspec open` コマンド新設

`packages/cli/src/commands/open.ts` を新規作成する。

```typescript
// open.ts の擬似コード
export async function openCommand(opts: { root: string }) {
  const result = await launchWebUiIfNeeded(opts.root, configFile);
  await openBrowser(result.url);  // platform に応じた open/xdg-open/start
  console.log(`Web UI opened at ${result.url}`);
}
```

`index.ts` に `.command('open')` として登録する。

**受け入れ基準（FR-008 cli-core Scenario 対応）:**
- GIVEN ユーザーが `mspec open` を実行する
- WHEN コマンドが処理される
- THEN Web UI が起動（または再利用）され、ブラウザが自動で開く

### D-008: 起動 URL の CLI 表示

`launchWebUiIfNeeded` の戻り値を `{ url: string; reused: boolean }` に変更し、呼び出し側が URL を表示する。

- 新規起動: `Web UI started at http://localhost:<port>`
- 再利用: `Web UI already running at http://localhost:<port>`

**受け入れ基準（FR-012 Scenario 対応）:**
- GIVEN Web UI が起動完了する
- WHEN CLI の標準出力を確認する
- THEN URL が表示されている

### D-009: `mspec new` post-hook による Web UI 起動トリガー

`packages/cli/src/commands/new.ts:114` に既存の `launchWebUiIfNeeded(cwd, paths.configFile).catch(() => {})` 呼び出しが存在する。本チェンジはこの hook が残ることを前提とし、`launchWebUiIfNeeded` の内部実装を改善する（D-001〜D-008）ことで FR-007 を満たす。hook 自体の追加は不要。

**受け入れ基準（cli-core FR-007 Scenario 対応）:**
- GIVEN `mspec new <feature>` が正常にチェンジディレクトリを作成した後
- WHEN `new.ts` の post-hook が実行される
- THEN `launchWebUiIfNeeded` が呼び出されてスマート起動ロジックが動作する

### D-010: Fastify サーバーの 127.0.0.1 強制バインド（確認）

`packages/cli/src/server/server-process.ts:43-44` の `app.listen({ port, host: '127.0.0.1' })` は FR-013 を既に満たしている。本チェンジでは変更不要。`--port` 引数の追加（D-006）と `--token`/`--project-root` 引数の追加（D-005）においても `host` フィールドを変更しないことを明示する。

**受け入れ基準（web-ui-server FR-013 Scenario 対応）:**
- GIVEN Web UI 新規起動フローが実行される
- WHEN サーバープロセスが起動する
- THEN リッスンアドレスは `127.0.0.1:<port>` であり外部ネットワークからはアクセス不可である

### D-011: `ui.port` 設定とポートリスト選択の優先順位

`~/.mspecrc` の `ui.port` 設定が存在する場合、その値をポートリストの先頭（インデックス 0）として使用する。`resolvePortFromList` の呼び出し前に config 読み込みを行い、`[configPort, 3847, 3848, 3849, 3850, 3851].filter((v, i, a) => a.indexOf(v) === i)` のように重複を除去したリストを渡す。設定がない場合はデフォルトリスト `[3847, 3848, 3849, 3850, 3851]` を使用する。

**受け入れ基準（web-ui-server FR-004 リグレッション防止）:**
- GIVEN `~/.mspecrc` に `ui.port: 4000` が設定されている
- WHEN Web UI スマート起動ロジックが実行される
- THEN 4000 が最初に試行され、使用中の場合は 3847 以降にフォールバックする

## Migration Plan

- `.mspec/ui.pid` のフォーマットが変わるため、旧フォーマット（`pid:port` プレーンテキスト）のファイルが存在する場合は `readPid` でパース失敗 → `null` 扱いで自動再起動する（後方互換不要）

## Constitution Check (Phase 1)

| 原則 | Phase 0 | Phase 1 | Notes |
|------|---------|---------|-------|
| I. ステップ独立性 | ✅ | ✅ | 各 Decision が独立して実装・テスト可能 |
| II. 決定論的マージ | ✅ | ✅ | PID 形式変更・ヘルスエンドポイント追加は既存 FR と干渉しない |
| III. 質問駆動の要件確定 | ✅ | ✅ | 全 Open Choices が research で確定済み。Design ステップで追加質問なし |
| IV. 双方向アンカー | ✅ | ✅ | 全変更ファイルに @mspec-delta アンカーを付与する（tasks.md で確認） |
| V. 強制ステップと拡張ステップの分離 | ✅ | ✅ | `mspec open` 新設は workflow.yaml に変更なし |
| VI. Security by Default | ✅ | ✅ | D-005（ヘルス照合）・D-006（shell:false）・D-002（トークン）が設計に内包 |
| VII. 設計意図と実装の対応確認 | ✅ | ✅ | D-001〜D-011 が FR-007〜FR-014 と 1:1 対応（self-review 指摘を受け D-009〜D-011 を追加） |

### Complexity Tracking

None

## Self-Review

> Reviewer: mspec-self-reviewer | Date: 2026-05-29

### Findings

| # | Severity | Area | Finding | Resolved? |
|---|---------|------|---------|-----------|
| 1 | [warn] | design.md — FR coverage | cli-core FR-007（`mspec new` 起動トリガー）に対応する Decision が存在しなかった | Yes — D-009 を追加 |
| 2 | [warn] | design.md — FR coverage | web-ui-server FR-013（127.0.0.1 強制バインド, `risk_tier: critical`）に対応する Decision が存在しなかった | Yes — D-010 を追加 |
| 3 | [warn] | design.md — `ui.port` 優先度 | `~/.mspecrc` の `ui.port` 設定とポートリスト選択の優先順位が未定義だった | Yes — D-011 を追加 |
| 4 | [info] | quickstart.md — Troubleshooting | ステール PID のトラブルシューティング記述が設計と矛盾していた（自動回復するのに手動削除を案内） | Yes — 記述を修正 |
| 5 | [info] | quickstart.md — Prerequisites | Verify セクションで使用する `jq` が Prerequisites に記載されていなかった | Yes — `jq` の注記を追加 |
| 6 | [info] | design-rationale.md — Constitution | Phase 0 Constitution Check セクションが欠落していた | Yes — Phase 0 テーブルを追加 |
| 7 | [info] | design.md — D-007 label | D-007 の受け入れ基準ラベルが「FR-008 cli-core」で FR-007 との対応が不明瞭だった | Yes — D-009 追加で FR-007 の明示的カバレッジが確立 |

### Summary

重大なブロッカーなし。self-review 指摘を受けて D-009〜D-011 を追加し、cli-core FR-007 / web-ui-server FR-013 / `ui.port` 優先順位のカバレッジが確立した。quickstart.md と design-rationale.md の軽微な不備も解消済み。
