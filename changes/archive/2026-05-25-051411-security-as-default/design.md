---
doc_type: Reference
change: 2026-05-25-051411-security-as-default
---

<!-- See also: ./design-rationale.md for採用理由・代替案 -->

# Design: security-as-default

## Summary

4つのテンプレートファイルとYAML設定ファイルに対して純粋なテキスト追加を行う。新しいCLIコード・新しいパーサー・新しいコマンドは一切追加しない。変更範囲は `packages/cli/templates/` と `memory/` ディレクトリに閉じている。

## Technical Context

mspecのsecurity質問バンクは `packages/cli/templates/questions/proposal.yaml` で管理され、`mspec questions --phase proposal --json` で動的に読み込まれる。Constitution原則は `memory/constitution.md`（現プロジェクト）と `packages/cli/templates/constitution.md`（新規プロジェクト雛形）の2箇所に存在する。delta specテンプレートは `delta-spec.ja.md`・`delta-spec.en.md`・`delta-spec.md`（バイリンガル混在）の3ファイルがある。

## Project Structure

変更対象ファイル一覧：

| ファイル | 操作 | 変更内容 |
|---------|------|--------|
| `packages/cli/templates/questions/proposal.yaml` | 修正 | `security` カテゴリ 4問（PRP-SEC-001〜004）を末尾に追加 |
| `packages/cli/templates/artifacts/delta-spec.ja.md` | 修正 | `## Security Capabilities` セクションをADDED Requirements直前に追加 |
| `packages/cli/templates/artifacts/delta-spec.en.md` | 修正 | 同上（英語版） |
| `packages/cli/templates/artifacts/delta-spec.md` | 修正 | 同上（バイリンガル混在版） |
| `memory/constitution.md` | 修正 | `### VI. Security by Default` 原則をV原則直後に追加、Version 1.1.0・Last Amended更新 |
| `packages/cli/templates/constitution.md` | 修正 | III.〜V.プレースホルダー追加 + VI.実文追加 |
| `packages/cli/templates/claude/skills/mspec-proposal/SKILL.md` | 修正 | 手順4にsecurity質問の実施を明記、手順5/6にsecurity回答のproposal.md記録を追加 + @mspec-deltaアンカー追記 |

## Decisions

### D-1: proposal.yamlへのsecurityカテゴリ追加

**追加するYAML構造**（ファイル末尾に追記）:

```yaml
  - id: PRP-SEC-001
    category: security
    when: always
    question: この変更が触れる権限境界は? (複数可)
    options:
      - ファイルシステムアクセス
      - ネットワーク/外部API
      - メール/通知
      - 秘密情報 (Secrets/環境変数)
      - 認証/認可
      - なし
    multi_select: true
    recommend_first: false

  - id: PRP-SEC-002
    category: security
    when: always
    question: この変更でアクセス範囲が増加するものは? (複数可)
    options:
      - メール送信
      - 認証情報の取得・保存
      - ファイル読み書き範囲の拡大
      - 外部APIコール追加
      - 秘密情報へのアクセス追加
      - 増加なし
    multi_select: true
    recommend_first: false

  - id: PRP-SEC-003
    category: security
    when: always
    question: エージェント/自動化処理への新規権限付与はありますか?
    options:
      - あり (内容をOpen Questionsに記録)
      - なし
      - 該当しない
    multi_select: false
    recommend_first: false

  - id: PRP-SEC-004
    category: security
    when: always
    question: この変更のロールバック手段は?
    options:
      - git revert
      - マイグレーション down
      - フィーチャーフラグ
      - ロールバック不可
    multi_select: false
    recommend_first: false
```

**受け入れ基準**: `mspec questions --phase proposal --json` の出力に `category: security` の質問が4問含まれ、各質問に `when: always` が設定されている。

### D-2: delta-specテンプレートへのSecurity Capabilitiesセクション追加

**追加するMarkdown**（`## ADDED Requirements` の直前に挿入、3テンプレート共通）:

```markdown
## Security Capabilities

<!-- proposalのsecurity質問（PRP-SEC-001〜004）の回答からmspec-proposalスキルが記述する -->
<!-- 権限境界: <PRP-SEC-001の回答> -->
<!-- アクセス増加: <PRP-SEC-002の回答> -->
<!-- エージェント権限: <PRP-SEC-003の回答> -->
<!-- ロールバック手段: <PRP-SEC-004の回答> -->

```

