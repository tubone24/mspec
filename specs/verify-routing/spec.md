<!-- mspec: gaps in FR numbering are intentional. Removed requirements are archived under changes/archive/. -->

# verify-routing Specification

## Purpose

<このスペックがカバーする外部から観測可能な振る舞いの概要>

## Requirements

<!-- archive コマンドが Delta Spec の ADDED/MODIFIED/REMOVED/RENAMED を機械的にマージします -->

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

### Requirement: FR-006 — Constitution IV / VI のインライン事前検証

<!-- risk_tier: standard -->
<!-- blast_radius: module -->

mspec-checklist-auditor が Constitution Check 項目を生成するとき、このシステムは SHALL 以下のルールに従って Constitution IV と VI を事前に静的検証し、チェックボックス状態を確定させる:
- **Constitution IV（双方向アンカー）**: `mspec anchor check` を実行し、ゼロエラーなら `- [x]`、エラーありなら `- [ ]` でチェックボックスを確定する。アノテーションは `<!-- verify: cmd:mspec anchor check -->` に変更する（従来の `verify: human` から変更）。
- **Constitution VI（Security by Default）**: Delta Spec の `## Security Capabilities` セクション存在と PRP-SEC 回答の有無を grep で確認し、存在すれば `- [x]`、不在なら `- [ ]` でチェックボックスを確定する。アノテーションは `<!-- verify: cmd:grep "## Security Capabilities" changes/<change>/specs/ -->` に変更する（従来の `verify: human` から変更）。
- コマンド実行が失敗した場合は `- [ ]` のまま、エラー内容を項目テキストに括弧書きで注記する。

#### Scenario: Constitution IV アンカーゼロエラー時の verify:cmd での自動確定

- GIVEN `mspec anchor check` を実行した結果がゼロエラーである
- WHEN mspec-checklist-auditor が Constitution Check の IV（双方向アンカー）項目を生成する
- THEN checklist.md の Constitution IV 行が `- [x] <!-- verify: cmd:mspec anchor check -->` として出力される

#### Scenario: Constitution VI Security Capabilities セクション存在時の verify:cmd での自動確定

- GIVEN Delta Spec（`changes/<change>/specs/*/spec.md`）の `## Security Capabilities` セクションに PRP-SEC-001〜004 の回答が記載されている
- WHEN mspec-checklist-auditor が Constitution Check の VI（Security by Default）項目を生成する
- THEN checklist.md の Constitution VI 行が `- [x] <!-- verify: cmd:grep "## Security Capabilities" -->` として出力される

---

### Requirement: FR-007 — verify: human フォールバック最小化と理由明記義務

<!-- risk_tier: standard -->
<!-- blast_radius: module -->

mspec-checklist-auditor が checklist.md の各項目に `<!-- verify: human -->` アノテーションを付与するとき、このシステムは SHALL 以下の優先順位で verify 種別を決定し、`verify: human` は最後の手段として使用する:
(1) Delta Spec に E2E Scenario が存在する FR、または CI 上で自動実行されるテストがカバーする FR → `<!-- verify: fr-NNN -->` を使用する（FR-008 参照）、
(2) `mspec validate`・`mspec anchor check`・`mspec spec lint` など CLI コマンドで確認可能な項目 → `<!-- verify: cmd:<command> -->` を使用する（FR-006・FR-008 参照）、
(3) `grep` 等のシェルコマンドで確認可能な静的チェック → `<!-- verify: cmd:<command> -->` を使用する（FR-006・FR-008 参照）、
(4) 上記以外で `<!-- verify: human -->` を付与する場合 → 自動検証が不可能な理由を括弧書きで項目テキスト末尾に明記し、かつ FR-009 に従い確認手順を子リストに記載すること。

#### Scenario: verify: human 付与時の理由明記と手順記載

- GIVEN Source-of-Truth Regression 項目が視覚的 UX 判断を要する内容である
- WHEN mspec-checklist-auditor が当該項目に `<!-- verify: human -->` を付与する
- THEN 項目テキスト末尾に自動検証不可の理由が括弧書きで記載され、かつ直下の子リストに最低 2 項目の確認手順が記載されている

#### Scenario: CLI コマンド検証可能な Constitution IV は verify:cmd を使用

