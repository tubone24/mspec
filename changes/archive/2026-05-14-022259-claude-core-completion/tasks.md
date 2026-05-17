# Tasks: Claude 向け mspec v0 機能ギャップ充足 (Dogfooding 準備)

> 各タスクは「どの Scenario を緑にするか」と「どのファイル変更を伴うか」を 1 行で示す。
> implement ステップは E2E → 実装の TDD red→green で進行し、各 anchor ブロックを対象ファイルに打つ。
> change-dir: `2026-05-14-022259-claude-core-completion` / feature-kebab: `claude-core-completion`

## Phase 1: Setup

- [ ] T001 [P] vitest ベースライン確認 — files: `packages/cli/` — 既存テストスイートが緑であることを確認し、本チェンジ前の基準を固定する。

## Phase 2: Foundational

- [ ] T010 text-mask 共通 util を抽出 (D6) — files: `packages/cli/src/lib/text-mask.ts` (新規), `packages/cli/src/lib/spec-linter.ts` (修正) — `blankOutFences` / `blankOutHtmlComments` (旧 `blankOutRegex`) を `text-mask.ts` に move し `spec-linter.ts` から参照。spec-linter 本体 API は不変、既存ユニットテストが緑のまま (checklist「text-mask 切り出し」リグレッション項)。
- [ ] T011 [P] text-mask ユニットテスト — files: `packages/cli/src/lib/text-mask.test.ts` (新規) — フェンス (` ``` ` / `~~~`)・HTML コメントの黒塗りが行数線形で正しく機能することを検証。

## Phase 3: User Story 1 (P1) — cli-anchor false-positive 根絶 (PR-1)

### Tests-first (E2E)

- [ ] T101 E2E: cli-anchor FR-015/016/017/005 シナリオ束 — files: `packages/cli/tests/e2e/anchor-false-positive.e2e.test.ts` — 対象 Scenario: FR-015「フェンス内 `@mspec-delta` 例示は沈黙」「HTML コメント内例示は沈黙」/ FR-016「SoT スペック本文が走査されない」「Delta Spec 本文が走査されない」/ FR-017「後続行を伴わない単発言及は沈黙」「ブロック形状で path 不正は警告継続」/ FR-005 MODIFIED「`Change:` 行欠落で check 失敗」「単発ドキュメンテーション言及は check を失敗させない」。
      anchor:
        @mspec-delta 2026-05-14-022259-claude-core-completion/specs/cli-anchor/spec.md
        Requirements implemented: FR-005, FR-015, FR-016, FR-017
        Change: claude-core-completion

### Implementation

- [ ] T102 anchor-scanner walker に除外パスを追加 (FR-016) — files: `packages/cli/src/lib/anchor-scanner.ts` — 除外を `specs/**/spec.md` (`specs/archive/` 配下含む)・`changes/*/specs/**/spec.md`・`packages/cli/templates/**` の 3 系統に**限定**。受入条件 (P4 制約, design.md:60): `packages/cli/tests/**` および `packages/cli/src/**/*.test.ts` を巻き込まないこと — 巻き込むと cli-spec-lint の 10 FR の双方向リンクが検証不能になる。
      anchor:
        @mspec-delta 2026-05-14-022259-claude-core-completion/specs/cli-anchor/spec.md
        Requirements implemented: FR-016
        Change: claude-core-completion
- [ ] T103 anchor.ts parser にフェンス/HTML コメント黒塗り + ブロック形状ガードを追加 (FR-015/017/005) — files: `packages/cli/src/parser/anchor.ts` — `parseAnchors` 入口で `text-mask.ts` の `blankOutFences`/`blankOutHtmlComments` を適用 (FR-015)。3 行ブロック近傍判定ガード (直後行が `Requirements implemented:` 始まり、または直前行がアンカープロトコル行) を追加し単発言及を沈黙 (FR-017)。不完全アンカー判定を「ブロック形状近傍あり」のときのみに狭める (FR-005 MODIFIED)。`@mspec-delta` を含む regex 定義リテラル自体は黒塗り後本文として無視されること。
      anchor:
        @mspec-delta 2026-05-14-022259-claude-core-completion/specs/cli-anchor/spec.md
        Requirements implemented: FR-005, FR-015, FR-017
        Change: claude-core-completion

## Phase 3: User Story 2 (P1) — cli-archive 決定論的マージサマリ (PR-2)

### Tests-first

- [ ] T111 [P] archive-summary ユニットテスト — files: `packages/cli/src/lib/archive-summary.test.ts` (新規) — capability を辞書順ソートし入力順に依存しないこと、`+a ~m -r ⇄n` 書式 (記号・空白・件数 0 の明示) が厳密一致することを検証。
      anchor:
        @mspec-delta 2026-05-14-022259-claude-core-completion/specs/cli-archive/spec.md
        Requirements implemented: FR-013
        Change: claude-core-completion
- [ ] T112 E2E: cli-archive FR-013/014 — files: `packages/cli/tests/e2e/archive-summary.e2e.test.ts` (新規) — 対象 Scenario: FR-013「サマリ行に capability ごとの件数が並ぶ」(`cli-anchor: +2 ~1 -0 ⇄0` と `cli-archive: +1 ~0 -0 ⇄0` の両方)「再実行でサマリがバイト一致」(ワーキングツリーリセット → 2 回実行) / FR-014「dry-run 出力はラベル付きで成功サマリを持たない」。
      anchor:
        @mspec-delta 2026-05-14-022259-claude-core-completion/specs/cli-archive/spec.md
        Requirements implemented: FR-013, FR-014
        Change: claude-core-completion

### Implementation

- [ ] T113 archive-summary 純関数を新規追加 (FR-013) — files: `packages/cli/src/lib/archive-summary.ts` (新規) — `formatSummary(merges)` が `MergeSummary` 値を lexicographic ソート + 純関数整形で `+a ~m -r ⇄n` の 1 行 / capability に変換。LLM 非依存・再実行バイト一致 (design.md D2 / Phase0 P2)。
      anchor:
        @mspec-delta 2026-05-14-022259-claude-core-completion/specs/cli-archive/spec.md
        Requirements implemented: FR-013
        Change: claude-core-completion
- [ ] T114 archive.ts `printReport` にサマリ追加 + dry-run 抑制 (FR-013/014) — files: `packages/cli/src/commands/archive.ts` — `printReport` 末尾に `Summary:` セクションを追加し `archive-summary.ts` を呼ぶ (FR-013)。`dryRun === true` の時はサマリ出力を抑制し `[dry-run]` ヘッダを `[dry-run preview]` に差し替え (FR-014)。既存 archive 出力をパースする利用側を壊さないよう末尾追加に留める (checklist「printReport 出力変更」リグレッション項)。
      anchor:
        @mspec-delta 2026-05-14-022259-claude-core-completion/specs/cli-archive/spec.md
        Requirements implemented: FR-013, FR-014
        Change: claude-core-completion

## Phase 3: User Story 3 (P1) — cli-workflow-engine continue エンベロープ拡張 (PR-3)

### Tests-first

- [ ] T121 [P] constitution-principles ユニットテスト — files: `packages/cli/src/lib/constitution-principles.test.ts` (新規) — `### I. <Name>` H3 抽出正規表現が実 `memory/constitution.md` (5 原則) とフィクスチャ憲法 (2 原則) の両形式で `{ id, name }[]` を返すことを検証。
      anchor:
        @mspec-delta 2026-05-14-022259-claude-core-completion/specs/cli-workflow-engine/spec.md
        Requirements implemented: FR-016
        Change: claude-core-completion
- [ ] T122 E2E: continue エンベロープ FR-015/016 — files: `packages/cli/tests/e2e/continue-envelope.e2e.test.ts` (新規) — フィクスチャ憲法 (`### I. <名称A>` / `### II. <名称B>`) を `packages/cli/tests/fixtures/` に用意。対象 Scenario: FR-015「skip 済み research が upstream リストに現れる」「skip が無い場合は空配列」(実装済みフィールドのリグレッション固定) / FR-016「design ステップが全宣言原則を列挙する」「Constitution Check 無効ステップでは空配列」。`ContinueOutput` の既存キー・型・順序が不変であることをスナップショットで固定 (checklist「エンベロープの後方互換」リグレッション項)。
      anchor:
        @mspec-delta 2026-05-14-022259-claude-core-completion/specs/cli-workflow-engine/spec.md
        Requirements implemented: FR-015, FR-016
        Change: claude-core-completion

### Implementation

- [ ] T123 constitution-principles パーサを新規追加 (FR-016) — files: `packages/cli/src/lib/constitution-principles.ts` (新規) — `memory/constitution.md` の `### I. <Name>` H3 見出しを正規表現抽出し `{ id, name }[]` を返す。`commands/constitution.ts` の helper とは重複させず分離 (design.md D4)。
      anchor:
        @mspec-delta 2026-05-14-022259-claude-core-completion/specs/cli-workflow-engine/spec.md
        Requirements implemented: FR-016
        Change: claude-core-completion
- [ ] T124 continue.ts `ContinueOutput` に `constitution_principles` を追加 (FR-016) — files: `packages/cli/src/commands/continue.ts` — `ContinueOutput` 型に `constitution_principles` を additive 追加。`buildContinue` で `step.constitution_check === true` のとき `constitution-principles.ts` を呼び、`evaluate_in_phase` を `step.id === 'design' ? ['0','1'] : ['0']` で埋める。無効ステップでは空配列。
      anchor:
        @mspec-delta 2026-05-14-022259-claude-core-completion/specs/cli-workflow-engine/spec.md
        Requirements implemented: FR-016
        Change: claude-core-completion

> 注: cli-workflow-engine FR-015 (`upstream_skipped[]`) は現行 CLI に実装済み (Delta Spec 注記参照)。実装タスクは設けず、T122 の E2E でリグレッションを固定するのみ。FR-015 の anchor は T122 の E2E ファイルに置く。

## Phase 3: User Story 4 (P1) — architecture-overview.md Mermaid 必須化 (PR-4)

### Tests-first (E2E)

- [ ] T131 E2E: validate-mermaid FR-017 — files: `packages/cli/tests/e2e/validate-mermaid.e2e.test.ts` (新規) — 対象 Scenario: FR-017「Mermaid ブロック欠落で validate が失敗する」(非ゼロ終了)「Mermaid ブロックがあれば要件を満たす」。CommonMark 互換: ` ``` ` / `~~~` 両フェンス形式、`mermaid` の後に空白/行末/属性が続くケースを検出し、`text` タグ・無タグフェンスを誤検出しないこと。`--strict` 限定ではなく通常 `validate` で hard fail すること。
      anchor:
        @mspec-delta 2026-05-14-022259-claude-core-completion/specs/cli-workflow-engine/spec.md
        Requirements implemented: FR-017
        Change: claude-core-completion

### Implementation

- [ ] T132 artifact-validator に architecture-overview.md 分岐を追加 (FR-017) — files: `packages/cli/src/lib/artifact-validator.ts` — `filePath.endsWith('/architecture-overview.md')` 分岐を追加し、`/^(`{3,}|~{3,})\s*mermaid(\b|$)/m` にマッチするフェンスを MUST 1 件以上要求。delta-spec ファイルの early-return より後 (architecture-overview.md に到達する位置) に配置。常時 hard fail (design.md D3)。
      anchor:
        @mspec-delta 2026-05-14-022259-claude-core-completion/specs/cli-workflow-engine/spec.md
        Requirements implemented: FR-017
        Change: claude-core-completion

## Phase 3: User Story 5 (P2) — cli-spec-lint 正式化 (PR-5)

### Tests-first (E2E)

- [ ] T141 E2E: spec-lint 正式化 FR-001〜010 — files: `packages/cli/tests/e2e/spec-lint-formalize.e2e.test.ts` (新規) — 対象 Scenario: FR-001「3 カテゴリ (shell-command/library-name/impl-verb) の違反がそれぞれ出力」/ FR-002「違反レポートに kebab-case ルール ID とヒント」/ FR-003「デフォルト走査で全 SoT スペックがカバー」/ FR-004「HTML コメント内トークンは沈黙 (0 件)」/ FR-005「フェンス内トークンは沈黙 (0 件)」/ FR-006「`--json` 2 回でバイト一致」/ FR-007「`--allow lib-zod` で違反抑制 + 成功終了」/ FR-008「`--json` に `violations`/`summary` 2 キー」/ FR-009「違反検出で非ゼロ終了」/ FR-010「strict validate が禁止トークンでハードフェイル」。design.md D5 により実装変更ゼロ、本 E2E が FR-001〜010 のアンカー保持先 (P4 充足)。
      anchor:
        @mspec-delta 2026-05-14-022259-claude-core-completion/specs/cli-spec-lint/spec.md
        Requirements implemented: FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-008, FR-009, FR-010
        Change: claude-core-completion

### Implementation

> design.md D5 により実装変更ゼロ。`packages/cli/src/commands/spec-lint.ts` および `lib/spec-linter.ts` は既存実装が FR-001〜010 を満たしているため変更しない (T010 の text-mask move を除く)。FR-001〜010 の双方向アンカーは T141 の E2E ファイル側に置く。

## Phase 4: Polish

- [ ] T201 `mspec anchor check` で false-positive 0 件を確認 — files: `packages/cli/` — design.md Goals「false-positive (現状 10+ 件) を 0 件」を達成し、本物の壊れたアンカーは引き続き検知されること (真陽性維持) を確認。注意: 本 `tasks.md` も scanner 走査対象に残るため、各 FR のアンカーが `tasks.md` ではなく実装/テストファイル側に確実に置かれているかをファイル単位で目視確認すること (anchor check 緑だけを P4 充足の根拠にしない)。
- [ ] T202 `mspec validate --strict` がクリーンに通ることを確認 — files: `packages/cli/` — spec-lint 組み込み (FR-010) と Mermaid 強制 (FR-017) 追加後も他チェンジの validate が新規 fail しないこと。
- [ ] T203 [P] vitest 全体が緑であることを確認 — files: `packages/cli/` — Migration Plan PR-1〜5 の各段完了時点でも `vitest` 全体が緑であることを確認 (特に PR-1 の text-mask 抽出)。
- [ ] T204 [P] README.md を最新化 — files: `README.md` — dogfooding 完了に伴うフォローアップ。Delta Spec スコープ外 (design.md Migration Plan #3)。

## Dependencies

- T010 (text-mask 抽出) blocks T103 (anchor.ts parser) — `blankOutFences`/`blankOutHtmlComments` を共有するため。
- 各 User Story 内: E2E/ユニットテストタスク blocks 実装タスク (TDD red→green) — T101 → T102,T103 / T111,T112 → T113,T114 / T121,T122 → T123,T124 / T131 → T132。
- User Story 間: Migration Plan の PR-1〜5 順 (US1 → US2 → US3 → US4 → US5) を推奨。ただし Phase 2 完了後は各 US が機能的に独立しているため並行着手も可。
- Phase 4 (T201〜T203) は全 User Story 完了後。T204 は archive 後のフォローアップ。

## Constitution Check

> Step: tasks | Constitution Version: 1.0.0

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | — | tasks.md は成果物分解のみ。workflow 状態機械・ステップ依存に変更なし。`continue` エンベロープ拡張タスク (T124) は additive。 |
| II. 決定論的マージ | ✅ | — | T113/T114 が archive サマリを lexicographic ソート + 純関数整形で実装、T112 で再実行バイト一致を E2E 固定。LLM 非依存。 |
| III. 質問駆動の要件確定 | ✅ | — | tasks 分解は Delta Spec / design.md / checklist.md から決定論的に導出。判断根拠は全て先行成果物に追跡可能。 |
| IV. 双方向アンカー | ✅ | — | 全 17 FR が少なくとも 1 つの `@mspec-delta` ブロックを持つ実装/E2E タスクに紐付く。cli-spec-lint の 10 FR と cli-workflow FR-015 は E2E テストファイル側にアンカーを配置 (T141 / T122)。T102 で walker 除外がテストファイルを巻き込まない受入条件を明示。 |
| V. 強制/拡張ステップ分離 | ✅ | — | `.mspec/workflow.yaml` と `removable` フラグに変更なし。Mermaid 必須化 (T131/T132) は produced artifact のバリデーションであり workflow 構造とは独立。 |

### Complexity Tracking

None — 違反 0 件。新規ファイルは design.md で確定済みの (a) `text-mask.ts`、(b) `constitution-principles.ts`、(c) `archive-summary.ts` の 3 つの単機能 util と各ユニット/E2E テストのみ。tasks.md は新たな抽象を導入しない。
