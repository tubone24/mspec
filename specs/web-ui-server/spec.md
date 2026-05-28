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



