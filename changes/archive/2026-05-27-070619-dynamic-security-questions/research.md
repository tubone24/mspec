---
doc_type: Reference
---

# Research: dynamic-security-questions

## Decisions

| 論点 | 採用案 | 代替案 | 根拠 |
|------|--------|--------|------|
| サブエージェント起動方法 | SKILL.md 内でインラインに Task tool を呼び出す（workflow.yaml の `subagent: false` のまま） | `workflow.yaml` の `proposal` ステップを `subagent: true` に変更し `continue.ts` が `subagent_prompt` を生成する | `continue.ts:145` では `step.subagent` が `true` のときのみ `subagent_prompt` を生成する。`proposal` ステップは `ask_questions: true` かつ `block: true` であり、インタラクティブ質問と動的サブエージェント呼び出しを混在させるため SKILL.md 内アドホック呼び出しが自然。`workflow.yaml` を変更すると `continue.ts` が `mapSubagentName('proposal')` を呼び出すが switch 文にケースがなく `mspec-proposal-runner` という不在エージェント名を返してしまう（`continue.ts:211-223`） |
| セキュリティサブエージェントの実体 | 新規エージェント定義ファイル `.claude/agents/mspec-security-analyzer.md` を追加する | 既存の `mspec-researcher` エージェントにセキュリティ分析プロンプトを追記する | `mspec-researcher.md` は research ステップに特化しており research.md フォーマットを返すことを前提とする。proposal ステップのセキュリティフェーズは「リスクリスト → 質問生成」という異なる出力形式が必要。責務分離のため専用エージェントが望ましい |
| 動的質問の proposal.md Decisions テーブルへの記録形式 | `質問テキスト` / `回答` の 2 列テーブル行として追記する（FR-002） | PRP-SEC-NNN 様の動的 ID を採番して記録する | 動的生成質問には事前 ID がないため、質問テキスト直接記録が最もシンプル。ID 採番は CLI 変更を伴い blast_radius が拡大する |

## Web References

- [Bugdar: AI-Augmented Secure Code Review for GitHub Pull Requests](https://arxiv.org/pdf/2503.17302): RAG を用いてコード変更コンテキストを読み取り、変更固有のセキュリティフィードバックを生成するアプローチ。動的質問生成の先行研究として参照
- [AutoSafeCoder: A Multi-Agent Framework for Securing LLM Code Generation](https://arxiv.org/pdf/2409.10737): Coding Agent / Static Analyzer Agent / Fuzzing Agent の 3 エージェント構成でセキュリティを段階強化。マルチエージェントで脆弱性を 13% 削減
- [AgentAuditor: Human-Level Safety and Security Evaluation for LLM Agents](https://arxiv.org/pdf/2506.00641): マルチステージ RAG で最も関連性の高い推論事例を動的検索しエージェント安全性を評価。コンテキスト aware なリスク評価の参考
- [Protecting Context and Prompts: Deterministic Security for Non-Deterministic AI](https://arxiv.org/pdf/2602.10481): プロンプト実行前検査・出力後評価を組み合わせた LLM セキュリティ強制モデル。サブエージェントへの読み取り専用制約設計の参考
- [Cloud Security Alliance: Secure Vibe Coding Guide](https://cloudsecurityalliance.org/blog/2025/04/09/secure-vibe-coding-guide): AI コーディングアシスタントのセキュリティガイドライン。サブエージェントへの最小権限付与の根拠

## Codebase Findings

### サブエージェント起動アーキテクチャ

- `.mspec/workflow.yaml:29-38` — `proposal` ステップは `subagent: false`、`ask_questions: true`、`block: true`。変更なしでよい
- `packages/cli/src/commands/continue.ts:145` — `step.subagent` が `false` のとき `subagent_prompt: null` を返すため、proposal スキルは Task tool をアドホックで呼び出す必要がある
- `packages/cli/src/commands/continue.ts:211-223` — `mapSubagentName` の switch 文に `'proposal'` ケースが存在しない。`workflow.yaml` を `subagent: true` に変更すると `mspec-proposal-runner` という不在エージェント名が返される（バグリスク）
- `.claude/agents/mspec-researcher.md` — 既存サブエージェント定義の参照実装。新規 `mspec-security-analyzer.md` を作成する際の構造テンプレートとして利用可能
- `.mspec/config.yaml:17` — `integrations.claude.subagents: true` — サブエージェント機能は有効

### PRP-SEC 固定質問の現在の実装

- `packages/cli/templates/questions/proposal.yaml:106-155` — `PRP-SEC-001〜004` の 4 エントリが `category: security` / `when: always` で定義済み。削除または無効化の判断が実装に直結する
- `packages/cli/src/lib/questions-bank.ts:76-102` — `loadMergedBank` はデフォルト YAML を読み込んだ後、ユーザープロジェクトの同 step YAML で同 ID エントリを上書き。`security` カテゴリを YAML から削除しても既存のユーザー上書き YAML に残存する場合は表示されてしまう
- `packages/cli/src/types/questions.ts:11-23` — `QUESTION_CATEGORIES` に `'security'` が含まれており、`security-as-default` チェンジで追加済み。カテゴリ自体は維持可能

### Delta Spec テンプレートへの影響

- `packages/cli/templates/artifacts/delta-spec.ja.md:5-9` — `## Security Capabilities` セクションのコメントスロットが PRP-SEC-001〜004 の 4 固定 ID に対応してハードコードされている。動的質問置換後はこのテンプレートの更新が必要
- `packages/cli/templates/artifacts/delta-spec.en.md:5-9` — 同上（英語版）
- `packages/cli/templates/artifacts/delta-spec.md:5-9` — 同上（バイリンガル版）

## Open Choices

- [x] **[OC-1] PRP-SEC-001〜004 YAML エントリの削除 vs 非表示** → **完全削除** を採用。ユーザーカスタム YAML 上書きリスクは許容する
- [x] **[OC-3] セキュリティサブエージェントに渡す「コードベース」のスコープ** → **`specs/` + `changes/<current>/` に限定**。コスト効率と分析精度のバランスをとる
- [x] **[OC-4] サブエージェント読み取り専用制約の実装方法** → **エージェント定義プロンプトへの明記のみ**。「ファイルの書き込み・削除を行ってはならない」を mspec-security-analyzer.md に記述する
- [x] **[OC-5] 動的質問数の決定ロジック** → **サブエージェントに委ねる**（3〜5 問の範囲でリスク量に応じて判断）

## Constitution Check

| Principle | Phase 0 | Phase 1 |
|-----------|---------|---------|
| I ステップ独立性 | OK — proposal スキルのみを変更。workflow.yaml の subagent フラグは変更しない | — |
| II 決定論的マージ | OK — スキルファイル・YAML・エージェント定義の変更は git revert で確実に元に戻せる | — |
| III 質問駆動の要件確定 | OK — Open Choices を AskUserQuestion でユーザーに確認済み（次セクション参照） | — |
| IV 双方向アンカー | OK — delta spec に `@mspec-delta` アンカーを付与予定 | — |
| V 強制ステップと拡張ステップの分離 | OK — security 質問の動的化は proposal ステップの内部実装変更であり、ステップ強制・拡張の境界は不変 | — |
| VI Security by Default | CAUTION — サブエージェントにコードベース読み取り権限を付与する。OC-4 で読み取り専用制約の実装方法を確定する | — |
