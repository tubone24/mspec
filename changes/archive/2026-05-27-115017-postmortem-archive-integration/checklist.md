# Checklist: postmortem-archive-integration

## Delta Spec Coverage

### mspec-archive

- [x] FR-001 (mspec-archive) — archive 完了後に mspec-lessons-analyzer サブエージェントが起動し、Lessons が 1 件以上ある場合に constitution.md への追加提案リストが返されることを確認する <!-- verify: fr-001 -->
- [x] FR-001 (mspec-archive) — readme.md に Lessons が記載されていない場合に Lessons 分析フローがスキップされ、Next Steps 評価フローのみ実行されることを確認する <!-- verify: fr-001 -->
- [x] FR-002 (mspec-archive) — archive 完了後に mspec-nextaction-planner サブエージェントが起動し、Next Steps が 1 件以上ある場合に優先度付き NextAction リストが返されることを確認する <!-- verify: fr-002 -->
- [x] FR-003 (mspec-archive) — ユーザーが AskUserQuestion で提案を却下した場合、constitution.md への書き込みおよび `mspec new` の実行が一切行われないことを確認する <!-- verify: human -->
- [x] FR-004 (mspec-archive) — ユーザーが NextAction を承認した場合、mspec-nextaction-planner が生成した kebab-case 名で `mspec new <feature-kebab>` が実行され `changes/<timestamp>-<name>/` ディレクトリが生成されることを確認する <!-- verify: fr-004 -->

### memory-constitution

- [x] FR-001 (memory-constitution) — ユーザーが AskUserQuestion で承認した提案のテキストが、指定された target_section（Core Principles または Additional Constraints）の末尾に追記されることを確認する <!-- verify: fr-001 -->
- [x] FR-002 (memory-constitution) — ユーザーが承認していない提案に対して constitution.md が変更されず、元のファイル内容が保持されることを確認する <!-- verify: human -->

### mspec-lessons-analyzer

- [x] FR-001 (mspec-lessons-analyzer) — サブエージェント起動時に readme.md の Lessons 全件を読み取り、constitution.md の既存原則と照合して重複を除外した提案リストを返すことを確認する <!-- verify: fr-001 -->
- [x] FR-001 (mspec-lessons-analyzer) — constitution.md の既存原則と重複する Lesson が提案リストに含まれないことを確認する <!-- verify: fr-001 -->

### mspec-nextaction-planner

- [x] FR-001 (mspec-nextaction-planner) — サブエージェント起動時に readme.md の Next Steps 全件を読み取り、緊急度・影響範囲・実装コストを評価した優先度（high/medium/low）と推奨 kebab-case 名を付与したランキングリストを返すことを確認する <!-- verify: fr-001 -->
- [x] FR-002 (mspec-nextaction-planner) — 日本語テキストの Next Steps が小文字英数字とハイフンのみで構成される kebab-case フィーチャー名に正規化されることを確認する <!-- verify: fr-002 -->
- [x] FR-002 (mspec-nextaction-planner) — `; rm -rf /` 等の特殊文字・コマンドインジェクション可能な文字列が Next Steps テキストに含まれる場合、特殊文字が除去された安全な kebab-case 名のみが返されることを確認する <!-- verify: fr-002 -->

## Source-of-Truth Regression

- [x] REGRESSION: 既存の archive ステップ 3b（readme.md の Summary 生成）が postmortem フック挿入後も変更されず正常に実行されることを確認する <!-- verify: human -->
- [x] REGRESSION: 既存の archive ステップ 4（完了レポート）が AskUserQuestion のキャンセルやサブエージェント失敗を含むあらゆる postmortem 実行結果の後に必ず実行されることを確認する <!-- verify: human -->
- [x] REGRESSION: postmortem フック追加後も Delta Spec → SoT Spec の決定論的マージロジック（LLM 非依存・純粋関数）が変更されていないことを確認する <!-- verify: human -->
- [x] REGRESSION: `.claude/skills/mspec-archive/SKILL.md`（runtime）と `packages/cli/templates/claude/skills/mspec-archive/SKILL.md`（template）の内容が同期されており、postmortem フックが両ファイルに同一の形で追加されていることを確認する <!-- verify: human -->
- [x] REGRESSION: archive ステップ全体の動作を E2E で通し確認する（新規 FR のみの追加だが、既存フロー全体への影響を実機で確認する） <!-- verify: human -->
- [x] REGRESSION: `mspec-proposal` の security-analyzer サブエージェント起動パターンを参考にした設計だが、proposal スキルの既存フローに影響を与えていないことを確認する <!-- verify: human -->

## Constitution Check

- [x] I. ステップ独立性 — postmortem フックが archive スキル内で完結しており、前段の会話文脈に依存せず、サブエージェントがそれぞれ独立したコンテキストで動作することを確認する <!-- verify: human -->
- [x] II. 決定論的マージ — constitution.md への追記位置が固定 enum（Core Principles / Additional Constraints）で決定され、LLM の非決定的判断に依存しないこと、および既存のマージサマリ生成ロジックが変更されていないことを確認する <!-- verify: human -->
- [x] III. 質問駆動の要件確定 — Lessons 提案・Next Steps 提案の両方において AskUserQuestion（multi-select）を経由し、ユーザーが選択した項目のみが実行されることを確認する <!-- verify: human -->
- [x] IV. 双方向アンカー — 新規作成・修正される全 SKILL.md に `@mspec-delta` アンカーが付与され、FR-001〜FR-004 へのトレーサビリティが確保されていることを確認する <!-- verify: human -->
- [x] V. 強制ステップと拡張ステップの分離 — `workflow.yaml` の archive ステップ定義が変更されておらず、postmortem ロジックが SKILL.md 内に完結していることを確認する <!-- verify: human -->
- [x] VI. Security by Default — 本変更の Delta Spec Security Capabilities セクションに権限境界・アクセス増加・エージェント権限・ロールバック手段の 4 カテゴリがすべて記載されていることを確認する <!-- verify: human -->

## Security Checklist

- [x] SECURITY: mspec-nextaction-planner が返す kebab_name が `^[a-z0-9][a-z0-9-]*[a-z0-9]$` に準拠しており、`mspec new` コマンドに渡す前にバリデーションまたはサニタイズが実施されることを確認する <!-- verify: human -->
- [x] SECURITY: `mspec new` の実行スコープが `changes/` 配下のみに制限されており、他ディレクトリへのディレクトリ生成が発生しないことを確認する <!-- verify: human -->
- [x] SECURITY: constitution.md への書き込みが AskUserQuestion による明示的なユーザー承認後にのみ発生し、サブエージェントが直接書き込みを行わないことを確認する <!-- verify: human -->
- [x] SECURITY: mspec-lessons-analyzer サブエージェントの権限が `readme.md` と `memory/constitution.md` の読み取りに限定されており、書き込みアクセスを持たないことを確認する <!-- verify: human -->
- [x] SECURITY: mspec-nextaction-planner サブエージェントの権限が `readme.md` の読み取りのみに限定されており、書き込みアクセスを持たないことを確認する <!-- verify: human -->
- [x] SECURITY: ロールバック手段として `git revert` が明示されており、constitution.md への誤追記が発生した場合に復元可能な状態であることを確認する <!-- verify: human -->
