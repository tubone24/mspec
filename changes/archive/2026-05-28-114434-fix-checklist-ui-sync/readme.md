---
doc_type: Tutorial
---

<!-- @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md -->
<!-- Requirements implemented: FR-005 -->
<!-- Change: revise-artifact-taxonomy -->

# fix-checklist-ui-sync

> Status: new
> Created: 2026-05-28
> Mode: bugfix

## Request

Web UI の checklist.md ビューでチェックボックスをクリックしても、実際の `checklist.md` ファイルに変更が反映されない。
UI 上でチェック操作を行った際に、対応する `checklist.md` ファイルを書き換えて永続化するよう修正する。

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

- **ReactMarkdown は `components` prop 変更を無視する**: `children`（markdown テキスト）が変化しない場合、`components` prop を更新しても `input` 等のカスタムレンダラーが再呼び出されない。`key` prop による強制再マウントや `event.target.getAttribute('data-idx')` による DOM 直接読み取りで回避できた。
- **`useRef` カウンタは React 18 concurrent mode で危険**: `checkboxCounter.current = 0` を render 冒頭で設定しても、SchedulerAPI の割り込みやバッチ処理でカウンタがずれる場合がある。DOM の `data-idx` 属性に正規インデックスを保持し `event.target` から読む方式がより堅牢。
- **Playwright `waitForResponse` vs `waitForTimeout`**: 非同期 PATCH + ファイル書き込みのテストは固定 `waitForTimeout` だと並列実行時にフレーキーになる。`expect.poll` でファイル内容を繰り返し確認する方式が決定論的。
- **`checklist.md` 固定 URL のセキュリティ設計**: PATCH エンドポイントのパスを `checklist.md` にハードコードすることでパストラバーサルを根絶できたが、FR-007 の 403 シナリオはその固定 URL 設計により到達不能（ルーティング段階で 404）になった — セキュリティ要件とシナリオ記述の一貫性に要注意。

### Next Steps

- **tasks.md へのチェックボックス永続化の拡張**: `PATCH /api/changes/:id/artifacts/checklist.md` を汎用化し `tasks.md` のチェックボックスも永続化できるようにする（self-review 警告: `usePatchChecklistItem` の `relativePath` を `checklist.md` 固定にするか汎用 PATCH にするかの設計判断が残存）— 関連: web-ui-server FR-007
- **`checkboxCounter` ずれの根本原因調査**: React 18 Strict Mode と concurrent rendering の組み合わせで `checkboxCounter` が期待値とずれるメカニズムの詳細調査と、必要に応じて `useRef` カウンタを廃止して Content-based index mapping に移行する — 関連: artifact-preview FR-013
