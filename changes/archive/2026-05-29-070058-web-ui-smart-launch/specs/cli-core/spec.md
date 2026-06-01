# Delta Spec: cli-core

## Security Capabilities

- 権限境界: CLI コマンドは Web UI 起動ロジックを呼び出すのみ。ファイル書き込みや外部ネットワークアクセスは web-ui-server 層に委譲する
- ロールバック手段: Web UI 起動失敗は非致命的エラーとして扱い、コマンド本体の処理結果には影響しない

## ADDED Requirements

### Requirement: FR-007 — `mspec new` 実行時の Web UI 自動起動トリガー

<!-- risk_tier: standard -->
<!-- blast_radius: module -->

`mspec new` コマンドが正常終了したとき、このシステムは SHALL Web UI スマート起動ロジックを実行する.

#### Scenario: 新規チェンジ作成後に Web UI が自動起動する
- GIVEN `mspec new <feature>` が正常にチェンジディレクトリを作成した後
- WHEN コマンドの後処理が実行される
- THEN Web UI スマート起動ロジックが呼び出され、起動済み判定・ポート選択・URL 表示が行われる

#### Scenario: Web UI 起動失敗はコマンド成功に影響しない
- GIVEN `mspec new <feature>` が正常にチェンジディレクトリを作成した後
- WHEN Web UI 起動ロジックが失敗する（例：候補ポートが全て使用中）
- THEN `mspec new` の終了コードは 0 を維持し、エラーメッセージのみ表示する

### Requirement: FR-008 — `mspec open` 実行時の Web UI 自動起動トリガー

<!-- risk_tier: standard -->
<!-- blast_radius: module -->

`mspec open` コマンドが実行されたとき、このシステムは SHALL Web UI スマート起動ロジックを実行する.

#### Scenario: mspec open で Web UI が起動または再利用される
- GIVEN ユーザーが `mspec open` を実行する
- WHEN コマンドが処理される
- THEN Web UI スマート起動ロジックが呼び出され、起動済みであれば既存 URL を表示し、未起動であれば新規起動する

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
