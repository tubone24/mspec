---
doc_type: Explanation
---

<!-- See also: ./design.md -->

# Design Rationale: fix-mermaid-error-display

## Context

mspec の Web UI は Markdown ファイル内の ```` ```mermaid ```` コードブロックを `MermaidRenderer.tsx` コンポーネントで SVG として描画する。Mermaid v11.15.0 にアップグレード後、構文エラーがあるダイアグラムに対して「Syntax error in text\nmermaid version 11.15.0」という文字列が大きなエラー SVG として画面に描画されるようになった。

現在のコードは `.catch((err) => setError(String(err)))` でエラーを捕捉しているが、Mermaid v11 の挙動変化により、エラーが reject ではなく error SVG の resolve として伝達されるケースが生じた。この場合 `.catch` は発動せず、`setSvg(errorSvg)` が呼ばれて大きなエラーテキストがそのまま描画される。

## Decisions

### `mermaid.parse()` による事前バリデーションを採用した理由

`mermaid.parse(text)` は Mermaid v10+ で提供される Promise ベースの構文バリデーション API であり、レンダリングを行わずに構文エラーを検出できる。この API を `render()` 前に呼ぶことで、エラー SVG の生成そのものを防ぎ、コンポーネントが制御できる形でエラーを処理できる。

この方法は Mermaid のバージョン間での `render()` 挙動の差異に依存しないため、将来のアップグレードに対しても堅牢である。

### `suppressErrorRendering: true` を採用した理由

`mermaid.initialize({ suppressErrorRendering: true })` は Mermaid v10.3+ で導入された設定であり、`render()` が内部でエラー SVG を DOM に挿入する動作を抑制する。`parse()` による事前チェックと組み合わせることで多重の防御層となり、万一 `parse()` をすり抜けたエラーケースでも大きなエラー表示を防止できる。

## Alternatives Considered

| 案 | 説明 | 評価 |
|----|------|------|
| エラー文字列から version 行を除去 | `String(err).replace(/mermaid version.*/s, '')` で表示を小さくする | ❌ 根本原因（error SVG の resolve）を解決していない。Mermaid の内部挙動変化で再発する |
| Mermaid を古いバージョンにダウングレード | v10.x に戻してエラーを reject に戻す | ❌ 後退。v11 の新機能・セキュリティ修正を失う |
| レンダリング後の DOM からエラーテキストを除去 | render 後に SVG を検査してエラー要素を削除 | ❌ 脆弱。Mermaid の内部 SVG 構造に強く依存する |
| `mermaid.parse()` のみ（`suppressErrorRendering` なし）| parse 成功後に render を呼ぶ | △ parse が通過しても render でエラー SVG が生成される稀なケースをカバーできない |

## Trade-offs

- `mermaid.parse()` は追加の非同期処理を導入するため、正常なダイアグラムでもわずかな遅延が発生する（許容範囲内）
- エラー時に元のエラー詳細が表示されなくなるため、開発者がデバッグしにくくなる可能性がある。ただしコンパクトエラー表示で「Mermaid 構文エラー」と明示するため、問題の特定は可能

## Rejected Options

- **エラー文字列フィルタリング**: 表面的な対処療法にすぎず、Mermaid のアップデートで再発しうるため却下
- **バージョンダウングレード**: セキュリティ上の後退であり却下
- **DOM 直接操作**: Mermaid の内部実装に強依存するメンテナンス性の低い方法のため却下

## Constitution Check

### Phase 0

| 原則 | 評価 | 備考 |
|------|------|------|
| I. ステップ独立性 | ✅ | |
| II. 決定論的マージ | ✅ | |
| III. 質問駆動の要件確定 | ✅ | |
| IV. 双方向アンカー | ✅ | |
| V. 強制/拡張ステップ分離 | ✅ | |
| VI. Security by Default | ✅ | |
| VII. 設計意図と実装の対応 | ✅ | |

### Phase 1

| 原則 | 評価 | 備考 |
|------|------|------|
| I. ステップ独立性 | ✅ | |
| II. 決定論的マージ | ✅ | |
| III. 質問駆動の要件確定 | ✅ | |
| IV. 双方向アンカー | ✅ | |
| V. 強制/拡張ステップ分離 | ✅ | |
| VI. Security by Default | ✅ | |
| VII. 設計意図と実装の対応 | ✅ | Alternatives Considered で代替案を全件評価済み |

### Complexity Tracking

None
