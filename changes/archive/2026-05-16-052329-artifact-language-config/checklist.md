---
doc_type: Reference
---

# Checklist: artifact-language-config

このチェックリストは、Delta Spec の各 FR が design.md / 後続 tasks.md / 既存 SoT spec と整合しているかを検証するための監査項目です。各項目は人間レビュー時に手動で `- [ ]` → `- [x]` にチェックしてください。`<!-- verify: fr-NNN -->` の付与された項目は対応 FR の E2E タスクで自動チェックされます（`mspec-implement` 経由）。

## Delta Spec Coverage

### capability: language-config

- [ ] FR-001 — `config.yaml` の トップレベル `locale: ja` 読込が `resolveLocale()` を経由して active locale に反映され、`mspec new sample-feature` の生成成果物（readme.md）見出しが日本語テンプレ由来であること <!-- verify: fr-001 -->
- [ ] FR-001 — design.md の §Decisions D1 と D5 で `RootConfigSchema` 追加・`locale-resolver.ts` 公開関数が記述され、tasks.md でテンプレ解決 E2E にアンカーが付与される計画になっている <!-- verify: human -->
- [ ] FR-002 — `locale` キー未指定時に既定 `ja` が適用され、stderr に `default locale 'ja' applied` を含む通知が出力されることが E2E で検証されている <!-- verify: fr-002 -->
- [ ] FR-002 — Delta Spec 本文と design.md Summary（「既定値は `ja`」記述）の既定ロケール定義が一致している <!-- verify: human -->
- [ ] FR-003 — 未対応 locale 指定時に `mspec validate --change <change-dir>` が非ゼロ終了し、出力に `unsupported locale: xx` と `supported: ja, en` を含む E2E が tasks.md に組まれている <!-- verify: fr-003 -->
- [ ] FR-003 — `UnsupportedLocaleError`（design.md §修正ファイル `config-loader.ts`）が `ConfigError` として伝播し、検証コマンド側で吸収されるエラーパスが Decisions D5 と整合 <!-- verify: human -->
- [ ] FR-004 — `templates/artifacts/*.zh.md` と `templates/questions/*.zh.yaml` を追加配置するだけで `locale: zh` が解決される拡張ポイントが E2E で検証されている <!-- verify: fr-004 -->
- [ ] FR-004 — `scanSupportedLocales(templatesDir)` が ISO 639-1 ソートで決定論的に locale を列挙する設計（Decisions D5、Phase 1 Constitution II）が tasks.md のユニットテストとして任じられている <!-- verify: human -->

### capability: artifact-templates-i18n

- [ ] FR-001 — active locale `ja` 状態でテンプレートリゾルバが `templates/artifacts/proposal.ja.md` を選択する単体テストが tasks.md に存在 <!-- verify: fr-001 -->
- [ ] FR-001 — `template-resolver.ts` の解決順序 `<name>.<locale>.md → <name>.en.md → <name>.md` が Decisions D2 と整合し、新規ファイル一覧（design.md §新規ファイル）に列挙されている <!-- verify: human -->
- [ ] FR-002 — `ja` テンプレ欠落時に `en` テンプレへフォールバックし、stderr に `missing template: <artifact> for locale 'ja', falling back to 'en'` を出力する E2E が tasks.md に存在 <!-- verify: fr-002 -->
- [ ] FR-002 — Decisions D6（`(locale, artifact, question_id)` 三つ組の重複抑止）に従い、同一実行内で警告が一度だけ emit されることがユニットテストで検証されている <!-- verify: human -->
- [ ] FR-003 — proposal → delta → research → design → quickstart → checklist → tasks の全 7 ステップ生成成果物が `ja` ロケールで日本語見出しになり、英語見出しが grep でゼロ件である E2E が tasks.md に存在 <!-- verify: fr-003 -->
- [ ] FR-003 — design.md §新規ファイルに列挙された 8 件の `*.en.md` および既存 `*.md` の `*.ja.md` リネーム計画が、対象 10 artifact（`readme`, `proposal`, `delta-spec`, `research`, `design`, `architecture-overview`, `quickstart`, `checklist`, `tasks`, `glossary`）すべてをカバーする <!-- verify: human -->
- [ ] FR-004 — `doc_type` 等の YAML frontmatter 構造キーが ja / en テンプレ間で同一識別子に保たれていることがユニットテストで検証されている <!-- verify: fr-004 -->
- [ ] FR-004 — artifact-taxonomy SoT FR-001 / FR-002 が要求する `doc_type: Reference | Explanation | How-to | Tutorial` 値が ja / en の両テンプレで維持されている <!-- verify: human -->

