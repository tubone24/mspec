---
doc_type: How-to
---

# Tasks: web-ui-viewer-improvements

## Phase 1: Setup

### Task 1.1 — @tailwindcss/typography をインストールする

`packages/web-ui/` で `@tailwindcss/typography` を devDependencies に追加する。

```
pnpm add -D @tailwindcss/typography --filter @mspec/web-ui
```

- [ ] `packages/web-ui/package.json` の devDependencies に `@tailwindcss/typography` が追加されていること
- [ ] `pnpm install` が成功し lockfile が更新されること

---

## Phase 2: Foundational

### Task 2.1 — ArtifactViewer 共有コンポーネントを作成する

`packages/web-ui/src/components/ArtifactViewer.tsx` を新規作成する。`ArtifactPreview.tsx` の rendering ロジック（ReactMarkdown + MermaidRenderer + GherkinHighlight + PrototypeIframe）を抽出して移す。

```typescript
interface ArtifactViewerProps {
  changeId: string;
  relativePath: string;
  onClose?: () => void;
}
```

- `useArtifactContent(changeId, relativePath)` は既存フックを使用する（`client.ts:72–81`）
- `className="prose dark:prose-invert max-w-none"` を `ArtifactViewer` に引き継ぐ
- `data-testid="md-preview"` を維持する
- `onClose` が渡された場合は右上に閉じるボタンを表示する

```
anchor:
  @mspec-delta 2026-05-25-062234-web-ui-viewer-improvements/specs/artifact-preview/spec.md
  Requirements implemented: FR-009, FR-010
  Change: web-ui-viewer-improvements
```
<!-- verify: fr-009 -->

---

### Task 2.2 — StepState 型に skipped / invalid を追加する

`packages/web-ui/src/api/client.ts` の `StepState` インターフェースを修正する。

```typescript
// Before
export interface StepState {
  id: string;
  state: 'done' | 'ready' | 'blocked';
}

// After
export interface StepState {
  id: string;
  state: 'done' | 'ready' | 'blocked' | 'skipped' | 'invalid';
}
```

```
anchor:
  @mspec-delta 2026-05-25-062234-web-ui-viewer-improvements/specs/change-dashboard/spec.md
  Requirements implemented: FR-007
  Change: web-ui-viewer-improvements
```
<!-- verify: fr-007 -->

---

### Task 2.3 — refetchInterval を 2000 ms に変更する

`packages/web-ui/src/api/client.ts` の `useChanges()` と `useChange()` 両方の `refetchInterval` を 2000 ms に変更する。

```typescript
// useChanges()
refetchInterval: 2000,   // 3000 → 2000

// useChange()
refetchInterval: 2000,   // 3000 → 2000
```

```
anchor:
  @mspec-delta 2026-05-25-062234-web-ui-viewer-improvements/specs/change-dashboard/spec.md
  Requirements implemented: FR-007
  Change: web-ui-viewer-improvements
```
<!-- verify: fr-007 -->

---

## Phase 3: User Story（TDD — E2E red → green）

### Task 3.1 — [E2E RED] FR-009: Markdown 見出しレンダリングの失敗テストを書く

Playwright E2E テストを書く。プレビューで `design.md` を開いたとき、H1・H2 が視覚的に階層化されて表示されることを検証する。タスク 3.2 の実装前は RED（失敗）であること。

- テストファイル: `packages/web-ui/e2e/artifact-preview.spec.ts`（既存ファイルに追記または新規作成）
- アサーション例: `expect(heading).toHaveCSS('font-size', ...)` または `toHaveClass(/text-\d+xl/)`

```
anchor:
  @mspec-delta 2026-05-25-062234-web-ui-viewer-improvements/specs/artifact-preview/spec.md
  Requirements implemented: FR-009
  Change: web-ui-viewer-improvements
```
<!-- verify: fr-009 -->

---

### Task 3.2 — [実装] FR-009: typography プラグインを有効化して ArtifactPreview を ArtifactViewer に委譲する

1. `packages/web-ui/tailwind.config.ts` を修正する：

```typescript
import typography from '@tailwindcss/typography';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: { extend: {} },
  plugins: [typography],
} satisfies Config;
```

2. `packages/web-ui/src/pages/ArtifactPreview.tsx` を修正し、rendering ロジックを `ArtifactViewer` に委譲する（ルート `/changes/:id/artifacts/*` は維持）。

実装後に Task 3.1 の E2E が GREEN になること。

```
anchor:
  @mspec-delta 2026-05-25-062234-web-ui-viewer-improvements/specs/artifact-preview/spec.md
  Requirements implemented: FR-009
  Change: web-ui-viewer-improvements
```
<!-- verify: fr-009 -->

---

### Task 3.3 — [E2E RED] FR-010: スプリットビューの失敗テストを書く

Playwright E2E テストを書く。ChangeDetail でアーティファクトをクリックしたとき：
1. URL が変わらない
2. 左ペインにアーティファクト一覧が残っている
3. 右ペインにコンテンツが表示される
4. 閉じるボタンで右ペインが消える

