---
doc_type: AI-Internal
---

# Checklist: fix-upgrade-package-json-path

## Delta Spec Coverage

- [x] FR-001: `packages/cli/src/commands/upgrade.ts` の `getCurrentVersion()` が `fileURLToPath(import.meta.url)` + `join(dirname(...), '../package.json')` パターンを使用し、グローバルインストール環境（`/opt/homebrew/lib/node_modules/@mspec/cli/dist/index.js`）で `package.json` を絶対パスで正しく解決できることを確認する <!-- verify: fr-001 -->
- [x] FR-001 (regression): ローカルインストール環境（プロジェクト `node_modules/`）でも `mspec upgrade` が正常に動作し、`package.json` を正しく解決できることを確認する <!-- verify: fr-001 -->
- [x] FR-002: グローバルインストール環境で `mspec upgrade` を実行したとき、プロセスが exit code 0 で終了し、標準エラー出力に `Cannot find module` が含まれないことを確認する <!-- verify: fr-002 -->
- [x] FR-001/FR-002: `tsup build` 後の `dist/index.js` に修正が正しく反映され、`createRequire` が残っていないことをビルド成果物で確認する <!-- verify: human -->

## Source-of-Truth Regression

- [x] **[HIGH リスク] キャパビリティ分割の整合性**: `upgrade-command` を「パス解決の実装要件」専用キャパビリティとして意図的に分離。設計上の判断として記録済み（design.md・checklist.md）。 <!-- verify: human -->
- [x] **cli-upgrade FR-001** (upgrade サブコマンドの提供): 既存テスト 7/7 PASS により、コマンド認識フロー正常を確認。 <!-- verify: human -->
- [x] **cli-upgrade FR-002** (現在バージョンと最新バージョンの表示): `getCurrentVersion()` の修正が正しいバージョン文字列を返し、表示フローが正常に機能することを確認する <!-- verify: fr-002 -->
- [x] **cli-upgrade FR-003** (アップグレードの実行): 既存テスト `upgradeCommand upgrade execution` PASS により確認。 <!-- verify: human -->
- [x] **cli-upgrade FR-004** (already up-to-date メッセージ): 既存テスト `upgradeCommand already up-to-date` PASS により確認。 <!-- verify: human -->
- [x] **cli-distribution**: `tsup build` 成功、`mspec anchor check` 0 error、他コマンドへの影響なしを確認。 <!-- verify: human -->

## Constitution

- [x] **Principle I (ステップ独立性)**: `design.md` が実装なしで生成されており、他ステップの成果物に依存していないことを確認する <!-- verify: human -->
- [x] **Principle II (決定論的マージ)**: Delta Spec の変更対象が `upgrade.ts` 1ファイルに一意に特定されており、archive 時のマージが決定論的に処理できることを確認する <!-- verify: human -->
- [x] **Principle III (質問駆動の要件確定)**: `research.md` にて Open Choices が解消済みであり、採用理由が `design-rationale.md` に記録されていることを確認する <!-- verify: human -->
- [x] **Principle IV (双方向アンカー)**: 実装後に `upgrade.ts` に `@mspec-delta` アンカーが打たれ、FR-001/FR-002 がアンカーに紐付いていることを `mspec anchor check` で確認済み。 <!-- verify: human -->
- [x] **Principle V (強制ステップと拡張ステップの分離)**: 強制ステップのみが実行されており、`workflow.yaml` の強制ステップ定義が変更されていないことを確認する <!-- verify: human -->

## Sign-off

- [x] Delta Spec Coverage の全項目がチェック済みであることを確認する
- [x] Source-of-Truth Regression の HIGH リスク項目（キャパビリティ分割問題）について、意図的な設計判断が記録されているかレビュアーが確認する
- [x] Constitution の全 5 原則に対してチェック済みであることを確認する
- [x] `tasks.md` 生成後に、FR-001/FR-002 の Scenario が少なくとも 1 つのタスクブロックに対応していることを確認する