### capability: question-bank-i18n

- [ ] FR-001 — `mspec questions --phase proposal --json` を `locale: ja` 状態で実行し、各 `question` / `options` が日本語文字列で返ることが E2E で検証されている <!-- verify: fr-001 -->
- [ ] FR-001 — design.md §修正ファイル `questions-bank.ts` の `loadMergedBank(locale)` シグネチャと `commands/questions.ts` の `loadConfig()` 連携が tasks.md でアンカー付き実装タスク化されている <!-- verify: human -->
- [ ] FR-002 — `question: { ja: "...", en: "..." }` 形式の per-locale エントリが `QuestionSchema` (`z.union([z.string(), z.record(z.string())])`) で受理され、`id` 等のスカラ非ロケールフィールドが両ロケール間で同一であることがユニットテストで検証されている <!-- verify: fr-002 -->
- [ ] FR-002 — Decisions D3 が示すスキーマ拡張が Zod 型定義 (`packages/cli/src/types/questions.ts`) で前方互換に保たれている <!-- verify: human -->
- [ ] FR-003 — 一部の `id`（例: `PRP-NG-001`）のみ ja 翻訳欠落時に、欠落エントリのみ en フォールバックし stderr に `missing translation: <id> for locale 'ja'` を出力する E2E が tasks.md に存在 <!-- verify: fr-003 -->
- [ ] FR-003 — 警告抑止（Decisions D6 の三つ組キャッシュ）が同一 question id について 1 回のみ emit することがテストで担保されている <!-- verify: human -->
- [ ] FR-004 — 旧スカラ `question: "Single string"` 表記を含む question bank が `locale: ja` 実行時に en 扱いでフォールバックされ、警告と英語文字列を返す後方互換テストが tasks.md に存在 <!-- verify: fr-004 -->
- [ ] FR-004 — `templates/questions/*.yaml` 既存 4 ファイルの `{ja: ..., en: ...}` 移行（Phase B）後も `cli-skip-questions` の `mspec questions` コマンド契約が破壊されていない <!-- verify: human -->

### capability: ears-validation-i18n

- [ ] FR-001 — `locale: ja` 状態で `mspec delta init --capability sample` を実行した結果の spec.md に `SHALL`, `WHEN`, `GIVEN`, `THEN` 等の英語キーワードが含まれ、日本語訳語（例: `しなければならない`）がテンプレ由来として 0 件であることが E2E で検証されている <!-- verify: fr-001 -->
- [ ] FR-001 — Decisions D4（EARS キーワードは英語固定）が `delta-init.ts` の placeholder バンドル生成計画と整合し、英語キーワード必須化が実装側で担保されている <!-- verify: human -->
- [ ] FR-002 — 日本語本文の Requirement / Scenario を含む spec.md が `mspec validate --change <change-dir>` で exit 0 を返すことが E2E で検証されている <!-- verify: fr-002 -->
- [ ] FR-002 — `REQUIREMENT_RE` / `SCENARIO_RE`（design.md Decisions D4 記載の既存正規表現）が日本語本文を拒否しないことがパーサーユニットテストで明示的に確認されている <!-- verify: human -->
- [ ] FR-003 — 全英語の既存 `specs/<capability>/spec.md`（例: `specs/claude-integration/spec.md` の FR-001〜FR-017）を `locale: ja` 環境下で `mspec validate` した際にロケール不一致エラーが出ないことが E2E で検証されている <!-- verify: fr-003 -->
- [ ] FR-003 — design.md §Non-Goals に明記された「既存 archive 済み SoT spec の遡及書き換えは行わない」方針が tasks.md でも維持され、既存 SoT spec への書き換えタスクが含まれていない <!-- verify: human -->
- [ ] FR-004 — `#### Scenario: <日本語シナリオ名>` の H4 アンカーが `parser/delta-spec.ts` で認識され、ネストされた GIVEN/WHEN/THEN が当該 Requirement に紐付くユニットテストが tasks.md に存在 <!-- verify: fr-004 -->
- [ ] FR-004 — `cli-delta-spec` SoT の FR-006（H4 Scenario 必須）と本 FR-004 が同一の H4 識別子 `Scenario:` を共有することを保証する設計レビューが完了している <!-- verify: human -->

