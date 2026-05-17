---
doc_type: Reference
---

# Design: 成果物の言語統制と EARS 多言語化

## Summary

`config.yaml` のトップレベルに `locale` キーを新設し、その値に応じて成果物テンプレートと質問バンクをロケール別解決する。EARS 記法は国際慣行に倣いキーワード（SHALL/WHEN/THEN/GIVEN ほか）を英語のまま維持し、本文のみロケール化する。既定値は `ja`、`en` を universal fallback とする。

## Goals

- `mspec new`, `mspec questions`, `mspec init` 等の全コマンドが `locale` 設定に追従して出力する。
- ロケール解決は単一の `lib/locale-resolver.ts` に集約し、各コマンドは active locale を引数として受け取る形に統一する。
- 翻訳欠落は ハードエラーではなく `en` フォールバック ＋ stderr 警告とし、CI で検知可能にする。
- 既存英語 spec / 旧スカラ表記の質問バンクとの完全な後方互換を維持する。

## Non-Goals


- CLI 出力（`✓ Created ...` 等）の多言語化は対象外。
- SKILL.md / skill prompt 本体の動的多言語切替は対象外。
- 既存 archive 済み SoT spec の遡及書き換えは行わない（後方互換規定で validate 通過するため不要）。
- 翻訳メモリ管理（gettext .po 等）は対象外。
- `spec-forbidden.ts` の禁止語彙日本語化は別 change で対応（Out-of-Scope, proposal §Non-Goals）。

## Technical Context

- Language / Runtime: TypeScript (Node.js >= 18)、ESM。
- Dependencies (new): なし（既存の `yaml` / `zod` / `gray-matter` / `picocolors` で完結）。
- Storage: ファイルシステム（`packages/cli/templates/` 配下と `.mspec/templates/` user overrides）。
- Testing framework: vitest（既存スイートに locale 解決とテンプレ解決のユニット＋ E2E 追加）。
- Target platform: Claude Code CLI 上の Node.js (macOS / Linux / Windows)。
- Performance / Constraints: テンプレ走査は init / new 時のみで現状と同等のオーダ（O(num_templates)）。stderr 警告は重複抑止のため (locale, artifact) を Set でキャッシュ。

## Constitution Check (Phase 0)

| Principle | Compliant? | Notes |
|-----------|-----------|-------|
| I. ステップ独立性 | ✅ | design は research を入力とし、後続 quickstart / checklist / tasks に副作用を持たせない |
| II. 決定論的マージ | ✅ | locale 解決はファイル実在順序に依存しない（ISO 639-1 ソート確定）。delta merge ルール非干渉 |
| III. 質問駆動の要件確定 | ✅ | Open Choice 残存 2 件は推奨が明確で本ステップで確定、ユーザー分岐ある場合のみ AskUserQuestion |
| IV. 双方向アンカー | ✅ | `## Decisions` を Delta Spec Scenario に紐付け、tasks.md で実装アンカーを補完する設計 |
| V. 強制ステップと拡張ステップの分離 | ✅ | design は強制ステップとして workflow.default.yaml に定義済み |

## Project Structure (changes)

### 新規ファイル

- `packages/cli/src/lib/locale-resolver.ts` — `resolveLocale(config) → string`, `scanSupportedLocales(templatesDir) → Set<string>`, `validateLocale(code, supported) → Result`
- `packages/cli/src/lib/template-resolver.ts` — `resolveTemplate(artifact, locale, templatesDir) → { content, usedLocale, fellBack }`, `emitFallbackWarning(artifact, requested, used)`
- `packages/cli/src/lib/locale-resolver.test.ts` — 単体テスト（既定値、未対応コード、拡張ポイント）
- `packages/cli/src/lib/template-resolver.test.ts` — 単体テスト（解決、フォールバック、警告）
- `packages/cli/templates/artifacts/readme.ja.md`, `readme.en.md` — `new.ts` ハードコード移行用
- `packages/cli/templates/artifacts/glossary.ja.md`, `glossary.en.md` — 同上
- `packages/cli/templates/artifacts/{proposal,delta-spec,research,design,architecture-overview,quickstart,checklist,tasks}.en.md` — 8 ファイル（en 版整備）

### 修正ファイル

- `packages/cli/src/types/config.ts` — `RootConfigSchema` にトップレベル `locale: z.string().regex(/^[a-z]{2}$/).optional()` を追加
- `packages/cli/src/workflow/config-loader.ts` — `loadConfig` の戻り値後段で `resolveLocale()` を呼び、戻り値型を `{ locale, unsupported, requested, supported }` 拡張形に変更。`unsupported=true` でも **throw しない**（warning は emitFallbackWarning 経由で stderr に 1 度だけ出力。exit は非ゼロにしない）
- `packages/cli/src/commands/validate.ts` — `loadConfig` 戻り値の `unsupported=true` を検知した場合、stderr に `unsupported locale: <code>` と `supported: <list>` を出力した上で exit code 1 を返す（FR-003 の `mspec validate` 専用挙動を validate コマンド側で吸収）
- `packages/cli/templates/config.default.yaml` — トップレベル `locale: ja` を追加（コメント付き）
- `packages/cli/src/types/questions.ts` — `QuestionSchema` の `question` / `options` を `z.union([z.string(), z.record(z.string())])` に拡張（後方互換のためスカラも受理）
- `packages/cli/src/lib/questions-bank.ts` — `loadMergedBank(locale)` シグネチャ、`localizeQuestion(q, locale) → Question` 追加、欠落時 en フォールバック ＋ 警告
- `packages/cli/src/commands/questions.ts` — `loadConfig()` 経由で locale を取得し `loadMergedBank` に渡す
- `packages/cli/src/commands/new.ts` — `buildReadme` / `buildGlossary` を削除し `resolveTemplate('readme', locale)` 経由で内容取得
- `packages/cli/src/commands/init.ts` — `findTemplatesDir` 後、`<name>.<locale>.md` の locale 接尾辞を `<name>.md` に正規化して書き出し
- `packages/cli/src/commands/delta-init.ts` — `buildDeltaSkeleton` の placeholder 文字列を locale 別バンドルから取得（EARS キーワードは英語維持）
- `packages/cli/templates/questions/proposal.yaml` 他 3 ファイル — 既存スカラ文言を `question: { ja: "..." }` 形式へ変換、`en` 翻訳を追加
- `packages/cli/templates/artifacts/{proposal,delta-spec,research,design,architecture-overview,quickstart,checklist,tasks}.md` — `*.ja.md` にリネーム（移動）
- `README.md` — `## Locale Configuration` セクションを追加（`locale: ja` 設定方法、対応言語一覧、拡張手順）

### 削除ファイル

- なし（リネームのみ。`git mv` で履歴維持）

## Decisions

各意思決定の **受け入れ基準** は Delta Spec の Scenario (GIVEN/WHEN/THEN) と対応する。tasks.md ではこの対応を引用してアンカー付き E2E タスクを生成する。

### D1. トップレベル `locale` キーの新設

