---
doc_type: Reference
---

<!-- See also: ./design-rationale.md for採用理由・代替案 -->

# Design: improve-postmortem-quality

## Summary

ポストモーテム品質を2点改善する。(1) `mspec-lessons-analyzer` に固有名詞シグナルによる抽象化判定ロジックを追加し、Lessons を具体事象からプロセス原則へ昇華させる。(2) `mspec-nextaction-planner` の出力スキーマに `request_summary` フィールド（optional）を追加し、`mspec-archive` スキルが `mspec new --request` フラグ経由で新規チェンジの `readme.md` に概略を自動記述する。

## Technical Context

### 現状の問題

| コンポーネント | 現状 | 問題 |
|---|---|---|
| `mspec-lessons-analyzer` step 5 | `text: concise, actionable principle` と指示するが「どの程度まで昇華するか」の基準が未定義 | 具体事象（ツール名・操作手順を含む）がそのまま constitution.md に提案される |
| `mspec-nextaction-planner` 出力 | `{ priority, kebab_name, summary, source_next_step }` の4フィールド | `mspec new` 後の `readme.md` の `## Request` が未記入のまま。別セッションで開いた際に文脈が失われる |
| `mspec-archive` SKILL.md:72 | `mspec new <kebab_name>` を呼ぶ | `--request` フラグを使用していないため readme に概略が書き込まれない |

### 関連ファイル（変更対象）

| ファイル | 役割 | 変更種別 |
|---|---|---|
| `.claude/agents/mspec-lessons-analyzer.md` | lessons-analyzer サブエージェント定義 | 修正（抽象化判定ロジック追加） |
| `.claude/agents/mspec-nextaction-planner.md` | nextaction-planner サブエージェント定義 | 修正（`request_summary` フィールド追加） |
| `.claude/skills/mspec-archive/SKILL.md` | archive スキル（両サブエージェントを呼ぶ親） | 修正（`--request` フラグ追記） |

### 変更しないファイル

- `packages/cli/src/commands/new.ts` — `--request` フラグ実装済み。CLI 変更不要
- `specs/*/spec.md` — archive ステップで Delta Spec からマージされる

## Project Structure

### mspec-lessons-analyzer の変更

**追加するロジック（step 5 の前に挿入）:**

```
5-pre. 抽象化判定（concreteness detection）:
  - 各 Lesson bullet に以下の concreteness signal が含まれるか確認:
    * ツール名（mspec, git, npm など）
    * コマンド名（mspec new, mspec continue など）
    * ファイル名（.md, .ts, .json などの拡張子を含む文字列）
    * ファイルパス（/ や . を含むパス形式）
  - signal がある → 抽象化必須（ツール名・ファイル名を除去してプロセス原則に変換）
  - signal がない → pass-through（再抽象化しない）
```

**step 5 の text 生成ルール更新:**

```
現状: "concise, actionable principle or constraint text (general, not change-specific)"
変更後: "抽象化必須エントリは concreteness signal（ツール名・ファイル名）を除去し、
          プロセス原則または設計上の教訓として1文で表現する。
          pass-through エントリはそのままの文章を使用する。
          いずれも最大1段階の抽象化に留め、哲学的命題にしない。"
```

### mspec-nextaction-planner の変更

**出力スキーマに `request_summary` を追加:**

```json
{
  "priority": "high",
  "kebab_name": "kebab-case-name",
  "summary": "日本語サマリー（1行）",
  "request_summary": "1行の英語または日本語概略テキスト（改行なし）",
  "source_next_step": "元の Next Steps 箇条書きテキスト"
}
```

**`request_summary` 生成ルール:**

