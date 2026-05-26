---
doc_type: Tutorial
---

<!-- @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md -->
<!-- Requirements implemented: FR-005 -->
<!-- Change: revise-artifact-taxonomy -->

# web-ui-viewer-improvements

> Status: in-progress
> Created: 2026-05-25
> Mode: minor

## Request

Web UI のアーティファクト閲覧 UX を 3 点改善する。①アーティファクト表示画面で Markdown の見出し・書式を正しくレンダリングする。②アーティファクトをクリックした際にリスト表示を維持しつつ、右ペインのエディター風フレームでドキュメントを読みやすく表示するスプリットビュー UI を実装する。③ステップ実行中にリアルタイムで進捗が反映され、画面描画が逐次更新されるようにする。

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

- **根本原因は設定 1 行**：Markdown が崩れていた原因は `tailwind.config.ts` の `plugins: []` で `@tailwindcss/typography` が未登録だったこと。既存の `prose` クラスはすでに正しく書かれており、プラグイン追加だけで即座に修正できた。
- **スタイル CSS の stale 問題**：Playwright E2E でフォントサイズが期待値を下回った失敗は、`reuseExistingServer` が古い dev server（typography 追加前の CSS）を再利用したことが原因。サーバー再起動で解消。本番 CI では問題が起きにくいが、ローカル開発では意識が必要。
- **セルフレビューが実装ギャップを検出**：`useChange()` の `refetchInterval` 更新漏れと `useArtifactContent` が既存フックか未検証という 2 点を self-review サブエージェントが発見した。設計段階でのリストアップよりも、独立したレビューパスの方が見落としに強い。
- **FR-007 シナリオと実装の意図的乖離**：Delta Spec に `in_progress` 状態が記述されていたが、CLI の state-engine がステートレスであるため型追加は無意味と判断し `ready` を proxy として採用。設計判断を design-rationale.md に文書化することでシナリオと実装の乖離を受け入れ可能にした。
- **ArtifactViewer 抽出でルート維持が重要**：スプリットビュー実装で rendering ロジックを `ArtifactViewer` に抽出したが、既存の `/changes/:id/artifacts/*` ルートは削除せず維持した。ユーザー確認の結果「残す」を選択し、URL 直接アクセスの利便性を保てた。

### Next Steps

- **CLI 側に `in_progress` 状態を追加する**：state-engine がステップ実行中を追跡する lock ファイル/heartbeat 機構を実装すれば、FR-007 シナリオを文字通り満たせる。（関連: change-dashboard FR-007）
- **`StepState` 型の `skipped`/`invalid` 表示を E2E テストに追加する**：今回は STATE_COLORS を追加したが、skipped/invalid のステップが存在するチェンジを使った E2E テストシナリオが未作成。（関連: change-dashboard FR-007）
- **スプリットビューのリサイズ対応**：今回は固定 `grid-cols-[280px_1fr]` で実装。ユーザーが左ペイン幅を調整できる `react-resizable-panels` の導入は今回スコープ外とした。（関連: artifact-preview FR-010）
