---
doc_type: Reference
---

<!-- @mspec-delta 2026-05-24-085415-risk-tier-field/specs/delta-spec/spec.md -->
<!-- Requirements implemented: FR-001, FR-002, FR-003, FR-004, FR-005 -->
<!-- Change: risk-tier-field -->

# Research: risk-tier-field

## Decisions

| Decision | Chosen | Alternatives | Rationale |
|----------|--------|--------------|-----------|
| risk_tier / blast_radius の Delta Spec 内表現 | FR ブロック本文内 HTML コメント（`<!-- risk_tier: critical \| standard \| trivial -->`） | YAML front-matter フィールド / インライン専用キー構文 | verify-routing/spec.md FR-001 が明示的に HTML コメント形式を要件として定めている。Front-matter は spec.md にはなく、delta-spec.ts の `parseDeltaSpec` が raw text を読む設計と整合する |
| パーサーでの新フィールド抽出方法 | `collectRequirements()` 内で `raw_block` 文字列に正規表現を適用し `risk_tier` / `blast_radius` を抽出 | mdast の HTML ノードとして解析 / YAML front-matter として解析 | 既存 `raw_block = sliceSource(...)` が FR 本文全体を文字列で保持しており追加パスが最小。mdast では HTML comment が opaque node として扱われるため正規表現が現実的 |
| `standard` デフォルト値の後方互換戦略 | パーサーレイヤ（`parseDeltaSpec`）でデフォルト値 `standard` を付与 | 読み込み後に上位ロジックでデフォルト補完 / 未記載 FR にエラー | 既存 spec すべてが影響を受けるため、最下層でデフォルト補完するのが最も影響範囲を限定できる。呼び出し側で毎回ガードを書く必要がなくなる |
| trivial FR が checklist 項目を生成しない保証方法 | mspec-checklist-auditor プロンプト + `mspec validate` での機械的 enforce | プロンプト制御のみ | validate で enforce することで E2E テストが書ける（FR-003 の Scenario が検証可能になる）。プロンプトのみでは CI での機械的保証ができない |
| blast_radius の verify 分岐への影響 | メタデータ（記録のみ）。verify 分岐には影響させない | external の場合に verify: human を強制 | スコープを最小化。将来の security capability 連携のためにデータのみ保持する |
| verify アノテーション生成の主要ターゲット | SKILL.md / mspec-checklist-auditor.md の改訂が中心 + TypeScript の型定義拡張 | TypeScript CLI コード全面実装 | verify 生成はエージェントプロンプト側で担われている（research での発見）。CLI はスキーマ・バリデーション・エラー出力を担う |

## Web References

- 参照なし（内部調査のみ）

## Codebase Findings

### FR パーサーの現状

**ファイル**: `packages/cli/src/parser/delta-spec.ts`

- `parseDeltaSpec(source, capabilityHint?)`: エントリポイント。mdast で AST 変換後、`sectionsByDepth(root, 2)` で H2 セクション（ADDED/MODIFIED/REMOVED/RENAMED）を走査
- `REQUIREMENT_RE = /^Requirement:\s+(FR-\d+)\s+[—-]\s+(.+)$/` (L12): H3 テキストから `fr_id` と `title` のみ抽出。`risk_tier` / `blast_radius` を読む機構は**現時点では存在しない**
- `collectRequirements()`: H3 ごとに `raw_block = sliceSource(source, startLine, endLine)` で FR 本文全体を文字列として取得。新フィールドはここから正規表現で取り出すのが変更コスト最小
- `collectScenarios()`: H4 を走査して Scenario を構造化

**ファイル**: `packages/cli/src/types/delta-spec.ts`

```typescript
// RequirementSchema（現在の全フィールド）
{
  fr_id: string;       // "FR-NNN" 形式
  title: string;       // H3 タイトル部分
  body: string;        // raw_block と同値
  scenarios: Scenario[]; // H4 Scenario ブロックの配列
  raw_block: string;   // FR ブロック全体の raw Markdown
}
```

