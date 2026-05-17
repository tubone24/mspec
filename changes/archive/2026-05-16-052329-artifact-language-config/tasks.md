---
doc_type: Reference
---

# Tasks: 成果物の言語統制と EARS 多言語化

## Phase 1: Setup（新規モジュール・スキーマ拡張）

- [x] T001: `packages/cli/src/types/config.ts` の `RootConfigSchema` に `locale: z.string().regex(/^[a-z]{2}$/).optional()` を追加。`.extend()` を使い既存フィールドへの影響を事前確認 — files: `packages/cli/src/types/config.ts`
      anchor:
        @mspec-delta 2026-05-16-052329-artifact-language-config/specs/language-config/spec.md
        Requirements implemented: FR-001, FR-002, FR-003, FR-004
        Change: artifact-language-config

- [x] T002: `packages/cli/src/lib/locale-resolver.ts` を新規作成（スタブのみ — `resolveLocale`, `scanSupportedLocales`, `validateLocale` のシグネチャのみ、実装は T011 で） — files: `packages/cli/src/lib/locale-resolver.ts`
      anchor:
        @mspec-delta 2026-05-16-052329-artifact-language-config/specs/language-config/spec.md
        Requirements implemented: FR-001, FR-002, FR-003, FR-004
        Change: artifact-language-config

- [x] T003: `packages/cli/src/lib/template-resolver.ts` を新規作成（スタブのみ — `resolveTemplate`, `emitFallbackWarning` のシグネチャのみ、実装は T021 で） — files: `packages/cli/src/lib/template-resolver.ts`
      anchor:
        @mspec-delta 2026-05-16-052329-artifact-language-config/specs/artifact-templates-i18n/spec.md
        Requirements implemented: FR-001, FR-002, FR-003, FR-004
        Change: artifact-language-config

- [x] T004: `packages/cli/src/types/questions.ts` の `QuestionSchema` の `question` / `options` フィールドを `z.union([z.string(), z.record(z.string())])` に拡張（後方互換: スカラも受理） — files: `packages/cli/src/types/questions.ts`
      anchor:
        @mspec-delta 2026-05-16-052329-artifact-language-config/specs/question-bank-i18n/spec.md
        Requirements implemented: FR-001, FR-002, FR-003, FR-004
        Change: artifact-language-config

## Phase 2: Foundational（ユニットテスト→コア実装）

### Tests-first (Unit)

- [x] T010: Unit test for `locale-resolver.ts` — (a) `resolveLocale({locale:'ja'})` → `'ja'`, (b) `resolveLocale({})` → `'ja'`（既定）+ stderr `default locale 'ja' applied`, (c) `resolveLocale({locale:'xx'})` → `{ locale:'ja', unsupported:true, requested:'xx' }`, (d) `scanSupportedLocales()` が ISO 639-1 lex ソートで列挙、(e) サードパーティ `zh` テンプレ追加で supported に追加されること — files: `packages/cli/src/lib/locale-resolver.test.ts`
      anchor:
        @mspec-delta 2026-05-16-052329-artifact-language-config/specs/language-config/spec.md
        Requirements implemented: FR-001, FR-002, FR-003, FR-004
        Change: artifact-language-config

- [x] T020: Unit test for `template-resolver.ts` — (a) `resolveTemplate('proposal','ja')` が `proposal.ja.md` を返す, (b) `ja` 欠落 → `en` フォールバック + stderr 1回のみ, (c) legacy `proposal.md` フォールバック（Phase A）, (d) 全欠落 → `TemplateNotFoundError`, (e) 同一 `(locale,artifact)` 組み合わせで warning は 1回のみ（重複抑止） — files: `packages/cli/src/lib/template-resolver.test.ts`
      anchor:
        @mspec-delta 2026-05-16-052329-artifact-language-config/specs/artifact-templates-i18n/spec.md
        Requirements implemented: FR-001, FR-002, FR-003, FR-004
        Change: artifact-language-config

