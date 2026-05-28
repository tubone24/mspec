---
doc_type: Reference
---

# dynamic-security-questions — Proposal

## Why

MSpec の proposal ステップでは PRP-SEC-001〜004 という固定のセキュリティ質問を毎回提示している。しかしこれらは「ロールバック手段は？」「仮想化は？」のような汎用問いであり、変更内容と無関係な回答を強いる場面が多い。サブエージェントが今回の変更に固有のリスクを分析し、文脈に沿った質問を動的生成することで、実効性の高いセキュリティレビューを実現する。

## Goals

- `mspec-proposal` スキルのセキュリティ質問を、固定リストからサブエージェントによる動的生成に置き換える
- 分析対象: `readme.md` / `proposal.md`（草稿）/ `specs/` 配下の全 spec.md / コードベース全体
- 生成する質問数: 3〜5 問（変更の複雑度に応じてサブエージェントが決定）
- 固定の PRP-SEC-001〜004 質問を廃止し、動的質問で完全に代替する

## Non-Goals

- `proposal` ステップ以外への適用（design / checklist ステップは対象外）
- 質問バンク YAML（proposal.yaml）のデータ構造自体の再設計
- セキュリティ回答の自動評価・スコアリング

## Capabilities (touched)

- `mspec-proposal`

## Open Questions

- **[PRP-SEC-003 フォローアップ]** サブエージェントはコードベース全体の読み取りを行うが、読み取り専用であることを明示的に制約すべきか？ 現状の MSpec サブエージェントは書き込み権限を持たないが、スキル仕様に明記する必要がある。

## Decisions

| ID | 質問 | 回答 |
|----|------|------|
| PRP-SEC-001 | この変更が触れる権限境界は？ | なし |
| PRP-SEC-002 | アクセス範囲が増加するものは？ | 該当しない |
| PRP-SEC-003 | エージェント/自動化処理への新規権限付与はあるか？ | あり（サブエージェントがコードベース読み取りを実行） |
| PRP-SEC-004 | ロールバック手段は？ | git revert |

## Completion Criteria

- `mspec-proposal` スキルを実行したとき、固定の PRP-SEC-001〜004 が表示されず、代わりにサブエージェントが生成した動的質問（3〜5 問）が提示される
- 固定質問が完全に廃止され、ハードコードされたオプションが残らない
- 既存のテストスイートが全て green のまま維持される

## Constitution Check

| Principle | Phase 0 | Phase 1 |
|-----------|---------|---------|
| I ステップ独立性 | OK — proposal スキルのみを変更し他ステップに影響しない | — |
| II 決定論的マージ | OK — スキルファイルへの変更は git revert で確実に元に戻せる | — |
| III 質問駆動の要件確定 | OK — 本 proposal 自体が AskUserQuestion で要件確定済み | — |
| IV 双方向アンカー | OK — `@mspec-delta` アンカーを delta ステップで付与予定 | — |
| V 強制ステップと拡張ステップの分離 | OK — security 質問の提示は拡張に留まり、強制ステップのフローを変えない | — |
| VI Security by Default | CAUTION — サブエージェントへのコードベース読み取り権限付与を Open Questions に記録済み。読み取り専用であることを仕様に明記する | — |
