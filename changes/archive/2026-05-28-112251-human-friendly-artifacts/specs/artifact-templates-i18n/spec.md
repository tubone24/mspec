# Delta Spec: artifact-templates-i18n

## Security Capabilities

<!-- proposalのsecurity質問（PRP-SEC-001〜004）の回答からmspec-proposalスキルが記述する -->
<!-- 権限境界: テンプレートファイルの読み書きのみ（ファイルシステムローカル） -->
<!-- アクセス増加: なし -->
<!-- エージェント権限: 変更なし -->
<!-- ロールバック手段: git revert でテンプレート変更を元に戻せる -->

## ADDED Requirements

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

## MODIFIED Requirements

<!-- 既存 Requirement を変更する場合は `### Requirement: FR-NNN — <既存タイトル>` を書く -->

## REMOVED Requirements

<!-- 削除する Requirement の FR-NNN を書く -->

## RENAMED Requirements

<!-- リネームは `### Requirement: FR-NNN — <旧> -> FR-NNN — <新>` -->
