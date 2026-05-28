---
doc_type: Reference
---

# Checklist: dynamic-security-questions

## Delta Spec Coverage

### FR-003 — セキュリティサブエージェントによるコンテキスト分析

- [x] SKILL.md の手順 4a に `mspec-security-analyzer` サブエージェントのインライン呼び出しが追加されており、起動トリガーが security 質問フェーズへの到達であることが明記されている <!-- verify: fr-003 -->
- [x] `.claude/agents/mspec-security-analyzer.md` が新規作成されており、入力スコープが `specs/` と `changes/<current>/` の読み取り専用に限定されていることがエージェント定義プロンプト本文に明記されている <!-- verify: fr-003 -->
- [x] サブエージェントの出力形式（質問テキスト・選択肢 2〜4 個・multi_select フラグのリスト）がエージェント定義で規定されている <!-- verify: fr-003 -->
- [x] サブエージェントが `readme.md`・`proposal.md`（草稿）・`specs/**/*.md` を分析対象として読み取ることが手順またはエージェント定義に記載されている <!-- verify: fr-003 -->

### FR-004 — 動的セキュリティ質問の生成と提示

- [x] SKILL.md の手順 4b にて、サブエージェントが返したリスクリストに基づき 3〜5 問の質問を AskUserQuestion で提示するステップが記述されている <!-- verify: fr-004 -->
- [x] エージェント定義に「生成する質問数は 3〜5 問」という上限/下限の制約が明記されている（3〜5 問カウント制約は AskUserQuestion の選択肢 4 上限とは独立した要件） <!-- verify: fr-004 -->
- [x] 提示される質問が変更内容に固有（change-specific）であることを担保する仕組みがエージェント定義または SKILL.md に記述されている <!-- verify: fr-004 -->
- [x] PRP-SEC-001〜004 のいずれのハードコード質問 ID も AskUserQuestion で呼び出されないことを手順またはコメントで保証している <!-- verify: fr-004 -->

### FR-001 (MODIFIED) — セキュリティ質問の動的生成への置き換え

- [x] `packages/cli/templates/questions/proposal.yaml` から PRP-SEC-001〜PRP-SEC-004 の 4 エントリ（lines 106–155）が削除されている <!-- verify: fr-001 -->
- [x] `QUESTION_CATEGORIES` 定数（CLI 実装側）に `'security'` 型が残存しており、将来拡張を妨げていないことを確認する <!-- verify: fr-001 -->
- [x] SKILL.md の手順 4 から「PRP-SEC-001〜004 の 4 問を AskUserQuestion で別枠として必ず提示すること」の記述が完全に削除されている <!-- verify: fr-001 -->
- [x] SKILL.md の手順 5（proposal.md 記述）および手順 5 内の `## Decisions` 記録指示から PRP-SEC-001〜004 への ID 参照が削除されている（SKILL.md line 32 の「PRP-SEC-001〜004のsecurity質問の回答を記録すること」が更新されている） <!-- verify: fr-001 -->

### FR-002 (MODIFIED) — 動的セキュリティ質問回答の proposal.md 反映

- [x] SKILL.md の手順 4b または 5 に、動的生成された質問と回答のペアを `proposal.md` の `## Decisions` テーブルに記録する指示が追加されている <!-- verify: fr-002 -->
- [x] `packages/cli/templates/artifacts/delta-spec.ja.md`・`delta-spec.en.md`・`delta-spec.md` の 3 ファイル全てで `## Security Capabilities` スロットのコメントテキストが「動的生成セキュリティ質問と回答のペアを列挙する」汎用フォーマットに更新されており、内容が 3 ファイル間で一致している <!-- verify: fr-002 -->
- [x] 既存の proposal.md パーサーや readers が `PRP-SEC-*` ID に依存している箇所（もし存在すれば）が特定・更新されている <!-- verify: fr-002 -->

---

## Source-of-Truth Regression Risk

