---
doc_type: Reference
---

# Design: revise-artifact-taxonomy

## Summary

mspec の doc_type 体系を Diátaxis 4 種から **5 種**（+ `AI-Internal`）に拡張し、`tasks.md` を `AI-Internal` に、`readme.md` を `Tutorial` に再分類する。同時に `design.md` を **Reference + Explanation の 2 ファイル**（`design.md` + `design-rationale.md`）に分割し、`archive` ステップで `readme.md` 末尾の `## Summary (Lessons / Next Steps)` を AI 記述で埋める。実装の主戦場は `packages/cli/templates/artifacts/`（テンプレ更新と新規追加）と `packages/cli/templates/claude/skills/{mspec-design,mspec-archive}/SKILL.md`、E2E テスト 1 ファイル（`artifact-taxonomy-doc-type.e2e.test.ts`）、ワークフロー定義 1 ファイル（`workflow.default.yaml`）の限定的な差分で完結する。

> Bootstrap paradox 注記: **本 change 自身は旧体系（design.md + architecture-overview.md）で進める**。新体系（+ `design-rationale.md`、Tutorial readme、archive Summary 追記）は本 change の implement / archive 完了後、最初に作成される change から有効化される。

## Goals

- doc_type 許容値を `Reference` / `Explanation` / `How-to` / `Tutorial` / `AI-Internal` の 5 種に拡張（artifact-taxonomy FR-001 / FR-002 改訂）。
- `tasks.md` を `AI-Internal` に、`readme.md` を `Tutorial` に再分類し、`readme.md` 末尾に `## Summary (Lessons / Next Steps)` 雛型を導入（FR-004 / FR-005）。
- `design.md` (Reference) と `design-rationale.md` (Explanation) の両テンプレートを提供し、`design` ステップで両方を必須生成（FR-006、claude-integration FR-022、cli-workflow-engine FR-022）。
- `archive` ステップで AI が `readme.md` 末尾 Summary を `### Lessons` + `### Next Steps` で記述（claude-integration FR-023）。
- `mspec validate` および E2E（`artifact-taxonomy-doc-type.e2e.test.ts`）が新 5 種を正しく受理・拒否（cli-spec-lint FR-015）。

## Non-Goals

- 既存 `changes/*` および `changes/archive/*` の遡及的一括移行スクリプトの提供。
- Diátaxis 5 象限に基づく外部ドキュメントサイト生成（MkDocs / Docusaurus 等）。
- `AI-Internal` ファイルへのアクセス制御・暗号化・`.gitignore` 制御。
- `design.md` ⇔ `design-rationale.md` 間のセクションリンクを CLI が自動生成する仕組み（手書きを許容、テンプレ内コメントで誘導のみ）。
- 軽量モード（`> Mode: typo|minor|bugfix`）における `design-rationale.md` の選択的スキップ（`workflow.yaml` の `modes` 未変更）。

## Technical Context

- **Language / Runtime**: TypeScript 5.x / Node.js（既存 mspec CLI を踏襲）
- **Dependencies (new)**: なし（YAML frontmatter 解析・テンプレ展開は既存ユーティリティを再利用）
- **Storage**: リポジトリ内ファイルシステム（`packages/cli/templates/artifacts/`、`changes/<id>/`）
- **Testing framework**: Vitest（既存 E2E は `packages/cli/tests/e2e/` 配下）
- **Target platform**: CLI（macOS / Linux、`mspec` コマンド）
- **Performance / Constraints**: テンプレ追加 2 ファイル（`design-rationale.{ja,en}.md`）と既存ファイル差分のみ。CLI 実行時の追加負荷なし。validate の追加ルール（readme Summary プレースホルダ検知）は単純な文字列マッチで O(N) 増分。

## Constitution Check (Phase 0)

> proposal で記録した Phase 0 評価を踏襲（変化なし）。

| Principle | Compliant? | Notes |
|-----------|-----------|-------|
| I. ステップ独立性 | ⚠️ | `archive` が `readme.md` を編集する初の事例 |
| II. 決定論的マージ | ✅ | Delta Spec マージ仕様は無変更 |
| III. 質問駆動の要件確定 | ✅ | proposal / research で全 Open Questions を resolve 済み |
| IV. 双方向アンカー | — | テンプレ構造のみで非該当 |
| V. 強制ステップと拡張ステップの分離 | ⚠️ | `design-rationale.md` 必須化、`archive` の readme 追記必須化 |

