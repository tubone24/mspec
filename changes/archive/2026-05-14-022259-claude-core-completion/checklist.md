# Checklist: 2026-05-14-022259-claude-core-completion

> 各項目は未チェック (`- [ ]`)。人間が検証後にチェックを入れる。
> FR 名は Delta Spec の表記をそのまま参照する。

## Delta Spec Coverage

### cli-spec-lint (FR-001〜010)

- [ ] FR-001 — 3 カテゴリ分類の禁止語彙リンタ: design.md D5 で「実装変更 0 件・E2E 正式化のみ」と明示。`tests/e2e/spec-lint-formalize.e2e.test.ts` が shell-command / library-name / impl-verb の 3 タグを検証する E2E を持つこと。
- [ ] FR-002 — 安定したルール識別子と修正ヒント: 同 E2E が kebab-case ルール ID + 空でないヒントを検証すること。design.md には FR-002 個別の commitment 記述が無い — spec-lint-formalize E2E のシナリオに含まれるか要確認。
- [ ] FR-003 — デフォルトの走査対象は SoT スペック群: `specs/<capability>/spec.md` 既定走査が E2E でカバーされること。
- [ ] FR-004 — HTML コメントは走査対象外: `text-mask.ts` (D6 新規共通 util) の `blankOutHtmlComments` 経由でカバー。E2E で 0 件報告を検証すること。
- [ ] FR-005 — フェンス付きコードブロックは走査対象外: `text-mask.ts` の `blankOutFences` 経由。E2E で 0 件報告を検証すること。
- [ ] FR-006 — 決定論的な違反順序: `--json` を 2 回実行しバイト一致する E2E シナリオが存在すること。
- [ ] FR-007 — `--allow` によるルール個別無効化: E2E で `--allow lib-zod` が違反を抑制し成功終了することを検証すること。
- [ ] FR-008 — `--json` での機械可読出力: `violations` / `summary` 2 キーのエンベロープを E2E で検証すること。
- [ ] FR-009 — 違反検出時の非ゼロ終了コード: E2E で非ゼロ終了を検証すること。
- [ ] FR-010 — `mspec validate --strict` への組み込み: design.md は spec-lint-formalize E2E にこのシナリオを束ねていない可能性あり — strict validate が spec lint 違反でハードフェイルする E2E が実際に存在するか要確認。

### cli-anchor (FR-015〜017 ADDED, FR-005 MODIFIED)

- [ ] FR-015 — アンカースキャナは HTML コメントとフェンス付きコードブロックを無視する: `parser/anchor.ts` への黒塗り追加 (design.md §修正)。`tests/e2e/anchor-false-positive.e2e.test.ts` がフェンス内・HTML コメント内の `@mspec-delta` 例示で沈黙する 2 シナリオを持つこと。
- [ ] FR-016 — アンカースキャナは SoT スペックと Delta Spec ファイルをスキップする: `lib/anchor-scanner.ts` walker の除外パス追加 (design.md §修正)。`specs/**/spec.md` (`specs/archive/` 含む) と `changes/*/specs/**/spec.md` の両方が除外されることを E2E で検証すること。
- [ ] FR-017 — ブロック形状でない単発言及は沈黙する: `parser/anchor.ts` のブロック形状ガード。単発言及で沈黙・ブロック形状で path 不正なら警告継続の両シナリオが E2E にあること。
- [ ] FR-005 (MODIFIED) — 不完全なアンカーブロックはハードフェイル: SoT 上の旧挙動 (3 行のうち 1〜2 行で即不完全アンカー扱い) との差分は「ブロック形状の近傍判定を追加」。`Change:` 行欠落で失敗するシナリオと、単発ドキュメンテーション言及で失敗しないシナリオの両方が E2E でカバーされること。→ SoT Regression セクション参照。

### cli-archive (FR-013〜014)

