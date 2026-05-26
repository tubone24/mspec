<!-- See also: ./design-rationale.md for採用理由・代替案 -->

---
doc_type: Reference
---

# Design: mspec-web-ui

## Summary

MSPEC Web UI は、ローカル HTTP サーバー（Fastify）が React SPA を提供し、ブラウザ上で mspec の全ワークフロー状態を可視化するシステムである。サーバーは `mspec new` 実行時にバックグラウンドで自動起動し、PID ファイル（`~/.mspec/ui.pid`）で多重起動を防ぐ。フロントエンドは `@mspec/web-ui` として独立 monorepo パッケージで公開し、CLI が `node_modules/@mspec/web-ui/dist/` を `@fastify/static` でサーブする。

## Technical Context

- **ランタイム**: Node.js 20+ / TypeScript
- **パッケージ管理**: pnpm workspaces
- **既存パッケージ**: `packages/cli`（CLI エントリーポイント・コマンド定義・ステップ管理・ファイル I/O すべて含む）
- **注**: `packages/core` は存在しない。コアロジックは `packages/cli/src/{lib,parser,workflow,types}` に直接ある
- **新規追加**: `packages/web-ui`（`@mspec/web-ui` — React + Vite SPA、**optional**）
- **CLI 拡張**: `packages/cli/src/server/`（Fastify API）、`packages/cli/src/commands/new.ts`（フック追加）
- **依存関係の性質**: `@mspec/web-ui` は CLI の **optionalDependencies** に定義する。未インストールでも CLI は正常動作し、Web UI 機能のみ無効化される

## Project Structure

```
packages/
  web-ui/                              ← NEW (@mspec/web-ui)
    src/
      pages/
        Dashboard.tsx                  ← Change list + step progress
        ChangeDetail.tsx               ← Artifact list for a change
        ArtifactPreview.tsx            ← MD/Mermaid/iframe preview
        TestResults.tsx                ← E2E result viewer
      components/
        StepProgress.tsx               ← Step badge row
        ThemeToggle.tsx                ← Dark/light switch
        MermaidRenderer.tsx            ← mermaid.js wrapper
        GherkinHighlight.tsx           ← EARS/Gherkin syntax highlight
        PrototypeIframe.tsx            ← sandbox iframe wrapper
        ModeFilter.tsx                 ← typo/minor/bugfix/full filter
      store/
        useChangesStore.ts             ← Zustand: selected change, theme
      router/
        index.tsx                      ← React Router v7 routes
      i18n/
        en.ts                          ← English strings (i18n skeleton)
      api/
        client.ts                      ← TanStack Query hooks
    vite.config.ts
    package.json                       ← name: "@mspec/web-ui"

  cli/
    src/
      server/                          ← NEW
        index.ts                       ← Fastify bootstrap + serve-static
        routes/
          changes.ts                   ← GET /api/changes, /api/changes/:id
          artifacts.ts                 ← GET /api/changes/:id/artifacts/*
          testResults.ts               ← GET /api/changes/:id/test-results
        pidManager.ts                  ← ~/.mspec/ui.pid read/write/cleanup
        portResolver.ts                ← ~/.mspecrc ui.port | 3847
        testResultParser.ts            ← Playwright JSON + JUnit XML parser
      commands/
        new.ts                         ← MODIFIED: +launchWebUiIfNeeded()
```

## REST API

| Method | Path | Response Type | Notes |
|--------|------|--------------|-------|
| `GET` | `/api/health` | `HealthResponse` | サーバー生存確認 |
| `GET` | `/api/changes` | `ChangeInfo[]` | 未アーカイブチェンジ一覧 |
| `GET` | `/api/changes/:id` | `ChangeDetail` | 単一チェンジ詳細 |
| `GET` | `/api/changes/:id/artifacts` | `ArtifactFile[]` | アーティファクト一覧 |
| `GET` | `/api/changes/:id/artifacts/*` | `string` (raw) | ファイル生コンテンツ |
| `GET` | `/api/changes/:id/test-results` | `TestSuite[]` | E2E 結果（両フォーマット） |

