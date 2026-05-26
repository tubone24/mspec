# Delta Spec: question-bank

## ADDED Requirements

### Requirement: FR-001 — Securityカテゴリの追加

<!-- risk_tier: standard -->
<!-- blast_radius: system -->

`proposal.yaml` に質問フェーズ専用の `security` カテゴリを追加し、このシステムは SHALL 権限境界・認証・外部API・秘密情報に関する4問（PRP-SEC-001〜004）をすべてのchangeで表示する。

#### Scenario: 全changeでsecurity質問が表示される
- GIVEN mspec proposalステップを実行する任意のchange
- WHEN `mspec questions --phase proposal --json` を実行する
- THEN レスポンスの `questions` 配列に `category: security` の質問が4問含まれる

### Requirement: FR-002 — Security質問の必須表示条件

<!-- risk_tier: standard -->
<!-- blast_radius: local -->

security カテゴリの各質問は `when: always` フィールドを持ち、このシステムは SHALL risk_tier・変更種別を問わず全changeでこれらの質問を提示する。

#### Scenario: trivialなchangeでもsecurity質問が省略されない
- GIVEN readme.mdのModeフィールドが `minor` または未設定のchange
- WHEN proposalステップでAskUserQuestionが実行される
- THEN security質問がスキップされず少なくとも1問提示される

### Requirement: FR-003 — Security質問の内容定義

<!-- risk_tier: standard -->
<!-- blast_radius: local -->

security カテゴリには以下の4問を含み、このシステムは SHALL 各質問に `multi_select` フィールドを設定する。PRP-SEC-001・PRP-SEC-002は `multi_select: true`、PRP-SEC-003・PRP-SEC-004は `multi_select: false` とする。
- PRP-SEC-001: この変更が触れる権限境界（複数選択可）
- PRP-SEC-002: メール/認証/ファイル/外部API/秘密情報アクセスの増加有無（複数選択可）
- PRP-SEC-003: エージェントへの新規権限付与の有無（単一選択）
- PRP-SEC-004: ロールバック手段（単一選択）

#### Scenario: security質問の選択肢が正しく定義されている
- GIVEN `mspec questions --phase proposal --json` の実行結果
- WHEN categoryが `security` の質問一覧を取得する
- THEN 質問IDがPRP-SEC-001〜PRP-SEC-004の4問が存在し、各質問に `multi_select` フィールドがある

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
