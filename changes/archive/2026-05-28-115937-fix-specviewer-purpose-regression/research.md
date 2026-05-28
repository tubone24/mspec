# Research: fix-specviewer-purpose-regression

## Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| Purpose 生成はどこで行うか | `mspec-archive` SKILL.md に手順を追加する | Purpose 生成は AI による意味的な要約が必要なため、LLM フリーの CLI (`cli-archive`) ではなく AI 駆動のスキル側が担当すべき |
| 既存 41 件のプレースホルダーをどう扱うか | archive ステップに「アーカイブ対象 capability の Purpose がプレースホルダーなら生成・上書き」を追加し、既存は別途一括修正コマンドの検討を Open Choice とする | 今回のスコープは新規 archive 時の修正とし、既存は別 change で対処 |
| Purpose の文体・言語はどうするか | `locale` 設定に従う（ja→日本語、en→英語）。既存の `cli-archive` が使う locale 判定ロジックを流用 | mspec の多言語対応方針との一貫性を保つ |

## Web References

（内部コードベースのみの修正のため不要）

## Codebase Findings

### Purpose プレースホルダーの発生源

`packages/cli/src/commands/delta-init.ts` の `buildSotSkeleton()` 関数（行 101–114）:

```typescript
function buildSotSkeleton(capability: string): string {
  return `<!-- mspec: gaps in FR numbering are intentional. ... -->

# ${capability} Specification

## Purpose

<このスペックがカバーする外部から観測可能な振る舞いの概要>

## Requirements
...`;
}
```

新規 capability の SoT spec が作成される際、`## Purpose` セクションに日本語のテンプレートプレースホルダーが埋め込まれる。このプレースホルダーを後から置き換える仕組みが存在しない。

### 影響範囲

```
grep -rl "<このスペックがカバーする外部から観測可能な振る舞いの概要>" specs/ | wc -l
→ 41 ファイル（全 capability の大多数）
```

### `mspec-archive` SKILL.md の現状

`mspec-archive` SKILL.md の手順（step 3b → 3 → 3c）:

- **3b**: readme.md の `## Summary (Lessons / Next Steps)` を AI が生成
- **3**: `mspec archive <change> -y` を実行（決定論的マージ、LLM なし）
- **3c**: Lessons 分析 + NextAction 評価のポストモーテムフック

Purpose 生成ステップは **存在しない**。設計上は archive 時に AI が Purpose を書くことが想定されていたが、SKILL.md に実装されなかった。

### `archive-merger.ts` の別スケルトン

`packages/cli/src/lib/archive-merger.ts` の `createEmptySpec()` は全く別の英語コメント形式のスケルトンを持つが、実際の `buildSotSkeleton()` とは独立しており、Purpose 自動生成には無関係。

### 修正対象ファイル

| ファイル | 変更内容 |
|----------|----------|
| `.claude/skills/mspec-archive/SKILL.md` | Step 3c の後に Purpose 生成ステップを追加 |
| `specs/mspec-archive/spec.md` | FR-005 を archive 後 Purpose 生成要件として追加（今回の Delta Spec） |

## Open Choices

1. **既存 41 件の一括修正**: 今回のスコープ外とするが、`mspec fix-purpose` コマンドまたは別チェンジで retroactive に全 spec の Purpose を生成する運用が望ましい。次のアクションとして提案する。

2. **Purpose 生成の対象タイミング**: 今回は「archive 完了後、アーカイブ対象 capability のプレースホルダーのみ」とする。全 spec の一括スキャンは別 change で行う。

## Constitution Check

| Principle | Phase 0 | Phase 1 |
|-----------|---------|---------|
| I. ステップ独立性 | PASS — mspec-archive スキルへの追加手順は archive ステップのみに影響し、他ステップに副作用なし | — |
| II. 決定論的マージ | PASS — Purpose 生成は AI スキル側（非決定論的可）、CLI マージ側は LLM フリーを維持 | — |
| III. 質問駆動の要件確定 | PASS — bugfix mode でスコープ小。Open Choice 2 点を記録済み | — |
| IV. 双方向アンカー | N/A — 今回はアンカー付きコード変更なし（SKILL.md + spec.md の追記のみ） | — |
| V. 強制ステップと拡張ステップの分離 | PASS — Purpose 生成は mspec-archive スキルの拡張ステップとして追加。強制ステップ（cli-archive）は変更しない | — |
| VI. Security by Default | PASS — ローカルファイル書き込みのみ。外部 API・秘密情報アクセスなし | — |
