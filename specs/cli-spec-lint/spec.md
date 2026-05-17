<!-- mspec: gaps in FR numbering are intentional. Removed requirements are archived under changes/archive/. -->

# cli-spec-lint Specification

## Purpose

<このスペックがカバーする外部から観測可能な振る舞いの概要>

## Requirements

<!-- archive コマンドが Delta Spec の ADDED/MODIFIED/REMOVED/RENAMED を機械的にマージします -->

### Requirement: FR-001 — 3 カテゴリ分類の禁止語彙リンタ
システムは Source-of-Truth スペックを走査する `mspec spec lint` コマンドを提供し、禁止語彙を shell-command / library-name / impl-verb の 3 カテゴリに分類して報告 MUST。

#### Scenario: 3 カテゴリの違反がそれぞれ出力される
- GIVEN 各カテゴリに該当するフレーズを 1 つずつ含むスペックファイルが存在する
- WHEN ユーザーがそのファイルに対して `mspec spec lint` を実行する
- THEN 出力には 3 件の違反が現れ、それぞれ `shell-command` / `library-name` / `impl-verb` のいずれかでタグ付けされる

### Requirement: FR-002 — 安定したルール識別子と修正ヒント
個々の禁止語彙ルールは kebab-case の安定した識別子と 1 文の修正ヒントを公開 MUST。これによりスペック著者が自己修正できる。

#### Scenario: 違反レポートにルール ID とヒントが含まれる
- GIVEN 禁止トークンを含むスペック行が存在する
- WHEN リンタが違反を報告する
- THEN レポートには安定した kebab-case のルール ID と、振る舞いレベルへの言い換えを示す空でないヒントが含まれる

### Requirement: FR-003 — デフォルトの走査対象は SoT スペック群
明示的なターゲットが渡されない場合、システムは `mspec spec lint` の走査対象をプロジェクトルート配下の全 `specs/<capability>/spec.md` に既定 MUST。

#### Scenario: デフォルト走査で全 SoT スペックがカバーされる
- GIVEN `specs/` 配下に 2 つの capability スペックが存在するプロジェクト
- WHEN ユーザーが引数なしで `mspec spec lint` を実行する
- THEN 両方の capability スペックファイルが走査され、サマリーに件数として現れる

### Requirement: FR-004 — HTML コメントは走査対象外
システムは HTML コメント (`<!-- ... -->`) 内に位置する禁止語彙の出現を無視 MUST。これにより mspec 自身のヘッダ注釈が違反を引き起こさない。

#### Scenario: HTML コメント内の禁止トークンは沈黙する
- GIVEN 唯一の禁止トークンが `<!-- ... -->` の内側にあるスペックファイル
- WHEN ユーザーがそのファイルに対して `mspec spec lint` を実行する
- THEN 違反は 0 件として報告される

### Requirement: FR-005 — フェンス付きコードブロックは走査対象外
システムはバックティック 3 つ (` ``` `) またはチルダ 3 つ (`~~~`) で囲まれたフェンス付きコードブロック内の禁止語彙の出現を無視 MUST。これにより例示スニペットが違反を引き起こさない。

#### Scenario: フェンス内の禁止トークンは沈黙する
- GIVEN 唯一の禁止トークンがフェンス付きコードブロック内にあるスペックファイル
- WHEN ユーザーがそのファイルに対して `mspec spec lint` を実行する
- THEN 違反は 0 件として報告される

### Requirement: FR-006 — 決定論的な違反順序
システムは違反を「行番号 → 列番号 → ルール ID」の順でソートして出力 MUST。同一入力に対して同一出力を再現するため。

#### Scenario: 再実行で出力がバイト一致する
- GIVEN 同一行に複数の違反を含むスペックファイル
- WHEN ユーザーがそのファイルに対して `mspec spec lint --json` を 2 回実行する
- THEN 2 回の出力は JSON としてバイト一致する

### Requirement: FR-007 — `--allow` によるルール個別無効化
システムは `--allow` の後ろにルール ID を列挙することで個々のルールを呼び出し時点で無効化できるように MUST。これによりプロジェクトが意図的に受け入れたルールを抑制できる。

#### Scenario: 許可済みルールが違反を発生させなくなる
- GIVEN ルール ID `lib-zod` で 1 件の違反が報告されるスペックファイル
- WHEN ユーザーがそのファイルに対して `mspec spec lint --allow lib-zod` を実行する
- THEN その違反は出力に現れず、終了ステータスは成功を示す

### Requirement: FR-008 — `--json` での機械可読出力
システムは `--json` モードを提供し、トップレベルに `violations` と `summary` の 2 キーを持つ構造化エンベロープを出力 MUST。これにより CI パイプラインや IDE 統合が人間向けテキストを解析せずに結果を消費できる。

#### Scenario: JSON エンベロープにサマリ件数が含まれる
- GIVEN 2 ファイル合計で 3 件の違反を持つスペックファイル群
- WHEN ユーザーが `mspec spec lint --json` を実行する
- THEN 出力エンベロープには `violations` 配列に 3 エントリ、および `summary` オブジェクトに `{ files: 2, violations: 3 }` が含まれる

### Requirement: FR-009 — 違反検出時の非ゼロ終了コード
1 件以上の違反が報告された場合、システムは非ゼロの終了ステータスで終了 MUST。これにより CI パイプラインを自動的に失敗させられる。

#### Scenario: 違反の有無が終了ステータスに反映される
- GIVEN 違反 1 件を含むスペックファイル
- WHEN ユーザーがそのファイルに対して `mspec spec lint` を実行する
- THEN プロセスは非ゼロの終了コードで終了する

### Requirement: FR-010 — `mspec validate --strict` への組み込み
`mspec validate --strict` が呼び出された際、システムは同じ禁止語彙走査を実行 MUST し、いかなる違反も validate 全体のハードフェイル扱いとする。

#### Scenario: strict validate が禁止トークンで失敗する
- GIVEN ルール ID `shell-git-mv` で 1 件の違反を持つ SoT スペックファイル
- WHEN ユーザーが `mspec validate --strict` を実行する
- THEN validate 出力は spec lint の失敗を報告し、プロセスは非ゼロの終了コードで終了する

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


