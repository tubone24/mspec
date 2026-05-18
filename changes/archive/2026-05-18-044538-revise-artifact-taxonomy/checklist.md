---
doc_type: Reference
---

# Checklist: revise-artifact-taxonomy

> 各項目は `<!-- verify: fr-NNN -->` または `<!-- verify: human -->` アノテーションを末尾に付け、`mspec-implement` が自動 check、人間レビュアが目視 check できる形にする。FR-NNN は当該 Delta Spec capability の FR 番号を指す（重複は文脈で判断）。

## Delta Spec Coverage

各 Delta Spec の Requirement / Scenario が実装と test で完全にカバーされていることを確認する項目。

### artifact-taxonomy

- [x] FR-001 (MODIFIED) — `design-rationale.md` がテンプレ列挙文に追加され、許容値リストに `AI-Internal` が追記されている <!-- verify: fr-001 -->
- [x] FR-001 Scenario "design-rationale.md template contains doc_type frontmatter" — `templates/artifacts/design-rationale.{ja,en}.md` の frontmatter に `doc_type: Explanation` が存在する（E2E `artifact-taxonomy-doc-type.e2e.test.ts` で検証） <!-- verify: fr-001 -->
- [x] FR-001 Scenario "tasks.md template declares AI-Internal" — `tasks.{ja,en}.md` の frontmatter が `doc_type: AI-Internal` になっている <!-- verify: fr-001 -->
- [x] FR-002 (MODIFIED) — 許容値集合が `Reference / Explanation / How-to / Tutorial / AI-Internal` の 5 種に拡張され、それ以外の値（`Mixed`、`Tutorial-Reference` 等）は禁止のまま <!-- verify: fr-002 -->
- [x] FR-002 Scenario "Valid doc_type values are the five types defined in FR-001" — 全テンプレが 5 種いずれか（E2E の `VALID_DOC_TYPES` 拡張で担保） <!-- verify: fr-002 -->
- [x] FR-002 Scenario "Invalid doc_type values are rejected by validate" — `doc_type: Mixed` を含むテンプレに対し `mspec validate` が非ゼロ終了する <!-- verify: fr-002 -->
- [ ] FR-002 タイトル文字列 "four Diátaxis types" は本 change では維持し、後続 change（`rename-fr-002-doc-type-title`）で RENAMED するという方針が `design.md` Decision 6 に記録されている（本 change は bootstrap paradox により `design-rationale.md` を使わず、Decision 6 への verify アンカーが代替） <!-- verify: human -->
- [x] FR-004 (ADDED) — `tasks.{ja,en}.md` の frontmatter が `doc_type: AI-Internal` に変更され、 Reference / Explanation / How-to / Tutorial のいずれでもないことが E2E で確認 <!-- verify: fr-004 -->
- [x] FR-004 Scenario "tasks.md template は AI-Internal として分類される" — `EXPECTED_DOC_TYPES['tasks.{ja,en}.md'] === 'AI-Internal'` が green <!-- verify: fr-004 -->
- [x] FR-005 (ADDED) — `readme.{ja,en}.md` frontmatter が `doc_type: Tutorial` で、ファイル末尾に `## Summary (Lessons / Next Steps)` セクション雛型 + プレースホルダコメントを含む <!-- verify: fr-005 -->
- [x] FR-005 Scenario "新規 change の readme は Tutorial 型で雛型まとめセクションを持つ" — `mspec new <feature>` 直後の readme.md が条件を満たす（`EXPECTED_DOC_TYPES['readme.{ja,en}.md'] === 'Tutorial'` および末尾セクションの存在を E2E で確認） <!-- verify: fr-005 -->
- [x] FR-005 fallback パス — `buildReadmeFallback` (`packages/cli/src/commands/new.ts:106-132`) の `## Artifacts` に `- [ ] design-rationale.md` が追加され、末尾に `## Summary (Lessons / Next Steps)` プレースホルダが付与されている <!-- verify: fr-005 -->
- [x] FR-006 (ADDED) — `templates/artifacts/design-rationale.{ja,en}.md` が新規作成され、frontmatter `doc_type: Explanation` を宣言、`design.{ja,en}.md` (Reference) と同時に design ステップで生成される <!-- verify: artifact-taxonomy/fr-006 -->
- [ ] FR-006 Scenario "design ステップ完了時に 2 ファイルが揃う" — design ステップ完了後に `design.md` (Reference) と `design-rationale.md` (Explanation) の両方が存在する <!-- verify: artifact-taxonomy/fr-006 -->

