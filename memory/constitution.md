# Project Constitution

> Version: 1.1.0
> Ratified: 2026-05-14
> Last Amended: 2026-05-25

## Core Principles

### I. ステップ独立性

各ワークフローステップはコンテキスト独立である。ステップ再開時は必ず `mspec status` で前ステップの成果物を再読込してから着手し、前段の会話文脈に依存しない。`mspec continue` のエンベロープ拡張はすべて後方互換な追加に限り、既存ステップ間の依存関係を増やしてはならない。

### II. 決定論的マージ

Delta Spec から Source-of-Truth Spec へのマージは LLM を使わず CLI のパーサーで実施する (OpenSpec 方式)。`mspec archive` のマージサマリは lexicographic ソートと純粋関数による整形で生成し、同一入力に対して再実行してもバイト単位で一致しなければならない。

### III. 質問駆動の要件確定

要件は人間に Markdown を手書きさせず、AI が `AskUserQuestion` で 1 問 1 答して確定する (Superpowers 方式)。質問を抑制した場合でも、決定の根拠は research / design の成果物に追跡可能な形で記録し、後から検証できる状態を保つ。

### IV. 双方向アンカー

実装ファイルおよび E2E テストには、対応する Delta Spec を指す `@mspec-delta` アンカーを必ず打つ。CLI (`mspec anchor check`) でアンカーと Delta Spec の整合性を双方向に検証し、すべての FR が最低 1 つのアンカーブロックに紐付くことを保証する。アンカースキャナの除外設定は、本来アンカーを持つべき実装/テストファイルを巻き込んではならない。

### V. 強制ステップと拡張ステップの分離

Spec / Delta Spec / Archive のステップは `workflow.yaml` スキーマから削除できない強制ステップである。それ以外のステップはユーザーが追加・削除・並べ替え可能とする。本原則に関わる `removable` フラグおよびワークフロー構造は、成果物バリデーションの追加とは独立して扱い、安易に変更しない。

### VI. Security by Default

すべてのchangeのproposalステップにおいて、変更内容に固有のセキュリティ質問（3〜5問）への回答を必須とする。質問はmspec-security-analyzerサブエージェントが変更コンテキスト（specs/・changes/<current>/）を分析して動的に生成し、権限境界・アクセス増加・エージェント権限・ロールバック手段の4カテゴリを必ずカバーする。エージェントが自律的にコードを生成・変更する際、セキュリティを後付けの考慮事項ではなく設計の一部として扱い、すべての変更がblast_radiusと権限変更の影響範囲を明示した状態でdelta specに記録されることを要求する。

### VII. 設計意図と実装の対応確認

設計フェーズで定義された生成ロジックや自動化手順は、実装フェーズで対応する実行コードが存在するかを明示的に確認する。設計意図が実装に引き継がれていない場合は「実装漏れ」として扱い、設計と実装の対応を追跡可能な形で記録する。

## Additional Constraints

- セキュリティ: ファイルシステム操作は `changes/` / `specs/` / `memory/` の範囲に閉じ、外部ネットワーク依存を持ち込まない。
- パフォーマンス: アンカースキャナおよび spec-linter は走査対象の行数に対して線形時間を維持する。
- コンプライアンス: 成果物テンプレートと `workflow.yaml` の強制ステップ定義は、本憲法の改訂手続きを経ずに変更しない。
- RFC 2119 キーワードセマンティクス: Delta Spec の Requirement 本文では、`SHALL` = 機能要件（system の振る舞いを規定）、`MUST` = 制約・安全要件（絶対的禁止または強制）、`SHOULD` = 推奨（逸脱可能だが理由が必要）、`MAY` = 任意（オプション機能）の使い分けを採用する。`delta-init` が生成する ADDED Requirement スタブのデフォルトは `SHALL`。
- 開発環境 HMR 不動作時は `lsof -ti:<port>` で重複プロセスを確認する: HMR が機能せず古いコードが配信され続ける現象が生じた場合は、`lsof -ti:<port>` で該当ポートのプロセスを確認し、重複起動していないかを最初に検証する。（Lesson: fix-pre-tag-checklist-ui）
- コンポーネント配置と Router スコープの事前設計: `useNavigate` など Router コンテキストに依存するフックを使用するコンポーネントは、設計フェーズで BrowserRouter のスコープ（ルートレベル配置 vs ネスト配置）を明示する。設計から実装に移る前に、コンポーネントの配置レベルと Router コンテキストの整合性を確認する。（Lesson: markdown-search-and-quick-access）
- TDD ランナー設定は Capability 種別ごとに分離する: CLI 変更と web-UI 変更で TDD enforce のランナー設定（期待する exit code など）を混在させない。Capability の種類（CLI / web-UI）ごとに runner config を分離し、red evidence が正しく記録できる構成にする。（Lesson: markdown-search-and-quick-access）
- self-review サブエージェントの独立性を保つ: self-review は必ずサブエージェントによる独立レビューで実施し、設計から実装への移行前に変更ファイルの網羅性（THEN句の実装対象ファイルが変更リストに含まれているか等）を確認させる。実装着手前のレビューが手戻りを防ぐ最も効果的なタイミングである。（Lesson: markdown-search-and-quick-access）
- `.claude/agents/` Write 保護対応パターン: `.claude/agents/` 配下のエージェント定義ファイルは自動モード分類器により Edit ツールでの直接書き込みがブロックされる。変更は `packages/cli/templates/claude/agents/` のテンプレートファイルを先に更新し、ユーザーが `cp` コマンドで runtime に同期する手順をタスクに明示すること。または Claude Code の permissions 設定に `.claude/agents/**` の Write 権限を追加して自動化する。（Lesson: checklist-reduce-verify-human）
- auditor ルール変更後は checklist.md を必ず再生成する: `mspec-checklist-auditor.md` の verify アノテーション規則（verify:human / verify:cmd / verify:fr-NNN）を変更した場合、既存の checklist.md は古いルールで生成されたままのため、auditor 更新後に `mspec checklist --change <change-dir>` を再実行して最新ルールを反映させる。（Lesson: checklist-reduce-verify-human）
- リスク判定は命名の類似性ではなく実コード確認を根拠とする: checklist や self-review でリスク判定する場合、関数名・変数名の類似性だけで HIGH 判定せず、実際のコードパスとファイルパスを確認して干渉の有無を実証的に評価する。（Lesson: init-gitignore-ui-pid）
- リサーチフェーズの仕様制約は Delta Spec 本文にも反映させる: リサーチフェーズで判明した仕様制約（CLI フラグの文字数制限・形式制約など）は、設計成果物（design.md）だけでなく Delta Spec の Requirement 本文にも反映させ、実装フェーズで設計と仕様の矛盾が生じないようにする。（Lesson: improve-postmortem-quality）

## Development Workflow & Governance

- 改訂手順: 本憲法の変更は専用のチェンジを切り、`design.md` の Constitution Check (Phase 0 / Phase 1) で全原則への影響を評価したうえで `mspec archive` 経由で反映する。
- レビュー方針: 各チェンジの self-review ステップで 5 原則すべてを Phase 0 / Phase 1 の二段で再評価し、違反または逸脱があれば Complexity Tracking に明記する。
- バージョニング: 原則の追加・削除・意味変更は MINOR 以上、文言の明確化は PATCH として `Version` と `Last Amended` を更新する。
