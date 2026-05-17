# Delta Spec: cli-spec-lint

## ADDED Requirements

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

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
