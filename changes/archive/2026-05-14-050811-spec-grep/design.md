# Design: spec サブコマンド grep/list 系 CLI 追加

## Summary

`mspec spec` コマンドグループに 3 つの読み取り専用サブコマンド（`list-requirements`・`grep`・`list-capabilities`）と共通の `--json` 出力モードを追加する。既存の Commander.js サブコマンドパターンおよびパーサユーティリティ（`parseMd`・`sectionsByDepth`・`sliceSource`・`FR_HEADING_RE`・`collectSotSpecs`・`listChanges`）をそのまま再利用することで、実装コストを最小化する。

## Technical Context

| 再利用コンポーネント | 場所 | 用途 |
|---|---|---|
| `parseMd` / `sectionsByDepth` / `sliceSource` | `parser/markdown.ts` | H3 見出しブロックの AST 抽出 + 行番号ベースのブロック切り出し |
| `FR_HEADING_RE` / `scanFrIdsFromContents` | `lib/fr-numbering.ts` | FR-NNN 形式の見出し検索・バリデーション |
| `REQUIREMENT_RE` | `parser/delta-spec.ts` | H3 見出しテキストから FR-ID とタイトルを抽出 |
| `collectSotSpecs(specsDir)` | `lib/spec-linter.ts` | SoT spec ファイルパス列挙（`spec.md` 存在ベース・昇順） |
| `listChanges(paths)` | `lib/change-discovery.ts` | アクティブ change ディレクトリの列挙（`grep` の Delta Spec 検索用） |
| `projectPaths(cwd)` | `workflow/paths.ts` | `specsDir` / `changesDir` の正規パスを取得 |
| `dirExists(p)` | `lib/change-discovery.ts` | `specs/` 存在確認（FR-013 エラー判定） |
| Commander.js `.command()` + `.option('--json', ...)` | `index.ts:142` — `spec` グループ | 既存 `spec lint` と同一登録パターン |

## Project Structure

| ファイル | 操作 | 変更内容 |
|---|---|---|
| `src/commands/spec-list-requirements.ts` | 新規作成 | FR-011・FR-014 実装 |
| `src/commands/spec-grep.ts` | 新規作成 | FR-012・FR-014 実装 |
| `src/commands/spec-list-capabilities.ts` | 新規作成 | FR-013・FR-014 実装 |
| `src/lib/spec-linter.ts` | 修正 | `listCapabilityNames(specsDir)` を追加エクスポート |
| `src/index.ts` | 修正 | `spec` グループに 3 コマンドを `.command()` 登録 |
| `tests/e2e/spec-grep.e2e.test.ts` | 新規作成 | FR-011〜FR-014 の E2E テスト（TDD red→green） |

### `listCapabilityNames` ヘルパー（`lib/spec-linter.ts` 追記）

```typescript
// 追加エクスポート: collectSotSpecs の paths からディレクトリ名を抽出して返す
export function listCapabilityNames(specsDir: string): string[] {
  return collectSotSpecs(specsDir).map(p => basename(dirname(p)));
}
```

`collectSotSpecs` がすでに昇順ソートした `spec.md` パスを返すため、追加ソートは不要。

### コマンドシグネチャ

```typescript
// spec-list-requirements.ts
export interface SpecListRequirementsOptions { json?: boolean; cwd?: string; }
export async function specListRequirementsCommand(glob: string | undefined, opts: SpecListRequirementsOptions): Promise<void>

// spec-grep.ts
export interface SpecGrepOptions { json?: boolean; cwd?: string; }
export async function specGrepCommand(frId: string, opts: SpecGrepOptions): Promise<void>

// spec-list-capabilities.ts
export interface SpecListCapabilitiesOptions { json?: boolean; cwd?: string; }
export async function specListCapabilitiesCommand(opts: SpecListCapabilitiesOptions): Promise<void>
```

### JSON エンベロープ（FR-014）

#### `list-requirements --json`
```json
{
  "command": "list-requirements",
  "results": [
    { "capability": "cli-spec-lint", "fr_id": "FR-001", "title": "3 カテゴリ分類の禁止語彙リンタ" }
  ],
  "meta": { "specsDir": "specs/", "count": 10 }
}
```

#### `spec grep FR-NNN --json`
```json
{
  "command": "spec-grep",
  "results": [
    {
      "fr_id": "FR-011",
      "file": "changes/2026-05-14-050811-spec-grep/specs/cli-spec-lint/spec.md",
      "block": "### Requirement: FR-011 — `mspec spec list-requirements` コマンド\n..."
    }
  ],
  "meta": { "query": "FR-011", "count": 1 }
}
```

#### `list-capabilities --json`
```json
{
  "command": "list-capabilities",
  "results": [
    { "capability": "cli-delta" },
    { "capability": "cli-spec-lint" }
  ],
  "meta": { "specsDir": "specs/", "count": 2 }
}
```

