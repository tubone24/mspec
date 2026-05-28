# Checklist: init-gitignore-ui-pid

## Delta Spec Coverage

- [x] FR-012 Scenario "Fresh init creates .mspec/.gitignore" — `mspec init` を新規プロジェクトで実行したとき `.mspec/.gitignore` が新規作成され、ファイルに `ui.pid` 行が含まれ、終了コード 0 で完了すること <!-- verify: fr-012 -->
- [x] FR-012 Scenario "Existing .mspec/.gitignore is not overwritten without --force" — `.mspec/.gitignore` が既存の状態で `mspec init` を `--force` なしで実行したとき、ファイルの内容が変更されないこと <!-- verify: fr-012 -->
- [x] FR-012 Scenario "Force re-init regenerates .mspec/.gitignore" — `.mspec/.gitignore` が既存の状態で `mspec init --force` を実行したとき、`.mspec/.gitignore` が再生成され `ui.pid` 行を含むこと <!-- verify: fr-012 -->

## Source-of-Truth Regression

- [x] **[HIGH]** FR-004 — プロジェクトルートの `.gitignore` への `.mspec/cache/` 追記動作が、新規追加の `.mspec/.gitignore`（同名だが別パス）の生成ロジックと混同・干渉しないこと（命名衝突により `collisions` チェックや `writeFile` パスが誤って `.gitignore` を参照するリスク） <!-- verify: regression-FR-004 -->
- [x] FR-005 — 既存アーティファクトがある状態で `--force` なし `mspec init` を実行したとき、`.mspec/.gitignore` の追加が `collisions` チェック（init.ts:241-251）の abort 判定に影響せず、既存の config.yaml 等の保護が維持されること <!-- verify: regression-FR-005 -->
- [x] FR-006 — `mspec init --force` 実行時に既存の `.mspec/config.yaml` や `memory/constitution.md` が再生成される動作が、新規 `.mspec/.gitignore` エントリの追加によって変化しないこと <!-- verify: regression-FR-006 -->
- [x] FR-001 — `PlannedFile[]` 配列への1エントリ追加が `.mspec/config.yaml` および `.mspec/workflow.yaml` の生成（dest パス解決・テンプレート読み込み）に干渉しないこと <!-- verify: regression-FR-001 -->

## Constitution

- [x] Principle I (ステップ独立性) — `.mspec/.gitignore` 生成が `mspec init` コマンド単独で完結し、他ワークフローステップへの副作用がないこと <!-- verify: human -->
- [x] Principle II (決定論的マージ) — `mspec init --force` を同一プロジェクトで2回実行し、2回目も1回目と同一内容の `.mspec/.gitignore` が生成されること <!-- verify: human -->
- [x] Principle III (質問駆動の要件確定) — `ui.pid` のみで確定した設計判断（OC-001）が research.md に記録されており、追加パターン追加の選択肢が文書化されていること <!-- verify: human -->
- [x] Principle IV (双方向アンカー) — 実装後に `init.ts` へ FR-012 アンカーが追加され `mspec anchor check` がエラーなしで通ること <!-- verify: cmd:mspec anchor check --change 2026-05-28-113128-init-gitignore-ui-pid -->
- [x] Principle V (強制ステップと拡張ステップの分離) — `workflow.yaml` テンプレートへの変更が含まれず `mspec validate` が通ること <!-- verify: human -->
- [x] Principle VI (Security by Default) — Delta Spec に `## Security Capabilities` セクションが存在すること <!-- verify: cmd:grep "## Security Capabilities" changes/2026-05-28-113128-init-gitignore-ui-pid/specs/cli-init/spec.md -->