- [ ] FR-013 — archive 成功後に決定論的なマージサマリを出力する: `lib/archive-summary.ts` 新規純関数 + `commands/archive.ts` の `printReport` 末尾 `Summary:` セクション (design.md D2)。`+a ~m -r ⇄n` 形式で capability ごと 1 行になること。
- [ ] FR-013 シナリオ2 — 再実行でサマリがバイト一致する: `tests/e2e/archive-summary.e2e.test.ts` がワーキングツリーリセット → 2 回実行 → バイト一致を検証すること。lexicographic ソートが `archive-summary.ts` 内で固定されていること。→ Deterministic archive 項参照。
- [ ] FR-014 — `--dry-run` ではサマリを抑制する: `commands/archive.ts` で `dryRun === true` 時にサマリ抑制 + `[dry-run]` → `[dry-run preview]` ヘッダ差し替え。E2E で `dry-run` ヘッダ有り・マージサマリ行無しを検証すること。

### cli-workflow-engine (FR-015〜017)

- [ ] FR-015 — `mspec continue` エンベロープに `upstream_skipped[]` を含める: design.md は「`upstream_skipped[]` の挙動を E2E でリグレッション固定」と記載 (Goals)。`tests/e2e/continue-envelope.e2e.test.ts` が skip 済み research が現れるケースと空配列ケースの両方を持つこと。注意: FR 名は ADDED だが design.md は「リグレッション固定」と表現 — 既存実装済みフィールドか新規追加かを実装前に確定すること。
- [ ] FR-016 — `mspec continue` エンベロープに `constitution_principles[]` を含める: `lib/constitution-principles.ts` 新規パーサ + `commands/continue.ts` の `ContinueOutput` 型拡張 (design.md D4)。`evaluate_in_phase` が `step.id === 'design' ? ['0','1'] : ['0']` で埋まること。design ステップで全宣言原則を列挙するシナリオと無効ステップで空配列のシナリオが E2E にあること。→ Constitution セクションに重大リスクあり。
- [ ] FR-017 — `architecture-overview.md` での Mermaid 図の必須化: `lib/artifact-validator.ts` に `endsWith('/architecture-overview.md')` 分岐追加、CommonMark 互換の Mermaid フェンス検出を MUST 1 件以上 (design.md D3)。`tests/e2e/validate-mermaid.e2e.test.ts` が欠落で非ゼロ終了・存在で問題なしの両シナリオを持つこと。→ Mermaid 項・E2E Regression 項参照。

## Source-of-Truth Regression

- [ ] **FR-005 改訂のブロック形状契約**: MODIFIED FR-005 は「3 行のうち 1〜2 行が連続行にあり、かつ近傍がブロック形状」のときのみ不完全アンカー扱いに狭める。リグレッション仮説: 旧実装が「単発の `@mspec-delta` 行」でも不完全アンカー判定していた場合、本リポ内の既存ソース (テンプレート・README・design.md 等) に紛れる単発言及が突然沈黙する一方で、本物の壊れたアンカーブロックを取りこぼすリスク。FR-002 / FR-005 のブロック形状ハードフェイル契約 (Scenario「`Change:` 行欠落で check が失敗する」「ブロック形状で path が不正なケースは引き続き警告する」) が回帰なく維持されることを E2E で固定すること。
- [ ] **anchor scanner の walker 除外拡大**: design.md §修正は FR-016 が要求する 2 パターンに加え `packages/cli/templates/**` / `packages/cli/src/**/*.test.ts` / `packages/cli/tests/**` も除外する。リグレッション仮説: 除外パス拡大により、本来アンカーを持つべき実装ファイルがテストフィクスチャと誤判定され走査対象から漏れ、双方向アンカー (P4) のリンク切れが検知されなくなる。除外がフィクスチャ/テンプレに限定され実 `src` ファイルを巻き込まないことを確認すること。
- [ ] **spec-linter.ts の text-mask 切り出し (D6)**: `blankOutFences` / `blankOutRegex` を `lib/text-mask.ts` に move。リグレッション仮説: spec-linter 既存挙動 (FR-001〜010 が「実装と一致」と D5 で前提) が move によって変わると、cli-spec-lint の Delta Spec 全体の「実装の正式化」前提が崩れる。spec-linter 既存ユニットテストが move 後も緑であることを確認すること。
- [ ] **`mspec continue` エンベロープの後方互換**: `ContinueOutput` への `constitution_principles[]` / `upstream_skipped[]` は追加フィールドのみ (design.md D4 / Phase1 P1 / Rollback)。リグレッション仮説: 既存フィールドの型変更や必須化があれば既存 consumer が壊れる。追加が純粋に additive で、既存キー・型・順序が不変であることを E2E スナップショットで固定すること。
- [ ] **`mspec archive` の `printReport` 出力変更**: 末尾に `Summary:` セクション追加。リグレッション仮説: 既存の archive 出力をパースする CI / スクリプトがあれば末尾追加で破綻しうる。既存 archive E2E (もしあれば) が回帰しないことを確認すること。
- [ ] **関連 capability の SoT スペック不在**: `specs/cli-spec-lint/spec.md` 等の SoT スペックは本チェンジで初めて作られる (D5)。`mspec validate` / `mspec archive` が「対応する SoT スペックが存在しない Delta Spec」をどう扱うか — archive マージ先が空でも決定論的に成立することを確認すること。SoT スペックが欠落している関連 capability があれば、それ自体をリグレッションリスクとして扱う。

