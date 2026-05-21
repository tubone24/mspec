---
doc_type: Tutorial
---

<!-- @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md -->
<!-- Requirements implemented: FR-005 -->
<!-- Change: revise-artifact-taxonomy -->

# ui-visual-mock-workflow

> Status: new
> Created: 2026-05-21

## Request

UI 画面を仕様書や設計ドキュメントに言語で記述するのは難しく工数がかかる。
代わりに visual mock（ビジュアルモックアップ）を先に作成してユーザーと認識合わせを行い、
その mock から tasks.md を生成するワークフローを mspec に導入する。

## Artifacts

- [x] proposal.md
- [x] specs/<capability>/spec.md (Delta Spec)
- [x] research.md
- [x] design.md / design-rationale.md / architecture-overview.md
- [ ] design-rationale.md
- [x] quickstart.md
- [x] checklist.md
- [x] tasks.md

## Skipped Steps

<!-- `mspec skip <step-id> --reason "..."` 実行時に追記される -->
<!-- 例: - research: typo 修正のみのため省略 (skipped at 2026-05-14T10:30:00Z) -->

## Summary (Lessons / Next Steps)

### Lessons

- **workflow.yaml の `subagent` フィールドは boolean 型のみ**。design.md D-001 に `subagent: mspec-visual-mock-runner`（文字列）と記述されていたが Zod スキーマは `z.boolean()` のみ許可。`subagent: true` に修正した。スキーマ制約と設計文書の不一致は implement ステップ前に architecture 確認で検出できる。
- **E2E テストは `tests/e2e/` 配置が必須**。`enforce_e2e` のパス正規表現は `tests/`, `e2e/` 等を要求し、`src/commands/*.test.ts` はマッチしない。既存のパターンに合わせて `tests/e2e/*.e2e.test.ts` に置く必要があった。
- **実ワークフロー YAML を使った統合テストでは fixture も仕様準拠が必要**。`constitution_check: true` のステップがあるため、fixture の `proposal.md` に `doc_type` frontmatter と `## Constitution Check` セクションが必要だった。
- **template 変更時は runtime も同時更新**。`runtime-template-sync.e2e.test.ts` が template/runtime の内容一致を検証しており、template のみ更新すると CI が落ちる。

### Next Steps

- **mspec-visual-mock-runner の自動 HTML 生成統合** (FR-001): 現在はサブエージェント呼び出しを SKILL.md で案内するだけ。将来的に `mspec mock` コマンド内から Claude API を直接呼び出す実装を検討する。
- **SIGINT フロー（Ctrl+C → フィードバック収集）の自動テスト** (FR-003): 現在の E2E テスト環境では TTY がないため `askMultiline` は空文字列を返す。TTY モックを使ったテストで complete なフロー検証が可能。
- **mock-feedback.md ソフト参照の実運用検証** (FR-004): `mspec-tasks/SKILL.md` の更新は済んでいるが、次回のワークフロー実行でフィードバックが tasks.md に反映されることを確認する。
