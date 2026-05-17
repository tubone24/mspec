# Tasks: spec grep/list サブコマンド

> Change: 2026-05-14-050811-spec-grep

## Phase 1: Setup

### Task 1.1: 3 コマンドのスタブファイルを作成する

**Files**:
- `packages/cli/src/commands/spec-list-requirements.ts` (新規)
- `packages/cli/src/commands/spec-grep.ts` (新規)
- `packages/cli/src/commands/spec-list-capabilities.ts` (新規)

各ファイルにアンカーヘッダとエクスポート関数のスタブを作成する。

```anchor:
@mspec-delta 2026-05-14-050811-spec-grep/specs/cli-spec-lint/spec.md
Requirements implemented: FR-011, FR-012, FR-013, FR-014
Change: spec-grep
```

**スタブの形式（各コマンドファイル共通）**:
```typescript
// @mspec-delta 2026-05-14-050811-spec-grep/specs/cli-spec-lint/spec.md
// Requirements implemented: FR-011, FR-012, FR-013, FR-014
// Change: spec-grep

export async function spec<Command>Command(...): Promise<void> {
  throw new Error('not implemented');
}
```

---

## Phase 2: Foundational

### Task 2.1: `listCapabilityNames` ヘルパーを `spec-linter.ts` に追加する

**File**: `packages/cli/src/lib/spec-linter.ts`
**FR**: FR-013

`collectSotSpecs(specsDir)` の結果からディレクトリ名を抽出する同期ヘルパーを追加する。`collectSotSpecs` が既に昇順ソート済みのため追加ソートは不要。**必ず同期関数として実装すること（`async` 禁止）**。

```typescript
import { basename, dirname } from 'node:path';

export function listCapabilityNames(specsDir: string): string[] {
  return collectSotSpecs(specsDir).map(p => basename(dirname(p)));
}
```

```anchor:
@mspec-delta 2026-05-14-050811-spec-grep/specs/cli-spec-lint/spec.md
Requirements implemented: FR-013
Change: spec-grep
```

### Task 2.2: `index.ts` に 3 コマンドを Commander.js 登録する

**File**: `packages/cli/src/index.ts`
**FR**: FR-011, FR-012, FR-013, FR-014

`spec` コマンドグループ（142 行目付近）に以下を追加する。既存の `spec lint [glob]` と名前衝突しないことを確認する。

```typescript
spec
  .command('list-requirements [glob]')
  .description('List all ### Requirement: headings grouped by capability')
  .option('--json', 'Output JSON')
  .action((glob, opts) => specListRequirementsCommand(glob, { json: opts.json }));

spec
  .command('grep <fr-id>')
  .description('Search for a FR-NNN block across SoT and Delta Specs')
  .option('--json', 'Output JSON')
  .action((frId, opts) => specGrepCommand(frId, { json: opts.json }));

spec
  .command('list-capabilities')
  .description('List capability names under specs/ (spec.md-based)')
  .option('--json', 'Output JSON')
  .action((opts) => specListCapabilitiesCommand({ json: opts.json }));
```

```anchor:
@mspec-delta 2026-05-14-050811-spec-grep/specs/cli-spec-lint/spec.md
Requirements implemented: FR-011, FR-012, FR-013, FR-014
Change: spec-grep
```

---

## Phase 3: User Story

### Task 3.1: [RED] `spec list-capabilities` の E2E テストを書く

**File**: `packages/cli/tests/e2e/spec-grep.e2e.test.ts` (新規)
**FR**: FR-013, FR-014

以下の `describe` ブロックを含む E2E テストファイルを作成する。ファイル先頭にアンカーを付与する。

```typescript
// @mspec-delta 2026-05-14-050811-spec-grep/specs/cli-spec-lint/spec.md
// Requirements implemented: FR-011, FR-012, FR-013, FR-014
// Change: spec-grep
```

**カバーする Scenario**:
- FR-013 Scenario 1: `specs/` 配下の capability が昇順アルファベット順で出力される
- FR-013 Scenario 2: `specs/` が存在しないとき exit code が非ゼロになる
- FR-013 (追加): `specs/archive/spec.md` が存在しても `archive` がリストに含まれない
- FR-014 Scenario 3: `list-capabilities --json` が `{command, results, meta}` 構造で出力される

```anchor:
@mspec-delta 2026-05-14-050811-spec-grep/specs/cli-spec-lint/spec.md
Requirements implemented: FR-013, FR-014
Change: spec-grep
```

