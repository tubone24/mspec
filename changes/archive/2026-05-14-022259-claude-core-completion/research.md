# Research: Claude 向け mspec v0 機能ギャップ充足

## Decisions

| 論点 | 採用案 | 代替案 | 根拠 |
|------|--------|--------|------|
| **cli-anchor: スキャナ除外規則 (FR-015)** | (1) HTML コメント `<!-- ... -->` 内、(2) ` ``` ` / `~~~` フェンス内、を scanner 段 (`scanAnchors`) で行ストリームから除外したうえで `parseAnchors` に渡す | parseAnchors 内で逐行判定 | 既に `spec-linter.ts` の `blankOutFences` / `blankOutRegex` (`packages/cli/src/lib/spec-linter.ts:62-201`) が同等の責務を持ち再利用可能。決定論的で行番号も保存できる。 |
| **cli-anchor: spec ファイルのアンカースキャン除外 (FR-016)** | `specs/<capability>/spec.md` (`specs/archive/` 含む) と `changes/<change-dir>/specs/<capability>/spec.md` を anchor-scanner walker レベル (`packages/cli/src/lib/anchor-scanner.ts:34-52`) でスキップ | parseAnchors 内でパス判定 | walker レベルで除外する方が安価で、warning も最初から発生しない。`specs/cli-anchor/spec.md` が `@mspec-delta` トークンを解説目的で持つことは意図と一致 (`docs/design/mspec-design.md §5.6`)。 |
| **cli-anchor: 単発言及の沈黙ルール (FR-017 / FR-005 改訂)** | 「`@mspec-delta` を含む行の直後または直前に `Requirements implemented:` 行が `stripCommentPrefix` 後に現れるとき」のみブロック形状候補とみなし、それ以外は完全沈黙 | `Change:` 行の有無も検査 | `Requirements implemented:` が PATH_RE と最も結びつきが強い 2 行目の固定文字列。`CHANGE_RE` は kebab-case でゆるく誤検出しやすいので避ける (`packages/cli/src/parser/anchor.ts:5-8`)。 |
| **cli-archive: サマリ書式 (FR-013)** | 1 行 / capability の `+a ~m -r ⇄n` 形式 (capability 名は lexicographic ソート) を stdout に新たな `Summary:` セクションとして出力 | (B) 多行形式は現行 `printReport` が既に持つので冗長 / (C) 総計のみは Spec FR-013 が「capability ごと」と明記しているため不可 | 1 行サマリは `git diff --stat` と同様 grep 可能。FR-013 シナリオ本文に `cli-anchor: +2 ~1 -0 ⇄0` という具体例があり、書式は spec で実質固定。`printReport` (`packages/cli/src/commands/archive.ts:163-186`) の多行表示は残し、最下部にサマリ行を追記する。 |
| **cli-archive: dry-run でのサマリ抑制 (FR-014)** | `printReport` で `dryRun === true` のとき `[dry-run]` ヘッダを `[dry-run preview]` に変更し、Summary セクションを出力しない | dry-run でもサマリを出すが `(preview)` を付ける | 既存実装 `archive.ts:169` の `[dry-run]` ヘッダを拡張するのが最小差分。Spec FR-014 が「成功サマリを持たない」を明文化。 |
| **cli-workflow-engine: Mermaid 強制レベル (FR-017)** | 常時 hard fail。`validateArtifact` 内で `filePath.endsWith('/architecture-overview.md')` を分岐し Mermaid フェンス検出 | `--strict` 時のみ fail | 設計 §5.6 の文言が「画面変更が無いチェンジでも System Diagram は必須」と明言。spec FR-017 シナリオも `mspec validate --change <name>` (strict 指定なし) で fail する挙動を期待。 |
| **cli-workflow-engine: Mermaid info string 判定** | CommonMark 準拠で「フェンス開始行のスペース 0–3 + ` ``` ` または `~~~` + 任意空白 + `mermaid` (case-sensitive prefix-match)」を 1 件以上 | `^```mermaid$` 厳格マッチ | CommonMark §4.5 に従い info string は前後空白トリム後の文字列。将来 ` ```mermaid {theme:dark}` のような拡張を許容するため `/^(`{3,}\|~{3,})\s*mermaid(\b\|$)/` を採用。Mermaid 公式は小文字 `mermaid` のみを例示しているので case-sensitive。 |
| **cli-workflow-engine: `upstream_skipped` の現状 (FR-015)** | 既に実装済 (`packages/cli/src/commands/continue.ts:22, 89`)。Delta Spec FR-015 はリグレッション防止用 E2E の形式化として扱う | — | Spec の要求と実装が一致。新規 E2E シナリオの追加だけで済む。 |
| **cli-workflow-engine: `constitution_principles` スキーマ (FR-016)** | `ContinueOutput` に `constitution_principles: { id: string; name: string; evaluate_in_phase: ('0'\|'1')[] }[]` を新規追加。`memory/constitution.md` の `### I. <Name>` / `### II. <Name>` H3 を `constitution.ts` のパーサで抽出。`step.constitution_check === true` 時のみ非空、それ以外は `[]` | workflow.yaml 側に列挙する | 設計 §5.x の出力例 (`docs/design/mspec-design.md:232-235`) が constitution ファイルからの抽出を示唆。 |
| **cli-workflow-engine: `evaluate_in_phase` の値** | `step.id === 'design'` のときのみ全エントリ `['0','1']`、それ以外 `['0']` | 全ステップ一律 `['0']` | design ステップだけが Phase 1 評価を行う実態と一致 (proposal.md の Constitution Check 表で Phase 1 列が `—` になっている)。 |
| **cli-spec-lint: spec FR と実装の整合** | 実装はカテゴリ 3 種、HTML コメント無視、フェンス無視、安定ソート、JSON エンベロープ、`--allow`、非ゼロ exit を全て満たす。Spec FR-001〜009 はそのまま正式化可 | — | `spec-linter.ts:49-100` と `spec-forbidden.ts` の直接確認による。 |
| **cli-spec-lint: `validate --strict` 統合 (FR-010)** | 既に実装済 (`packages/cli/src/commands/validate.ts:46-58`)。Spec FR-010 は仕様化のみで実装変更なし | — | `opts.strict` で `lintSotSpecs(paths.root)` を呼び、violations を `totalIssues` に加算し非ゼロ exit にしている。 |
| **cli-anchor: テンプレ/フィクスチャ除外戦略** | `packages/cli/templates/**` と `packages/cli/src/**/*.test.ts` を walker でハードコード除外 | (B) `.mspecignore` 新設 / (C) `apply-css` suffix ヒューリスティック | (B) は本チェンジの範囲外、(C) は脆い。CLI 自身のソース固有のフィクスチャは hardcoded ignore が最小コストで決定論的。 |

