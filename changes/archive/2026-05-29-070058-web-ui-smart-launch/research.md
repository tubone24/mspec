---
doc_type: Reference
---

# Research: web-ui-smart-launch

## Decisions

| 論点 | 採用案 | 代替案 | 根拠 |
|------|--------|--------|------|
| ポート空き確認の実装 | `net.createServer` プローブを `127.0.0.1` に明示バインドして再利用（`prototype-server.ts` の `isPortFree` パターン） | `detect-port` / `portfinder` npm 依存追加 | `isPortFree` が既存 (`prototype-server.ts:57-66`) で同一ロジック。外部依存不要。プローブを `127.0.0.1` 限定にすることで Vite 既知問題（localhost vs 0.0.0.0 差分誤検知）を回避する |
| 「起動済み」判定の方法 | PID ファイル確認 + HTTP GET `/__mspec/health` 両方が成功した場合のみ再利用 | `isAlive(pid)` シグナルのみ（現行） | 現行の `isAlive` 判定だけではゾンビ・PID 再利用・他プロジェクトによる同ポート先取りを検出できない（FR-009, FR-011） |
| プロジェクト同一性検証トークン生成 | ランチャー側で `crypto.randomUUID()` 生成し CLI 引数で spawn に渡す | サーバー側で生成して PID ファイルに書き戻す | ランチャーがトークンを知っていれば health 応答と即座に照合可能。サーバー生成は PID ファイル書き込みを待つポーリングが必要になり遅延が生じる |
| PID ファイルフォーマット拡張 | JSON 形式 `{pid, port, projectRoot, token}` | 現行の `pid:port` プレーンテキスト継続 | FR-011 でトークン・projectRoot を PID ファイルへ記録する必要がある。JSON は既存 `readPid`/`writePid` の変更で対応可 |
| `shell` オプションの明示 | `spawn(..., { shell: false, detached: true, stdio: 'ignore' })` と明示 | デフォルト（暗黙的 false）のまま | FR-014 は MUST 指定。CVE-2024-27980 の教訓から、明示的に `shell: false` を記述することがセキュリティ審査で推奨される |
| ヘルスチェック HTTP クライアント | Node.js 組み込み `fetch` + `AbortController` でタイムアウト制御 | `axios` / `node-fetch` 追加 | `package.json` の engines が `node >= 18.0.0` のため組み込み `fetch` が使用可。外部依存不要 |
| `mspec open` コマンドの存在 | **新規作成が必要（現時点で未実装）** | — | `index.ts` に `open` コマンド登録なし、`open.ts` ファイルも存在しない。FR-008 の前提として新規作成が確定 |

## Web References

- **net.createServer ポートプローブ** — `net.createServer()` に `error`（EADDRINUSE）と `listening` イベントを張るパターンがポート空き確認の最小実装。外部依存ゼロ
- **detect-port npm** — Node.js 向けポート検出ライブラリ、最新 v2.1.0。内部は `net.createServer` と同等だが追加バイト数が発生
- **Node.js spawn shell:false セキュリティ** — `execFile` / `spawn` は `shell: false` がデフォルト。CVE-2024-27980 により Windows で `.bat`/`.cmd` を渡す場合は追加 EINVAL が発生
- **Vite localhost vs 0.0.0.0 ポート衝突** — Vite がホストなしで `probe.listen(port)` するため、`0.0.0.0` バインドのプロセスを誤検知しないケースがある。`127.0.0.1` 限定プローブで回避可能
- **Node.js ヘルスエンドポイント設計** — `/readyz` / `/livez` パターン（z-pages）が Kubernetes エコシステムで標準。localhost 限定用途では認証不要・100ms 以内応答が指針
- **Fastify ヘルスチェックプラグイン** — `fastify-healthcheck` はデフォルト `/health` を提供。カスタム JSON ペイロードを `info` オプションで拡張可能

## Codebase Findings

### 既存 launchWebUiIfNeeded（FR-007 は実質既実装）

- `packages/cli/src/server/index.ts:15` — `launchWebUiIfNeeded(root, configFile)` が定義済み
- `packages/cli/src/commands/new.ts:114` — `mspec new` 完了後に `launchWebUiIfNeeded(cwd, paths.configFile)` を `.catch(() => {})` 付きで呼出し済み。FR-007 の接続はすでに存在する
- `packages/cli/src/index.ts:1-259` — `open` コマンドは未登録。`open.ts` ファイルも存在しない → FR-008 は **新規コマンド実装** が前提

