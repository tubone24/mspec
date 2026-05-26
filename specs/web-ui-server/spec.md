<!-- mspec: gaps in FR numbering are intentional. Removed requirements are archived under changes/archive/. -->

# web-ui-server Specification

## Purpose

<このスペックがカバーする外部から観測可能な振る舞いの概要>

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

