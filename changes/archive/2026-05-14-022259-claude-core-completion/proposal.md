# Proposal: Claude 向け mspec v0 機能ギャップ充足 (Dogfooding 準備)

## Why

`docs/design/mspec-design.md` は v0 (Claude Code 一次ターゲット) の仕様を網羅しているが、`packages/cli` の実装は CLI コマンド表面 (sub-command 一覧) が揃っているのみで、内部ロジック・enforce 系オプション・テンプレート連携・Constitution Check 検証など、設計に対する機能ギャップが多数残っている可能性が高い (例: `enforce_anchor` / `enforce_e2e` / `enforce_tdd` / `enforce_fr_ids`、`spec lint`、`mspec test --expect-red/green` の証跡保存、`skip` 時のプレースホルダ生成、Constitution Check 表の `validate` 強制、ArchitectureOverview Mermaid 必須化、`mspec continue` の `subagent_prompt`/`upstream_skipped`/`questions_to_ask` フィールド)。

このチェンジでは「設計と実装の差分」を解消し、mspec が自分自身の開発プロセス (dogfooding) を成立させられる状態に持っていく。具体的には、ギャップを Delta Spec の FR-NNN として明文化したうえで実装し、最後に `mspec init` を実打して生まれた成果物で `README.md` を最新化することで、ユーザーが README を読めば即座に動かせる状態を担保する。

ただし Codex / Copilot 向けの統合 (`packages/cli/src/integrations/codex` / `integrations/copilot`、`mspec init --tools codex|copilot`) は別チェンジに分離し、本提案では Claude Code 統合と CLI コア機能のみを対象とする。

## Goals

- `docs/design/mspec-design.md` で定義済みかつ未実装/部分実装の機能を網羅的に洗い出し、Delta Spec に FR-NNN として記録する。
- 洗い出した FR を実装し、各 FR に対応する E2E シナリオ (`#### Scenario:`) と `@mspec-delta` アンカーで双方向リンクを確立する。
- `mspec validate --strict` が通り、`mspec anchor check` がクリーンになり、`mspec spec lint` の禁止語彙検出が機能する状態にする。
- `mspec` 自身を使って (この change ディレクトリで) dogfooding を完遂し、最終 `archive` 時に `specs/<capability>/spec.md` がマージで更新されることを実証する。
- Dogfooding の最終工程として、空のリポジトリで `mspec init` を実行し直し、その結果生成される `.mspec/` / `.claude/` 構造を踏まえて `README.md` を最新化する (インストール手順・CLI コマンド表・Claude スキル一覧・クイックスタート反映)。

## Non-Goals

- Claude Code 以外のプロダクト (Codex CLI / GitHub Copilot Workspace) 向け統合の追加。`packages/cli/src/integrations/{codex,copilot}` および `mspec init --tools codex|copilot` 分岐は本チェンジでは扱わない。
- 既存 CLI 表面 (コマンド名・サブコマンド名) の破壊的リネーム。設計と実装が乖離しているところは「実装を設計に寄せる」方向で揃え、`mspec-design.md` 側の API 変更は行わない。
- mspec ワークフロー本体の刷新 (新ステップ追加、`workflow.yaml` v2 化など)。設計済みの 11 ステップ (`new`/`proposal`/`delta`/`research`/`design`/`quickstart`/`checklist`/`self-review`/`tasks`/`implement`/`archive`) を前提に動作を完成させる。
- パフォーマンス最適化、国際化、認証/認可。CLI は社内開発者ローカル実行が前提。
- `memory/constitution.md` の本文充実化 (テンプレからの脱却)。Constitution Check の検証ロジック自体は実装するが、原則の文言は別チェンジで磨く。

## Capabilities (touched)

実ギャップ調査 (`packages/cli/src` の grep + 56/56 通過テスト + 設計文言と既存 9 spec の突合) により、当初列挙していた 10 capability のうち実際に Delta Spec 変更が必要なのは以下に絞られた。残りは既存 FR と実装が揃っているため、本チェンジでは触らない。