- 採用: `config.yaml` のトップレベルに `locale: ja` を新設。`RootConfigSchema` に `locale: z.string().regex(/^[a-z]{2}$/).optional()` を追加。
- 代替: `project.language` 再利用（既存 "typescript" 値と意味衝突のため却下）／`project.artifact_language`（冗長のため却下）。
- トレードオフ: 既存 `.mspec/config.yaml` に新キーが必要となるが、未指定時は `ja` フォールバックで非破壊。README に追記する。
- 受け入れ基準: spec `language-config` の **FR-001 Scenario「config.yaml に locale: ja が設定されている」** / **FR-002 Scenario「locale キーが config.yaml に存在しない」** / **FR-003 Scenario「未対応の locale が指定される」** / **FR-004 Scenario「サードパーティが zh ロケールを追加する」**

### D2. テンプレートは `<name>.<locale>.md` で言語別分割

- 採用: `templates/artifacts/proposal.ja.md`, `proposal.en.md` 形式。新規 `template-resolver.ts` が `<name>.<locale>.md` → `<name>.en.md` → `<name>.md` の順で探索しフォールバック警告を emit。
- 代替: YAML frontmatter にロケール値を集約（init.ts の単純 writeFile 構造を壊すため却下）／ディレクトリ別 `templates/artifacts/ja/*.md`（パス分岐が増えるため却下）。
- トレードオフ: ファイル数が `10 × num_locales` に増えるが Hugo / Jekyll 標準と一致し、追加言語投入が単純（FR-004 language-config と整合）。
- 受け入れ基準: spec `artifact-templates-i18n` の **FR-001 Scenario「active locale が ja でテンプレートを取得する」** / **FR-002 Scenario「ja テンプレートが欠落している」** / **FR-003 Scenario「全テンプレートが日本語化されている」** / **FR-004 Scenario「doc_type フロントマターは翻訳対象外」**

### D3. 質問バンクは同一 YAML 内のロケールキー集約

- 採用: `question: { ja: "...", en: "..." }`, `options: { ja: [...], en: [...] }`。Zod 側で `z.union([z.string(), z.record(z.string())])` で受理し、スカラ文字列は en 扱い（後方互換）。
- 代替: 言語別 YAML 分割（`id` 同期コストが大きいため却下）。
- トレードオフ: YAML が縦に長くなるが、id 等の構造的フィールドの単一管理を維持できる。
- 受け入れ基準: spec `question-bank-i18n` の **FR-001 Scenario「active locale が ja で proposal フェーズの質問を取得」** / **FR-002 Scenario「question スキーマに ja / en の両キーを含められる」** / **FR-003 Scenario「一部質問のみ ja 翻訳が欠落している」** / **FR-004 Scenario「旧形式の質問エントリが残存している」**

### D4. EARS キーワードは英語維持、本文のみロケール化

- 採用: `Requirement:` / `Scenario:` の H3/H4 識別子と `SHALL/MUST/WHEN/IF/WHILE/WHERE/THEN/GIVEN` キーワードは英語固定。テンプレ生成側で必ず英語キーワードを含める。validate は本文の言語を判定しない（既存 `REQUIREMENT_RE` / `SCENARIO_RE` を変更せず）。
- 代替: 完全日本語化（validate 正規表現の総書換えと既存 spec の後方互換破壊のため却下）。
- トレードオフ: 英語キーワードと日本語本文の混在文体になるが、IEEE / Mavin の国際慣行および国内 SDD 解説記事（iret.media, ビジネスガレージ）の主流パターンと一致。
- 受け入れ基準: spec `ears-validation-i18n` の **FR-001 Scenario「ja ロケールでも EARS キーワードは英語のまま生成される」** / **FR-002 Scenario「日本語本文の Requirement が validate を通過する」** / **FR-003 Scenario「ja ロケール下で既存の英語 spec を検証する」** / **FR-004 Scenario「ja ロケールでも Scenario アンカーは英語識別子」**

### D5. ロケール解決の責務分離

- 採用: 新規 `lib/locale-resolver.ts` を Single Source of Truth とし、`resolveLocale(config)` と `scanSupportedLocales(templatesDir)` の 2 関数を公開。コマンド層は locale 文字列のみを受け取る（配線の疎結合化）。**`resolveLocale` および `loadConfig` 共に `unsupported=true` でも throw せず、`{ locale, unsupported, requested, supported }` で結果通知する**。非ゼロ exit は `mspec validate` コマンド本体が責務として担い、`mspec new` / `mspec questions` / `mspec init` 等は warning のみで処理継続する（FR-002 / FR-003 の責務分担をここで確定）。
- 代替: 各コマンド内で個別に解決（コード重複・テスト困難で却下）／`loadConfig` 段で throw（FR-003 の `mspec validate` 専用挙動と矛盾するため却下）。
- トレードオフ: モジュール 1 つ増えるが、Constitution I（ステップ独立性）と V（強制/拡張分離）に対し副作用が分離される。
- 受け入れ基準: spec `language-config` の **FR-003 Scenario「未対応の locale が指定される」**（`commands/validate.ts` 側で `unsupported=true` を検知して exit code 1 / stderr 出力） / **FR-004 Scenario「サードパーティが zh ロケールを追加する」**（`scanSupportedLocales` の動的検出）

### D6. 警告抑止とトレース

- 採用: stderr 警告は `(locale, artifact, question_id)` の三つ組で重複抑止し、同一実行内で 1 回のみ emit。**warning メッセージは active locale に依存せず英語固定**（`missing template:` / `missing translation:` / `unsupported locale:` / `default locale 'ja' applied` 等）。`--json` モードでも stderr 出力は維持し、stdout の JSON 構造には影響させない（stdout クリーン契約）。
- 代替: 重複抑止なし（CI ログが膨大になるため却下）／JSON 構造化警告（`--json` モードのみで採用）。
- トレードオフ: テストで Set のクリアが必要だが、`beforeEach` で対応可能。
- 受け入れ基準: spec `artifact-templates-i18n` の **FR-002 Scenario「ja テンプレートが欠落している」**（stderr `missing template:` 警告） / spec `question-bank-i18n` の **FR-003 Scenario「一部質問のみ ja 翻訳が欠落している」**（stderr `missing translation:` 警告）。同一 `(locale, artifact, question_id)` 三つ組について同一実行内で 1 回のみ emit する重複抑止を ユニットテストで担保。

## Constitution Check (Phase 1, 計画詳細後)

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | ✅ | locale 解決は単一モジュールに集約され、各ステップは active locale を引数として受け取るだけで他ステップに副作用なし |
| II. 決定論的マージ | ✅ | ✅ | テンプレ解決は `<name>.<locale>.md` → `<name>.en.md` → `<name>.md` の決定順、フォールバック警告も決定論的。archive 時の SoT merge ルール（delta merge）は変更しない |
| III. 質問駆動の要件確定 | ✅ | ✅ | proposal / research 段階で 5 件の分岐をユーザー確定、design では推奨明確な残 Open Choice 2 件を本設計で確定 |
| IV. 双方向アンカー | ✅ | ✅ | 設計→Delta Spec の対応は D1〜D6 各エントリで Scenario 名を完全一致引用済み（D1〜D4 / D5 / D6）。Delta Spec→設計の逆方向アンカーは `architecture-overview.md` Data Model の `DELTA_SPEC` エンティティが英語アンカー識別子（`Requirement: FR-NNN` / `Scenario:` / `<!-- @mspec-delta ... -->`）を保持する構造として保証。tasks.md 生成時に各タスクへ 3 行アンカーブロック（`@mspec-delta` / `Requirements implemented` / `Change`）を付与する義務は `checklist.md` L78 `<!-- verify: human -->` で実体追跡。Self-Review F7 action item を必達とする |
| V. 強制ステップと拡張ステップの分離 | ✅ | ✅ | design は強制ステップ、本変更で workflow.default.yaml の構造は変えない。locale-resolver は library として参照されるだけで step 化しない |

