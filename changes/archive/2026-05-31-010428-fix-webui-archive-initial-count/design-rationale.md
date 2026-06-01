---
doc_type: Explanation
---

<!-- See also: ./design.md -->

# Design Rationale: fix-webui-archive-initial-count

## Context

mspec WebUI のダッシュボードには、アーカイブ済みチェンジの件数を表示するバッジが存在する。このバッジは初期表示時に常に「0」となり、ユーザーがアーカイブフィルタートグルをクリックするまで正しい値が表示されない。

バグの原因は、件数計算に使う `changes` 配列がフィルター状態に依存しているという設計上の問題にある。初期状態では `useChanges(false)` が呼ばれ、返却されるデータにアーカイブ済みアイテムが含まれないため、`changes.filter(c => c.isArchived).length` が常に 0 になる。

表示フィルターと集計（件数）は本質的に独立した責務であるため、両者のデータソースを分離する必要がある。

## Decisions

### 並列クエリによる件数データ分離（D-01）

表示リスト用クエリ（`useChanges(includeArchived)`）とは別に、件数計算専用の並列クエリ（`useChanges(true)`）を常時実行することにした。

`useChanges` は `queryKey: ['changes', showArchived]` を持つため、`useChanges(false)` と `useChanges(true)` はキャッシュが独立している。同一コンポーネントで両者を同時に呼び出しても無駄なリクエストは発生せず、それぞれが独立した `refetchInterval: 2000` を持つ。

既存の表示フィルターロジック（`includeArchived = statusFilter === 'archived'`）は一切変更しない。影響範囲を最小限に留めるため、counts オブジェクトの `archived` プロパティだけデータソースを切り替える。

## Alternatives Considered

- **Approach A: 専用 API エンドポイント `GET /api/changes/archived/count`**  
  バックエンドに count 専用のエンドポイントを追加する案。正確なカウントのみ返すため転送量が少ないが、バックエンド変更が必要でスコープが広がる。シンプルなバグ修正として過剰。

- **Approach B: 常に `includeArchived=true` でフェッチしてフロントエンドでフィルター**  
  `useChanges` を常時 `true` で呼び出し、表示リストをフロントエンドでフィルタリングする案。変更行数が最小だが、アーカイブが大量にある場合の転送量が増加する。また既存の表示ロジックを大きく変更する必要があり、意図せぬ副作用リスクがある。

## Trade-offs

- 並列クエリにより `GET /api/changes?includeArchived=true` が常時 2 秒間隔で実行される。アーカイブが増えると返却データ量が増加するが、ローカルサーバー用途のため許容範囲内。
- 件数専用クエリと表示用クエリの 2 つが独立して動くため、稀に件数バッジとリスト表示の間で 1 ポーリングサイクル（約 2 秒）分の差が生じる可能性があるが、ユーザー体験上の問題にはならない。

## Rejected Options

- **バックエンド変更（Approach A）**: bugfix スコープとして過剰。フロントエンドのみで解決可能。
- **全データ常時取得（Approach B）**: 既存の表示フィルター責務の分離が崩れる。大量アーカイブ時のパフォーマンス懸念あり。
