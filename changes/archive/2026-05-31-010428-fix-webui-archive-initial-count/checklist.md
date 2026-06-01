# Checklist: fix-webui-archive-initial-count

## Delta Spec Coverage

### FR-011 — アーカイブ件数の初期表示 <!-- verify: fr-011 -->

- [x] **初期ロード時に件数が表示される**: ダッシュボードを開いた直後、アーカイブフィルタートグルをクリックする前から件数バッジに正しい値が表示されること <!-- verify: fr-011 -->
  - GIVEN: `changes/archive/` に 3 件存在
  - WHEN: ダッシュボード初期表示
  - THEN: 件数バッジに「3」が表示される
  - 検証方法: T305 E2E テスト PASS 済み

- [x] **アーカイブ 0 件時の表示**: アーカイブが空の状態でもバッジが「0」を表示し、非表示にならないこと <!-- verify: fr-011 -->
  - GIVEN: `changes/archive/` が空
  - WHEN: ダッシュボード初期表示
  - THEN: バッジに「0」が表示される

- [x] **並列クエリが正しい URL を呼ぶ**: `useChanges(true)` が `GET /api/changes?includeArchived=true` を呼び出すこと <!-- verify: fr-011 -->
  - 検証方法: T305 で `page.waitForRequest` PASS 確認済み

- [x] **カウント精度**: `allChanges.filter(c => c.isArchived).length` が `changes/archive/` のディレクトリ数と一致すること <!-- verify: fr-011 -->

## Source-of-Truth Regression

### FR-008 — アーカイブフィルター ⚠ HIGH RISK <!-- verify: fr-008 -->

> 今回の変更に最も近い既存要件。並列クエリ追加による挙動変化を重点確認。

- [x] **フィルターオフ時にアーカイブが非表示**: デフォルト状態（`statusFilter = 'all'`）では、アーカイブ済みチェンジがメインリストに表示されないこと <!-- verify: fr-008 -->
  - 緑フェーズ全 E2E (73 テスト) PASS — T303 で確認済み
- [x] **フィルターオン時にアーカイブが表示**: アーカイブフィルタートグルをクリックすると、アーカイブ済みチェンジが「アーカイブ済み」バッジ付きで表示されること <!-- verify: fr-008 -->
  - 緑フェーズ全 E2E (73 テスト) PASS — T304 で確認済み

### FR-001 — チェンジ一覧表示 ⚠ MEDIUM RISK <!-- verify: fr-001 -->

- [x] **アクティブチェンジ一覧**: 非アーカイブチェンジが正しく一覧表示されること <!-- verify: fr-001 -->
  - 緑フェーズ全 E2E PASS — dashboard.e2e.test.ts で確認済み

### FR-003 — モード別フィルター 🔵 LOW RISK <!-- verify: fr-003 -->

- [x] **モードフィルター動作**: bugfix / minor / typo フィルターが正常に動作すること <!-- verify: fr-003 -->
  - 緑フェーズ全 E2E PASS — dashboard.e2e.test.ts (mode filter-bugfix) で確認済み

### FR-002, FR-004, FR-005, FR-006, FR-007, FR-009, FR-010 🟢 MINIMAL RISK

- [x] **その他 FR**: ステップ進捗・詳細遷移・E2E・リアルタイム・SoT Spec・ワークフロー順ソートは変更箇所と無関係。スモークテストで確認。
  - 緑フェーズ全 73 E2E テスト PASS（リグレッションなし）
  <!-- verify: fr-002 --><!-- verify: fr-004 --><!-- verify: fr-005 --><!-- verify: fr-006 --><!-- verify: fr-007 --><!-- verify: fr-009 --><!-- verify: fr-010 -->

## Constitution

| 原則 | チェック項目 | 状態 |
|------|-------------|------|
| I. ステップ独立性 | design.md・research.md が各ステップ単独で完結している | ✅ |
| II. 決定論的マージ | FR-011 ADDED のみ、MODIFIED/REMOVED なし | ✅ |
| III. 質問駆動の要件確定 | Open Choices なし、要件が確定している | ✅ |
| IV. 双方向アンカー | tasks.md で実装アンカーを付与予定 | ⏳ tasks ステップで確認 |
| V. 強制/拡張ステップの分離 | bugfix モードで proposal/quickstart がスキップされており適切 | ✅ |
| VI. Security by Default | 読み取り専用クエリの追加のみ。認証・認可への影響なし | ✅ |
| VII. 設計意図と実装の対応確認 | D-01 が FR-011 と 1:1 対応、design.md に受け入れ基準あり | ✅ |