**mspec test-red 記録**:
```sh
node packages/cli/dist/index.js test expect-red 3.1 --change 2026-05-14-050811-spec-grep
```

### Task 3.2: [GREEN] `spec-list-capabilities.ts` を実装する

**File**: `packages/cli/src/commands/spec-list-capabilities.ts`
**FR**: FR-013, FR-014

実装要件:
1. `projectPaths(cwd)` → `specsDir` を取得
2. `dirExists(specsDir)` → false なら `console.error(...)` + `process.exitCode = 1` + `return`
3. `listCapabilityNames(specsDir)` で capability 名リストを取得
4. `opts.json` なら `{command: "list-capabilities", results: [{capability}], meta: {specsDir, count}}` を stdout に出力
5. 通常モードは 1 行 1 capability で stdout に出力
6. `meta` フィールドにタイムスタンプ等の非決定的な値を含めないこと

```anchor:
@mspec-delta 2026-05-14-050811-spec-grep/specs/cli-spec-lint/spec.md
Requirements implemented: FR-013, FR-014
Change: spec-grep
```

**mspec test-green 記録**:
```sh
node packages/cli/dist/index.js test expect-green 3.2 --change 2026-05-14-050811-spec-grep
```

### Task 3.3: [RED] `spec list-requirements` の E2E テストを書く

**File**: `packages/cli/tests/e2e/spec-grep.e2e.test.ts` (既存ファイルに追記)
**FR**: FR-011, FR-014

**カバーする Scenario**:
- FR-011 Scenario 1: 全 capability の Requirement が capability ヘッダ付きグループで出力される
- FR-011 Scenario 2: glob フィルタ `"cli-spec*"` が正しく絞り込む
- FR-011 (追加): glob 指定でゼロ件一致のとき空の結果を exit 0 で返す
- FR-014 Scenario 1: `list-requirements --json` が `{command, results:[{capability, fr_id, title}], meta}` 構造で出力される

```anchor:
@mspec-delta 2026-05-14-050811-spec-grep/specs/cli-spec-lint/spec.md
Requirements implemented: FR-011, FR-014
Change: spec-grep
```

**mspec test-red 記録**:
```sh
node packages/cli/dist/index.js test expect-red 3.3 --change 2026-05-14-050811-spec-grep
```

### Task 3.4: [GREEN] `spec-list-requirements.ts` を実装する

**File**: `packages/cli/src/commands/spec-list-requirements.ts`
**FR**: FR-011, FR-014

実装要件:
1. `projectPaths(cwd)` → `specsDir` を取得
2. `collectSotSpecs(specsDir)` でファイルパスを列挙
3. glob が指定された場合は capability 名（`basename(dirname(path))`）でフィルタ（`*` ワイルドカードは `spec lint` の `globSegmentToRegExp` 相当で実装）
4. 各 `spec.md` を `parseMd` + `sectionsByDepth(root, 3)` で H3 セクションを抽出
5. 各 H3 見出しを `REQUIREMENT_RE`（`/^Requirement:\s+(FR-\d+)\s+[—-]\s+(.+)$/`）でマッチし `{capability, fr_id, title}` を収集
6. `opts.json` なら `{command: "list-requirements", results: [...], meta: {specsDir, count}}` を出力
7. 通常モードは capability ヘッダ（`## capability`）付きグループ形式で出力
8. `meta` に非決定的な値を含めないこと

```anchor:
@mspec-delta 2026-05-14-050811-spec-grep/specs/cli-spec-lint/spec.md
Requirements implemented: FR-011, FR-014
Change: spec-grep
```

**mspec test-green 記録**:
```sh
node packages/cli/dist/index.js test expect-green 3.4 --change 2026-05-14-050811-spec-grep
```

### Task 3.5: [RED] `spec grep` の E2E テストを書く

**File**: `packages/cli/tests/e2e/spec-grep.e2e.test.ts` (既存ファイルに追記)
**FR**: FR-012, FR-014

