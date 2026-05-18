# Delta Spec: claude-integration

## ADDED Requirements

### Requirement: FR-022 — `mspec-design` skill は `design.md` と `design-rationale.md` の両方を同時に生成する

`design` ステップが実行されるとき、このシステムは SHALL `mspec-design` skill の `SKILL.md` プロンプトと procedure を更新して、`design.md`（構造・データモデル・API・契約を Reference として記述）と `design-rationale.md`（採用理由・代替案・トレードオフ・破棄した選択肢を Explanation として記述）を **同一ステップ内で両方とも生成完了** させなければならない。両ファイルとも末尾に Constitution Check（Phase 1 列を埋める）を含む。

#### Scenario: design ステップ完了時に両ファイルが揃う
- GIVEN change ディレクトリで proposal/delta/research が完了し design ステップを実行する条件が整っている
- WHEN ユーザーが `/mspec:continue` で design ステップを実行する
- THEN `changes/<id>/design.md` と `changes/<id>/design-rationale.md` の両方が作成されている
- AND `design.md` の YAML frontmatter は `doc_type: Reference` を宣言する
- AND `design-rationale.md` の YAML frontmatter は `doc_type: Explanation` を宣言する
- AND 両ファイルの末尾に `## Constitution Check` セクションが存在する

#### Scenario: design-rationale.md 欠落時は skill が再実行を促す
- GIVEN design ステップで `design.md` のみ生成され `design-rationale.md` が欠落している
- WHEN `mspec validate --change <id>` を実行する
- THEN validate が `design-rationale.md` の欠落を blocker として報告する
- AND `mspec continue` が `validate_failed` を返し、`mspec-design` skill の再実行を要求する

### Requirement: FR-023 — `mspec-archive` skill は `readme.md` 末尾の「まとめ」セクションを AI 記述で埋める

`archive` ステップが実行されるとき、このシステムは SHALL `mspec-archive` skill の procedure を更新して、当該 change 内全成果物の差分と確定した Delta Spec の内容を要約した「Lessons / Next Steps」を AI が生成し、`readme.md` 末尾の `## Summary (Lessons / Next Steps)` セクションに追記しなければならない。生成内容は Tutorial 型読者（次回類似 change を起こす人間または AI）が学べる形で、当該 change で確定した教訓と「次に類似変更を起こす際の入り口」を含む。

#### Scenario: archive 後に readme まとめが埋まる
- GIVEN change の implement と self-review が完了し `/mspec:continue` で archive ステップを実行する
- WHEN archive ステップが完了する
- THEN `readme.md` の `## Summary (Lessons / Next Steps)` セクションがプレースホルダコメントだけでなく振り返り文章で埋められている
- AND 当該文章は当該 change で確定した教訓（Lessons）と「次に同種の変更を起こす際の起点」（Next Steps）を含む

#### Scenario: archive 時に Summary 欠落のままでは validate fail
- GIVEN archive ステップ完了後に `readme.md` の Summary セクションがプレースホルダコメントのままである
- WHEN `mspec validate --change <id>` を実行する
- THEN validate が Summary 未記入を warning または error として報告する

## MODIFIED Requirements

<!-- 本 change では既存 FR の本文改訂は行わない（design / archive skill の新たな責務は ADDED で表現） -->

## REMOVED Requirements

<!-- 本 change では削除は行わない -->

## RENAMED Requirements

<!-- 本 change では FR の改名は行わない -->