## Constitution

- [ ] **【重大】`memory/constitution.md` がプレースホルダのまま**: 現状の constitution は `### I. <Principle Name>` / `### II. <Principle Name>` の 2 件のみで、本文も `<本文>` のまま。一方 design.md の Constitution Check 表 (Phase 0 / Phase 1) は 5 原則 (I. ステップ独立性 / II. 決定論的マージ / III. 質問駆動 / IV. 双方向アンカー / V. 強制・拡張ステップ分離) を列挙しており、これらの名称は constitution ファイルに存在しない。さらに FR-016 のシナリオは `I. Library-First` / `II. CLI Interface` をハードコードしておりこれも constitution に無い。人間は (a) `memory/constitution.md` に design.md が参照する 5 原則を実体化する、または (b) design.md の Constitution Check 表をプレースホルダ実態に合わせて修正する、のいずれかで整合させること。未解決のままだと dogfooding の約束が成立しない。
- [ ] **Phase 0 Constitution Check の各行が実在原則に対応するか**: design.md Phase 0 表の 5 行 (I〜V) は、上記の constitution 実体化後に各原則 ID と 1:1 で対応していること。現状はプレースホルダ 2 件しかないため I・II すら名称不一致。
- [ ] **Phase 1 Constitution Check の各行が実在原則に対応するか**: design.md Phase 1 表も同様に 5 行。Phase 0 → Phase 1 の評価列がともに ✅ で、Complexity Tracking が「None — 違反 0 件」であることの根拠 (新規 3 ファイルが単機能) が Phase 1 表と整合していること。
- [ ] **`constitution_principles[]` E2E のフィクスチャ依存**: FR-016 (workflow) の E2E は実 `memory/constitution.md` がプレースホルダのため、`I. Library-First` / `II. CLI Interface` を持つフィクスチャ constitution を用意する必要がある。`lib/constitution-principles.ts` の H3 抽出正規表現 (`### I. <Name>`) がフィクスチャと実ファイル両方の形式で動くことを確認すること。
- [ ] **P4 双方向アンカー — 全 FR が `@mspec-delta` アンカーターゲットに対応**: design.md Phase 0/1 とも「全 FR に対応する実装/E2E に `@mspec-delta` ブロックを必須化」と宣言。tasks.md 生成時に cli-spec-lint FR-001〜010 / cli-anchor FR-005,015,016,017 / cli-archive FR-013,014 / cli-workflow-engine FR-015,016,017 の 17 FR すべてが少なくとも 1 つの `@mspec-delta` アンカーブロックを持つ実装またはテストファイルに紐付くこと。特に D5 で「実装変更 0 件」とされる cli-spec-lint の 10 FR は E2E テストファイル側にアンカーブロックが置かれること。