## Project Structure (changes)

実装で触る/追加するファイルの一覧。Delta Spec の各 FR との対応を併記する。

### 新規追加
- `packages/cli/templates/artifacts/design-rationale.ja.md` — `doc_type: Explanation`、章立て: `## Context` / `## Decisions` / `## Alternatives Considered` / `## Trade-offs` / `## Rejected Options` / `## Constitution Check`。冒頭に `<!-- See also: ./design.md -->` コメントで相互リンクを誘導（research OC3）。→ **artifact-taxonomy FR-006**
- `packages/cli/templates/artifacts/design-rationale.en.md` — 同上の英語版（ja/en locale-invariant）。→ **artifact-taxonomy FR-006**

### 修正
- `packages/cli/templates/artifacts/tasks.ja.md` / `tasks.en.md` — frontmatter `doc_type: Reference` → `doc_type: AI-Internal`。→ **artifact-taxonomy FR-004**
- `packages/cli/templates/artifacts/readme.ja.md` / `readme.en.md` — frontmatter `doc_type: Reference` → `doc_type: Tutorial`、`## Artifacts` リストに `design-rationale.md` を追加、ファイル末尾に `## Summary (Lessons / Next Steps)` セクション + プレースホルダコメント `<!-- archive ステップで AI が生成 -->` を追加。冒頭に `<!-- See also: ./design.md -->` 風コメントは不要。→ **artifact-taxonomy FR-005**
- `packages/cli/templates/artifacts/design.ja.md` / `design.en.md` — `## Decisions` セクションを削除（rationale 側へ移動）、`## Constitution Check (Phase 0)` と `## Constitution Check (Phase 1)` は維持。冒頭に `<!-- See also: ./design-rationale.md for採用理由・代替案 -->` コメントを追加（research OC3）。→ **artifact-taxonomy FR-006**
- `packages/cli/templates/claude/skills/mspec-design/SKILL.md` — step 3 を 2 ステップに分割: (3) `design.md` を Reference として書く（構造・契約のみ）、(3a) `design-rationale.md` を Explanation として書く（Decisions / Alternatives / Trade-offs）。step 5 で両ファイルの Constitution Check（Phase 0/1 両列）を埋める。step 7a で `readme.md` の `## Artifacts` チェックを `- [x] design.md / design-rationale.md / architecture-overview.md` へ更新。→ **claude-integration FR-022**
- `packages/cli/templates/claude/skills/mspec-archive/SKILL.md` — 既存 step 3 と step 4 の間に **step 3b**「当該 change の diff・確定 Delta Spec・research D1-D6 を読み、`readme.md` 末尾の `## Summary (Lessons / Next Steps)` を `### Lessons`（3-5 bullet, 1-2 行/bullet）+ `### Next Steps`（2-4 bullet, 1 行 + 関連 FR-ID）で埋める（全体 30 行・1,500 字以内）。プレースホルダコメント `<!-- archive ステップで AI が生成 -->` を削除する」を挿入。→ **claude-integration FR-023**
- `packages/cli/templates/workflow.default.yaml` — `design` ステップの `produces` を `[design.md, architecture-overview.md]` → `[design.md, design-rationale.md, architecture-overview.md]` に変更。→ **cli-workflow-engine FR-022**
- `packages/cli/src/commands/new.ts` — `buildReadmeFallback` の `## Artifacts` 列挙に `- [ ] design-rationale.md` を追加、fallback readme 末尾に `## Summary (Lessons / Next Steps)` + プレースホルダを付与。→ **artifact-taxonomy FR-005**（テンプレ未取得時のフォールバック整合）
- `packages/cli/src/lib/artifact-validator.ts` — `readme.md` 末尾 Summary プレースホルダ残存を warning として報告するルール追加（research OC2）。→ **claude-integration FR-023 Scenario 2**
- `packages/cli/tests/e2e/artifact-taxonomy-doc-type.e2e.test.ts` — `VALID_DOC_TYPES` 配列に `'AI-Internal'` 追加、`EXPECTED_DOC_TYPES` 表に `design-rationale.{ja,en}.md`: `'Explanation'` を追加、`tasks.{ja,en}.md` を `'AI-Internal'` に、`readme.{ja,en}.md` を `'Tutorial'` に変更、describe / it 文字列の "four Diátaxis types" → "five doc types (Diátaxis + AI-Internal)" 改訂。→ **cli-spec-lint FR-015**