- `source_next_step` から「何を・なぜ変更するか」を1文で要約する
- 改行文字を含めない（シェル引数として安全に渡せる形式）
- ダブルクォート（`"`）・`$`・バックティック（`` ` ``）・バックスラッシュ（`\`）を含めない（シェル引数としての安全性を保証、kebab_name の注入防止制約と同水準）
- 100文字以内を目安とする
- `kebab_name` と意味的に整合していること

### mspec-archive SKILL.md の変更

**変更箇所 (line 72):**

```diff
- 6. ユーザーが承認したエントリについて `mspec new <kebab_name>` を実行する（`changes/` 配下のみ）
+ 6. ユーザーが承認したエントリについて `mspec new <kebab_name> --request "<request_summary>"` を実行する（`changes/` 配下のみ）
+    （`request_summary` が空または未存在の場合は `mspec new <kebab_name>` にフォールバック）
```

## Decisions

### Decision 1: 抽象化判定に固有名詞シグナルを使用する

**受け入れ基準（FR-003 Scenario 対応）:**

| Scenario | GIVEN | WHEN | THEN（期待動作） |
|---|---|---|---|
| 具体的実装ミスの Lesson | "delta init 後に spec.md のプレースホルダーを埋め忘れた" | lessons-analyzer が処理する | ツール名・ファイル名を除去した抽象原則テキストを返す |
| ツール固有ミスの Lesson | "mspec continue を確認せずに手動で…" | lessons-analyzer が起動される | ツール名を除去した再利用可能な原則テキストを返す |
| 既に抽象的な Lesson | 「ユーザーへの確認なしに不可逆な操作を行ってはならない」 | lessons-analyzer が起動される | そのままのテキストを返す（pass-through） |

### Decision 2: `request_summary` を optional フィールドとして追加する

**受け入れ基準（FR-003 Scenario 対応）:**

| Scenario | GIVEN | WHEN | THEN（期待動作） |
|---|---|---|---|
| Next Steps から新規チェンジが提案 | planner が Next Steps エントリを処理 | archive スキルが mspec:new の実行を提案 | 生成チェンジの readme.md の `## Request` に概略テキストが記載されている |
| 空の readme.md による文脈消失 | Request セクションが未記入 | 別セッションで開く | 何から始めるかわからない（本 decision はこれを防止） |
| 概略の行数制限 | Next Steps が長文テキスト | planner が request_summary を生成 | 改行なしの1文（100文字以内）で収まる |

## Constitution Check

| 原則 | Phase 0 | Phase 1 |
|------|---------|---------|
| I. ステップ独立性 | ✅ 設計は実装ファイルを指定するのみ | ✅ 3ファイルの独立した変更。相互依存なし（archive→planner は一方向） |
| II. 決定論的マージ | ✅ FR-003 追加のみ。既存 FR 不変 | ✅ archive の line 72 変更は1箇所に局所化。副作用なし |
| III. 質問駆動の要件確定 | ✅ research で4つの設計判断を確認済み | ✅ 実装判断が必要な曖昧さはない |
| IV. 双方向アンカー | ✅ Delta Spec FR-003 ↔ design decisions が対応 | ✅ Scenario ↔ 受け入れ基準のトレーサビリティ確保 |
| V. 強制ステップと拡張ステップの分離 | ✅ design は拡張ステップ | ✅ 強制ステップ（implement/archive）の構造変更なし |
| VI. Security by Default | ✅ planner を read-only のまま維持 | ✅ `--request` の値はプランナーが生成したテキストのみ。シェルインジェクション対策として改行・ダブルクォート・`$`・バックティック・バックスラッシュを禁止文字として明示（kebab_name の注入防止制約と同水準） |

### Complexity Tracking

None

## Self-Review

### Findings

- **[warning → 修正済み]** Shell injection surface on `request_summary` — 改行禁止だけでは不十分。ダブルクォート・`$`・バックティック・バックスラッシュも禁止文字として明示。design.md の `request_summary` 生成ルールと Constitution Check VI を更新済み。
- **[warning → 修正済み]** Spec-to-design 行数不一致 — Delta Spec FR-003 本文・Scenario 3 が「1〜3行」と規定していたが、design（1行制限）と矛盾。Delta Spec を「改行なしの1行（100文字以内）」に修正済み。
- **[warning → 修正済み]** Security Capabilities の主体誤り — nextaction-planner Delta Spec が write access を planner 自身に帰属させていたが、実際は archive スキルが `mspec new` を呼ぶ。planner は read-only のまま。修正済み。
- **[nit → 修正済み]** SKILL.md diff の `（changes/ 配下のみ）` が欠落していた。design.md の diff ブロックに復元済み。
- **[ok]** `--request` フラグ実装確認済み（`packages/cli/src/commands/new.ts` lines 34, 97, 105）。CLI 変更不要。
- **[ok]** 全 FR-003 Scenario が design.md の Decision テーブルと 1:1 対応。カバレッジに欠落なし。
- **[ok]** architecture-overview.md の Mermaid 図が実装ファイル名と一致。
- **[ok]** Regression リスク評価（checklist.md）は正確。既存 FR-001/002 への干渉経路は設計上発生しない。

### Verdict

pass-with-warnings（修正済み）— 3つの warning（シェルインジェクション範囲、仕様と設計の行数矛盾、Security Capabilities の主体誤り）を全て修正。コア設計は妥当で実装可能な状態になったわん。