### Complexity Tracking

None

## Migration Plan / Rollout

1. **Phase A: 基盤導入 (非破壊)**
   - `RootConfigSchema` に `locale` 追加、`locale-resolver.ts` 新規作成
   - `template-resolver.ts` 新規作成、既存テンプレ `*.md` を `<name>.md` でも引き続き解決可能とする（後方互換層）
   - 既存ユーザーの `.mspec/config.yaml` は `locale` 未指定でも `ja` 既定で動作

2. **Phase B: テンプレ移行**
   - 既存 `templates/artifacts/*.md` を `*.ja.md` にリネーム（`git mv` で履歴維持）
   - `*.en.md` を新規追加（既存内容を base に英訳整備）
   - `templates/questions/*.yaml` を `{ja: ..., en: ...}` 構造に変換

3. **Phase C: ハードコード移行**
   - `new.ts` の `buildReadme` / `buildGlossary` をテンプレ読込に置換
   - `delta-init.ts` の placeholder 文字列を locale 別バンドル化

4. **Phase D: 検証 ＋ ドキュメント**
   - E2E: `locale: ja` で `mspec new sample → proposal → delta → ...` を実行し全成果物が日本語化されることを確認
   - 既存テンプレ・skill の英語残骸 grep がゼロ
   - README に locale 設定方法と拡張ガイドを追記

5. **Phase E: リリース**
   - CHANGELOG に破壊的変更なし、新規 `locale` キー追加を周知
   - `mspec validate` が未対応 locale を検出することを CI で確認

## Self-Review

> Reviewer: mspec-self-reviewer | Date: 2026-05-16 | Status: PASS_WITH_NOTES（Blocker F1 / Major F4・F5 を本セクション追記時点で修正反映済み。残課題は tasks / implement で消化）

### Findings

#### F1. proposal の `language` フィールド名と design / Delta Spec の `locale` キー名の不一致 — RESOLVED
- Severity: Blocker
- Artifact(s): `proposal.md`, `design.md`, `specs/language-config/spec.md`, `checklist.md`
- Observation: proposal §Goals では「`config.yaml` に `language` フィールドを追加」と書かれていたが、design / quickstart / architecture-overview / 確定済 research では `locale` を採用。Delta Spec の Scenario 本文も `language: ja` を参照していた。
- Resolution (本セクション追記と同時に反映済み): proposal.md §Why / §Goals / §Capabilities / §Open Questions の表記を `locale` に統一、`specs/language-config/spec.md` の FR-001〜FR-004 本文と Scenario の `language:` を `locale:` に置換、checklist.md L13 の両論併記を削除し全体を `locale: ja` に統一、design.md D1 受け入れ基準内の Scenario 名引用も `locale:` に整合化。

#### F2. quickstart Step 4 と FR-003 (`mspec validate` 専用挙動) の整合
- Severity: Major
- Artifact(s): `quickstart.md` Step 4, `specs/language-config/spec.md` FR-003, `design.md` §修正ファイル `config-loader.ts`
- Observation: design.md L62 では `loadConfig` 後段で `UnsupportedLocaleError` を `ConfigError` として送出する設計だが、Delta Spec FR-003 の Scenario は `mspec validate` 専用挙動として記述されているため、`mspec new` 等でも同じエラーパスが先に発火し受け入れ基準と矛盾し得る。quickstart Step 4 の `<最新の change>` プレースホルダもコピペ実行できない。
- Action Item: tasks.md で「`loadConfig` は警告のみ・`mspec validate` のみ exit 非ゼロ」とする設計小修正タスクを追加、または FR-003 Scenario の対象コマンドを汎用化。quickstart 例示を `changes/$(ls -1t changes | head -1)` などで決定論的に書く。

#### F3. `init.ts` 走査ルールの欠落（artifacts 配下のみロケール解決）
- Severity: Major
- Artifact(s): `design.md` §修正ファイル `init.ts`, `packages/cli/src/commands/init.ts`
- Observation: 既存 `init.ts` は `templates/` 配下を一括 `readdir` して `.mspec/config.yaml`、`memory/constitution.md`、`.claude/skills/mspec-*/SKILL.md` をそのまま配置している。`<name>.<locale>.md` を `<name>.md` に正規化する処理を全 readdir 対象に適用すると、ロケール接尾辞を持たないテンプレートも誤って正規化され得る。
- Action Item: tasks.md に「`templates/artifacts/` 配下のみロケール解決、それ以外（`memory/`, `.claude/`, `config.default.yaml` 等）は素通しコピー」と明示する実装タスクを追加。設計小修正として design.md §修正ファイル `init.ts` のエントリにこの分岐ルールを後日反映予定。

#### F4. D5 / D6 の受け入れ基準が Scenario 名引用形式と粒度乖離 — RESOLVED
- Severity: Major
- Artifact(s): `design.md` D5 (L114), D6 (L121)
- Observation: D5 が「validate エラー伝播」「拡張ポイント検出」と概念のみ、D6 が「Scenario『警告が出力される』」と存在しない Scenario 名を引用していた（実 Scenario 名は「ja テンプレートが欠落している」「一部質問のみ ja 翻訳が欠落している」）。
- Resolution (本セクション追記と同時に反映済み): D5 / D6 の受け入れ基準を D1〜D4 と同一書式（Scenario 名完全一致引用）に書き直し済み。

#### F5. FR-002 language-config を Unwanted Behavior から State-Driven に変更 — RESOLVED
- Severity: Major
- Artifact(s): `specs/language-config/spec.md` FR-002
- Observation: 「未指定 → 既定値適用」は正常パスであり、`If` 始まり（Unwanted Behavior）より `While` 始まり（State-Driven）が EARS パターンとして適切。
- Resolution (本セクション追記と同時に反映済み): FR-002 を `While locale is unset in config.yaml, the system SHALL apply ja as the default locale ...` に書き換え。

#### F6. checklist.md に README.md 更新の verify 項目が欠落
- Severity: Major
- Artifact(s): `proposal.md` §Goals (README 追記宣言), `design.md` §修正ファイル `README.md`, `checklist.md`
- Action Item: tasks.md で「README.md `## Locale Configuration` セクション追加」を独立タスクとして起票、tasks 完了時の checklist フォローアップに以下項目を追加: 「README.md に `## Locale Configuration` セクションが追加され、(a) `locale: ja` 設定方法、(b) 対応言語の追加手順、(c) 既定値 `ja` / fallback `en` の挙動説明、(d) ISO 639-1 二文字コード制約 を全て含む `<!-- verify: human -->`」。

#### F7. design.md Phase 1 Constitution IV の実体根拠が薄い
- Severity: Minor
- Artifact(s): `design.md` Phase 1 Constitution Check (Principle IV)
- Action Item: tasks.md で各タスクに `<!-- @mspec-delta 2026-05-16-052329-artifact-language-config/specs/<capability>/spec.md -->` `<!-- Requirements implemented: FR-NNN -->` `<!-- Change: artifact-language-config -->` の 3 行アンカーを必ず付与し、Phase 1 IV の根拠を tasks 段階で実体化。

