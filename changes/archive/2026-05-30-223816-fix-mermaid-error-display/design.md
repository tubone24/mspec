---
doc_type: Reference
---

<!-- See also: ./design-rationale.md for採用理由・代替案 -->

<!-- @mspec-delta 2026-05-30-223816-fix-mermaid-error-display/specs/artifact-preview/spec.md -->
<!-- Requirements implemented: FR-015, FR-016 -->
<!-- Change: fix-mermaid-error-display -->

# Design: fix-mermaid-error-display

## Summary

`MermaidRenderer.tsx` に `mermaid.parse()` による事前バリデーションと `suppressErrorRendering: true` 初期化オプションを追加し、Mermaid シンタックスエラー時の大きなエラー表示を抑制する。エラー時はコンパクトなインライン警告（「⚠ Mermaid 構文エラー」）を表示する。

## Technical Context

| 項目 | 内容 |
|------|------|
| フレームワーク | React 19 + TypeScript |
| Mermaid バージョン | v11.15.0 |
| 修正対象 | `packages/web-ui/src/components/MermaidRenderer.tsx` |
| 変更範囲 | 1 ファイル・1 コンポーネント |

### 現在の動作（バグ）

Mermaid v11 は構文エラー時に Promise を reject せず、エラーテキストを埋め込んだ SVG を resolve するケースがある。このため `setSvg(errorSvg)` が呼ばれ、SVG 内の大きなエラーテキスト「Syntax error in text\nmermaid version 11.15.0」が描画される。

## Project Structure

変更対象ファイルは 1 つのみ：

```
packages/web-ui/src/components/
└── MermaidRenderer.tsx   ← 修正対象（全変更はここに集約）
```

## Decisions

### Decision 1: `mermaid.initialize()` に `suppressErrorRendering: true` を追加

`mermaid.render()` がエラー SVG を生成して resolve するケースを防ぐ。

**受け入れ基準（FR-015 Scenario 対応）:**
- GIVEN: 構文エラーを含む Mermaid ブロックが存在する
- WHEN: コンポーネントがレンダリングを試みる
- THEN: 「Syntax error in text」や「mermaid version」を含む SVG が表示されない

### Decision 2: `mermaid.parse(chart)` による事前バリデーション

`render()` 呼び出し前に `parse()` で構文を検証し、エラー時はレンダリングをスキップする。

**受け入れ基準（FR-016 Scenario 対応）:**
- GIVEN: 不正な Mermaid 構文（例: `graph TD A--`）を含む MD ファイルが表示されている
- WHEN: システムが `mermaid.parse()` を呼び出す
- THEN: parse が例外を返し、レンダリングをスキップしてエラーインジケータが表示される

### Decision 3: エラー表示のコンパクト化

`String(err)` をそのまま表示する代わりに、固定の「⚠ Mermaid 構文エラー」メッセージを小さいバッジとして表示する。

**受け入れ基準（FR-015 Scenario 2 対応）:**
- GIVEN: 構文的に正しい Mermaid ブロックが存在する
- WHEN: コンポーネントが描画する
- THEN: SVG が正常に表示され、エラーインジケータは表示されない

## Constitution Check

### Phase 0

| 原則 | 評価 | 備考 |
|------|------|------|
| I. ステップ独立性 | ✅ | design は research に依存するが他ステップと独立 |
| II. 決定論的マージ | ✅ | FR-015・FR-016 のみ、既存 FR との衝突なし |
| III. 質問駆動の要件確定 | ✅ | ユーザー要求は明確、Open Choices なし |
| IV. 双方向アンカー | ✅ | `@mspec-delta` アンカーを本ファイル冒頭に記載 |
| V. 強制/拡張ステップ分離 | ✅ | design は強制ステップ |
| VI. Security by Default | ✅ | `dangerouslySetInnerHTML` は既存実装維持、エラー表示変更はセキュリティ中立 |
| VII. 設計意図と実装の対応 | ✅ | FR-015→suppressErrorRendering、FR-016→parse() に直接対応 |

### Phase 1

| 原則 | 評価 | 備考 |
|------|------|------|
| I. ステップ独立性 | ✅ | 実装は MermaidRenderer.tsx のみ、他コンポーネントへの影響なし |
| II. 決定論的マージ | ✅ | ADDED のみ、MODIFIED/REMOVED なし |
| III. 質問駆動の要件確定 | ✅ | 設計判断にユーザー確認が必要なものなし |
| IV. 双方向アンカー | ✅ | 実装時に `@mspec-delta` アンカーを tasks.md に記載する |
| V. 強制/拡張ステップ分離 | ✅ | 設計変更は必須部分のみ |
| VI. Security by Default | ✅ | SVG インジェクションリスクは既存と同等、エラー文字列はユーザー入力を反映しない |
| VII. 設計意図と実装の対応 | ✅ | Decisions セクションが FR シナリオと 1:1 対応 |

### Complexity Tracking

None

## Self-Review

### Overall Assessment

**PASS_WITH_NOTES**（blocker: 0件、note: 2件）

### Findings

- [ok] FR-015 の 2 シナリオ（エラー抑制・正常描画）と design.md Decision 1・3 が 1:1 対応している
- [ok] FR-016 の parse() シナリオと design.md Decision 2 が 1:1 対応している
- [ok] `@mspec-delta` アンカーが本ファイル冒頭（L7-8）に存在し、FR-015・FR-016 を明示している
- [ok] checklist.md の機能確認が FR-015 の両シナリオをカバー。FR-016 は `risk_tier: trivial` のため checklist スキップが明示されており妥当
- [ok] architecture-overview.md にシステム図・シーケンス図（正常系・エラー系）の計 3 図が存在し、FR シナリオと対応
- [note] specs/artifact-preview/spec.md の `## Security Capabilities` セクションが例示コメントのみ。`dangerouslySetInnerHTML` の扱いについて明示が推奨
- [note] architecture-overview.md の Phase 0 Constitution Check 備考欄が全空欄。根拠の簡単な記述が推奨

### Summary

全 FR に一貫したシナリオ・設計・チェックリストが揃っており、blockerゼロ。Security Capabilities セクションへの明示的記述と architecture-overview.md の備考補記が推奨されるが、実装ステップへの進行を妨げない。