## Data Models

```typescript
// Health
interface HealthResponse { status: "ok"; pid: number; port: number }

// Changes
interface ChangeInfo {
  id: string            // "2026-05-24-130128-mspec-web-ui"
  name: string          // "mspec-web-ui"
  createdAt: string     // ISO 8601
  mode: "typo" | "minor" | "bugfix" | "full"
  currentStep: string
  steps: StepState[]
}

interface StepState {
  id: string
  state: "done" | "ready" | "blocked"
}

// Artifacts
interface ArtifactFile {
  name: string          // "proposal.md"
  relativePath: string  // relative within change dir
  type: "markdown" | "html" | "json" | "xml" | "other"
}

// Test Results
interface TestSuite {
  suiteName: string
  format: "playwright-json" | "junit-xml"
  tests: TestCase[]
}

interface TestCase {
  name: string
  status: "pass" | "fail" | "skip"
  duration: number       // ms
  errorMessage?: string
  stackTrace?: string
}
```

## PID Manager Contract

```typescript
// ~/.mspec/ui.pid format: "<pid>:<port>\n"
interface PidEntry { pid: number; port: number }

function readPid(): PidEntry | null
function writePid(entry: PidEntry): void
function clearPid(): void
function isAlive(pid: number): boolean   // kill(pid, 0) check
```

## Optional Dependency Contract

```typescript
// packages/cli/src/server/index.ts
export async function launchWebUiIfNeeded(port: number): Promise<void> {
  let distPath: string
  try {
    // Resolves only if @mspec/web-ui is installed
    distPath = require.resolve('@mspec/web-ui/dist/index.html')
      .replace('/index.html', '')
  } catch (e: unknown) {
    if ((e as NodeJS.ErrnoException).code === 'MODULE_NOT_FOUND') {
      console.info(
        'ℹ  Web UI not available. Install it with: pnpm add @mspec/web-ui'
      )
      return   // ← CLI は正常終了。エラーにならない
    }
    throw e
  }
  // ... Fastify 起動処理
}
```

## React Router v7 Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `Dashboard` | チェンジ一覧・進捗ダッシュボード |
| `/changes/:id` | `ChangeDetail` | アーティファクト一覧 |
| `/changes/:id/artifacts/*` | `ArtifactPreview` | MD/HTML プレビュー |
| `/changes/:id/test-results` | `TestResults` | E2E 証跡 |

## Decisions

| # | Decision | Acceptance Criterion |
|---|----------|---------------------|
| 1 | Fastify を `packages/cli/src/server/` に統合 | `cli-integration FR-003`: `mspec new` が 5 秒以内に完了しブロックしない |
| 2 | PID ファイルを `~/.mspec/ui.pid` に配置 | `web-ui-server FR-003`: ゾンビ PID があっても次回起動時に自動クリーンアップ |
| 3 | `@mspec/web-ui` を独立パッケージとして配布 | `web-ui-server FR-001`: CLI が `dist/` をサーブして SPA が表示される |
| 4 | React Router v7 で URL 管理 | `change-dashboard FR-004`: `/changes/:id` が valid URL としてブラウザ履歴に残る |
| 5 | TanStack Query `refetchInterval: 3000` | `change-dashboard FR-002`: 進捗変化が 5 秒以内に UI に反映される |
| 6 | Playwright JSON + JUnit XML 両対応パーサー | `test-result-viewer FR-001`: 両フォーマットが `TestSuite[]` に正規化される |
| 7 | デフォルトポート 3847 / `~/.mspecrc ui.port` で上書き | `web-ui-server FR-004`: カスタムポート設定が反映される |
| 8 | `sandbox="allow-scripts"` で prototype iframe を分離 | `artifact-preview FR-005`: プロトタイプ HTML が親ページから隔離される |
| 9 | `@mspec/web-ui` を `optionalDependencies` に定義し、未インストール時はグレースフルデグレード | `cli-integration FR-001`: Web UI 未インストール時に CLI がクラッシュせず案内メッセージを表示する |

