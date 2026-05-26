---
doc_type: Reference
---

<!-- See also: ./design-rationale.md for採用理由・代替案 -->

# Design: web-ui-enhancements

## Summary

Web UI を3点強化する変更。① `GET /api/changes` にアーカイブフィルターを追加し、フロントエンドで URL クエリパラメータ `?showArchived=true` で制御する。② サーバーサイドで各アーティファクトの `doc_type` を正規表現解析して `ArtifactFile.docType` フィールドとして公開し、フロントエンドの artifact カードを Tailwind カラーで色付けする。③ 新規ルート `/spec-viewer` + `/spec-viewer/:capability` を追加し、`GET /api/specs` / `GET /api/specs/:capability` エンドポイントで `specs/**/spec.md` を一覧・配信する。

## Technical Context

- **フロントエンド**: React 18 + Vite + Tailwind CSS v3 + React Router v6 + TanStack Query + Zustand
- **バックエンド**: Fastify (CLI 内蔵サーバー)、Node.js
- **既存パターン**: CSS Grid (`grid-cols-[280px_1fr]`) でスプリットビュー実装済み（ChangeDetail.tsx:53）
- **既存インフラ**: `projectPaths.specsDir`（`<root>/specs`）、`ChangeLocation.isArchived`、`listChanges({ includeArchived })`、`ArtifactViewer` コンポーネント（react-markdown 再利用可能）

## Project Structure

### 変更対象ファイル

| ファイル | 操作 | 概要 |
|----------|------|------|
| `packages/cli/src/server/routes/changes.ts` | 修正 | `?includeArchived=true` クエリ対応 + `isArchived` フィールドをレスポンスに追加 |
| `packages/cli/src/server/routes/artifacts.ts` | 修正 | `collectArtifacts` に `doc_type` 正規表現解析を追加し `docType` フィールドを返す |
| `packages/cli/src/server/routes/specs.ts` | 新規 | `GET /api/specs` と `GET /api/specs/:capability` エンドポイント |
| `packages/cli/src/server/index.ts` | 修正 | `registerSpecsRoutes` の登録 |
| `packages/web-ui/src/api/client.ts` | 修正 | `ChangeInfo.isArchived` + `ArtifactFile.docType` 型追加 + `useChanges(showArchived)` 引数 + `useSpecs()` / `useSpecContent()` フック |
| `packages/web-ui/src/pages/Dashboard.tsx` | 修正 | `useSearchParams` でアーカイブフィルタートグル + アーカイブ行グレーアウト |
| `packages/web-ui/src/pages/ChangeDetail.tsx` | 修正 | 各 artifact カードに `docTypeColor()` 関数由来の Tailwind クラス付与 |
| `packages/web-ui/src/pages/SpecViewer.tsx` | 新規 | CSS Grid スプリットビューで capability 一覧 + Markdown レンダリング |
| `packages/web-ui/src/router/index.tsx` | 修正 | `/spec-viewer` と `/spec-viewer/:capability` ルート追加 |
| `packages/web-ui/src/i18n/en.ts` | 修正 | `specViewer.*` + `dashboard.showArchived` 翻訳キー追加 |

## Decisions

### D1 — アーカイブフィルター（FR-008 対応）

**API 変更**:
```
GET /api/changes?includeArchived=true
```
- `changes.ts:29`: `listChanges(paths, { includeArchived: req.query.includeArchived === 'true' })`
- レスポンス全件に `isArchived: c.isArchived` を追加（フィルター ON/OFF に関わらず常に返す）

**フロントエンド変更**:
```typescript
// client.ts
export function useChanges(showArchived = false) {
  return useQuery<ChangeInfo[]>({
    queryKey: ['changes', showArchived],
    queryFn: () => get(`/changes${showArchived ? '?includeArchived=true' : ''}`),
    refetchInterval: 2000,
  });
}
```

```typescript
// Dashboard.tsx — URL state で永続化
const [searchParams, setSearchParams] = useSearchParams();
const showArchived = searchParams.get('showArchived') === 'true';
const { data: changes } = useChanges(showArchived);
```

アーカイブトグルボタン: `data-testid="filter-archived"`, `<ModeFilter />` の下に独立配置。

**受け入れ基準** (FR-008 Scenario 対応):
- Scenario「デフォルト状態でアーカイブ済みチェンジが非表示」: URL に `?showArchived` なし → `includeArchived=false` → アーカイブ行ゼロ
- Scenario「フィルターを有効にするとアーカイブ済みチェンジが表示される」: `?showArchived=true` → アーカイブ行に `opacity-60 italic` + 「アーカイブ済み」バッジ

### D2 — SoT Spec ビューアー（FR-009 対応）

**新規 API**:
```
GET /api/specs           → SpecCapability[]   (例: [{capability:"change-dashboard"}, ...])
GET /api/specs/:capability → (raw text of specs/<capability>/spec.md)
```

```typescript
// specs.ts — パストラバーサル防止
// path.sep を付けることで specs-evil 等の隣接ディレクトリへの混同を防ぐ
const fullPath = join(paths.specsDir, capability, 'spec.md');
if (!fullPath.startsWith(paths.specsDir + path.sep)) return reply.code(403).send({ error: 'forbidden' });
```

**ルーティング**:
```
/spec-viewer                → SpecViewer（capability 未選択）
/spec-viewer/:capability    → SpecViewer（capability 選択済み、右ペインにレンダリング）
```

**レイアウト**: CSS Grid `grid-cols-[240px_1fr]`（ChangeDetail と同じパターン）。左ペインは capability リスト、右ペインは `<ArtifactViewer>` 相当の Markdown レンダリング。