- `cli-spec-lint` — **新規 capability**。`packages/cli/src/lib/spec-linter.ts` と `commands/spec-lint.ts` は実装済みかつテスト通過しているが、対応する `specs/cli-spec-lint/spec.md` が存在しない (spec 化の漏れ)。全 FR を ADDED として正式化する。
- `cli-anchor` — **アンカースキャナの false-positive バグを MODIFY**。現状 `README.md` / `specs/cli-anchor/spec.md` / `packages/cli/src/parser/anchor.ts` の正規表現定義行など、`@mspec-delta` トークンを **解説目的で含む行** を「malformed path line」として warning にしてしまう。スキャナ側で「実アンカーとみなさない文脈」を除外する規則を仕様化する。
- `cli-archive` — **`diff --stat` 風サマリレポート未仕様**。`docs/design/mspec-design.md §3.2` の archive 手順 #4 は「`git diff --stat` 相当のレポートを出力 (LLM 不使用)」と謳うが、`cli-archive/spec.md` には対応 FR が無い。マージ実行後の決定論的サマリ出力を ADDED として規定する。
- `cli-workflow-engine` — **`mspec continue` 出力フィールドの完全網羅と `architecture-overview.md` Mermaid 必須化**。設計の `continue` JSON envelope は `upstream_skipped[]` / `constitution_principles[]` を約束しているが既存 FR-010〜012 では曖昧。また `architecture-overview.md` の Mermaid ブロック存在を `validate` が強制する旨も spec 上規定されていない。両者を ADDED する。
- `documentation` — **Dogfooding 完了後の `README.md` 最新化**。これは仕様 capability ではなく実装ステップで完結する単発タスク (新たな振る舞いを増やさない) のため Delta Spec には含めず、`tasks.md` 段階で task として登録する。

## Open Questions

- `cli-anchor` スキャナの除外規則: 「regex リテラル中の `@mspec-delta`」「fenced code block 内の例示アンカー」「自分自身を解説する spec ファイル」など、どのレベルで除外するか。research 段階で実ファイルの誤検出パターン (現状 10+ 件出力) を列挙してから design で確定する。
- `cli-archive` のレポート出力フォーマット: 純テキスト 1 行サマリか、複数行で capability ごとに件数を出すか。決定論性 (再実行で同一出力) を担保したうえで research で選定。
- `cli-workflow-engine` の Mermaid validate 強制レベル: 常時 hard fail か、`validate --strict` 時のみ fail か。設計 §5.6 のニュアンス (「Mermaid で表現不能な時のみ SVG」) を尊重して design で判断。
- Dogfooding 後の README 全面更新か追記かは documentation task の中で判断 (本チェンジの Delta Spec スコープ外)。

## Constitution Check

> Step: proposal | Constitution Version: 1.0.0

`memory/constitution.md` は初期テンプレ状態のため、本表は `docs/design/mspec-design.md §1.2` で定義された 5 つの設計原則 (P1–P5) を実質的な憲法とみなして評価する。Phase 1 列は design ステップで再評価するため `—`。

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 (P1) | ✅ | — | 本チェンジは `mspec status` / `mspec continue` の再読込前提に従い、新ステップ追加なし。 |
| II. 決定論的マージ (P2) | ✅ | — | archive のマージは CLI パーサー責務のままで、LLM は介在させない。 |
| III. 質問駆動の要件確定 (P3) | ✅ | — | 本提案でも AskUserQuestion 主体のフローを継続。今回はユーザー指示で質問省略しているが仕組み自体は維持。 |
| IV. 双方向アンカー (P4) | ✅ | — | 全 FR に対応する実装ファイル/E2E に `@mspec-delta` アンカーを必須化する。 |
| V. 強制ステップと拡張ステップの分離 (P5) | ✅ | — | `removable: false` を保ち、ワークフロー構造は変更しない。 |

### Complexity Tracking

None — 違反 0 件。本チェンジは設計済みの v0 機能を実装に追従させるのみで、新たな抽象や原則違反は導入しない。