### claude-integration

- [x] FR-022 (ADDED) — `mspec-design` SKILL.md の Procedure が `design.md` と `design-rationale.md` の両方を同一ステップで生成する手順に更新されている（templates と runtime の両方） <!-- verify: claude-integration/fr-022 -->
- [x] FR-022 Scenario "design ステップ完了時に両ファイルが揃う" — design ステップ実行後に両ファイルが存在し、frontmatter doc_type および末尾 Constitution Check セクションが両方に存在する <!-- verify: claude-integration/fr-022 -->
- [x] FR-022 Scenario "design-rationale.md 欠落時は skill が再実行を促す" — `design.md` のみ存在する change で `mspec validate --change <id>` が blocker を報告し、`mspec continue` が `validate_failed` を返す <!-- verify: claude-integration/fr-022 -->
- [x] FR-022 — `mspec-design` SKILL の `## Artifacts` チェックボックス更新指示が `design.md / design-rationale.md / architecture-overview.md` を反映するよう改訂されている <!-- verify: claude-integration/fr-022 -->
- [x] FR-023 (ADDED) — `mspec-archive` SKILL.md に「`readme.md` 末尾 Summary を AI 生成で埋める」step 3b が追加されている（templates と runtime の両方） <!-- verify: fr-023 -->
- [x] FR-023 Scenario "archive 後に readme まとめが埋まる" — archive 完了後の `readme.md` の `## Summary (Lessons / Next Steps)` が `### Lessons` (3-5 bullet) と `### Next Steps` (2-4 bullet) で埋まっている <!-- verify: fr-023 -->
- [x] FR-023 Scenario "archive 時に Summary 欠落のままでは validate fail" — Summary がプレースホルダコメントのみの状態で `mspec validate --change <id>` が warning または error を報告する（`packages/cli/src/lib/artifact-validator.ts` に readme Summary プレースホルダ検知ルールが追加されている） <!-- verify: fr-023 -->
- [ ] FR-023 — Summary 本文は 30 行・1,500 字以内の目安に収まっている（research D3 / design Decision 3） <!-- verify: human -->

### cli-workflow-engine

- [x] FR-022 (ADDED) — `workflow.default.yaml` の `design` ステップ `produces` が `[design.md, design-rationale.md, architecture-overview.md]` に拡張されている <!-- verify: cli-workflow-engine/fr-022 -->
- [x] FR-022 Scenario "design ステップの produces は両ファイルを列挙する" — `mspec status --change <id> --json` の `design` ステップ `produces` 配列に `design.md` と `design-rationale.md` が含まれる <!-- verify: cli-workflow-engine/fr-022 -->
- [ ] FR-022 Scenario "design-rationale.md 欠落で validate が fail する" — `design.md` のみ存在状態で `mspec validate --change <id>` が `design-rationale.md` 欠落を blocker として報告し非ゼロ終了する <!-- verify: cli-workflow-engine/fr-022 --> <!-- intentional-RED: T121 — cli-workflow-engine state-engine limitation; documented in tasks.md T121 -->
- [ ] FR-022 Scenario "design ステップ完了判定は両ファイル存在が必要" — `design.md` のみで `mspec continue --change <id> --json` の `current_step` が `design` のままで `next_action` が `validate_failed` または `execute` を返す <!-- verify: cli-workflow-engine/fr-022 --> <!-- intentional-RED: T121 — cli-workflow-engine state-engine limitation; documented in tasks.md T121 -->

### cli-spec-lint