**カバーする Scenario**:
- FR-012 Scenario 1: SoT spec の FR-NNN ブロックが正確に返される
- FR-012 Scenario 2: Delta Spec 内の FR-NNN も検索対象に含まれる（`listChanges` が現在の change 自身を含む場合の確認）
- FR-012 Scenario 3: `INVALID-ID`（不正フォーマット）は exit 1 でエラー
- FR-012 Scenario 4: `FR-999`（有効フォーマット・未発見）は exit 0 で `results: []`
- FR-012 (追加): `fr-001`（小文字）は `i` フラグにより有効フォーマットとして受理される
- FR-012 (追加): `FR-12345`（5 桁）は無効フォーマットで exit 1
- FR-014 Scenario 2: `spec grep FR-001 --json` が `{command, results:[{fr_id, file, block}], meta}` 構造で出力される

```anchor:
@mspec-delta 2026-05-14-050811-spec-grep/specs/cli-spec-lint/spec.md
Requirements implemented: FR-012, FR-014
Change: spec-grep
```

**mspec test-red 記録**:
```sh
node packages/cli/dist/index.js test expect-red 3.5 --change 2026-05-14-050811-spec-grep
```

### Task 3.6: [GREEN] `spec-grep.ts` を実装する

**File**: `packages/cli/src/commands/spec-grep.ts`
**FR**: FR-012, FR-014

実装要件:
1. 入力バリデーション: `/^FR-\d{1,4}$/i` に一致しない場合は `console.error(...)` + `process.exitCode = 1` + `return`（注: `i` フラグにより小文字入力を受容）
2. `projectPaths(cwd)` → `specsDir`, `changesDir` を取得
3. **SoT 検索**: `collectSotSpecs(specsDir)` の各 `spec.md` を `parseMd` + `sectionsByDepth(root, 3)` で走査。見出しテキストに FR-ID が含まれるセクションを `sliceSource` で切り出す
4. **Delta Spec 検索**: `listChanges(paths)` の各 change で `specs/*/spec.md` を glob し、同様に H3 走査
5. ヒット順は「ファイルパス昇順 → ブロック開始行昇順」で決定論的に固定
6. `opts.json` なら `{command: "spec-grep", results: [{fr_id, file, block}], meta: {query, count}}` を出力
7. 未発見時は空結果 `results: []` で exit 0
8. `meta` に非決定的な値を含めないこと

```anchor:
@mspec-delta 2026-05-14-050811-spec-grep/specs/cli-spec-lint/spec.md
Requirements implemented: FR-012, FR-014
Change: spec-grep
```

**mspec test-green 記録**:
```sh
node packages/cli/dist/index.js test expect-green 3.6 --change 2026-05-14-050811-spec-grep
```

---

## Phase 4: Polish

### Task 4.1: アンカーチェックを実行して双方向追跡を確認する

**FR**: FR-011, FR-012, FR-013, FR-014

```sh
node packages/cli/dist/index.js anchor check --change 2026-05-14-050811-spec-grep
```

エラーが 0 件であることを確認する。エラーがある場合は該当ファイルのアンカーを修正する。

### Task 4.2: ビルドと全テストを実行して回帰がないことを確認する

```sh
cd packages/cli && npm run build && npm test
```

全テストが PASS すること（既存テスト含む）。

### Task 4.3: `mspec validate --strict` で SoT spec への規約準拠を確認する

```sh
node packages/cli/dist/index.js validate --change 2026-05-14-050811-spec-grep --strict
```

spec lint 違反が 0 件であること（新コマンドのソースファイル自身は走査対象外だが、spec.md を変更した場合に確認）。

---

## Constitution Check

> Step: tasks | Constitution Version: 1.0.0

| Principle | Phase 0 | Notes |
|-----------|---------|-------|
| I. ステップ独立性 | ✅ | tasks.md は設計ドキュメント。実装ファイルへの副作用なし。 |
| II. 決定論的マージ | ✅ | tasks.md は archive の直接マージ対象ではない。実装完了後に Delta Spec のみが archive される。 |
| III. 質問駆動の要件確定 | ✅ | 全 Open Choices は research/design で確定済み。tasks に新たな未確定事項はない。 |
| IV. 双方向アンカー | ✅ | 全実装タスク（Task 1.1〜3.6）および E2E テストタスク（Task 3.1・3.3・3.5）にアンカーブロックを付与。Task 4.1 でアンカーチェックを実行する。 |
| V. 強制ステップと拡張ステップの分離 | ✅ | `workflow.yaml` を変更しない。tasks.md は `removable: false` ステップの成果物。 |

### Complexity Tracking

None — 違反 0 件。6 フェーズ計 11 タスク。新規ファイル 4 件（コマンド 3 + E2E テスト 1）、修正ファイル 2 件（spec-linter.ts + index.ts）で構成。
