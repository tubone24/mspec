---
doc_type: Explanation
---

<!-- See also: ./design.md -->

# Design Rationale: fix-checklist-ui-sync

## Context

mspec の Web UI は `ArtifactViewer.tsx` で checklist.md をレンダリングし、チェックボックスをインタラクティブ要素として表示している（FR-006 で実装済み）。しかし、チェックボックスの状態は React の `useState` による一時的なクライアント状態のみで管理されており、ページをリロードすると失われる。
これはユーザーにとって「操作した内容が保存されていない」という混乱を招くバグである。バックエンドには GET エンドポイントしか存在せず、ファイルへの書き戻し機能がない。

この修正では、変更の影響を最小限に抑えながら「チェックした内容がファイルに反映される」という本来あるべき動作を実現する。

---

## Decisions

### PATCH エンドポイントを checklist.md 固定にした理由

汎用的な `PATCH /api/changes/:id/artifacts/*` を実装する案もあったが、このチェンジではスコープを `checklist.md` 固定に限定した。汎用化はパストラバーサル防御のためのホワイトリスト管理や、書き込み可能ファイルの明示的な定義が必要になり、変更範囲が大幅に広がる。今回は「チェックボックスが保存されない」という単一の問題を最小変更で修正することが目的であるため、checklist.md 固定の `join(change.dir, 'checklist.md')` で十分である。

### text/plain でボディを送信する理由

JSON ラップ（`{ content: string }`）は Fastify のデフォルトパーサーで動作するが、Markdown テキストを JSON 文字列にエンコードする処理が追加される。`text/plain` は `addContentTypeParser` 1行の追加で対応でき、クライアント側のシリアライズも `body: updatedContent` と単純になる。通信の透明性が高く、デバッグもしやすい。

### useEffect で初期状態を復元する理由

`content` は非同期で取得されるため、`useState` の初期値では `- [x]` を解析できない。`useEffect` で `content` 変化時に `Set` を再構築することで、別ファイルを開いて checklist.md に戻った場合にも正しく初期化される。`useMemo` は state との二重管理になりユーザートグルと混在するリスクがある。

---

## Alternatives Considered

- **汎用 PATCH エンドポイント** — 任意の artifact ファイルを書き込める API。スコープが広すぎ、ホワイトリスト管理が必要で今回の bugfix に対して過剰設計
- **サーバー側でインデックス受け取り・置換** — `PATCH` に `{ index: number, checked: boolean }` を送り、サーバーがファイルを読んで置換。クライアントが Markdown 全文を保持しているため往復が無駄
- **楽観的更新（Optimistic Update）** — PATCH 前に UI を先行更新。ファイル書き込みは十分高速なため UX 上のメリットが小さく、ロールバック処理が複雑になる
- **useMemo で毎レンダリング計算** — `content` から毎回 `Set` を計算するが、ユーザートグルによる state 変化との整合が取れない

---

## Trade-offs

- `addContentTypeParser('text/plain', ...)` をグローバルに登録するため、同一 Fastify インスタンスの他ルートでも `text/plain` が使えるようになる（意図的なスコープ拡大は最小）
- PATCH 対象を `checklist.md` 固定にするため、将来 `tasks.md` 等の他ファイルへのチェックボックス永続化が必要になった場合は別チェンジで対応が必要

---

## Rejected Options

- **ファイルシステムウォッチャー方式** — UI 操作を検知してファイルを自動同期。実装複雑でパフォーマンス懸念があり却下
- **LocalStorage による状態保持** — リロード後の復元には使えるが、別マシンや別ブラウザで開いた場合にズレが生じるため却下

---

## Constitution Check

| 原則 | Phase 0 | Phase 1 |
|------|---------|---------|
| I — ステップ独立性 | ✅ design-rationale は design/research のみ参照 | ✅ 実装詳細に依存しない |
| II — 決定論的マージ | ✅ | ✅ |
| III — 質問駆動の要件確定 | ✅ 全 Open Choices ユーザー確認済み | ✅ |
| IV — 双方向アンカー | ✅ | ✅ |
| V — 強制/拡張ステップの分離 | ✅ | ✅ |
| VI — Security by Default | ✅ 却下オプションでのセキュリティ懸念を明示 | ✅ |

### Complexity Tracking

None
