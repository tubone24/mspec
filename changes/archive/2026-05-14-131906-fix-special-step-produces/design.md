---
doc_type: Design
---

# Design: fix-special-step-produces

## Summary

`implement`・`archive`・`self-review` の 3 ステップは `produces: []` であるため、`state-engine.ts` の `evaluateStep` 関数（L63-78）が常に `'ready'` を返し `'done'` へ遷移できない。
本 change は `mspec done <step-id>` コマンドと `done-log.json` を新設し、`state-engine` が done-log を参照して produces レスステップを正しく `'done'` へ遷移させる。
副次的に `workflow.yaml` から 3 ステップの `skippable: true` を削除し、スキップ（意図的省略）と完了（作業済み）の意味的一貫性を回復する。

## Technical Context

| ファイル | 役割 | 変更種別 |
|---------|------|---------|
| `packages/cli/src/lib/done-log.ts` | done-log の読み書き（skip-log.ts の対称実装） | **新規** |
| `packages/cli/src/lib/state-engine.ts` | `ComputeStatusInput` に `doneLog` 追加、`evaluateStep` に done 先行チェック挿入 | **修正** |
| `packages/cli/src/commands/done.ts` | `mspec done <step-id>` コマンド実装 | **新規** |
| `packages/cli/src/index.ts` | `done` コマンドの CLI 登録 | **修正** |
| `packages/cli/src/commands/status.ts` | `loadDoneLog` を `loadSkipLog` と並走追加 | **修正** |
| `packages/cli/src/commands/continue.ts` | 同上 | **修正** |
| `.mspec/workflow.yaml` | `implement`・`archive`・`self-review` の `skippable: true` 削除 | **修正** |
| `packages/cli/tests/state-engine.test.ts` | produces レスステップのユニットテスト | **新規** |

**バグ箇所**: `state-engine.ts:63-78` — `produces.length === 0` のとき常に `'ready'` を返す。`isDone(doneLog, change.name, step.id)` を先行チェックする分岐を挿入し、done-log 記録済みであれば `'done'` を返す。

## Project Structure

```
packages/cli/src/
├── lib/
│   ├── skip-log.ts          # テンプレート（変更なし）
│   ├── done-log.ts          # NEW: DoneEntry / loadDoneLog / recordDone / isDone
│   └── state-engine.ts      # MODIFIED: ComputeStatusInput + evaluateStep
├── commands/
│   ├── skip.ts              # テンプレート（変更なし）
│   └── done.ts              # NEW: doneCommand()
└── index.ts                 # MODIFIED: done コマンド登録
.mspec/
└── workflow.yaml            # MODIFIED: skippable: true 削除 (3 箇所)
packages/cli/tests/
└── state-engine.test.ts     # NEW: produces-less step の状態遷移テスト
```

## Decisions

### Decision 1 — done-log の形式と配置 → `done-log.json` + `.mspec/cache/`

**根拠**: `skip-log.json` と完全対称にすることで実装コストを最小化。既に gitignore 済みの cache dir に配置することでリポジトリを汚染しない。

**受け入れ基準** (cli-done-log FR-002):
- GIVEN `skip-log.json` が `{ changeName: { stepId: { reason, skipped_at } } }` 形式を持つ
- WHEN `done-log.json` が生成される
- THEN `{ changeName: { implement: { done_at: "2026-05-14T13:19:06Z" } } }` の対称形式になる

### Decision 2 — `mspec done` のガード → produces があればエラー (cli-done-log FR-003)

**根拠**: produces を持つステップは artifact 検査で自動的に done 遷移するため `mspec done` は不要かつ混乱の元。

**受け入れ基準** (cli-done-log FR-003):
- GIVEN ユーザーが `mspec done proposal` を実行（`proposal` は `produces: [proposal.md]`）
- WHEN コマンドが実行される
- THEN エラー `"mspec done は produces が空のステップにのみ使用できます"` が表示され、`done-log.json` は更新されない

### Decision 3 — `implement` ステップの validate 連携

**根拠**: `enforce_anchor` / `enforce_e2e` / `enforce_tdd` フラグの形骸化を防ぐため、`mspec done implement` 実行時に内部で `mspec validate` を実行し、アンカー/E2E/TDD 証跡を確認してから done 遷移する。

**受け入れ基準** (cli-done-log FR-004):
- GIVEN `mspec validate` がアンカー/E2E/TDD 証跡の検証に成功する
- WHEN ユーザーが `mspec done implement` を実行する
- THEN `done-log.json` に `implement` エントリが保存される

### Decision 4 — idempotency → タイムスタンプ上書き

**根拠**: 再完了の記録として自然。CI 等での再実行時にエラーにならない。

**受け入れ基準** (cli-done-log FR-001):
- GIVEN `done-log.json` にすでに `implement` エントリが存在する
- WHEN `mspec done implement` を再度実行する
- THEN タイムスタンプが新しい値で上書きされ、エラーは発生しない

### Decision 5 — `skippable: true` 削除対象 → `implement`・`archive`・`self-review` (cli-workflow-engine FR-018)

**根拠**: `skippable` は `commands/skip.ts:23` 1 箇所でのみ参照。削除後も `research`・`quickstart`・`checklist` の `skippable: true` は維持。型スキーマ `workflow.ts:18` は残す。

**受け入れ基準** (cli-workflow-engine FR-018):
- GIVEN `implement`・`archive`・`self-review` ステップに `skippable: true` が設定されている
- WHEN 本 change が archive される
- THEN これらのステップの `skippable: true` が削除され、done への遷移は `mspec done` コマンドのみで行われる

### Decision 6 — `produces: []` + done-log 未記録 → `'ready'` を維持 (cli-state-engine FR-002)

