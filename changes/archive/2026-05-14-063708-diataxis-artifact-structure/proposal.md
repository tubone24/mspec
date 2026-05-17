# Proposal: Diátaxis Artifact Structure

## Why

mspec の成果物は AI 向けの詳細文書（research.md など）と人間向けの読み物が混在しており、誰が何を読むべきかが不明確である。これにより、人間のレビュアーは重い文書を読む負荷を抱え、AI は文書間で用語の解釈がぶれるリスクがある。

Diátaxis のドキュメントタイプ分類（Tutorial / How-to / Reference / Explanation）を各成果物に明示し、用語を `glossary.md` に集約することで、人間向けドキュメントの軽量化と AI の一貫性を両立する。

さらに、Delta Spec の要件記述を EARS 形式 + Gherkin Scenario の入れ子構造として全テンプレートとスキルプロンプトに正式化し、「何を満たすか（EARS）」と「どう動くか（Scenario）」のズレを構造的に防ぐ。

## Goals

- 全成果物テンプレートに Diátaxis ドキュメントタイプ（Reference / Explanation / How-to / Tutorial）を明記する
- `glossary.md` を新規成果物として追加し、全ドキュメントから用語を参照できる単一ソースにする
- Delta Spec テンプレート（`delta-spec.md`）の Requirement 記述を EARS 形式に正式化し、Scenario（GIVEN/WHEN/THEN）を入れ子で必須とする
- mspec-delta・mspec-proposal 等のスキルプロンプトを新フォーマットに合わせて更新する
- `mspec validate` が新フォーマットの構造チェックをパスする

## Non-Goals

- CLI コマンド（`mspec new` / `validate` 等）のインターフェース変更
- テンプレート以外の CI/CD パイプラインの変更
- 既存アーカイブ済み成果物の遡及的書き直し（廃棄・更新の決定）
- `mspec validate` による EARS 構文の機械的バリデーション実装（構造チェックのみ）

## Capabilities (touched)

- `cli-delta-spec` — EARS+Scenario 形式を Delta Spec テンプレートに正式化
- `claude-integration` — スキルプロンプト（mspec-delta, mspec-proposal, mspec-design 等）を新フォーマット対応に更新
- `artifact-taxonomy`（新規） — Diátaxis 分類・glossary.md の導入・成果物ヘッダ標準を管理する capability

## Decisions (resolved from Open Questions)

- **Diátaxis タイプの明記位置**: YAML フロントマターに `doc_type:` フィールドとして記載する
- **`glossary.md` の必須/任意**: 必須ステップとして workflow に組み込む（全 change で生成する）
- **EARS 形式の MUST / SHALL / SHOULD 使い分け**: Constitution に判定基準を追加する（SHALL = 機能要件、MUST = 制約/安全要件、SHOULD = 推奨）
- **AI 専用文書の分類**: `research.md` 等は Diátaxis の 4 分類（Reference / Explanation / How-to / Tutorial）に収める。独自タイプは設けない

## Open Questions

*なし（全 Open Questions は Decisions セクションで解決済み）*

## Constitution Check

> Step: proposal | Constitution Version: 1.0.0

| Principle | Phase 0 | Phase 1 | Notes |
|---|---|---|---|
| I. ステップ独立性 | ✅ | — | テンプレート更新は各ステップの独立性を損なわない |
| II. 決定論的マージ | ✅ | — | EARS+Scenario 入れ子はアーカイブの決定論的マージと競合しない |
| III. 質問駆動の要件確定 | ✅ | — | 5 問の質問でスコープ・Non-Goal・完了基準を確定済み |
| IV. 双方向アンカー | ✅ | — | glossary.md が全成果物の用語 anchor として機能する |
| V. 強制ステップと拡張ステップの分離 | ✅ | — | glossary.md は必須ステップと決定済み（Decisions 参照） |

### Complexity Tracking

None
