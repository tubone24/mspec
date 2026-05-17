---
doc_type: Reference
---

# Checklist: fix-command-name-consistency

## Delta Spec Coverage

- [x] FR-017 (claude-integration): 全スキルファイル（`.claude/skills/mspec-*/SKILL.md`）と全エージェントファイル（`.claude/agents/mspec-*.md`）に `/mspec-<step>` 形式の参照が残っていないことを確認する。`grep -r "/mspec-" .claude/` の結果が 0 件であること。 <!-- verify: fr-017 -->
- [x] FR-001 (cli-core): CLIソース（`packages/cli/src/commands/init.ts`, `new.ts`）の次ステップ案内メッセージがすべてコロン形式（`/mspec:<step>`）になっており、テンプレートファイル（`packages/cli/templates/claude/` および `packages/cli/templates/workflow.default.yaml`）でも同様に `grep -r "/mspec-" packages/cli/templates/` が 0 件であることを確認する。 <!-- verify: fr-001 -->
- [x] FR-002 (cli-core): ドキュメントファイル（`README.md`, `docs/**/*.md`）内のすべてのスラッシュコマンド参照がコロン形式（`/mspec:<step>`）になっており、ハイフン形式が残存しないことを確認する。 <!-- verify: fr-002 -->

## Source-of-Truth Regression

### claude-integration

- [x] [HIGH] FR-001 (claude-integration SoT): SoT `specs/claude-integration/spec.md` の FR-001 Scenario に `/mspec-new`, `/mspec-proposal`, `/mspec-continue` 等のハイフン形式が記述されている（行 18）。このファイルを直接修正する場合、archive マージ時に Delta Spec とバッティングするリスクがある。SoT ファイルへの直接修正が Design Decision 4 の方針に基づき実施されたことを確認し、修正後の FR-001 本文・Scenario がコロン形式に統一されていることを検証すること。 <!-- verify: human -->
  - **確認済み**: grep で 0 件（行 18・98 とも修正済み）。archive-merger は "ADDED FR が SoT に既存の場合エラー" のみ — FR-017 は新規のため archive は正常に動作する。
- [x] [HIGH] FR-008 (claude-integration SoT): FR-008 の Scenario（行 98）は `/mspec-continue` を参照している。SoT ファイルへの直接修正対象に含まれているか確認する。Scenario 文中に残存するハイフン形式は FR-017 の要件に抵触するため、修正漏れがあれば grep で検出されること。 <!-- verify: fr-017 -->
- [x] [MEDIUM] FR-002 (claude-integration SoT): SKILL.md の frontmatter `name: mspec-<step>` フィールドはハイフン形式を維持しなければならない（スキルレジストリ識別子）。テキスト置換時に `name:` 行まで誤って変換していないことを確認する。 <!-- verify: human -->
- [x] [MEDIUM] when_to_use フィールド変換確認: 全スキルファイルの `when_to_use:` フィールド値（例: `User runs /mspec:proposal, or workflow auto-continues to proposal`）がコロン形式に変換されており、`name:` フィールドはハイフン形式のまま保持されていることを確認する。`grep -r "when_to_use.*mspec-" .claude/skills/` が 0 件であること。 <!-- verify: fr-017 -->
- [x] [MEDIUM] FR-004 (claude-integration SoT): サブエージェントファイル名 `mspec-researcher.md`, `mspec-self-reviewer.md`, `mspec-checklist-auditor.md` はハイフン形式のまま維持する必要がある。ファイル名変更・内部のサブエージェント名参照が誤って変換されていないことを確認する。 <!-- verify: human -->
- [x] [MEDIUM] FR-007 (claude-integration SoT): `mspec continue` JSON 出力の `subagent_name` フィールド値（例: `"mspec-researcher"`）はハイフン形式識別子であり変更不可。Skill ファイルの Procedure 内でこれらフィールド値を参照している文字列が誤って置換されていないことを確認する。 <!-- verify: human -->
- [x] [LOW] FR-006 (claude-integration SoT): Skill が `mspec validate --change <name>` 等の CLI コマンドを委譲する手順の記述に変更がないことを確認する（CLI コマンドのサブコマンド名はハイフン形式ではなくスペース区切りのため影響を受けない想定だが、テキスト置換の副作用がないか目視確認）。 <!-- verify: human -->

### cli-init

- [x] [HIGH] FR-010 (cli-init SoT): `specs/cli-init/spec.md` の FR-010 Scenario（行 130）に `next: run /mspec-new <feature>` というハイフン形式の記述がある。design.md で `specs/cli-init/spec.md` を直接修正対象と明記しているため、この行がコロン形式に変更されていることを確認する。 <!-- verify: fr-001 -->
- [x] [MEDIUM] FR-007 (cli-init SoT): `mspec init --tools claude` で配置されるスキルファイルのパスに `mspec-*` という識別子名が含まれる（行 87）。このディレクトリ名がテキスト置換で誤って変更されていないことを確認する。 <!-- verify: human -->
- [x] [LOW] FR-008 (cli-init SoT): `mspec init --tools claude --no-subagents` で配置されないファイルのパターン `.claude/agents/mspec-*.md`（行 107）はファイル名パターンのためハイフン形式維持が正しい。この記述が誤って変換されていないことを確認する。 <!-- verify: human -->

### workflow.yaml（関連設定ファイル）

- [x] [HIGH] workflow.yaml `command:` フィールド: Design Decision 3 に従い `.mspec/workflow.yaml` の全ステップ `command:` フィールドがコロン形式に修正されている一方、`skill:` フィールド（例: `skill: mspec-new`）はハイフン形式のまま保持されていることを確認する。`skill:` フィールドまで誤って変換されると Claude のスキル解決が壊れる。 <!-- verify: human -->

## Constitution

- [x] I. ステップ独立性 — 本変更はテキスト置換のみでロジック変更なし。design.md で各ファイルへの修正が独立していることが確認されている。archive 後に他ステップのスキル SKILL.md が前段の会話文脈に依存しない設計を維持していることを確認する。 <!-- verify: human -->
- [x] II. 決定論的マージ — 選択的置換ルール（識別子保護の除外条件）が design.md Decision 1 に明文化されており、同一入力に対する置換結果が再現可能であることを確認する。SoT スペックへの直接修正（Decision 4）が archive マージの決定論性を損なわないことも確認すること。 <!-- verify: human -->
  - **確認済み**: archive-merger ソースより、マージ衝突は「ADDED な FR-ID が既存 SoT に存在する場合」のみ発生。FR-017 は新規 ID のため衝突なし。既存 FR の誤記修正と新規 FR 追加は独立している。
- [x] III. 質問駆動の要件確定 — スコープ・廃止方針・完了基準が proposal ステップで確定済みであり、design.md に追跡可能な根拠が記録されていることを確認する。 <!-- verify: human -->
- [x] IV. 双方向アンカー — 実装ファイルおよびテストファイルに `@mspec-delta` アンカーが付与されており、FR-017（スキルファイル）・FR-001/FR-002（CLIソース・テンプレート・ドキュメント）それぞれへの対応が取れていることを `mspec anchor check` で検証する。 <!-- verify: human -->
- [x] V. 強制ステップと拡張ステップの分離 — 本変更は既存ファイルの文字列修正のみでステップ追加・削除・workflow.yaml スキーマ変更は行っていない。`workflow.yaml` の強制ステップ定義（`removable` フラグ等）が変更されていないことを確認する。 <!-- verify: human -->