- [x] T030: Unit test for extended `questions-bank.ts` — (a) `loadMergedBank('ja')` が `question.ja` を返す, (b) `ja` 翻訳欠落 → `en` フォールバック + stderr 1回, (c) 旧スカラ表記 → `en` 互換扱い, (d) 同一 `(locale,question_id)` で warning 1回のみ — files: `packages/cli/src/lib/questions-bank.test.ts`
      anchor:
        @mspec-delta 2026-05-16-052329-artifact-language-config/specs/question-bank-i18n/spec.md
        Requirements implemented: FR-001, FR-002, FR-003, FR-004
        Change: artifact-language-config

- [x] T040: Unit test for updated `config-loader.ts` — (a) `locale:'ja'` → `{locale:'ja', unsupported:false}`, (b) 未指定 → `{locale:'ja', unsupported:false}`, (c) `locale:'xx'` → `{locale:'ja', unsupported:true, requested:'xx'}` かつ **throw しない**, (d) 既存 `version`/`test`/`integrations` キーが `.extend()` 後も破壊されないこと — files: `packages/cli/src/workflow/config-loader.test.ts`
      anchor:
        @mspec-delta 2026-05-16-052329-artifact-language-config/specs/language-config/spec.md
        Requirements implemented: FR-001, FR-002, FR-003
        Change: artifact-language-config

### Implementation

- [x] T011: `lib/locale-resolver.ts` 本体を実装 — `resolveLocale(config)` は `{ locale, unsupported, requested, supported }` を返す（throw なし）。`scanSupportedLocales(templatesDir)` は `*.ja.md` / `*.en.md` を走査して ISO 639-1 lex ソートで `Set<string>` を返す — files: `packages/cli/src/lib/locale-resolver.ts`
      anchor:
        @mspec-delta 2026-05-16-052329-artifact-language-config/specs/language-config/spec.md
        Requirements implemented: FR-001, FR-002, FR-003, FR-004
        Change: artifact-language-config

- [x] T021: `lib/template-resolver.ts` 本体を実装 — `resolveTemplate(artifact, locale, templatesDir)` が `<name>.<locale>.md → <name>.en.md → <name>.md` 順で探索。`emitFallbackWarning` は `(locale, artifact)` Set で重複抑止し stderr に 1回だけ出力 — files: `packages/cli/src/lib/template-resolver.ts`
      anchor:
        @mspec-delta 2026-05-16-052329-artifact-language-config/specs/artifact-templates-i18n/spec.md
        Requirements implemented: FR-001, FR-002, FR-003, FR-004
        Change: artifact-language-config

- [x] T031: `lib/questions-bank.ts` を更新 — `loadMergedBank(locale: string)` シグネチャ追加、`localizeQuestion(q, locale)` 追加。`(locale, question_id)` Set で warning 重複抑止 — files: `packages/cli/src/lib/questions-bank.ts`
      anchor:
        @mspec-delta 2026-05-16-052329-artifact-language-config/specs/question-bank-i18n/spec.md
        Requirements implemented: FR-001, FR-002, FR-003, FR-004
        Change: artifact-language-config

- [x] T041: `workflow/config-loader.ts` を更新 — `loadConfig` 後段で `resolveLocale()` を呼び、戻り値型を `{ locale, unsupported, requested, supported }` 拡張形に変更。`unsupported=true` でも **throw しない**（warning は emitFallbackWarning 経由で stderr に 1度） — files: `packages/cli/src/workflow/config-loader.ts`
      anchor:
        @mspec-delta 2026-05-16-052329-artifact-language-config/specs/language-config/spec.md
        Requirements implemented: FR-001, FR-002, FR-003
        Change: artifact-language-config

- [x] T042: `commands/validate.ts` を更新 — `loadConfig` 戻り値の `unsupported=true` を検知した場合、stderr に `unsupported locale: <code>` と `supported: <list>` を出力して exit code 1 を返す — files: `packages/cli/src/commands/validate.ts`
      anchor:
        @mspec-delta 2026-05-16-052329-artifact-language-config/specs/language-config/spec.md
        Requirements implemented: FR-003
        Change: artifact-language-config

- [x] T043: `templates/config.default.yaml` にトップレベル `locale: ja` を追加（コメント付き） — files: `packages/cli/templates/config.default.yaml`
      anchor:
        @mspec-delta 2026-05-16-052329-artifact-language-config/specs/language-config/spec.md
        Requirements implemented: FR-001, FR-002
        Change: artifact-language-config