## Source-of-Truth Regression

既存 SoT spec のうち、本変更でテンプレ・質問バンク・validate のいずれかに依存する箇所を抽出し、リグレッションリスクと緩和策を列挙する。

- [ ] `specs/cli-init/spec.md` FR-001 / FR-002 / FR-007 — `mspec init` が `.mspec/config.yaml`・`memory/constitution.md`・`.claude/skills/mspec-*/SKILL.md` を配置する責務を持つ。design.md §修正ファイル `init.ts` で「`<name>.<locale>.md` を `<name>.md` に正規化して書き出し」と記載されており、配置先パス（`.mspec/config.yaml` 等）が `.ja.md` のような locale 接尾辞を持ったまま落ちる回帰がないか、init.ts の writeFile パスを精査する <!-- verify: human -->
- [ ] `specs/cli-init/spec.md` FR-011 — `.mspec/config.yaml` の `version: 1` トップレベルフィールドに加え、本変更で `locale: ja` も追加される。`RootConfigSchema` 拡張時に既存 `version` / `test` / `project` / `integrations` セクションのスキーマ検証が壊れていないことを `loadConfig` ユニットテストで確認 <!-- verify: human -->
- [ ] `specs/cli-delta-spec/spec.md` FR-004 / FR-005 / FR-006 — Delta Spec テンプレが `## ADDED / MODIFIED / REMOVED / RENAMED Requirements` 4 セクションと `### Requirement: FR-NNN — <Short Title>` / `#### Scenario:` の英語識別子を維持する必要がある。`delta-spec.ja.md` 生成時にこれらの英語識別子が日本語化されると `parseDeltaSpec` と `mspec archive` のマージが壊れる。テンプレ移行 PR で英語識別子の grep ゼロ件チェックを実施 <!-- verify: human -->
- [ ] `specs/cli-skip-questions/spec.md` FR-001〜FR-003 周辺 — `mspec skip` が生成するプレースホルダ MD のヘッダ `<!-- mspec: skipped step -->` と `# Skipped: <step-id>` 等の固定文字列が、ja テンプレ移行時に翻訳されると skip-log 検出が失敗する。プレースホルダ生成ロジック (`skip.ts`) はテンプレリゾルバ経由ではなく固定文字列で出力していることを確認 <!-- verify: human -->
- [ ] `specs/cli-spec-lint/spec.md` FR-001 — `spec-forbidden.ts` の禁止語彙（shell-command / library-name / impl-verb 3 カテゴリ）は英語前提で記述されており、ja 本文の禁止語彙（例: 「git mv を実行する」「zod を使う」の日本語表記）は現状 lint されない既知の lint 抜けがある。本変更スコープ外だが、ja テンプレ著者が誤って `mspec validate --strict` で見逃される回帰を proposal §Non-Goals に記載済みの後続 change で解消する必要がある <!-- verify: human -->
- [ ] `packages/cli/src/lib/artifact-validator.ts` L17-50 — `Constitution Check` 見出し検出 (`/^##\s+Constitution Check\b/m`) と `architecture-overview.md` の Mermaid fence 検出が英語固定。`design.ja.md` / `architecture-overview.ja.md` テンプレ作成時に `## Constitution Check` と Mermaid fence の英語識別子を保持しないと validate が exit 非ゼロで失敗する。テンプレ移行 PR でこの 2 識別子の grep が両ロケールで存在することを確認 <!-- verify: human -->
- [ ] `specs/claude-integration/spec.md` FR-002 / FR-003 / FR-010 / FR-017 — `.claude/skills/mspec-*/SKILL.md` の `## Procedure` 節と `/mspec:<step>` コロン形式参照は英語固定。本変更で SKILL.md は多言語化対象外（proposal §Non-Goals）であるが、design.md §Non-Goals にも「skill prompt 本体の動的多言語切替は対象外」と明記されており、tasks.md で SKILL.md 改変が行われないことを確認 <!-- verify: human -->
- [ ] `specs/claude-integration/spec.md` FR-011 — `mspec-checklist-auditor` が生成する `checklist.md` の `<!-- verify: fr-NNN -->` / `<!-- verify: human -->` アノテーション識別子は英語固定。本 ja テンプレ整備で `checklist.ja.md` を導入する際もアノテーション形式が翻訳されないことを確認（本 checklist.md 自体も該当） <!-- verify: human -->
- [ ] `specs/claude-integration/spec.md` FR-012 / FR-013 — `mspec-implement` が `Requirements implemented: FR-NNN` アンカーを読み `checklist.md` を自動チェックする機能は ja 本文でも動作する必要がある。アンカー識別子 `Requirements implemented:` は英語固定であることを `cli-anchor` FR-001 と合わせて確認 <!-- verify: human -->
- [ ] `specs/cli-anchor/spec.md` FR-001 — 3 行アンカーブロック `@mspec-delta` / `Requirements implemented:` / `Change:` の英語識別子は変更不可。本変更によるテンプレ多言語化で `tasks.ja.md` 等のアンカーブロック例示テキストが日本語化されると anchor-check が壊れる。tasks.md テンプレ移行時に英語識別子例示を維持していることを grep で確認 <!-- verify: human -->
- [ ] `specs/artifact-taxonomy/spec.md` FR-001 / FR-002 — 全 artifact テンプレの YAML frontmatter `doc_type` 値（`Reference` 等）は英語固定。本変更の `artifact-templates-i18n` FR-004 と整合させ、ja / en 両ロケールテンプレで `doc_type` 値が翻訳されていないことを確認 <!-- verify: human -->

