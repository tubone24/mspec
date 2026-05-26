# Delta Spec: change-dashboard

## ADDED Requirements

### Requirement: FR-005 — E2E ダッシュボード画面の表示確認

<!-- risk_tier: critical -->
<!-- blast_radius: local -->

Playwright E2E テストを実行したとき、このシステムは SHALL http://localhost:5173 のダッシュボード画面を 10 秒以内に表示し、アクティブなチェンジが 1 件以上リストアップされた状態であること.

#### Scenario: ダッシュボードがチェンジ一覧を表示する
- GIVEN mspec リポジトリの `changes/`（アーカイブ除く）に少なくとも 1 件のアクティブなチェンジが存在する（E2E 実行中のチェンジ自身もカウントされる）
- WHEN Playwright が `http://localhost:5173` を開く
- THEN ページタイトルが "MSPEC Dashboard" であり、チェンジ名を含む行が 1 件以上 DOM に存在する

### Requirement: FR-006 — E2E モードフィルターの動作確認

<!-- risk_tier: standard -->
<!-- blast_radius: local -->

Playwright E2E テストを実行したとき、このシステムは SHALL モードフィルターをクリックすることでチェンジ一覧が絞り込まれ、URL が変化しないこと.

#### Scenario: bugfix フィルター選択時の絞り込み
- GIVEN ダッシュボードが表示されておりモードフィルターが "All" になっている
- WHEN Playwright が `[data-testid="filter-bugfix"]` をクリックする
- THEN 表示されるチェンジ行が "bugfix" モードのみになるか、または "No active changes found." が表示される

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