## Constitution Check

| 原則 | Phase 0 | Phase 1 |
|------|---------|---------|
| I ステップ独立性 | ✅ design ステップは research.md のみを入力とし、design.md を独立して生成している | ✅ design.md は他の成果物（tasks.md 等）に依存せず単独で参照可能な Reference ドキュメントである |
| II 決定論的マージ | ✅ design.md は新規ファイルであり、既存ファイルへのマージ競合は発生しない | ✅ Data Models・API・PID Contract は明確な型定義を持ち、マージ時に曖昧さが生じない |
| III 質問駆動の要件確定 | ✅ AskUserQuestion でビルド成果物の配布方式（独立パッケージ）を確定した | ✅ 全 Decisions が Delta Spec の Scenario（GIVEN/WHEN/THEN）と対応付けられており、受け入れ基準が明確 |
| IV 双方向アンカー | ✅ Decisions テーブルの各行が `capability FR-NNN` として Delta Spec にトレース可能 | ✅ REST API・Data Models・Route 定義が tasks.md の実装タスクのアンカーとして機能する |
| V 強制ステップと拡張ステップの分離 | ✅ design は全フロー変更での強制ステップであり、skip 対象外 | ✅ design-rationale.md は design.md から分離された拡張ドキュメントとして管理される |

### Complexity Tracking

None.

## Self-Review

### Findings

| # | Severity | Location | Issue | 対応 |
|---|----------|----------|-------|------|
| 1 | 🟡 SHOULD-FIX | `quickstart.md` Troubleshooting vs `design.md` Optional Dependency Contract | インストールコマンドの不整合: quickstart.md は `pnpm add -D @mspec/web-ui` を使用しているが、design.md のデグレードメッセージは `npm install @mspec/web-ui` だった | ✅ 修正済み — design.md の `console.info` を `pnpm add @mspec/web-ui` に統一 |
| 2 | 🟡 SHOULD-FIX | `quickstart.md` Troubleshooting: `echo "ui:\n  port: 4000" >> ~/.mspecrc` | `echo` は bash/zsh でデフォルト `\n` を展開しないため invalid YAML が生成される | ✅ 修正済み — `printf 'ui:\n  port: 4000\n' >> ~/.mspecrc` に変更 |
| 3 | 🟢 NOTE | `design.md` Decision 5 / `specs/change-dashboard/spec.md` FR-002 Scenario | Decision 5 の受け入れ基準「5 秒以内に UI に反映」が Scenario THEN 句にトレース不可能だった | ✅ 修正済み — change-dashboard FR-002 の Scenario THEN 句に「最大 5 秒以内に UI に反映」を追記 |
| 4 | 🟢 NOTE | `design.md` Decisions — `web-ui-server FR-002` | プロセス再利用（FR-002）が Decisions テーブルに直接対応する行を持たない | 非ブロッカー。FR-002 の振る舞いは Decision 2（PID ファイル管理）とアーキテクチャシーケンス図で暗黙的にカバー済み |

### Constitution Re-Evaluation

| 原則 | Phase 0 | Phase 1 | セルフレビュー評価 |
|------|---------|---------|-----------------|
| I ステップ独立性 | ✅ | ✅ | AGREE |
| II 決定論的マージ | ✅ | ✅ | AGREE |
| III 質問駆動の要件確定 | ✅ | ✅ | AGREE（Finding #3 修正後、Decision 5 が Scenario THEN にトレース可能になった） |
| IV 双方向アンカー | ✅ | ✅ | AGREE |
| V 強制ステップと拡張ステップの分離 | ✅ | ✅ | AGREE |

### Verdict

**PASS-WITH-NOTES → PASS**（全 SHOULD-FIX 対応済み）

2件の SHOULD-FIX（インストールコマンド不整合・broken echo）と 1件の NOTE（5秒 SLA トレーサビリティ）を修正した。NOTE #4（FR-002 のアンカー欠如）は非ブロッカーとして残す。