## Phase 3: User Story 1 — language-config（locale 設定・解決）

### Tests-first (E2E)

- [x] T100: E2E — `locale: ja` のとき `mspec new sample-feature` の readme.md 見出しが日本語テンプレ由来であることを確認 — files: `packages/cli/tests/e2e/locale-config-new-ja.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-16-052329-artifact-language-config/specs/language-config/spec.md
        Requirements implemented: FR-001
        Change: artifact-language-config

- [x] T101: E2E — `locale` キー未指定時に既定 `ja` が適用され、stderr に `default locale 'ja' applied` が出力されることを確認 — files: `packages/cli/tests/e2e/locale-config-default.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-16-052329-artifact-language-config/specs/language-config/spec.md
        Requirements implemented: FR-002
        Change: artifact-language-config

- [x] T102: E2E — `locale: xx` のとき `mspec validate` が exit code 1 を返し、stderr に `unsupported locale: xx` と `supported: ja, en` を含むことを確認 — files: `packages/cli/tests/e2e/locale-config-unsupported.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-16-052329-artifact-language-config/specs/language-config/spec.md
        Requirements implemented: FR-003
        Change: artifact-language-config

- [x] T103: E2E — `templates/artifacts/*.zh.md` と `templates/questions/*.zh.yaml` を追加するだけで `locale: zh` が supported として自動認識されることを確認 — files: `packages/cli/tests/e2e/locale-config-third-party.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-16-052329-artifact-language-config/specs/language-config/spec.md
        Requirements implemented: FR-004
        Change: artifact-language-config

### Implementation

- [x] T110: `commands/new.ts` の `buildReadme`/`buildGlossary` ハードコードを削除し `resolveTemplate('readme', locale)` / `resolveTemplate('glossary', locale)` 経由に変更 — files: `packages/cli/src/commands/new.ts`
      anchor:
        @mspec-delta 2026-05-16-052329-artifact-language-config/specs/language-config/spec.md
        Requirements implemented: FR-001, FR-002, FR-004
        Change: artifact-language-config

- [x] T111: `commands/init.ts` を更新 — `templates/artifacts/` 配下のみ `<name>.<locale>.md` → `<name>.md` に正規化して書き出し（`memory/`, `.claude/`, `config.default.yaml` 等は素通しコピー） — files: `packages/cli/src/commands/init.ts`
      anchor:
        @mspec-delta 2026-05-16-052329-artifact-language-config/specs/language-config/spec.md
        Requirements implemented: FR-001, FR-004
        Change: artifact-language-config

- [x] T112: `commands/delta-init.ts` の placeholder 文字列を locale 別バンドルから取得（EARS キーワードは英語維持） — files: `packages/cli/src/commands/delta-init.ts`
      anchor:
        @mspec-delta 2026-05-16-052329-artifact-language-config/specs/ears-validation-i18n/spec.md
        Requirements implemented: FR-001, FR-004
        Change: artifact-language-config

- [x] T113: `commands/questions.ts` を更新 — `loadConfig()` 経由で locale を取得し `loadMergedBank(locale)` に渡す — files: `packages/cli/src/commands/questions.ts`
      anchor:
        @mspec-delta 2026-05-16-052329-artifact-language-config/specs/question-bank-i18n/spec.md
        Requirements implemented: FR-001, FR-002, FR-003, FR-004
        Change: artifact-language-config

## Phase 3: User Story 2 — artifact-templates-i18n（テンプレート多言語化）

### Tests-first (E2E)

- [x] T200: E2E — `locale: ja` のとき `resolveTemplate('proposal', 'ja')` が `proposal.ja.md` を選択することをユニット/E2E で確認 — files: `packages/cli/tests/e2e/template-resolve-ja.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-16-052329-artifact-language-config/specs/artifact-templates-i18n/spec.md
        Requirements implemented: FR-001
        Change: artifact-language-config

- [x] T201: E2E — `ja` テンプレ欠落時に `en` フォールバックが発生し、stderr に `missing template: <artifact> for locale 'ja', falling back to 'en'` が 1回だけ出力されることを確認 — files: `packages/cli/tests/e2e/template-fallback-en.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-16-052329-artifact-language-config/specs/artifact-templates-i18n/spec.md
        Requirements implemented: FR-002
        Change: artifact-language-config

- [x] T202: E2E — `locale: ja` で `mspec new → proposal → delta → research → design → quickstart → checklist → tasks` の全 7 ステップ生成成果物が日本語見出しになり、英語見出しが grep でゼロ件（許容語ホワイトリスト: `Constitution Check`, `Scenario`, `Requirement:`, `FR-\d+`, EARS キーワード, `doc_type` 値、コードフェンス内）であることを確認 — files: `packages/cli/tests/e2e/template-all-steps-ja.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-16-052329-artifact-language-config/specs/artifact-templates-i18n/spec.md
        Requirements implemented: FR-003
        Change: artifact-language-config

- [x] T203: E2E — `doc_type` 等の YAML frontmatter 構造キーが ja / en テンプレ間で同一識別子に保たれていることを確認 — files: `packages/cli/tests/e2e/template-doc-type-invariant.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-16-052329-artifact-language-config/specs/artifact-templates-i18n/spec.md
        Requirements implemented: FR-004
        Change: artifact-language-config

### Implementation

- [x] T210: `templates/artifacts/*.md`（10 ファイル）を `*.ja.md` に `git mv`（`git mv` で履歴維持）— files: `packages/cli/templates/artifacts/` （移動）
      anchor:
        @mspec-delta 2026-05-16-052329-artifact-language-config/specs/artifact-templates-i18n/spec.md
        Requirements implemented: FR-001, FR-002, FR-003, FR-004
        Change: artifact-language-config

- [x] T211: `templates/artifacts/*.en.md`（10 ファイル）を新規追加（既存 `*.ja.md` 内容を base に英訳整備）— files: `packages/cli/templates/artifacts/` （新規）
      anchor:
        @mspec-delta 2026-05-16-052329-artifact-language-config/specs/artifact-templates-i18n/spec.md
        Requirements implemented: FR-001, FR-002, FR-003, FR-004
        Change: artifact-language-config

## Phase 3: User Story 3 — question-bank-i18n（質問バンク多言語化）

### Tests-first (E2E)

- [x] T300: E2E — `locale: ja` で `mspec questions --phase proposal --json` を実行し、`question` / `options` が日本語文字列で返ることを確認 — files: `packages/cli/tests/e2e/questions-bank-ja.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-16-052329-artifact-language-config/specs/question-bank-i18n/spec.md
        Requirements implemented: FR-001
        Change: artifact-language-config

- [x] T301: E2E — `question: { ja: "...", en: "..." }` 形式が `QuestionSchema` で受理され、`id` 等のスカラ非ロケールフィールドが両ロケール間で同一であることをユニットテストで確認 — files: `packages/cli/tests/e2e/questions-schema-per-locale.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-16-052329-artifact-language-config/specs/question-bank-i18n/spec.md
        Requirements implemented: FR-002
        Change: artifact-language-config

- [x] T302: E2E — 一部の id のみ ja 翻訳欠落時に欠落エントリのみ en フォールバックし、stderr に `missing translation: <id> for locale 'ja'` が 1回だけ出力されることを確認 — files: `packages/cli/tests/e2e/questions-partial-fallback.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-16-052329-artifact-language-config/specs/question-bank-i18n/spec.md
        Requirements implemented: FR-003
        Change: artifact-language-config

- [x] T303: E2E — 旧スカラ `question: "Single string"` 表記が `locale: ja` 実行時に en 扱いでフォールバックされ、警告と英語文字列を返す後方互換テストを確認 — files: `packages/cli/tests/e2e/questions-legacy-scalar.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-16-052329-artifact-language-config/specs/question-bank-i18n/spec.md
        Requirements implemented: FR-004
        Change: artifact-language-config

### Implementation

- [x] T310: `templates/questions/*.yaml`（4 ファイル）を `{ja: ..., en: ...}` 構造に変換（旧スカラを `{ ja: "...", en: "..." }` 形式に移行、`id` 等のスカラフィールドは維持） — files: `packages/cli/templates/questions/`
      anchor:
        @mspec-delta 2026-05-16-052329-artifact-language-config/specs/question-bank-i18n/spec.md
        Requirements implemented: FR-001, FR-002, FR-003, FR-004
        Change: artifact-language-config

## Phase 3: User Story 4 — ears-validation-i18n（EARS 多言語化）

### Tests-first (E2E)

- [x] T400: E2E — `locale: ja` で `mspec delta init --capability sample` を実行した結果の spec.md に `SHALL`, `WHEN`, `GIVEN`, `THEN` 等の英語キーワードが含まれ、placeholder 部分は日本語テンプレ由来であることを確認 — files: `packages/cli/tests/e2e/ears-keywords-english.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-16-052329-artifact-language-config/specs/ears-validation-i18n/spec.md
        Requirements implemented: FR-001
        Change: artifact-language-config

- [x] T401: E2E — 日本語本文の Requirement / Scenario を含む spec.md が `mspec validate --change <change-dir>` で exit 0 を返すことを確認 — files: `packages/cli/tests/e2e/ears-japanese-body-valid.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-16-052329-artifact-language-config/specs/ears-validation-i18n/spec.md
        Requirements implemented: FR-002
        Change: artifact-language-config

- [x] T402: E2E — 全英語の既存 `specs/*/spec.md` を `locale: ja` 環境下で `mspec validate` した際にロケール不一致エラーが出ないことを確認 — files: `packages/cli/tests/e2e/ears-existing-english-specs.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-16-052329-artifact-language-config/specs/ears-validation-i18n/spec.md
        Requirements implemented: FR-003
        Change: artifact-language-config

