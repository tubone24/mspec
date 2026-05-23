---
doc_type: AI-Internal
change: 2026-05-22-050359-cli-output-english
---

# Checklist: cli-output-english

## Delta Spec Coverage

- [x] FR-002: `upgrade.ts` L67 outputs `"Current version:"` (English label) instead of `"現在のバージョン:"` <!-- verify: fr-002 -->
- [x] FR-002: `upgrade.ts` L68 outputs `"Latest version:  "` (English label) instead of `"最新バージョン:   "` <!-- verify: fr-002 -->
- [x] FR-002: `upgrade.test.ts` assertion on line 83–84 updated from `現在のバージョン:` / `最新バージョン:` to `Current version:` / `Latest version:` <!-- verify: fr-002 -->
- [x] FR-002: `upgrade-command.e2e.test.ts` assertion in the FR-002 test case updated from `現在のバージョン:` / `最新バージョン:` to `Current version:` / `Latest version:` <!-- verify: fr-002 -->
- [x] FR-004: `upgrade.ts` L71 outputs `"Already up to date (x.y.z)"` instead of `"すでに最新バージョンです (x.y.z)"` <!-- verify: fr-004 -->
- [x] FR-004: `upgrade.test.ts` assertion on line 103 updated from `すでに最新バージョンです` to `Already up to date` <!-- verify: fr-004 -->
- [x] FR-004: `upgrade-command.e2e.test.ts` assertion in the FR-004 test case updated from `すでに最新バージョンです` to `Already up to date` <!-- verify: fr-004 -->

## Source-of-Truth Regression

- [x] FR-001: `mspec upgrade` subcommand is still recognized and version-check flow still starts after string changes — no behavioral logic was modified <!-- verify: human -->
- [x] FR-003 (upgrade execution): `upgrade.ts` L76 prompt text changes from `アップグレードしますか？ [y/N] ` (no interpolation) to `Upgrade to ${latestVersion}? [y/N] ` (adds `latestVersion` interpolation) — verify that `latestVersion` is in scope at L76 and that the conditional logic `if (answer !== 'y' && answer !== 'Y')` is intact <!-- verify: human -->
- [x] FR-003 (upgrade execution): `upgrade.ts` L78 cancel message `キャンセルしました。` → `Cancelled.` — verify the cancel path still returns early without calling spawnSync <!-- verify: human -->
- [x] FR-003 (upgrade execution): `upgrade.ts` L91 completion message `✓ アップグレード完了` → `✓ Upgrade complete` — verify this line is reached only after `spawnSync` succeeds (status 0) <!-- verify: human -->
- [x] Network error path: `upgrade.ts` L60 error prefix `エラー:` → `Error:` and message `バージョン情報の取得に失敗しました` → `Failed to fetch version info` — verify `upgrade.test.ts` L64 and `upgrade-command.e2e.test.ts` error-path assertion are both updated to match the new English string; a stale Japanese assertion will cause a test failure <!-- verify: human -->
- [x] No non-string behavior change: `upgradeCommand()` control flow (try/catch, version comparison, spawnSync call, process.exit paths) is identical before and after — diff shows only string literal mutations <!-- verify: human -->

## Constitution

- [x] Principle I (ステップ独立性): `design.md` documents all string changes without referencing prior session context; the change is self-contained and restartable <!-- verify: human -->
- [x] Principle II (決定論的マージ): all 8 changed lines in D-001 are uniquely identified by line number and original string; the mapping is deterministic and machine-applicable <!-- verify: human -->
- [x] Principle III (質問駆動の要件確定): the decision to use direct string replacement rather than an i18n library is recorded in `design.md` D-001 and confirmed with the user per `design.md` Constitution Check Phase 0 <!-- verify: human -->
- [x] Principle IV (双方向アンカー): `upgrade.ts` and test files must have a new `@mspec-delta 2026-05-22-050359-cli-output-english/specs/cli-upgrade/spec.md` anchor block referencing FR-002 and FR-004 added during implementation — verify this anchor is present after implementation <!-- verify: human -->
- [x] Principle V (強制ステップと拡張ステップの分離): this change adds no new workflow steps and does not modify `workflow.yaml`; the design, checklist, and archive steps remain mandatory and untouched <!-- verify: human -->
- [x] `design.md` Constitution Check table has a row for every principle (I–V) with Phase 0 and Phase 1 columns filled <!-- verify: human -->
</content>
</invoke>