- [x] FR-015 (ADDED) — `mspec validate` および `template-doc-type-invariant.e2e.test.ts` が 5 種（含 `AI-Internal`）を許容し、`AI-Internal` 宣言テンプレを欠落・未サポート扱いしない <!-- verify: fr-015 -->
- [x] FR-015 Scenario "AI-Internal を宣言したテンプレートが validate を通る" — `tasks.{ja,en}.md` が `doc_type: AI-Internal` で `mspec validate` が成功し、`template-doc-type-invariant.e2e.test.ts` も green <!-- verify: fr-015 -->
- [x] FR-015 Scenario "列挙外の doc_type は validate が拒否する" — `doc_type: Mixed` 等列挙外値は `Mixed is not a valid doc_type; allowed: Reference, Explanation, How-to, Tutorial, AI-Internal` 形式でエラー報告され非ゼロ終了する <!-- verify: fr-015 -->
- [x] FR-015 Scenario "doc_type フィールド欠落は引き続きエラー" — frontmatter に `doc_type:` が無いテンプレに対し `mspec validate` がエラーを報告する <!-- verify: fr-015 -->
- [x] FR-015 — `artifact-taxonomy-doc-type.e2e.test.ts` の `VALID_DOC_TYPES` 配列に `'AI-Internal'` が追加され、`EXPECTED_DOC_TYPES` 表が新マッピング（`design-rationale.{ja,en}.md`: `'Explanation'` 追加、`tasks.{ja,en}.md`: `'AI-Internal'`、`readme.{ja,en}.md`: `'Tutorial'`）に更新されている <!-- verify: fr-015 -->
- [x] FR-015 — describe / it 文字列の "four Diátaxis types" が "five doc types (Diátaxis + AI-Internal)" 系に改訂されている <!-- verify: fr-015 -->

## Source-of-Truth Regression

本 change が誤って壊さないか確認する既存仕様の項目。

### artifact-taxonomy (existing FR-001..FR-003)

- [ ] FR-001 (SoT) — `proposal.{ja,en}.md` テンプレが `doc_type: Explanation` のまま据え置きされている（`EXPECTED_DOC_TYPES` 表で確認） <!-- verify: human -->
- [ ] FR-001 (SoT) — `research.{ja,en}.md` テンプレが `doc_type: Reference` のまま据え置きされている <!-- verify: human -->
- [ ] FR-001 (SoT) — `design.{ja,en}.md` テンプレが `doc_type: Reference` のまま据え置き、ただし `## Decisions` セクションが削除され純 Reference 化されている <!-- verify: human -->
- [ ] FR-001 (SoT) — `quickstart.{ja,en}.md` の `doc_type: How-to`、`checklist.{ja,en}.md` の `doc_type: Reference`、`architecture-overview.{ja,en}.md` の `doc_type: Reference`、`glossary.{ja,en}.md` の `doc_type: Reference` が無改変 <!-- verify: human -->
- [ ] FR-003 (SoT) — `glossary.md` が `mspec new` で必須生成される挙動が無改変（`packages/cli/src/commands/new.ts:89-90,100` の glossary 書き込みが残存） <!-- verify: human -->
- [ ] FR-003 (SoT) — `research.md` テンプレが `glossary.md` への参照を保持し続けている <!-- verify: human -->

### claude-integration

- [ ] FR-002 / FR-003 (SoT) — 改訂した `mspec-design` / `mspec-archive` SKILL.md が `mspec status --json` ファースト規約を保持している <!-- verify: human -->
- [ ] FR-006 (SoT) — Skill / subagent / CLI 役割境界が改訂後も維持され、SKILL.md 内に Markdown 構造検査ロジックの再実装が混入していない <!-- verify: human -->
- [ ] FR-014 (SoT) — runtime ファイル（`.claude/skills/mspec-design/SKILL.md`, `.claude/skills/mspec-archive/SKILL.md`）と template (`packages/cli/templates/claude/skills/mspec-{design,archive}/SKILL.md`) の双方が同一の改訂を受けている <!-- verify: human -->
- [ ] FR-015 (SoT) — 改訂後の `mspec-design` SKILL は `## Artifacts` チェックボックス更新を引き続き行う（`design.md` / `design-rationale.md` / `architecture-overview.md` の 3 行に対応） <!-- verify: human -->
- [ ] FR-017 (SoT) — 改訂後の SKILL.md 群でハイフン形式 `mspec-continue` 等が再混入していない（コロン形式 `/mspec:continue` のみ） <!-- verify: human -->
- [ ] FR-018-021 (SoT) — `Mode:` ベースの lightweight mode 仕組み（typo / minor / bugfix）が改訂後も維持され、軽量モードで design ステップごとスキップされた場合 `design-rationale.md` も自然にスキップされる <!-- verify: human -->

