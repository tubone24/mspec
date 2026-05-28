<!-- mspec: gaps in FR numbering are intentional. Removed requirements are archived under changes/archive/. -->

# change-dashboard Specification

## Purpose

<このスペックがカバーする外部から観測可能な振る舞いの概要>

## Requirements

<!-- archive コマンドが Delta Spec の ADDED/MODIFIED/REMOVED/RENAMED を機械的にマージします -->

### Requirement: FR-001 — チェンジ一覧表示

<!-- risk_tier: standard -->
<!-- blast_radius: local -->

このシステムは SHALL アーカイブされていない全チェンジを一覧表示し、各チェンジの ID・作成日・現在ステップ・モードを表に示す.

#### Scenario: アクティブなチェンジ一覧の表示
- GIVEN 複数のアーカイブ前チェンジが存在する
- WHEN ユーザーがダッシュボードにアクセスする
- THEN 全チェンジが作成日の降順で一覧表示され、各行にステップ進捗バーが表示される

### Requirement: FR-002 — ステップ進捗ビジュアライゼーション

<!-- risk_tier: standard -->
<!-- blast_radius: local -->

このシステムは SHALL 各チェンジのワークフローステップ（new / proposal / delta / research / design / quickstart / checklist / tasks / implement / archive）の完了状態を視覚的に表示する.

#### Scenario: 進捗バーの表示
- GIVEN あるチェンジが `design` ステップまで完了している
- WHEN ダッシュボードでそのチェンジ行を参照する
- THEN `new`〜`design` は完了マーク、`quickstart` 以降は未完了マークが付いたステップバーが表示され、ステップ状態の変化は最大 5 秒以内に UI に反映される

### Requirement: FR-003 — モード別フィルター

<!-- risk_tier: trivial -->
<!-- blast_radius: local -->

このシステムは SHALL チェンジモード（typo / minor / bugfix / フルフロー）でチェンジ一覧をフィルタリングできる UI 要素を提供する.

#### Scenario: bugfix チェンジのみ表示
- GIVEN bugfix モードとフルフローモードの両方のチェンジが存在する
- WHEN ユーザーが「bugfix」フィルターを選択する
- THEN bugfix モードのチェンジのみが一覧に表示される

### Requirement: FR-004 — チェンジ詳細への遷移

<!-- risk_tier: trivial -->
<!-- blast_radius: local -->

チェンジ一覧でエントリをクリックしたとき、このシステムは SHALL そのチェンジのアーティファクト一覧画面に遷移する.

#### Scenario: チェンジクリックによる詳細遷移
- GIVEN ダッシュボードにチェンジ一覧が表示されている
- WHEN ユーザーが特定のチェンジ行をクリックする
- THEN そのチェンジのアーティファクト（proposal.md / design.md 等）一覧ページに遷移する

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

### Requirement: FR-007 — ステップ実行中のリアルタイム進捗描画

<!-- risk_tier: standard -->
<!-- blast_radius: module -->

ステップが実行中の間、このシステムは SHALL ダッシュボードのステップ進捗表示をポーリングまたはサーバー送信イベント（SSE）によって 2 秒以内のレイテンシで自動更新し、ユーザーが手動リロードなしにステップの進行状況を確認できるようにする.

#### Scenario: ステップ実行中に進捗が自動更新される
- GIVEN ダッシュボードが表示されており、あるチェンジのステップが CLI で実行中である
- WHEN ステップの状態が変化する（例: `ready` → `in_progress` → `done`）
- THEN ダッシュボード上の該当チェンジのステップインジケーターが 2 秒以内に新しい状態へ更新される（ページリロード不要）

#### Scenario: 実行中ステップにアニメーションが表示される
- GIVEN あるチェンジのステップが `in_progress` 状態である
- WHEN ダッシュボードでそのチェンジを表示する
- THEN 実行中のステップに回転インジケーターなどのアニメーションが付与され、完了済み・未着手ステップと視覚的に区別される

