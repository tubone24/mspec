# Delta Spec: artifact-preview

## Security Capabilities

<!-- proposalのsecurity質問（PRP-SEC-001〜004）の回答からmspec-proposalスキルが記述する -->
<!-- 権限境界: ローカルファイルシステムの読み取りのみ（doc_type frontmatter の解析） -->
<!-- アクセス増加: なし -->
<!-- エージェント権限: 変化なし -->
<!-- ロールバック手段: CSS クラスの変更のみのため、UI を再表示するだけで確認可能 -->

## ADDED Requirements

### Requirement: FR-011 — DockType 別アーティファクトカード色付け

<!-- risk_tier: trivial -->
<!-- blast_radius: local -->

このシステムは SHALL アーティファクト一覧の各カードを、そのアーティファクトの YAML frontmatter に記載された `doc_type` フィールドの値（`Reference` / `Explanation` / `How-to` / `Tutorial`）に応じた固定カラーパレットでハイライト表示し、`doc_type` が存在しない場合はニュートラルカラー（グレー）を適用する.

#### Scenario: Reference アーティファクトが青系色でハイライトされる
- GIVEN あるチェンジのアーティファクト一覧が表示されており、`tasks.md` の frontmatter に `doc_type: Reference` が設定されている
- WHEN ユーザーがそのチェンジの詳細ページを開く
- THEN `tasks.md` のアーティファクトカードが青系（例: `bg-blue-50 border-blue-300`）でハイライトされる

#### Scenario: 各 DockType に異なる色が割り当てられる
- GIVEN 4 種の doc_type（Reference / Explanation / How-to / Tutorial）を持つアーティファクトが混在している
- WHEN アーティファクト一覧を表示する
- THEN Reference は青系、Explanation は紫系、How-to は緑系、Tutorial は黄系でそれぞれ色分けされ、視覚的に区別できる

#### Scenario: doc_type 未設定アーティファクトはグレー表示
- GIVEN あるアーティファクトファイルに YAML frontmatter がない、または `doc_type` フィールドが存在しない
- WHEN アーティファクト一覧でそのカードが表示される
- THEN ニュートラルカラー（グレー系）が適用され、他の色付きカードと区別される

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
