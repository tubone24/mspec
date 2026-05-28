# Research: improve-postmortem-quality

## Decisions

| 論点 | 採用案 | 代替案 | 根拠 |
|------|--------|--------|------|
| **nextaction-planner: readme 書き込みの責務分担** | (C) planner が `request_summary` フィールドを JSON に追加し、archive スキルが `mspec new <kebab_name> --request "<request_summary>"` と呼ぶ | (A) archive が mspec new 後に Edit ツールで直接書き込む | `mspec new --request` CLI フラグが既に実装済み（`packages/cli/src/commands/new.ts:105` の `{{request}}` 置換）。CLI が readme 生成時点で埋め込むため Edit ツールでの後書き不要。planner を read-only のまま維持できる。 |
| **Lessons の抽象化判定基準** | 固有名詞シグナル: ツール名・ファイル名・操作名が含まれる場合は抽象化必須。抽象原則語彙のみの場合は pass-through | 全エントリを無条件に再抽象化 | Delta Spec FR-003 Scenario 3「既に抽象的な Lesson は変換不要」と FR-003 本文「SHALL 抽象化する」を矛盾なく解釈するため。固有名詞の有無を concreteness signal として使うことで判定を一貫化できる。 |
| **request_summary の行数制限** | 1行制限（改行なしの単一テキスト） | 3行まで許容 | CLI ヘルプが "one-line user request" と記載。シェル引数エスケープの複雑さを回避。詳細は後続 proposal ステップに委ねる。 |
| **`.claude/agents/*.md` の変更方法** | cp コマンドでテンプレートから同期 | permissions に `.claude/agents/**` を追加して直接 Write | 最小権限原則。パーミッション設定の変更という副作用を避け、タスクに必要な操作のみを行う。 |
| **抽象化の「昇華」深度** | 最大1段階（具体事象 → プロセス原則）。哲学的命題には昇華しない | 複数段階の再帰抽象化 | Google SRE postmortem 文化の "Auxiliary → Fundamental Reasons" 区別に倣い、実用的に適用できる粒度に留める。 |
| **`request_summary` の後方互換性** | optional フィールドとして追加（archive スキルは未存在時にプレースホルダーでフォールバック） | 必須フィールドとして追加 | in-flight change を処理中の archive スキルを壊さないための安全策。 |

## Web References

- [Google SRE — Postmortem Culture: Learning from Failure](https://sre.google/sre-book/postmortem-culture/) — blameless postmortem の標準フレームワーク。具体事象から再発防止策を構造化する手順を規定。Auxiliary Reasons と Fundamental Reasons の区別が抽象化深度の設計根拠。
- [Atlassian — The power of 5 Whys](https://www.atlassian.com/incident-management/postmortem/5-whys) — 「なぜを5回繰り返す」手法により具体的障害から構造的制約を抽出するプロセスを説明。lessons-analyzer の昇華ロジックの参考。
- [Anthropic Engineering — Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) — サブエージェントへの「適切な抽象度でのコンテキスト付与」指針。lessons-analyzer のプロンプト改訂に直接適用できる。
- [Facilitating Effective Retrospectives (J Edwards, Swlh/Medium)](https://medium.com/swlh/facilitating-effective-retrospectives-capturing-lessons-and-actually-learning-from-them-3bbb683ba983) — retrospective で Lessons を「再利用可能な原則」に転換するファシリテーション手法。schema-learning（抽象構造の獲得）の文脈で引用可能。

## Codebase Findings

- `.claude/agents/mspec-lessons-analyzer.md:28–33` — 現行の step 5b は「抽象化・一般化した原則/制約の本文」と指示しているが、どの程度まで昇華するかの基準が未定義。固有名詞シグナルルールを追記する必要がある。
- `.claude/agents/mspec-nextaction-planner.md:24–51` — 現行出力スキーマは `{ priority, kebab_name, summary, source_next_step }` の4フィールド。`request_summary`（1行の概略テキスト）フィールドを optional として追加する必要がある。
- `.claude/skills/mspec-archive/SKILL.md:72` — `mspec new <kebab_name>` を呼ぶ行が存在。`--request "<request_summary>"` を追記するだけで FR-003 が実現できる。追加の CLI 変更は不要。
- `packages/cli/src/commands/new.ts:105` — `readmeContent.replace(/{{request}}/g, opts.request ?? '<ユーザーの元の要求を 1-3 行で要約>')` — `--request` フラグが既に readme テンプレートの `{{request}}` プレースホルダーを置換する実装が存在。**CLI 側の変更は不要**。
- `.claude/skills/mspec-lessons-analyzer/SKILL.md` と `.claude/agents/mspec-lessons-analyzer.md` の2ファイルが存在（スキルトリガー定義とサブエージェント定義）。両方を cp コマンドで同期して変更する必要がある。mspec-nextaction-planner も同様の2ファイル構成。
- `memory/constitution.md:43` — `.claude/agents/` 配下ファイルへの直接 Write は自動モード分類器によりブロックされる場合がある（既存 Constraint に明記）。実装タスクで cp 手順を明示する必要がある。
- `changes/archive/2026-05-27-070619-dynamic-security-questions/readme.md:38–42` — 実際の Lessons 記録例。「`mspec test expect-red` は…」等のツール固有具体事象が多く、FR-003 変換後イメージと対比できる典型サンプル。
- `specs/mspec-lessons-analyzer/spec.md:14–46` — SoT spec。現行 FR-001 の scenario が「delta スキル完了後に validate を必須化する」という準具体的テキストを提案例として示しており、FR-003 適用後は「成果物の品質ゲートをスキル完了条件に組み込む」レベルに引き上げる必要がある。
- `specs/mspec-nextaction-planner/spec.md:12–46` — SoT spec。FR-002 の kebab_name 正規化ルールと FR-003 の `request_summary` 生成ルールは独立して共存する。

## Open Choices（確定済み）

- **request_summary の責務分担** → Option C（planner が JSON に追加、archive が `--request` フラグで渡す）✅
- **Lessons の抽象化判定基準** → 固有名詞シグナルルール（ツール名・ファイル名含む場合は必ず抽象化）✅
- **request_summary の行数制限** → 1行制限（改行なしの単一テキスト）✅
- **.claude/agents/*.md の変更方法** → cp コマンドでテンプレートから同期✅

## Constitution Check

| 原則 | Phase 0 | Phase 1 |
|------|---------|---------|
| I. ステップ独立性 | ✅ research は delta spec を読み取るのみ。実装に踏み込まない | — |
| II. 決定論的マージ | ✅ FR-003 追加のみ。既存 FR-001/002 に干渉しない | — |
| III. 質問駆動の要件確定 | ✅ 4つの Open Choices をユーザーに確認し全て回答済み | — |
| IV. 双方向アンカー | ✅ Delta Spec の FR-NNN と SoT spec の対応が明確 | — |
| V. 強制ステップと拡張ステップの分離 | ✅ research は拡張ステップ。強制ステップ（implement/archive）に変更なし | — |
| VI. Security by Default | ✅ planner を read-only のまま維持。.claude/agents/ への直接 Write を避け cp で対処 | — |
