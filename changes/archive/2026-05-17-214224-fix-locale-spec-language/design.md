---
doc_type: Explanation
---

# Design: fix-locale-spec-language

## Summary

`locale: ja` 設定時に生成される Requirements が英語 EARS 形式になる問題を、3つの独立した変更で修正する。（1）`mspec status/continue --json` にアクティブロケールフィールドを追加してスキルが参照できるようにする、（2）全9種の成果物テンプレートに `.ja.md` と `.en.md` バリアントを追加してレガシー `.md` を削除する、（3）`mspec-delta/SKILL.md` の EARS パターン例示を locale 値に応じて分岐させる。

## Technical Context

- `resolveTemplate(artifact, locale, dir)` は `<artifact>.<locale>.md` → `<artifact>.en.md` → `<artifact>.md` の順で解決する（`template-resolver.ts`）。メカニズムは正常動作しており、テンプレートファイルが存在しないことが唯一の原因
- `DEFAULT_LOCALE = 'ja'` が `locale-resolver.ts:7` で定義済み
- `status.ts` と `continue.ts` は `computeStatus` に委譲しており、config を一切参照しない。locale を公開するには command 層でのマージが最小侵襲な手段
- LLM は SKILL.md の明示的なパターン例示をテンプレートの内容より優先する。テンプレートが正しくても SKILL.md が英語例示なら LLM は英語で書いてしまう
- `loadConfig` は `resolveLocale + scanSupportedLocales` を内部で呼び、`resolvedLocale.locale` を返す。1 回の呼び出しで locale 取得が完結する

## Project Structure

変更対象ファイル一覧：

| ファイル | 操作 | 内容 |
|---------|------|------|
| `packages/cli/src/commands/status.ts` | 修正 | `loadConfig` 呼び出し追加、JSON 出力に `locale` フィールドをマージ |
| `packages/cli/src/commands/continue.ts` | 修正 | `ContinueOutput.locale` フィールド追加、`loadConfig` 呼び出し追加 |
| `packages/cli/src/types/status.ts` | 修正 | `StatusSchema` に `locale: z.string()` を追加（常に DEFAULT_LOCALE にフォールバックするため必須フィールド）|
| `packages/cli/templates/artifacts/readme.ja.md` | 新規 | 現行 `readme.md` の日本語コメント保持 |
| `packages/cli/templates/artifacts/readme.en.md` | 新規 | 英語コメントに書き直し |
| `packages/cli/templates/artifacts/glossary.ja.md` | 新規 | 現行 `glossary.md` の日本語コメント保持 |
| `packages/cli/templates/artifacts/glossary.en.md` | 新規 | 英語コメントに書き直し |
| `packages/cli/templates/artifacts/proposal.ja.md` | 新規 | 日本語版 |
| `packages/cli/templates/artifacts/proposal.en.md` | 新規 | 英語版 |
| `packages/cli/templates/artifacts/research.ja.md` | 新規 | 日本語版 |
| `packages/cli/templates/artifacts/research.en.md` | 新規 | 英語版 |
| `packages/cli/templates/artifacts/design.ja.md` | 新規 | 日本語版 |
| `packages/cli/templates/artifacts/design.en.md` | 新規 | 英語版 |
| `packages/cli/templates/artifacts/architecture-overview.ja.md` | 新規 | 日本語版 |
| `packages/cli/templates/artifacts/architecture-overview.en.md` | 新規 | 英語版 |
| `packages/cli/templates/artifacts/quickstart.ja.md` | 新規 | 日本語版 |
| `packages/cli/templates/artifacts/quickstart.en.md` | 新規 | 英語版 |
| `packages/cli/templates/artifacts/checklist.ja.md` | 新規 | 日本語版 |
| `packages/cli/templates/artifacts/checklist.en.md` | 新規 | 英語版 |
| `packages/cli/templates/artifacts/tasks.ja.md` | 新規 | 日本語版 |
| `packages/cli/templates/artifacts/tasks.en.md` | 新規 | 英語版 |
| `packages/cli/templates/artifacts/readme.md` | 削除 | .ja.md / .en.md が揃った後に削除 |
| `packages/cli/templates/artifacts/glossary.md` | 削除 | 同上 |
| `packages/cli/templates/artifacts/proposal.md` | 削除 | 同上 |
| `packages/cli/templates/artifacts/research.md` | 削除 | 同上 |
| `packages/cli/templates/artifacts/design.md` | 削除 | 同上 |
| `packages/cli/templates/artifacts/architecture-overview.md` | 削除 | 同上 |
| `packages/cli/templates/artifacts/quickstart.md` | 削除 | 同上 |
| `packages/cli/templates/artifacts/checklist.md` | 削除 | 同上 |
| `packages/cli/templates/artifacts/tasks.md` | 削除 | 同上 |
| `packages/cli/templates/artifacts/delta-spec.md` | 削除対象外 | `.ja.md` と `.en.md` は既存完備。レガシー削除は今回スコープ外（research.md 参照） |
| `packages/cli/templates/claude/skills/mspec-delta/SKILL.md` | 修正 | EARS パターン例示を locale 値で条件分岐 |

