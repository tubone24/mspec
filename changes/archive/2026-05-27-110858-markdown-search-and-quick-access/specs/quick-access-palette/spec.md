# Delta Spec: quick-access-palette

## Security Capabilities

<!-- 権限境界: クライアントサイドのみ（キーボードイベント検知・クライアントサイドナビゲーション） -->
<!-- アクセス増加: 増加なし -->
<!-- エージェント権限: なし -->
<!-- ロールバック手段: git revert -->
<!-- UA判定: navigator.userAgent/platform をキーバインド切り替えのみに使用（サーバー送信しない） -->

## ADDED Requirements

### Requirement: FR-001 — ⌘K/Ctrl+K でクイックアクセスパレット表示

<!-- risk_tier: standard -->
<!-- blast_radius: module -->

ユーザーが ⌘K（macOS）または Ctrl+K（Windows/Linux）を押したとき、このシステムは SHALL クイックアクセスパレットをオーバーレイとして表示する.

#### Scenario: macOSで⌘Kでパレットが開く
- GIVEN mspec Web UI が macOS のブラウザで表示されている
- WHEN ユーザーが ⌘K を押す
- THEN クイックアクセスパレットがオーバーレイとして画面中央に表示される

#### Scenario: Windows/LinuxでCtrl+Kでパレットが開く
- GIVEN mspec Web UI が Windows または Linux のブラウザで表示されている
- WHEN ユーザーが Ctrl+K を押す
- THEN クイックアクセスパレットがオーバーレイとして画面中央に表示される

### Requirement: FR-002 — クライアントサイドOS判定によるキーバインド切り替え

<!-- risk_tier: standard -->
<!-- blast_radius: local -->

Web UIが初期化されたとき、このシステムは SHALL `navigator.userAgent` または `navigator.platform` を参照してOSを判定し、修飾キー（⌘/Ctrl）をクライアントサイドで決定する. UA文字列をサーバーに送信することを MUST NOT とする.

#### Scenario: macOS判定でメタキーを使用する
- GIVEN `navigator.platform` が "Mac" を含む状態
- WHEN クイックアクセスパレットのキーバインドが初期化される
- THEN `metaKey + k` のショートカットが登録され、ヒントUIに ⌘K が表示される

#### Scenario: Windows/Linux判定でCtrlキーを使用する
- GIVEN `navigator.platform` が "Win" または "Linux" を含む状態
- WHEN クイックアクセスパレットのキーバインドが初期化される
- THEN `ctrlKey + k` のショートカットが登録され、ヒントUIに Ctrl+K が表示される

### Requirement: FR-003 — パレット表示コンテンツ（Spec・Change・Capability・次Step）

<!-- risk_tier: trivial -->
<!-- blast_radius: local -->

クイックアクセスパレットが表示されているとき、このシステムは SHALL Specファイル・Changesディレクトリ・Capability名・現在のChangeの次Stepナビゲーションを一覧表示する.

#### Scenario: パレットにSpec・Change・Capability・次Stepが表示される
- GIVEN クイックアクセスパレットが開いている状態
- WHEN パレットが初期表示される
- THEN Specファイル一覧・変更一覧・Capability名一覧・次のワークフローステップへのリンクが表示される

### Requirement: FR-004 — パレット内インクリメンタル検索フィルタリング

<!-- risk_tier: trivial -->
<!-- blast_radius: local -->

クイックアクセスパレットが表示されていてユーザーがテキストを入力したとき、このシステムは SHALL 入力に部分一致する項目のみをリアルタイムにフィルタリングして表示する.

#### Scenario: 入力に応じてパレット内容が絞り込まれる
- GIVEN クイックアクセスパレットが開いていて入力フィールドにフォーカスがある状態
- WHEN ユーザーが "spec" と入力する
- THEN "spec" を名前・タイトルに含む Spec・Capability・ステップのみに絞り込まれる

### Requirement: FR-005 — ESCキーおよびオーバーレイ背景クリックでパレットを閉じる

<!-- risk_tier: trivial -->
<!-- blast_radius: local -->

クイックアクセスパレットが表示されているとき、このシステムは SHALL Escape キー押下またはオーバーレイ背景クリックでパレットを閉じる.

#### Scenario: ESCキーでパレットが閉じる
- GIVEN クイックアクセスパレットが表示されている状態
- WHEN ユーザーが Escape キーを押す
- THEN パレットが閉じてフォーカスが元のUI要素に戻る

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
