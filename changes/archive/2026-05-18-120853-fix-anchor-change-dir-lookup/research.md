# Research: fix-anchor-change-dir-lookup

## Decisions

| 論点 | 採用案 | 代替案 | 根拠 |
|------|--------|--------|------|
| スキャン除外の粒度 | Option B: `anchor.ts` パーサーに `blankOutStringLiterals` を追加してJS/TS文字列リテラルをマスクする | Option A: `anchor-scanner.ts` でテストファイルをパスレベルで除外する | 13個のテストファイルがヘッダーに **実在する** アンカーブロックを持つ（`archive.test.ts`等）。Option Aを採用するとそれらが全て孤立し、SoT spec の FR-004/FR-013/FR-014（テストファイルもスキャン対象と明記）に違反する |
| FR-018 のデルタスペック要件の解釈 | FR-018 の意図（テストデータの偽陽性を除去）を保ちつつ、実装方式を「テストファイル除外」→「文字列リテラルのマスク」に修正する | FR-018 をそのまま実装し、既存テストファイルのアンカーを別ファイルへ移植する | 移植コストが高く、破壊的変更を生む。文字列リテラルマスクは根本原因に対処するため副作用が最小 |
| `blankOutStringLiterals` の実装方式 | キャラクター単位の状態マシン（既存 `blankOutFences` のスタイルと統一）。`in_string` / `quote_char` / `escaped` をステートとして追跡し、改行を保持しつつ文字列内容を空白で置換 | 正規表現ベースのマスク | バックティック内の `${...}` ネストおよびエスケープシーケンスを正規表現で正確に扱うのは非常に複雑。状態マシンの方が保守性が高く、`blankOutFences` のコードパターンとも一致する |
| スキャン最大行数との組み合わせ | `blankOutStringLiterals` は全文に適用し、その後 `SCAN_LINES_MAX = 30` の制限は `parseAnchors` 側で維持する | 30行分だけマスクする | `blankOutFences` / `blankOutHtmlComments` も全文に適用しており、一貫性を保てる |

## Web References

- [MDN: Template literals (Template strings)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) — バックティック文字列、`${...}` 補間、エスケープ（`\`` `\$`）の仕様。マスカーが扱うべきケースを網羅している
- [Rebuilding Babel: The Tokenizer – Nan.fyi](https://www.nan.fyi/tokenizer) — 文字単位のトークナイザー実装例。文字列リテラル状態マシンの構造参考
- [LIPS Scheme FSM Lexer](https://lips.js.org/blog/lexer) — 有限状態機械ベースのレクサーにおける文字列リテラル処理パターン（ステート遷移＋エスケープ追跡）の実例

## Codebase Findings

- `packages/cli/src/lib/anchor-scanner.ts:16` — `TEXT_EXT_RE` で `.ts/.tsx/.js/.jsx/.mjs/.cjs` 等を対象にしている。テストファイルは現在除外されていない
- `packages/cli/src/lib/anchor-scanner.ts:25-27` — `isExcludedPath` は SoT/Delta Spec パスとテンプレートディレクトリのみを除外。テストファイルを除外するロジックは一切ない
- `packages/cli/src/parser/anchor.ts:39` — `blankOutHtmlComments(blankOutFences(contents))` の2段マスクが現状。文字列リテラルはマスクされない
- `packages/cli/src/lib/text-mask.ts` — 既存の `blankOutFences`（行単位のステートマシン）と `blankOutHtmlComments`（正規表現）。「改行を保持しつつ同一長さの空白で置換」という契約は `blankOutStringLiterals` も引き継ぐ必要がある
- `packages/cli/src/parser/anchor.test.ts:7,31,44,54,66,76,87,91` — `@mspec-delta` を含む行がテンプレートリテラル（ `` ` `` ）の内部に埋め込まれている。これが偽陽性の根本原因
- 実在するアンカーを持つテストファイル（行コメント形式のためOption B実装後も影響なし）:
  - `packages/cli/src/commands/archive.test.ts` — `// @mspec-delta ...` 行コメント
  - `packages/cli/src/lib/archive-summary.test.ts` — 同上
  - `packages/cli/src/lib/constitution-principles.test.ts` — 同上
  - `packages/cli/src/commands/continue.test.ts` — 同上（2つ）
  - その他10ファイル（全て行コメント形式）
- `specs/cli-anchor/spec.md:45` — FR-004: "each candidate source **or test file**"
- `specs/cli-anchor/spec.md:129` — FR-013: "every anchor block discovered in the project's source **and test files**"
- `specs/cli-anchor/spec.md:142` — FR-014: "single source **or test file** to contain more than one 3-line `@mspec-delta` anchor block"

## Open Choices

なし（全て解決済み）

## Constitution Check

| Principle | Phase 0 | Phase 1 |
|-----------|---------|---------|
| I ステップ独立性 | OK — text-mask.ts への追加は単独で完結し、他ステップに影響しない | — |
| II 決定論的マージ | OK — 同一入力に対して常に同じマスク結果を返す状態マシン | — |
| III 質問駆動の要件確定 | OK — FR-018 の実装方針をユーザーと合意済み | — |
| IV 双方向アンカー | OK — 実装後は `anchor.test.ts` に FR-018 アンカーを付与する | — |
| V 強制ステップと拡張ステップの分離 | OK — bugfixモードの `force: [research]` に従い research を実施 | — |