### cli-workflow-engine

- [ ] FR-002 (SoT) — `archive` ステップが `removable: false` のまま、新 step 3b 追加は workflow.yaml ではなく SKILL 側で完結している（`workflow.default.yaml:114-120` の archive ブロックが produces/block 等の構造を維持） <!-- verify: human -->
- [ ] FR-005 (SoT) — `design` ステップが `produces` 拡張後も `done` 判定ロジックを正しく動作させる（`design.md` / `design-rationale.md` / `architecture-overview.md` の全てが存在＋validate 通過時のみ done） <!-- verify: human -->
- [ ] FR-007 (SoT) — `design-rationale.md` 欠落時の `invalid` ステート報告が `blockers` 配列にも記載される <!-- verify: human -->
- [ ] FR-009 / FR-017 (SoT) — `architecture-overview.md` の Mermaid 必須など既存 validate ルールが design 改訂後も green である <!-- verify: human -->
- [ ] FR-010 / FR-011 (SoT) — `mspec continue` の JSON エンベロープ schema（`next_action` 4 値、`required_artifacts`、`produces` など）が design ステップ拡張後も維持される <!-- verify: human -->
- [ ] FR-019 (SoT) — `modes` セクション（`packages/cli/templates/workflow.default.yaml:125-134`）が改訂で破壊されていない <!-- verify: human -->

### cli-spec-lint

- [x] FR-015 (Delta) Scenario 3 — `doc_type:` フィールド欠落はエラーであるという既存 enforcement が AI-Internal 拡張後も維持される <!-- verify: fr-015 -->
- [ ] 既存 `artifact-taxonomy-doc-type.e2e.test.ts` の FR-001 describe（テンプレ 1 件ごとに `doc_type` プロパティ存在 + 期待値一致）が全件 green のまま <!-- verify: human -->
- [ ] `template-doc-type-invariant.e2e.test.ts` (`packages/cli/tests/e2e/template-doc-type-invariant.e2e.test.ts:11-26`) の既存 ja/en locale-invariance テストが green のまま <!-- verify: human -->
- [ ] cli-spec-lint FR-001..FR-014 (SoT 既存) — 禁止語彙 lint・`--json`・`list-requirements` 等の挙動に doc_type 拡張が一切干渉しない <!-- verify: human -->

### artifact-templates-i18n

- [ ] FR-001 / FR-002 — `design-rationale` 新規 artifact が locale resolver（`resolveTemplate('design-rationale', locale, dir)`）で ja/en 両方解決でき "missing template" 警告が出ない <!-- verify: human -->
- [ ] FR-003 — 改訂後の全成果物（`readme`, `design`, `design-rationale`, `tasks` 等）のセクション見出し / プレースホルダが ja で日本語、en で英語に統一されている <!-- verify: human -->
- [ ] FR-004 — `design-rationale.ja.md` / `design-rationale.en.md` の frontmatter `doc_type: Explanation` 識別子が両ロケールで一致（locale-invariant） <!-- verify: human -->
- [ ] FR-005 — `readme.{ja,en}.md` の新 `## Summary (Lessons / Next Steps)` セクションが ja/en で同一構造（同じ H2/H3 見出しキー）を持つ <!-- verify: human -->
- [ ] FR-005 — `mspec new` を `locale: ja` / `locale: en` 双方で実行しても stderr に "missing template" 文字列が出力されない <!-- verify: human -->

## Constitution

- [ ] 原則 I (ステップ独立性) — `archive` ステップが編集する `readme.md` 末尾 Summary が同一 change ディレクトリ内に閉じており、他成果物・他 change への副作用が無い（design.md Phase 1 で ✅ に格上げの根拠を保持） <!-- verify: human -->
- [ ] 原則 II (決定論的マージ) — Delta Spec の ADDED/MODIFIED/REMOVED/RENAMED マージ仕様に一切手を入れていない（FR-002 タイトル改名は本 change で行わず後続 change で扱う） <!-- verify: human -->
- [ ] 原則 III (質問駆動の要件確定) — proposal 4 問 + research D1-D6（Open Question 5 件）+ Open Choices OC1-OC6 が全て resolve 済みであることが design Decisions に Source 付きで記録されている <!-- verify: human -->
- [ ] 原則 IV (双方向アンカー) — tasks.md ↔ Delta Spec ↔ 実装の anchor 仕組み（`<!-- @mspec-delta ... -->` / `Requirements implemented:` ヘッダ）に影響なし <!-- verify: human -->
- [ ] 原則 V (強制ステップと拡張ステップの分離) — `design-rationale.md` 必須化と `archive` の Summary 追記必須化が、軽量モード（typo / minor / bugfix）で design ステップ全体スキップされる場合に自然に副作用無しでスキップされることが確認できる（design.md Phase 1 ⚠️ 保持の理由が design-rationale 側に記述されている） <!-- verify: human -->