**根拠**: 前ステップが done/skipped であれば、produces レスステップは実行可能状態（ready）として扱う。これは既存動作を壊さない後方互換な変更。

**受け入れ基準** (cli-state-engine FR-002):
- GIVEN `implement` ステップが `produces: []` であり `done-log.json` に `implement` エントリが存在しない
- WHEN `state-engine` が当該ステップを評価する（前ステップは done 済み）
- THEN ステップ状態として `'ready'` が返される

## Constitution Check

> Step: design | Constitution Version: 1.0.0

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | ✅ | `done-log.ts` は独立モジュール。`computeStatus` への変更は追加のみで後方互換 |
| II. 決定論的マージ | ✅ | ✅ | `done-log.json` はキャッシュ（`.mspec/cache/`）であり archive マージ対象外。マージロジックに影響なし |
| III. 質問駆動の要件確定 | ✅ | ✅ | research フェーズで全 Open Choices を確定済み。設計上の新規疑問点なし |
| IV. 双方向アンカー | — | — | アンカーロジックへの影響なし（`implement` の enforce_anchor は `mspec validate` 内既存ロジック） |
| V. 強制ステップと拡張ステップの分離 | ✅ | ✅ | `skippable: true` を `removable: false` の 3 ステップから除去することで分離がより明確になる |

### Complexity Tracking

None

## Self-Review

> Step: self-review | Constitution Version: 1.0.0

**Overall Assessment: PASS** (Pass 1 resolved BLOCKER-1〜4; Pass 2 resolved remaining `cli-workflow-engine` spec inconsistency)

---

### Findings (Pass 1 — prior session)

**BLOCKER-1 (RESOLVED): done-log ファイル配置・形式 — Delta Spec vs. design.md の矛盾**

- Delta Spec (cli-done-log FR-001) は `changes/<change-dir>/done-log.yaml`（per-change, YAML）と記述していた。
- design.md Decision 1 は `.mspec/cache/done-log.json`（global cache, JSON, nested）を採用。
- **対処**: `specs/cli-done-log/spec.md` FR-001/FR-002/FR-003 を JSON/cache/nested 形式に更新した。
- ⚠️ 注: `specs/cli-workflow-engine/spec.md` FR-018 の `done-log.yaml` 参照は Pass 1 では未修正 → Pass 2 で解決。

**BLOCKER-2 (RESOLVED): done-log スキーマ — flat array (spec) vs. nested object (design)**

- Delta Spec FR-002 は `[{ step, at }]` のフラット配列形式を記述していた。
- design.md Decision 1 は `{ changeName: { stepId: { done_at } } }` のネストオブジェクト形式を採用。
- **対処**: FR-002 のスキーマを skip-log.json と対称なネストオブジェクト形式に更新した。

**BLOCKER-3 (RESOLVED): append vs. overwrite セマンティクス**

- Delta Spec FR-001 は "SHALL append an entry" と記述していた。
- design.md Decision 4 は "タイムスタンプ上書き" (idempotent overwrite) を採用。
- **対処**: FR-001 の THEN 句を "upsert (overwrite if exists)" に更新した。

**BLOCKER-4 (RESOLVED): Decision 3 (`mspec done implement` → `mspec validate`) に対応 FR なし**

- Decision 3 は `mspec done implement` 実行時に `mspec validate` を内部実行するが、対応 FR が存在しなかった。
- **対処**: `specs/cli-done-log/spec.md` に FR-004 を追加し、Constitution III のトレーサビリティを確保した。Decision 3 の受け入れ基準引用を FR-004 に更新した。

---

### Findings (Pass 2 — this session)

**BLOCKER-5 (RESOLVED): `cli-workflow-engine/spec.md` FR-018 が `done-log.yaml` を参照していた**

- `specs/cli-workflow-engine/spec.md` FR-018 line 7 に `done-log.yaml` の参照が残存していた。
- `cli-done-log` および `cli-state-engine` スペックは Pass 1 で修正済みだったが `cli-workflow-engine` が見落とされた。
- **対処**: FR-018 の記述を `.mspec/cache/done-log.json` に更新した。

**WARNING (acknowledged): checklist.md の矛盾フラグが未解決のまま**

- checklist.md lines 11–15 および line 46 に形式/配置の矛盾を示す注釈が残っている（解決前に生成されたため）。
- チェックリストは audit trail として機能するため、実装時に design.md Decision 1 を参照して解決済みと判断されたい。

**nit: Constitution IV の "—" 判定について**

- 新規実装ファイル（`done-log.ts`, `done.ts`, `state-engine.ts`, `state-engine.test.ts`）は `@mspec-delta` アンカーブロックが必要。
- "—" は「アンカーロジック自体への変更なし」として正しいが、実装時チェックリスト（checklist.md line 69）で追跡されているため問題なし。

---

### Constitution Re-Evaluation (Self-Review — Pass 2)

| Principle | Phase 0 | Phase 1 | Self-Review Verdict |
|-----------|---------|---------|---------------------|
| I. ステップ独立性 | ✅ | ✅ | ✅ CONFIRMED |
| II. 決定論的マージ | ✅ | ✅ | ✅ CONFIRMED（done-log が `.mspec/cache/` に確定し、cli-workflow-engine spec も修正されたため archive マージ対象外が全スペックで保証される） |
| III. 質問駆動の要件確定 | ✅ | ✅ | ✅ CONFIRMED（FR-004 追加により Decision 3 のトレーサビリティ確保済み） |
| IV. 双方向アンカー | — | — | — CONFIRMED（実装ファイルのアンカーは checklist で追跡） |
| V. 強制ステップと拡張ステップの分離 | ✅ | ✅ | ✅ CONFIRMED |