- [x] T403: E2E — `#### Scenario: <日本語シナリオ名>` の H4 アンカーが `parser/delta-spec.ts` で認識され、ネストされた GIVEN/WHEN/THEN が当該 Requirement に紐付くユニットテストを確認 — files: `packages/cli/tests/e2e/ears-scenario-h4-japanese.e2e.test.ts`
      anchor:
        @mspec-delta 2026-05-16-052329-artifact-language-config/specs/ears-validation-i18n/spec.md
        Requirements implemented: FR-004
        Change: artifact-language-config

## Phase 4: Polish（self-review action items の消化）

- [x] T500: `README.md` に `## Locale Configuration` セクションを追加（`locale: ja` 設定方法、対応言語一覧、フォールバック挙動説明、ISO 639-1 二文字コード制約）（Self-Review F6） — files: `README.md`
      anchor:
        @mspec-delta 2026-05-16-052329-artifact-language-config/specs/language-config/spec.md
        Requirements implemented: FR-001, FR-002, FR-004
        Change: artifact-language-config

- [x] T501: `quickstart.md` Try it 冒頭に `cd /tmp/mspec-locale-demo` を明示追加（F25）— files: `changes/2026-05-16-052329-artifact-language-config/quickstart.md`
      anchor:
        @mspec-delta 2026-05-16-052329-artifact-language-config/specs/language-config/spec.md
        Requirements implemented: FR-001
        Change: artifact-language-config