タスク 3.4 の実装前は RED（失敗）であること。

```
anchor:
  @mspec-delta 2026-05-25-062234-web-ui-viewer-improvements/specs/artifact-preview/spec.md
  Requirements implemented: FR-010
  Change: web-ui-viewer-improvements
```
<!-- verify: fr-010 -->

---

### Task 3.4 — [実装] FR-010: ChangeDetail にスプリットビューレイアウトを実装する

`packages/web-ui/src/pages/ChangeDetail.tsx` を修正する：

1. `useState<string | null>(null)` で `selectedArtifact` 状態を追加する
2. アーティファクト一覧の `<Link>` を `<button onClick>` に変更する（ページ遷移なし）
3. `selectedArtifact` が非 null の場合 `grid grid-cols-[280px_1fr]` レイアウトに切り替える
4. 右ペインに `<ArtifactViewer changeId={id} relativePath={selectedArtifact} onClose={() => setSelectedArtifact(null)} />` を表示する
5. 再クリックで `selectedArtifact(null)` に戻す

実装後に Task 3.3 の E2E が GREEN になること。

```
anchor:
  @mspec-delta 2026-05-25-062234-web-ui-viewer-improvements/specs/artifact-preview/spec.md
  Requirements implemented: FR-010
  Change: web-ui-viewer-improvements
```
<!-- verify: fr-010 -->

---

### Task 3.5 — [E2E RED] FR-007: animate-pulse アニメーションの失敗テストを書く

Playwright E2E テストを書く。`ready` 状態のステップに `animate-pulse` クラスが付与されていることを検証する。`skipped` と `invalid` の色が `blocked` と異なる色になっていることも確認する。

タスク 3.6 の実装前は RED（失敗）であること。

```
anchor:
  @mspec-delta 2026-05-25-062234-web-ui-viewer-improvements/specs/change-dashboard/spec.md
  Requirements implemented: FR-007
  Change: web-ui-viewer-improvements
```
<!-- verify: fr-007 -->

---

### Task 3.6 — [実装] FR-007: StepProgress を更新してリアルタイム進捗を表示する

`packages/web-ui/src/components/StepProgress.tsx` を修正する：

```typescript
const STATE_COLORS: Record<string, string> = {
  done:    'bg-green-500',
  ready:   'bg-blue-400 animate-pulse',
  blocked: 'bg-gray-200 dark:bg-gray-600',
  skipped: 'bg-yellow-300',
  invalid: 'bg-red-400',
};
```

実装後に Task 3.5 の E2E が GREEN になること。

```
anchor:
  @mspec-delta 2026-05-25-062234-web-ui-viewer-improvements/specs/change-dashboard/spec.md
  Requirements implemented: FR-007
  Change: web-ui-viewer-improvements
```
<!-- verify: fr-007 -->

---

## Phase 4: Polish

### Task 4.1 — 全 Playwright E2E スイートを実行してリグレッションを確認する

```
pnpm --filter @mspec/web-ui test:e2e
```

チェックリスト HIGH RISK 項目を確認する：

- [ ] ⚠️ `artifact-preview FR-001`: `ArtifactViewer` リファクタリング後も `prose` クラスが引き継がれて Markdown が正常レンダリングされること
- [ ] ⚠️ `artifact-preview FR-002`: Mermaid `data-testid="mermaid-svg"` が ArtifactViewer 後も描画されること
- [ ] ⚠️ `artifact-preview FR-006`: E2E `[data-testid="mermaid-svg"] svg` セレクターが通過すること
- [ ] ⚠️ `change-dashboard FR-005`: STATE_COLORS 変更後も E2E ダッシュボード表示確認が通過すること

```
anchor:
  @mspec-delta 2026-05-25-062234-web-ui-viewer-improvements/specs/artifact-preview/spec.md
  Requirements implemented: FR-009, FR-010
  Change: web-ui-viewer-improvements
```
<!-- verify: human -->

---

### Task 4.2 — TypeScript ビルドエラーがないことを確認する

```
pnpm --filter @mspec/web-ui build
```

- [ ] TypeScript コンパイルエラーなし
- [ ] Vite ビルドが成功すること（`web-ui-server FR-001` リグレッション防止）

---

## Constitution Check

| 原則 | Phase 0 | 評価 |
|------|---------|------|
| I ステップ独立性 | ✅ | tasks.md は design.md・checklist.md を読むのみ。実装に依存しない |
| II 決定論的マージ | ✅ | 各タスクに FR-ID と anchor ブロックを付与。追跡可能 |
| III 質問駆動の要件確定 | ✅ | useChange() の refetchInterval 更新を self-review で確定済み |
| IV 双方向アンカー | ✅ | 全実装タスクに `@mspec-delta` anchor ブロックを付与 |
| V 強制/拡張ステップの分離 | ✅ | minor モードで proposal / quickstart をスキップ |
