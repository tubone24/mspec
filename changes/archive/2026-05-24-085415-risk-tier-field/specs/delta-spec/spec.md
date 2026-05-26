# Delta Spec: delta-spec

<!-- Capability scope: parser/spec.md スキーマ — risk_tier/blast_radius フィールドの定義・バリデーション・デフォルト値解釈 -->

## ADDED Requirements

### Requirement: FR-001 — risk_tier フィールドの定義

Delta Spec の各 Requirement ブロックにおいて、このシステムは SHALL `risk_tier` フィールド（値: `critical` | `standard` | `trivial`）をオプション属性として受け入れる。

#### Scenario: risk_tier が明示された FR のパース

- GIVEN `changes/<change>/specs/<capability>/spec.md` に `risk_tier: critical` フィールドを含む FR ブロックがある
- WHEN `mspec validate --change <change>` を実行する
- THEN パーサーが `risk_tier: critical` を正常に認識し、バリデーションエラーを出さない

---

### Requirement: FR-002 — blast_radius フィールドの定義

Delta Spec の各 Requirement ブロックにおいて、このシステムは SHALL `blast_radius` フィールド（値: `local` | `module` | `system` | `external`）をオプション属性として受け入れる。

#### Scenario: blast_radius が明示された FR のパース

- GIVEN `changes/<change>/specs/<capability>/spec.md` に `blast_radius: external` フィールドを含む FR ブロックがある
- WHEN `mspec validate --change <change>` を実行する
- THEN パーサーが `blast_radius: external` を正常に認識し、バリデーションエラーを出さない

---

### Requirement: FR-003 — risk_tier 未記載 FR のデフォルト扱い

`risk_tier` フィールドが省略されている既存 FR を読み込む場合、このシステムは SHALL その FR を `risk_tier: standard` として扱う。

#### Scenario: 既存 spec の後方互換性

- GIVEN `specs/<capability>/spec.md` に `risk_tier` フィールドを持たない既存 FR が存在する
- WHEN `mspec validate --change <change>` または `mspec delta init` を実行する
- THEN FR が `risk_tier: standard` として解釈され、エラーまたは警告を出さない

---

### Requirement: FR-004 — risk_tier フィールドの値バリデーション

`risk_tier` フィールドに無効な値が指定された場合、このシステムは SHALL バリデーションエラーを出力し処理を中断する。

#### Scenario: 不正な risk_tier 値のエラー

- GIVEN `changes/<change>/specs/<capability>/spec.md` に `risk_tier: unknown` のような未定義値がある
- WHEN `mspec validate --change <change>` を実行する
- THEN `Error: invalid risk_tier value "unknown". Must be critical | standard | trivial` と出力し exit code 1 で終了する

---

### Requirement: FR-005 — blast_radius フィールドの値バリデーション

`blast_radius` フィールドに無効な値が指定された場合、このシステムは SHALL バリデーションエラーを出力し処理を中断する。

#### Scenario: 不正な blast_radius 値のエラー

- GIVEN `changes/<change>/specs/<capability>/spec.md` に `blast_radius: global` のような未定義値がある
- WHEN `mspec validate --change <change>` を実行する
- THEN `Error: invalid blast_radius value "global". Must be local | module | system | external` と出力し exit code 1 で終了する

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