#### F8. `RootConfigSchema` の strict/passthrough 確認の欠落
- Severity: Minor
- Artifact(s): `design.md` §修正ファイル `types/config.ts`
- Action Item: tasks.md の Zod 拡張タスクに「`RootConfigSchema` が `.strict()` でないことを事前確認、または `.extend({ locale: ... })` を使い既存キーへの影響を unit test で確認」を含める。

#### F9. quickstart `sed -i.bak` バックアップ累積問題
- Severity: Minor
- Artifact(s): `quickstart.md` Setup / Step 5 / Step 6 / Verify
- Action Item: quickstart.md を `sed -i ''`（BSD sed バックアップなし）に置換、または Verify の grep に `--exclude='*.bak'` を併記。tasks.md 完了時に quickstart 微修正タスクを生成。

#### F10. stderr 警告を英語固定とする方針の明示
- Severity: Minor
- Artifact(s): `design.md` §Non-Goals / §Decisions D6, `specs/language-config/spec.md` FR-002 Scenario
- Action Item: tasks.md または別 PR で design.md §Decisions D6 末尾に「stderr 警告は active locale に依存せず英語固定」と明記する微修正タスクを起票。FR-002 Scenario の英語メッセージ要求と整合させる。

#### F11. Migration Plan Phase A での legacy warning 抑止戦略
- Severity: Minor
- Artifact(s): `design.md` Migration Plan Phase A / B, `architecture-overview.md` Fallback Decision Tree
- Action Item: tasks.md に「Phase A 期間は legacy fallback の warning を出さない（`<name>.md` を warning なしで許容）、Phase B 完了後の delivery で warning を有効化する」roll-forward 戦略を tasks.md 内に明記。

#### F12. checklist の項目間依存関係の可視化
- Severity: Info
- Artifact(s): `checklist.md` `## Delta Spec Coverage`
- Action Item: tasks.md 着手前に checklist 冒頭へ依存関係マッピング表を追加し、E2E テストの重複実行を回避（language-config FR-001 ⊂ artifact-templates-i18n FR-003 等）。

#### F13. 英語残骸 grep の許容語ホワイトリスト
- Severity: Info
- Artifact(s): `design.md` D4, `proposal.md` Open Questions
- Action Item: tasks.md または別 PR で design.md D4 直下に「英語残骸 grep の許容語ホワイトリスト（`Constitution Check`、`Scenario`、`Requirement:`、`FR-\d+`、EARS キーワード、Mermaid 識別子、`doc_type` 値、コードフェンス内識別子）」を追加する微修正タスクを起票。

### Action Items (tasks / implement で消化する残課題)

- [ ] F2: `loadConfig` の未対応 locale エラー伝播範囲を `mspec validate` 専用挙動に統一、または FR-003 Scenario の対象コマンドを汎用化（タスク化）
- [ ] F2: quickstart.md Step 4 の `<最新の change>` を `changes/$(ls -1t changes | head -1)` 等に展開
- [ ] F3: design.md §修正ファイル `init.ts` のエントリに「artifacts 配下のみロケール解決」分岐ルールを補記、tasks.md でも実装タスクとして起票
- [ ] F6: checklist.md に README.md 更新 verify 項目を追加（タスク完了時のフォローアップ）
- [ ] F7: tasks.md の各タスクに 3 行アンカーブロックを付与し Phase 1 IV を実体化
- [ ] F8: `RootConfigSchema` の strict/passthrough 確認を tasks.md の Zod 拡張タスクに含める
- [ ] F9: quickstart.md の `sed -i.bak` を `sed -i ''` に置換、または Verify の grep に `.bak` 除外
- [ ] F10: design.md D6 に「stderr 警告は英語固定」を明記する微修正タスク
- [ ] F11: design.md Migration Plan Phase A に legacy warning 抑止戦略を追記
- [ ] F12: checklist.md `## Delta Spec Coverage` 冒頭に依存関係マッピング表を追加
- [ ] F13: design.md D4 直下に「英語残骸 grep 許容語ホワイトリスト」を追加

### Verdict

PASS_WITH_NOTES。Blocker F1 と Major F4 / F5 は本 Self-Review 反映と同時に修正済み。残る Major 3 件（F2 / F3 / F6）は tasks.md 設計と微修正で消化可能なため、本 design ステップを次に進める阻害要因にはならない。Minor / Info 8 件は tasks / implement の実装過程で取り込む。

---

> Reviewer: mspec-self-reviewer (second pass) | Date: 2026-05-16 | Status: PASS_WITH_NOTES（Blocker F14 を本セクション追記と同時に修正反映済み）

### Second-pass findings

#### F14. ears-validation-i18n FR-002 Scenario の例本文が `language` を引きずっており F1 修正が不完全 — RESOLVED
- Severity: Blocker
- Artifact(s): `specs/ears-validation-i18n/spec.md` L17
- Observation: F1 で `language:` → `locale:` の一括統一が宣言されていたが、`specs/ears-validation-i18n/spec.md` FR-002 Scenario の例本文「`The system SHALL config.yaml の language を読み込む。`」が旧表記のまま残存していた（capability 名 `language-config` ではなく設定キー名）。
- Resolution (本セクション追記と同時に反映済み): L17 の例本文を「`The system SHALL config.yaml の locale を読み込む。`」に置換。

#### F15. FR-003 (language-config) と FR-002 (language-config) の挙動主体が `mspec validate` と `loadConfig` の二重定義（前パス F2 と同根）
- Severity: Major
- Artifact(s): `specs/language-config/spec.md` FR-002 / FR-003, `design.md` L62 (`config-loader.ts` 改修), `quickstart.md` Step 4
- Observation: FR-002 は `mspec new` 実行時の既定通知、FR-003 は `mspec validate` 実行時のみ非ゼロ終了と定義されているが、design.md L62 では `loadConfig` 後段で `UnsupportedLocaleError` を `ConfigError` として送出する設計のため、`mspec new` でも先に `ConfigError` が発火し FR-003 Scenario の `mspec validate` 専用挙動が成立しない。
- Recommendation: tasks/implement で「`loadConfig` は warning のみ・`mspec validate` のみ exit 非ゼロ」とする設計小修正、または FR-003 Scenario の対象コマンドを「locale を消費する任意の mspec コマンド」に汎用化する。前パス F2 と統合して 1 箇所で確定する。

#### F16. quickstart.md Step 4 の `<最新の change>` プレースホルダが未展開（前パス F2 残課題）
- Severity: Major
- Artifact(s): `quickstart.md` L57
- Observation: 前パス F2 で指摘された `<最新の change>` がそのまま残っており、Verify ステップが手動補完前提のままで Golden Path の決定論性を破る。
- Recommendation: tasks/implement で `changes/$(ls -1t changes | head -1)` 等の決定論的展開または `changes/*-sample-feature` ワイルドカードに置換。

#### F17. quickstart.md Step 6 の zh ロケール検証が「両方のリソース」未配置で確実に失敗する
- Severity: Major (新規発見)
- Artifact(s): `quickstart.md` L69-77, `specs/language-config/spec.md` FR-004 Scenario, Troubleshooting 表 L94
- Observation: FR-004 Scenario は `templates/artifacts/*.zh.md` と `templates/questions/*.zh.yaml` の両方を配置することを GIVEN とするが、quickstart Step 6 は `readme.zh.md` 1 ファイルしかコピーしておらず、`scanSupportedLocales` の「両リソース実在で supported 判定」ルールに照らして Optional ステップが必ず失敗する。
- Recommendation: tasks/implement で Step 6 のコマンドに `templates/questions/*.zh.yaml` の作成を追加、または「敢えて片方だけ配置して `unsupported locale` を観察する」例に書き直す。

