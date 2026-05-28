---
doc_type: Reference
---

# Research: checklist-reduce-verify-human

## Decisions

| 論点 | 採用案 | 代替案 | 根拠 |
|------|--------|--------|------|
| 変更対象ファイル | `.claude/agents/mspec-checklist-auditor.md` と `packages/cli/templates/claude/agents/mspec-checklist-auditor.md` を同時更新 | 一方のみ変更 | FR-014（claude-integration spec.md）が両ファイルの同期を MUST と規定。`checklist-auditor-verify-human-reason.e2e.test.ts:37` と `checklist-auditor-constitution-precheck.e2e.test.ts:46` が `runtime === template` を assert するため片方だけ変更すると CI 失敗 |
| verify:cmd 形式の導入 | `<!-- verify: cmd:<command> -->` を新形式として追加し、優先順位 (2) に位置づける | verify:fr-NNN のみ拡張 | FR-008 Scenario が CLI コマンドによる検証を明示。現行 auditor prompt（`.claude/agents/mspec-checklist-auditor.md:53-66`）に verify:cmd は存在せず、Constitution IV の anchor check ですら `verify: human` のままのため |
| Constitution IV の verify 変更 | `<!-- verify: cmd:mspec anchor check -->` に変更（FR-006 も MODIFIED） | FR-007 のみ変更 | ユーザー確認により FR-006 も同時 MODIFIED が決定。FR-007 が上書きルールとして機能するより FR-006 自体を更新する方が整合性が高い |
| Constitution VI の verify 変更 | `<!-- verify: cmd:grep "## Security Capabilities" -->` に変更 | verify:human のまま維持 | ユーザー確認により verify:cmd:grep が決定。grep 実行で Security Capabilities セクションの存在確認は完全に自動化可能 |
| verify:human 項目への子リスト | auditor prompt の Constraints 節に「verify:human 付与時は `  - ` 形式で最低 2 項目の確認手順を記載する」ルールを追加 | 任意扱い | FR-009 が SHALL で義務化。ユーザーリクエスト「チェックリストを見ても何をすればいいかわからない」への直接対応 |
| Web UI amber ハイライト対象 | verify:cmd 付き項目にも verify:human と同じ amber ハイライトを適用（FR-012） | ハイライトなし（通常表示） | ユーザー確認により決定。verify:cmd は「要注意項目」として視覚的に区別する必要がある |
| FR-008 の適用範囲 | Source-of-Truth Regression 項目も明示的に含める | Delta Spec Coverage 項目のみ | ユーザー確認により決定。典型的な過剰 verify:human の例が SoT Regression セクションに多い（`changes/2026-05-27-131059-fix-pre-tag-checklist-ui/checklist.md:31-34`） |

---

## Web References

本変更はプロジェクト内部ツールのみ対象のため外部 Web 参照なし。

---

## Codebase Findings

- `.claude/agents/mspec-checklist-auditor.md:53-66` — 現行の verify 優先順位ルールが集約されている。変更の中心ファイル。現状の priority 順: (1) critical FR → human、(2) E2E Scenario → fr-NNN、(3) Constitution IV → human（pre-check 付き）、(4) Constitution VI → human（pre-check 付き）、(5) その他 → human + 理由必須。`verify: cmd` は存在しない。
- `packages/cli/templates/claude/agents/mspec-checklist-auditor.md` — runtime と同一内容（FR-014 同期）。両ファイルを必ず同時に更新する。
- `packages/cli/tests/e2e/checklist-auditor-verify-human-reason.e2e.test.ts:37` — `runtime === template` の同期 assert。片方だけ変更すると CI 失敗。
- `packages/cli/tests/e2e/checklist-auditor-constitution-precheck.e2e.test.ts:46` — 同上の同期 assert（FR-006 側）。
- `packages/cli/tests/e2e/verify-routing-prompt.e2e.test.ts` — FR-003 テスト。FR-008/FR-009 相当の assert は未存在のため新規テスト追加が必要。
- `changes/2026-05-27-131059-fix-pre-tag-checklist-ui/checklist.md:31-34` — verify:human 過剰の典型例。`web-ui-server FR-001〜FR-004` は「影響なし」と明記されているにもかかわらず verify:human が付与されている。FR-008 適用で verify:fr-NNN または verify:cmd に変換対象。
- `packages/web-ui/tests/e2e/checklist-verify-human.e2e.test.ts` — Web UI amber ハイライトは verify:human のみ対象。FR-012 実装後に verify:cmd も amber ハイライト対象に拡張が必要。
- `specs/verify-routing/spec.md:108-116` — FR-007 の現在の SoT 版（変更前）。Delta Spec の MODIFIED FR-007/FR-006 でこれらを更新する。

---

## Open Choices

すべてのユーザー判断が完了した。

| 論点 | 決定 |
|------|------|
| Constitution IV の verify 変更スコープ | FR-006 も同時に MODIFIED |
| Constitution VI の扱い | verify:cmd:grep に変更 |
| verify:cmd の Web UI amber ハイライト | verify:human と同じ amber ハイライトを適用（FR-012） |
| Source-of-Truth Regression への FR-008 適用 | 明示的に含める |

---

## Constitution Check

| # | 原則 | Phase 0 | Phase 1 |
|---|------|---------|---------|
| I | ステップ独立性 | pass — research は読み取り専用調査のみ、他ステップの成果物を変更しない | — |
| II | 決定論的マージ | pass — Delta Spec は ADDED/MODIFIED セクションで明示的に変更を記述している | — |
| III | 質問駆動の要件確定 | pass — 4 件の Open Choices をユーザーに確認し、すべて決定済み | — |
| IV | 双方向アンカー | pass — 本アーティファクトにアンカーコメントなし（research.md は生成物） | — |
| V | 強制ステップと拡張ステップの分離 | pass — research は強制ステップ内に収まっている | — |
| VI | Security by Default | pass — Security Capabilities セクションに権限境界を明記済み | — |
