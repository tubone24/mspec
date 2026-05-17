# Delta Spec: cli-spec-lint

## ADDED Requirements

### Requirement: FR-011 — `mspec spec list-requirements` コマンド
システムは `mspec spec list-requirements [glob]` サブコマンドを提供し、`specs/<capability>/spec.md` 配下の全 `### Requirement:` 見出しを capability ごとにグループ化して出力 MUST。`glob` が指定された場合は一致する capability のみに絞り込まなければならない (MUST)。出力には各 Requirement の FR-ID および短タイトルを含む MUST。

#### Scenario: 全 capability の Requirement が capability 単位でまとまって出力される
- GIVEN `specs/` 配下に 2 つの capability ディレクトリがあり、それぞれ 2 件以上の `### Requirement:` 見出しを持つ
- WHEN ユーザーが `mspec spec list-requirements` を引数なしで実行する
- THEN 各 capability のヘッダを付けたグループ形式で全 Requirement の FR-ID と短タイトルが出力される

#### Scenario: glob フィルタが正しく適用される
- GIVEN `specs/` 配下に `cli-spec-lint` と `cli-delta` の 2 capability が存在する
- WHEN ユーザーが `mspec spec list-requirements "cli-spec*"` を実行する
- THEN 出力には `cli-spec-lint` の Requirement のみが含まれ、`cli-delta` の Requirement は含まれない

### Requirement: FR-012 — `mspec spec grep <fr-id>` コマンド
システムは `mspec spec grep <fr-id>` サブコマンドを提供し、`FR-NNN` 形式の ID を受け取って SoT スペック (`specs/*/spec.md`) と Delta Spec (`changes/*/specs/*/spec.md`) を横断検索し、該当する `### Requirement: FR-NNN —` ブロック全体を返す MUST。`<fr-id>` が `FR-NNN`（N は 1〜4 桁の数字）の形式に一致しない場合はエラーを報告 MUST。該当する FR が存在しない場合は空の結果と終了ステータス成功を返す MUST。

#### Scenario: SoT スペックの FR が正確に返される
- GIVEN `specs/cli-spec-lint/spec.md` に `### Requirement: FR-001 — 3 カテゴリ分類の禁止語彙リンタ` ブロックが存在する
- WHEN ユーザーが `mspec spec grep FR-001` を実行する
- THEN 出力には `FR-001` の要件ブロック（見出し・本文・Scenario を含む）と、そのブロックが属するファイルパスが含まれる

#### Scenario: Delta Spec の FR も検索対象に含まれる
- GIVEN `changes/2026-05-14-xxx/specs/cli-spec-lint/spec.md` に `### Requirement: FR-011` が存在する
- WHEN ユーザーが `mspec spec grep FR-011` を実行する
- THEN 出力には Delta Spec 内の `FR-011` ブロックとファイルパスが含まれる

#### Scenario: 不正な形式の ID はエラーになる
- GIVEN ユーザーが `mspec spec grep INVALID-ID` を実行する
- WHEN CLI が引数を検証する
- THEN エラーメッセージとともに非ゼロの終了コードで終了する

#### Scenario: 有効な形式だが存在しない FR-ID は空の結果と exit 0 を返す
- GIVEN SoT スペックにも Delta Spec にも `FR-999` ブロックが存在しない
- WHEN ユーザーが `mspec spec grep FR-999` を実行する
- THEN 空の結果が出力され、終了ステータスは成功（0）となる

### Requirement: FR-013 — `mspec spec list-capabilities` コマンド
システムは `mspec spec list-capabilities` サブコマンドを提供し、`specs/` 直下のディレクトリ名（capability 名）を昇順アルファベット順で一覧表示 MUST。各行に 1 つの capability 名を出力 MUST。`specs/` が存在しない場合はエラーを報告 MUST。

#### Scenario: capability 名が昇順で列挙される
- GIVEN `specs/` 配下に `cli-delta`・`cli-spec-lint`・`workflow-core` の 3 ディレクトリが存在する
- WHEN ユーザーが `mspec spec list-capabilities` を実行する
- THEN 出力は 1 行 1 capability・アルファベット昇順で `cli-delta`、`cli-spec-lint`、`workflow-core` が出力される

#### Scenario: `specs/` が存在しない場合のエラー
- GIVEN `specs/` ディレクトリが存在しないプロジェクト
- WHEN ユーザーが `mspec spec list-capabilities` を実行する
- THEN エラーメッセージとともに非ゼロの終了コードで終了する

### Requirement: FR-014 — 3 コマンド共通の `--json` 出力モード
`mspec spec list-requirements`・`mspec spec grep`・`mspec spec list-capabilities` の 3 コマンドは、いずれも `--json` フラグを受け付け MUST、有効時は人間向けテキストの代わりに機械判読可能な JSON を stdout に出力 MUST。JSON スキーマは各コマンドのトップレベルキーとして `command`（コマンド名文字列）・`results`（配列）・`meta`（実行時メタデータ）を持つ MUST。

#### Scenario: list-requirements の --json 出力が構造化されている
- GIVEN `specs/` 配下に 1 つ以上の capability が存在する
- WHEN ユーザーが `mspec spec list-requirements --json` を実行する
- THEN 出力は valid な JSON であり、`command`・`results`・`meta` の 3 キーを持ち、`results` 配列の各要素が `capability`・`fr_id`・`title` フィールドを含む

#### Scenario: spec grep の --json 出力が構造化されている
- GIVEN `specs/cli-spec-lint/spec.md` に `FR-001` ブロックが存在する
- WHEN ユーザーが `mspec spec grep FR-001 --json` を実行する
- THEN 出力は valid な JSON であり、`results` 配列の各要素が `fr_id`・`file`・`block` フィールドを含む

#### Scenario: list-capabilities の --json 出力が構造化されている
- GIVEN `specs/` 配下に 1 つ以上の capability が存在する
- WHEN ユーザーが `mspec spec list-capabilities --json` を実行する
- THEN 出力は valid な JSON であり、`command`・`results`・`meta` の 3 キーを持ち、`results` 配列の各要素が `capability` フィールドを含む

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
