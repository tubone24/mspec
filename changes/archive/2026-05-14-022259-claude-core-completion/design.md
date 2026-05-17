# Design: Claude 向け mspec v0 機能ギャップ充足 (Dogfooding 準備)

## Summary

`packages/cli/src` 配下の 4 capability (`cli-spec-lint`/`cli-anchor`/`cli-archive`/`cli-workflow-engine`) に対する局所修正で、Delta Spec 17 FR をすべて満たす。新規ファイルは最小限 (constitution-principles パーサ抽出のみ) で、残りは既存ファイルへの分岐追加と関数差し替えに収める。

## Goals

- 4 capability の FR を実装、`mspec validate --strict` がクリーンに通る状態にする。
- `mspec anchor check` の false-positive (現状 10+ 件) を 0 件にする。
- `mspec archive` がマージサマリ 1 行 / capability を決定論的に出力する。
- `mspec continue` envelope に `constitution_principles[]` を追加し、`upstream_skipped[]` の挙動を E2E でリグレッション固定する。
- `architecture-overview.md` の Mermaid フェンス必須化を `validate` で常時 hard fail として強制する。

## Non-Goals

- Codex / Copilot integration 追加 (proposal で別チェンジに分離済み)。
- 既存 CLI 表面 (コマンド名・サブコマンド名) のリネーム。
- 新規ワークフローステップの追加。
- `memory/constitution.md` 本文の充実化 (パース対象としては扱うが文言は触らない)。

## Technical Context

- **Language / Runtime**: TypeScript (`tsc 5.6`) / Node.js >= 18 (`packages/cli/package.json`)
- **Dependencies (new)**: なし。既存の `gray-matter` / `remark` / `commander` / `zod` で完結。
- **Storage**: ファイルシステムのみ (`changes/` / `specs/` / `memory/constitution.md`)
- **Testing framework**: Vitest 2.1 (`packages/cli/vitest.config.ts`)
- **Target platform**: ローカル CLI (macOS / Linux); CI は GitHub Actions 想定だが本チェンジでは触らない。
- **Performance / Constraints**:
  - anchor scanner は `O(行数)` 線形維持 (フェンス/コメント黒塗りは spec-linter と同戦術で再利用)。
  - archive サマリは決定論性 (lexicographic ソート、再実行で byte 一致) を MUST。

## Constitution Check (Phase 0)

| Principle | Compliant? | Notes |
|-----------|-----------|-------|
| I. ステップ独立性 (P1) | ✅ | `mspec status` / `continue` の状態機械に追加なし。`continue` envelope のフィールド追加のみ。 |
| II. 決定論的マージ (P2) | ✅ | archive サマリは lexicographic ソート + 既存 `MergeSummary` 値の直接フォーマット、LLM 非依存。 |
| III. 質問駆動 (P3) | ✅ | research/design は AskUserQuestion を中核に維持 (今回は明示的指示で抑制し研究で論点を Decisions に取り込み済み)。 |
| IV. 双方向アンカー (P4) | ✅ | 全 FR に対応する実装/E2E に `@mspec-delta` ブロックを必須化。本チェンジ自体の FR がアンカースキャナ自身に効く (`cli-anchor`)。 |
| V. 強制/拡張ステップ分離 (P5) | ✅ | workflow.yaml に変更なし。`removable` フラグも触らない。 |

## Project Structure (changes)

### 新規

- `packages/cli/src/lib/constitution-principles.ts` — `memory/constitution.md` の `### I. <Name>` H3 を抽出し `{ id, name }[]` を返すパーサ。`commands/constitution.ts` の helper と重複しないよう分離。
- `packages/cli/src/lib/constitution-principles.test.ts` — ユニット。
- `packages/cli/src/lib/archive-summary.ts` — `MergeSummary` → 1 行サマリ文字列の整形関数。`+a ~m -r ⇄n` を生成。
- `packages/cli/src/lib/archive-summary.test.ts` — ユニット。
- `packages/cli/tests/e2e/anchor-false-positive.e2e.test.ts` — FR-015〜017 + FR-005 改訂のシナリオを束ねる E2E。
- `packages/cli/tests/e2e/archive-summary.e2e.test.ts` — FR-013/014 のシナリオ + byte 一致テスト。
- `packages/cli/tests/e2e/continue-envelope.e2e.test.ts` — FR-015/016 (workflow) のシナリオ。
- `packages/cli/tests/e2e/validate-mermaid.e2e.test.ts` — FR-017 (workflow) のシナリオ。
- `packages/cli/tests/e2e/spec-lint-formalize.e2e.test.ts` — FR-001〜010 (spec-lint) を正式化する E2E。

