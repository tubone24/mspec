---
doc_type: Reference
---

<!-- See also: ./design-rationale.md for採用理由・代替案 -->

# Design: fix-webui-archive-initial-count

## Summary

`Dashboard.tsx` に常時実行の並列クエリ `useChanges(true)` を追加し、アーカイブ件数の計算ソースをメインリストのデータセットから分離する。変更対象は1ファイル2箇所のみ。

## Technical Context

| 項目 | 現状 | 修正後 |
|------|------|--------|
| アーカイブ件数ソース | `changes.filter(c => c.isArchived)` | `allChanges.filter(c => c.isArchived)` |
| `allChanges` データ取得 | なし | `useChanges(true)` 並列クエリ（常時実行） |
| メインリストクエリ | `useChanges(includeArchived)` | 変更なし |
| API エンドポイント | 変更なし | 変更なし |
| バックエンド | 変更なし | 変更なし |

**影響ファイル**:
- `packages/web-ui/src/pages/Dashboard.tsx` — 並列クエリ追加・counts 計算修正
- `packages/web-ui/src/api/client.ts` — 変更なし（既存 `useChanges` フックをそのまま使用）

## Project Structure

```
packages/web-ui/src/
├── api/
│   └── client.ts          # useChanges(showArchived?) フック（変更なし）
└── pages/
    └── Dashboard.tsx      # 修正対象
        ├── line 76: includeArchived 判定
        ├── line 77: useChanges(includeArchived)  ← メインリスト用（変更なし）
        ├── line 77a: useChanges(true)            ← 追加: 件数専用クエリ
        └── line 85: counts.archived              ← 修正: allChanges を使う
```

## Decisions

### D-01: 並列クエリによる件数データ分離

`counts.archived` の計算に使う配列を `changes`（フィルター依存）から `allChanges`（常に archived 込み）に切り替える。

**受け入れ基準（FR-011 Scenario 対応）**:

| Scenario | GIVEN | WHEN | THEN |
|----------|-------|------|------|
| 初期ロード時に件数が表示される | `changes/archive/` に 3 件存在 | ダッシュボード初期表示 | `counts.archived = 3` がレンダリングに反映される |
| アーカイブ 0 件で 0 が表示される | `changes/archive/` が空 | ダッシュボード初期表示 | `counts.archived = 0` が表示される |

### D-02: 既存 `useChanges` フックを再利用

新 API エンドポイントは作成しない。`useChanges(true)` を追加呼び出しするだけで要件を満たせるため、バックエンド変更ゼロで実現する。

### D-03: メインリストのクエリ・フィルターロジックは無変更

`includeArchived = statusFilter === 'archived'` と `useChanges(includeArchived)` のロジックはそのまま維持し、表示リストの挙動を変えない。

## Constitution Check

| 原則 | Phase 0 | Phase 1 | 備考 |
|------|---------|---------|------|
| I. ステップ独立性 | ✅ | ✅ | design は research のみ参照 |
| II. 決定論的マージ | ✅ | ✅ | 変更箇所が限定的で衝突リスクなし |
| III. 質問駆動の要件確定 | ✅ | ✅ | Open Choices なし |
| IV. 双方向アンカー | ✅ | ✅ | アンカーは tasks.md で付与予定 |
| V. 強制/拡張ステップの分離 | ✅ | ✅ | bugfix モードで適切にスキップ済み |
| VI. Security by Default | ✅ | ✅ | 読み取り専用 API 呼び出しのみ。認証変更なし |
| VII. 設計意図と実装の対応確認 | ✅ | ✅ | D-01 が FR-011 と 1:1 対応 |

### Complexity Tracking

None.

## Self-Review

### Summary

全アーティファクトを独立評価した結果、変更の技術チェーンは正しく完結している。FR-011 の 2 つの Delta Spec シナリオはいずれも `checklist.md` と受け入れ基準テーブルに反映されており、`architecture-overview.md` には Mermaid システム図とシーケンス図の 2 枚が存在する。バックエンドの `isArchived` フラグは `change-discovery.ts` 内で明示的に設定されており、`カウント精度` チェック項目の前提は実コードで確認済み。ブロッカーなし。

### Findings

#### [nit]: architecture-overview.md シーケンス図のアーカイブ件数が FR-011 シナリオと不一致 → 修正済み

`counts.archived = allChanges.filter(isArchived).length = 2` を `= 3` に修正（FR-011 シナリオの GIVEN「3 件存在」に統一）。

#### [nit]: Mermaid ノードラベルの `\n` 改行記法

システム図で `\n` を使用。レンダラーによって `<br/>` が推奨されるが、mspec WebUI での表示に問題がないため許容。

#### [suggestion]: 変数名を `allChanges` に統一 → 適用済み

`research.md` の `allChangesForCount` を `allChanges` に統一。`design.md`・`architecture-overview.md` と一致させた。

### Constitution Re-Evaluation

| 原則 | 独立再評価 | 判定差異 |
|------|-----------|---------|
| I. ステップ独立性 | ✅ | なし |
| II. 決定論的マージ | ✅ | なし。ADDED のみ、衝突なし |
| III. 質問駆動の要件確定 | ✅ | Open Choices なし |
| IV. 双方向アンカー | ✅ (tasks で確認予定) | ⏳ のまま正しい |
| V. 強制/拡張ステップの分離 | ✅ | bugfix モードで proposal/quickstart スキップ済み |
| VI. Security by Default | ✅ | 追加クエリは読み取り専用 |
| VII. 設計意図と実装の対応確認 | ✅ | FR-011 ↔ D-01 ↔ シナリオテーブルの 1:1 対応確認済み |

### Verdict

**PASS WITH WARNINGS** — ブロッカーなし。nit 2 件はすべて修正適用済み。
