# Delta Spec: constitution

## ADDED Requirements

### Requirement: FR-001 — VI. Security by Default 原則の追加

<!-- risk_tier: critical -->
<!-- blast_radius: system -->

`memory/constitution.md` および `packages/cli/templates/constitution.md` の両方に `### VI. Security by Default` 原則を追加し（I〜Vの連番を維持）、このシステムは SHALL すべてのchangeがsecurity質問（PRP-SEC-001〜004）への回答をproposalに含むことを要求する。またVersionを `1.0.0 → 1.1.0`、`Last Amended` を更新する。

#### Scenario: constitutionにVI原則が存在する
- GIVEN `memory/constitution.md` を読み込む
- WHEN ファイル内容のCore Principlesセクションを確認する
- THEN `### VI. Security by Default` 見出しが存在し、PRP-SEC-001〜004への回答を義務付ける文言が含まれ、Versionが `1.1.0` に更新されている

### Requirement: FR-002 — テンプレートconstitutionへの同期

<!-- risk_tier: standard -->
<!-- blast_radius: module -->

`packages/cli/templates/constitution.md` は `memory/constitution.md` と同一のVI原則テキストを保持し、このシステムは SHALL `mspec init` で新規プロジェクトを作成した際にVI原則が引き継がれることを保証する。

#### Scenario: mspec initで作成したプロジェクトにVI原則が含まれる
- GIVEN `mspec init` を実行した新規プロジェクトディレクトリ
- WHEN `memory/constitution.md` を確認する
- THEN `### VI. Security by Default` 原則が存在する

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
