---
doc_type: Reference
---

<!-- See also: ./design-rationale.md for採用理由・代替案 -->

<!-- @mspec-delta 2026-05-25-062234-web-ui-viewer-improvements/specs/artifact-preview/spec.md -->
<!-- Requirements implemented: FR-009, FR-010 -->

<!-- @mspec-delta 2026-05-25-062234-web-ui-viewer-improvements/specs/change-dashboard/spec.md -->
<!-- Requirements implemented: FR-007 -->

# Design: web-ui-viewer-improvements

## Summary

Web UI の 3 つの UX 課題を最小変更で修正する。①`@tailwindcss/typography` プラグインを追加して Markdown レンダリングを有効化、②`ChangeDetail` にスプリットビューを実装してアーティファクト一覧を維持しながら閲覧できるようにする、③ポーリング間隔短縮と `ready` 状態へのアニメーション付与でリアルタイム進捗表示を実現する。

## Technical Context

| 項目 | 値 |
|------|----|
| フレームワーク | React 18 + TypeScript + Vite |
| スタイリング | Tailwind CSS v3（`darkMode: 'class'`） |
| ルーティング | React Router v6 |
| データフェッチ | TanStack Query v5（`refetchInterval` ポーリング） |
| 状態管理 | Zustand（テーマのみ） |

## Project Structure

変更対象ファイル：

| ファイル | 操作 | 概要 |
|----------|------|------|
| `packages/web-ui/package.json` | 修正 | `@tailwindcss/typography` を devDependencies に追加 |
| `packages/web-ui/tailwind.config.ts` | 修正 | `plugins: [typography]` を追加 |
| `packages/web-ui/src/api/client.ts` | 修正 | `StepState` 型に `'skipped' \| 'invalid'` を追加、`refetchInterval` を 2000 ms に変更 |
| `packages/web-ui/src/components/StepProgress.tsx` | 修正 | `ready` に `animate-pulse` を追加、`skipped`・`invalid` の色定義を追加 |
| `packages/web-ui/src/components/ArtifactViewer.tsx` | 新規作成 | ArtifactPreview から rendering ロジックを抽出した共有コンポーネント |
| `packages/web-ui/src/pages/ChangeDetail.tsx` | 修正 | `useState<string \| null>` による選択状態管理、CSS Grid スプリットビューレイアウトを追加 |
| `packages/web-ui/src/pages/ArtifactPreview.tsx` | 修正 | rendering ロジックを `ArtifactViewer` に委譲するようリファクタリング |

## Decisions

### D-1: Markdown レンダリング（FR-009）

`packages/web-ui/tailwind.config.ts` に `import typography from '@tailwindcss/typography'` を追加し、`plugins: [typography]` を設定する。

`ArtifactPreview.tsx` の既存 `className="prose dark:prose-invert max-w-none"` はそのまま機能する。追加変更不要。

**受け入れ基準（FR-009 Scenario 対応）**：
- `design.md` に `# 設計` の見出しが含まれる場合、プレビュー時にフォントサイズ・ウェイト・余白が視覚的に階層化されて表示される
- コードフェンスブロックが等幅フォント・背景色付きの枠内に表示される

---

### D-2: スプリットビューレイアウト（FR-010）

`ChangeDetail.tsx` に以下の変更を加える：

```
const [selectedArtifact, setSelectedArtifact] = useState<string | null>(null);
```

- アーティファクト行クリック → `setSelectedArtifact(a.relativePath)`（ページ遷移なし）
- 同じアーティファクトを再クリック → `setSelectedArtifact(null)`（スプリットビューを閉じる）
- 閉じるボタン → `setSelectedArtifact(null)`

レイアウト（`selectedArtifact` が非 null の場合）：

```
<div className="grid grid-cols-[280px_1fr] gap-0 h-full">
  <aside>  <!-- 左ペイン: アーティファクト一覧 -->
  <main>   <!-- 右ペイン: ArtifactViewer -->
```

`selectedArtifact` が null の場合は通常の全幅リスト表示。

**共有コンポーネント `ArtifactViewer`**:

```ts
interface ArtifactViewerProps {
  changeId: string;
  relativePath: string;
  onClose?: () => void;
}
```

`useArtifactContent(changeId, relativePath)` でコンテンツを取得し、ReactMarkdown + markdownComponents でレンダリング。`ChangeDetail` の右ペインと `ArtifactPreview` の両方から利用する。

