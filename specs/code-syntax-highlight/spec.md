<!-- mspec: gaps in FR numbering are intentional. Removed requirements are archived under changes/archive/. -->

# code-syntax-highlight Specification

## Purpose

<このスペックがカバーする外部から観測可能な振る舞いの概要>

## Requirements

<!-- archive コマンドが Delta Spec の ADDED/MODIFIED/REMOVED/RENAMED を機械的にマージします -->

### Requirement: FR-001 — Shiki によるコードブロックのシンタックスハイライト

<!-- risk_tier: standard -->
<!-- blast_radius: module -->

コードブロックが存在する間、このシステムは SHALL Shiki を使用して言語に応じたシンタックスハイライトを適用する.

#### Scenario: JavaScript コードブロックのハイライト
- GIVEN ドキュメント内に ```javascript で囲まれたコードブロックがある
- WHEN ページが描画される
- THEN Shiki によるシンタックスハイライトが適用され、トークンが色分けされて表示される

#### Scenario: 言語指定なしコードブロックの扱い
- GIVEN 言語指定なし（``` のみ）のコードブロックがある
- WHEN ページが描画される
- THEN ハイライトなしのコードブロックとして表示される（エラーにならない）

### Requirement: FR-002 — コードコメントの薄い色表示

<!-- risk_tier: trivial -->
<!-- blast_radius: local -->

このシステムは SHALL コードブロック内のコメントトークン（Shiki の `comment` スコープ）を、通常テキストより視覚的に薄い色（opacity または明度を下げた色）で表示する.

#### Scenario: コメントが薄く表示される
- GIVEN シンタックスハイライトが適用されたコードブロックにコメントが含まれる
- WHEN ページが描画される
- THEN コメント部分が他のトークン（キーワード等）より明らかに薄い色で表示される

### Requirement: FR-003 — Markdown HTMLコメントの薄い色表示

<!-- risk_tier: trivial -->
<!-- blast_radius: local -->

このシステムは SHALL Markdown ドキュメント内の HTML コメント（`<!-- ... -->`）を、本文テキストより視覚的に薄い色で表示する.

#### Scenario: Markdown コメントが薄く表示される
- GIVEN Markdown ドキュメントに `<!-- コメント -->` が含まれる
- WHEN ページが描画される
- THEN `<!-- -->` の内容が本文テキストより明らかに薄い色（例: opacity 0.4 相当）で表示される

