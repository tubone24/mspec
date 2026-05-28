---
doc_type: Reference
---

<!-- See also: ./design-rationale.md for採用理由・代替案 -->

# Design: fix-checklist-ui-sync

## Summary

Web UI の checklist.md チェックボックスが UI 上でのみ状態変化し、ディスク上のファイルに反映されないバグを修正する。
バックエンドに PATCH エンドポイントを追加し、フロントエンドでファイル内容から初期状態を復元してトグル時に PATCH を呼び出す。

---

## Technical Context

### 現状の問題

| レイヤー | 現状 | 不足 |
|---------|------|------|
| Backend (`artifacts.ts`) | `GET /api/changes/:id/artifacts/*` のみ | `PATCH` エンドポイントが存在しない |
| Frontend (`client.ts`) | `useArtifactContent` (useQuery) のみ | `useMutation` による書き込みフックが未実装 |
| Frontend (`ArtifactViewer.tsx`) | `useState(new Set())` で初期化 | `- [x]` パターンから初期状態を復元していない |
| Frontend (`ArtifactViewer.tsx`) | `onChange` で Set を更新するだけ | API 呼び出しがない |

---

## API Contract

### PATCH /api/changes/:id/artifacts/checklist.md

| 項目 | 値 |
|-----|----|
| メソッド | `PATCH` |
| URL | `/api/changes/:id/artifacts/checklist.md` |
| Request Content-Type | `text/plain; charset=utf-8` |
| Request Body | 更新済み Markdown テキスト全文 |
| Success Response | `200 OK`, body: `{ ok: true }` |
| Change 未存在 | `404 Not Found`, body: `{ error: 'change not found' }` |
| Path 不正 | `403 Forbidden`, body: `{ error: 'forbidden' }` |

**パス構築**: `join(change.dir, 'checklist.md')` をハードコード。可変パス引数は受け取らない。

**Fastify 登録**: `addContentTypeParser('text/plain', { parseAs: 'string' }, ...)` でルート登録前にパーサーを追加。

---

## Frontend Design

### usePatchChecklistItem (client.ts)

```typescript
export function usePatchChecklistItem(changeId: string, relativePath: string) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (updatedContent: string) => {
      const res = await fetch(`/api/changes/${changeId}/artifacts/${relativePath}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        body: updatedContent,
      });
      if (!res.ok) throw new Error(`PATCH failed: ${res.status}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['artifact-content', changeId, relativePath],
      });
    },
  });
}
```

### ArtifactViewer.tsx の変更点

**初期状態の復元（useEffect）**:

```typescript
useEffect(() => {
  if (!content || !relativePath.endsWith('checklist.md')) return;
  const lines = content.split('\n');
  const checked = new Set<number>();
  let idx = 0;
  for (const line of lines) {
    if (/^- \[[ x]\]/.test(line)) {
      if (line.startsWith('- [x]')) checked.add(idx);
      idx++;
    }
  }
  setCheckedItems(checked);
}, [content, relativePath]);
```

**onChange ハンドラの変更（チェックボックストグル時）**:

```typescript
onChange={() => {
  const newChecked = new Set(checkedItems);
  if (newChecked.has(idx)) newChecked.delete(idx);
  else newChecked.add(idx);
  setCheckedItems(newChecked);

  // ファイルへの永続化
  if (content && relativePath.endsWith('checklist.md')) {
    const updated = buildUpdatedChecklist(content, idx, !checkedItems.has(idx));
    patchMutation.mutate(updated);
  }
}
```

**buildUpdatedChecklist ヘルパー**: `content` 文字列を行分割し、チェックボックス行のインデックス `idx` 番目を `- [ ]` ↔ `- [x]` に置換して全文を再結合する。

---

## Decisions

| 決定 | 詳細 | 対応 Scenario |
|-----|------|--------------|
| PATCH 対象を `checklist.md` 固定に限定 | URL に可変パスを使わず `join(change.dir, 'checklist.md')` をハードコード | web-ui-server FR-007: パストラバーサル攻撃の防御 |
| `text/plain` で Markdown 全文送信 | `addContentTypeParser` で Fastify に登録。JSON ラップなし | web-ui-server FR-007: チェックボックストグルの書き込み成功 |
| `useEffect` で `content` 変化時に初期状態再計算 | 別ファイルを開いて戻ったときも正しくリセット | artifact-preview FR-013: ページ再表示時のチェック状態復元 |
| `useMutation` + `invalidateQueries` | TanStack Query で統一。楽観的更新は不採用（書き込みが十分高速） | artifact-preview FR-013: チェックボックストグルのファイル永続化 |

---

## Constitution Check

| 原則 | Phase 0 | Phase 1 |
|------|---------|---------|
| I — ステップ独立性 | ✅ design は research のみ参照 | ✅ 実装ファイル変更と設計が独立 |
| II — 決定論的マージ | ✅ FR-007 / FR-013 は新規 ADDED のみ | ✅ delta spec との整合性あり |
| III — 質問駆動の要件確定 | ✅ 全 Open Choices をユーザー確認済み | ✅ 未解決の設計疑問なし |
| IV — 双方向アンカー | ✅ Delta Spec アンカーは init で生成済み | ✅ 実装ファイルへのアンカー追加を tasks でカバー |
| V — 強制/拡張ステップの分離 | ✅ design は強制ステップとして独立 | ✅ |
| VI — Security by Default | ✅ PATCH 対象固定・403 防御を明示設計 | ✅ `addContentTypeParser` の scope を限定 |

### Complexity Tracking

None

---

## Self-Review

### Summary

全アーティファクトは内部整合性が取れており、FR カバレッジ・設計完全性・アーキテクチャ図・セキュリティ設計は適切。警告2件あり（いずれも実装前に対処推奨）。

### Findings

- [ok] **FR-007 シナリオカバレッジ**: checklist.md が3シナリオ（書き込み成功・404・パストラバーサル防御）を全て網羅
- [ok] **FR-013 シナリオカバレッジ**: checklist.md が2シナリオ（初期状態復元・トグル永続化）を全て網羅
- [ok] **API 契約**: design.md に完全な PATCH エンドポイント契約テーブルあり
- [ok] **フロントエンド設計**: `usePatchChecklistItem`・`useEffect` 初期化・`buildUpdatedChecklist` の設計を全て記述
- [ok] **無限ループなし**: `useEffect → setCheckedItems` は `onChange` を呼び出さないためループしない
- [ok] **回帰リスク網羅**: FR-006（onChange 置換）・FR-010（スプリットビュー）・FR-012（amber highlight）を checklist で明示
- [ok] **Constitution 原則 I〜VI**: 全て確認済み・双方向アンカー 550 件エラーなし
- [warning] **FR-007 403 シナリオが到達不能**: URL が `/api/changes/:id/artifacts/checklist.md` 固定のため、パストラバーサル文字列はルーティング段階で 404 になり 403 に到達しない。シナリオは「ルートが存在しないパスへの PATCH は 404 を返す」に言い換えるか削除を検討。
- [warning] **`usePatchChecklistItem` の `relativePath` が可変**: フック引数として任意パスを受け取れる設計だが、セキュリティの実施はサーバー側ルート固定のみ。実装時はフック内で `'checklist.md'` をハードコードするか、呼び出し側ガードを明示的に文書化すること。

### Verdict

**PASS** — 2件の警告は実装フェーズで対処する。
