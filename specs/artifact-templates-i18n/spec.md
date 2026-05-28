<!-- mspec: gaps in FR numbering are intentional. Removed requirements are archived under changes/archive/. -->

# artifact-templates-i18n Specification

## Purpose

<このスペックがカバーする外部から観測可能な振る舞いの概要>

## Requirements

<!-- archive コマンドが Delta Spec の ADDED/MODIFIED/REMOVED/RENAMED を機械的にマージします -->

### Requirement: FR-001 — ロケール別テンプレート解決
When generating any artifact for a change directory, the system SHALL resolve template content matching the active locale before writing the file.

#### Scenario: active locale が ja でテンプレートを取得する
- GIVEN active locale が `ja`、対象テンプレートが `proposal`
- WHEN `mspec new` から内部のテンプレートリゾルバが呼び出される
- THEN `templates/artifacts/proposal.ja.md` （または相当する ja 用リソース）が選択される

### Requirement: FR-002 — 翻訳欠落時のフォールバック
If a localized template for the active locale is missing for a given artifact, then the system SHALL fall back to the `en` template and emit a warning identifying the missing locale and artifact name.

#### Scenario: ja テンプレートが欠落している
- GIVEN active locale が `ja`、対象テンプレートの ja リソースが存在しない
- WHEN テンプレートリゾルバが解決を試みる
- THEN `en` テンプレートが採用され、stderr に `missing template: <artifact> for locale 'ja', falling back to 'en'` を含む警告が出力される

### Requirement: FR-003 — 全成果物への一貫適用
The system SHALL apply the active locale uniformly to section headings and placeholders across every artifact template, including `readme`, `proposal`, `delta-spec`, `research`, `design`, `architecture-overview`, `quickstart`, `checklist`, `tasks`, and `glossary`.

#### Scenario: 全テンプレートが日本語化されている
- GIVEN active locale が `ja` で全ステップ用 ja テンプレートが用意されている
- WHEN proposal → delta → research → design → quickstart → checklist → tasks の各ステップを順に実行する
- THEN 生成された各成果物のセクション見出しとプレースホルダが全て日本語であり、テンプレ由来の英語見出しが grep でゼロ件である

### Requirement: FR-004 — フロントマターの保護
The system MUST preserve YAML frontmatter structural keys (e.g., `doc_type`) verbatim across all locales, translating only human-readable values when applicable.

#### Scenario: doc_type フロントマターは翻訳対象外
- GIVEN ja テンプレートと en テンプレートの両方が同じ artifact 用に存在する
- WHEN それぞれを読み込んで frontmatter を比較する
- THEN `doc_type` 等の構造的キー名は両ロケールで一致しており、値も同一の英字識別子のままである

### Requirement: FR-005 — 全成果物テンプレートの ja/en バリアント完備
このシステムは SHALL `readme`・`glossary`・`proposal`・`research`・`design`・`architecture-overview`・`quickstart`・`checklist`・`tasks` の各成果物テンプレートに対して `.ja.md` および `.en.md` バリアントを提供し、`locale: ja` または `locale: en` 設定時に "missing template" フォールバック警告が発生しないことを保証する。

#### Scenario: locale=ja で mspec new を実行しても警告が出ない
- GIVEN `config.yaml` に `locale: ja` が設定されており、全成果物の `.ja.md` テンプレートが存在する
- WHEN `mspec new <feature>` を実行する
- THEN stderr に "missing template" を含む行が一切出力されない

#### Scenario: locale=en でも警告が出ない
- GIVEN `config.yaml` に `locale: en` が設定されており、全成果物の `.en.md` テンプレートが存在する
- WHEN `mspec new <feature>` を実行する
- THEN stderr に "missing template" を含む行が一切出力されない

### Requirement: FR-006 — 人間向けアーティファクトテンプレートは自然語・会話的文体を採用する

<!-- risk_tier: trivial -->
<!-- blast_radius: local -->

このシステムは SHALL `checklist.md`・`design.md`・`proposal.md` の各テンプレートにおいて、箇条書きの羅列や技術的な命令形を避け、文脈・目的・背景を一文で添えた自然語の説明文を各セクションの冒頭に含める。

#### Scenario: checklist.md に各セクションの意図を示す説明文が入っている
- GIVEN `locale: ja` でチェックリストが生成される
- WHEN `mspec checklist` ステップが完了する
- THEN 生成された `checklist.md` の各チェックセクション（例: 機能確認、リグレッション確認）の冒頭に、そのセクションで何を確認するのかを一文で説明するテキストが含まれる

#### Scenario: design.md テンプレートの各 H2 直下に説明文プレースホルダが存在する
- GIVEN `locale: ja` または `locale: en` で `design` ステップが完了する
- WHEN 生成された `design.md` の `## Summary` セクションを確認する
- THEN セクション見出しの直下（最初のコンテンツとして）に、コメントアウトされていない自然語のリード文プレースホルダが存在する

#### Scenario: proposal.md テンプレートの各 H2 直下に説明文が存在する
- GIVEN `locale: ja` で proposal テンプレートを確認する
- WHEN `packages/cli/templates/artifacts/proposal.ja.md` を開く
- THEN `## Why`・`## Goals`・`## Non-Goals` の各 H2 見出し直下に、そのセクションの目的を示す一文の説明テキストが存在する
- AND 説明テキストは HTML コメント（`<!-- -->`）でなく本文として記述されている

### Requirement: FR-007 — checklist.md テンプレートはカテゴリ別グループ構造と視覚的階層を持つ

<!-- risk_tier: trivial -->
<!-- blast_radius: local -->

このシステムは SHALL `checklist.md` テンプレートを、フラットな全項目羅列でなく「機能確認」「リグレッションリスク」「デプロイ前確認」等のカテゴリ別見出し（H2/H3）でグループ化された構造で提供する。

#### Scenario: checklist.md のチェック項目がカテゴリごとに整理されている
- GIVEN `mspec checklist` ステップが完了する
- WHEN 生成された `checklist.md` を開く
- THEN チェック項目は少なくとも 2 つ以上のカテゴリ見出し（H2 または H3）のもとにグループ化されており、単一フラットリストではない
- AND 各カテゴリ内のチェック項目は 10 件以下に収まる

### Requirement: FR-008 — design.md テンプレートは用途と読者を明示するリード文を冒頭に持つ

<!-- risk_tier: trivial -->
<!-- blast_radius: local -->

このシステムは SHALL `design.md` テンプレートの `## Summary` セクション直下に、このドキュメントが「何のためにあり、誰が読むべきか」を一段落で示すリード文プレースホルダを含める。

#### Scenario: design.md に読者向けリード文プレースホルダが存在する
- GIVEN `design` ステップが完了する
- WHEN 生成された `design.md` の先頭部を確認する
- THEN `## Summary` セクション直下に「このドキュメントは〜を目的として〜が読むものです」という形式のプレースホルダ文が存在する