- [x] T502: `quickstart.md` Setup Step 3 の heredoc 全体上書きを `printf '\nlocale: ja\n' >> .mspec/config.yaml` 方式に変更（F29: `init` 生成の他セクション消滅防止） — files: `changes/2026-05-16-052329-artifact-language-config/quickstart.md`
      anchor:
        @mspec-delta 2026-05-16-052329-artifact-language-config/specs/language-config/spec.md
        Requirements implemented: FR-001
        Change: artifact-language-config

- [x] T503: `design.md` D4 直下に英語残骸 grep 許容語ホワイトリスト表を追加（`Constitution Check`, `Scenario`, `Requirement:`, `FR-\d+`, EARS キーワード, `doc_type`, コードフェンス内識別子）（F27） — files: `changes/2026-05-16-052329-artifact-language-config/design.md`
      anchor:
        @mspec-delta 2026-05-16-052329-artifact-language-config/specs/artifact-templates-i18n/spec.md
        Requirements implemented: FR-003
        Change: artifact-language-config

- [x] T504: `architecture-overview.md` Sequence diagram に `alt unsupported locale` 分岐を追加（F34: F31 解消の設計反映） — files: `changes/2026-05-16-052329-artifact-language-config/architecture-overview.md`
      anchor:
        @mspec-delta 2026-05-16-052329-artifact-language-config/specs/language-config/spec.md
        Requirements implemented: FR-003
        Change: artifact-language-config

