<!-- mspec: gaps in FR numbering are intentional. Removed requirements are archived under changes/archive/. -->

# cli-integration Specification

## Purpose

<このスペックがカバーする外部から観測可能な振る舞いの概要>

## Requirements

<!-- archive コマンドが Delta Spec の ADDED/MODIFIED/REMOVED/RENAMED を機械的にマージします -->

### Requirement: FR-001 — mspec new フック起動

<!-- risk_tier: critical -->
<!-- blast_radius: module -->

`mspec new` コマンドが完了したとき、このシステムは SHALL Web UI サーバーが未起動であれば自動的にバックグラウンドで起動し、アクセス URL をコンソールに出力する.

#### Scenario: mspec new 後の自動起動
- GIVEN Web UI サーバーが起動していない
- WHEN ユーザーが `mspec new <feature>` を実行する
- THEN チェンジディレクトリが生成された後、`http://localhost:3847` でサーバーが起動し URL がコンソールに表示される

### Requirement: FR-002 — 既存プロセスへの URL 通知

<!-- risk_tier: standard -->
<!-- blast_radius: local -->

`mspec new` が実行されたとき既存サーバーが動作中の場合、このシステムは SHALL 新規起動を行わずに既存サーバーの URL をコンソールに表示する.

#### Scenario: 既存サーバー稼働中の通知
- GIVEN Web UI サーバーがポート 3847 で稼働中である
- WHEN ユーザーが `mspec new <feature>` を実行する
- THEN 「Web UI already running at http://localhost:3847」とコンソールに表示され、新規サーバーは起動しない

### Requirement: FR-003 — 非同期起動による CLI ブロッキング回避

<!-- risk_tier: critical -->
<!-- blast_radius: module -->

Web UI サーバーを起動するとき、このシステムは SHALL サーバープロセスをバックグラウンドで起動し、`mspec new` コマンド自体の完了をブロックしない.

#### Scenario: CLI がブロックされないことの確認
- GIVEN `mspec new` を実行する
- WHEN Web UI サーバーの起動処理が開始される
- THEN `mspec new` コマンドは数秒以内に完了し、ユーザーは引き続き CLI を操作できる

