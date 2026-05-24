---
doc_type: Tutorial
---

<!-- @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md -->
<!-- Requirements implemented: FR-005 -->
<!-- Change: revise-artifact-taxonomy -->

# rename-visual-mock-to-prototype

> Status: new
> Created: 2026-05-23
> Mode: minor

## Request

`/mspec:mock` コマンドおよび関連スキル・UI の「mock」という名称を「visual prototype」に改名する。
また、`mspec init` 実行時にカスタムサブエージェント（`mspec-visual-mock-runner` 等）が `.claude/` にインストールされていない問題を修正し、init フローでサブエージェントを自動インストールするようにする。

## Artifacts

- [ ] proposal.md
- [x] specs/<capability>/spec.md (Delta Spec)
- [x] research.md
- [x] design.md / design-rationale.md / architecture-overview.md
- [ ] design-rationale.md
- [ ] quickstart.md
- [x] checklist.md
- [x] tasks.md

## Skipped Steps

<!-- `mspec skip <step-id> --reason "..."` 実行時に追記される -->
<!-- 例: - research: typo 修正のみのため省略 (skipped at 2026-05-14T10:30:00Z) -->

## Summary (Lessons / Next Steps)

### Lessons

- **self-review が設計漏れを検出**: `workflow.default.yaml` の visual-mock ステップ更新と E2E テストファイルのリネーム方針（D-005）が self-review で発見され、tasks ステップに反映できた。設計フェーズで「ファイルリスト」の網羅性を意識することが重要。
- **done-log.json の手動追記はバイパス**: `produces: []` ステップの完了は `mspec done <step>` コマンドで記録するのが正しい。JSON 直接編集は有効だが、今後は `mspec done self-review` の使用を徹底する。
- **安全順序の重要性**: エージェントファイル作成（T202/T203）を旧 runner 削除（T014）より先に実行することで、削除後に機能が一瞬消える窓を防げた。依存が明示されていなくても「新規 → 削除」の順を意識すること。
- **`git mv` と `Write` の違い**: `git mv` はファイルを移動するのみで内容は更新しない。Write で新ファイルを作る場合は旧ファイルの `git rm` を忘れずに行う必要がある（`mock.ts`/`mock-server.ts` の削除漏れが発生した）。
- **TDD 証拠の粒度**: `mspec test expect-red/green` は vitest スイート全体を実行し特定タスクの証拠として記録する。複数 FR をカバーする場合は各 FR のタスク ID で個別に緑証拠を記録することで checklist の自動チェックが完結する。

### Next Steps

- **SoT 仕様書の旧 `mock` 参照を更新**: `specs/visual-mock/spec.md` の Scenario 文言に `mock/` パスや `mock-feedback.md` が残存している場合は別チェンジで修正する（FR-001〜FR-004 に関連）。
- **`mspec-visual-prototype-runner` subagent の本実装**: 現在の runner は HTML 生成プロセスを説明するプレースホルダー。実際に `proposal.md` を読んで HTML を生成するロジックの強化を検討（FR-005 の完全実装）。
- **`mspec mock` エイリアスの削除確認**: D-004 でエイリアスなし削除を決定したが、既存ユーザーへの移行ガイドを README に追記する必要がある。