- [x] T505: `design.md` Migration Plan Phase A に「`<name>.md` legacy 経路での warning は Phase C 完了まで抑制（環境変数 `MSPEC_LOCALE_WARN_LEGACY=0` で制御）」を追記（F36/F30） — files: `changes/2026-05-16-052329-artifact-language-config/design.md`
      anchor:
        @mspec-delta 2026-05-16-052329-artifact-language-config/specs/artifact-templates-i18n/spec.md
        Requirements implemented: FR-002, FR-003
        Change: artifact-language-config

- [x] T506: `glossary.md` に以下 7 用語を追加: `locale`, `active locale`, `ロケールリソース`, `legacy fallback`, `ISO 639-1`, `フォールバック`, `EARS キーワード`（F35） — files: `changes/2026-05-16-052329-artifact-language-config/glossary.md`
      anchor:
        @mspec-delta 2026-05-16-052329-artifact-language-config/specs/language-config/spec.md
        Requirements implemented: FR-001, FR-002, FR-003, FR-004
        Change: artifact-language-config

- [x] T507: `specs/artifact-templates-i18n/spec.md` FR-004 に en 単独存在時の補助 Scenario を追加（`ja` テンプレ欠落時も `doc_type` が英字識別子であることの検証）（F26） — files: `changes/2026-05-16-052329-artifact-language-config/specs/artifact-templates-i18n/spec.md`
      anchor:
        @mspec-delta 2026-05-16-052329-artifact-language-config/specs/artifact-templates-i18n/spec.md
        Requirements implemented: FR-004
        Change: artifact-language-config

- [x] T508: `checklist.md` に README.md 更新の `<!-- verify: human -->` 項目を追加（F6: proposal §Goals で宣言済み）— files: `changes/2026-05-16-052329-artifact-language-config/checklist.md`
      anchor:
        @mspec-delta 2026-05-16-052329-artifact-language-config/specs/language-config/spec.md
        Requirements implemented: FR-001
        Change: artifact-language-config

## Dependencies

- T002 blocks T011（スタブが存在してから実装）
- T003 blocks T021（スタブが存在してから実装）
- T010 blocks T011（テストが通ってから実装）
- T020 blocks T021（テストが通ってから実装）
- T030 blocks T031（テストが通ってから実装）
- T040 blocks T041（テストが通ってから実装）
- T001, T011 blocks T041（スキーマと locale-resolver が必要）
- T041 blocks T042（config-loader 拡張が前提）
- T021 blocks T110, T200-T203（template-resolver が必要）
- T031 blocks T113, T300-T303（questions-bank 拡張が必要）
- T210 blocks T200, T202（テンプレファイルが必要）
- T211 blocks T200, T201（en テンプレが必要）
- T310 blocks T300, T302, T303（ya ファイルの移行が必要）
- T110, T111, T210, T211 blocks T202（new コマンドとテンプレ両方が必要）

## Constitution Check

> Step: tasks | Constitution Version: 1.0.0

| Principle | Phase 0 | Notes |
|-----------|---------|-------|
| I. ステップ独立性 | ✅ | locale-resolver を単一モジュールに集約し、各タスクは active locale 文字列のみを引数として受け取る構造。前段コンテキスト不依存 |
| II. 決定論的マージ | ✅ | `<name>.<locale>.md → <name>.en.md → <name>.md` の探索順と ISO 639-1 lex ソートにより同一入力で同一出力。archive merge ルール（delta-spec）に非干渉 |
| III. 質問駆動の要件確定 | ✅ | proposal / research / design の全 Open Choice がユーザー回答済み（D1〜D6 確定）。tasks 段階の未決事項はゼロ |
| IV. 双方向アンカー | ✅ | 全実装タスク・E2E タスク（T001〜T508）に 3行 `@mspec-delta` アンカーブロックを付与済み。Design D1〜D6 の受け入れ基準 Scenario と tasks の FR-NNN が対応 |
| V. 強制ステップと拡張ステップの分離 | ✅ | locale-resolver は library として参照のみ。workflow.default.yaml の step 構造・`removable` フラグに触れない |

### Complexity Tracking

None
