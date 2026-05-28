# Delta Spec: mspec-archive

## Security Capabilities

<!-- 権限境界: spec.md ファイルへのローカル書き込みのみ。外部 API・秘密情報アクセスなし -->
<!-- ロールバック手段: git で元に戻せる。cli-archive のトランザクション保護対象外のため手動ロールバック -->

## ADDED Requirements

### Requirement: FR-005 — アーカイブ後の Purpose フィールド自動生成

<!-- risk_tier: standard -->
<!-- blast_radius: module -->

`mspec archive` が完了したとき、このシステムは SHALL `## Purpose` セクションがテンプレートプレースホルダー（`<このスペックがカバーする外部から観測可能な振る舞いの概要>`）のままの capability spec.md に対して、そのスペック内容を基に 1〜2 文の外部観測可能な振る舞いの概要を生成し、プレースホルダーを置き換えて書き込む。

#### Scenario: アーカイブ後に Purpose が自動生成される
- GIVEN アーカイブ対象チェンジの Delta Spec が既存 capability に要件を追加するものである
- AND `specs/<capability>/spec.md` の `## Purpose` がテンプレートプレースホルダーのままである
- WHEN `mspec archive <change-name> -y` が完了する
- THEN mspec-archive スキルが `specs/<capability>/spec.md` の Purpose を 1〜2 文の意味のある記述で上書きし、プレースホルダーは残らない

#### Scenario: Purpose が既に記述済みの場合はスキップ
- GIVEN `specs/<capability>/spec.md` の `## Purpose` にプレースホルダー以外のテキストが記述されている
- WHEN `mspec archive` が完了する
- THEN Purpose フィールドは変更されない

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