### 修正

- `packages/cli/src/parser/anchor.ts` — `parseAnchors` 入口で HTML コメント/フェンス黒塗り (`blankOutFences` / `blankOutRegex` を spec-linter から共通 util に切り出した上で参照)、ブロック形状ガードを追加して単発言及を沈黙。`@mspec-delta` 文字列を含む regex 定義自体は **コメント剥離後の本文として無視** されるよう、`stripCommentPrefix` の検査前にトークン抽出をやめ「3 行ブロック近傍があるか」に判定を寄せる。
- `packages/cli/src/lib/anchor-scanner.ts` — walker に追加除外: `specs/**/spec.md` (`specs/archive/` 含む)、`changes/*/specs/**/spec.md`、`packages/cli/templates/**`。**制約 (P4)**: `packages/cli/tests/**` および `packages/cli/src/**/*.test.ts` は walker から一律除外してはならない。D5 で cli-spec-lint の 10 FR は実装変更ゼロのためアンカーが E2E テストファイル側にのみ存在し、テストを一律除外すると `mspec anchor check` が当該 10 FR の双方向リンクを検証できなくなる。E2E テスト内のアンカー形式テストフィクスチャ (例: `anchor-false-positive.e2e.test.ts` 内の文字列) は FR-015 (フェンス/HTML コメント黒塗り) と FR-017 (ブロック形状ガード) で false-positive を抑止する設計であり、ファイル単位の除外は不要。tasks.md でこの方針を具体化する。
- `packages/cli/src/lib/spec-linter.ts` — `blankOutFences`/`blankOutRegex` を `lib/text-mask.ts` (新規共通 util) に move し、`anchor.ts` と共有。spec-linter 本体 API は不変。
- `packages/cli/src/commands/archive.ts` — `printReport` 末尾に `Summary:` セクションを追加し `archive-summary.ts` を呼ぶ。`dryRun === true` の時は出力を抑制し `[dry-run]` ヘッダを `[dry-run preview]` に差し替え。
- `packages/cli/src/commands/continue.ts` — `ContinueOutput` 型に `constitution_principles` 追加。`buildContinue` で `step.constitution_check === true` なら `constitution-principles.ts` を呼び `evaluate_in_phase` を `step.id === 'design' ? ['0','1'] : ['0']` で埋める。
- `packages/cli/src/lib/artifact-validator.ts` — `filePath.endsWith('/architecture-overview.md')` 分岐を追加。CommonMark 互換の Mermaid フェンス検出 (`/^(`{3,}\|~{3,})\s*mermaid(\b\|$)/m`) を MUST 1 件以上。
- `packages/cli/src/commands/spec-lint.ts` — FR は実装済みのため変更なし、テストでカバレッジを正式化するのみ。

### 削除

- なし。

## Decisions

### D1. アンカー false-positive を「scanner+parser の二段除外」で根絶する

- **採用**: walker (`anchor-scanner.ts`) で `specs/**/spec.md` 等のパスごとスキップ + parser (`anchor.ts`) でフェンス/HTML コメント/ブロック形状ガードを多重に適用。
- **代替**: parser だけで全てカバー → walker から無駄に読み込み続けるため I/O 増 + 行番号ベースのガードが脆い。
- **トレードオフ**: 除外パスのハードコードが増えるが、FR-016 が明示している 2 パターン + テンプレ/テスト の 4 種に絞られ管理可能。`.mspecignore` 導入は別チェンジ。

### D2. archive サマリは `MergeSummary` を直接整形する純関数として切り出す

- **採用**: `archive-summary.ts` を新規追加して `formatSummary(merges: CapabilityMerges): string` を提供。`printReport` から呼ぶ。
- **代替**: `printReport` 内インライン → テスト粒度が落ち byte 一致確認が困難。
- **トレードオフ**: ファイルが 1 つ増えるが、決定論性検証 (FR-013 のシナリオ 2 「再実行でバイト一致」) を vitest で局所化できる。

### D3. Mermaid 必須化は `validate` 常時 hard fail (strict 限定にしない)

- **採用**: 設計 §5.6 が「画面変更が無いチェンジでも System Diagram は必須」と明言。`validateArtifact` で `architecture-overview.md` を見たら必ず Mermaid フェンス 1 つ以上を要求。
- **代替**: `--strict` 限定 → 通常 `validate` がチェック漏れし dogfooding 中の安全網を失う。
- **トレードオフ**: 既存チェンジで `architecture-overview.md` を持つが Mermaid が無いものは即 fail。今回のリポでは本チェンジが新規導入なので互換性影響なし。

### D4. `constitution_principles[]` は CLI 側パーサで `memory/constitution.md` から抽出

- **採用**: `constitution-principles.ts` で H3 (`### I. <Name>`) を正規表現抽出。`evaluate_in_phase` は `step.id` ベースの簡易ロジック (design なら `['0','1']`、他は `['0']`)。
- **代替**: workflow.yaml に明示列挙 → constitution 改訂のたびに workflow.yaml も更新する必要があり、原則 III (質問駆動) からの逸脱。
- **トレードオフ**: H3 抽出がテンプレ依存だが、`memory/constitution.md` のフォーマットは設計で固定しているため許容範囲。