- GIVEN `mspec anchor check` を実行した結果がゼロエラーである
- WHEN mspec-checklist-auditor が Constitution Check の IV（双方向アンカー）項目を生成する
- THEN checklist.md の Constitution IV 行は `<!-- verify: cmd:mspec anchor check -->` アノテーションで自動チェック済みとなる

#### Scenario: E2E Scenario 対応 FR は verify: fr-NNN を優先

- GIVEN Delta Spec の FR-001 に E2E Scenario が存在する
- WHEN mspec-checklist-auditor が FR-001 の Delta Spec Coverage 項目を生成する
- THEN アノテーションは `<!-- verify: fr-001 -->` であり、`<!-- verify: human -->` は使用されない

### Requirement: FR-008 — カテゴリ横断的 verify:auto 優先適用

<!-- risk_tier: standard -->
<!-- blast_radius: module -->

mspec-checklist-auditor が checklist.md を生成するとき、このシステムは SHALL カテゴリ（Delta Spec Coverage・Source-of-Truth Regression・Constitution Check を問わず）に関わらず以下のいずれかを満たす項目に `<!-- verify: human -->` を付与してはならない。代わりに `<!-- verify: fr-NNN -->` またはコマンド参照形式のアノテーションを付与すること:
- `mspec validate`、`mspec anchor check`、`mspec spec lint` などの CLI コマンドで検証可能な項目
- CI/CD パイプラインで実行されるユニットテスト・統合テスト・E2E テストがカバーする項目
- 実行コマンドを checklist 項目テキスト内に明記することで自動化可能な項目
- Source-of-Truth Regression 項目で「影響なし」と判定されたもの（FR に対応するテストが存在する場合は `verify: fr-NNN`、CLI コマンドで確認できる場合は `verify: cmd:<command>` を使用する）

#### Scenario: CLI コマンド検証可能な項目は verify:auto を付与

- GIVEN checklist 項目が `mspec validate` コマンドで検証できる性質である
- WHEN mspec-checklist-auditor が当該項目を生成する
- THEN アノテーションは `<!-- verify: human -->` ではなく `<!-- verify: fr-NNN -->` または `<!-- verify: cmd:mspec validate -->` 形式が使われる

#### Scenario: テストスイートカバー FR は verify:fr-NNN を付与

- GIVEN Delta Spec の FR-003 に対応するテストが CI 上で自動実行される
- WHEN mspec-checklist-auditor が FR-003 に関連する checklist 項目を生成する
- THEN アノテーションは `<!-- verify: fr-003 -->` が使われ、`<!-- verify: human -->` は使われない

#### Scenario: SoT Regression の「影響なし」項目への verify:auto 適用

- GIVEN Source-of-Truth Regression セクションの web-ui-server FR-001 に対応するテストが CI で実行される
- WHEN mspec-checklist-auditor が当該項目を生成する
- THEN アノテーションは `<!-- verify: fr-001 -->` が使われ、`<!-- verify: human -->` は使われない

---

### Requirement: FR-009 — verify:human 項目への確認手順必須記載

<!-- risk_tier: standard -->
<!-- blast_radius: module -->

mspec-checklist-auditor が `<!-- verify: human -->` アノテーション付きの checklist 項目を生成するとき、このシステムは SHALL その項目の直下に確認者が実行すべき具体的な手順を最低 2 項目の箇条書き（インデントされた `  -` リスト）で記載する。手順は「何を操作し、何を目視確認するか」を具体的に記述すること。

#### Scenario: verify:human 項目に確認手順が付与される

- GIVEN FR-XXX が人手確認を必要とする変更を含む
- WHEN mspec-checklist-auditor が当該 FR に対応する `<!-- verify: human -->` 項目を生成する
- THEN checklist.md の当該行の直下に、インデントされた箇条書きで最低 2 項目の確認手順が記載される

#### Scenario: 確認手順なしの verify:human は生成しない

- GIVEN mspec-checklist-auditor が verify:human 項目を生成しようとしている
- WHEN 生成対象の項目に子箇条書きの確認手順が存在しない
- THEN その項目は生成されず、代わりに verify:auto への変換または手順の追加が試みられる

---