## Decisions

### D-1: `status.ts` command 層で locale をマージする

`statusCommand` 内で `loadConfig` を try/catch で呼び、成功時は `resolvedLocale.locale` を、失敗時は `DEFAULT_LOCALE` を使う。`computeStatus` の戻り値 `status` と spread で合成して JSON 出力する。

```typescript
// status.ts (変更イメージ)
import { loadConfig } from '../workflow/config-loader.js';
import { DEFAULT_LOCALE } from '../lib/locale-resolver.js';

// ...statusCommand 内:
let locale = DEFAULT_LOCALE;
try {
  const config = await loadConfig(paths.configFile);
  locale = config.resolvedLocale.locale;
} catch { /* config.yaml 欠損時はデフォルト */ }

const status = await computeStatus({ workflow, change, skipLog, doneLog });
if (opts.json) {
  process.stdout.write(JSON.stringify({ ...status, locale }, null, 2) + '\n');
  return;
}
```

受け入れ基準（FR-005 language-config Scenario との対応）:
- `locale: ja` 設定 → JSON に `"locale": "ja"` が含まれる
- 設定なし → JSON に `"locale": "ja"` が含まれる（DEFAULT_LOCALE フォールバック）

### D-2: `continue.ts` の `ContinueOutput` に `locale` を追加

`ContinueOutput` interface に `locale: string` を追加し、`buildContinue` が locale を受け取って出力に含める。`continueCommand` で D-1 と同じ try/catch パターンで locale を取得する。

```typescript
// continue.ts — ContinueOutput 変更箇所
export interface ContinueOutput {
  change: string;
  locale: string; // ← 追加
  current_step: string | null;
  // ...
}
```

### D-3: 9種の成果物テンプレートに `.ja.md` / `.en.md` を追加

既存の `<artifact>.md` をベースに:
- **`.ja.md`**: セクション見出し・プレースホルダを日本語で記述（`readme.md`/`glossary.md` のように現行形式を踏襲）
- **`.en.md`**: セクション見出し・プレースホルダを英語で記述

フォールバックチェーンは `<artifact>.ja.md` → `<artifact>.en.md`（legacy `.md` 削除後）。`en` が最終保護網となるため locale 未設定・未知ロケールでも常に動作する。

受け入れ基準（FR-005 artifact-templates-i18n Scenario との対応）:
- `locale: ja` で `mspec new` → stderr に "missing template" ゼロ件
- `locale: en` で `mspec new` → stderr に "missing template" ゼロ件

### D-4: `mspec-delta/SKILL.md` の EARS パターン例示を locale 分岐に

スキルの手順ステップ1で `mspec status --json` の結果から `locale` を読む（D-1 で追加したフィールド）。EARS パターン例示セクションをロケール別に記述する。

```markdown
- EARS pattern guidance — `mspec status --json` の `locale` フィールドに従うこと:
  - **locale=ja の場合**:
    - Ubiquitous: `このシステムは SHALL <振る舞い>.`
    - Event-Driven: `<トリガー> のとき、このシステムは SHALL <振る舞い>.`
    - State-Driven: `<状態> の間、このシステムは SHALL <振る舞い>.`
    - Unwanted Behavior: `<条件> の場合、このシステムは SHALL <振る舞い>.`
    - Optional Feature: `<機能> が有効な場合、このシステムは SHALL <振る舞い>.`
  - **locale=en の場合**:
    - Ubiquitous: `The system SHALL <response>.`
    - Event-Driven: `When <trigger>, the system SHALL <response>.`
    - State-Driven: `While <state>, the system SHALL <response>.`
    - Unwanted Behavior: `If <condition>, then the system SHALL <response>.`
    - Optional Feature: `Where <feature>, the system SHALL <response>.`
```

