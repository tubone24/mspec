---
doc_type: Explanation
---

# Proposal: reading-mode-themes

## Why

現在の Web UI は「ライト」「ダーク」の 2 テーマのみで、長時間の読書には適さない場面がある。Kindle のような環境照明別の読書テーマ（白・セピア・グリーン・ダーク）を提供し、あわせて可読性の高いフォントとコードブロックのシンタックスハイライト（コメントは薄い色）を導入することで、Web UI の読書体験を大幅に向上させる。

## Goals

- 既存のライト・ダーク 2 テーマを、**ライト / セピア / グリーン / ダーク** の 4 テーマに置き換える
- 各テーマの背景色・文字色・アクセント色を Kindle 準拠の配色で定義する
- 本文フォントを可読性の高いものに変更する（最終候補は Visual Prototype で決定）
- Shiki を使ったコードブロックのシンタックスハイライトを実装する
- シンタックスハイライトにおいて、コメント部分は視覚的に薄い色（opacity または明度調整）で表示する
- Markdown ドキュメント内の HTML コメント（`<!-- ... -->`）も同様に薄い色で表示する
- テーマの選択はユーザー設定として永続化する（localStorage）

## Non-Goals

- モバイル固有のテーマ UI（レイアウト変更は対象外）
- ユーザーによるカスタムテーマの作成・編集
- フォントのユーザーカスタマイズ
- WCAG アクセシビリティ対応（今回スコープ外）

## Capabilities (touched)

- `web-ui-themes`
- `code-syntax-highlight`

## Decisions

| 項目 | 決定内容 |
|------|----------|
| 機能スコープ | 既存テーマシステムを 4 テーマへ置き換え |
| シンタックスハイライトライブラリ | Shiki（VS Code 同等品質、TextMate 文法使用） |
| ロールバック手段 | git revert |
| SEC: 権限境界 | なし |
| SEC: アクセス範囲の増加 | なし（Google Fonts CDN への読み取りのみ追加。CSP 未設定の既存環境では実質リスクなし） |
| SEC: 自動化権限の新規付与 | なし |
| SEC: 外部 CDN 依存 | Google Fonts CDN を `index.html` に追加予定。本番デプロイ時の CSP ヘッダー設定を検討すること |

## Open Questions

- **フォント最終選定**: Inter / Noto Serif JP / Literata / Source Serif 4 のいずれかを Visual Prototype ステップで比較し確定する

## Constitution Check

| Principle | Phase 0 | Phase 1 |
|-----------|---------|---------|
| I. ステップ独立性 | ✅ proposal は readme.md のみに依存し、後続ステップに影響を与えない | — |
| II. 決定論的マージ | ✅ capability 名を kebab-case で明示し delta が一意に生成可能 | — |
| III. 質問駆動の要件確定 | ✅ 5 問（機能・Non-Goal・ハイライト・フォント）＋ Security 4 問で確定 | — |
| IV. 双方向アンカー | ✅ Capabilities の各名称が delta ステップのアンカーになる | — |
| V. 強制ステップと拡張ステップの分離 | ✅ visual-prototype を拡張ステップとして利用（フォント選定） | — |
| VI. Security by Default | ✅ 権限境界・アクセス増加なし。コメント色は UI のみでセキュリティリスクなし | — |
