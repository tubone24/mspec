---
name: mspec-proposal
description: proposal step of mspec workflow — clarify intent and write proposal.md
when_to_use: User runs /mspec:proposal, or workflow auto-continues to proposal
---

<!-- @mspec-delta 2026-05-15-063805-fix-command-name-consistency/specs/claude-integration/spec.md -->
<!-- Requirements implemented: FR-017 -->
<!-- Change: fix-command-name-consistency -->

<!-- @mspec-delta 2026-05-15-040857-step-checkbox-update/specs/claude-integration/spec.md -->
<!-- Requirements implemented: FR-015 -->
<!-- Change: step-checkbox-update -->

<!-- @mspec-delta 2026-05-16-170347-lightweight-change-mode/specs/claude-integration/spec.md -->
<!-- Requirements implemented: FR-019 -->
<!-- Change: lightweight-change-mode -->

<!-- @mspec-delta 2026-05-25-051411-security-as-default/specs/mspec-proposal/spec.md -->
<!-- Requirements implemented: FR-001, FR-002 -->
<!-- Change: security-as-default -->

## Procedure

0. **モードスキップ判定**: `readme.md` の `> Mode:` フィールドを読む。ワークフローの `modes.<mode>.skip` にこのステップ（`proposal`）が含まれる場合は成果物を生成せず終了する（`mspec continue` がスキップ済みとして扱う）。
1. Run `mspec status --change <change-dir> --json` first.
2. Read `readme.md`.
3. Run `mspec questions --phase proposal --json` to load the question bank.
4. Ask 3–5 clarifying questions via AskUserQuestion (1 per call, multi-select preferred), covering functional scope, NFR, completion criteria, terminology. **その後、Securityカテゴリ（PRP-SEC-001〜004）の4問をAskUserQuestionで別枠として必ず提示すること（3〜5問の上限に含まれない）。** PRP-SEC-003で「あり」を選択した場合は、その内容を `## Open Questions` に記録すること。
5. Write `proposal.md` from the artifact template (Why / Goals / Non-Goals / Capabilities / Open Questions).
   - `## Capabilities (touched)` の各 capability 名は kebab-case で記述する。後続の delta ステップでこのリストを元に `mspec delta init` が実行され、各 Requirement は EARS 形式（SHALL / MUST / SHOULD）＋ Scenario（GIVEN/WHEN/THEN）で記述される。
   - `## Decisions` テーブルにPRP-SEC-001〜004のsecurity質問の回答を記録すること。
6. Fill the `## Constitution Check` table (Phase 0 column only; Phase 1 stays `—`).
6a. `readme.md` の `## Artifacts` 節の `- [ ] proposal.md` を `- [x] proposal.md` に更新する。
7. Run `mspec validate --change <change-dir>`. validate が失敗した場合は `- [x] proposal.md` を `- [ ] proposal.md` にロールバックする。
8. `block: true` — stop and ask the user to run `/mspec:continue`.

## Verification (C2)

- `mspec validate --change <change>` — アーティファクト整合性チェック
- `mspec anchor check --change <change>` — アンカー解決確認
- `mspec validate --change <change> --strict` — Constitution Check確認

## Learning (C3)

このスキルの実行で発生した学習候補を記録する:

```
<!-- LEARNING: <パターン説明> | source: <FR-ID> | confidence: low|medium|high -->
```

`mspec learn` コマンドが archive 済み changes からこれらを収集してpost-condition候補をproposeする。
