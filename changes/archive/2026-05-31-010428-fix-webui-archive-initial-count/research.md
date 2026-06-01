# Research: fix-webui-archive-initial-count

## Decisions

- **アーカイブ件数はメインリストのデータセットとは独立して取得する**。  
  `useChanges(false)` （デフォルト）が返す配列にはアーカイブ済みアイテムが含まれないため、同配列から `isArchived` フィルターを掛けても常に 0 になる。件数表示専用の並列クエリ (`useChanges(true)`) を追加することで、フィルター状態に関わらず正しい件数を初期表示できる。

- **バックエンドの新エンドポイントは不要**。既存の `GET /api/changes?includeArchived=true` を常時バックグラウンドで呼び出す方式（Approach C）が最小差分で実現可能。

- **メインリストのデータフロー（表示フィルター）は変更しない**。  
  `includeArchived = statusFilter === 'archived'` と `useChanges(includeArchived)` の組み合わせはそのまま維持し、件数計算だけデータソースを分離する。

## Web References

- React Query (`@tanstack/react-query`) の並列クエリパターン:  
  同一コンポーネント内で複数の `useQuery` を呼び出すことは公式サポートされており、それぞれ独立したキャッシュエントリを持つ。  
  参考: https://tanstack.com/query/latest/docs/framework/react/guides/parallel-queries

## Codebase Findings

### バグ箇所

| ファイル | 行 | 内容 |
|----------|-----|------|
| `packages/web-ui/src/pages/Dashboard.tsx` | 56-59 | `statusFilter` 初期値 `'all'` → `includeArchived = false` |
| `packages/web-ui/src/pages/Dashboard.tsx` | 76 | `const includeArchived = statusFilter === 'archived'` |
| `packages/web-ui/src/pages/Dashboard.tsx` | 85 | `archived: changes.filter((c) => c.isArchived).length` ← **常に 0** |
| `packages/web-ui/src/api/client.ts` | 79-85 | `useChanges(showArchived)` — false 時は archived 除外 |

### データフロー（初期ロード時）

```
statusFilter = 'all'
  → includeArchived = false
  → useChanges(false) → GET /api/changes (no ?includeArchived)
  → API: listChanges({ includeArchived: false })
  → 返却: アーカイブ済みチェンジを含まない配列
  → counts.archived = changes.filter(c => c.isArchived).length = 0
```

### データフロー（アーカイブボタンクリック後）

```
statusFilter = 'archived'
  → includeArchived = true
  → useChanges(true) → GET /api/changes?includeArchived=true
  → API: listChanges({ includeArchived: true })
  → 返却: アーカイブ済みチェンジを含む配列
  → counts.archived = changes.filter(c => c.isArchived).length = 正しい件数
```

### バックエンド（問題なし）

| ファイル | 行 | 内容 |
|----------|-----|------|
| `packages/cli/src/server/routes/changes.ts` | 29-66 | `GET /api/changes` — `includeArchived` クエリ引数を正しく処理 |
| `packages/cli/src/lib/change-discovery.ts` | 27-54 | `listChanges()` — `includeArchived` フラグで archive ディレクトリを条件付き読み込み |

### 推奨修正（Approach C）

`Dashboard.tsx` に `useChanges(true)` の並列クエリを追加し、`counts.archived` の計算ソースとして使用する:

```typescript
// 既存クエリ（フィルター表示用）
const { data: changes = [] } = useChanges(includeArchived);

// 件数専用クエリ（常時 archived を含む）
const { data: allChanges = [] } = useChanges(true);

const counts = useMemo(() => ({
  inProgress: changes.filter(isInProgress).length,
  ready:      changes.filter(isReady).length,
  shipped:    changes.filter((c) => isShipped(c) && !c.isArchived).length,
  archived:   allChangesForCount.filter((c) => c.isArchived).length,  // ← 修正
}), [changes, allChangesForCount]);
```

`useChanges` は `refetchInterval: 2000` を持つため、2 秒ごとに件数が更新される。

## Open Choices

なし。修正アプローチは Approach C で確定。

## Constitution Check (Phase 0)

| 原則 | 評価 |
|------|------|
| **I. ステップ独立性** | ✅ research は delta spec を参照するのみ。実装依存なし |
| **II. 決定論的マージ** | ✅ FR-011 の ADDED のみ。既存 FR との競合なし |
| **III. 質問駆動の要件確定** | ✅ 修正アプローチが明確。Open Choices なし |
| **IV. 双方向アンカー** | ✅ 実装アンカーは implement ステップで付与予定 |
| **V. 強制ステップと拡張ステップの分離** | ✅ bugfix モードで quickstart/proposal がスキップされており適切 |
| **VI. Security by Default** | ✅ 変更範囲はフロントエンドの読み取りクエリのみ。認証・認可への影響なし |
| **VII. 設計意図と実装の対応確認** | ✅ FR-011「初期ロード時にアーカイブ件数を表示」と修正内容が 1:1 対応 |