このセクションはHTMLコメントのみで構成されるため、`mspec archive` のマージロジック（ADDED/MODIFIED/REMOVED/RENAMEDセクションのみ処理）に干渉しない。

**受け入れ基準**: 3つのdelta-specテンプレートすべてに `## Security Capabilities` 見出しが存在する。

### D-3: memory/constitution.mdへのVI原則追加

**追加する原則テキスト**（`### V. 強制ステップと拡張ステップの分離` の直後・`## Additional Constraints` の直前に挿入）:

```markdown
### VI. Security by Default

すべてのchangeのproposalステップにおいて、権限境界・外部API・メール/通知・秘密情報・認証に関するセキュリティ質問（PRP-SEC-001〜004）への回答を必須とする。エージェントが自律的にコードを生成・変更する際、セキュリティを後付けの考慮事項ではなく設計の一部として扱い、すべての変更がblast_radiusと権限変更の影響範囲を明示した状態でdelta specに記録されることを要求する。
```

**バージョン更新**: `Version: 1.0.0 → 1.1.0`、`Last Amended: 2026-05-14 → 2026-05-25`

**受け入れ基準**: `memory/constitution.md` に `### VI. Security by Default` が存在し、Versionが `1.1.0` である。

### D-4: packages/cli/templates/constitution.mdへのVI原則追加

現在のテンプレートは `### I.` と `### II.` プレースホルダーのみ。以下の構造に更新する:

```markdown
### I. <Principle Name>

<Description>

### II. <Principle Name>

<Description>

### III. <Principle Name>

<Description>

### IV. <Principle Name>

<Description>

### V. <Principle Name>

<Description>

### VI. Security by Default

すべてのchangeのproposalステップにおいて、権限境界・外部API・メール/通知・秘密情報・認証に関するセキュリティ質問（PRP-SEC-001〜004）への回答を必須とする。エージェントが自律的にコードを生成・変更する際、セキュリティを後付けの考慮事項ではなく設計の一部として扱い、すべての変更がblast_radiusと権限変更の影響範囲を明示した状態でdelta specに記録されることを要求する。
```

**受け入れ基準**: `mspec init`で作成した新規プロジェクトの`memory/constitution.md`に`### VI. Security by Default`が存在する。

### D-5: mspec-proposal SKILL.mdの更新

手順4の説明文を以下のように更新する（差分のみ記述）:

- **変更前**: `Ask 3–5 clarifying questions via AskUserQuestion (1 per call, multi-select preferred), covering functional scope, NFR, completion criteria, terminology.`
- **変更後**: `Ask 3–5 clarifying questions via AskUserQuestion (1 per call, multi-select preferred), covering functional scope, NFR, completion criteria, terminology. **その後、Securityカテゴリ（PRP-SEC-001〜004）の4問をAskUserQuestionで別枠として必ず提示すること（3〜5問の上限に含まれない）。**`

手順5（proposal.md生成）に追記:
- `## Decisions` テーブルにsecurity質問（PRP-SEC-001〜004）の回答を記録する。

ファイル先頭の`@mspec-delta`アンカーブロックを追記:
```
<!-- @mspec-delta 2026-05-25-051411-security-as-default/specs/mspec-proposal/spec.md -->
<!-- Requirements implemented: FR-001, FR-002 -->
<!-- Change: security-as-default -->
```

**受け入れ基準**: SKILL.mdにPRP-SEC質問への言及があり、@mspec-deltaアンカーが追加されている。

---

## Constitution Check

| 原則 | Phase 0 評価 | Phase 1 評価 |
|------|-------------|-------------|
| I. ステップ独立性 | ✅ PASS — 変更対象は全てテンプレートファイル。CLIのステップ間依存を増やさない | ✅ PASS — 実装はファイル追記のみ。実行時の依存関係変化なし |
| II. 決定論的マージ | ✅ PASS — YAML/Markdownへの純粋な追記。CLIパーサー変更なし | ✅ PASS — Security Capabilitiesセクションはarchiveマージ対象外（コメントのみ） |
| III. 質問駆動の要件確定 | ✅ PASS — この変更自体がIII原則をsecurityドメインに拡張する | ✅ PASS — PRP-SEC-001〜004でsecurity要件を質問駆動で確定する仕組みを強化 |
| IV. 双方向アンカー | ✅ PASS — SKILL.mdに@mspec-deltaアンカー追加予定 | ✅ PASS — 全変更ファイルにアンカーを打つ設計 |
| V. 強制ステップと拡張ステップの分離 | ✅ PASS — workflow.yamlの強制ステップ定義は変更しない | ✅ PASS — proposalステップの内容拡張のみ |

