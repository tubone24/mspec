---
doc_type: Reference
---

<!-- @mspec-delta 2026-05-26-084133-reduce-verify-human-in-checklist/specs/verify-routing/spec.md -->
<!-- Requirements implemented: FR-006, FR-007 -->
<!-- Change: reduce-verify-human-in-checklist -->

# Research: reduce-verify-human-in-checklist

## Decisions

| 論点 | 採用案 | 代替案 | 根拠 |
|------|--------|--------|------|
| `verify: auditor` ティアの導入場所 | `mspec-checklist-auditor.md` の Constraints セクションに優先順位ルールを追加し、静的検証コマンドのリストを明示する | mspec-checklist SKILL.md 側でポスト処理する | 検証ロジックはサブエージェント（auditor）の責務。SKILL.md はオーケストレーションのみ担当（I. ステップ独立性） |
| `verify: auditor` の実行タイミング | checklist.md 生成と同時（インライン） — 対象コマンドを実行し、pass なら `- [x]`、fail なら `- [ ]` を決定する | 別コマンド `mspec verify --auditor` として分離する | 即時フィードバックでチェックボックス状態を確定できる。別コマンド分離は新しい強制ステップを増やし Constitution V に抵触するリスクがある |
| `verify: auditor` でコマンド失敗時の扱い | `- [ ] <!-- verify: auditor -->` のまま維持し、エラー原因を項目テキストに注記する（**ユーザー確認済み**） | `verify: human` にフォールバックする | verify: auditor は「自動化可能な性質の項目」という分類を保持する。再実行時に自動回復できる |
| `verify: human` に理由注釈を付ける方法 | `<!-- verify: human -->` の後に理由を日本語括弧書きで項目テキスト末尾に追記する（例: `（視覚的許容性は機械検証不可）`）（**ユーザー確認済み**） | `<!-- verify: human reason="..." -->` インライン属性 | 既存アノテーションパーサーの変更不要。人間が読みやすい形式 |
| Constitution Check 項目の分類 | 各原則を「コマンド検証可能（auditor）」「FR マッピング可能（fr-NNN）」「判断依存（human）」の3種に分類する判断マトリクスを auditor に与える | すべて `verify: human` のまま残す（現状） | Constitution IV（`mspec anchor check`）は完全自動検証可能。VI は Delta Spec の Security Capabilities セクション存在確認で部分自動化可能 |
| Constitution II の分類 | `verify: human`（完全確認は human） | `verify: auditor`（`mspec validate` 通過のみ） | バイト単位の再実行一致は auditor では確認不能。部分確認のみで checked にするのは誤検知リスクがある |
| CLI テンプレートとの同期 | `.claude/agents/mspec-checklist-auditor.md` と `packages/cli/templates/claude/agents/mspec-checklist-auditor.md` の両ファイルを同時に更新する | プロジェクト側のみ更新 | 2ファイルは現時点で完全一致。片方のみ更新すると `mspec init` 生成プロジェクトに変更が引き継がれない |
| 既存 checklist.md への遡及適用 | 適用しない（新規生成分のみ対象） | アーカイブ済み checklist.md にも遡及修正する | 過去のアーカイブは変更済みの成果物であり修正不要。将来生成時にのみ適用する |

---

## Codebase Findings

- `.claude/agents/mspec-checklist-auditor.md:48-54` — Constraints セクションの catch-all ルール。`E2E Scenario 対応項目` → `verify: fr-NNN`、それ以外（Constitution 準拠・設計判断・外部観察） → `verify: human` という2択しかない。`verify: auditor` 層が存在しないため、機械検証可能な項目が全て `verify: human` に落ちる。
- `.claude/agents/mspec-checklist-auditor.md:1-5` — frontmatter に `tools:` フィールドが存在しない。Claude Agents のデフォルトで全ツール（Bash 含む）が使用可能なため、`verify: auditor` が `mspec anchor check` 等を実行するためのツール権限追加は不要。
- `packages/cli/templates/claude/agents/mspec-checklist-auditor.md` — `.claude/agents/` 側と完全に同一内容。両ファイルを必ず同時更新する必要がある。
- `specs/verify-routing/spec.md:1-84` — FR-001〜FR-005 まで定義済み。この change で FR-006・FR-007 が ADDED される予定。現 SoT に `verify: auditor` の概念は記載がない。
- `changes/2026-05-26-041226-reading-mode-themes/checklist.md:56-70` — Constitution Check 7項目すべてが `verify: human`。anchor 確認（Constitution IV）は `mspec anchor check` コマンドで完全自動化可能にもかかわらず human になっている。
- サンプル3件の平均 `verify: human` = **14.3件**、`verify: fr-NNN` = **11.7件**。Constitution Check セクションは100%が `verify: human`。

