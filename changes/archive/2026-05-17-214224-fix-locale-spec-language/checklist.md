---
doc_type: Reference
---

# Checklist: fix-locale-spec-language

## Delta Spec Coverage

### language-config / FR-005 — status --json へのアクティブロケール公開

- [x] language-config: `locale: ja` 設定時に `mspec status --change <dir> --json` の出力 JSON トップレベルに `"locale": "ja"` が含まれる <!-- verify: fr-005 -->
- [x] language-config: `config.yaml` に `locale` キーが存在しないとき、`mspec status --change <dir> --json` の出力 JSON に `"locale": "ja"` が含まれる（デフォルトロケール適用） <!-- verify: fr-005 -->

### artifact-templates-i18n / FR-005 — 全成果物テンプレートの ja/en バリアント完備

- [x] artifact-templates-i18n: `locale: ja` 設定で `mspec new <feature>` を実行したとき、stderr に "missing template" を含む行が一切出力されない <!-- verify: fr-005 -->
- [x] artifact-templates-i18n: `locale: en` 設定で `mspec new <feature>` を実行したとき、stderr に "missing template" を含む行が一切出力されない <!-- verify: fr-005 -->

### claude-integration / FR-021 — スキルの EARS パターン例示のロケール対応

- [x] claude-integration: `locale: ja` 設定時に `mspec:delta` スキルが生成する Requirement 本文が `このシステムは SHALL <振る舞い>.` 形式であり、`The system SHALL` の文字列が含まれない <!-- verify: fr-021 -->
- [x] claude-integration: `locale: en` 設定時に `mspec:delta` スキルが生成する Requirement 本文が `The system SHALL <response>.` 形式である <!-- verify: fr-021 -->

## Source-of-Truth Regression Risk

### artifact-templates-i18n SoT（直接触れる）

- [x] 🔴 **FR-002 フォールバック連鎖の変化**: レガシー `.md` を削除することで、フォールバックチェーンが `<artifact>.ja.md` → `<artifact>.en.md` → (なし) に変わる。`.en.md` が最終保護網となるが、`.en.md` が欠落している場合は「missing template」警告が発生するリスクがある。今回追加対象9種 × 2 ロケール = 18 ファイルが揃っていることを確認する（`delta-spec` は `.ja.md`/`.en.md` が既存のためレガシー削除は今回スコープ外）。 <!-- verify: human -->
- [x] 🟡 **FR-004 フロントマター保護**: 新規 `.ja.md` / `.en.md` の両バリアントにおいて `doc_type` 等の構造的キーが同一英字識別子のまま保持されているかを確認する。 <!-- verify: human -->
- [x] 🟡 **FR-003 全成果物への一貫適用**: `readme`, `proposal`, `delta-spec`, `research`, `design`, `architecture-overview`, `quickstart`, `checklist`, `tasks`, `glossary` の全テンプレートが locale 別に用意されており、日本語ロケールのテンプレートに英語見出しが残留していないことを確認する。 <!-- verify: human -->

### language-config SoT（直接触れる）

- [x] 🟡 **FR-002 デフォルトロケール stderr 通知の維持**: `status.ts` の D-1 で追加される try/catch ブロックが、既存の `loadConfig` による「default locale 'ja' applied」stderr 通知の発火タイミングや内容に影響しないことを確認する。 <!-- verify: human -->
- [x] 🟢 **FR-001 / FR-003 / FR-004**: `status.ts` への `locale` フィールド追加は読み取り専用の JSON 拡張であり、これらの要件への影響は低い。念のため `mspec new` 時の locale 解決フローが変わっていないことを確認する。 <!-- verify: human -->

### claude-integration SoT（直接触れる）

- [x] 🔴 **FR-010 EARS+Scenario 指示の保全**: D-4 で `mspec-delta/SKILL.md` の EARS パターン例示を locale 分岐に変更する際、FR-010 が要求する「Scenario（GIVEN/WHEN/THEN）を各 Requirement 直下に必須とする指示」と「RFC 2119 キーワードセマンティクスの説明」が削除・希薄化されていないことを確認する。 <!-- verify: human -->
- [x] 🟡 **FR-003 Procedure 先頭ステップの維持**: `mspec status --json` から locale を読み取るロジックが Procedure の先頭ステップ（`mspec status --change <name> --json`）の一部として組み込まれており、先頭ステップの位置が変わっていないことを確認する。 <!-- verify: human -->
- [x] 🟡 **FR-007 subagent エンベロープ後方互換性**: `continue` 出力への `locale` フィールド追加（D-2）が additive 変更であり、`subagent_prompt` / `subagent_name` フィールドの処理に影響しないことを確認する。 <!-- verify: human -->
- [x] 🟡 **既存 E2E テスト `claude-integration-skill-ears.e2e.test.ts` の継続パス**: SKILL.md 変更後に既存 EARS 関連 E2E テストがすべて PASS することを確認する（design.md Phase 1 Constitution Check III 参照）。 <!-- verify: human -->

### cli-core SoT（間接的影響）

- [x] 🟡 **FR-001 / status --json スキーマ拡張の消費側影響**: `status --json` の出力スキーマに `locale` フィールドが追加されることで、既存の JSON 消費コード（パーサー・バリデーター・スキル）が未知フィールドに対して寛容であるかを確認する。strict parse を行っているコードがあれば更新が必要。 <!-- verify: human -->

## Constitution Check

- [x] **原則 I — ステップ独立性**: D-1〜D-4 は互いに独立して実装可能であり、各ステップ再開時に `mspec status` で必要な情報が取得できる設計になっている。D-1 なしでも D-3・D-4 は機能する段階的リリース設計が維持されていることを確認する。 <!-- verify: human -->
- [x] **原則 II — 決定論的マージ**: `status --json` への `locale` フィールド追加はスキーマの後方互換な拡張のみであり、`mspec archive` のマージ処理が同一入力に対してバイト単位で一致する性質を維持していることを確認する。 <!-- verify: human -->
- [x] **原則 III — 質問駆動の要件確定**: design.md の Open Choices 全 4 件が解決済みであり、決定根拠が design.md に追跡可能な形で記録されていることを確認する。 <!-- verify: human -->
- [x] **原則 IV — 双方向アンカー**: 全実装ファイル（`status.ts`, `continue.ts`, `mspec-delta/SKILL.md`, 各テンプレートファイル）に `@mspec-delta` アンカーが付与され、各 E2E テストに `Requirements implemented:` アノテーションが記載されていることを確認する。 <!-- verify: human -->
- [x] **原則 V — 強制ステップと拡張ステップの分離**: CLI コア変更（D-1/D-2）と設定ファイル変更（D-3/D-4）が別タスクに分離されており、D-3 のテンプレート追加と削除が同一コミットに含まれてロールバックが容易な構成になっていることを確認する。 <!-- verify: human -->