**ナビゲーション**: Dashboard ヘッダーに「Spec Viewer」リンク（`<Link to="/spec-viewer">`）を追加。

**受け入れ基準** (FR-009 Scenario 対応):
- Scenario「SoT Spec 一覧が表示される」: `GET /api/specs` が全 capability 名の配列を返す → 左ペインに一覧表示
- Scenario「capability を選択すると spec 内容がレンダリングされる」: クリック → URL が `/spec-viewer/change-dashboard` に変わり → `GET /api/specs/change-dashboard` → Markdown レンダリング

### D3 — DockType 色付け（FR-011 対応）

**サーバー側**: `collectArtifacts` でファイル内容を読み込み、正規表現 `/^doc_type:\s*(.+)$/m` で `doc_type` を抽出して `docType` フィールドを追加。`.agent-runs.jsonl` 等の非 MD ファイルは `docType: undefined`。

**色パレット（純関数）**:
```typescript
// ChangeDetail.tsx
function docTypeColor(docType?: string): string {
  switch (docType) {
    case 'Reference':   return 'bg-blue-50 border-l-4 border-blue-300 dark:bg-blue-950 dark:border-blue-700';
    case 'Explanation': return 'bg-purple-50 border-l-4 border-purple-300 dark:bg-purple-950 dark:border-purple-700';
    case 'How-to':      return 'bg-green-50 border-l-4 border-green-300 dark:bg-green-950 dark:border-green-700';
    case 'Tutorial':    return 'bg-yellow-50 border-l-4 border-yellow-300 dark:bg-yellow-950 dark:border-yellow-700';
    default:            return 'bg-gray-50 border-l-4 border-gray-200 dark:bg-gray-800 dark:border-gray-600';
  }
}
```

**受け入れ基準** (FR-011 Scenario 対応):
- Scenario「Reference アーティファクトが青系色でハイライト」: `tasks.md` (doc_type: Reference) → `bg-blue-50 border-blue-300`
- Scenario「各 DockType に異なる色が割り当て」: 4 種類が全て異なる色クラスを持つ
- Scenario「doc_type 未設定はグレー表示」: frontmatter なし → `bg-gray-50 border-gray-200`

## Data Models

### `ChangeInfo`（拡張後）
```typescript
interface ChangeInfo {
  id: string;
  name: string;
  createdAt: string;
  mode: 'typo' | 'minor' | 'bugfix' | 'full';
  currentStep: string;
  steps: StepState[];
  isArchived: boolean;   // ← 新規追加
}
```

### `ArtifactFile`（拡張後）
```typescript
interface ArtifactFile {
  name: string;
  relativePath: string;
  type: 'markdown' | 'html' | 'json' | 'xml' | 'other';
  docType?: 'Reference' | 'Explanation' | 'How-to' | 'Tutorial';  // ← 新規追加
}
```

### `SpecCapability`（新規）
```typescript
interface SpecCapability {
  capability: string;
}
```

## Constitution Check

| 原則 | Phase 0 | Phase 1 |
|------|---------|---------|
| I. ステップ独立性 | ✅ design は research を読むのみ | ✅ tasks は design を読み実装する |
| II. 決定論的マージ | ✅ FR-008/009/011 は ADDED のみ | ✅ 既存 FR 変更なし |
| III. 質問駆動 | ✅ Open Choices はすべて解決済み | ✅ 未解決項目なし |
| IV. 双方向アンカー | ✅ 実装時に `@mspec-delta` を付与 | ✅ tasks.md の各タスクに FR 番号を記載 |
| V. 強制/拡張分離 | ✅ design は強制ステップ | ✅ 拡張機能（SpecViewer）も tasks に分離 |
| VI. Security by Default | ✅ パストラバーサル防止を設計に明記（self-review で `path.sep` 付与に修正済み） | ✅ `fullPath.startsWith(specsDir + path.sep)` チェック必須 |

### Complexity Tracking

None

## Self-Review

### Summary

3機能（FR-008 アーカイブフィルター・FR-009 SoT Spec ビューアー・FR-011 DockType 色付け）の成果物は全体的に良質で、シーケンス図・Constitution Check・checklist の対応関係も整合している。ただし self-review 時点で2件の blocker を検出し、いずれも修正完了した。

### Findings

#### [blocker] `GET /api/specs` レスポンス形式が成果物間で矛盾していた → **修正済み**

D2 セクションと Data Models・architecture-overview.md の間で `{ capabilities: string[] }` と `SpecCapability[]` が混在していた。`SpecCapability[]`（オブジェクト配列）に統一し、D2 の API 仕様行を修正した。

#### [blocker] パストラバーサルチェックが隣接ディレクトリに対してバイパス可能だった → **修正済み**

`fullPath.startsWith(paths.specsDir)` は `specs-evil` のような隣接パスにも `true` を返すため、`startsWith(paths.specsDir + path.sep)` に修正した。checklist.md の該当項目も更新済み。

#### [warning] FR-009・FR-011 に E2E テスト FR が存在しない

既存機能（FR-005/006、FR-006/007/008）はすべて Playwright E2E FR を持つが、今回の新機能には追加していない。tasks ステップで E2E テストタスクを追加することで対処する。

#### [warning] `quickstart.md` が存在しない

quickstart ステップがスキップされているため readme.md の Skipped Steps セクションに記載すべきだが、ワークフロー上は `state: skipped` のため実装への影響なし。

#### [note] `useSpecs()` / `useSpecContent()` のフック仕様が未詳細

`useChanges()` と同パターンで実装可能なため blocker ではないが、tasks.md で明示的に仕様を記載することを推奨する。

### Verdict

**PASS WITH WARNINGS**（blocker 2件を修正済みのため実装開始可能。warning は tasks.md で対処する）