#### F18. ears-validation-i18n FR-001 Scenario と既存 `delta init` コマンド契約の整合
- Severity: Minor
- Artifact(s): `specs/ears-validation-i18n/spec.md` L10 (`mspec delta init --capability sample`), `quickstart.md` Step 5 L64 (`delta init --capability demo --change <change-dir>`)
- Observation: Scenario の `mspec delta init --capability sample` は `--change` 引数を省略しているが、quickstart Step 5 は `--change <change-dir>` を必須引数として使用しており、引数契約に齟齬の可能性。
- Recommendation: tasks/implement で `delta-init.ts` の引数仕様を確認の上、Scenario または quickstart を実コマンド契約に揃える。

#### F19. Constitution Check テーブルの完全性（再確認）
- Severity: Info
- Artifact(s): `design.md` L36-45 (Phase 0), L123-131 (Phase 1), `architecture-overview.md` L131-137
- Observation: 5 原則すべてに Compliant 判定と Notes が記載されており、Phase 0 / Phase 1 双方で漏れなし。
- Recommendation: なし（適合）。

#### F20. Delta Spec FR 識別子の重複・連番性（再確認）
- Severity: Info
- Artifact(s): 全 4 spec ファイル
- Observation: 各 capability で FR-001〜FR-004 が連番かつ重複なし。capability 間での FR 番号重複は Delta Spec 規約上問題なし。
- Recommendation: なし（適合）。

#### F21. checklist.md の `<!-- verify: fr-NNN -->` / `<!-- verify: human -->` カバレッジ（再確認）
- Severity: Info
- Artifact(s): `checklist.md` L13-53
- Observation: 4 capability × 4 FR = 16 FR それぞれに `<!-- verify: fr-NNN -->` 1 件 + `<!-- verify: human -->` 1 件が対で揃っている。アノテーション識別子も英語固定で SoT 既存契約と整合。
- Recommendation: なし（適合）。

#### F22. アンカー識別子の翻訳対象外宣言の所在（再確認）
- Severity: Info
- Artifact(s): `checklist.md` §Source-of-Truth Regression L61, L64, L66-68, `architecture-overview.md` Data Model L105-108
- Observation: `Requirement: FR-NNN`、`Scenario:`、`<!-- @mspec-delta ... -->`、`<!-- Requirements implemented: ... -->`、`<!-- Change: ... -->`、`doc_type:`、`## Constitution Check` のいずれも翻訳対象外として明示されており、grep ゼロ件チェック責務が明文化されている。
- Recommendation: なし（適合）。

### Second-pass action items (tasks / implement で消化)

- [ ] F15: `loadConfig` の未対応 locale エラー伝播範囲を `mspec validate` 専用に限定、または FR-003 Scenario の対象コマンドを汎用化（前パス F2 と統合）
- [ ] F16: quickstart.md Step 4 の `<最新の change>` を決定論的に展開（前パス F2 と統合）
- [ ] F17: quickstart.md Step 6 を FR-004 GIVEN に整合（`*.zh.yaml` 同時配置 or `unsupported locale` 観察例に書き直し）
- [ ] F18: `delta-init.ts` の `--change` 引数契約を確認し Scenario / quickstart を整合

### Second-pass verdict

PASS_WITH_NOTES。新規 Blocker F14 は本セクション追記と同時に修正反映済み。前パス Self-Review で「修正済み」と宣言された F1 / F4 / F5 は proposal / language-config spec / checklist / design の各所で実体反映を確認できたが、F1 のクロスファイル徹底度に 1 箇所漏れ（F14）があったのが今回の重要発見。残る Major 3 件（F15 / F16 / F17）はいずれも tasks/implement での消化が現実的で、本 design ステップを次の `tasks` ステップへ進める阻害要因にはならない。Minor / Info 5 件は tasks / implement の実装過程で取り込む。

---

### Third pass

> Reviewer: mspec-self-reviewer (third pass) | Date: 2026-05-16 | Status: PASS_WITH_NOTES

#### Third-pass summary verdict

**PASS_WITH_NOTES** — 全アーティファクトを再走査した結果、新たな Blocker は検出されず。前パス未反映 Action Item（F2 / F11 / F13 / F17 / F18）は依然残存しており、加えて新規 Major 2 件（F24 / F29）と Minor 5 件（F23 / F25 / F26 / F27 / F28 / F30）を検出。次ステップ `tasks` 進行は可能だが、F24・F29 は tasks.md 着手前の設計小修正で先送り解消するのが望ましい。

#### Third-pass findings

##### F23. glossary.md がスケルトンのまま
- Severity: minor
- Artifact(s): `glossary.md` L13-14
- Observation: `| <term> | <definition> |` のテンプレ初期値のまま。readme.md L12 のチェックリストでは未完了として正しく追跡されているが、本変更で扱う `locale` / `active locale` / `EARS keyword` / `ロケールリソース` / `フォールバック` / `legacy fallback` / `ISO 639-1` 等の用語は複数アーティファクト間で頻出かつ定義が分散しており、glossary 不在のままだと implement 段階で表記揺れリスクがある。
- Recommended fix: glossary.md を埋めるか、明示的に `mspec skip glossary --reason "..."` で skip 宣言する。

##### F24. FR-002 (language-config) の Scenario 主体コマンドが `mspec new` 単一例
- Severity: major
- Artifact(s): `specs/language-config/spec.md` L13-19, `design.md` L62 (`config-loader.ts`); 前パス F2 / F15 と同根
- Observation: FR-002 は State-Driven 化済みだが、Scenario WHEN 句が `mspec new` 1 コマンドのみ。一方 design.md L62 は `loadConfig` 後段で解決する設計、つまり全 mspec コマンドで一律発火する。前パス F15 で「`loadConfig` は warning のみ・`mspec validate` のみ exit 非ゼロ」と緩和案が提示されたが、その場合 FR-002 の `informational message` 発火位置（`loadConfig` 内 / 各コマンド側 / `mspec validate` のみ）が確定していない。`--json` モードで stderr に出すか stdout を汚染しないかも不確定。
- Recommended fix: tasks.md 着手前に FR-002 Scenario を「locale を消費する任意の mspec コマンド」または「`loadConfig` を経由する全コマンド」と汎用化し、`--json` モードでの stderr 出力規約を design.md §Decisions D6 に追記する。前パス F15 と統合して 1 件の設計小修正で解消する。

##### F25. quickstart.md Step 1 と Setup ステップ間の cwd 暗黙遷移
- Severity: minor
- Artifact(s): `quickstart.md` L17, L21, L37-40
- Observation: Setup の Step 2 で `/tmp/mspec-locale-demo` に cd した後、Step 1 以降は cwd が `/tmp/mspec-locale-demo` 前提でコマンドが書かれているが、明示されていない。読者が Setup と Try it を別シェルセッションで実行した場合 `changes/*-sample-feature/readme.md` が見つからず失敗する。
- Recommended fix: Try it 冒頭に `cd /tmp/mspec-locale-demo` を明示するか、各コマンドを絶対パスにする。

