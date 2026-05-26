---
doc_type: Reference
---

# Research: web-ui-enhancements

## Decisions

| 論点 | 採用案 | 代替案 | 根拠 |
|------|--------|--------|------|
| `doc_type` フロントマター解析場所 | サーバーサイド (`routes/artifacts.ts` で解析し `ArtifactFile.docType` フィールドを追加) | クライアントサイド (`gray-matter` / `js-yaml` をブラウザ bundle) | CLI は既に `yaml` パッケージを利用中。`gray-matter` は Node `Buffer` 依存があり Vite/browser bundle でビルドエラーが頻出する。サーバー解析はクライアントを薄く保つ既存パターンとも一致する |
| SoT Spec ビューアー表示形式 | 専用ルート `/spec-viewer` + `/spec-viewer/:capability` (Markdown 右ペイン) | モーダルオーバーレイ | 深リンク可能・既存 `/changes/:id` ルートパターンと整合。ブラウザ履歴・戻るボタンが機能する |
| アーカイブフィルター状態の永続化 | `useSearchParams`（URL クエリパラメータ `?showArchived=true`） | LocalStorage / Zustand store | React Router v7 が既存 dep。リロード後も維持、URL 共有可能、Filter 値が boolean 1 個のため実装コストが低い |
| アーティファクト一覧 UI 構造（FR-011） | 既存 `<ul>/<li>` の各 `<button>` 行に背景色 + 左ボーダーを追加（カード風スタイル） | `<li>` を独立カードコンポーネントにリファクタ | `ChangeDetail.tsx` は現在テキスト行リスト。spec は「カード」と書くが構造変更は scope 超過のため、既存要素への CSS 追加が最小変更 |
| DockType 色パレット（Tailwind） | `Reference=bg-blue-50 border-l-4 border-blue-300`、`Explanation=bg-purple-50 border-purple-300`、`How-to=bg-green-50 border-green-300`、`Tutorial=bg-yellow-50 border-yellow-300`、未設定=`bg-gray-50 border-gray-200` | Tailwind 任意値 / CSS 変数 | Tailwind v3 の semantic color scale を使用。ダークモード対応の `dark:` prefix も追加可能。テーマ CSS 変数との衝突なし |
| SoT Spec 一覧 API 設計 | `GET /api/specs` → `{capability: string}[]` + `GET /api/specs/:capability` → raw text | 既存 artifact エンドポイントを流用 | `specs/` は `changes/` 配下にないため別エンドポイントが必要。`projectPaths` に `specsDir` がある想定（要確認） |

## Web References