`/changes/:id/artifacts/*` ルートと `ArtifactPreview` ページは維持する（URL 直接アクセス用）。

**受け入れ基準（FR-010 Scenario 対応）**：
- `design.md` をクリック → 左にリスト、右にレンダリング済みコンテンツ
- 右ペインで `proposal.md` クリック → 左ペイン変化なし、右ペインのみ切り替わる
- 閉じるボタン → 全幅リスト表示に戻る

---

### D-3: リアルタイム進捗（FR-007）

**`client.ts` の変更**：

```ts
// StepState 型拡張
export interface StepState {
  id: string;
  state: 'done' | 'ready' | 'blocked' | 'skipped' | 'invalid';
}

// refetchInterval 短縮
export function useChanges() {
  return useQuery<ChangeInfo[]>({
    queryKey: ['changes'],
    queryFn: () => get('/changes'),
    refetchInterval: 2000,  // 3000 → 2000
  });
}
```

**`StepProgress.tsx` の変更**：

```ts
const STATE_COLORS: Record<string, string> = {
  done:    'bg-green-500',
  ready:   'bg-blue-400 animate-pulse',   // アニメーション追加
  blocked: 'bg-gray-200 dark:bg-gray-600',
  skipped: 'bg-yellow-300',
  invalid: 'bg-red-400',
};
```

**受け入れ基準（FR-007 Scenario 対応）**：
- CLI でステップが実行される → 2 秒以内にダッシュボードのインジケーターが更新
- `ready` 状態のステップに pulse アニメーションが表示され、`done`・`blocked` と視覚的に区別できる
- ステップ完了後、`ready` の pulse が `done` の緑色マークに切り替わる

## Constitution Check

| 原則 | Phase 0 | Phase 1 |
|------|---------|---------|
| I ステップ独立性 | ✅ | ✅ design は research を読むのみ。実装に依存しない |
| II 決定論的マージ | ✅ | ✅ 変更ファイルが明確で競合なし |
| III 質問駆動の要件確定 | ✅ | ✅ 深リンク・ルート維持・型修正範囲をユーザー確認済み |
| IV 双方向アンカー | ✅ | ✅ アンカーコメントを本ファイル冒頭に記載 |
| V 強制/拡張ステップの分離 | ✅ | ✅ minor モードで proposal / quickstart はスキップ済み |

## Complexity Tracking

None

---

## Self-Review

### Findings

- ⚠️ **FR-007 シナリオが未実装状態を参照している**: Delta Spec の FR-007 Scenario 1・2 は「`in_progress` 状態」を参照しているが、D-3 ではこの状態を型に追加しないことを明示している。実装上は `ready` を「実行中の proxy」として扱う。設計意図は design-rationale.md に文書化済みのため blocker には至らないが、tasks.md で明確化する。

- ⚠️ **`useArtifactContent` の既存性が未明記**: D-2 で `ArtifactViewer` が `useArtifactContent(changeId, relativePath)` を使用すると仕様化しているが、既存フックか新規作成かが不明瞭。実際には `client.ts` に既存（`api/client.ts:72-81`）。実装者向けに明記する。→ `ArtifactViewer` は既存 `useArtifactContent` フックを使用すること（新規作成不要）。

- ⚠️ **`useChange()` の `refetchInterval` 更新が設計に未記載**: `client.ts` には `useChanges()` と `useChange()` の両方に `refetchInterval: 3000` が存在する（research.md 記録済み）が、D-3 は `useChanges()` のみを示している。`ChangeDetail` が `useChange()` を使用する場合、2 秒ポーリング要件が未達成になる。→ `useChange()` も `refetchInterval: 2000` に変更すること。

- (nit) architecture-overview.md シーケンス図で `changeId` props が 1 箇所省略されている → 修正済み。

### Mitigations

- FR-007 シナリオの `in_progress` 参照 → 受け入れ（design-rationale.md に根拠文書化済み）。tasks.md で「`ready` = 実行中 proxy として扱う」を明記。
- `useArtifactContent` → 既存フックと確認済み。上記 Findings に注記追加。
- `useChange()` → Project Structure の「修正対象」に含まれる `client.ts` の更新スコープに含める。

### Verdict

**PASS with notes** — 実装開始可能。`useChange()` の `refetchInterval` 更新を tasks.md に明示的タスクとして含めること。