### 削除
- なし

## Decisions

各意思決定は research の D1–D6 を design 観点で再記述し、**Delta Spec の Scenario と直接対応** させる。これにより tasks.md の TNNN と checklist の `<!-- verify: fr-NNN -->` アノテーションへトレース可能になる。

### Decision 1: 既存 archive 配下は warning-only で grandfather

- **採用**: `mspec validate` は `changes/archive/*` 配下の doc_type 不整合を **warning** で報告し fail させない。SoT (`packages/cli/templates/artifacts/`) とアクティブ change (`changes/<id>/`) は引き続き error。
- **代替**: (a) 全 change を error 扱いで一括移行強制、(c) archived は完全に検査対象外（warning も出さない）。
- **トレードオフ**: (a) は破壊的で後方互換性を失う。(c) は将来「うっかり migration されていない」検出機会を失う。warning-only は両者の中庸で、`--strict` フラグでオプトイン強化可能（research OC1）。
- **受け入れ基準**: `cli-spec-lint` FR-015 Scenario 3（「doc_type フィールド欠落は引き続きエラー」）が active change で fail し、archive で warning 止まりであること（implement で追加テスト 1 件）。

### Decision 2: design 2 ファイルは「推奨章立て + frontmatter 必須」の緩い enforcement

- **採用**: テンプレートには推奨章立てを雛形コメントで提示するが、`validate` は **frontmatter（`doc_type`）と末尾の Constitution Check 表のみ** を必須化。章見出しの厳格 enforcement は行わない。
- **代替**: (a) 章立て厳格固定、(c) 完全自由記述。
- **トレードオフ**: (a) は Diátaxis 公式が章立てを規定しない方針と齟齬し、テンプレ更新時に validate 実装も追従改修が必要となる。(c) は分割の意義（Reference 純度・Explanation 独立読解性）が緩み、Decisions が design.md に逆流するリスク。推奨章立て + frontmatter 必須が最小限の規律で目的達成。
- **受け入れ基準**: `artifact-taxonomy` FR-006 Scenario（「design ステップ完了時に 2 ファイルが揃う」）と `claude-integration` FR-022 Scenario 1（両ファイルの frontmatter と Constitution Check 存在を検証）が green。

### Decision 3: Summary は固定 2 サブ見出し `### Lessons` + `### Next Steps`

- **採用**: archive で生成する `## Summary (Lessons / Next Steps)` の内部構造を `### Lessons`（3-5 bullet）+ `### Next Steps`（2-4 bullet）に固定。全体 30 行・1,500 字以内。
- **代替**: (a) 章立て自由、(c) Lessons のみ。
- **トレードオフ**: (a) は AI 生成のばらつきが大きく Tutorial の learning experience が安定しない。(c) は「次に何を学ぶか」を提示できず Tutorial の起点機能が弱まる。固定 2 サブ見出しが AI 生成の予測可能性と Tutorial 性を両立。
- **受け入れ基準**: `claude-integration` FR-023 Scenario 1（「archive 後に readme まとめが埋まる」: Lessons と Next Steps の両 bullet が記述）が green。プレースホルダ残存時は FR-023 Scenario 2 で warning（research OC2 採用）。

### Decision 4: AI-Internal は `tasks.md` 1 件のみに適用、他は据え置き

