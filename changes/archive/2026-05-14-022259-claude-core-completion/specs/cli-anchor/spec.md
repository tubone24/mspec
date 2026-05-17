# Delta Spec: cli-anchor

## ADDED Requirements

### Requirement: FR-015 — アンカースキャナは HTML コメントとフェンス付きコードブロックを無視する
システムは HTML コメント (`<!-- ... -->`) 内、またはバックティック 3 つ・チルダ 3 つで囲まれたフェンス付きコードブロック内に位置する `@mspec-delta` の出現をアンカー走査から除外 MUST。これによりアンカー形式を解説するドキュメンテーション記述が候補アンカーとして登録されたり、不正形アンカー警告を引き起こしたりしない。

#### Scenario: フェンス内の `@mspec-delta` 例示は沈黙する
- GIVEN Markdown ファイルが、本文に `@mspec-delta 2026-05-14-093015-apply-css/specs/theme-engine/spec.md` を含むフェンス付きコードブロックを持つ
- WHEN ユーザーが `mspec anchor check` を実行する
- THEN その行に対する警告も不正形アンカー報告も出力されない

#### Scenario: HTML コメント内の `@mspec-delta` 例示は沈黙する
- GIVEN Markdown ファイルが `<!-- @mspec-delta 2026-05-14-093015-apply-css/specs/theme-engine/spec.md -->` という単一行を含む
- WHEN ユーザーが `mspec anchor list` を実行する
- THEN その行に対する警告も不正形アンカー報告も出力されない

### Requirement: FR-016 — アンカースキャナは SoT スペックと Delta Spec ファイルをスキップする
システムは、パスが `specs/<capability>/spec.md` (`specs/archive/` 配下を含む) または `changes/<change-dir>/specs/<capability>/spec.md` の下にある Markdown ファイルすべてをアンカー走査の対象外として扱う MUST。これによりアンカー形式を引用・解説するスペック本文が不正形アンカー報告を引き起こさない。

#### Scenario: SoT スペック本文がアンカー走査されない
- GIVEN `specs/cli-anchor/spec.md` がアンカー形式を解説する散文の一部として `@mspec-delta` という文字列を含む
- WHEN ユーザーが `mspec anchor check` を実行する
- THEN `specs/cli-anchor/spec.md` を指す不正形アンカー報告は 1 件も出力されない

#### Scenario: Delta Spec 本文がアンカー走査されない
- GIVEN `changes/2026-05-14-022259-claude-core-completion/specs/cli-anchor/spec.md` が散文の一部として `@mspec-delta` という文字列を含む
- WHEN ユーザーが `mspec anchor list` を実行する
- THEN その Delta Spec ファイルを指す不正形アンカー報告は出力されない

### Requirement: FR-017 — ブロック形状でない単発言及は沈黙する
システムは、`@mspec-delta` を含む行が 3 行ブロックを構成しようとしている場合 (すなわち、コメント接頭辞剥離後の直後の行が `Requirements implemented:` で始まる、または直前の行がアンカープロトコル行で終わる場合) に限り不正形アンカー警告を発する MUST。ブロック形状の近傍を持たない孤立した単一行の言及に対しては沈黙 MUST。

#### Scenario: 後続行を伴わない単発言及は沈黙する
- GIVEN ソースファイルにおいて唯一の `@mspec-delta` 言及が単一行で、その直後に `Requirements implemented:` 行を一切伴わない無関係な行が 10 行続く
- WHEN ユーザーが `mspec anchor check` を実行する
- THEN そのファイルに対する警告は出力されない

#### Scenario: ブロック形状で path が不正なケースは引き続き警告する
- GIVEN ソースファイルが連続 3 行のコメントとして `@mspec-delta 2026-05-14-apply-css/...` (`HHMMSS` 欠落)、`Requirements implemented: FR-001`、`Change: apply-css` を持つ
- WHEN ユーザーが `mspec anchor check` を実行する
- THEN 当該ファイルは不正形アンカー候補として報告される (FR-002 / FR-005 のブロック形状での挙動契約は維持される)

## MODIFIED Requirements

### Requirement: FR-005 — 不完全なアンカーブロックはハードフェイル
システムは、3 行のうち 1 行または 2 行のみが連続行に現れ、かつ近傍がブロック形状 (直前または直後の行が `Requirements implemented:` や `Change:` といった別のアンカープロトコル行を保持する) である場合のみ不完全アンカーとして扱う MUST し、`mspec anchor check` は対象ファイルと行を報告したうえで非ゼロで終了 MUST。ブロック形状の近傍を持たない `@mspec-delta` の単発言及、および HTML コメント・フェンス付きコードブロック・FR-016 に列挙されたスペック配下のファイル内の言及は、このフェイルを引き起こしてはならない (MUST NOT)。

#### Scenario: `Change:` 行欠落で check が失敗する
- GIVEN ソースファイル冒頭に `@mspec-delta 2026-05-14-093015-apply-css/specs/theme-engine/spec.md` と `Requirements implemented: FR-005` が連続行で並び、3 行目に `Change:` 行が無い
- WHEN ユーザーが `mspec anchor check` を実行する
- THEN コマンドは非ゼロで終了し、不完全アンカーとして当該ファイルと行を報告する

#### Scenario: 単発のドキュメンテーション言及は check を失敗させない
- GIVEN ソースファイルの唯一の `@mspec-delta` 言及がアンカー形式を解説する散文 1 行であり、その直前または直後に `Requirements implemented:` 行が存在しない
- WHEN ユーザーが `mspec anchor check` を実行する
- THEN コマンドは当該ファイルを理由に非ゼロで終了せず、警告も出力しない

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
