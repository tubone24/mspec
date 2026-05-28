---
doc_type: Reference
---

# Research: fix-checklist-ui-sync

## Decisions

| 論点 | 採用案 | 代替案 | 根拠 |
|------|--------|--------|------|
| PATCH 対象ファイル範囲 | `checklist.md` 固定 URL — `PATCH /api/changes/:id/artifacts/checklist.md` | 任意ファイル汎用化 `PATCH /api/changes/:id/artifacts/*` | シンプルで安全。パストラバーサルリスクが最小。ユーザー確認済み |
| サーバー側 Content-Type | `text/plain` でボディを全文受け取り (`addContentTypeParser` 登録) | `application/json` で `{ content: string }` ラップ | 通信量が少なくマーシャリング不要。Fastify への登録は1行で対応可能。ユーザー確認済み |
| パストラバーサル防御 | `join(change.dir, 'checklist.md')` をハードコード — `findChange` で検証済みディレクトリを使用 | 汎用パス受け取り + `startsWith` チェック | PATCH 対象は `checklist.md` 固定のため可変パス不要。ハードコードで防御最強 |
| React 側チェックボックス初期状態復元 | `useEffect` で `content` 変化時に `- [x]` パターンを解析して `Set<number>` を再初期化 | `useMemo` で毎レンダリング計算 | `content` 非同期取得後に確実に実行。別ファイルを開いて戻ったときに状態がリセットされる挙動も正しい。ユーザー確認済み |
| React 側 PATCH 送信方法 | `useMutation` (TanStack Query) — `onSuccess` で `queryClient.invalidateQueries` | `fetch` 直呼び出し + `useEffect` | 既存コードが `useQuery` / TanStack Query を全面採用。`useMutation` で一貫性を保ちエラーハンドリングも統一 |
| チェックボックストグル時の Markdown 更新戦略 | UI 側でインデックスを使い `- [ ]` ↔ `- [x]` を正規表現置換した全文を生成して PATCH | サーバー側でインデックス受け取り置換 | クライアントが Markdown テキストを既に保持しているため往復不要。単純な `replace` で実装可 |
| ファイル書き込み API | `writeFile(path, body, 'utf8')` — 既存コードと同一パターン | `open` + `write` + `close` | プロジェクト全体で `writeFile` を統一使用 (`pidManager.ts`, `archive.ts` 等) |

---

## Web References

- [Fastify Routes Reference](https://fastify.dev/docs/latest/Reference/Routes/) — PATCH ルート定義と `addContentTypeParser` の公式リファレンス
- [TanStack Query Optimistic Updates](https://tanstack.com/query/v5/docs/framework/react/guides/optimistic-updates) — `useMutation` + `onMutate`/`onSuccess` によるキャッシュ更新パターン
- [TanStack Query Mastering Mutations (tkdodo.eu)](https://tkdodo.eu/blog/mastering-mutations-in-react-query) — `useMutation` のエラーハンドリング・`invalidateQueries` ベストプラクティス
- [Node.js fs/promises writeFile](https://nodejs.org/api/fs.html) — `writeFile(path, data, encoding)` の公式 API ドキュメント
- [Path Traversal Prevention in Node.js (StackHawk)](https://www.stackhawk.com/blog/node-js-path-traversal-guide-examples-and-prevention/) — `path.resolve` + `startsWith` による安全なパス検証手法

---

## Codebase Findings

- `packages/web-ui/src/components/ArtifactViewer.tsx:39-41` — `checkedItems: Set<number>` を `useState(new Set())` で初期化しているが、`content` 文字列から `- [x]` を解析する処理が存在しない。`useEffect` で初期化ロジックを追加する必要がある
- `packages/web-ui/src/components/ArtifactViewer.tsx:82-98` — `checkboxCounter` ref でインデックス 0 始まりを付与し `onChange` で `Set` を更新しているが、PATCH 呼び出しが一切ない。`onChange` ハンドラ内で PATCH mutation を呼び出す必要がある
- `packages/web-ui/src/api/client.ts:117-127` — `useArtifactContent` が `useQuery` で GET のみ実装。PATCH 用の `usePatchChecklistItem` mutation フックが未実装
- `packages/cli/src/server/routes/artifacts.ts:102-126` — GET `*` ルートは `join` + `startsWith` で防御済み。PATCH ルートは未存在。`checklist.md` 固定パスで追加する
- `packages/cli/src/server/routes/artifacts.ts:1-13` — `import` に `writeFile` が未追加。`node:fs/promises` の `readFile, readdir, stat` に `writeFile` を加える必要がある
- `packages/cli/src/server/__tests__/routes.artifacts.test.ts` — 既存テストは GET のみカバー。PATCH の正常・404・403 シナリオのユニットテストを同ファイルに追加する

---

## Open Choices (解決済み)

- **PATCH 対象の汎用化** → `checklist.md` 固定 URL を採用（ユーザー確認済み）
- **Content-Type** → `text/plain` を採用、Fastify で `addContentTypeParser` 登録（ユーザー確認済み）
- **`checkedItems` 初期化タイミング** → `useEffect` で `content` 変化時に再初期化（ユーザー確認済み）

---

## Constitution Check

| 原則 | Phase 0 | Phase 1 |
|------|---------|---------|
| I — ステップ独立性 | ✅ research は delta spec のみ参照、実装コードに依存しない | — |
| II — 決定論的マージ | ✅ FR-007 / FR-013 は新規 ADDED、既存 FR に競合なし | — |
| III — 質問駆動の要件確定 | ✅ 3 つの Open Choices をユーザーに確認し決定を記録 | — |
| IV — 双方向アンカー | ✅ Delta Spec のアンカーは `mspec delta init` で自動生成済み | — |
| V — 強制ステップと拡張ステップの分離 | ✅ research は任意拡張ステップとして独立 | — |
| VI — Security by Default | ✅ `checklist.md` 固定パスでパストラバーサル防御を最大化、PATCH 対象を限定 | — |