## Risk Highlights

> regression scan で発見した、特に注意すべき項目を根拠付きで列挙する。

1. **`workflow.default.yaml:51-59` の design produces 改訂が `mspec status` 判定に与える影響** — 既存の `design` ステップは `produces: [design.md, architecture-overview.md]` (`packages/cli/templates/workflow.default.yaml:51-59`)。`design-rationale.md` を追加すると、既存の archive 配下 change（旧 produces のみ生成）に対して `mspec status` が `done` を返さなくなるリスクがある。research D1（grandfather 方針）と `validate.ts:42-50` の `includeArchived: false` 既定で archive は status 既定対象外だが、`--all` 指定時の挙動を E2E で固定する必要がある。

2. **`packages/cli/tests/e2e/artifact-taxonomy-doc-type.e2e.test.ts:18-39` の baseline 表が allow-list の唯一の enforcement 源** — `validate.ts` 側に doc_type 値の enforcement が存在せず（`packages/cli/src/commands/validate.ts` 全体に doc_type 許容値検査ロジックなし、validator は `artifact-validator.ts` に委譲）、test 表のみが守っている。Delta Spec cli-spec-lint FR-015 Scenario 2 が要求するエラーメッセージ `Mixed is not a valid doc_type; allowed: Reference, Explanation, How-to, Tutorial, AI-Internal` を本当に CLI で出すには、`validate.ts` または `artifact-validator.ts` に **新規 doc_type 値検査ロジックの実装** が必要。research / design は test 表更新のみで green になると述べているが Scenario 2 の文言要求と矛盾している点を design / tasks 段階で再確認する必要がある。

3. **`packages/cli/src/commands/new.ts:106-132` の `buildReadmeFallback` 改訂忘れ** — `buildReadmeFallback` はテンプレ resolver が失敗した場合のフォールバックで、現状 `## Artifacts` 列挙に `- [ ] design.md / architecture-overview.md` のみを持つ（line 123）。`design-rationale.md` 追加と末尾 `## Summary (Lessons / Next Steps)` セクション追加を template 側だけ更新して fallback を忘れると、テンプレ未配置環境で生成された readme が新体系を満たさず FR-005 Scenario が fail する。

4. **`mspec-archive` skill の step 3b 追加が原則 I （ステップ独立性）の初の副作用事例** — design.md Phase 0 で ⚠️、Phase 1 で ✅ と評価されているが、archive が `readme.md` を編集するのは mspec 史上初。同 change ディレクトリ内に閉じているとはいえ、archive 後に `mv changes/<id> changes/archive/<id>` する直前に readme 更新を行う順序（architecture-overview.md sequence diagram の step 3b → step 4）が SKILL.md の Procedure に正確に反映されているかを目視確認する必要がある。順序を間違えると archive 済み change の readme に Summary が書き込まれない／二重書き込みされるリスクがある。

5. **`template-doc-type-invariant.e2e.test.ts:11-26` は doc_type 値の許容性を検査せず、ja/en 間の文字列一致のみを検査する** — cli-spec-lint Delta Spec FR-015 Scenario 1 の AND 句「`template-doc-type-invariant.e2e.test.ts` が green である」は、AI-Internal を locale-invariant な英字識別子として扱う限り自動的に満たされる（追加テスト不要）。一方で「`AI-Internal` 識別子の locale-invariance を明示的に検証するテスト」は research D5 で任意とされており、本 change で追加しないと将来 `AI-内部` 等の誤ったローカライズ翻訳が混入してもテストで検出できない。tasks 段階で追加テスト 1 件を含めるか判断が必要。