### アンカーパターン（E2E テスト先頭行）

```typescript
// @mspec-delta 2026-05-14-050811-spec-grep/specs/cli-spec-lint/spec.md
// Requirements implemented: FR-011, FR-012, FR-013, FR-014
// Change: spec-grep
```

## Decisions

| 論点 | 採用案 | 根拠 |
|------|--------|------|
| コマンドファイル分割 | 1 コマンド 1 ファイル | `spec-lint.ts` と同じ粒度。テスト/ビルドの境界が明確 |
| `listCapabilityNames` の置き場所 | `lib/spec-linter.ts` に追加エクスポート | `collectSotSpecs` と同ファイルで自然にまとまる。新規ファイル不要 |
| `grep` H3 ブロック抽出方法 | `sectionsByDepth(root, 3)` + `sliceSource` | 見出し正規表現なしで AST から正確にブロック境界を取得できる |
| `grep` FR-ID バリデーション | `/^FR-\d{1,4}$/i` をコマンド側でチェック、エラーなら exit 1 | FR_HEADING_RE はファイル走査用。入力バリデーションは事前に明示 |
| `list-requirements` glob フィルタ実装 | capability 名に対して `micromatch` 相当の単純 `*` ワイルドカード | `spec lint` の `resolveFiles` と同じアプローチ。`**` 不要 |

## Constitution Check

> Step: design | Constitution Version: 1.0.0

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | ✅ | 3 コマンドは `specs/` と `changes/` を読み取るのみ。既存ファイルを変更しない実行時動作。実装ファイルの追加は `cli-spec-lint` 以外の capability に影響しない。 |
| II. 決定論的マージ | ✅ | ✅ | archive 時のマージ対象は Delta Spec (`cli-spec-lint/spec.md`) FR-011〜FR-014 のみ。コマンド実装ファイルは archive 非対象。マージは LLM 非介在の機械的テキスト追記。 |
| III. 質問駆動の要件確定 | ✅ | ✅ | research で全 Open Choices（`list-capabilities` のスコープ）を確定済み。design で新たな未確定事項は発生していない。 |
| IV. 双方向アンカー | ✅ | ✅ | implement ステップで E2E テストファイルと実装ファイルの先頭に `@mspec-delta 2026-05-14-050811-spec-grep/specs/cli-spec-lint/spec.md` + `FR-011, FR-012, FR-013, FR-014` アンカーを付与する。 |
| V. 強制ステップと拡張ステップの分離 | ✅ | ✅ | `workflow.yaml` を変更しない。`removable: false` ステップ（new・proposal・delta・tasks・implement・archive）は一切変更しない。 |

### Complexity Tracking

None — 違反 0 件。既存ユーティリティの組み合わせで全 FR を実装可能であり、新規抽象化は `listCapabilityNames` のワンライナーのみ。

## Self-Review

> Reviewer: mspec-self-reviewer | Overall: PASS WITH NOTES（全 BLOCKER 修正済み）

### Findings と対応

| 深刻度 | 対象 | 指摘内容 | 対応 |
|--------|------|----------|------|
| BLOCKER (修正済み) | Delta Spec FR-011 | "最初の要件節を含む MUST" が design.md の `{capability, fr_id, title}` スキーマと矛盾 | Delta Spec の MUST 節から「最初の要件節」を削除し、research の決定（最小限セット）と一致させた |
| WARNING (修正済み) | Delta Spec FR-012 | "有効 ID・未発見 → exit 0" の MUST に対応する Scenario が欠落 | 「有効な形式だが存在しない FR-ID は空の結果と exit 0 を返す」Scenario を追加 |
| WARNING (修正済み) | quickstart.md Verify | `console.assert` は失敗時に exit 1 しない。INVALID-ID と存在しない FR-ID の区別が不明確 | `process.exit(1)` を使う検証スクリプトに修正。4a（不正フォーマット→exit 1）と 4b（有効・未発見→exit 0）を分離 |
| NOTE (修正済み) | architecture-overview.md | sequence diagram の `resolveProduces` 呼び出しに `await` が欠落 | `await resolveProduces` と明記 |
| NOTE | design.md `listCapabilityNames` | 同期関数であることを実装時に維持すること（`collectSotSpecs` が同期） | tasks.md で「async にしない」を実装注意事項として明記する |

### Constitution 再確認（レビュアー評価）

| Principle | Phase 0 | Phase 1 | 評価 |
|-----------|---------|---------|------|
| I. ステップ独立性 | ✅ | ✅ | AGREE |
| II. 決定論的マージ | ✅ | ✅ | AGREE |
| III. 質問駆動の要件確定 | ✅ | ✅ | AGREE |
| IV. 双方向アンカー | ✅ | ✅ | AGREE |
| V. 強制ステップと拡張ステップの分離 | ✅ | ✅ | AGREE |
