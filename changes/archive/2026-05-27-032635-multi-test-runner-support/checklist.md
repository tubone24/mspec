---
doc_type: How-to
---

# Checklist: multi-test-runner-support

## Delta Spec Coverage

<!-- verify: fr-010 -->
- [x] FR-010: `.mspec/config.yaml` の `test.runners` 配列が `name`・`command`・`expect_red_on_exit`・`expect_green_on_exit` を持つ独立したランナー定義として正しく解釈されること。`RunnerSchema` が型安全スキーマで定義され、`TestConfigSchema` に `.optional()` で追加されていることを確認する。

<!-- verify: fr-011 -->
- [x] FR-011: 全ランナーが逐次実行され、全成功時のみ証跡 JSON が `.mspec/cache/green-evidence/<change>__<task-id>.json` に保存されること。証跡の `command` フィールドが文字列配列、`runners` フィールドに `[{name, exit_code}]` が含まれることを確認する。

<!-- verify: fr-012 -->
- [x] FR-012: 先行ランナーが失敗した場合、後続ランナーが実行されないこと。stderr に `runner "<name>" failed with exit code <N>` 相当のメッセージが出力され、証跡ファイルが保存されないことを確認する。

## Source-of-Truth Regression

<!-- Risk level: HIGH — resolveRunners() が legacy モードへのフォールバックを誤ると FR-001〜FR-004 全体が壊れる -->
- [x] FR-001 regression: `test.runners` が未設定の既存プロジェクトで `mspec test --expect-red T001` を実行し、単一コマンドが実行されて red 証跡が保存されること（`resolveRunners` の legacy パスが正しく `test.command` を返すか）。

<!-- Risk level: HIGH — resolveRunners() legacy フォールバックが `expect_red_on_exit` を正しく参照しない場合、FR-002 のリジェクション判定が崩れる -->
- [x] FR-002 regression: legacy モードで `--expect-red` 実行中に exit code が `expect_green_on_exit` に属するとき、非ゼロ終了かつ証跡未保存であること。

<!-- Risk level: HIGH — FR-003 は FR-001 の green 版。同一の legacy パスを通るため同一リスク -->
- [x] FR-003 regression: legacy モードで `mspec test --expect-green T001` を実行し、green 証跡が保存されること。

<!-- Risk level: HIGH — FR-004 は FR-002 の green 版。reject ロジックが legacy モードで壊れていないか -->
- [x] FR-004 regression: legacy モードで `--expect-green` 実行中に exit code が `expect_red_on_exit` に属するとき、非ゼロ終了かつ証跡未保存であること。

<!-- Risk level: LOW — 証跡ファイルの保存先ディレクトリは変更なし -->
- [x] FR-005 regression: 証跡ファイルが引き続き `.mspec/cache/red-evidence/` または `.mspec/cache/green-evidence/` のみに保存され、`.gitignore` 対象外の場所に書き出されないこと。

<!-- Risk level: MEDIUM — resolveRunners が command: '' を渡した際にプロンプトが正しくトリガーされるか -->
- [x] FR-006 regression: `test.command` が空で `test.runners` が未設定の場合、対話プロンプトが表示され、入力値が `.mspec/config.yaml` に保存されてからテストが実行されること。

<!-- Risk level: LOW — resolveRunners 追加で auto-detect を誘発するロジックは入っていないが念のため -->
- [x] FR-007 regression: `test.command` 未設定時に `package.json` 等を根拠とした自動推定が行われないこと（FR-006 のプロンプトのみが使われること）。

<!-- Risk level: MEDIUM — payload 拡張は enforce.ts に影響しないとされているが、JSON の command フィールド型変更が検査ロジックを壊す可能性がある -->
- [x] FR-008 regression: `enforce_tdd: true` の step で `mspec validate` を実行したとき、multi-runner 証跡ファイルが正しく paired（red + green）と判定されること。`command` フィールドの型変更（string → array）が `enforce.ts` の検査ロジックを破壊しないことを確認する。

<!-- Risk level: MEDIUM — command が配列に変わるため、下流コード（web-ui の test-results 表示等）が壊れうる -->
- [x] FR-009 regression: multi-runner 実行後の証跡 JSON に `change`・`task_id`・`command`（配列）・`exit_code`・`recorded_at` の全フィールドが含まれること。legacy モードでも同じフィールドが保持されること（`command` が `["npm test"]` のような 1 要素配列になるか文字列のままかを実装で確認する）。

## Constitution

- [x] IV 双方向アンカー: `mspec anchor check` を実行した結果 253 anchors / 0 errors。アンカー整合性に問題なし。
- [ ] VI Security by Default: `cwd` オプションが `spawn` に渡されることによるディレクトリトラバーサルリスク、および `command` 文字列がユーザー設定由来であるコマンドインジェクションリスクの変化なしを人間がレビューして確認すること。
- [x] I ステップ独立性: anchor check 結果より変更ファイルは `config.ts`・`test.ts`・各テストファイルのみ。`enforce.ts`・`archive.ts` への変更なしを確認。
- [x] II 決定論的マージ: `runners` フィールドが `TestConfigSchema` に `.optional()` で追加済み。vitest 181→191 tests 全 pass により既存スキーマとの衝突なしを確認。
- [x] V 強制/拡張ステップ分離: anchor check に `enforce.ts` のエントリなし。TDD 証跡命名規則（`<change>__<task-id>.json`）は `buildMultiRunnerEvidence` で維持。

## Notes

- **FR-013 は risk_tier: trivial のためチェックリスト項目を省略**（backward-compat フォールバックは FR-001 regression テストがカバーする）。
- **FR-009 の `command` フィールド型変更リスク**: legacy モードで `command` を文字列のまま出力するか 1 要素配列に統一するかは実装者が判断する。web-ui の test-results 表示コンポーネントがこのフィールドを参照している場合は破壊的変更になるため実装前に確認すること。
- **`runners: []`（空配列）の扱い**: design.md Decision 2 により legacy モードへフォールバックする（エラーにしない）。この仕様は Delta Spec に明示されていないため、tasks.md でテストケースとして追加することを推奨する。
- **`copyTestResults` のパス変更**: legacy モードは `e2e-results/` 直下、multi-runner モードは `e2e-results/<runner-name>/` 配下。既存の web-ui test-results viewer がこのディレクトリ構造を想定している場合は注意が必要。
