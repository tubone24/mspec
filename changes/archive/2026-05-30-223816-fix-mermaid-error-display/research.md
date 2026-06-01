---
doc_type: Reference
---

# Research: fix-mermaid-error-display

## Decisions

1. **修正対象は `MermaidRenderer.tsx` 1ファイルのみ。**
   `ArtifactViewer.tsx` はコード分岐（`language-mermaid` → `MermaidRenderer`）を正しく行っており変更不要。

2. **根本原因: Mermaid v11 は構文エラー時に Promise を reject せず、エラー内容を埋め込んだ SVG を resolve する場合がある。**
   現在のコードは `.catch()` で `setError(String(err))` しているが、reject されないケースでは `setSvg(errorSvg)` が呼ばれ、SVG 内の巨大なエラーテキストがそのまま描画される。

3. **fix 方針: `mermaid.parse()` → `mermaid.render()` の 2 段階に変更する。**
   - `mermaid.parse(chart)` が throw した場合はコンパクトなエラー表示にする
   - parse が成功したら `render()` を呼ぶ（render エラーも catch して同じコンパクト表示にする）
   - エラーメッセージから "mermaid version X.Y.Z" などの verbose 部分を除去し "⚠ Mermaid 構文エラー" と表示する

## Web References

- Mermaid v11 CHANGELOG / API: `mermaid.parse(text, parseOptions?)` は Promise<boolean> を返す。構文エラーは throw される（suppress オプションあり）。
- Mermaid GitHub Issue #4767 / #5202: `render()` がエラー SVG を生成して resolve するバグは v10.x 系から存在し、`suppressErrorRendering: true` の初期化オプションで render によるエラー SVG 生成を抑制できる（v10.3+）。
- Mermaid Docs (v11): `mermaid.initialize({ suppressErrorRendering: true })` を設定することで、`render()` がエラー SVG を DOM に挿入しないようになる。

## Codebase Findings

### `packages/web-ui/src/components/MermaidRenderer.tsx`

```
L1-43: 現在の実装
```

| 問題点 | 箇所 |
|--------|------|
| `mermaid.initialize()` に `suppressErrorRendering: true` がない | L17 |
| `mermaid.render()` のみで構文バリデーションがない | L22-25 |
| `catch` で `String(err)` をそのまま表示（verbose なバージョン文字列を含む） | L25, L28-31 |

### `packages/web-ui/src/components/ArtifactViewer.tsx`

```
L186-188: MermaidRenderer への呼び出し箇所（変更不要）
```

## Open Choices

特になし。2 段階バリデーション方針で実装する。

## Constitution Check

### Phase 0 — 設計原則の確認

- **I. ステップ独立性**: ✅ research は delta spec の要件定義に依存するが、design/implement とは独立している
- **II. 決定論的マージ**: ✅ FR-015・FR-016 は ADDED セクションに新規追加のみ。既存 FR との衝突なし
- **III. 質問駆動の要件確定**: ✅ Open Choices なし。ユーザーの要求は「抑制」と「コンパクト化」で明確
- **IV. 双方向アンカー**: ✅ Delta Spec に `@mspec-delta` アンカーを実装時に付与する必要がある
- **V. 強制ステップと拡張ステップの分離**: ✅ この研究は design ステップの入力となる強制ステップ
- **VI. Security by Default**: ✅ `dangerouslySetInnerHTML` は既存実装で使用済み。エラー表示のコンパクト化はセキュリティに影響しない
- **VII. 設計意図と実装の対応確認**: ✅ FR-015（表示抑制）→ `suppressErrorRendering: true` + エラー文字列のクリーニング。FR-016（事前バリデーション）→ `mermaid.parse()` の呼び出しに対応
