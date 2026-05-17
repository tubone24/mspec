---
doc_type: Reference
---

# Research: 成果物の言語統制と EARS 多言語化

## Decisions

| 論点 | 採用案 | 代替案 | 根拠 |
|------|--------|--------|------|
| `language` 設定キーの位置とフィールド名 | **トップレベル `locale: ja` を新設**（ユーザー確定） | (A) 既存 `project.language` 再利用 / (B) `project.artifact_language` を project 内に追加 / (C) `project.language` をデュアル定義 | 既存 `config.default.yaml` L12 の `project.language: "typescript"`（コード言語）と意味衝突するため再利用は破壊的。POSIX / Web 標準で `locale` が成果物ロケールを示す慣行と一致。`types/config.ts` の `RootConfigSchema` に `locale: z.string().regex(/^[a-z]{2}$/).optional()` を追加するだけで既存設定ファイルに非破壊。 |
| ロケールリソースの物理レイアウト（テンプレート） | **言語別ファイル分割**: `templates/artifacts/proposal.ja.md` / `proposal.en.md` 方式 | (A) 単一ファイル内に YAML frontmatter で多言語値集約 / (B) 別ディレクトリ `templates/artifacts/ja/*.md` | 既存テンプレが markdown 原文そのままを `writeFile` で書き出すパターン（`init.ts` L224-228）であり、frontmatter にロケールキー埋め込み方式に変えると `applyConfigTransforms` 同様の前処理が全アーティファクトで必要。Hugo 公式の `name.<locale>.md` パターンは既存実装と互換性が高く、追加言語は新ファイル投下のみで対応可能（FR-004 language-config と整合）。 |
| ロケールリソースの物理レイアウト（質問バンク） | **同一 YAML 内のロケールキー集約**: `question: { ja: "...", en: "..." }` | 言語別 YAML 分割 (`proposal.ja.yaml` / `proposal.en.yaml`) | 質問バンクは `id` / `category` / `when` / `multi_select` 等の構造的フィールドを言語間で共有し、文字列フィールドのみが翻訳対象。spec FR-002 (question-bank-i18n) が `question: { ja, en }` キー構造を明示。`id` 重複防止と "non-locale fields shared across locales" 制約を満たす最短経路。 |
| EARS キーワードの言語化方針 | **キーワード英語維持（SHALL / WHEN / WHILE / IF / WHERE / THEN / GIVEN / MUST / SHOULD / MAY）、本文のみロケール化** | 完全日本語化（「〜しなければならない」「〜のとき」など） | (1) Mavin らの EARS 原典 (RE'09) と "Ten Years of EARS" (IEEE Software 2019) がキーワード形式の安定性を品質要素として強調。(2) EARS は非英語話者にも有効と報告されており英語キーワード維持で十分。(3) `parser/delta-spec.ts` L11-13 の `REQUIREMENT_RE` / `SCENARIO_RE` 正規表現は英語固定。日本語化すると validate 正規表現の総書換えが必要で後方互換性が壊れる。(4) Kiro 等の先行 SDD ツールも EARS キーワードを英語維持。 |
| `locale` 既定値 | **`ja` を既定値**（proposal 確定済を踏襲） | (A) `en` 既定 / (B) `$LANG` / `$LC_ALL` から auto-detect | 日本語話者を主ユーザーとする現状の利用実態に合致。auto-detect は決定論を損ね CI / 共有設定で意図しないロケール混在を起こす（Node.js `Intl` は `LC_ALL` のみ参照）。`en` 既定はゴール「日本語成果物の自動生成」と矛盾。 |
| 翻訳欠落時のフォールバック | **`en` への単方向フォールバック ＋ stderr 警告**（テンプレ / 質問バンク共通） | (A) ハードエラーで停止 / (B) 警告なしサイレントフォールバック | spec FR-002 (artifact-templates-i18n) / FR-003 (question-bank-i18n) で明文化。`en` を universal fallback とすることで legacy 英語テンプレ（現行ファイル）をそのまま en リソースとして再利用でき後方互換性を確保。stderr 警告は CI 検出可能で翻訳追加箇所を可視化。 |
| 既存英語 spec の後方互換戦略 | **`mspec validate` は ja ロケール配下でも英語本文をそのまま受理**（FR-003 ears-validation-i18n） | ロケール属性を spec frontmatter に追加して厳格判定 | spec 本文の自然言語を validate 側で言語判定するのは false-positive リスクが大きい。Scenario H4 アンカーと EARS キーワードが英語固定であれば本文言語に依存せず parse 可能。`archive` 時の SoT merge も非破壊。 |
| Validate 時の未対応 locale 検出 | **ISO 639-1 二文字コードを正規表現でゲート ＋ 対応リソース実在チェックで supported 判定** | 静的 allowlist `['ja', 'en']` をコードに埋め込む | FR-004 (language-config) が「ソース改修なしの拡張」を要求。`templates/artifacts/*.<locale>.md` と `templates/questions/*.<locale>.yaml` の両方が存在する locale を動的に supported とみなす。 |
| 構造識別見出しの扱い（`## Constitution Check` 等） | **構造識別見出しは英語固定維持、本文 placeholder のみロケール化** | 完全日本語化（`## 憲法チェック` 等）→ `artifact-validator.ts` 正規表現の多言語化が必要 | `lib/artifact-validator.ts` L17-50 が `Constitution Check` を英語固定で検出。EARS キーワード方針（英語維持）と一貫し、validate 改修を最小化。Mermaid フェンスも同様に英語識別子のまま維持。 |
| GIVEN / WHEN / THEN bullet の検証強度 | **bullet prefix を validate で強制しない（緩和路線）。テンプレ供給で英語キーワードを必ず出現させる** | bullet prefix の英語キーワード強制 | spec FR-001 / FR-002 (ears-validation-i18n) は「英語キーワードがドキュメント上に出現すること」を要求するが、validate 必須化までは要求していない。既存 spec への後方互換を優先。 |
| 既存ハードコード生成成果物（`new.ts` の readme/glossary）の取り扱い | **テンプレファイル読込に移行**（`templates/artifacts/readme.<locale>.md`、`glossary.<locale>.md` を追加） | ハードコード文字列を ja/en 両方持って分岐 | FR-003 (artifact-templates-i18n) の「全成果物に一貫適用」を完全充足するため。将来言語追加時もコード改修不要となり FR-004 (language-config) と整合。 |
| 拡張ポイントの公開度（サードパーティ言語追加） | **ユーザー project の `.mspec/templates/artifacts/*.<locale>.md` をマージ走査**（既存 questions-bank の defaults + user overrides パターンと一貫） | パッケージ内 `node_modules/@mspec/cli/templates/` に直接配置 | `questions-bank.ts` で実証済みのオーバーレイパターンと整合し、インストール再現性を維持。 |
| lint 禁止語彙の多言語化 | **本変更スコープから除外（Out-of-Scope）** | 本変更で日本語版 forbidden ルールを追加 | proposal §Non-Goals と整合。`lib/spec-forbidden.ts` の正規表現は英語ベースで日本語本文での検出漏れがあるが、別 change での後追い対応とする。 |

## Web References

- [Alistair Mavin EARS: Easy Approach to Requirements Syntax — Official Guide](https://alistairmavin.com/ears/) — EARS 原典著者の公式サイト。キーワード SHALL / WHEN / WHILE / IF / WHERE と 5 パターン (Ubiquitous / Event / State / Optional / Unwanted) の正準定義。
- [Easy Approach to Requirements Syntax (EARS) — IEEE RE'09](https://ieeexplore.ieee.org/document/5328509/) — Mavin・Wilkinson らの原論文（Rolls-Royce 発）。EARS が解決する 8 個の自然言語要件問題と、キーワードを限定する設計理由を解説。
- [Ten Years of EARS — IEEE Software 2019](https://dl.acm.org/doi/abs/10.1109/MS.2019.2921164) — 10 年の採用事例レビュー。非英語話者組織での適用報告と、キーワードの言語横断的安定性を主張。
- [【決定版】EARS（イヤーズ）記法とは？— iret.media](https://iret.media/181651) — 日本語による EARS 解説の代表例。「文末を SHALL（〜しなければならない）で統一」と説明しつつ、サンプルでは英語キーワードを保持するハイブリッド形式を提示。
- [見える化する要求仕様 〜EARS を活用したシステム要求の書き方〜 — ビジネスガレージ](https://www.bgarage.co.jp/news/946/) — 日本企業の実務 EARS 解説。日本語本文＋英語キーワード混在パターンの実例を提示。
- [EARS 要求テンプレート — note (山修さん)](https://note.com/re_blogroom/n/n734cdcdc01f9) — 日本語による EARS テンプレ集。`When/While/If/Where + 本システムは/状態は ...` の対訳パターンを示す。
- [Kiro Spec Writing Guide — EARS Format Tutorial](https://kiro.directory/tips/spec-writing) — AWS の SDD IDE Kiro の EARS 解説。`requirements.md` で EARS を使う際もキーワード英語を維持。本変更の方針と一致。
- [Hugo Multilingual mode — Official](https://gohugo.io/content-management/multilingual/) — `content.<locale>.md` 命名規約。本変更で採用するテンプレ命名と同型。
- [Rails Internationalization (I18n) API Guide](https://guides.rubyonrails.org/i18n.html) — locale YAML を機能単位で分割する公式推奨。質問バンクを per-step YAML に分割しつつ言語キーは同一ファイル内に集約する本変更の方針と整合。
- [How to organise i18n without losing your translation_not_found — Envato](https://webuild.envato.com/blog/how-to-organise-i18n-without-losing-your-translation-not-found/) — 大規模 i18n でフラット単一ファイルが破綻するパターンの実例。テンプレ分割の根拠。
- [Node.js Internationalization support (Intl docs)](https://nodejs.org/api/intl.html) — Node.js の `Intl` API が `LC_ALL` のみ参照する制約。`$LANG` auto-detect 案を却下する技術的根拠。
- [os-locale (npm)](https://www.npmjs.com/package/os-locale) — `LC_ALL / LC_MESSAGES / LANG / LANGUAGE` を順に読む CLI 向けロケール解決ライブラリ。auto-detect 採用時の補完案として記録。
- [LC_ALL: The Master Environment Variable](https://copyprogramming.com/howto/which-environment-variable-overrides-all-other-locale-settings) — POSIX ロケール優先順位 (`LC_ALL > LC_* > LANG`)。CI で意図しないロケール固定を防ぐため `LC_ALL` を恒久的に設定しないのが 2026 のベストプラクティス。

## Codebase Findings

- `/Users/kagadminmac/project/mspec/packages/cli/templates/config.default.yaml` L12 — 現状 `project.language: "typescript"` がコード言語の意味で使われている。**意味衝突**のため本変更ではトップレベル `locale: ja` を新設し既存フィールドは無干渉とする。
- `/Users/kagadminmac/project/mspec/packages/cli/src/types/config.ts` L14-17 (`ProjectConfigSchema`) — Zod schema 拡張ポイント。`RootConfigSchema` 側に `locale: z.string().regex(/^[a-z]{2}$/).optional()` を追加。`loadConfig` の解決後フォールバックは別関数 (`resolveLocale(config): string`) に分離するのが最小差分。
- `/Users/kagadminmac/project/mspec/packages/cli/src/workflow/config-loader.ts` L7-31 (`loadConfig`) — zod safeParse のみで locale 解決ロジック未実装。**改修ポイント**: `resolveLocale()` を追加し、未対応 locale は `ConfigError` で送出（FR-003 language-config）。
- `/Users/kagadminmac/project/mspec/packages/cli/src/commands/new.ts` L40-43 (`buildReadme` / `buildGlossary`) — 現状 `readme.md` / `glossary.md` の本文をハードコード生成（テンプレファイル経由ではない）。**改修ポイント**: ハードコード文字列をテンプレ読込に切替え、`templates/artifacts/readme.<locale>.md` を新設する。
- `/Users/kagadminmac/project/mspec/packages/cli/src/commands/init.ts` L66-82 (`findTemplatesDir`) / L224-228 (write loop) — テンプレ書き出しが `templates/` 直下を `readdir` 走査する造り。**改修ポイント**: `<name>.<locale>.md` ファイルを `<name>.md` にリネームして書き出すリゾルバが必要。`init` 時にユーザー project の `.mspec/config.yaml` から locale を読み、対応テンプレのみ展開する。
- `/Users/kagadminmac/project/mspec/packages/cli/src/commands/delta-init.ts` L68-92 (`buildDeltaSkeleton`) — Delta Spec の skeleton をハードコード文字列で生成。EARS キーワード (SHALL / WHEN / GIVEN / THEN) は英語、コメントと placeholder (`<前提>`, `<操作>`, `<結果>`) は日本語というハイブリッド構造。**改修ポイント**: en ロケール時に placeholder を英語化 (`<precondition>` 等)、EARS キーワードは現状通り英語維持で OK。
- `/Users/kagadminmac/project/mspec/packages/cli/src/lib/questions-bank.ts` L36-58 (`loadMergedBank`) / L60-70 (`loadBankFile`) — 質問バンク YAML を `QuestionBankSchema.safeParse` で検証。**改修ポイント**: `QuestionSchema` の `question: z.string()` を `z.union([z.string(), z.record(z.string())])` に拡張し、`filterQuestions` の後段にロケール解決層 (`localizeQuestion(q, locale)`) を追加。後方互換 (FR-004 question-bank-i18n) はスカラ文字列を en として扱うことで実現。
- `/Users/kagadminmac/project/mspec/packages/cli/src/types/questions.ts` L16-25 (`QuestionSchema`) — Zod schema。`question: z.string()` / `options: z.union([z.array(z.string()), z.literal('dynamic')])` の双方をロケール対応へ拡張する必要。
- `/Users/kagadminmac/project/mspec/packages/cli/src/commands/questions.ts` L32-44 — 出力直前で `q.question` / `q.options` を素のまま表示。**改修ポイント**: ロケール解決を `loadMergedBank` 内で完結させ、`questionsCommand` 側は文字列確定後のデータを受け取る設計が変更影響を最小化できる。
- `/Users/kagadminmac/project/mspec/packages/cli/src/parser/delta-spec.ts` L11-13 — `REQUIREMENT_RE = /^Requirement:\s+(FR-\d+)\s+[—-]\s+(.+)$/` と `SCENARIO_RE = /^Scenario:\s+(.+)$/`。**重要**: H3 / H4 のキーワード `Requirement` / `Scenario` は英語固定。ja ロケールでもこの形式を維持する必要（FR-004 ears-validation-i18n）。Title 部分（`(.+)` キャプチャ）は任意文字列なので日本語本文を許容する。**改修不要**だが、テンプレ側で必ず `Requirement:` / `Scenario:` 識別子を英語のまま生成すること。
- `/Users/kagadminmac/project/mspec/packages/cli/src/parser/delta-spec.ts` L121-123 — Scenario 本文の bullet 抽出 (`l.trim().startsWith('-')`) は言語非依存。GIVEN / WHEN / THEN の英語キーワード判定はここでは行っていない。validate 側で追加する場合は `^\s*-\s*(GIVEN|WHEN|THEN|AND|BUT)\b` のような prefix-only 正規表現。本変更では強制せず緩和路線（Decisions 参照）。
- `/Users/kagadminmac/project/mspec/packages/cli/src/lib/artifact-validator.ts` L17-50 — `validateArtifact` が `## Constitution Check` を英語固定で hasConstitutionCheck 判定（L52-54）。Mermaid 検出（L34）も同様。**意思決定**: Constitution Check / Mermaid fence の構造識別見出しは英語のまま維持するルールを ears-validation-i18n の延長として運用（テンプレ側で遵守）。
- `/Users/kagadminmac/project/mspec/packages/cli/src/lib/spec-linter.ts` L116-126 (`lintSotSpecs`) と `/Users/kagadminmac/project/mspec/packages/cli/src/lib/spec-forbidden.ts` — 禁止語彙の正規表現リストが英語ベース。日本語本文での検出漏れは Out-of-Scope（proposal §Non-Goals と整合）。
- `/Users/kagadminmac/project/mspec/packages/cli/templates/artifacts/*.md` (10 ファイル) — 既存テンプレは frontmatter `doc_type:` が構造的英字識別子、見出しは日本語混在（`# Proposal:` / `## Goals` / `## Why` は英語、本文 placeholder は日本語）。**改修ポイント**: ja 版は全見出しを日本語化（`## なぜ` / `## ゴール` 等）、en 版は全見出しを英語化（既存形式を base に整理）。frontmatter は両ロケールで一致を保つ（FR-004 artifact-templates-i18n）。Constitution Check と Scenario 識別子は英語維持。
- `/Users/kagadminmac/project/mspec/packages/cli/templates/questions/*.yaml` (4 ファイル: proposal / design / research / tasks) — 現状すべて日本語の question 文と日本語の options を持つ。en ロケール対応は新規追加作業であり、既存 ja 文言は単にロケールキー `ja:` 配下に移すことで対応可能。スカラ表記（後方互換 FR-004 question-bank-i18n）は既存形式そのままで en 扱いとして許容。
- `/Users/kagadminmac/project/mspec/packages/cli/src/workflow/paths.ts` — `templatesDir` への参照は `init` / `questions-bank` 内に分散。ロケールリソースの実在チェック (`SupportedLocales = scanLocalesFromTemplates()`) を新規 `lib/locale-resolver.ts` に集約するのが拡張ポイントとして自然。

## Open Choices

- **既存 spec ファイル群（archive 済み SoT spec）の遡及書き換えポリシー** — design ステップで決定。本変更スコープでは遡及せず、archive 後の新規 change から ja ロケール挙動を適用する。既存 SoT の英語本文は ears-validation-i18n FR-003 の後方互換規定により validate を通過するため、必須ではない。
- **`locale: en` 時のテンプレ整備優先度** — design / tasks で具体的タスク化。MVP では ja を完全整備、en は既存テンプレを base に整理する程度に留めるか、両者を完全同等に揃えるかの工数判断。

## Constitution Check

> Step: research | Constitution Version: 1.0.0

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | — | research は `proposal.md` と `specs/*/spec.md` のみを入力とし、subagent 委譲で main agent コンテキストを保護した |
| II. 決定論的マージ | ✅ | — | research は SoT への merge を行わず、archive 時の delta merge ルールを逸脱しない |
| III. 質問駆動の要件確定 | ✅ | — | Open Choice のうち分岐性が高い `config キー名` を AskUserQuestion で確定、推奨明確な項目は Decisions に集約 |
| IV. 双方向アンカー | — | — | research はアンカー付与対象外（delta / tasks で発生） |
| V. 強制ステップと拡張ステップの分離 | ✅ | — | research は強制ステップとして workflow.default.yaml に定義され、本実施はそれに従う |

### Complexity Tracking

None
