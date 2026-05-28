---
doc_type: Explanation
---

<!-- See also: ./design.md -->

# Design Rationale: checklist-reduce-verify-human

## Context

`mspec-checklist-auditor` が生成する checklist.md では、`verify:human` と `verify:fr-NNN` の 2 種類のアノテーションのみが存在していた。`verify:fr-NNN` は「Delta Spec に E2E Scenario が存在し、対応テストが CI で自動実行される」という厳しい条件を満たさない限り付与できないため、Constitution IV/VI の検証（CLI コマンドで確認可能）や SoT Regression の「影響なし」判定（テストが存在する）項目まで `verify:human` に落ちていた。

この状況は 2 つの問題を生む。第一に、checklist を見た人間が「何をすればいいかわからない」まま `verify:human` 項目を前にして止まる。第二に、自動化できるはずの確認を人手に委ねることで、checklist の実質的な価値が下がる。

## Decisions

### verify:cmd 形式の中間カテゴリとして導入

`verify:fr-NNN`（完全自動）と `verify:human`（完全人手）の間に `verify:cmd:<command>`（コマンド実行により確認）を設けることにした。Constitution IV の `mspec anchor check` や Constitution VI の `grep "## Security Capabilities"` はコマンド 1 本で確認できる。これらを `verify:cmd` に変えることで、チェッカーは「このコマンドを実行してゼロエラーを確認する」という明確な手順を得られる。

`verify:cmd` を amber ハイライトの対象にしたのは、`verify:human` と同じ「要注意：実行が必要」というシグナルを維持するためである。`verify:fr-NNN` が「CI が処理済み」を意味するのとの対称性を保つ。

### verify:human 項目への子リスト必須化

`verify:human` が残る項目（視覚的 UX 判断、設計妥当性確認など）は真に人手が必要なケースである。しかし項目テキストだけでは「何を確認するか」が不明なまま放置されることが多かった。最低 2 項目の具体的手順を子リストとして付与することで、チェッカーが初見でも作業を開始できるようにした。

## Alternatives Considered

- **verify:human を廃止して全項目を verify:fr-NNN に移行**: Constitution Check など本質的に人手判断が必要な項目が存在するため却下。自動化できないものを強制的に自動化と見なすのは危険。
- **verify:human のテキストに手順を Inline で埋め込む**: 子リストではなく `（手順1: ... 手順2: ...）` を括弧書きで追加する案。Markdown のリスト構造を活かした子リスト形式の方が可読性が高く、Web UI での表示も自然なため却下。
- **verify:cmd の Web UI ハイライトを通常表示にする**: 「コマンド実行済みなら問題ない」という理由で amber を外す案。しかし `verify:cmd` 項目はチェッカーが手動でコマンドを実行する必要があり、見落としリスクが高いため amber を維持した。

## Trade-offs

- **auditor プロンプトが長くなる**: 優先順位ルールに新規カテゴリを追加するため、システムプロンプトが約 20 行増加する。LLM のコンテキスト消費量が若干増えるトレードオフを受け入れる。
- **`verify:cmd` の意味論が人手に依存**: `verify:cmd:mspec anchor check` はコマンドを定義するだけで実行責任はチェッカーにある。実際にコマンドが実行されたかどうかを CI で検証する機能は今回のスコープ外。
- **既存 checklist.md の再生成が必要**: 過去チェンジの checklist.md は新しいルールが適用されていない。再生成しない限り verify:human のままになる。これはスコープ外とし、新規 checklist 生成時のみ新ルールを適用する。

## Rejected Options

- **mspec CLI に verify:cmd 実行コマンドを追加**: `mspec verify --change <change>` のような新コマンドで verify:cmd 項目を自動実行する案。実装コストが高く、今回の「checklist の視認性改善」という目的の範囲を超えるため却下。次フェーズの候補として記録する。
- **Constitution IV/VI を checklist から除外**: 「CLI で確認できるなら checklist に載せる必要がない」という案。Constitution Check は mspec workflow の完了条件として重要であり、tracability のために残す必要があるため却下。

<!-- LEARNING: verify:cmd という中間カテゴリの導入パターンは、「完全自動」「コマンド実行で確認」「完全人手」の 3 段階に分類することで verify:human を最小化する汎用的なアプローチ | source: FR-008 | confidence: high -->