##### F26. FR-004 (artifact-templates-i18n) Scenario が「両ロケールテンプレ存在」を GIVEN として要求しているが、フォールバック経路では片方のみ存在しうる
- Severity: minor
- Artifact(s): `specs/artifact-templates-i18n/spec.md` L32-35
- Observation: FR-004 Scenario の GIVEN は「ja テンプレと en テンプレの両方が同じ artifact 用に存在する」だが、FR-002 では `ja` テンプレが欠落して `en` のみ存在するケースも正常パスとして規定。両 FR の関係性が明示されておらず、`doc_type` frontmatter 一致チェックを「両方存在する場合のみ」検証するのか「en 単独存在時にも en frontmatter の英字識別子性を検証する」のか曖昧。
- Recommended fix: FR-004 に補助 Scenario を追加するか、checklist.md `<!-- verify: human -->` 側で「en 単独存在時も `doc_type` が英字識別子であること」を明文化する。

##### F27. design.md D4 直下の英語残骸 grep 許容語ホワイトリスト未追加
- Severity: minor
- Artifact(s): `design.md` D4 (L102-107), `checklist.md` L64; 前パス F13 と同根
- Observation: 前パス F13 で「design.md D4 直下に英語残骸 grep 許容語ホワイトリスト追加」が action item となっているが未反映。`Requirement:` / `Scenario:` / `FR-\d+` / EARS keywords / `doc_type` / `<!-- @mspec-delta ... -->` 等の翻訳対象外識別子の許容語リストが design / checklist のどちらにも一覧化されていないため、FR-003 (artifact-templates-i18n) の「英語見出しが grep でゼロ件」E2E の判定基準が運用者の解釈に委ねられる。
- Recommended fix: design.md D4 直下に許容語ホワイトリストを 1 表として追加し、checklist のオフェンダー検出 grep の `--exclude` パターンと一致させる。

##### F28. ears-validation-i18n FR-001 Scenario と quickstart Step 5 の `mspec delta init` 引数契約の齟齬
- Severity: minor
- Artifact(s): `specs/ears-validation-i18n/spec.md` L10, `quickstart.md` L64; 前パス F18 残課題
- Observation: 前パス F18 で同一観察が指摘されているが、Scenario / quickstart 双方とも未修正。Action item は「tasks/implement で消化」となっており現状放置。tasks.md に実装タスクとして起票せずに次ステップへ進むと、E2E スクリプト記述時に二重定義の衝突が起きる。
- Recommended fix: tasks.md 起票時に `delta-init.ts` の `--change` 引数仕様を確認し、片方を実コマンドに揃える。

##### F29. quickstart Setup の `<<'EOF'` heredoc が `.mspec/config.yaml` 全体を上書きする
- Severity: major
- Artifact(s): `quickstart.md` L26-32
- Observation: Setup Step 2 で `mspec init` を実行した直後、Step 3 の `cat > .mspec/config.yaml <<'EOF'` が config.yaml 全体を `locale: ja` + `project:` 2 ブロックだけで上書きしている。`init` が生成した `version: 1`、`test:`、`integrations:` 等の他セクション（checklist L60 の Source-of-Truth Regression `cli-init/spec.md` FR-011 で参照）が消滅し、後続の `mspec validate` 等が `RootConfigSchema` 必須キー欠落で失敗する可能性。
- Recommended fix: Setup を `sed` または `yq` で `locale: ja` 行だけ追記する形に書き直す（例: `printf '\nlocale: ja\n' >> .mspec/config.yaml`）。

##### F30. Migration Plan Phase A の「`<name>.md` を warning なしで許容」（前パス F11）が実装手順に未反映
- Severity: minor
- Artifact(s): `design.md` Migration Plan L139-146, `architecture-overview.md` Fallback Decision Tree L114-125
- Observation: 前パス F11 で「Phase A は legacy fallback の warning を抑制、Phase B 完了後 warning 有効化」とロールフォワード戦略が action item 化されているが、Migration Plan 本文と Fallback Decision Tree（`WarnLegacy` ノード）は無条件 warning 設計のまま。実装段階で Phase A 中の E2E が `<name>.md` legacy 経路で大量 warning を吐いて CI ノイズになる可能性。
- Recommended fix: Migration Plan Phase A に「warning 抑制フラグ（env / option）」の導入を明記、または Fallback Decision Tree に Phase 移行のロジック分岐を追加。

#### Third-pass Constitution Check gaps

| 原則 | アーティファクト | ギャップ |
|------|------------------|---------|
| I. ステップ独立性 | `design.md` L40 Phase 0, `architecture-overview.md` L133 | 充足。3 段の独立した resolver 設計で副作用分離は十分。 |
| II. 決定論的マージ | `design.md` L41 Phase 0, L128 Phase 1, `architecture-overview.md` L134 | 充足。`<name>.<locale>.md → en → legacy` 順序と ISO 639-1 lexicographic ソートが Fallback Decision Tree で図示済み。 |
| III. 質問駆動の要件確定 | `design.md` L42 Phase 0, L129 Phase 1 | 充足。proposal/research/design で都合 5 件確定。残 Open Choice は推奨明確として確定済。 |
| IV. 双方向アンカー | `design.md` L43 Phase 0, L130 Phase 1 Notes, `architecture-overview.md` Data Model L104-109, `checklist.md` L78 | **弱い**。Phase 1 Notes は「tasks.md でアンカーコメントを付与する設計」と未来形のままで、design 段階での実体根拠が依然薄い（前パス F7 と同状況）。Data Model に `DELTA_SPEC` エンティティの英語アンカー保持が描かれているが、tasks.md 未生成のため双方向性は片側のみ確認可能。tasks.md 生成時に各タスクへ 3 行アンカーブロックを必ず付与し、checklist `<!-- verify: human -->` の F7 action item を必達とする。 |
| V. 強制ステップと拡張ステップの分離 | `design.md` L44 Phase 0, L131 Phase 1, `architecture-overview.md` L137 | 充足。`locale-resolver` は library で step 化しない明示あり。`workflow.default.yaml` 改変なしも複数箇所で再確認済み。 |

#### Third-pass action items (tasks / implement で消化、または着手前の設計小修正)

- [ ] F23: glossary.md を埋める（8 用語追加）か `mspec skip glossary` で明示スキップ
- [ ] F24: FR-002 Scenario を汎用化し、`--json` モードでの stderr 出力規約を D6 に追記（前パス F2 / F15 と統合 — **tasks 着手前推奨**）
- [ ] F25: quickstart Try it 冒頭に `cd /tmp/mspec-locale-demo` を明示
- [ ] F26: FR-004 に en 単独存在時の補助 Scenario を追加、または checklist 側で明文化
- [ ] F27: design.md D4 直下に英語残骸 grep 許容語ホワイトリスト追加（前パス F13 統合）
- [ ] F28: `delta-init.ts` の `--change` 引数仕様確認と spec / quickstart の整合（前パス F18 統合）
- [ ] F29: quickstart Setup の heredoc を追記方式に書き換え（**tasks 着手前推奨**）
- [ ] F30: Migration Plan Phase A の warning 抑制フラグ言及（前パス F11 統合）

---

### Fourth pass

> Reviewer: mspec-self-reviewer (fourth pass) | Date: 2026-05-16 | Status: PASS_WITH_NOTES

#### Fourth-pass summary verdict

