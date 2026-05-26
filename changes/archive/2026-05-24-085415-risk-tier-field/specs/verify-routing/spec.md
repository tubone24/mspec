# Delta Spec: verify-routing

<!-- Capability scope: verify アノテーション生成 — tasks/checklist の verify ラベル付与・checklist 項目生成有無・implement 警告 -->

## ADDED Requirements

### Requirement: FR-001 — delta ステップでの risk_tier プレースホルダー生成

`mspec delta init` を実行するとき、このシステムは SHALL 生成する FR スタブに `risk_tier` と `blast_radius` のプレースホルダーコメントを含める。

#### Scenario: delta init でのプレースホルダー生成

- GIVEN `mspec delta init --capability <cap> --change <change>` を実行する
- WHEN spec.md が新規生成される
- THEN 生成された FR スタブに `<!-- risk_tier: critical | standard | trivial -->` と `<!-- blast_radius: local | module | system | external -->` のコメントが含まれる

---

### Requirement: FR-002 — tasks.md 生成時の verify 分岐

mspec-tasks スキルが tasks.md を生成するとき、このシステムは SHALL 各タスクに関連する FR の `risk_tier` を参照し、verify 種別を以下のルールで付与する: `critical` → `<!-- verify: human -->`、`standard` → `<!-- verify: fr-NNN -->`（既存動作）、`trivial` → verify アノテーションなし。

#### Scenario: critical FR に対する verify: human の付与

- GIVEN `changes/<change>/specs/<cap>/spec.md` に `risk_tier: critical` の FR-001 が存在する
- WHEN mspec-tasks スキルが tasks.md を生成する
- THEN tasks.md 内の FR-001 に対応するタスクに `<!-- verify: human -->` が付与される

#### Scenario: trivial FR に対する verify アノテーション省略

- GIVEN `changes/<change>/specs/<cap>/spec.md` に `risk_tier: trivial` の FR-002 が存在する
- WHEN mspec-tasks スキルが tasks.md を生成する
- THEN tasks.md 内の FR-002 に対応するタスクに verify アノテーションは付与されない

---

### Requirement: FR-003 — checklist.md の verify 分岐と項目生成有無

mspec-checklist スキルが checklist.md を生成するとき、このシステムは SHALL `risk_tier` の値に応じて以下の動作をする: `critical` → `<!-- verify: human -->` アノテーションを付与した項目を生成する、`standard` → `<!-- verify: fr-NNN -->` アノテーションを付与した項目を生成する、`trivial` → checklist.md に項目を生成しない。

#### Scenario: critical FR の checklist アノテーション

- GIVEN `changes/<change>/specs/<cap>/spec.md` に `risk_tier: critical` の FR-003 が存在する
- WHEN mspec-checklist スキルが checklist.md を生成する
- THEN checklist.md の FR-003 に対応する行に `<!-- verify: human -->` アノテーションが付与される

#### Scenario: trivial FR の checklist 項目スキップ

- GIVEN `changes/<change>/specs/<cap>/spec.md` に `risk_tier: trivial` の FR-004 が存在する
- WHEN mspec-checklist スキルが checklist.md を生成する
- THEN checklist.md に FR-004 に対応する行は生成されない

---

### Requirement: FR-004 — implement ステップでの critical verify 未達警告

mspec-implement スキルの実行時、`risk_tier: critical` の FR に対応する `<!-- verify: human -->` チェックボックスが未完了の場合、このシステムは SHALL 警告を出力し処理を継続する（エラー停止はしない）。

#### Scenario: critical FR の verify: human 未達時の警告

- GIVEN checklist.md に `- [ ] <!-- verify: human --> FR-001` の未完了項目がある
- WHEN mspec-implement スキルが実装完了後のチェック処理を実行する
- THEN `Warning: FR-001 (critical) requires human review. Mark as verify: human before archive.` が出力される
- THEN 処理は継続され exit code 0 で完了する

---

### Requirement: FR-005 — risk_tier デフォルト標準動作の継続

`risk_tier` が省略または `standard` の FR に対して、このシステムは SHALL 従来の verify 動作（変更なし）を維持する。

#### Scenario: risk_tier 未記載 FR の後方互換動作

- GIVEN `changes/<change>/specs/<cap>/spec.md` に `risk_tier` フィールドのない既存 FR-005 が存在する
- WHEN mspec-tasks スキルおよび mspec-checklist スキルが実行される
- THEN FR-005 への verify 付与は従来動作（`<!-- verify: fr-005 -->`）と同一であり、挙動の変化がない

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
