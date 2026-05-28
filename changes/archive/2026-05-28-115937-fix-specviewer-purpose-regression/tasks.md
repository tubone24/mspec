---
doc_type: Tutorial
---

# Tasks: fix-specviewer-purpose-regression

## Phase 1 — Setup

### T-001: 現状確認

<!-- verify: fr-005 -->

SKILL.md の現在の手順構成を確認し、step 3c の後に step 3d を挿入する位置を特定する。

- `.claude/skills/mspec-archive/SKILL.md` を読み、step 3c（ポストモーテムフック）の終端を確認する
- `specs/mspec-archive/spec.md`（SoT）の FR-001〜FR-004 を読み、step 3d が既存要件と干渉しないことを確認する

## Phase 2 — Foundational

（新規依存関係・インフラ変更なし）

## Phase 3 — User Story

### ~~T-002~~: [E2E 検証] Purpose プレースホルダー検出シナリオの定義 ✓

<!-- verify: fr-005 -->

```
anchor:
@mspec-delta 2026-05-28-115937-fix-specviewer-purpose-regression/specs/mspec-archive/spec.md
Requirements implemented: FR-005
Change: fix-specviewer-purpose-regression
```

FR-005 の 2 シナリオを手動検証できる状態にする（実装前に合格基準を明確化）:

**シナリオ A（自動生成）:**
- `specs/mspec-archive/spec.md` が Purpose プレースホルダーのままであることを確認する
- step 3d 実行後に Purpose が 1〜2 文の意味のある記述に置き換わることを期待する

**シナリオ B（スキップ）:**
- Purpose が既に記述済みの spec（例: `specs/cli-archive/spec.md`）を確認する
- step 3d 実行後に Purpose が変更されていないことを期待する

---

### ~~T-003~~: [実装] `mspec-archive` SKILL.md に step 3d を追加 ✓

<!-- verify: fr-005 -->

```
anchor:
@mspec-delta 2026-05-28-115937-fix-specviewer-purpose-regression/specs/mspec-archive/spec.md
Requirements implemented: FR-005
Change: fix-specviewer-purpose-regression
```

`.claude/skills/mspec-archive/SKILL.md` の step 3c（Next Steps 評価フロー）の後に step 3d を追加する:

```markdown
3d. **[Purpose 生成]** archive 完了後、以下の手順で対象 capability の Purpose を自動生成する:

1. Delta Spec のパス（`changes/archive/<change>/specs/*/spec.md`）から capability 名を抽出する
2. 各 capability について `specs/<capability>/spec.md` を読む
3. `## Purpose` セクションの内容がテンプレートプレースホルダー（`<このスペックがカバーする外部から観測可能な振る舞いの概要>`）と一致する場合:
   a. スペックの `## Requirements` セクション全体を読む
   b. Requirements の内容を基に、このスペックが外部から観測可能な振る舞いを 1〜2 文で要約する（locale 設定に従い ja→日本語/en→英語）
   c. プレースホルダーを生成した文章で置き換えて `specs/<capability>/spec.md` に書き込む
4. Purpose が既に記述済み（プレースホルダー以外）の場合はスキップする
5. 複数 capability のうち一部の生成が失敗した場合は **skip-and-continue**（失敗した capability を「Purpose 未生成: <capability>」としてマージサマリーに記録し、残りを続行する）
```

**受け入れ基準（Decision 3 対応）:**
- 部分失敗でも archive 完了として扱われる
- 失敗 capability がマージサマリーに記録される

## Phase 4 — Polish

### T-004: [検証] シナリオ A・B の手動実行

<!-- verify: fr-005 -->

```
anchor:
@mspec-delta 2026-05-28-115937-fix-specviewer-purpose-regression/specs/mspec-archive/spec.md
Requirements implemented: FR-005
Change: fix-specviewer-purpose-regression
```

T-003 実装後に T-002 で定義した 2 シナリオを手動検証する:

- [ ] シナリオ A: プレースホルダー capability の Purpose が 1〜2 文で生成された
- [ ] シナリオ B: 記述済み capability の Purpose は変更されていない
- [ ] 既存 FR-001〜FR-004（Lessons/NextAction フロー）の動作に影響がない

### T-005: [検証] mspec validate パス確認

<!-- verify: fr-005 -->

step 3d 実装後に以下を実行して問題がないことを確認する:

```bash
mspec validate --change 2026-05-28-115937-fix-specviewer-purpose-regression
mspec anchor check --change 2026-05-28-115937-fix-specviewer-purpose-regression
```

## Constitution Check

| Principle | Phase 0 | Notes |
|-----------|---------|-------|
| I. ステップ独立性 | ✅ | 各タスクは独立して実行可能 |
| II. 決定論的マージ | ✅ | CLI 側は変更なし。AI 生成は SKILL.md 側のみ |
| III. 質問駆動の要件確定 | ✅ | FR-005 に要件明記済み |
| IV. 双方向アンカー | ✅ | T-002〜T-004 に anchor ブロック付与 |
| V. 強制ステップと拡張ステップの分離 | ✅ | SKILL.md のみ変更 |
| VI. Security by Default | ✅ | ローカルファイル書き込みのみ |