- **採用**: 本 change で AI-Internal 化するのは `tasks.md` のみ。`checklist.md` / `glossary.md` / `architecture-overview.md` は Reference 据え置き。
- **代替**: (a) `tasks.md` + `checklist.md` の 2 件、(c) AI-Internal 概念を見送り全成果物を Diátaxis 4 種で表現。
- **トレードオフ**: (a) は `checklist.md` が `<!-- verify: human -->` で人間レビュアも一次読者である事実と矛盾。(c) は本 change の動機（人間が直接読まない `tasks.md` の Reference 化の不自然）を解消できない。1 件のみ適用が「primary consumer が AI のみ」の規律を保ちつつ最小実装。
- **受け入れ基準**: `artifact-taxonomy` FR-004 Scenario（「tasks.md template は AI-Internal として分類される」）が green、かつ他テンプレの doc_type が `EXPECTED_DOC_TYPES` 表で不変であること。

### Decision 5: テスト差分は `artifact-taxonomy-doc-type.e2e.test.ts` に集約

- **採用**: 主要差分はこの 1 ファイル（allow-list 拡張 + filename→type 対応表更新）。`template-doc-type-invariant.e2e.test.ts` には AI-Internal の locale-invariance 確認テスト 1 件を **任意追加**（必須ではない）。
- **代替**: (a) CLI 側に新規 doc_type validator モジュールを追加、(c) すべての doc_type を持つ change を一括検証する統合テストを新設。
- **トレードオフ**: (a) は既存 enforcement 場所と分散し責務が二重化、変更コスト増。(c) はスコープ拡大で本 change の核（テンプレ更新）を超える。1 ファイル差分が最小コストで全 Delta Spec の Scenario 群を green にできる。
- **受け入れ基準**: 既存 E2E テスト群（`artifact-taxonomy-doc-type.e2e.test.ts` + `template-doc-type-invariant.e2e.test.ts`）が全 green。

### Decision 6: AI-Internal は「Diátaxis 4 種 + 直交ラベル」として位置付け、SoT タイトル改名は後続 change

- **採用**: AI-Internal は Diátaxis 4 種を置き換えず **5 番目の直交軸**。`artifact-taxonomy` SoT spec の FR-002 タイトル `"doc_type value is constrained to the four Diátaxis types"` は本 change では維持し、後続 change（archive 直後に起票、research OC5）で RENAMED 扱い。
- **代替**: (a) 本 change で同時に RENAMED、(c) タイトルは恒久的に旧名のまま。
- **トレードオフ**: (a) は MODIFIED + RENAMED の同時適用が archive マージで未知のリスクを生む（既存 archive コマンド実装は MODIFIED と RENAMED の組み合わせケースが既存 change では発生していない）。(c) は仕様タイトルと実態の永続的乖離を残す。後続 change での RENAMED 単独適用が最も安全。
- **受け入れ基準**: 本 change archive 完了直後に `mspec new rename-fr-002-doc-type-title` を起票（implement の Migration Plan に記載）。

## Constitution Check (Phase 1, 計画詳細後)

Phase 1 では実装計画の詳細（Project Structure と Decisions）を踏まえて再評価する。

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ⚠️ | ✅ | Phase 0 で懸念した「archive が readme.md を編集する初事例」は、編集対象が **同一 change ディレクトリ内** に閉じており他成果物の Delta Spec 等には影響しない。さらに更新箇所は `## Summary (Lessons / Next Steps)` のプレースホルダ固定位置のみで冪等性が保たれる。Phase 1 で ✅ に格上げ。 |
| II. 決定論的マージ | ✅ | ✅ | Delta Spec マージ仕様（ADDED/MODIFIED/REMOVED/RENAMED）には一切手を入れない。FR-002 タイトル改名は別 change で RENAMED 適用するため二重操作リスクなし（Decision 6）。 |
| III. 質問駆動の要件確定 | ✅ | ✅ | proposal 4 問 + research 1 問の AskUserQuestion で全 Open Questions を resolve、design Decisions に Source 付きで記録済み。 |
| IV. 双方向アンカー | — | — | テンプレ構造とフロー定義の変更のみで、Delta Spec ↔ tasks.md ↔ 実装の anchor 仕組みには影響しない。Phase 1 でも非該当。 |
| V. 強制ステップと拡張ステップの分離 | ⚠️ | ⚠️ | `design-rationale.md` 必須化と `archive` での `readme.md` Summary 追記必須化は強制 / 拡張の境界を変える。ただし軽量モード（typo / minor / bugfix）では design ステップ全体が（既存 `modes.typo.skip` で）スキップされるため design-rationale も自動的にスキップされ、archive の Summary も該当 change が archive まで到達しないため発生しない。実害は限定的だが Phase 1 でも ⚠️ を保持し、将来の Constitution 改訂で「強制ステップ内のサブ成果物追加」を明文化するか議論を残す。 |

