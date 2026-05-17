---
doc_type: Explanation
---

# Proposal: 成果物の言語を統制する config 設定と EARS 記法の多言語対応

## Why

mspec が生成する成果物（proposal.md, spec.md, design.md, tasks.md 等）には、テンプレート由来の英語セクション見出しやプレースホルダ、質問バンク由来の英語選択肢が混入することがあり、日本語話者ユーザーが受領後に手作業で書き直す負担が発生している。

mspec は Claude Code 上で動く SDD フレームワークであり、生成物がそのままユーザーのドキュメント成果物になる以上、出力言語の不一致は受容性とレビュー効率に直結する。

本変更では `config.yaml` のトップレベルに `locale` フィールドを導入し、テンプレートと質問バンクの提示言語をその設定に統一する（既存 `project.language` はコード言語を表すため意味衝突を避けてトップレベル新設）。EARS 記法は国際慣行に倣いキーワード（SHALL / WHEN / THEN / GIVEN）を英語のまま保持し、説明文のみロケール化することで、解析の単純性と多言語可読性を両立する。

## Goals

- `config.yaml`（および `config.default.yaml`）のトップレベルに `locale` フィールドを追加し、`ja` / `en` を受け付ける。
- 成果物テンプレート（`templates/artifacts/*.md`）のセクション見出しとプレースホルダを言語別に提供し、`mspec new` 等の生成時に選択言語に応じて出力する。
- 質問バンク（`templates/questions/*.yaml`）の `question` 文と `options` を言語別に提供し、`mspec questions --phase` 出力に反映する。
- EARS 記法の日本語表現規約（キーワード英語維持・本文日本語）を確立し、`mspec validate` が日本語の Requirement / Scenario を許容する。
- README に `locale` 設定の使い方と、対応言語の追加方法（拡張手順）を記載する。
- 将来言語の追加に備え、locale コード（ISO 639-1）＋ リソースファイル方式の拡張ポイントを用意する。

## Non-Goals

- CLI 実行時のターミナル出力（`✓ Created ...`、エラーメッセージ等）の多言語化は対象外とする。
- SKILL.md / skill prompt 本体の動的多言語切替は対象外（ただし英語残骸の混入チェックは完了基準に含める）。
- ja / en 以外の翻訳リソース同梱は対象外（拡張ポイントのみ提供し、サードパーティが追加可能）。
- ユーザーが proposal 本文等に入力したテキストの自動翻訳は対象外。
- 既存 `changes/` 配下の生成済み成果物への遡及書き換えは対象外。

## Capabilities (touched)

- `language-config` — `config.yaml` トップレベルへの `locale` フィールド追加、デフォルト値と読み込み機構（capability 名は履歴上の固定識別子として維持）
- `artifact-templates-i18n` — 成果物テンプレートの見出し・プレースホルダの多言語化
- `question-bank-i18n` — 質問バンクの質問文・選択肢の多言語化
- `ears-validation-i18n` — EARS キーワード英語維持＋本文多言語化を許容する validation

## Open Questions

- ロケールリソースの物理レイアウト：言語別ファイル分割（`proposal.ja.md` / `proposal.en.md`）か、一ファイル内のロケールキー集約（YAML フロントマター等）か。→ design で確定
- EARS 記法の日本語サンプル文の出典と表現規約（例：`When ... the system SHALL ...` の日本語対訳パターン）。→ research で文献調査（IEEE / Karl Wiegers / Mavin らの EARS 解説、日本国内の SDD 事例）
- 既存テンプレート・skill 内の英語残骸を grep で検出する基準と除外パターン（コード例の英語識別子は許容するか）。→ design / checklist で確定
- `locale` 未指定時のフォールバック挙動（`en` 既定か、システムロケール参照か）。→ design で確定

## Constitution Check

> Step: proposal | Constitution Version: 1.0.0

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | — | proposal は `readme.md` のみを入力として参照し、他ステップ未着手で単独完結する |
| II. 決定論的マージ | ✅ | — | 本ステップは SoT spec への merge を行わず、archive 時の delta merge を逸脱しない |
| III. 質問駆動の要件確定 | ✅ | — | AskUserQuestion で 4 つの分岐点（言語範囲・EARS 方針・対象範囲・完了基準）をユーザー確定済み |
| IV. 双方向アンカー | — | — | アンカー付与は delta / tasks ステップで発生し、proposal は対象外 |
| V. 強制ステップと拡張ステップの分離 | ✅ | — | proposal は `workflow.default.yaml` で強制ステップとして定義されており、本実施はそれに従う |

### Complexity Tracking

None
