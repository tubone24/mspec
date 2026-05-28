# Delta Spec: artifact-preview

## Security Capabilities

<!-- 権限境界: フロントエンド表示ロジックの変更のみ。外部サービスや認証へのアクセス変更なし -->
<!-- アクセス増加: なし -->
<!-- エージェント権限: 読み取り専用 -->
<!-- ロールバック手段: UI の表示ロジックのみのため、コード差し戻しで即時復元可能 -->

## ADDED Requirements

### Requirement: FR-012 — verify:cmd アノテーション付き項目への amber ハイライト

<!-- risk_tier: standard -->
<!-- blast_radius: local -->

checklist.md の Markdown プレビューを表示するとき、このシステムは SHALL `<!-- verify: cmd:... -->` アノテーションが付与された checklist 項目に対して `<!-- verify: human -->` と同じ amber ハイライトを適用する。

#### Scenario: verify:cmd 項目の amber ハイライト表示

- GIVEN checklist.md に `- [ ] FR-006 検証 <!-- verify: cmd:mspec anchor check -->` という行が存在する
- WHEN ユーザーが Web UI で checklist.md をプレビュー表示する
- THEN 当該行が `<!-- verify: human -->` 項目と同様の amber 背景色でハイライトされる

#### Scenario: verify:fr-NNN 項目はハイライトされない

- GIVEN checklist.md に `- [x] FR-001 検証 <!-- verify: fr-001 -->` という行が存在する
- WHEN ユーザーが Web UI で checklist.md をプレビュー表示する
- THEN 当該行には amber ハイライトが適用されない（通常表示のまま）

---

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->

<!-- LEARNING: verify:cmd と verify:human は UI 上同じ amber ハイライト = 「要注意項目」カテゴリとして統一することで、ユーザーの視線誘導が一貫する | source: FR-012 | confidence: high -->