### 現行「起動済み」判定の不足（FR-009/011）

- `packages/cli/src/server/index.ts:32-40` — 現在の判定は `isAlive(existing.pid)` シグナル確認のみ。HTTP ヘルスチェックは行っていない
- `packages/cli/src/server/index.ts:59-67` — `waitForPid` は PID ファイル書き込みを 3 秒ポーリングで待つが、HTTP 応答確認はしていない

### PID ファイル形式の変更が必要（FR-011）

- `packages/cli/src/server/pidManager.ts:8-11` — `PidEntry = { pid: number; port: number }` — `token` と `projectRoot` フィールドが存在しない
- `packages/cli/src/server/pidManager.ts:30-33` — `writePid` は `${pid}:${port}\n` のプレーンテキスト。JSON 形式への変更が必要
- `packages/cli/src/server/pidManager.ts:13-15` — ファイルパスは `.mspec/ui.pid`。Delta Spec FR-009 のシナリオは `.mspec/web-ui.pid` と記述しており **ファイル名が不一致**

### ポート固定リスト選択は新規実装（FR-008）

- `packages/cli/src/server/portResolver.ts:8-22` — `resolvePort` は config ファイルから単一ポートを読むのみ。空き確認ループ・候補リスト走査は未実装
- `packages/cli/src/lib/prototype-server.ts:57-66` — `isPortFree(port)` が `net.createServer` プローブで実装済み。ただしバインドアドレス未指定（`probe.listen(port)`）なので `127.0.0.1` に明示化して再利用推奨
- `packages/cli/src/lib/prototype-server.ts:18-23` — `findFreePort(start)` は `start` から +9 まで連続スキャン。固定リスト（3847〜3851）に対応したリスト版が必要

### ヘルスエンドポイントは未実装（FR-011）

- `packages/cli/src/server/server-process.ts:1-57` — `/__mspec/health` ルートは存在しない。`{projectRoot, token}` を返すエンドポイントを Fastify ルートとして追加する必要がある
- `packages/cli/src/server/server-process.ts:43-44` — `app.listen({ port, host: '127.0.0.1' })` は FR-013 を既に満たしている

### spawn の shell オプション（FR-014）

- `packages/cli/src/server/index.ts:44-51` — `spawn(process.execPath, [...], { detached: true, stdio: 'ignore' })` — `shell` オプションが未記載（デフォルト false だが明示なし）。ポート値の整数バリデーション（`Number.isInteger` チェック）も未実装

## Open Choices

以下の 3 点は design ステップ前にユーザーが確定した：

| 論点 | 決定 |
|------|------|
| `mspec open` の責務 | Web UI を起動した後、`open http://localhost:<port>` でブラウザを開く |
| PID ファイル名 | `.mspec/ui.pid` を維持（Delta Spec シナリオ記述を修正する） |
| `waitForPid` 戦略 | HTTP `/__mspec/health` 応答が返るまでポーリングに完全置換する |

## Constitution Check

> Step: research | Constitution Version: 1.1.0

| 原則 | Phase 0 | Phase 1 | Notes |
|------|---------|---------|-------|
| I. ステップ独立性 | ✅ | — | 本 research は proposal / delta spec のみを参照。他ステップ成果物への書き込みなし |
| II. 決定論的マージ | ✅ | — | PID ファイル形式変更・`/__mspec/health` 追加は既存 FR に干渉しない新規フィールド追加のみ |
| III. 質問駆動の要件確定 | ✅ | — | Open Choices を design ステップへ引き継ぎ。proposal で確定済みの決定事項を覆す変更なし |
| IV. 双方向アンカー | ✅ | — | 既存 `server/index.ts`, `pidManager.ts`, `portResolver.ts` に新規アンカーを付与する。`open.ts` 新設ファイルにも anchor ブロック必要 |
| V. 強制ステップと拡張ステップの分離 | ✅ | — | `mspec open` 新規コマンドは補助コマンド追加であり、workflow ステップ定義の変更なし |
| VI. Security by Default | ✅ | — | `shell: false` 明示・127.0.0.1 バインド・トークン照合・整数バリデーションはすべて proposal の SEC-001/002/005 を引き継いでいる |

### Complexity Tracking

None
