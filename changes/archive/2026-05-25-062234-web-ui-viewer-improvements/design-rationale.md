---
doc_type: Explanation
---

<!-- See also: ./design.md -->

# Design Rationale: web-ui-viewer-improvements

## Context

mspec の Web UI は Tailwind CSS v3 + React + TanStack Query で構築されている。アーティファクトプレビューには `ReactMarkdown` と `prose` クラスが既に使われているが、`@tailwindcss/typography` プラグインが `tailwind.config.ts` の `plugins: []` に登録されていないため、`prose` クラスは CSS を一切出力せずプレーンテキストのまま表示されていた。

アーティファクト一覧からクリックすると React Router で別ページ（`/changes/:id/artifacts/*`）に遷移する設計になっており、一覧を見ながら複数ドキュメントを読み比べることができなかった。ドキュメントを読んで内容を確認・理解するというユースケースにおいて、ページ遷移のたびに一覧に戻る操作が必要なことは認知コストが高い。

ステップ進捗のリアルタイム更新については、`useChanges()` が `refetchInterval: 3000` でポーリングしているものの、`StepProgress` コンポーネントが `'done' | 'ready' | 'blocked'` の 3 状態しか定義しておらず、CLI が返す `'skipped'` と `'invalid'` は `STATE_COLORS` の fallback（灰色）に落ちていた。また `ready` 状態のステップが現在実行中なのか次のステップ待ちなのかを視覚的に区別できない問題もあった。

## Decisions

### Markdown レンダリング（FR-009）

`@tailwindcss/typography` の追加のみで対応する。`ArtifactPreview.tsx` に既に `prose dark:prose-invert max-w-none` が記述されているため、プラグインさえ有効になれば H1–H6・太字・コードブロック・テーブル・リストすべての書式が即座に機能する。コードの変更はゼロ、設定の変更のみで解決できる最小コストの修正。

ESM 形式の `tailwind.config.ts` のため、`require('@tailwindcss/typography')` は使えない。`import typography from '@tailwindcss/typography'` の ESM import を採用する。

### スプリットビュー（FR-010）

`ChangeDetail.tsx` に `useState<string | null>` を追加し、CSS Grid `grid-cols-[280px_1fr]` で左右 2 ペインを並べる。URL へのクエリパラメータ反映はユーザー確認の結果「不要」と判断した（ローカル開発ツールとして深リンク共有の需要が低いため）。

共有コンポーネント `ArtifactViewer` を新規作成し、既存 `ArtifactPreview` の rendering ロジック（ReactMarkdown + MermaidRenderer + GherkinHighlight）を移す。これにより `ChangeDetail` の右ペインと `ArtifactPreview` の両方で同一レンダリングを再利用でき、将来的な表示仕様変更を一箇所に集約できる。

既存の `/changes/:id/artifacts/*` ルートは維持する。直接 URL アクセスやブラウザバック時の自然な挙動を保つためにユーザーが「残す」を選択した。

### リアルタイム進捗（FR-007）

CLI の `state-engine.ts` はステートレスなファイル存在チェック関数であり、「現在実行中」を表す恒久的な状態を持たない。真の `in_progress` 状態を導入するには CLI サーバー側へのロック機構追加が必要となり、今回の変更スコープを超える。

代わりに「`ready` 状態 = 次に実行されるステップ = 実質的に実行中または実行予定」と定義し直し、`animate-pulse` を付与して視覚的に強調する。`refetchInterval` を 3000 → 2000 ms に短縮し、FR-007 の「2 秒以内レイテンシ」要件を満たす。

`StepState` 型に `'skipped'` と `'invalid'` を追加する。ユーザー確認の結果「今回一緒に修正」と決定した。型の乖離を放置すると `STATE_COLORS` の fallback が常に適用され、`'skipped'` ステップが `'blocked'` と視覚的に区別できなくなるためと。

## Alternatives Considered

- **SSE（Server-Sent Events）によるプッシュ型更新**: ポーリングより低レイテンシだが、CLI サーバーへのイベントエミット機構追加が必要。ローカル開発ツールの用途でポーリング 2 秒は許容範囲のため不採用。
- **react-resizable-panels によるリサイズ可能ペイン**: ユーザー操作性は高いが外部依存が増える。ローカル開発ツールにリサイズ機能は過剰と判断し不採用。
- **クエリパラメータ `?artifact=path` による深リンク対応**: ブラウザバック対応が可能だが `useSearchParams()` の追加実装が必要。ユーザーが不要と判断したため不採用。

## Trade-offs

- `ready` を「実行中」として扱うことで、ステップ実行前（待機中）でも `animate-pulse` が表示される。厳密には「実行中」ではないが、ローカル開発ツールの用途では許容できる曖昧さ。
- スプリットビューは URL 非反映のため、右ペインを開いた状態でページリロードすると一覧表示に戻る。直接 URL アクセスには既存の `ArtifactPreview` ルートを継続して使う。

## Rejected Options

- `in_progress` を `StepState` 型に追加: CLI が返さない状態値を型に追加しても機能しない。CLI 変更は今回スコープ外。
- `ArtifactPreview` ルートの削除: ユーザーが「残す」を選択。URL 直接アクセスの利便性を維持するため却下。

## Constitution Check

| 原則 | Phase 0 | Phase 1 |
|------|---------|---------|
| I ステップ独立性 | ✅ | ✅ |
| II 決定論的マージ | ✅ | ✅ |
| III 質問駆動の要件確定 | ✅ | ✅ |
| IV 双方向アンカー | ✅ | ✅ |
| V 強制/拡張ステップの分離 | ✅ | ✅ |

## Complexity Tracking

None
