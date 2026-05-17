# Research: spec サブコマンド grep/list 系 CLI 追加

## Decisions

| 論点 | 採用案 | 代替案 | 根拠 |
|------|--------|--------|------|
| `grep` の検索スコープ | SoT (`specs/*/spec.md`) + Delta Spec (`changes/*/specs/*/spec.md`) 両方を対象 | SoT のみ | FR-012 でスコープを確定済み。Scenario 2 が Delta Spec 内 FR を明示的に要求している |
| `list-requirements` の出力フォーマット | capability ヘッダ付きのグループ形式 | フラットテーブル | FR-011 Scenario 1 で "各 capability のヘッダを付けたグループ形式" と明示されている |
| JSON エンベロープ設計 | FR-014 の新規スキーマ `{command, results, meta}` を採用 | `spec lint --json` の `{violations, summary}` 形式を踏襲 | `spec lint` の形式は lint 専用（`violations`/`summary`）で汎用外。FR-014 が新規の統一規格を定義する意図的な divergence |
| SoT spec の Requirement 抽出方法 | `parseMd` + `sectionsByDepth(root, 3)` + `REQUIREMENT_RE` で H3 を直接走査 | `parseDeltaSpec` を流用 | SoT spec は `## Requirements` 配下にフラットに H3 が並ぶ構造。`parseDeltaSpec` は `## ADDED Requirements` 等のセクション分類を期待しており SoT spec に適用不可 |
| FR-ID バリデーション正規表現 | `lib/fr-numbering.ts` 既存の `FR_HEADING_RE` を流用（`/^###\s+Requirement:\s+(FR-(\d+))\b/gm`） | 新規で正規表現を定義 | ファイル内の見出しパース・ID 抽出・数値取得が一体化しており再利用コストがゼロ |
| capability 列挙ロジック | `spec.md` が存在する capability のみ対象（`collectSotSpecs` の既存挙動を踏襲） | ディレクトリ存在ベースで全列挙 | ユーザー確認済み。まだ `spec.md` を持たない空ディレクトリを除外することで一覧の信頼性を保つ |
| `list-requirements` の `results` 要素フィールド | `{capability, fr_id, title}` の最小限セット | `body` フィールドを追加 | FR-014 の明示的スキーマに従う。本文全体の取得は `grep` に委ねる設計が Non-Goals（フリーワード検索除外）と整合する |
| `grep` ヒットなし時の終了コード | 0（成功） | 1（エラー） | FR-012 に "空の結果と終了ステータス成功を返す" と明記済み |

## Web References

