---
doc_type: Checklist
---

# Checklist: init-link-global-bin

## Delta Spec Coverage

### FR-001 — Dev-mode Global Link Creation

- [x] Scenario: dev-mode で init を実行するとグローバルコマンドが作成される — `ensureGlobalLink()` が `packages/cli/package.json` を検出したとき `npm run build` と `npm link` を順番に呼び出すことを確認する <!-- verify: fr-001 -->
- [x] Scenario: グローバルリンクが既に存在する場合は上書きされる — `npm link` が既存の `/opt/homebrew/bin/mspec` シンボリックリンクを警告なしに上書きすることを確認する <!-- verify: fr-001 -->

### FR-002 — Non-dev-mode Skip

- [x] Scenario: npm install -g ユーザーは影響を受けない — `packages/cli/package.json` が存在しない環境で `ensureGlobalLink()` が何も実行せずに返ることを確認する <!-- verify: fr-002 -->

### FR-003 — Build Failure Tolerance

- [x] Scenario: ビルド失敗時でも init の他処理は継続される — `npm run build` が非ゼロ終了コードを返したとき `console.warn` が呼ばれ、`.mspec/config.yaml` 等の配置は既に完了していることを確認する <!-- verify: fr-003 -->

## Source-of-Truth Regression Risk

### cli-init 既存動作の回帰リスク

- [x] **[HIGH]** collision check 後に `ensureGlobalLink()` が呼ばれる順序 — `initCommand` 末尾に置かれるため、ファイル衝突で `process.exit(1)` される場合は `ensureGlobalLink()` は呼ばれない。設計 D-4 の順序が実装で保証されることを確認する。 <!-- verify: human -->
  - [x] **[HIGH]** readline プロンプトとの競合 — `spawnSync` の `stdio: 'inherit'` が `stdin` ストリームを横取りして readline プロンプトの入力を妨げないか確認する。`ensureGlobalLink()` はプロンプト後（`initCommand` 末尾）に呼ばれるため問題ないはずだが、順序を実装で確認する。 <!-- verify: human --> ないなら大丈夫っしょ
- [x] 例外 throw 時のプロセス終了コード — `ensureGlobalLink()` が予期せず throw した場合に `initCommand` の終了コードが非ゼロになり設定ファイル配置の成功が隠蔽されないか確認する。try/catch で warn-and-continue が実装されること。 <!-- verify: fr-003 -->
- [x] next-step メッセージの出力 — `ensureGlobalLink()` がリンク失敗で warn 後も `mspec init: done.` と `next:` ガイドメッセージが出力されることを確認する。 <!-- verify: fr-003 -->
- [x] `--force` フラグへの無影響 — `--force` フラグは `ensureGlobalLink()` に影響を与えない（リンクは常に上書き）ことを確認する。 <!-- verify: human -->
- [x] `ensureGlobalLink()` の挿入位置 — `ensureGitignoreEntry` 呼び出し後（step 6 の末尾）に置かれていることを実装コードで確認する。 <!-- verify: human -->

### Delta Spec アーカイブ後の整合性

- [ ] `cli-init-command` SoT spec への FR-001/002/003 マージ — `mspec archive` 実行時に Delta Spec が SoT spec へ正しくマージされることを確認する。 <!-- verify: human -->

## Constitution

- [x] Principle I (ステップ独立性) — `ensureGlobalLink()` は `init.ts` 単一ファイルへの追加のみ。`spawnSync` は Node.js 標準ライブラリで外部依存を増やさないことを確認する。 <!-- verify: human -->
- [x] Principle II (決定論的マージ) — `npm link` が冪等（再実行で同じ結果）であることを確認する。`@mspec-delta` アンカーが `mspec anchor check` で正しく認識されることを確認する。 <!-- verify: human -->
- [x] Principle III (質問駆動の要件確定) — dev-mode検出精度・link/build失敗挙動が `design.md` の D-1/D-3 で追跡可能であることを確認する。 <!-- verify: human -->
- [x] Principle IV (双方向アンカー) — 実装後の `init.ts` に `@mspec-delta` アンカーブロック（FR-001/002/003 対応）が埋め込まれ、`mspec anchor check` でエラーなしを確認する。 <!-- verify: human -->
- [x] Principle V (強制ステップと拡張ステップの分離) — `ensureGlobalLink()` を `initCommand` 末尾追加のみとし、既存ステップ 1–6 を改変しないことを実装コードで確認する。 <!-- verify: human -->
