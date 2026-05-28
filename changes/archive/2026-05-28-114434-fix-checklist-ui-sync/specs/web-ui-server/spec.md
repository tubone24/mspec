# Delta Spec: web-ui-server

## Security Capabilities

<!-- 権限境界: ローカルプロジェクトディレクトリ内の checklist.md のみ書き換え可能。パストラバーサル防止チェックを実施 -->
<!-- アクセス増加: GET に加え PATCH でファイル書き込み権限が追加される -->
<!-- エージェント権限: なし（CLI ローカルサーバーのみ） -->
<!-- ロールバック手段: checklist.md の変更は git で追跡されるため `git checkout` で復元可能 -->

## ADDED Requirements

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

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
