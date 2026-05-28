---
doc_type: Tutorial
---

<!-- @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md -->
<!-- Requirements implemented: FR-005 -->
<!-- Change: revise-artifact-taxonomy -->

# fix-pre-tag-checklist-ui

> Status: new
> Created: 2026-05-27
> Mode: bugfix

## Request

1. `AskUserQuestion` などのコードブロック表示時に `<pre><pre ...>` と `<pre>` タグが二重になる問題を修正したい。
2. checklist.md の `verify-human` 項目が目立つよう色付け（ハイライト）してほしい。
3. checklist.md のチェックボックスを Web UI からインタラクティブに ON/OFF できるようにしたい。

## Artifacts

- [ ] proposal.md
- [x] specs/<capability>/spec.md (Delta Spec)
- [x] research.md
- [x] design.md / design-rationale.md / architecture-overview.md
- [ ] design-rationale.md
- [ ] quickstart.md
- [x] checklist.md
- [x] tasks.md

## Skipped Steps

<!-- `mspec skip <step-id> --reason "..."` 実行時に追記される -->
<!-- 例: - research: typo 修正のみのため省略 (skipped at 2026-05-14T10:30:00Z) -->

## Summary (Lessons / Next Steps)

### Lessons

- **`pre` カスタムレンダラーの欠落が二重ラップの原因**: ReactMarkdown は `<pre><code>` 構造で渡すため、`code` だけカスタム化して `pre` を上書きしないと ShikiHighlighter の `<pre>` が二重になる。`pre({ children }) { return <>{children}</>; }` の 1 行追加で完全に解消できた。
- **hast ツリーの構造理解が `li` 検出に必須**: `rehypeCommentDim` が `<!-- verify: human -->` を `<span class="md-comment">` に変換するため、`String(children)` では `[object Object]` になる。hast の `Element.children` を再帰的に辿る必要があった。
- **`useRef` カウンターのリセット位置がバグの温床**: セルフレビューで「`li` レンダラー内でリセットすると再レンダー時にズレる」という [blocker] が発見された。カウンターを関数本体トップレベルでリセットする制約を design.md に追記して解消。
- **Vite dev サーバーが 2 プロセス起動していた**: HMR が機能せず古いコードが配信され続けていた。`lsof -ti:5173` でプロセスを特定・終了してから再テストで解決。

### Next Steps

- **`cli-e2e` ランナーの `expect_red_on_exit` 設定を見直す**: web-ui 変更の RED 証拠記録で `cli-e2e` が常に exit 0 で邪魔するため、ランナーを capability 別に分けるか `skip_for_red` オプションを追加するとよい。
- **verify-human ハイライトを他のアーティファクト（tasks.md 等）にも適用する検討**: 現在は checklist.md のみ対象。spec.md や tasks.md のレビュー時にも verify-human が目立つと品質向上に繋がる。
