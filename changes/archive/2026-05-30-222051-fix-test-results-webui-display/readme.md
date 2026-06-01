---
doc_type: Tutorial
---

<!-- @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md -->
<!-- Requirements implemented: FR-005 -->
<!-- Change: revise-artifact-taxonomy -->

# fix-test-results-webui-display

> Status: in-progress
> Created: 2026-05-30
> Mode: bugfix

## Request

Test Results（テスト結果）が WebUI に表示されない不具合を修正する。
`mspec test` や CI 実行後のテスト結果が Web インターフェース上で確認できない状態になっており、ユーザーが結果を参照するためにコマンドラインに戻る必要がある。

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

- **2 層バグの発見**: 「WebUI に表示されない」問題は ①`convertTestResults()` が CLI に未登録で `test-results.json` が生成されない（一次原因）と ②API が 404 を返し WebUI が赤エラー表示になる（二次原因）の 2 層構造だった。片方だけ修正しても症状が残るケース。
- **設計中の仮定が間違っていた**: Vitest 検出ヒューリスティックを `testResults[].tasks` で書いたが、実際は Jest 互換形式で `snapshot` フィールドが識別キー。self-review サブエージェントがライブラリドキュメントとのクロス検証でブロッカーを検出した。
- **ユーザーフローの優先確認が必要**: 「`mspec test-results convert` の手動コマンドを追加」で設計を進めたが、ユーザーが実際に望んでいたのは `mspec test` 完了後の**自動表示**だった。実装前のフロー確認が設計変更を防ぐ。
- **`produces: []` ステップの完了方法**: self-review など成果物を生成しないステップは `mspec done <step-id>` で明示的に完了マークが必要。`mspec validate` だけでは状態が進まない。

### Next Steps

- Jest / Vitest を使うプロジェクトで `e2e-results/` に結果が届くかの E2E 確認が未完了 — FR-013 のシナリオを実環境で検証する変更が必要
- `if (error) → "No test results found."` によるエラー隠蔽リスク（verify: human 未解消）— 500 エラー時のコンソール出力確認と toast 通知の追加を検討すること（関連: FR-011）
- `mspec test-results convert --change <id>` の手動コマンドも Power User 向けに追加する価値あり — 再変換ユースケースに対応するため別チェンジで追加を検討すること（関連: FR-012）
