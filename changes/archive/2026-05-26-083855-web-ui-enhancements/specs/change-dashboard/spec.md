# Delta Spec: change-dashboard

## Security Capabilities

<!-- proposalのsecurity質問（PRP-SEC-001〜004）の回答からmspec-proposalスキルが記述する -->
<!-- 権限境界: ローカルファイルシステムの読み取りのみ、書き込みなし -->
<!-- アクセス増加: なし（ローカル Web UI の表示機能拡張のみ） -->
<!-- エージェント権限: 変化なし -->
<!-- ロールバック手段: UI のフィルター切り替えで即座に元の表示に戻せる -->

## ADDED Requirements

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

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
