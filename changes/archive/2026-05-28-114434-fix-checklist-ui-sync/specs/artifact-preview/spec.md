# Delta Spec: artifact-preview

## Security Capabilities

<!-- 権限境界: PATCH API はローカルサーバー経由で checklist.md のみ更新。外部通信なし -->
<!-- アクセス増加: なし（既存の fetch クライアントを使用） -->
<!-- エージェント権限: なし -->
<!-- ロールバック手段: git で checklist.md を復元可能 -->

## ADDED Requirements

### Requirement: FR-013 — checklist.md チェックボックス操作の永続化とファイル初期状態の復元

<!-- risk_tier: standard -->
<!-- blast_radius: module -->

checklist.md が表示される間、このシステムは SHALL ファイル内容の `- [x]` パターンを解析してチェックボックスの初期状態を復元し、ユーザーがチェックボックスをトグルしたときに更新済みコンテンツを `PATCH /api/changes/:id/artifacts/checklist.md` へ送信してファイルに永続化する.

#### Scenario: ページ再表示時のチェック状態復元
- GIVEN checklist.md の一部項目が `- [x]` でチェック済みである
- WHEN Web UI が checklist.md を表示する
- THEN チェック済み項目が初期状態でチェックマーク付きで表示される（React state は `- [x]` の出現インデックスから初期化される）

#### Scenario: チェックボックストグルのファイル永続化
- GIVEN Web UI に checklist.md が表示されており、未チェックの項目がある
- WHEN ユーザーが未チェックの項目をクリックする
- THEN その項目がチェック済みに変わり、PATCH API が呼び出されてファイルに書き込まれ、次回表示時も状態が保持される

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