受け入れ基準（FR-021 claude-integration Scenario との対応）:
- `locale: ja` → Requirements が `このシステムは SHALL` 形式、`The system SHALL` がゼロ件
- `locale: en` → Requirements が `The system SHALL` 形式

## Constitution Check

| 原則 | Phase 0 | Phase 1 |
|------|---------|---------|
| I. ステップ独立性 | D-1〜D-4 は互いに独立して実装可能 ✓ | D-1 なしでも D-3 は機能する。D-4 は D-1 が追加する `locale` フィールドを実行時に参照するため、D-1 と組み合わせることで完全動作する。段階的リリース時は D-1 → D-4 の順が必要 ✓ |
| II. 決定論的マージ | テンプレートファイル追加は冪等。JSON フィールド追加のみで破壊的変更なし ✓ | `locale` フィールドを持たない古い `status --json` 出力を受け取るスキルは `DEFAULT_LOCALE` を使う防御コードが必要 ✓ |
| III. 質問駆動の要件確定 | Open Choices 全4件解決済み ✓ | SKILL.md 変更後の既存テスト `claude-integration-skill-ears.e2e.test.ts` が引き続きパスすることを確認する必要あり ✓ |
| IV. 双方向アンカー | 全実装ファイルに `@mspec-delta` アンカーを付与する ✓ | 各テストに `Requirements implemented:` を記載する ✓ |
| V. 強制ステップと拡張ステップの分離 | CLI コア変更（D-1/D-2）と設定ファイル変更（D-3/D-4）を別タスクに分離する ✓ | D-3 のテンプレート追加と削除は同一コミットに含めることでロールバックを容易にする ✓ |

### Complexity Tracking

None

## Self-Review

**Result: PASS WITH NOTES**

### Findings

| # | Severity | Location | Finding | Resolution |
|---|----------|----------|---------|------------|
| 1 | BLOCKER | `design.md` D-2; `language-config/spec.md` | `continue --json` への locale 追加が Delta Spec にシナリオとして未記載 | FR-006 として新規 Requirement を追加（解決済み） |
| 2 | WARNING | `design.md` Phase 1 Principle I | "D-1 なしでも D-4 は機能する" が D-4 の locale フィールド依存と矛盾 | Phase 1 記述を修正（解決済み） |
| 3 | WARNING | `design.md` Project Structure line 27 | `status.ts` の `locale` フィールドに `（オプショナル、検討）` の未解決フラグ | `必須フィールド` と確定表記に修正（解決済み） |
| 4 | WARNING | `design.md` Project Structure 削除リスト | `delta-spec.md` の扱いが曖昧 | `削除対象外（スコープ外）` と明示（解決済み） |
| 5 | NIT | `checklist.md` line 28 | 18ファイルの説明で delta-spec 除外の言及なし | delta-spec 除外を明記（解決済み） |
| 6 | NIT | `architecture-overview.md` Mermaid | `\n` 改行の互換性懸念 | レンダラー依存の軽微な問題。今回対応なし |

### Constitution Re-evaluation (Phase 0)

| 原則 | 再評価 | 判定 |
|------|--------|------|
| I. ステップ独立性 | D-1〜D-4 は独立して実装可能。D-4 の完全動作には D-1 が必要（段階的リリース時は D-1 → D-4 順） | ✓ |
| II. 決定論的マージ | テンプレート追加は冪等。JSON フィールド追加は additive のみ。フォールバックチェーンは決定論的 | ✓ |
| III. 質問駆動の要件確定 | Open Choices 4件解決済み。FR-006 追加で `continue --json` 対応も仕様化完了 | ✓ |
| IV. 双方向アンカー | 全実装ファイルに `@mspec-delta` アンカー付与予定。実装時に確認 | ✓ |
| V. 強制ステップと拡張ステップの分離 | CLI コア（D-1/D-2）・テンプレート（D-3）・SKILL（D-4）を別タスクに分離 | ✓ |
