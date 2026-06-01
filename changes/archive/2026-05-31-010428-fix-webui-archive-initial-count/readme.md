---
doc_type: Tutorial
---

<!-- @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md -->
<!-- Requirements implemented: FR-005 -->
<!-- Change: revise-artifact-taxonomy -->

# fix-webui-archive-initial-count

> Status: archived
> Created: 2026-05-31
> Mode: bugfix

## Request

WebUI を最初に開いたとき、アーカイブの件数が 0 と表示される不具合がある。
アーカイブボタンをクリックすると正しい件数が表示されるが、画面表示直後から正しい件数を表示するよう修正してほしい。

## Artifacts

- [ ] proposal.md
- [x] specs/<capability>/spec.md (Delta Spec)
- [x] research.md
- [x] design.md / design-rationale.md / architecture-overview.md
- [ ] design-rationale.md
- [ ] quickstart.md
- [x] checklist.md
- [x] tasks.md

## Skipped Steps

<!-- `mspec skip <step-id> --reason "..."` 実行時に追記される -->
<!-- 例: - research: typo 修正のみのため省略 (skipped at 2026-05-14T10:30:00Z) -->

## Summary (Lessons / Next Steps)

### Lessons

- **表示フィルターと集計（件数）は独立したデータソースを持つべき**: 同一配列から表示とカウントを兼用すると、フィルター状態に依存したバグが発生する。`counts.archived` を `useChanges(true)` の並列クエリで分離することで解決した。
- **TDD の赤フェーズで仕様が正確に検出された**: `page.waitForRequest` で `includeArchived=true` の API コールを監視するテストが、修正前は正確に FAIL した。初期表示バグにはネットワークリクエスト監視が有効なテスト手法わん。
- **bugfix モードでのスキップ（proposal/quickstart）は適切だった**: 根本原因が research で判明し、設計は最小変更（2行）で完結。重量ステップを省略しても設計品質に問題なかった。
- **`mspec done <step-id>` が `produces: []` ステップに必要**: self-review と implement は成果物ファイルがないため `mspec validate` だけでは完了マークされない。これは学習として記録に値する。
- **Constitution Check のサンプル値は全アーティファクトで統一すること**: architecture-overview.md のシーケンス図の件数（2）と FR-011 シナリオの GIVEN（3件）が不一致で self-review に指摘された。統一コストは低い。

### Next Steps

- **FR-011 の件数バッジに `data-testid` を追加する**: 現在バッジは `span.mono` クラスで取得しているが、専用 `data-testid="archive-count-badge"` を付与するとテストの堅牢性が上がる。(`change-dashboard` FR-011 関連)
- **アーカイブ件数のポーリング間隔を設定可能にする**: `useChanges(true)` は `refetchInterval: 2000` で常時 2 秒ポーリングする。アーカイブが大量になる環境では間隔を延ばしたい場合がある。(`web-ui-server` FR-004 関連)