#### Scenario: ステップ完了時に即座に表示が切り替わる
- GIVEN ダッシュボードでステップ実行中アニメーションが表示されている
- WHEN ステップが完了する
- THEN 実行中アニメーションが完了マークに切り替わり、次のステップが強調表示される

### Requirement: FR-008 — アーカイブフィルター

<!-- risk_tier: standard -->
<!-- blast_radius: local -->

アーカイブフィルターが無効（デフォルト状態）の間、このシステムは SHALL アーカイブ済みチェンジをダッシュボード一覧から非表示にし、フィルターが有効に切り替わったとき、このシステムは SHALL アーカイブ済みチェンジをアクティブなチェンジと視覚的に区別したうえで一覧に追加表示する.

#### Scenario: デフォルト状態でアーカイブ済みチェンジが非表示
- GIVEN `changes/archive/` に 1 件以上のアーカイブ済みチェンジが存在する
- WHEN ユーザーがダッシュボードを開く（フィルター初期状態）
- THEN アーカイブ済みチェンジは一覧に表示されず、アクティブなチェンジのみが表示される

#### Scenario: アーカイブフィルターを有効にするとアーカイブ済みチェンジが表示される
- GIVEN ダッシュボードが表示されておりアーカイブフィルターがオフになっている
- WHEN ユーザーが `[data-testid="filter-archived"]` トグルをクリックする
- THEN アーカイブ済みチェンジが一覧に追加表示され、各行に「アーカイブ済み」バッジまたはグレーアウトスタイルが適用される

### Requirement: FR-009 — SoT Spec ビューアー

<!-- risk_tier: standard -->
<!-- blast_radius: local -->

ユーザーが SoT Spec ビューアーを開いたとき、このシステムは SHALL プロジェクト内の全 capability（`specs/*/spec.md`）の一覧を表示し、選択した capability の spec 内容を Markdown レンダリング済みで別画面またはモーダルに表示する.

#### Scenario: SoT Spec 一覧が表示される
- GIVEN プロジェクトの `specs/` ディレクトリに複数の capability ディレクトリが存在する
- WHEN ユーザーがダッシュボードの「Spec ビューアー」ボタンまたはナビゲーション項目をクリックする
- THEN 全 capability 名がリスト表示された SoT Spec ビューアー画面が開く

#### Scenario: capability を選択すると spec 内容がレンダリングされる
- GIVEN SoT Spec ビューアーが開いており capability 一覧が表示されている
- WHEN ユーザーが `change-dashboard` などの capability 名をクリックする
- THEN 選択した capability の `specs/change-dashboard/spec.md` が Markdown レンダリング済みの HTML として右ペインまたはモーダル内に表示される

### Requirement: FR-010 — アーティファクト一覧のワークフロー順ソート

<!-- risk_tier: standard -->
<!-- blast_radius: local -->

チェンジ詳細のアーティファクト一覧画面を表示するとき、このシステムは SHALL アーティファクトを mspec ワークフローのステップ定義順（new / proposal / delta / research / design / quickstart / checklist / tasks / implement の順）に従ってソートして表示する.

#### Scenario: アーティファクトがワークフロー順に並ぶ
- GIVEN あるチェンジに proposal.md / design.md / tasks.md が存在する
- WHEN ユーザーがそのチェンジの詳細画面を開く
- THEN proposal.md が design.md より上に、design.md が tasks.md より上に表示される
- AND 新しいチェンジが追加されてもこのソート順は変わらない

#### Scenario: スキップされたステップのアーティファクトが欠けている場合
- GIVEN あるチェンジで proposal ステップがスキップされ proposal.md が存在しない
- WHEN ユーザーがそのチェンジの詳細画面を開く
- THEN 存在するアーティファクトのみがワークフロー順で表示される（欠落したアーティファクトは一覧に現れない）





