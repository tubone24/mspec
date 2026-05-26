---
doc_type: Reference
---

<!-- @mspec-delta 2026-05-24-085415-risk-tier-field/specs/delta-spec/spec.md -->
<!-- Requirements implemented: FR-001, FR-002, FR-003, FR-004, FR-005 -->
<!-- Change: risk-tier-field -->

<!-- @mspec-delta 2026-05-24-085415-risk-tier-field/specs/verify-routing/spec.md -->
<!-- Requirements implemented: FR-001, FR-002, FR-003, FR-004, FR-005 -->
<!-- Change: risk-tier-field -->

# Checklist: risk-tier-field

## Delta Spec Coverage

### delta-spec

- [x] FR-001: `mspec validate` が `risk_tier: critical` を含む FR ブロックを正常に認識し、バリデーションエラーを出さない <!-- verify: fr-001 -->
- [x] FR-002: `mspec validate` が `blast_radius: external` を含む FR ブロックを正常に認識し、バリデーションエラーを出さない <!-- verify: fr-002 -->
- [x] FR-003: `risk_tier` フィールドを持たない既存 FR が `risk_tier: standard` として解釈され、エラーも警告も出ない <!-- verify: fr-003 -->
- [x] FR-004: `risk_tier: unknown` を含む FR ブロックで `Error: invalid risk_tier value "unknown". Must be critical | standard | trivial` を出力し exit code 1 で終了する <!-- verify: fr-004 -->
- [x] FR-005: `blast_radius: global` を含む FR ブロックで `Error: invalid blast_radius value "global". Must be local | module | system | external` を出力し exit code 1 で終了する <!-- verify: fr-005 -->

### verify-routing

- [x] FR-001: `mspec delta init` で生成された FR スタブに `<!-- risk_tier: critical | standard | trivial -->` コメントが含まれる <!-- verify: fr-001 -->
- [x] FR-001: `mspec delta init` で生成された FR スタブに `<!-- blast_radius: local | module | system | external -->` コメントが含まれる <!-- verify: fr-001 -->
- [x] FR-002 (critical シナリオ): `risk_tier: critical` の FR-001 に対応する tasks.md タスクに `<!-- verify: human -->` が付与される <!-- verify: fr-002 -->
- [x] FR-002 (trivial シナリオ): `risk_tier: trivial` の FR-002 に対応する tasks.md タスクに verify アノテーションが付与されない <!-- verify: fr-002 -->
- [x] FR-003 (critical アノテーション): `risk_tier: critical` の FR-003 に対応する checklist.md 行に `<!-- verify: human -->` が付与される <!-- verify: fr-003 -->
- [x] FR-003 (trivial スキップ): `risk_tier: trivial` の FR-004 に対応する項目が checklist.md に生成されない <!-- verify: fr-003 -->
- [x] FR-004: `risk_tier: critical` の FR に対応する `<!-- verify: human -->` チェックボックスが未完了の状態で implement 完了後チェック処理を実行した際に警告メッセージが出力される <!-- verify: fr-004 -->
- [x] FR-004: 警告出力後も処理が継続し exit code 0 で完了する <!-- verify: fr-004 -->
- [x] FR-005: `risk_tier` フィールドなしの既存 FR に対して mspec-tasks および mspec-checklist が従来通りの `<!-- verify: fr-NNN -->` を付与し、挙動変化がない <!-- verify: fr-005 -->

## Source-of-Truth Regression

- [ ] `cli-delta-spec` FR-001/FR-010: パーサー (`collectRequirements()`) への正規表現追加が FR-ID 自動採番および `enforce_fr_ids` バリデーションロジックを破壊していないこと。`raw_block` スライスの範囲計算に影響がないかを確認する <!-- verify: human -->
- [ ] `claude-integration` FR-011: `mspec-checklist-auditor.md` の verify アノテーション付与ルール更新後、すべての checklist 項目に `verify:` アノテーションが付き、アノテーションなし行ゼロの自己検証ステップが維持されていること <!-- verify: human -->
- [ ] `claude-integration` FR-012: `<!-- verify: fr-NNN -->` のアノテーション文法を変更（critical FR が `<!-- verify: human -->` を返す）した結果、implement ステップの自動チェック処理が `critical` FR の verify: human 行を誤って自動チェックしないこと <!-- verify: human -->
- [ ] `claude-integration` FR-013: implement 完了後の未チェック項目レポートが `verify: human` グループと `verify: fr-NNN` グループを正しく分類して報告できること。`critical` FR 由来の `verify: human` 行が新たに加わる条件下での動作確認が必要 <!-- verify: human -->
- [ ] `cli-spec-lint` FR-004: risk_tier/blast_radius フィールドが HTML コメント形式で FR ブロック本文内に配置されるため、`mspec spec lint` が HTML コメント内の禁止語彙を走査対象外とする挙動によって誤検知を起こさないこと <!-- verify: human -->
- [ ] `delta-spec`/`verify-routing` SoT spec が現時点で空のプレースホルダーであるため、archive 後に FR-001〜FR-005 が SoT に正しくマージされることを確認する <!-- verify: human -->
- [ ] 両 capability が FR-001〜FR-005 を持つため `<!-- verify: fr-001 -->` が capability を一意に特定しない。anchor との照合が正しく機能するか確認する <!-- verify: human -->

## Constitution

- [ ] I. ステップ独立性: パーサー型定義・artifact-validator・各 SKILL.md は互いに独立して変更可能であり、新たなステップ間依存が生じていないこと <!-- verify: human -->
- [ ] II. 決定論的マージ: risk_tier/blast_radius は FR への追加フィールドであり、ADDED/MODIFIED/REMOVED/RENAMED のマージロジックに影響を与えていないこと <!-- verify: human -->
- [ ] III. 質問駆動の要件確定: blast_radius の扱い・trivial enforce・warning vs error の全設計判断が AskUserQuestion で確定済みであること <!-- verify: human -->
- [ ] IV. 双方向アンカー: design.md に `@mspec-delta` アンカーが付与されており、delta-spec および verify-routing の両 capability spec と対応していること <!-- verify: human -->
- [ ] V. 強制ステップと拡張ステップの分離: ステップ構造は変更されておらず、フィールド追加と SKILL.md 更新のみで完結していること <!-- verify: human -->

## Constitution Check

> Step: checklist | Constitution Version: 1.0.0

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | ✅ | checklist.md は specs/* と design.md のみを参照して生成されている |
| II. 決定論的マージ | ✅ | ✅ | checklist.md は Reference ドキュメント。SoT spec にマージされない |
| III. 質問駆動の要件確定 | ✅ | ✅ | 全設計判断は AskUserQuestion で確定済み。根拠は research/design に記録済み |
| IV. 双方向アンカー | ✅ | ✅ | @mspec-delta アンカーを付与済み |
| V. 強制ステップと拡張ステップの分離 | ✅ | ✅ | checklist はオプションステップ。ステップ構造変更なし |

### Complexity Tracking

None