## Constitution Check

Constitution Version 1.0.0（Ratified 2026-05-14）の 5 原則について、本変更が Phase 0 / Phase 1 で違反していないことを再確認する。

- [ ] **I. ステップ独立性** — `lib/locale-resolver.ts` への解決責務集約により、各ステップは active locale 文字列のみを引数として受け取り、前段の会話文脈や他ステップ成果物の locale 状態に依存しない。`mspec status --json` 再読込で locale も再解決可能であることを確認 <!-- verify: human -->
- [ ] **II. 決定論的マージ** — `<name>.<locale>.md → <name>.en.md → <name>.md` の探索順、`scanSupportedLocales` の ISO 639-1 lexicographic ソート、`(locale, artifact, question_id)` 三つ組による警告重複抑止により、同一入力で再実行してもバイト一致する。`mspec archive` の Delta Spec マージルールは本変更で変更されないことを確認 <!-- verify: human -->
- [ ] **III. 質問駆動の要件確定** — proposal / research / design / delta の質問バンクが locale 別 question / options を返し、ユーザーは active locale で 1 問 1 答できる。Open Choice 残存 2 件は design.md §Constitution Check (Phase 1) で確定済みであることを確認 <!-- verify: human -->
- [ ] **IV. 双方向アンカー** — `design.md` §Decisions（D1〜D6）と Delta Spec の 4 capability × 各 4 Scenario の対応関係が明示されており、tasks.md の E2E タスクで `<!-- @mspec-delta ... -->` アンカーが付与される計画である。アンカー識別子は英語固定で本変更の i18n と独立 <!-- verify: human -->
- [ ] **V. 強制ステップと拡張ステップの分離** — Delta Spec / Archive ステップの `workflow.default.yaml` スキーマと `removable` フラグは本変更で改変しない。`locale-resolver` は library として参照されるだけで step 化しないことを確認 <!-- verify: human -->