**PASS_WITH_NOTES** — 全アーティファクトを独立に再走査した。`mspec validate --change ...` は exit 0、checklist の 16 FR それぞれに `<!-- verify: fr-NNN -->` ＋ `<!-- verify: human -->` が対で揃い、`design.md` / `architecture-overview.md` 双方の Constitution Check は 5 原則全てが Phase 0 / Phase 1 で `✅`、Mermaid diagram は 4 件（System / Sequence / Data Model / Fallback Decision Tree）存在を確認。F1 / F4 / F5 / F14 の Resolved 宣言も実体反映を確認した（`language:` 引きずり 0 件、D5 / D6 受け入れ基準は Scenario 名引用形式に統一済、FR-002 は State-Driven `While ... unset` 構文へ書換済）。新規 Blocker はなし。ただし新規 Major 2 件（F31 / F32）と Minor 4 件（F33 / F34 / F35 / F36）、Info 1 件（F37）を検出した。F31 は前パス F2 / F15 / F24 と完全に同根で、3 パス連続で未解消のままタスクへ持ち越されており、tasks 着手前に design 小修正で解消するのが強く推奨される。

#### Fourth-pass findings

##### F31. FR-002 / FR-003 (language-config) の責務分担が 3 パス連続未解消（前パス F2 / F15 / F24 統合）
- Severity: major
- Artifact(s): `specs/language-config/spec.md` L13-27, `design.md` L62 (`config-loader.ts`), `quickstart.md` Step 4
- Observation: 第 1 / 第 2 / 第 3 パス全てで同一論点（`loadConfig` 段で `UnsupportedLocaleError` を投げる設計と `mspec validate` 専用挙動の FR-003 が矛盾）が指摘済みだが、design / spec のいずれも未修正。tasks に持ち越すと「test-first で FR-003 Scenario を書いた瞬間に `mspec new` で先に同じエラーが出て exit ≠ 0 になる」現象が起き、Red→Green の TDD ループが破綻する。`mspec validate` のみ exit 非ゼロ / 他コマンドは warning という設計に確定すべき。
- Recommended fix: tasks.md 着手前に design.md L62 `config-loader.ts` 改修方針を「`loadConfig` 内で resolve は行うが UnsupportedLocale は throw せず `{ locale, unsupported: true, requested }` で返却、`mspec validate` コマンド側で unsupported=true なら非ゼロ終了」に書き換え、Decisions D5 末尾と D6 直下に該当する一文を追加する。

##### F32. `delta-init.ts` の `--change` 引数契約齟齬が 2 パス連続未解消（前パス F18 / F28 統合）
- Severity: major
- Artifact(s): `specs/ears-validation-i18n/spec.md` L10, `quickstart.md` L64
- Observation: 第 2 / 第 3 パスで指摘されているが Scenario / quickstart 双方未修正。Scenario は `mspec delta init --capability sample`、quickstart は `delta init --capability demo --change <change-dir>`。tasks の E2E スクリプト着手時にどちらを正とするかが未確定で衝突する。
- Recommended fix: tasks.md 起票前に `packages/cli/src/commands/delta-init.ts` 実装の引数定義（`--change` 必須か optional か）を確認し、Scenario または quickstart を実装に揃える。実装側が `--change` 省略時に `mspec status` の current change にフォールバックするのであれば Scenario はそのままで quickstart Verify に注釈を追加。

##### F33. checklist.md FR-003 (language-config) 検証の `--change <change-dir>` 引数が `mspec validate` の実コマンド契約と一致しているか未確認
- Severity: minor
- Artifact(s): `checklist.md` L17, `quickstart.md` Step 4, `specs/language-config/spec.md` FR-003 Scenario
- Observation: 既に動作する `validate --change 2026-05-16-052329-artifact-language-config` を本パスで実行確認済（exit 0、出力 `✓ ...`）だが、Scenario / checklist の Verify が要求する stderr 出力 `unsupported locale: xx` / `supported: ja, en` は現実装には存在しない（locale resolver 自体が未実装）。E2E タスク化時にどの実装層（config-loader / validate コマンド本体 / locale-resolver）で出力するかが未指定。F31 と統合して解消するのが望ましい。
- Recommended fix: F31 解消時に「stderr の `unsupported locale: xx` 出力は `commands/validate.ts` の unsupported=true 分岐内で行う」と明記する。

##### F34. architecture-overview.md Sequence diagram が `loadConfig` 内 `resolveLocale` 呼び出しを描いているが、F31 の確定方針と前提衝突
- Severity: minor
- Artifact(s): `architecture-overview.md` L51-58
- Observation: Sequence で `Loader->>LR: resolveLocale(config)` の直後に `Loader-->>CLI: { locale: "ja", supported: Set("ja","en") }` を返す描画があり、unsupported のケースが図示されていない。F31 で `loadConfig` を非 throw 化する場合、Sequence diagram に `alt unsupported` 分岐を追加するか、Sequence の対象を「supported locale のハッピーパス」と注記で限定する必要がある。
- Recommended fix: F31 確定後、Sequence 末尾に `alt unsupported locale` ブロックを追加するか、図のキャプションに「unsupported case は Fallback Decision Tree / validate コマンドで処理」と注記。

##### F35. glossary.md スケルトン残存（前パス F23 未解消）
- Severity: minor
- Artifact(s): `glossary.md` L13-14, `readme.md` L12（artifact list 未チェック）
- Observation: 第 3 パス F23 で「glossary 8 用語追加 or `mspec skip glossary` 宣言」が action item 化されたが、glossary.md は依然 `| <term> | <definition> |` のスケルトン。readme.md の artifact list でも未チェック (`- [ ] glossary.md`) のままで進捗追跡上は正しいが、tasks/implement で `locale` / `active locale` / `ロケールリソース` / `legacy fallback` / `ISO 639-1` / `フォールバック` 等の用語が複数ファイル間で頻出する以上、表記揺れリスクが残存する。
- Recommended fix: tasks.md 着手前に glossary.md を埋めるか `mspec skip glossary --reason "用語は design.md と各 spec.md のインライン定義に集約。glossary 不要"` で明示スキップ。

##### F36. `architecture-overview.md` Fallback Decision Tree の `WarnLegacy` ノードと Migration Plan Phase A の整合（前パス F11 / F30 未解消）
- Severity: minor
- Artifact(s): `architecture-overview.md` L121-123, `design.md` Migration Plan L139-146
- Observation: 第 1 パス F11 / 第 3 パス F30 で「Phase A は legacy fallback warning を抑制」と提案されたが、Fallback Decision Tree は `CheckLegacy -- yes --> WarnLegacy[emit stderr warning]` の無条件 warning 設計のまま。Migration Plan 本文も roll-forward 戦略未記載。Phase A の E2E が `<name>.md` 経路で warning を吐き続けるとテストアサーション（「特定 artifact のみ warning される」）と衝突する。
- Recommended fix: Migration Plan Phase A に「環境変数 `MSPEC_LOCALE_WARN_LEGACY=0` で `WarnLegacy` 抑制可能、Phase C 完了で default 有効化」を追記し、Fallback Decision Tree に `WarnLegacy` ノードを「flag-controlled」と注記。

##### F37. checklist.md `## Constitution Check` セクションが 5 原則を `<!-- verify: human -->` でフルカバーしていることを再確認
- Severity: info
- Artifact(s): `checklist.md` L71-79
- Observation: Constitution Check セクションが Constitution 1.0.0 の 5 原則を 1 行ずつカバーし、各行に `<!-- verify: human -->` を付与済。Phase 0 / Phase 1 の合計 10 セルすべて `✅` で `❌` ゼロ件。新規発見なし。
- Recommended fix: なし（適合）。

