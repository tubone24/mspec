---
doc_type: Reference
---

<!-- See also: ./design-rationale.md for採用理由・代替案 -->

# Design: fix-upgrade-package-json-path

## Summary

`packages/cli/src/commands/upgrade.ts` の `getCurrentVersion()` 関数で使用している
`createRequire` + 相対パス `../../package.json` を、`fileURLToPath(import.meta.url)` +
`readFileSync` + `join('../package.json')` パターンに置き換える。
これによりグローバルインストール環境での `Cannot find module` エラーを解消する。

## Technical Context

| 項目 | 現在値（バグあり） | 変更後 |
|------|-------------------|--------|
| `upgrade.ts` import | `import { createRequire } from 'node:module'` | 削除 |
| `upgrade.ts` import | —（なし） | `import { readFileSync } from 'node:fs'` |
| `upgrade.ts` import | —（なし） | `import { fileURLToPath } from 'node:url'` |
| `upgrade.ts` import | —（なし） | `import { dirname, join } from 'node:path'` |
| `getCurrentVersion()` の `package.json` 参照 | `createRequire(import.meta.url)('../../package.json')` | `JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../package.json'), 'utf8'))` |

変更対象は `packages/cli/src/commands/upgrade.ts` のみ。ビルド後の `dist/index.js` は `tsup build` で再生成する。

## Project Structure

```
packages/cli/
├── src/
│   └── commands/
│       └── upgrade.ts        ← getCurrentVersion() を修正 (lines 29-33 + imports)
├── dist/
│   └── index.js              ← tsup build で再生成
└── package.json              ← 参照先（変更なし）
```

## Decisions

### D-001: `getCurrentVersion()` の `package.json` 参照を `fileURLToPath` パターンに変更

**変更前:**
```typescript
import { createRequire } from 'node:module';

export function getCurrentVersion(): string {
  const require = createRequire(import.meta.url);
  const pkg = require('../../package.json') as { version: string };
  return pkg.version;
}
```

**変更後:**
```typescript
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export function getCurrentVersion(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  const pkg = JSON.parse(
    readFileSync(join(here, '../package.json'), 'utf8')
  ) as { version: string };
  return pkg.version;
}
```

**受け入れ基準（FR-001 との対応）:**
- GIVEN `@mspec/cli` がグローバルインストールされている（`/opt/homebrew/lib/node_modules/@mspec/cli/`）
- WHEN ユーザーが任意のディレクトリで `mspec upgrade` を実行する
- THEN `getCurrentVersion()` は `__dirname` 相当の絶対パスで `package.json` を解決し、エラーなくバージョン文字列を返す

**受け入れ基準（FR-002 との対応）:**
- GIVEN `@mspec/cli` がグローバルインストールされている
- WHEN `mspec upgrade` を実行する
- THEN プロセスは exit code 0 で終了し、標準エラー出力に `Cannot find module` が含まれない

### D-002: `createRequire` import の削除

`import { createRequire } from 'node:module'` は `D-001` の変更後に不要となるため削除する。
他の用途はなく、削除しても他コマンドへの影響はない。

### D-003: `dist/index.js` の再ビルド

ソース修正後に `tsup build`（`npm run build` 相当）を実行して `dist/index.js` を再生成する。
ビルドスクリプトは既存の `tsup.config.ts` をそのまま使用する（`splitting: false`, `format: ['esm']`）。

## Constitution Check

| Principle | Phase 0 | Phase 1 |
|-----------|---------|---------|
| I. ステップ独立性 | ✅ design.md のみ生成、実装なし | ✅ 他ステップの成果物に依存せず独立 |
| II. 決定論的マージ | ✅ 新規ファイルのみ、競合なし | ✅ 変更対象ファイルが `upgrade.ts` 1 ファイルに一意に特定されている |
| III. 質問駆動の要件確定 | ✅ research 段階で Open Choices 解消済み | ✅ 追加の判断事項なし |
| IV. 双方向アンカー | ✅ FR-001/FR-002 と D-001 が対応付け済み | ✅ Scenario が受け入れ基準に引き継がれている |
| V. 強制ステップと拡張ステップの分離 | ✅ 強制ステップのみ実行 | ✅ 拡張ステップへの依存なし |

### Complexity Tracking

None

## Self-Review

### Summary

全アーティファクト（proposal.md / specs/upgrade-command/spec.md / research.md / design.md / design-rationale.md / architecture-overview.md / checklist.md）は内部一貫性があり、スコープが明確に保たれている。Delta Spec・設計決定・受け入れ基準・アーキテクチャ図・Constitution Check テーブルは相互に整合している。checklist が挙げた capability 分割の HIGH リスクは設計上の判断事項として記録済み。

### Findings

| # | Artifact | Severity | Finding | Resolved? |
|---|----------|----------|---------|-----------|
| 1 | `specs/upgrade-command/spec.md` FR-001 | info | FR-001 の要件本文で「`__dirname` を基点とした」と記述しているが、ESM では `__dirname` は存在しない。正確には「`import.meta.url` を基点とした絶対パス」。ただし概念的説明として許容範囲内。 | yes (設計文書の説明コメントで補足済み) |
| 2 | `checklist.md` SoT Regression | warn | `specs/upgrade-command/`（空テンプレート）と `specs/cli-upgrade/`（FR-001〜FR-004 既存）が同一コマンドをカバーする可能性。archive 後に 2 SoT が重複する構造になるリスクがある。今回は `upgrade-command` を「パス解決の実装要件」キャパビリティとして意図的に分離しているが、将来的に統合を検討すること。 | yes (checklist に HIGH リスクとして明記済み) |
| 3 | `quickstart.md` | info | bugfix モードのためスキップされており、ファイルが存在しない。self-review の `required_artifacts` に列挙されているが、動作上問題なし。 | yes (bugfix モード仕様) |
| 4 | `architecture-overview.md` Path Resolution Diagram | info | `../../` の解決先として `/opt/homebrew/lib/package.json` と記述しているが、グラフの方向が left-to-right で修正前後が同一サブグラフに収まっておらず若干読みにくい。機能的問題はなし。 | yes (許容範囲内) |

### Sign-off

**LGTM** — 全 findings は info/warn レベルで解消済み。スコープ・整合性・Constitution Check いずれも問題なし。tasks ステップに進んで実装タスクを定義できる状態。