### Complexity Tracking

None

---

## Self-Review

> Reviewed by: mspec-self-reviewer subagent
> Date: 2026-05-25

### Findings

| # | 重要度 | 対象 | 指摘 | 対応 |
|---|--------|------|------|------|
| 1 | 🔴 blocker | `proposal.md` / `specs/constitution/spec.md` | VI vs VII命名の不整合。proposal.mdのGoals・DecisionsがVIIを参照、constitution specのシナリオ見出し・本文もVIIと誤記 | ✅ 修正済み（全箇所をVIに統一） |
| 2 | 🔴 blocker | `specs/mspec-proposal/spec.md` FR-001 Scenario | THEN句が「少なくとも1問」で、4問全問必須という設計意図と矛盾 | ✅ 修正済み（THEN句を「4問全て呼び出されている」に強化） |
| 3 | 🔴 blocker | `design.md` D-5 / `specs/mspec-proposal/spec.md` FR-001 | 「3〜5問」上限と「security 4問必須」の衝突。上限に含まれるとfunctional質問スロットが枯渇 | ✅ 修正済み（「別枠で必ず提示、3〜5問の上限に含まれない」と明確化） |
| 4 | 🟡 | `proposal.md` Goals | delta-spec.md（第3テンプレート）の記載漏れ | ✅ 修正済み（Goals に3ファイルを明示） |
| 5 | 🟡 | PRP-SEC-003選択肢 / SKILL.md設計 | 「あり（内容をOpen Questionsに記録）」という選択肢が約束する動作が仕様に未定義 | ⚠️ checklist項目を追加。実装時に選択肢テキストかSKILL.md手順のどちらかで解決する |
| 6 | 🟡 | `checklist.md` | mspec validate通過確認・whenフィールドCLI出力確認・SKILL.md別枠確認の3項目が欠落 | ✅ 修正済み（checklist末尾に3項目追加） |
| 7 | 🟡 | `quickstart.md` | 誤字（mspce）・Setup説明が「memory/constitution.mdは手動編集必要」を省いた誤解を招く表現 | ✅ 修正済み |
| 8 | 🟢 nit | `architecture-overview.md` Mermaid | `\n` はGFM Mermaidでリテラル文字列として描画される可能性。表示崩れリスク | ⚠️ 機能影響なし。次回Mermaid編集時に `<br/>` に換えることを推奨 |
| 9 | 🟢 nit | Constitution VI原則本文 | PRP-SEC-001〜004をハードコード。IDが変更された場合に原則本文の更新が必要になる設計的脆弱性 | ⚠️ 記録のみ。現時点では許容トレードオフ |

### Constitution Re-Evaluation

| 原則 | 判定 | コメント |
|------|------|---------|
| I. ステップ独立性 | ✅ PASS | テンプレートとYAMLのみの変更。ステップ間依存増加なし |
| II. 決定論的マージ | ✅ PASS | Security CapabilitiesセクションはHTMLコメントのみ。archiveマージ非対象 |
| III. 質問駆動の要件確定 | ✅ PASS | PRP-SEC-001〜004の4問でsecurity要件を質問駆動で確定 |
| IV. 双方向アンカー | ⚠️ 要確認 | テンプレートファイル自体にアンカーがない慣行を確認する。SKILL.mdのアンカーで原則IVを満たせるかプロジェクト慣行を明示化する必要あり |
| V. 強制ステップと拡張ステップの分離 | ✅ PASS | workflow.yaml変更なし |

### Summary

全体的な設計方向は整合しており実装難易度は低い。3つのblockerはすべて修正済み。残課題はPRP-SEC-003の選択肢テキストと動作定義の整合（実装時に解決）、およびarchitecture-overview.mdのMermaid `\n` 表記（次回編集時に解決）の2点のみ。

### Recommended Actions Before Implementation

- ~~proposal.md・constitution specのVI/VII統一~~ → ✅ 完了
- ~~mspec-proposal FR-001 THEN句の4問全問化~~ → ✅ 完了
- ~~SKILL.md D-5の別枠化明記~~ → ✅ 完了
- PRP-SEC-003の「あり（内容をOpen Questionsに記録）」動作をSKILL.md手順に記述するか選択肢テキストを変更する（実装時判断）
