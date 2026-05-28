---
doc_type: How-to
---

# Checklist: fix-checklist-ui-sync

## Delta Spec Coverage

### web-ui-server FR-007 — checklist.md チェックボックス状態のファイル永続化 API

- [x] **Scenario: チェックボックストグルの書き込み成功** — 有効な change ID と checklist.md が存在するとき、`PATCH /api/changes/:id/artifacts/checklist.md` に `text/plain` で更新済みテキストを送信するとサーバーがファイルを上書き保存して HTTP 200 を返す。 <!-- verify: fr-007 -->
- [x] **Scenario: チェンジが存在しない場合の 404 返却** — 存在しない change ID を指定して PATCH リクエストを送信したとき、サーバーが HTTP 404 を返しファイルを変更しない。 <!-- verify: fr-007 -->
- [x] **Scenario: パストラバーサル攻撃の防御** — URL が `checklist.md` 固定のためルーティング段階でブロック済み（design.md への PATCH → 404 をテストで確認）。 <!-- verify: fr-007 -->

### artifact-preview FR-013 — checklist.md チェックボックス操作の永続化とファイル初期状態の復元

- [x] **Scenario: ページ再表示時のチェック状態復元** — checklist.md に `- [x]` でチェック済み項目が含まれるとき、Web UI がそのファイルを表示した初期状態でチェックマーク付き表示になる（React state が `- [x]` 出現インデックスから初期化される）。 <!-- verify: fr-013 -->
- [x] **Scenario: チェックボックストグルのファイル永続化** — Web UI に checklist.md が表示されており未チェック項目をユーザーがクリックしたとき、その項目がチェック済みに変わり PATCH API が呼び出されてファイルに書き込まれ、次回表示時も状態が保持される。 <!-- verify: fr-013 -->

## Source-of-Truth Regression

- [x] **FR-001 (critical) — サーバー起動**: `artifacts.ts` への `writeFile` import および PATCH ルート追加がサーバー起動シーケンスに影響しないことを確認する。 <!-- verify: human -->
- [x] **FR-006 (standard) — チェックボックスインタラクティブ操作**: 既存の ON/OFF トグル UI が引き続き動作することを確認する（checklist-interactive.e2e.test.ts が全て pass）。 <!-- verify: human -->
- [x] **FR-001 (critical) — Markdown プレビュー**: `ArtifactViewer.tsx` の変更が checklist.md 以外の md ファイルのレンダリングに影響しないことを確認する。 <!-- verify: human -->
- [x] **FR-006 (critical) — E2E Mermaid SVG レンダリング確認**: architecture-overview.md / design.md のプレビューで Mermaid SVG が正常に表示されることを確認する。 <!-- verify: human -->
- [x] **FR-010 (standard) — スプリットビューレイアウト**: invalidateQueries による content 更新後の useEffect 再実行がレイアウトを崩さないことを確認する。 <!-- verify: human -->
- [x] **FR-012 (standard) — verify:cmd アノテーション付き項目**: `- [x]` の解析ロジックが verify:cmd コメント付き行のパースを妨げないことを確認する。 <!-- verify: human -->

## Constitution

- [ ] **原則 I — ステップ独立性**: 実装ファイルの変更が他ワークフローステップの動作に影響しないことを確認する。 <!-- verify: human -->
- [ ] **原則 II — 決定論的マージ**: FR-007 および FR-013 が ADDED 要件のみであり MODIFIED/REMOVED 変更が delta spec に記録されていないことを確認する。 <!-- verify: human -->
- [x] **原則 IV — 双方向アンカー**: `mspec anchor check` で 0 エラーを確認する（実装ファイルの @mspec-delta アンカーが FR-007 / FR-013 と対応）。 <!-- verify: human -->
- [x] **原則 VI — Security by Default**: PATCH 対象が `checklist.md` 固定であり、パストラバーサル防御が設計・実装両面で確認済み。 <!-- verify: human -->