### D5. cli-spec-lint の Delta Spec は「実装の正式化」と位置付ける

- **採用**: FR-001〜010 は既存実装の挙動と一致しているため、実装変更 0 件。E2E テストの追加だけで spec を満たす。
- **代替**: 一部 FR をリファクタ機会と捉えて実装も触る → スコープ膨張、proposal の Non-Goals (破壊的リネーム回避) に反する。
- **トレードオフ**: 「コードを書かなくても FR を増やしてよいのか」という哲学的議論は残るが、Spec 化漏れ (`specs/cli-spec-lint/spec.md` 不在) の解消こそが本目的。

### D6. text-mask 共通 util の抽出

- **採用**: `packages/cli/src/lib/text-mask.ts` に `blankOutFences` / `blankOutHtmlComments` を切り出し、`spec-linter.ts` と `parser/anchor.ts` 両方から参照。
- **代替**: それぞれの内部で複製 → 改修時のドリフトリスク。
- **トレードオフ**: 抽象 1 つ追加だが、用途がまさに 2 callers で同等なので「ルール: 3 similar lines is better than premature abstraction」は満たす (3 件目に育てて切り出しではなく、明確に 2 件目で共通化が必須なケース)。

## Constitution Check (Phase 1, 計画詳細後)

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 (P1) | ✅ | ✅ | `continue` envelope 拡張は後方互換 (フィールド追加のみ)。既存ステップの依存関係に影響なし。 |
| II. 決定論的マージ (P2) | ✅ | ✅ | archive サマリ整形は lexicographic + 純関数。E2E で byte 一致を検証。 |
| III. 質問駆動 (P3) | ✅ | ✅ | design.md 自体は AskUserQuestion 抑制中だが、Decisions の根拠を全て research.md に紐付け追跡可能。 |
| IV. 双方向アンカー (P4) | ✅ | ✅ | 全 FR に対応する実装ファイルへ `@mspec-delta` ブロックを必須化。tasks.md の anchor block で双方向リンク。 |
| V. 強制/拡張ステップ分離 (P5) | ✅ | ✅ | workflow.yaml/skill 定義は不変。Mermaid 必須化は produced artifact のバリデーションであり workflow 構造とは別。 |

### Complexity Tracking

None — 違反 0 件。新規追加は (a) text-mask 共通 util、(b) constitution-principles パーサ、(c) archive-summary 整形関数の 3 ファイルのみで、いずれも単機能・代替案より明確に簡潔。`docs/design/mspec-design.md §1.2` の 5 原則を逸脱しない。

## Migration Plan / Rollout

1. **既存挙動の保全**: `mspec validate` を本チェンジ前に通る既存 change で再実行し、Mermaid 必須化が将来チェンジ以降のみ効くようリリースノートに明示する (本リポでは適用対象なし)。
2. **段階的展開**:
   - PR-1: text-mask 抽出 + cli-anchor 修正 (walker 除外 / parser ガード) + 既存テスト緑のまま。
   - PR-2: archive-summary + dry-run 抑制 + E2E。
   - PR-3: constitution-principles パーサ + continue envelope 拡張 + E2E。
   - PR-4: artifact-validator Mermaid 強制 + E2E。
   - PR-5: cli-spec-lint の E2E 正式化 (実装変更なし)。
3. **dogfooding 完了**: 本チェンジを `mspec archive` で SoT に取り込み、`README.md` をフォローアップ task で最新化 (tasks.md で別 task 化、Delta Spec スコープ外)。
4. **ロールバック**: 各 PR は単機能で切り戻し容易。`continue.constitution_principles` フィールド追加は consumer 側で optional 扱いされる前提で導入。
