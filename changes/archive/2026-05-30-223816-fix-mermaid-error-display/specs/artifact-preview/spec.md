# Delta Spec: artifact-preview

## Security Capabilities

- SVG インジェクション境界: `dangerouslySetInnerHTML` は mermaid ライブラリが生成した SVG のみを受け取る。エラー時は固定文字列「⚠ Mermaid 構文エラー」を表示するため、ユーザー入力をそのまま HTML として展開しない。
- ロールバック手段: `MermaidRenderer.tsx` の変更のみ。git revert 1コミットで元の挙動に戻せる。

## ADDED Requirements

### Requirement: FR-015 — Mermaid シンタックスエラー表示の抑制

<!-- risk_tier: standard -->
<!-- blast_radius: local -->

Mermaid コードブロックのレンダリングが失敗したとき、このシステムは SHALL 「Syntax error in text」「mermaid version X.Y.Z」などの生のエラーメッセージを大きく表示せず、コンパクトなインラインエラーインジケータ（例: 「⚠ Mermaid 構文エラー」）を代わりに表示する.

#### Scenario: シンタックスエラー時に大きなエラーメッセージが表示されない
- GIVEN Markdown 内に構文エラーを含む Mermaid コードブロックが存在する
- WHEN プレビューエリアがそのブロックをレンダリングしようとする
- THEN 「Syntax error in text」や「mermaid version」を含む大きなエラー文字列は表示されず、代わりにコンパクトなエラーインジケータのみが表示される

#### Scenario: 正常な Mermaid は通常通り SVG として描画される
- GIVEN 構文的に正しい Mermaid コードブロックが存在する
- WHEN プレビューエリアがそのブロックをレンダリングする
- THEN 従来どおり SVG ダイアグラムとして正常に描画される（エラーインジケータは表示されない）

### Requirement: FR-016 — Mermaid レンダリング前構文バリデーション

<!-- risk_tier: trivial -->
<!-- blast_radius: local -->

Mermaid コードブロックを描画する前、このシステムは SHALL `mermaid.parse()` または同等の API を用いて構文の事前バリデーションを行い、エラー検出時はレンダリングをスキップして FR-015 のエラーインジケータを表示する.

#### Scenario: parse() による事前バリデーションでエラーを検出する
- GIVEN 不正な Mermaid 構文（例: `graph TD A--` のような未完成ブロック）を含む MD ファイルが表示されている
- WHEN システムが `mermaid.parse()` を呼び出す
- THEN parse が例外を返し、システムはレンダリングをスキップしてエラーインジケータを表示する

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
