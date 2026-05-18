---
doc_type: Tutorial
---

<!-- @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md -->
<!-- Requirements implemented: FR-005 -->
<!-- Change: revise-artifact-taxonomy -->

# cli-upgrade

> Status: archived
> Created: 2026-05-18

## Request

インストール後に mspec CLI を最新バージョンへアップグレードできるコマンドを追加してほしい。
`mspec upgrade` のようなサブコマンドを実装し、ユーザーが手動で再インストールしなくても最新版に更新できるようにする。

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

- **Node.js 組み込み `fetch` + `AbortSignal.timeout()` が依存追加なしで十分機能した。** `engines.node: >=18.0.0` を活かして外部 HTTP ライブラリを追加せず実装できた。既存の `spawnSync` + `ask()` パターンを再利用した結果、コードスタイルの一貫性も維持できた。
- **self-review サブエージェントが 2 つの HIGH 問題を発見した。** (1) design.md の Flow と エラー表で非 TTY 挙動が矛盾（`ask()` が空文字を返す → 進む/キャンセルの相反する記述）、(2) Constitution Check テーブルの Additional Constraints 行が欠落。いずれも実装前に修正できた。
- **`enforce_e2e` は `tests/e2e/` ディレクトリ下のアンカーを要求する。** `src/commands/` 下のユニットテストだけでは通過しない。TDD 赤→緑サイクルは実装と同時ではなく順序を守る必要がある。
- **cli-distribution の `latest` タグ未設定リスクが HIGH として検出された。** beta タグのみで公開中は `mspec upgrade` が 404 で失敗する。リリース前に `npm dist-tag add @mspec/cli@<version> latest` の実行を手順に組み込むことが必要。
- **2 capability（cli-upgrade × 4FR、version-check × 3FR）の設計・実装を全ステップで完走。** proposal → delta → research → design → checklist → self-review → tasks → implement の全フローを通じて、成果物間のトレーサビリティが確保された。

### Next Steps

- **`latest` タグをリリースフローに組み込む**: `npm publish` の手順に `npm dist-tag add @mspec/cli@<version> latest` を追記する（cli-distribution capability 参照）。
- **`verify: human` の未チェック項目の確認**: cli-core FR-002（ドキュメント表記）、原則 I/II/III/V、Additional Constraints の最終確認が残っている。
- **`--check` フラグの追加検討**: `mspec upgrade --check` でアップグレードなしにバージョン差分だけ表示する機能（proposal の Open Questions に記録）。
