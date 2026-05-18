# Delta Spec: cli-workflow-engine

## ADDED Requirements

### Requirement: FR-022 — `design` ステップの `produces` に `design.md` と `design-rationale.md` の両方を含める

このシステムは SHALL ワークフロー定義（`workflow.yaml` 相当の組み込みステップ定義）における `design` ステップの `produces` リストに `design.md` と `design-rationale.md` の **両方** を含め、`mspec status --json` および `mspec continue --json` の `produces` フィールドにも両ファイル名が返るよう構成しなければならない。`mspec validate` はどちらか一方の欠落を blocker として報告し、`mspec continue` は当該ステップを `validate_failed` 状態として扱う。

#### Scenario: design ステップの produces は両ファイルを列挙する
- GIVEN `mspec status --change <id> --json` を実行する
- WHEN steps 配列内の `design` ステップを確認する
- THEN `produces` に `design.md` と `design-rationale.md` の両方が含まれる

#### Scenario: design-rationale.md 欠落で validate が fail する
- GIVEN change ディレクトリに `design.md` のみ存在し `design-rationale.md` が存在しない
- WHEN `mspec validate --change <id>` を実行する
- THEN validate が `design-rationale.md` の欠落を blocker として報告する
- AND 終了コード非ゼロで終了する

#### Scenario: design ステップ完了判定は両ファイル存在が必要
- GIVEN `design.md` のみ存在する状態で `mspec continue --change <id> --json` を実行する
- WHEN レスポンスを確認する
- THEN `current_step` は `design` のままで、`next_action` は `validate_failed` または `execute`（design 再実行を要求）となる

## MODIFIED Requirements

<!-- 本 change では既存 FR の本文改訂は行わない。`design` ステップへの `design-rationale.md` 追加は ADDED FR-022 で表現する -->

## REMOVED Requirements

<!-- 本 change では削除は行わない -->

## RENAMED Requirements

<!-- 本 change では FR の改名は行わない -->