### Constitution 項目の自動化可能性マトリクス

| Constitution 原則 | 自動化方法 | 推奨 verify 種別 |
|-------------------|-----------|-----------------|
| I. ステップ独立性 | 設計判断依存。文脈読解が必要 | `verify: human` |
| II. 決定論的マージ | `mspec validate` でスキーマ確認可能だが、マージ完全一致は人間判断が必要 | `verify: human` |
| III. 質問駆動の要件確定 | proposal.md の Open Choices 解消を grep 確認可能だが、判断の質は human | `verify: human` |
| IV. 双方向アンカー | `mspec anchor check` で完全自動検証可能 | `verify: auditor` |
| V. 強制ステップ分離 | `workflow.yaml` の `removable` フィールド存在確認は Read ツールで可能。意図確認は human | `verify: auditor`（フィールド存在確認部分） |
| VI. Security by Default | Delta Spec の `## Security Capabilities` セクション存在・PRP-SEC 回答有無を grep で確認可能 | `verify: auditor` |

---

## Open Choices（解決済み）

- ~~**auditor のツール権限**~~: frontmatter に `tools:` 指定なし = デフォルト全ツール使用可能。追加不要。
- ~~**`verify: auditor` でコマンドが失敗した場合の扱い**~~: `- [ ] verify: auditor` のまま維持し、エラー原因を注記する。
- ~~**Constitution II の分類**~~: `verify: human` のまま残す（完全確認は human）。
- ~~**`verify: human` reason 属性のフォーマット**~~: 項目テキスト末尾に括弧書きで日本語追記（既存パーサー変更不要）。
- ~~**既存 checklist.md の遡及適用**~~: 適用しない（新規生成分のみ対象）。

---

## Web References

- [AI Coding Agents Can Verify Some of Their Work Now](https://dev.to/moonrunnerkc/ai-coding-agents-can-verify-some-of-their-work-now-heres-what-they-still-miss-58mc) — エージェントが terminal コマンド実行・ビルド失敗検出・テストスイート実行により自己検証できる範囲と、できない範囲（アクセシビリティ・設定外部化・メタタグ）を整理。`verify: human` が不要な領域の参考基準として有用。
- [Why Human Judgment Is Non-Negotiable for Agentic AI](https://www.testlio.com/blog/agentic-ai-human-judgment) — 「すべてのアクションを人間が承認するのではなく、リスクに応じて人間の介入ポイントを絞り込む」というティアード監視のベストプラクティス。`verify: human` の最終手段化を正当化する根拠。
- [VeriLA: A Human-Centered Evaluation Framework for Interpretable Verification of LLM Agent Failures](https://arxiv.org/pdf/2503.12651) — LLM エージェント障害の解釈可能な検証フレームワーク。決定論的チェックと非決定論的チェックの分離原則を提示。auditor 層の設計参考。
- [A Practical Checklist for Evaluating and Governing AI Agents](https://automaly.io/blog/evaluating-and-governing-ai-agents-checklist) — AI エージェントの評価・ガバナンスチェックリスト実践例。`verify: human` を真に必要な人間判断項目に限定する方針を支持。

---

## Constitution Check

| Principle | Phase 0 | Phase 1 |
|-----------|---------|---------|
| I. ステップ独立性 | `mspec-checklist-auditor.md` の変更は checklist ステップのみに閉じており、他ステップへの新依存を生まない | — |
| II. 決定論的マージ | auditor の判断ルール変更は SoT spec への新 FR 追加（FR-006/007）として delta spec 経由でマージされる。パーサーロジック変更なし | — |
| III. 質問駆動の要件確定 | Open Choices をすべて AskUserQuestion で確定済み。未決定事項なし | — |
| IV. 双方向アンカー | 変更後の `mspec-checklist-auditor.md` に `@mspec-delta` アンカーを付与し `mspec anchor check` で確認する | — |
| V. 強制ステップと拡張ステップの分離 | `verify: auditor` はオプション拡張として機能する。強制ステップ（Spec / Delta Spec / Archive）の構造変更なし | — |
| VI. Security by Default | ファイルシステム変更は `.claude/agents/` と `packages/cli/templates/` の範囲内。外部ネットワーク依存なし | — |
