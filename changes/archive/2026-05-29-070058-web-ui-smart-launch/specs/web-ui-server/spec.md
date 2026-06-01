# Delta Spec: web-ui-server

## Security Capabilities

- 権限境界: Web UI サーバーは 127.0.0.1 にのみバインドし、外部ネットワークへの露出を禁止する（SEC-002）
- プロセス起動安全性: プロセスはシェルを介さず exec（引数配列）で spawn し、コマンドインジェクションをアーキテクチャレベルで排除する（SEC-005）
- 応答元の同一性検証: `/__mspec/health` エンドポイントでプロジェクト ID と起動トークンを照合し、別プロセスの誤再利用を防止する（SEC-001）

## ADDED Requirements

### Requirement: FR-008 — ポート固定リストからの順次選択

<!-- risk_tier: standard -->
<!-- blast_radius: module -->

デフォルトポートが使用中の場合、このシステムは SHALL 候補ポートリスト（3847, 3848, 3849, 3850, 3851）から順に空きポートを探し、最初に空いたポートで起動する.

#### Scenario: デフォルトポートが使用中のとき次のポートで起動する
- GIVEN ポート 3847 が他プロセスによって使用中である
- WHEN Web UI スマート起動ロジックが実行される
- THEN ポート 3848 が試行され、空いていれば 3848 で Web UI が起動する

#### Scenario: 候補ポートが全て使用中の場合はエラーを返す
- GIVEN 候補ポートリスト（3847〜3851）が全て使用中である
- WHEN Web UI スマート起動ロジックが実行される
- THEN エラーメッセージを表示して起動を中断し、非致命的エラーとして報告する

### Requirement: FR-009 — PID ファイルと HTTP ヘルスチェックによる起動中判定

<!-- risk_tier: standard -->
<!-- blast_radius: module -->

このシステムは SHALL PID ファイルの存在確認と `/__mspec/health` エンドポイントへの HTTP ヘルスチェックの両方が成功した場合のみ、同プロジェクトの Web UI が起動中と判定する.

#### Scenario: PID ファイルと HTTP 応答が共に正常なとき再利用する
- GIVEN `.mspec/ui.pid` が存在し、そのポートに HTTP GET `/__mspec/health` が成功する
- WHEN Web UI スマート起動ロジックが実行される
- THEN 新規起動せず既存の URL を表示する

#### Scenario: PID ファイルが存在しないとき新規起動する
- GIVEN `.mspec/ui.pid` が存在しない
- WHEN Web UI スマート起動ロジックが実行される
- THEN 新規起動フローに進む

### Requirement: FR-010 — ステール PID 自動回復

<!-- risk_tier: standard -->
<!-- blast_radius: module -->

PID ファイルが存在するが HTTP ヘルスチェックが失敗した場合、このシステムは SHALL PID ファイルを削除してから新規起動を実行する.

#### Scenario: ステール PID ファイルがある状態で起動を試みる
- GIVEN `.mspec/ui.pid` が存在するが、そのポートへの HTTP ヘルスチェックがタイムアウトまたはエラーを返す
- WHEN Web UI スマート起動ロジックが実行される
- THEN `.mspec/ui.pid` を削除し、通常の新規起動フローで Web UI を起動する

### Requirement: FR-011 — ヘルスエンドポイントでのプロジェクト同一性検証

<!-- risk_tier: critical -->
<!-- blast_radius: module -->

このシステムは SHALL `/__mspec/health` レスポンスに含まれるプロジェクトルートパスと起動トークンを PID ファイルに記録された値と照合し、一致した場合のみ起動済みとして再利用する.

#### Scenario: 同一プロジェクトの Web UI が応答するとき再利用する
- GIVEN `/__mspec/health` が `{ "projectRoot": "/path/to/project", "token": "abc123" }` を返す
- WHEN PID ファイルの projectRoot と token が一致する
- THEN 起動済みと判定して既存 URL を再利用する

#### Scenario: 別プロジェクトのプロセスが同ポートを占有しているとき再利用しない
- GIVEN `/__mspec/health` が異なる projectRoot を返す
- WHEN Web UI スマート起動ロジックが実行される
- THEN 別ポートで新規起動する

### Requirement: FR-012 — 起動完了時の URL 表示

<!-- risk_tier: trivial -->
<!-- blast_radius: local -->

Web UI の起動が完了したとき、このシステムは SHALL アクセス可能な URL（例: `http://localhost:3847`）を CLI 標準出力に表示する.

#### Scenario: 新規起動後に URL が表示される
- GIVEN Web UI が新規起動に成功する
- WHEN 起動完了が確認される
- THEN `Web UI started at http://localhost:<port>` の形式で URL が表示される

#### Scenario: 起動済み再利用時にも URL が表示される
- GIVEN 同プロジェクトの Web UI がすでに起動中と判定される
- WHEN Web UI スマート起動ロジックが終了する
- THEN `Web UI already running at http://localhost:<port>` の形式で URL が表示される

### Requirement: FR-013 — 127.0.0.1 への強制バインド

<!-- risk_tier: critical -->
<!-- blast_radius: system -->

このシステムは MUST Web UI サーバーを `127.0.0.1` にのみバインドし、`0.0.0.0` や外部インターフェースへのバインドを禁止する.

#### Scenario: サーバーが 127.0.0.1 にバインドされる
- GIVEN Web UI 新規起動フローが実行される
- WHEN サーバープロセスが起動する
- THEN リッスンアドレスは `127.0.0.1:<port>` であり、外部ネットワークからはアクセス不可である

### Requirement: FR-014 — exec（引数配列）によるプロセス直接 spawn

<!-- risk_tier: critical -->
<!-- blast_radius: system -->

このシステムは MUST Web UI サーバープロセスをシェルを介さず exec（引数配列）で起動し、ポート値は整数バリデーション後にのみコマンド引数として渡す.

#### Scenario: ポート値が整数バリデーションを通過して spawn に渡される
- GIVEN ポート候補として 3848 が選択される
- WHEN プロセス spawn が実行される
- THEN `spawn('node', ['server.js', '--port', '3848'], { shell: false })` のように引数配列形式で起動され、シェル展開が発生しない

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