`risk_tier` / `blast_radius` は**現在のスキーマに存在しない**。Zod の `z.optional().default('standard')` で追加する形が既存設計と整合。

### verify アノテーション生成の現状

**verify アノテーションは CLI コードではなくエージェントプロンプト側で生成される（重要な発見）。**

- `.claude/skills/mspec-checklist/SKILL.md` → `mspec-checklist-auditor` サブエージェントを呼び出す
- `templates/claude/agents/mspec-checklist-auditor.md`: checklist 項目ごとに `<!-- verify: fr-NNN -->` または `<!-- verify: human -->` をアノテーションするルールがプロンプト本文に記載（L40–46）
- 現状のルール: 「E2E Scenario 対応項目 → `verify: fr-NNN`」「それ以外 → `verify: human`」のみ。`risk_tier` 分岐は**未実装**
- `.claude/skills/mspec-tasks/SKILL.md` (L25–31): tasks.md の anchor ブロック生成手順を記述。verify アノテーション付与ルールは現時点で記載なし（verify-routing FR-002 が新設する）
- `.claude/skills/mspec-implement/SKILL.md` (L27–32): 実装完了後に `verify: fr-NNN` を自動チェック、`verify: human` 未チェックはユーザーにブロック。verify-routing FR-004（critical FR の未達警告）はこのロジックと統合する

### checklist.md 生成の現状

- `templates/artifacts/checklist.ja.md`: テンプレートは `## Delta Spec Coverage` / `## Source-of-Truth Regression` / `## Constitution` の3セクション構成。verify アノテーションはテンプレートには**含まれない**（サブエージェントが動的付与）
- `templates/claude/agents/mspec-checklist-auditor.md`: checklist.md の実際の中身生成を担う（L27–46）。trivial FR の「項目を生成しない」ルールは**現時点では未記載**

### validate パイプラインの現状

`validate.ts → validateOne() → artifact-validator.ts validateArtifact()` → Delta Spec ファイルは `parseDeltaSpec()` に渡され `warnings[]` が `delta-spec: ...` プレフィックスで表面化。**現在は warnings のみでエラー停止なし**。

delta-spec FR-004・FR-005 が要求する「無効値 → exit code 1」を実現するには `parseDeltaSpec` に `errors[]` 追加か `validateArtifact` でのエラー判定追加が必要。

### delta-init テンプレートの現状

`delta-init.ts` がテンプレートファイル `templates/artifacts/delta-spec.ja.md` を読み込みプレースホルダーを置換して生成。verify-routing FR-001 が要求する `risk_tier` / `blast_radius` コメントプレースホルダーはこのテンプレートへの追記で対応可能。

## Open Choices

- [ ] risk_tier HTML コメントの FR ブロック内配置場所を固定するか自由にするか（design で決定）
- [ ] `parseDeltaSpec` の戻り値に `errors[]` を追加するか、`validateArtifact` でエラー判定するか（design で決定）
- [ ] verify-routing FR-004（implement ステップでの critical verify 未達警告）を `mspec-implement/SKILL.md` L31 の既存ブロックロジックと統合するか独立させるか（design で決定）

## Constitution Check

> Step: research | Constitution Version: 1.0.0

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | — | research は proposal.md と specs/*/spec.md のみを参照。前段の会話文脈に依存しない |
| II. 決定論的マージ | ✅ | — | research.md はリファレンスドキュメント。マージ対象の SoT spec には影響しない |
| III. 質問駆動の要件確定 | ✅ | — | 2 つの Open Choice（blast_radius 扱い / trivial enforce 方法）を AskUserQuestion で確定済み |
| IV. 双方向アンカー | ✅ | — | research.md に @mspec-delta アンカーを付与済み |
| V. 強制ステップと拡張ステップの分離 | ✅ | — | research はオプションステップ。ステップ構造は変更しない |

### Complexity Tracking

None
