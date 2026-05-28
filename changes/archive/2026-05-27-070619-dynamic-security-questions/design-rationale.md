---
doc_type: Explanation
---

<!-- See also: ./design.md -->

# Design Rationale: dynamic-security-questions

## Context

MSpec の `security-as-default` チェンジ（2026-05-25）により、proposal ステップに PRP-SEC-001〜004 という固定セキュリティ質問が追加された。しかしこれらの質問は「ロールバック手段は？」「権限境界は？」のような汎用的な問いであり、変更内容の性質に関係なく毎回同一の質問が出る。例えば CSS の typo 修正のような変更でも「ファイルシステムアクセスの権限境界は？」と問われ、ユーザーは毎回「なし」「該当しない」を機械的に選ぶことになる。

このパターンは 2 つの問題を生む。第一に、固定質問への回答は形式的になり、実効性のあるセキュリティ検討が失われる。第二に、実際にセキュリティ上重要な変更（外部 API 追加、認証フロー変更など）でも、変更固有のリスクが見落とされる。コンテキストを読んだうえで質問を生成するアプローチが、固定テンプレートよりも実効性が高いことは Bugdar（arxiv:2503.17302）等の先行研究でも支持されている。

## Decisions

### なぜ SKILL.md インライン呼び出しを選んだか

`workflow.yaml` の `proposal.subagent` フラグを `true` に変えることでサブエージェントを `continue.ts` 経由で自動起動する案も検討した。しかし `continue.ts` の `mapSubagentName` 関数には `proposal` ケースが存在せず、`default` ブランチが `mspec-proposal-runner` という不在エージェント名を返してしまう。この修正には CLI コードの変更が必要で blast_radius が拡大する。SKILL.md 内で Agent tool をアドホックに呼び出す方式であれば、YAML・CLI・workflow.yaml に一切手を入れずに機能を実現できる。

### なぜ既存 mspec-researcher を流用せず新規エージェントを作るか

`mspec-researcher` はリサーチステップ専用であり、web 検索を含む research.md フォーマットの出力を前提とした定義になっている。セキュリティ分析フェーズが必要とするのは「リスクリスト → AskUserQuestion 用の質問・選択肢のリスト」という全く異なる出力形式だ。単一エージェントに両方を担わせると、プロンプトが複雑化しエラーリスクが上がる。単一責務の専用エージェント（mspec-security-analyzer）を作ることで、将来的な独立進化も容易になる。

### なぜ PRP-SEC-001〜004 を削除するか（`when: never` ではなく）

`when: never` で非表示にする案では廃止済みの定義が YAML に残り、将来の開発者が混乱する。また `loadMergedBank` は同 ID のユーザーカスタム YAML エントリで上書きする仕様のため、削除より非表示のほうが「ユーザーカスタム YAML に残存した PRP-SEC エントリが復活する」リスクが高い。完全削除のほうがシンプルで安全だ。

### なぜコードベーススコープを specs/ + changes/<current>/ に限定するか

「コードベース全体」を渡す案はリスク分析の精度を上げるが、大規模リポジトリでは読み取りコストが高い。proposal.yaml の Goals に「specs/ 配下の全 spec.md + コードベース全体」と書いていたが、OC-3 の議論でユーザーが `specs/ + changes/<current>/` に限定することを選択した。変更のセキュリティリスクは capability spec と現在の change の readme/proposal から大部分が特定できるため、この絞り込みは合理的だ。

## Alternatives Considered

- **`workflow.yaml` を `subagent: true` に変更する案** — CLI の `continue.ts` を修正して `mapSubagentName` に `proposal` ケースを追加する必要があり、blast_radius がシステムレベルに拡大する
- **mspec-researcher を流用する案** — 出力フォーマットの不一致を吸収するプロンプトエンジニアリングが必要で、複雑性が上がる
- **`when: never` で無効化する案** — 廃止定義の残存と、ユーザーカスタム YAML との競合リスクがある
- **全コードベースをスキャンする案** — 精度は高いが大規模リポジトリでのコストが許容できない

## Trade-offs

- `loadMergedBank` のユーザーカスタム上書き仕様により、ユーザーが独自の `proposal.yaml` で同 ID を定義していた場合、削除後も固定質問が復活するリスクがある（OC-1 決定で許容）
- サブエージェントの生成する質問の品質は確定的でない。同じ変更でも実行ごとに異なる質問が出る可能性がある（非決定論的 → Constitution Principle II との緊張）
- proposal.yaml の security エントリ削除により、`mspec questions --phase proposal --json` の出力から security カテゴリが消える。外部ツールがこの出力を依存している場合は影響を受ける

## Rejected Options

- **PRP-SEC-001〜004 を維持しつつ動的質問を追加する（両方提示）** — ユーザーに提示する質問数が増えすぎてノイズになる。固定質問は完全廃止が正しい
- **CLI に新コマンド `mspec security-analyze` を追加する** — SKILL.md のインライン呼び出しで十分実現できる機能に CLI 追加は過剰設計

## Constitution Check

| Principle | Phase 0 | Phase 1 |
|-----------|---------|---------|
| I ステップ独立性 | OK | OK — 設計判断は mspec-proposal スキルのスコープ内に収まっており、他ステップの動作に影響しない |
| II 決定論的マージ | OK | OK — サブエージェント出力は非決定的だが、ファイル変更（YAML 削除・SKILL.md 更新）は決定論的 |
| III 質問駆動の要件確定 | OK | OK — OC-1/3/4/5 をすべて AskUserQuestion で確定してから設計に着手した |
| IV 双方向アンカー | OK | OK — 実装時に `@mspec-delta` アンカーを変更ファイルに付与する |
| V 強制ステップと拡張ステップの分離 | OK | OK — workflow.yaml の強制/拡張定義は不変。proposal ステップの内部実装のみを変更する |
| VI Security by Default | CAUTION | OK — サブエージェントは読み取り専用と明示。スコープを specs/ + changes/<current>/ に限定（OC-3 決定済み） |

### Complexity Tracking

None