## Mermaid Fence Requirement

- [ ] **`architecture-overview.md` の Mermaid フェンス強制 (FR-017 workflow)**: `lib/artifact-validator.ts` が `filePath.endsWith('/architecture-overview.md')` で `mermaid` info string のフェンス付きコードブロック (`/^(`{3,}|~{3,})\s*mermaid(\b|$)/m`) を 1 件以上 MUST 要求すること。`--strict` 限定ではなく通常 `validate` で常時 hard fail (design.md D3)。
- [ ] **本チェンジ自身の `architecture-overview.md` が Mermaid フェンスを含む**: ドッグフーディング上、本チェンジの `changes/2026-05-14-022259-claude-core-completion/architecture-overview.md` 自体が `mermaid` フェンスを少なくとも 1 つ持ち、新ルールに自己準拠していること (含まないと本チェンジの `validate` が即 fail する)。
- [ ] **CommonMark 互換性**: バックティック 3 つ以上・チルダ 3 つ以上の両フェンス形式、および `mermaid` の後に空白/行末/属性が続くケースを検出すること。`text` タグや無タグのフェンスを誤検出しないこと。

## Deterministic Archive Summary

- [ ] **バイト一致の再実行検証 (FR-013 シナリオ2)**: `tests/e2e/archive-summary.e2e.test.ts` がワーキングツリーをリセットして `mspec archive <change> -y` を 2 回実行し、サマリ出力がバイト一致することを検証すること。
- [ ] **lexicographic ソートの固定**: `lib/archive-summary.ts` の `formatSummary` が capability を辞書順でソートし、`MergeSummary` 値を LLM 非依存で直接整形すること (design.md D2 / Phase0 P2)。capability の入力順に出力が依存しないことをユニットテスト (`archive-summary.test.ts`) で確認すること。
- [ ] **サマリ書式の厳密性**: `cli-anchor: +2 ~1 -0 ⇄0` の形式 (記号・空白・件数 0 の明示表示) が FR-013 シナリオ1 と完全一致すること。

## E2E Regression Risk (previously-passing changes)

- [ ] **Mermaid 必須化の遡及影響 — 検証済み: 影響なし**: `find changes -name architecture-overview.md` の結果、`architecture-overview.md` を持つのは本チェンジ 1 件のみ。Mermaid を欠く既存チェンジは存在しないため、FR-017 (workflow) 導入で壊れる過去チェンジは無い (design.md D3 / Migration Plan #1 と整合)。本リポで新規導入のため互換性影響なしを確定とすること。
- [ ] **anchor false-positive 根絶の副作用**: design.md Goals は「`mspec anchor check` の false-positive (現状 10+ 件) を 0 件にする」。0 件化の過程で、過去に正しく検知されていた本物の壊れたアンカーまで沈黙させていないこと — FR-005 改訂のブロック形状契約 (上記 SoT Regression 参照) が真陽性を維持することを E2E で固定すること。
- [ ] **`mspec validate --strict` 全体のクリーン化**: design.md Goals は「`mspec validate --strict` がクリーンに通る状態」を掲げる。spec-lint 組み込み (FR-010) や Mermaid 強制 (FR-017) の追加で、これまで通っていた他チェンジの `validate --strict` が新たに fail しないこと (本リポでは change が 1 件のみだが、archive 後の SoT スペック群に対する `spec lint` 既定走査が新規 fail を出さないこと)。
- [ ] **段階的 PR 分割 (Migration Plan PR-1〜5) の各段で既存テスト緑**: 特に PR-1 (text-mask 抽出) は「既存テスト緑のまま」が design.md で明言されているため、各 PR 完了時点で `vitest` 全体が緑であることを確認すること。