- [useSearchParams | React Router](https://reactrouter.com/api/hooks/useSearchParams) — React Router v7 の `useSearchParams` API リファレンス。フィルター状態の URL 同期に直接利用可能
- [Why URL state matters: useSearchParams in React – LogRocket](https://blog.logrocket.com/url-state-usesearchparams/) — URL state vs component state の比較とベストプラクティス解説。`showArchived` のような boolean フィルターは URL が最適と結論
- [Persistent Search Filters in React Using URL Parameters – Hashnode](https://jaygadhiya.hashnode.dev/persistent-search-filters-in-react-using-url-parameters) — useSearchParams でのフィルター永続化の具体的実装例
- [gray-matter – npm](https://www.npmjs.com/package/gray-matter) — YAML frontmatter パーサー。ただし Node Buffer 依存のためブラウザ bundle には不向き。サーバー側解析を推奨
- [react-split-pane – npm](https://www.npmjs.com/package/react-split-pane) — React 用スプリットペインコンポーネント。SoT Spec ビューアーの左ペイン（capability 一覧）+ 右ペイン（Markdown）レイアウトに利用可能
- [Tailwind CSS Badges – Flowbite](https://flowbite.com/docs/components/badge/) — Tailwind によるカラーコーディングバッジの実装例。`bg-blue-100 text-blue-800` 形式

## Codebase Findings

- `packages/web-ui/src/pages/Dashboard.tsx:29` — `listChanges` は `includeArchived: false` をハードコード。アーカイブフィルター有効化には `GET /api/changes?includeArchived=true` への切り替えが必要
- `packages/cli/src/server/routes/changes.ts:29` — `listChanges(paths, { includeArchived: false })` のみ呼び出し。クエリパラメータ `?includeArchived=true` を受け取る分岐が未実装
- `packages/cli/src/lib/change-discovery.ts:6-9` — `ChangeLocation` インターフェースに `isArchived: boolean` フィールドが既に存在。API レスポンスへの露出のみが未対応
- `packages/cli/src/lib/change-discovery.ts:43-52` — `listChanges` の `includeArchived` オプションが実装済み。`changes/archive/` ディレクトリ列挙ロジックが動作中
- `packages/web-ui/src/api/client.ts:16-22` — `ChangeInfo` 型に `isArchived` フィールドなし。追加が必要
- `packages/web-ui/src/api/client.ts:24-27` — `ArtifactFile` 型に `docType` フィールドなし。追加が必要
- `packages/cli/src/server/routes/artifacts.ts:23-40` — `collectArtifacts` 関数でファイル走査済み。各ファイルの frontmatter 解析（YAML ブロック抽出 → `doc_type` 取得）をここに追加可能
- `packages/web-ui/src/pages/ChangeDetail.tsx:60-76` — アーティファクト一覧は `<ul>/<li>` テキスト行。FR-011 の「カード色付け」は `<button>` 要素に `bg-*` + `border-l-4 border-*` を追加することで実現
- `packages/web-ui/src/components/ModeFilter.tsx:1-36` — アーカイブトグルは Mode フィルターとは独立した boolean トグルのため、`ModeFilter` 拡張より Dashboard 内の独立トグルボタン（`data-testid="filter-archived"`）として実装する方が明確
- `packages/web-ui/src/router/index.tsx:11-22` — `/spec-viewer` および `/spec-viewer/:capability` ルートが未登録。追加が必要
- `packages/web-ui/src/store/useChangesStore.ts:20-22` — Zustand store は `theme` のみ管理。アーカイブフィルターは URL state で管理するため store 変更不要
- `packages/web-ui/src/components/ArtifactViewer.tsx:13` — `react-markdown` v9 + `remark-gfm` が既に import 済み。SoT Spec ビューアーも同コンポーネントで Markdown レンダリング可能（再利用推奨）
- `specs/` ディレクトリに 36 以上の capability が存在（`artifact-preview`, `change-dashboard`, `web-ui-themes` など）。`GET /api/specs` エンドポイント新設時の列挙対象

## Open Choices (解決済み)

- **`isArchived` フィールドの API 公開タイミング**: ✅ **常に返す** — `GET /api/changes` は常に `isArchived` を含める
- **SoT Spec ビューアーの左ペインレイアウト**: ✅ **CSS Grid** — 新規 dep なし、既存 ChangeDetail.tsx パターンを踏襲
- **`doc_type` 解析方法**: ✅ **正規表現** — `/^doc_type:\s*(.+)$/m` で十分、追加 dep なし

## Constitution Check (Phase 0)

- **I. ステップ独立性**: research.md はコードを書かない。設計・実装の判断材料を提供するのみ
- **II. 決定論的マージ**: 新規 FR-008/FR-009/FR-011 のみ追加。既存 FR への変更なし
- **III. 質問駆動の要件確定**: Open Choices セクションで未解決事項を明示。実装前にユーザー確認が必要な項目を列挙済み
- **IV. 双方向アンカー**: 実装時に `@mspec-delta 2026-05-26-083855-web-ui-enhancements/specs/change-dashboard/spec.md` および `specs/artifact-preview/spec.md` アンカーを各ファイルに付与する必要あり
- **V. 強制ステップと拡張ステップの分離**: research は強制ステップ。design/tasks は後続ステップで分離済み
- **VI. Security by Default**: 新規 `GET /api/specs/:capability` エンドポイントは既存 artifacts ルートと同様のパストラバーサル防止チェック（`fullPath.startsWith(specsDir)`）が必須。読み取り専用のため書き込みリスクなし