### Complexity Tracking

⚠️ 1 件（原則 V）。次の理由で単純化案を採用しない:

- **原則 V（⚠️）**: `design-rationale.md` を任意化する単純案は、ユーザーの「設計意図と構造を 1 ファイルに混在させない」という proposal 段階の要求と直接矛盾する。両方必須化により Reference の純度と Explanation の独立読解性が担保される。軽量モードでは design ステップごとスキップされる既存仕組みにより実害は限定的。

## Migration Plan / Rollout

1. **本 change の implement**: 上記 Project Structure の全ファイルを TDD（red → green）で更新。E2E `artifact-taxonomy-doc-type.e2e.test.ts` の差分を最初に red にし、テンプレ更新で green に倒す手順。
2. **本 change の self-review**: `mspec-self-reviewer` subagent が全成果物・diff・テスト結果を独立に再点検。
3. **本 change の archive**: `mspec archive` が SoT (`specs/{artifact-taxonomy,claude-integration,cli-workflow-engine,cli-spec-lint}/spec.md`) に Delta Spec を決定論的にマージ。本 change directory は `changes/archive/` に移動。
4. **直後の後続 change 起票**: archive 完了直後に `mspec new rename-fr-002-doc-type-title` を実行し、`artifact-taxonomy` FR-002 タイトルの RENAMED change を起票（research OC5、Decision 6）。
5. **本 change archive 後の最初の change から新体系適用**: その change の `mspec new` 時に新テンプレ（Tutorial readme・design-rationale テンプレ・AI-Internal tasks）が自動展開され、新体系の運用が始まる。
6. **Grandfather 期間**: 既存 `changes/archive/*` 配下は warning-only で残存（Decision 1）。明示的な移行コマンドは提供しない（Non-Goal）。

## Self-Review

> Reviewer: mspec-self-reviewer (independent pass)
> Date: 2026-05-18

### Verdict
APPROVED WITH CHANGES

### Critical Findings (block implement)

なし。Risk #2 を精査した結果、「Critical」ではなく「Important」と判定した（根拠は Important #1 を参照）。

### Important Findings (fix during implement)

1. **Decision 5 と cli-spec-lint FR-015 Scenario 2 の責務不整合 (test-only diff vs CLI error message 要件)** —
   - design.md:104-109 (Decision 5) は「主要差分はこの 1 ファイル（allow-list 拡張 + filename→type 対応表更新）」と述べ、CLI 側実装変更を明確に否定している。
   - 一方 `specs/cli-spec-lint/spec.md:15-19` の FR-015 Scenario 2 は次の AND を要求する:
     > THEN doc_type 検証がエラーとして「`Mixed` is not a valid doc_type; allowed: Reference, Explanation, How-to, Tutorial, AI-Internal」を報告する
     > AND 終了コード非ゼロで終了する
   - これは `mspec validate` という **CLI コマンド** の標準出力／終了コード要件であり、E2E test の表のみでは満たせない。実証として `grep` で `packages/cli/src/` 配下に doc_type 値 enforcement は皆無（`new.ts:136` の literal のみ）。同じことを checklist Risk #2 も指摘している。
   - **Delta Spec 側が「実装が必要」と読める強い文言**である以上、勝つのは Delta Spec。design Decision 5 はこの責務を取りこぼしている。
   - **推奨修正**: design Decision 5 を改訂し「`artifact-validator.ts` または `validate.ts` に doc_type 値 enforcement を新規追加（許容値外を error として `<value> is not a valid doc_type; allowed: ...` 形式で報告）」を含むようにする。**Scenario の文言が「validate」と明記している以上、CLI 実装追加が本筋**。tasks 段階で T-NNN を確実に振る。