- [Commander.js — Subcommands](https://github.com/tj/commander.js#subcommands) — `program.command('spec')` で親を作り、戻り値の `Command` に `.command()` を連鎖させるパターンの公式ドキュメント。`index.ts` が同パターンを既に採用している。
- [Commander.js — Options](https://github.com/tj/commander.js#options) — `--json` のような boolean オプションは `.option('--json', 'description')` で定義し、action コールバックの `opts.json` として受け取る。`spec lint` の実装が同じ方式。
- [remark-parse](https://github.com/remarkjs/remark/tree/main/packages/remark-parse) — `parseMd` 内部で使用中の Unified/remark パーサ。H3 位置情報 (`position.start.line`) が `sliceSource` によるブロック抽出の根拠になる。

## Codebase Findings

- `packages/cli/src/index.ts:142-155` — `spec` サブコマンドグループの宣言箇所。現在は `spec lint [glob]` のみ登録。ここに `list-requirements`・`grep`・`list-capabilities` を `.command()` で追加する。
- `packages/cli/src/commands/spec-lint.ts:43-48` — `--json` 出力の実装例。`{violations, summary:{files,violations}}` という lint 専用エンベロープ。FR-014 の `{command, results, meta}` とは意図的に異なる新規規格。
- `packages/cli/src/lib/fr-numbering.ts:4` — `FR_HEADING_RE = /^###\s+Requirement:\s+(FR-(\d+))\b/gm` — `grep <fr-id>` の入力バリデーション（`/^FR-\d{1,4}$/i`）とファイル内 H3 走査の両方で再利用可能。
- `packages/cli/src/lib/fr-numbering.ts:23` — `scanFrIdsFromContents(raw)` — ファイル内容から FR-ID を全数取得するユーティリティ。`grep` 実装でヒット確認に流用可能。
- `packages/cli/src/lib/spec-linter.ts:132-159` — `collectSotSpecs(specsDir)` — `specs/<cap>/spec.md` を昇順収集・`archive` 除外済み。`list-requirements` と `list-capabilities` の capability 列挙ベースに適用できる。ただし現実装はファイルパスを返すのみ。`list-capabilities` はディレクトリ名が必要なため、capability 名だけ返す `listCapabilityNames(specsDir)` を新設する。
- `packages/cli/src/lib/spec-linter.ts:133-136` — `collectSotSpecs` は `readdirSync` の catch で `[]` を返す（エラーにしない）。FR-013 は `specs/` が存在しない場合にエラーを要求するため、`list-capabilities` コマンド側で `dirExists(specsDir)` を先にチェックして非ゼロ終了する実装が必要。
- `packages/cli/src/lib/change-discovery.ts:26-53` — `listChanges(paths, { includeArchived: false })` — アクティブ changes の列挙。`grep` が Delta Spec を検索する際にこれで change ディレクトリを列挙し、各 change の `specs/*/spec.md` を走査する。
- `packages/cli/src/parser/delta-spec.ts:12` — `REQUIREMENT_RE = /^Requirement:\s+(FR-\d+)\s+[—-]\s+(.+)$/` — H3 見出しのテキスト部分から FR-ID とタイトルを抽出する正規表現。SoT spec の H3 でも同じ見出し形式が使われているため再利用可能。
- `packages/cli/src/parser/markdown.ts:62-65` — `sliceSource(source, startLine, endLine)` — 行番号でソースから任意ブロックを切り出すユーティリティ。`grep` コマンドがマッチした FR ブロック全体を返す際に使用する。
- `packages/cli/src/parser/markdown.ts:27-57` — `sectionsByDepth(root, targetDepth)` — AST から指定深さの見出しセクションを抽出する関数。`sectionsByDepth(root, 3)` で `### Requirement:` ブロックを全収集できる。
- `packages/cli/src/workflow/paths.ts:17-29` — `projectPaths(cwd)` — `specsDir` (`<root>/specs`) と `changesDir` (`<root>/changes`) の正規パスを返す。3 コマンドすべてが `projectPaths(process.cwd())` を起点にする。

## Open Choices

なし — 全論点が Decisions または FR に記載済み。

## Constitution Check

> Step: research | Constitution Version: 1.0.0

| Principle | Phase 0 | Notes |
|-----------|---------|-------|
| I. ステップ独立性 | ✅ | research は proposal.md と Delta Spec を読むのみ。実装ファイルへの書き込みはしない。 |
| II. 決定論的マージ | ✅ | research.md は LLM の調査結果をまとめるドキュメント。archive 時のマージ対象ではない。 |
| III. 質問駆動の要件確定 | ✅ | Open Choice（`list-capabilities` の列挙スコープ）をユーザー確認し、`spec.md` 存在ベースに確定した。 |
| IV. 双方向アンカー | ✅ | research フェーズは実装ファイルを生成しないため、アンカー付与は implement ステップで行う。 |
| V. 強制ステップと拡張ステップの分離 | ✅ | research は `removable: true`・`skippable: true` の拡張ステップ。ワークフロー構造は変更しない。 |

### Complexity Tracking

None — 違反 0 件。既存ユーティリティの再利用が中心で、新規抽象化は `listCapabilityNames` 関数 1 つのみ。
