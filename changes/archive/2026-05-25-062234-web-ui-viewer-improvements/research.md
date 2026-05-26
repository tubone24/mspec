---
doc_type: Reference
---

# Research: web-ui-viewer-improvements

## Decisions

| 論点 | 採用案 | 代替案 | 根拠 |
|------|--------|--------|------|
| FR-009: typography プラグイン追加方法 | `pnpm add -D @tailwindcss/typography` → `tailwind.config.ts` に ESM import で `plugins: [typography]` | `require()` 形式 | `tailwind.config.ts` は `.ts` 拡張子で ESM 環境のため `require()` 不可。ESM import のみ動作する |
| FR-009: prose クラスのサイズ | デフォルト `prose` を使用（`prose-sm` は不採用） | `prose-sm`・`prose-base` | mspec アーティファクトは仕様・設計ドキュメントで可読性優先。デフォルトサイズで十分 |
| FR-010: 状態管理方式 | `ChangeDetail.tsx` 内に `useState<string | null>(selectedArtifact)` を追加し右ペインを出し分ける | クエリパラメータ `?artifact=path`・フルページ遷移（現行） | **ユーザー確認済み**: useState のみ（URL 非反映）。ローカル開発ツールとして十分 |
| FR-010: スプリットビュー実装方式 | CSS Grid `grid-cols-[280px_1fr]` 固定 2 ペイン、リサイズなし | `react-resizable-panels`（外部依存追加） / CSS flexbox | 新規 npm 依存ゼロ。Tailwind クラスのみで完結。ローカル開発ツールにリサイズは不要 |
| FR-010: 既存 ArtifactPreview ルート | **残す**（`/changes/:id/artifacts/*` を維持） | 削除 | **ユーザー確認済み**: URL 直接アクセスやブラウザバックの自然な挙動を維持 |
| FR-007: リアルタイム更新方式 | `refetchInterval` を 3000 → 2000 ms に短縮。`ready` 状態のステップに `animate-pulse` を付与 | SSE / EventSource | CLI の state-engine はステートレスなファイル存在チェック関数。SSE 導入には CLI サーバーへの大規模変更が必要。ポーリング短縮のみで FR-007 の 2 秒要件を達成できる |
| FR-007: `in_progress` 型追加要否 | 追加しない。`ready` を「実行予定/実行中」として視覚的に強調 | `StepState` に `'in_progress'` を追加 | CLI API が `in_progress` を返さない限り型追加は空振り |
| FR-007: `StepState` 型修正範囲 | `'skipped'` と `'invalid'` を今回一緒に追加 | 別 issue で対応 | **ユーザー確認済み**: CLI との型乖離を今回解消する |

---

## Web References

- [tailwindlabs/tailwindcss-typography — GitHub](https://github.com/tailwindlabs/tailwindcss-typography) — インストール手順・`prose` クラス仕様。Tailwind v3 対応、ESM import での設定方法
- [@tailwindcss/typography — npm](https://www.npmjs.com/package/@tailwindcss/typography) — 最新バージョン・peerDependencies 確認
- [Polling | TanStack Query React Docs](https://tanstack.com/query/latest/docs/framework/react/guides/polling) — `refetchInterval` の挙動詳細。アクティブなオブザーバーがある間のみポーリング継続
- [Animation — Tailwind CSS Docs](https://tailwindcss.com/docs/animation) — `animate-pulse`（opacity フェードイン/アウト）と `animate-spin` の使い方

---

## Codebase Findings

| ファイル | 行 | 問題 / 観察事項 |
|----------|-----|----------------|
| `packages/web-ui/tailwind.config.ts` | L9 | `plugins: []` — `@tailwindcss/typography` 未登録。`prose` クラスが CSS を出力しない根本原因 |
| `packages/web-ui/src/pages/ArtifactPreview.tsx` | L43 | `className="prose dark:prose-invert max-w-none"` は既に記述済み。プラグイン追加のみで即座に機能する |
| `packages/web-ui/src/pages/ChangeDetail.tsx` | L44–52 | `<Link to=".../artifacts/${a.relativePath}">` でフルナビゲーション。`onClick` + `useState` に差し替えてスプリットビュー化 |
| `packages/web-ui/src/api/client.ts` | L7–9 | `StepState` 型は `'done' | 'ready' | 'blocked'` のみ。CLI の `'skipped'` と `'invalid'` が未反映 |
| `packages/cli/src/types/status.ts` | — | CLI 側 `StepStateSchema` は `'done' | 'ready' | 'blocked' | 'skipped' | 'invalid'`。web-ui 型と乖離 |
| `packages/web-ui/src/components/StepProgress.tsx` | L7–11 | `STATE_COLORS` に `ready: 'bg-blue-400'` はあるがアニメーション指定なし |
| `packages/web-ui/src/api/client.ts` | L50–55 | `useChanges()` と `useChange()` は `refetchInterval: 3000`。2000 ms に短縮で FR-007 の 2 秒要件達成 |
| `packages/web-ui/src/router/index.tsx` | L17 | `/changes/:id/artifacts/*` ルートが `ArtifactPreview` にマッピング。スプリットビュー化後も維持する |

---

## Open Choices

なし（全選択肢はユーザー確認により解決済み）

---

## Constitution Check

| 原則 | Phase 0 評価 | Phase 1 |
|------|-------------|---------|
| I ステップ独立性 | ✅ research は read-only。実装に依存しない | — |
| II 決定論的マージ | ✅ FR 番号は auto-numbering 済み（FR-009, FR-010, FR-007）。競合なし | — |
| III 質問駆動の要件確定 | ✅ 深リンク・ルート維持・型修正範囲の 3 点をユーザーに確認済み | — |
| IV 双方向アンカー | ✅ Delta Spec に `<!-- @mspec-delta -->` アンカーを付与予定 | — |
| V 強制ステップと拡張ステップの分離 | ✅ minor モードで proposal / quickstart はスキップ。強制ステップのみ実行 | — |