2. **artifact-validator.ts の readme Summary placeholder warning ルールが「Decision」に昇格していない** — design.md:66 は `packages/cli/src/lib/artifact-validator.ts` への「`readme.md` 末尾 Summary プレースホルダ残存を warning として報告するルール追加（research OC2）」を Modifying としているが、これは claude-integration FR-023 Scenario 2 の達成手段である。Important #1 と同根の責務分担問題。
   - **推奨修正**: design.md に Decision 7 を新設し「readme.md Summary プレースホルダ検知は `artifact-validator.ts` の新規ルールで実装する。warning 既定、`--strict` で error 昇格（research OC1/OC2）」を明記する。

3. **FR-022 番号衝突（claude-integration と cli-workflow-engine の両方で FR-022 を新規採番）** — Delta Spec は capability スコープで番号付けされるため形式上は衝突しないが、checklist の `<!-- verify: fr-022 -->` アノテーションは capability を明示しないため、`mspec-implement` が同一 FR とみなして cross-spec の検証マッピングを誤る可能性がある。
   - **推奨修正**: checklist のアノテーションを `<!-- verify: claude-integration/fr-022 -->` および `<!-- verify: cli-workflow-engine/fr-022 -->` のように capability prefix 付きにする。`mspec-implement` の parser が `/` を許容しない場合は片方 FR を再採番（例: cli-workflow-engine 側を FR-023 に）して衝突解消。

### Minor Findings (record but don't block)

1. **quickstart.md 手順 2 のシェル展開が非決定的** — `changes/$(mspec status --json | jq -r '.change')/readme.md` というパターンは `.change` フィールドが change directory full path / id / basename のいずれかによって挙動が変わる。`<id>` プレースホルダで統一する手順 3-7 と一貫させたほうが安全。

2. **research D5 の見出しと本文の齟齬** — D5 冒頭は「2 ファイル両方を更新」と述べつつ本文では「`template-doc-type-invariant.e2e.test.ts` は改修不要」と結論。Decision 5 で「任意追加」に統合され実害はないが、research の見出しは混乱を招く。

3. **bootstrap paradox の明記が design.md と quickstart.md のみ** — proposal.md と readme.md は「本 change 自身が旧/新どちらの体系で進むか」を述べていない。新規参加者が混乱する可能性。

4. **FR-002 タイトル不整合のアンカー先が曖昧** — checklist.md:21 の `verify: human` 確認対象を「design.md Decision 6」に明示すべき（本 change では bootstrap paradox により `design-rationale.md` が不在のため、Decision 6 への verify アンカーが事実上の代替）。

5. **archive ステップ順序問題（Risk #4 と整合）** — architecture-overview.md sequence diagram は step 3b → step 4 の順序を描いているが、SKILL.md 改訂時にこの順序が崩れる可能性。tasks 化時に順序保証のテストか手順チェックを設けたい。

### Cross-Artifact Consistency Map

| Concern | proposal | research | delta | design | checklist | Verdict |
|---------|----------|----------|-------|--------|-----------|---------|
| AI-Internal definition | "AI が消化する成果物" | "primary consumer is AI" + 5th orthogonal label (D6) | "primary consumer is the AI agent rather than a human reviewer" (FR-001) | "primary consumer が AI のみ" (Decision 4) | （定義言及なし、間接表現） | **consistent** |
| Bootstrap paradox stance | 言及なし | 言及なし | 言及なし | 明示 (design.md:11) | 言及なし | **drift (design.md 集中)** |
| FR-002 title rename timing | 言及なし | OC5: archive 直後に後続 change | 注記で「後続 change で RENAMED」(spec.md:58) | Decision 6: 後続 change | "Decision 6 の方針が design-rationale に明記" | **consistent** (bootstrap paradox による `design-rationale.md` 不在を checklist が見落とし) |
| Summary section structure | "末尾に...まとめ" | D3: Lessons + Next Steps 固定、30 行/1500 字以内 | FR-023: Lessons / Next Steps 明示、bullet 数まで | Decision 3: 同 | FR-023 bullets 3-5 / 2-4 | **consistent** |
| Where doc_type validation lives (test vs CLI) | 言及なし | D5: テスト 1 ファイル + 任意追加、CLI 改修不要 | FR-015 Scenario 2 が validate error + 非ゼロ終了 + 具体 message を要求 | Decision 5: テスト 1 ファイル集約、CLI 改修不要 | Risk #2 で矛盾を明示 | **conflict (Important #1)** |

