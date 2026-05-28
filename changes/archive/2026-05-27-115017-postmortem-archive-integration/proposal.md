# Proposal: postmortem-archive-integration

> Change: 2026-05-27-115017-postmortem-archive-integration
> Phase: proposal
> Date: 2026-05-27

## Why

チェンジの `Lessons` と `NextActions` はアーカイブ時に生成されるが、その知見は現状「書き捨て」に近い状態であり、システム改善に活かされにくい。本チェンジは、archive ステップ完了時に LLM が Lessons を分析して `memory/constitution.md` への抽象化提案を行い、NextActions を新しいチェンジとして登録するかをユーザーに確認することで、ポストモーテム知見を制度的に循環させる。

## Goals

1. `mspec archive` 実行後、**サブエージェント（mspec-lessons-analyzer）** が `readme.md` の Lessons を全件読み取り、`memory/constitution.md` に追加すべき原則・制約の候補を生成する
2. ユーザーが `AskUserQuestion` で各提案を承認/却下し、承認したもののみ `constitution.md` に追記する
3. **サブエージェント（mspec-nextaction-planner）** が NextActions の優先度を評価し、新しいチェンジとして登録すべきものをランク付きで返す
4. archive スキル本体が AskUserQuestion でユーザーに提案し、承認された NextAction は `mspec new` を自動実行してチェンジディレクトリを生成する

## Non-Goals

- ユーザー確認なしの `constitution.md` 自動更新
- 過去のアーカイブ済みチェンジの一括再分析
- `constitution.md` 以外の `memory/` 配下ファイルへの自動書き込み

## Capabilities (touched)

- mspec-archive
- memory-constitution
- mspec-lessons-analyzer (新規サブエージェント)
- mspec-nextaction-planner (新規サブエージェント)

## Decisions

| 質問 | 回答 | 根拠 |
|------|------|------|
| `constitution.md` への書き込みは誰が実行するか | ユーザーが AskUserQuestion で承認した場合のみ書き込む | 誤った原則追加を防ぐため、常にユーザー承認を挟む |
| Lessons 分析・NextActions 評価の実行主体 | それぞれ専用サブエージェント（mspec-lessons-analyzer / mspec-nextaction-planner）に委譲 | メインの archive スキルコンテキストを汚染せず、分析精度も向上できる |
| `mspec new` 自動実行のファイルシステムスコープ | `changes/` 配下のみ | 最小権限原則。新規チェンジ作成以外の副作用を排除する |
| ロールバック手段 | Git revert のみ | プロジェクトが Git 管理下にあり追加バックアップは冗長 |
| NextActions のインジェクション対策 | LLM が内容を要約・正規化してから使用（元テキストをそのまま使わない） | NextActions テキストを `mspec new` に渡す際、LLM が正規化した kebab-case 名を生成することで、元テキストのコマンドインジェクションリスクを排除する |

## Open Questions

特記事項なし

## Constitution Check

| 原則 | Phase 0 | Phase 1 |
|------|---------|---------|
| I. ステップ独立性 | OK — archive スキルが `readme.md` を新たに読み込む形で実装する。前段の会話コンテキストに依存しない | — |
| II. 決定論的マージ | OK — `constitution.md` への追記は純粋なテキスト追記であり、既存のマージサマリ生成ロジックを変更しない | — |
| III. 質問駆動の要件確定 | OK — Lessons 提案も NextActions 提案も必ず `AskUserQuestion` を経由し、ユーザーが承認したものだけを実行する | — |
| IV. 双方向アンカー | OK — archive スキルの修正箇所に `@mspec-delta` アンカーを打つ | — |
| V. 強制ステップと拡張ステップの分離 | OK — archive は強制ステップだが、ポストモーテム処理は archive 内の追加動作であり、`workflow.yaml` のステップ定義自体を変更しない | — |
| VI. Security by Default | OK — `constitution.md` 書き込みはユーザー承認後のみ、`mspec new` は `changes/` 配下のみ、NextActions テキストは LLM が正規化してからコマンド引数に渡す | — |