- [x] 【HIGH】既存 SoT spec（`specs/mspec-proposal/spec.md`）の FR-001 Scenario は「PRP-SEC-001〜004 の 4 問全てが AskUserQuestion で呼び出されている」ことをアサートする。本変更後はこの Scenario が反転するため、旧 Scenario を参照するアンカー・E2E テスト・CI アサーションが存在する場合は全て retire または更新する必要がある <!-- verify: human -->
- [x] 【HIGH】既存 SoT spec FR-002 Scenario は「security 質問の回答が `## Decisions` テーブルに記述されている」ことを要求する。動的質問回答への変更後もこの記録義務は継続するが、ID ベース（`PRP-SEC-*`）から質問テキストペアへの形式変更によって既存の検証スクリプト・テンプレートパーサが壊れないことを確認する <!-- verify: human -->
- [x] 【MEDIUM】SKILL.md line 32 の「PRP-SEC-001〜004のsecurity質問の回答を記録すること」という記述が手順 4 の改訂と整合的に更新されているかを確認する（design.md の変更対象リストに明示的に記載がないため見落としリスクあり） <!-- verify: human -->
- [x] 【MEDIUM】`mspec questions --phase proposal --json` の出力から PRP-SEC-001〜004 が消えることで、質問バンクを参照している他のツール・スクリプト・ドキュメントが破損しないことを確認する <!-- verify: human -->
- [x] 【LOW】`.claude/agents/mspec-security-analyzer.md` の新規作成により、既存エージェント定義ファイルとの命名衝突または `workflow.yaml` のエージェント登録要否が発生しないことを確認する <!-- verify: human -->

---

## Constitution Check

- [x] **Principle I — ステップ独立性**: 本変更は SKILL.md・YAML・エージェント定義・テンプレートのみを変更し、他ステップ（delta / design / tasks など）の produced artifacts に影響しない。変更後も proposal ステップは `mspec status` 再読込で独立して再開可能であることを確認する <!-- verify: human -->
- [x] **Principle II — 決定論的マージ**: 変更対象の全ファイル（SKILL.md・proposal.yaml・delta-spec テンプレート 3 種・mspec-security-analyzer.md）はそれぞれ単一箇所の変更であり、`git revert` で完全に元に戻せることを確認する <!-- verify: human -->
- [x] **Principle III — 質問駆動の要件確定**: 動的生成された 3〜5 問が AskUserQuestion で 1 問 1 答形式（1 per call）で提示される。AskUserQuestion の選択肢 4 個上限をサブエージェントが質問生成時に遵守することがエージェント定義に明記されているかを確認する <!-- verify: human -->
- [x] **Principle IV — 双方向アンカー**: SKILL.md の変更箇所（手順 4 の改訂部分）に `@mspec-delta 2026-05-27-070619-dynamic-security-questions/specs/mspec-proposal/spec.md` アンカーが付与されており、`mspec anchor check` でアンカーと FR-001〜FR-004 が双方向に解決されることを確認する <!-- verify: human -->
- [x] **Principle V — 強制ステップと拡張ステップの分離**: `workflow.yaml` の step 定義は不変であり、security フェーズは proposal ステップ内部の実装変更に留まることを確認する。`removable` フラグ等のワークフロー構造が変更されていないことを確認する <!-- verify: human -->
- [x] **Principle VI — Security by Default（解決済み）**: ユーザー確認済み。`memory/constitution.md` の VI 条を本 change 内で改訂し、PRP-SEC-001〜004 の ID 参照を削除して「変更固有のセキュリティ質問（3〜5 問）への回答を必須とする」に書き換える。`memory/constitution.md` を tasks.md の実装タスクに追加する <!-- verify: human -->

---

## Regression Risk Summary

**HIGH** — Constitution Principle VI（Security by Default）との直接的テキスト競合。`memory/constitution.md` は PRP-SEC-001〜004 を ID 指定で必須としているが、本変更はこれらを廃止する。設計上の Phase 1 評価は CAUTION → OK としているものの、4 カテゴリカバレッジの保証または憲法改訂手続きのどちらも現時点で設計に含まれていない。加えて、既存 SoT Spec FR-001 Scenario の反転に伴う既存テスト・アンカーの retire が必要となる点も HIGH リスクである。