### Constitution Re-Check (Phase 0, independent)

| Principle | Reviewer's Phase 0 | Matches design? | Notes |
|-----------|--------------------|-----------------|-------|
| I. ステップ独立性 | ⚠️ | yes | archive が同一 change 内とはいえ他成果物 (readme.md) を編集する初事例。Phase 1 ✅ 格上げ判定は同意（同 change 内・冪等位置）。 |
| II. 決定論的マージ | ✅ | yes | Delta Spec マージ仕様には触らない。 |
| III. 質問駆動の要件確定 | ✅ | yes | resolve 済み、ただし Important #1 は新たな未解決問題として表出（CLI vs test 責務）。 |
| IV. 双方向アンカー | — | yes | テンプレ構造変更のみで非該当。ただし Important #3（FR-022 番号衝突）が将来アンカーマッピングに影響する潜在リスクを残す。 |
| V. 強制ステップと拡張ステップの分離 | ⚠️ | yes | `design-rationale.md` 必須化＋archive Summary 必須化は強制範囲拡大。Phase 1 でも ⚠️ 保持は妥当。 |

### Recommendations for `tasks.md`

- **T-NNN (Important #1 への対応)**: `packages/cli/src/lib/artifact-validator.ts`（または `packages/cli/src/commands/validate.ts`）に doc_type 値 enforcement ルールを新規追加。許容値外を error として `<value> is not a valid doc_type; allowed: Reference, Explanation, How-to, Tutorial, AI-Internal` の形式で報告。E2E テスト 1 件（`Mixed` 投入時に上記 message と非ゼロ終了を assert）を追加。anchor: `verify: cli-spec-lint/fr-015 (Scenario 2)`。
- **T-NNN (Important #2 への対応)**: `packages/cli/src/lib/artifact-validator.ts` に `readme.md` 末尾 Summary プレースホルダ残存検知ルールを追加（warning 既定）。`--strict` で error 昇格する分岐の既存 `mspec validate` 実装パスを確認しテスト追加。anchor: `verify: claude-integration/fr-023 (Scenario 2)`。
- **T-NNN (Important #3 への対応)**: checklist.md の `<!-- verify: fr-022 -->` を `<!-- verify: <capability>/fr-022 -->` 形式へ正規化（claude-integration と cli-workflow-engine の混同回避）。`mspec-implement` 側の parser が `/` 不可なら片方 FR を再採番（例: cli-workflow-engine 側を FR-023 に）して衝突解消。
- **T-NNN (Minor #5 への対応)**: `mspec-archive` SKILL.md 改訂時、step 3b の **実行位置（step 4 の `mv` より前、step 3 のマージ検証より後）** を SKILL Procedure 内の番号付きリストで明示し、E2E または skill-procedure regression テストで順序を固定。
- **T-NNN (Minor #4 への対応)**: checklist.md:21 の `<!-- verify: human -->` 確認対象を「design.md Decision 6 / design-rationale.md（後続 change で生成）」と明示。本 change では bootstrap paradox により `design-rationale.md` は不在のため、Decision 6 への verify アンカーが事実上の代替であることを記録。

### 関連ファイル（tasks で触る/作る対象）

- `/Users/kagadminmac/project/mspec/packages/cli/src/lib/artifact-validator.ts`
- `/Users/kagadminmac/project/mspec/packages/cli/src/commands/validate.ts`
- `/Users/kagadminmac/project/mspec/packages/cli/tests/e2e/artifact-taxonomy-doc-type.e2e.test.ts`
- `/Users/kagadminmac/project/mspec/changes/2026-05-18-044538-revise-artifact-taxonomy/specs/cli-spec-lint/spec.md`（必要なら Scenario 2 文言を再確認）
- `/Users/kagadminmac/project/mspec/changes/2026-05-18-044538-revise-artifact-taxonomy/checklist.md`（verify アノテーションの capability prefix 化）
