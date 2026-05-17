# Delta Spec: cli-workflow-engine

## ADDED Requirements

### Requirement: FR-015 — `mspec continue` エンベロープに `upstream_skipped[]` を含める
<!-- 注: `upstream_skipped` フィールドは現行 CLI に実装済み。本 FR はその挙動を Delta Spec として正式化し、リグレッション固定の E2E を追加するもの。実装変更は伴わない。 -->
システムは `mspec continue` が返す JSON エンベロープに `upstream_skipped` 配列を含め、当該 change で skip 記録されている workflow ステップのうち現在のステップよりも順序上前にあるステップの ID を列挙 MUST。これにより下流のエージェントが欠落を加味してプロンプトとコンテキストを調整できる。

#### Scenario: skip 済みの research ステップが upstream リストに現れる
- GIVEN `research` ステップが skip 記録されている change で、現在のステップが `design` に解決される
- WHEN ユーザーが `mspec continue --change <name> --json` を実行する
- THEN 出力エンベロープには `"upstream_skipped": ["research"]` が含まれる

#### Scenario: skip が無い場合は空配列が返る
- GIVEN skip ステップが存在しない change
- WHEN ユーザーが `mspec continue --change <name> --json` を実行する
- THEN 出力エンベロープには `"upstream_skipped": []` が含まれる

### Requirement: FR-016 — `mspec continue` エンベロープに `constitution_principles[]` を含める
システムは `mspec continue` が返す JSON エンベロープに `constitution_principles` 配列を含め、現在のステップの workflow 宣言で Constitution Check が有効化されている場合、各エントリは原則の ID・名称・評価対象フェーズを公開 MUST。これによりエージェントが憲法ファイルを再読込せずに Constitution Check 表をレンダリングできる。

#### Scenario: design ステップが全宣言原則を列挙する
- GIVEN テスト用フィクスチャの憲法ファイルが H3 見出し形式で 2 つの原則 (`### I. <名称A>` と `### II. <名称B>`) を宣言し、workflow の `design` ステップで Constitution Check が有効化されている
- WHEN 現在のステップが `design` の状態で `mspec continue --change <name> --json` を実行する
- THEN エンベロープは 2 エントリの `constitution_principles` 配列を持ち、各エントリの `id` は `I` と `II`、`name` はフィクスチャ憲法の H3 見出しと一致する

#### Scenario: Constitution Check が無効なステップでは空配列が返る
- GIVEN workflow の `new` ステップで Constitution Check が無効化されている
- WHEN 現在のステップが `new` の状態で `mspec continue --change <name> --json` を実行する
- THEN エンベロープは `"constitution_principles": []` を含む

### Requirement: FR-017 — `architecture-overview.md` での Mermaid 図の必須化
システムは、`mermaid` タグ付きのフェンス付きコードブロックが少なくとも 1 つ存在しない `architecture-overview.md` に対して validate エラーを報告 MUST。これにより design ステップのアーキテクチャ図要件が機械的に強制される。

#### Scenario: Mermaid ブロック欠落で validate が失敗する
- GIVEN `architecture-overview.md` が散文と `text` タグの単一フェンス付きコードブロックのみを含む change
- WHEN ユーザーが `mspec validate --change <name>` を実行する
- THEN コマンドは `architecture-overview.md` を Mermaid フェンス欠落として報告し、プロセスは非ゼロで終了する

#### Scenario: Mermaid ブロックがあれば要件を満たす
- GIVEN `architecture-overview.md` が info string が `mermaid` で始まるフェンス付きコードブロックを 1 つ含む change
- WHEN ユーザーが `mspec validate --change <name>` を実行する
- THEN 当該 artifact の validation は Mermaid 関連の問題を一切報告しない

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