## Web References

- [CommonMark 0.31.2 §4.5 Fenced code blocks](https://spec.commonmark.org/0.31.2/#fenced-code-blocks) — フェンスは ` ``` ` または `~~~` 各 3 文字以上、info string は trim される。Mermaid 検出と「コード例除外」の両方の根拠。
- [Mermaid Getting Started](https://mermaid.js.org/intro/getting-started.html) — Markdown 内 Mermaid ブロックの info string は小文字 `mermaid` で例示。case-sensitive prefix-match の根拠。
- [git diff --stat](https://git-scm.com/docs/git-diff) — 1 ファイル 1 行の `name | count +++---` を出す既存 UX。`+a ~m -r ⇄n` の 1 行サマリ採用の prior art。
- [Node.js fs/promises](https://nodejs.org/api/fs.html#promises-api) — `readFile` / `readdir` を `anchor-scanner.ts` の walker と `validateArtifact` で利用。

## Codebase Findings

- `packages/cli/src/parser/anchor.ts:4-22` — `PATH_RE` / `REQS_RE` / `CHANGE_RE` 定義と `stripCommentPrefix`。5 行目で `@mspec-delta` を含む regex リテラル自体がスキャナに拾われ malformed と警告される震源。FR-015/016 の修正範囲。
- `packages/cli/src/parser/anchor.ts:42-50` — `for` ループの早期 push 部。`!pathMatch?.groups` で即 warning を吐く現状実装 → FR-017 で「直後/直前に `Requirements implemented:` が無ければ沈黙」のガードを挿入する箇所。
- `packages/cli/src/lib/anchor-scanner.ts:5-55` — walker。`DEFAULT_IGNORE` は 8 ディレクトリのみで `specs/` / `changes/**/specs/` を素通りする。FR-016 のパススキップを足す唯一の場所。
- `packages/cli/src/commands/archive.ts:163-186` — `printReport`。1 capability あたり 4 行で件数を表示する現状実装。FR-013 の 1 行サマリ追記と FR-014 の `[dry-run]` ヘッダ差し替えの場所。
- `packages/cli/src/lib/archive-merger.ts:5-15` — `MergeSummary` 型 (`added/modified/removed/renamed`)。FR-013 のサマリ計算はこの値をそのまま `+a ~m -r ⇄n` にフォーマットすればよい。
- `packages/cli/src/commands/validate.ts:46-59` — `--strict` 時の `lintSotSpecs` 呼び出し。FR-010 は既に実装済。
- `packages/cli/src/commands/validate.ts:73-106` — `validateOne` が `step.produces` ごとに `validateArtifact` を回す。FR-017 (Mermaid 必須化) は `validateArtifact` 側に分岐を足すのが影響範囲最小。
- `packages/cli/src/lib/artifact-validator.ts:17-45` — `validateArtifact` のスイッチ。`filePath.endsWith('/architecture-overview.md')` で Mermaid フェンス検出を追加する箇所。
- `packages/cli/src/commands/continue.ts:14-27` — `ContinueOutput` 型に `upstream_skipped` は既に存在。`constitution_principles` は不存在 → 新規追加が必要。
- `packages/cli/src/commands/continue.ts:55-95` — `buildContinue`。`constitution_principles` の埋め込みは `step.constitution_check` を参照しつつ `memory/constitution.md` のヘッダパースを呼ぶ形になる。
- `packages/cli/src/commands/constitution.ts:8-36` — 既存の constitution パスヘルパ。`memory/constitution.md` の `### I. <Name>` 抽出ユーティリティをここに同居させるのが筋。
- `packages/cli/src/lib/spec-linter.ts:49-100` — `lintSpecContent` 本体。HTML コメント (`blankOutRegex`) とフェンス (`blankOutFences`) を黒塗りしてから走査する戦術は cli-anchor のスキャナでも流用可能。
- `packages/cli/src/lib/spec-forbidden.ts` — 3 カテゴリ (`shell-command` / `library-name` / `impl-verb`) のルール定義。Spec FR-001 と一致。
- `specs/cli-anchor/spec.md:7,11,12,15,23,25` — SoT spec が本文中で `@mspec-delta` を解説しているため現在 6 件の warning が出る。FR-016 でカバー。
- `changes/2026-05-14-022259-claude-core-completion/specs/cli-anchor/spec.md:6,8,9,13,14,22,27` — Delta Spec 本文 7 件。FR-016 でカバー。
- `packages/cli/templates/artifacts/tasks.md:13,19` — テンプレ内の完全な 3 行アンカーブロック。change_dir `2026-05-14-093015-apply-css` が存在せず hard error を生む。テンプレ専用の除外が必要。
- `packages/cli/src/parser/anchor.test.ts:7` — テストフィクスチャ。同 change_dir を参照しているため walker から除外、もしくは fixture プレフィックスの慣習化が必要。
- `docs/design/mspec-design.md:206` — archive 手順 #4 が「`git diff --stat` 相当のレポート (LLM 不使用)」と明記。FR-013 の根拠。
- `docs/design/mspec-design.md:232-235` — `mspec continue` envelope の `constitution_principles` フィールド例。FR-016 のスキーマ根拠。
- `docs/design/mspec-design.md:644-674` — `architecture-overview.md` の Mermaid 必須宣言。FR-017 の根拠。

## Open Choices

ユーザー指示「質問せず進行」に従い、本チェンジの研究フェーズで明示的な選択を要する論点はすべて Decisions 表に解決済みとして取り込んだ。design ステップで再評価される可能性が残るのは以下:

- **OC-RESOLVED-1** (cli-archive 書式 OC1) → 採用案 (A) `cli-anchor: +2 ~1 -0 ⇄0` — Spec FR-013 シナリオが当該文字列を期待する記述で実質固定。
- **OC-RESOLVED-2** (cli-archive 並び順 OC2) → 採用案 (A) Lexicographic — 決定論性最優先。
- **OC-RESOLVED-3** (Mermaid 強制レベル OC3) → 採用案 (A) 常時 hard fail — 設計文言「必須」と一致。
- **OC-RESOLVED-4** (cli-anchor テンプレ除外 OC4) → 採用案 (A) `packages/cli/templates/**` と `packages/cli/src/**/*.test.ts` を walker ハードコード除外。design ステップでパス文字列の最終確定を行う。
- **OC-RESOLVED-5** (`evaluate_in_phase` OC5) → 採用案 (B) `step.id === 'design'` のときのみ `['0','1']`、それ以外 `['0']`。

## Constitution Check

> Step: research | Constitution Version: 1.0.0

`memory/constitution.md` は初期テンプレ状態のため、`docs/design/mspec-design.md §1.2` の 5 設計原則 (P1–P5) を実質憲法として評価する。Phase 1 列は design ステップで再評価するため `—`。

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 (P1) | ✅ | — | 本 research は `mspec continue` の `subagent_prompt` を再読込前提に従っており、新ステップ追加なし。 |
| II. 決定論的マージ (P2) | ✅ | — | cli-archive サマリは LLM 不使用・lexicographic ソートで決定論性を担保。 |
| III. 質問駆動の要件確定 (P3) | ✅ | — | 本ステップではユーザー指示で AskUserQuestion を抑制したが、Open Choices は明示的に解決根拠を文書化し追跡可能性を維持。 |
| IV. 双方向アンカー (P4) | ✅ | — | research.md 自体にアンカー不要 (`removable: true` 同等、SoT spec への直結なし)。実装段階で各 FR にアンカー必須。 |
| V. 強制ステップと拡張ステップの分離 (P5) | ✅ | — | research は `removable: true` のままで、構造変更なし。 |

### Complexity Tracking

None — 違反 0 件。本研究は既存実装の正式化と局所修正を中心とし、新たな抽象を導入しない。
