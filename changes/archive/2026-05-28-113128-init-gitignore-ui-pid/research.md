# Research: init-gitignore-ui-pid

## Decisions

| 論点 | 採用案 | 代替案 | 根拠 |
|------|--------|--------|------|
| `.mspec/.gitignore` の生成方法 | `PlannedFile` プランに追加してテンプレートファイルから生成 | `initCommand` 内でハードコード文字列を直接書き込む | 既存の `plan` 配列パターンに合わせることで `--force` フラグによる衝突制御が自動適用される |
| `--force` なし時の上書き防止 | 既存の `collisions` チェックをそのまま利用 | 別途 guard を追加 | `plan` への追加のみで衝突チェックが自動的に機能する (init.ts:241–251) |
| テンプレートファイルの配置先 | `packages/cli/templates/mspec-gitignore` | インラインで文字列定義 | `findTemplatesDir()` がすでに `templates/` を解決しており、他の設定ファイルと同パターンで管理できる |
| `.mspec/.gitignore` に含めるパターン | `ui.pid` のみ (今回のスコープ) | `ui.pid` + `cache/` + `*.log` 等を一括追加 | FR-012 は `ui.pid` のみ明示。`cache/` は既にルートの `.gitignore` に追加済み |
| 既存 `.gitignore` append 関数の再利用 | 再利用しない — `PlannedFile` として丸ごと生成 | `ensureGitignoreEntry` を再利用 | `.mspec/.gitignore` はルートの `.gitignore` とは別ファイル。`PlannedFile` で管理すれば `--force` 時の再生成シナリオも自動対応できる |

## Web References

- [gitignore — Git Documentation](https://git-scm.com/docs/gitignore): サブディレクトリ内の `.gitignore` はそのディレクトリ以下にのみ適用される。`.mspec/.gitignore` に `ui.pid` を記述すれば `.mspec/ui.pid` が自動的に除外される。追加のパスプレフィックス不要。

## Codebase Findings

### ui.pid generation

- `packages/cli/src/server/pidManager.ts:13-14` — `pidFilePath()` が `join(root, '.mspec', 'ui.pid')` を返す。これが PID ファイルの唯一の生成パス。
- `packages/cli/src/server/server-process.ts:44` — サーバー起動後に `writePid(root, { pid: process.pid, port })` を呼び出してファイルを書き込む。
- `packages/cli/src/server/pidManager.ts:30-33` — `writePid()` が `writeFile` で `{pid}:{port}\n` 形式で `.mspec/ui.pid` に書き込む。

### mspec init implementation

- `packages/cli/src/commands/init.ts:158-274` — `initCommand()` 本体。
- `packages/cli/src/commands/init.ts:186-238` — `PlannedFile[]` 配列にファイルを積み上げる段階 (config.yaml / workflow.yaml / constitution.md / .claude/commands / .claude/skills / .claude/agents)。
- `packages/cli/src/commands/init.ts:241-251` — `collisions` チェック: 既存ファイルが存在し `--force` でなければ `process.exit(1)`。
- `packages/cli/src/commands/init.ts:253-260` — `plan` の各エントリを `readFile` → transform → `writeFile` で書き込む。
- `packages/cli/src/commands/init.ts:266-267` — ルート `.gitignore` への `.mspec/cache/` 追記 (`ensureGitignoreEntry`)。

### Existing .gitignore logic (FR-004)

- `packages/cli/src/commands/init.ts:276-290` — `ensureGitignoreEntry(root, line)`: 既存の `.gitignore` を読み込み、当該行が未記載であれば末尾に追記するだけの append-only 関数。上書き・削除は行わない。
- この関数は「ルートの `.gitignore` に1行追加する」用途に特化しており、`.mspec/.gitignore` の新規生成には適していない。

### Other runtime-generated files

`.mspec/` 配下に生成されるランタイムファイルの一覧:

| ファイル | 生成元 | 説明 |
|---------|--------|------|
| `.mspec/ui.pid` | `pidManager.ts:14` | UI サーバーの PID と Port |
| `.mspec/cache/done-log.json` | `done-log.ts:17` | ステップ完了ログ |
| `.mspec/cache/skip-log.json` | `skip-log.ts:14` | スキップログ |
| `.mspec/cache/red-evidence/` | `enforce.ts:53` | TDD red フェーズの証拠ディレクトリ |
| `.mspec/cache/green-evidence/` | `enforce.ts:54` | TDD green フェーズの証拠ディレクトリ |

`cache/` 配下は既にルートの `.gitignore` に `.mspec/cache/` として追記済みのため、`.mspec/.gitignore` に追加する必要はない。`ui.pid` のみがルート `.gitignore` 未対応の runtime ファイルである。

### Template/scaffold system

- テンプレートエンジン: **なし (plain string + `String.replace()`)**
- `packages/cli/src/commands/init.ts:122-131` — `applyConfigTransforms()` が `raw.replace('__TEST_COMMAND__', ...)` と `replace('__CLAUDE_SUBAGENTS__', ...)` を使用。
- テンプレートファイルは `packages/cli/templates/` に静的ファイルとして配置。EJS / Handlebars などの外部テンプレートエンジンは使用していない。
- `.mspec/.gitignore` は変数置換が不要なため、`transform` なしの `PlannedFile` エントリとして追加するのが最もシンプル。

## Open Choices

- **OC-001**: `.mspec/.gitignore` に `ui.pid` 以外のパターンも初期状態で含めるか。FR-012 は `ui.pid` のみ明示しているが、将来追加すべきパターン (`*.log`, `*.tmp` など) があれば今回まとめて含めることも可能。

## Constitution Check (Phase 0)

### Principle I — ステップ独立性

適合。`mspec init` コマンド (`initCommand`) は単独で完結する処理であり、他ステップへの副作用はない。`.mspec/.gitignore` の生成は `plan` 配列への追加1件で完結する。

### Principle II — 決定論的マージ

適合。`PlannedFile` ベースの生成は冪等。`--force` なし = 既存ファイル保持 (collisions check)、`--force` あり = 再生成、の挙動が一意に決まる。

### Principle III — 質問駆動の要件確定

適合。Open Choices に追加パターンの確認事項を明示した。実装前にユーザー確認が必要な点を残している。

### Principle IV — 双方向アンカー

実装時に `@mspec-delta` アンカーを `init.ts` に追記することで対応。FR-012 が実装ファイルと spec を双方向に参照できる。

### Principle V — 強制ステップと拡張ステップの分離

適合。`mspec init` は既に強制ステップとして定義済み。FR-012 の追加はその強制ステップ内の処理拡張であり、新たなオプションステップを追加するものではない。

### Principle VI — Security by Default

適合。`.mspec/.gitignore` はランタイム生成ファイルを git 追跡対象外にするもの。PID ファイルがコミットされるとポート情報が記録されるリスクを排除する。

<!-- LEARNING: PlannedFile配列への追加だけで --force フラグによる衝突制御が自動適用されるパターン | source: FR-012 | confidence: high -->
