# Delta Spec: question-bank-i18n

## ADDED Requirements

### Requirement: FR-001 — 質問バンク出力のローカライズ
When `mspec questions --phase <phase>` is invoked, the system SHALL return each question's `question` text and option labels in the active locale.

#### Scenario: active locale が ja で proposal フェーズの質問を取得
- GIVEN active locale が `ja`、`templates/questions/proposal.yaml` に ja 翻訳が含まれている
- WHEN `mspec questions --phase proposal --json` を実行する
- THEN 返却 JSON の各 `question` フィールドと `options` 配列が日本語文字列で返る

### Requirement: FR-002 — ロケール別エントリ構造
The question bank YAML schema SHALL support per-locale entries for `question` and `options` fields, keyed by ISO 639-1 codes, while preserving non-locale fields (e.g., `id`, `category`, `multi_select`) as scalar values shared across locales.

#### Scenario: question スキーマに ja / en の両キーを含められる
- GIVEN 質問エントリが `question: { ja: "...", en: "..." }` 形式で記述されている
- WHEN `mspec questions --phase` を ja および en の各 locale で実行する
- THEN それぞれのロケールで該当言語の文字列が返り、`id` などは両実行で同一である

### Requirement: FR-003 — 質問単位のフォールバック
If a translation for the active locale is missing on a specific question, then the system SHALL fall back to the `en` text for that question only and emit a warning identifying the question id and missing locale.

#### Scenario: 一部質問のみ ja 翻訳が欠落している
- GIVEN ja の翻訳が `PRP-FS-001` には存在し `PRP-NG-001` には欠落している
- WHEN active locale `ja` で `mspec questions --phase proposal` を実行する
- THEN `PRP-FS-001` は ja 文字列、`PRP-NG-001` は en 文字列で返り、stderr に `missing translation: PRP-NG-001 for locale 'ja'` を含む警告が出る

### Requirement: FR-004 — 後方互換: スカラ question 表記
The system SHALL continue to accept legacy entries where `question` and `options` are plain scalar strings, treating them as `en` content for fallback purposes.

#### Scenario: 旧形式の質問エントリが残存している
- GIVEN ある質問エントリが `question: "Single string"` のスカラ表記である
- WHEN active locale が `ja` で `mspec questions --phase` を実行する
- THEN そのエントリは en 扱いでフォールバックされ、警告とともに英語文字列が返る

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
