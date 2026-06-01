<!-- mspec: gaps in FR numbering are intentional. Removed requirements are archived under changes/archive/. -->

# web-ui-server Specification

## Purpose

mspec Web UI サーバーの起動・停止・ポート管理と、アーティファクトファイルに対する読み取り・書き込み API（checklist.md チェックボックス状態の永続化を含む）の外部から観測可能な振る舞いをカバーする。

## Requirements

<!-- archive コマンドが Delta Spec の ADDED/MODIFIED/REMOVED/RENAMED を機械的にマージします -->

### Requirement: FR-001 — サーバー起動

<!-- risk_tier: critical -->
<!-- blast_radius: local -->

`mspec new` が実行されたとき、このシステムは SHALL 既存の Web UI サーバープロセスが存在しない場合に限り、バックグラウンドで新しい HTTP サーバーを起動する.

#### Scenario: 初回起動
- GIVEN Web UI サーバーが起動していない状態
- WHEN ユーザーが `mspec new` を実行する
- THEN デフォルトポート（3847）で HTTP サーバーが起動し、PID ファイルが生成される

### Requirement: FR-002 — プロセス再利用

<!-- risk_tier: standard -->
<!-- blast_radius: local -->

`mspec new` が実行されたとき、このシステムは SHALL 既存の Web UI サーバープロセスが PID ファイルで確認できる場合はそれを再利用し、新たな起動を行わない.

#### Scenario: 既存プロセスの再利用
- GIVEN 有効な PID ファイルが存在し、プロセスが動作中である
- WHEN ユーザーが `mspec new` を実行する
- THEN サーバーを新規起動せず、既存サーバーの URL をコンソールに表示する

### Requirement: FR-003 — PID ファイル管理

<!-- risk_tier: standard -->
<!-- blast_radius: local -->

このシステムは SHALL サーバー起動時に `~/.mspec/ui.pid` へプロセス ID を書き込み、サーバー停止時にそのファイルを削除する.

#### Scenario: PID ファイルの状態不整合（ゾンビPID）
- GIVEN PID ファイルは存在するがプロセスが実際には終了している
- WHEN ユーザーが `mspec new` を実行する
- THEN 古い PID ファイルを削除し、新たにサーバーを起動して新しい PID ファイルを生成する

### Requirement: FR-004 — ポート設定

<!-- risk_tier: trivial -->
<!-- blast_radius: local -->

このシステムは SHALL デフォルトポートとして `3847` を使用し、`~/.mspecrc` の `ui.port` 設定で上書きできるようにする.

#### Scenario: カスタムポートでの起動
- GIVEN `~/.mspecrc` に `ui.port: 4000` が設定されている
- WHEN サーバーが起動する
- THEN ポート 4000 で HTTP サーバーが起動する

### Requirement: FR-005 — checklist.md の verify-human 項目ハイライト表示

<!-- risk_tier: trivial -->
<!-- blast_radius: local -->

checklist.md が表示される間、このシステムは SHALL `verify-human` タグを持つチェックリスト項目を、他の項目と視覚的に区別できるよう背景色または枠線でハイライト表示する.

#### Scenario: verify-human 項目の色付き表示
- GIVEN checklist.md に `verify-human` タグを持つ項目が含まれる
- WHEN Web UI がその checklist.md を描画する
- THEN 該当項目が警告色（例: 黄色背景・オレンジ枠線）で目立つスタイルで表示される

#### Scenario: verify-human 以外の項目は通常表示
- GIVEN checklist.md に `verify-human` タグを持たない通常の項目が含まれる
- WHEN Web UI がその checklist.md を描画する
- THEN 通常スタイルで表示され、ハイライトは適用されない

### Requirement: FR-006 — checklist.md チェックボックスのインタラクティブ操作

<!-- risk_tier: standard -->
<!-- blast_radius: module -->

checklist.md が表示される間、このシステムは SHALL チェックボックス項目をクリック可能なインタラクティブ要素として描画し、ユーザーが Web UI 上で ON/OFF をトグルできるようにする.

#### Scenario: チェックボックスのトグル操作
- GIVEN Web UI に checklist.md のチェックリストが表示されている
- WHEN ユーザーが未チェックの項目をクリックする
- THEN その項目がチェック済みになり、視覚的にチェックマークが表示される

#### Scenario: チェック済み項目のアンチェック操作
- GIVEN Web UI に checklist.md のチェックリストが表示されており、一部の項目がチェック済みである
- WHEN ユーザーがチェック済みの項目をクリックする
- THEN その項目のチェックが外れ、未チェック状態に戻る

### Requirement: FR-007 — checklist.md チェックボックス状態のファイル永続化 API

<!-- risk_tier: standard -->
<!-- blast_radius: module -->

checklist.md のチェックボックス操作が行われたとき、このシステムは SHALL `PATCH /api/changes/:id/artifacts/checklist.md` エンドポイントで受け取った更新済み Markdown テキストをディスク上の `checklist.md` ファイルに書き戻す.

#### Scenario: チェックボックストグルの書き込み成功
- GIVEN 有効な change ID と checklist.md が存在する
- WHEN クライアントが `PATCH /api/changes/:id/artifacts/checklist.md` に `text/plain` で更新済みテキストを送信する
- THEN サーバーはファイルを上書き保存し HTTP 200 を返す

#### Scenario: チェンジが存在しない場合の 404 返却
- GIVEN 存在しない change ID が指定された
- WHEN クライアントが PATCH リクエストを送信する
- THEN サーバーは HTTP 404 を返し、ファイルを変更しない

#### Scenario: パストラバーサル攻撃の防御
- GIVEN クライアントが `../../../etc/passwd` のようなパスで PATCH リクエストを送信する
- WHEN サーバーがパスを解決する
- THEN change ディレクトリの外に出るパスを拒否し HTTP 403 を返す

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