#### Fourth-pass Constitution Check gaps

| 原則 | アーティファクト | ギャップ |
|------|------------------|---------|
| I. ステップ独立性 | `design.md` L40 / L127, `architecture-overview.md` L133 | 充足。locale-resolver の単一責務化で副作用分離。 |
| II. 決定論的マージ | `design.md` L41 / L128, `architecture-overview.md` L134 | 充足。Fallback 順序と ISO 639-1 ソート、archive 非干渉が複数所で再記述。 |
| III. 質問駆動の要件確定 | `design.md` L42 / L129 | 充足。Open Choice 残 2 件は design で推奨明確として確定。 |
| IV. 双方向アンカー | `design.md` L43 / L130, `architecture-overview.md` Data Model L104-109, `checklist.md` L78 | **依然弱い**（第 1 / 第 3 パスからの継続）。Phase 1 Notes は「tasks.md でアンカー付与する設計」と未来形のまま。Data Model の `DELTA_SPEC` エンティティが英語アンカー識別子を保持する構造設計は十分だが、tasks.md 未生成のため双方向性の半分（実装→spec 方向）は未検証。F7 action item を tasks 段階で必達。 |
| V. 強制ステップと拡張ステップの分離 | `design.md` L44 / L131, `architecture-overview.md` L137 | 充足。`workflow.default.yaml` 改変なし、locale-resolver は library 化。 |

新規 gap なし、全 5 原則に対する判定は第 3 パスから据置。

#### Fourth-pass action items (tasks / implement で消化、または着手前の設計小修正)

- [ ] F31 **（tasks 着手前推奨）**: design.md L62 / D5 / D6 を改訂し、「`loadConfig` は throw せず `{ locale, unsupported, requested }` を返却、`mspec validate` のみ非ゼロ終了」に責務確定（前パス F2 / F15 / F24 統合、3 パス連続未解消のため最優先）
- [ ] F32 **（tasks 着手前推奨）**: `delta-init.ts` の `--change` 引数実装を確認し、Scenario（`specs/ears-validation-i18n/spec.md` L10）または quickstart Step 5 を実コマンドに揃える（前パス F18 / F28 統合）
- [ ] F33: F31 解消時に stderr `unsupported locale: xx` 出力位置を `commands/validate.ts` 内と明記
- [ ] F34: F31 確定後、`architecture-overview.md` Sequence diagram に `alt unsupported` 分岐を追加するか注記を追記
- [ ] F35: glossary.md を埋める（`locale` / `active locale` / `ロケールリソース` / `legacy fallback` / `ISO 639-1` / `フォールバック` 等 6-8 用語）か `mspec skip glossary --reason "..."` で明示スキップ（前パス F23 統合）
- [ ] F36: Migration Plan Phase A に warning 抑制フラグ（env / option）を明記、Fallback Decision Tree の `WarnLegacy` を flag-controlled として注記（前パス F11 / F30 統合）

#### Fourth-pass verdict

PASS_WITH_NOTES。`mspec validate --change 2026-05-16-052329-artifact-language-config` は exit 0 で本パス前後とも合格。新規 Blocker / Constitution 違反なし。ただし F31（FR-002/FR-003 責務分担）と F32（`delta init --change` 引数契約）は 2 パス以上連続未解消で、tasks 着手時に TDD ループ破綻 / E2E 衝突を起こす蓋然性が高いため、tasks 起票前に design 小修正で確定するのが強く推奨される。Minor / Info は tasks / implement の実装過程で取り込む。

---

### Fifth pass (post-fix verification)

> Reviewer: claude / mspec-self-reviewer 推奨に基づく即時修正 | Date: 2026-05-16 | Status: PASS（Major 2 件 解消）

#### Fifth-pass summary

第 4 パスで最優先推奨だった F31 / F32 を design / quickstart 側で解消した。F16（quickstart Step 4 の `<最新の change>` placeholder 未展開）も同時に解消。`mspec validate --change 2026-05-16-052329-artifact-language-config` は引き続き exit 0。

#### Resolved items

##### F31. FR-002 / FR-003 (language-config) の責務分担 — RESOLVED
- Severity: major → resolved
- Resolution: `design.md` §修正ファイル `config-loader.ts` のエントリを「`unsupported=true` でも throw しない、戻り値型を `{ locale, unsupported, requested, supported }` に拡張」へ書き換え、新規追加で `commands/validate.ts` エントリに「`unsupported=true` 検知時に stderr 出力 + exit 1」を明記。併せて Decisions D5 受け入れ基準を「`commands/validate.ts` 側で `unsupported=true` を検知して exit code 1 / stderr 出力」へ更新し、責務分担を文書化。これにより FR-003 Scenario の `mspec validate` 専用挙動と FR-002 の `mspec new` 既定通知が一貫する。
- Affected lines: design.md §修正ファイル（`config-loader.ts` / `validate.ts` 行）、D5 採用文・受け入れ基準。

##### F32. `delta-init.ts` `--change` 引数契約齟齬 — RESOLVED
- Severity: major → resolved
- Resolution: 実装 (`packages/cli/src/commands/delta-init.ts` L25) 確認結果は `change?: string` で optional、未指定時は `singleActiveChange()` にフォールバックする契約。Scenario の `mspec delta init --capability sample`（`--change` 省略）は単一 active change 前提で valid、quickstart Step 5 は複数 active change を作成するため `--change` 明示が必須、と確認。quickstart Step 5 を `LATEST_CHANGE=$(ls -1t changes | head -1)` で決定論的に `--change` を埋める形に書き換えた。Scenario 側は意図通り（auto-detection パス検証）として維持。
- Affected lines: quickstart.md Step 4 / Step 5（コードブロック内）。

##### F16. quickstart.md Step 4 `<最新の change>` placeholder — RESOLVED
- Severity: major → resolved（F2 / F15 / F24 続きの最後の残課題）
- Resolution: Step 4 に `LATEST_CHANGE=$(ls -1t changes | head -1)` を追加し `validate --change "$LATEST_CHANGE"` に書き換え。stderr 期待出力に `supported: ja, en` を追記、コメント行に「他コマンドは warning のみで処理継続」を補足。
- Affected lines: quickstart.md L54-60。

#### Fifth-pass remaining action items (tasks / implement で消化)

- [ ] F33: F31 解消文言と整合する形で `commands/validate.ts` の stderr 出力位置を unit/E2E テストで検証
- [ ] F34: `architecture-overview.md` Sequence diagram に `alt unsupported` 分岐追加（または注記）
- [ ] F35: glossary.md 用語追加 or `mspec skip glossary` 宣言
- [ ] F36: Migration Plan Phase A に warning 抑制フラグ言及（前パス F11 / F30 統合）
- [ ] F25 / F26 / F27 / F28 / F29 / F30: 第 3 パス未解消分は tasks 段階で消化（本パスで scope 外）

#### Fifth-pass verdict

PASS。残課題は全て Minor / Info で tasks/implement 段階で消化可能。`mspec validate` exit 0、Constitution Check 全項目 `✅` 据置。本パスで tasks ステップへの最大障害だった F31 / F32 の責務分担曖昧性が解消されたため、`tasks` ステップへ進む準備が整った。
