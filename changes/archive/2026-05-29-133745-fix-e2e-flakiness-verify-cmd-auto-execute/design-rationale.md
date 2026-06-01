---
doc_type: Explanation
---

<!-- See also: ./design.md -->

<!-- @mspec-delta 2026-05-29-133745-fix-e2e-flakiness-verify-cmd-auto-execute/specs/e2e-stability/spec.md -->
<!-- Requirements implemented: FR-001, FR-002, FR-003 -->
<!-- Change: fix-e2e-flakiness-verify-cmd-auto-execute -->

<!-- @mspec-delta 2026-05-29-133745-fix-e2e-flakiness-verify-cmd-auto-execute/specs/artifact-preview/spec.md -->
<!-- Requirements implemented: FR-014 -->
<!-- Change: fix-e2e-flakiness-verify-cmd-auto-execute -->

# Design Rationale: fix-e2e-flakiness-verify-cmd-auto-execute

## Context

mspec の e2e テストスイートは Playwright（Web UI）と vitest（CLI）の2種類で構成されている。Web UI 側では `page.waitForTimeout()` による固定時間待機が多数使用されており、CI 環境の負荷状況によってテスト結果が安定しないフレーキー状態にあった。CLI 側では `vi.spyOn(process, 'cwd')` によってグローバルな `process.cwd` を差し替えているが、`afterEach` でのクリーンアップが不完全なテストが存在し、並列実行時に他のテストに干渉するリスクがあった。

一方、`verify: cmd:` アノテーション（FR-012 で実装済みの amber ハイライト表示）は、ユーザーが手動でコマンドを実行して結果を確認する必要があった。これを自動化する機能は `changes/2026-05-28-084519-verify-cmd-auto-execute` で着手予定だったが、e2e テストのフレーキー修正と同一 change で実装することでコンテキストを統合した。

---

## Decisions

### waitForTimeout → 条件ベース待機に置換した理由

`waitForTimeout()` は「〇〇ms あれば画面が描画されるはず」という根拠のない仮定に依存しており、CI 環境の速度によって容易にフレーキー化する。Playwright の `expect(locator).toBeVisible()` はデフォルト 5000ms まで自動リトライするため、同等またはそれ以上の待機を条件ベースで実現できる。3000ms の検索インデックスビルド待機は `timeout: 8000` を明示することで意図を文書化しつつ条件ベースに移行する。魔法の数字を排除することで、将来の CI 環境変化にも耐性が上がる。

### vi.restoreAllMocks() を afterEach で確実に呼ぶ理由

Vitest はデフォルトでテストファイルを別ワーカーで実行するため、ファイル間の干渉は基本的にない。しかし同一ファイル内の `it()` 間では同一ワーカーが使われるため、`vi.spyOn(process, 'cwd')` を `it()` ブロック内で設定してクリーンアップしない場合、後続テストが誤った `process.cwd()` を参照する可能性がある。`afterEach(() => vi.restoreAllMocks())` を describe スコープに配置することで、テスト失敗時でも確実にリストアされる。

### POST /api/run-cmd を新規独立ルートファイルとして追加した理由

既存の `artifacts.ts` や `changes.ts` への追加も技術的に可能だが、コマンド実行という異なる責務を持つエンドポイントは独立したモジュールとして分離する方がメンテナンス性が高い。`runCmd.ts` として独立させることで、将来の許可コマンドリスト拡張やタイムアウト制御の変更が局所化できる。

### shell: false + argv 配列渡しを選択した理由

`spawn(cmd, { shell: true })` はシェル展開（`&&`、`$()`、バッククォート等）を許可してしまい、アノテーション文字列にシェルメタキャラクタが含まれた場合に任意コマンド実行が成立するリスクがある。`spawn(tokens[0], tokens.slice(1), { shell: false })` であれば OS のシェルを介さず直接実行されるため、この攻撃ベクタを根本的に排除できる。

---

## Alternatives Considered

- **allowlist を `.mspec/config.yaml` の `allowed_cmd_prefixes` で設定可能にする（OC-1 選択肢 B）** — 柔軟性は増すが、設定ファイルのパース・バリデーションが追加実装になる。bugfix モードにおいて過剰設計であり、選択肢 A（mspec 固定）から B への拡張は別 change で行える
- **artifacts.ts に run-cmd ルートを追加** — 既存ファイルの変更量を減らせるが、コマンド実行という異なる責務が混在する
- **フロントエンドのみで allowlist 検証** — UI 上でのチェックはバイパス可能。サーバー側での強制が必須
- **exec() / shell 経由実行** — 実装が簡潔だがシェルインジェクションのリスクがある

---

## Trade-offs

- `POST /api/run-cmd` は `mspec` プレフィックス限定のため、将来 `git`・`npm` 等の許可が必要になった場合は設計変更が必要
- `li` コンポーネント内で `useState` を使って実行状態を管理するため、リスト再レンダリング時に状態がリセットされる（チェックリスト再読み込みで実行結果が消える）。これは許容できる動作

---

## Rejected Options

- **`exec()` + シェル文字列実行** — シェルインジェクションリスクにより却下
- **制限なし実行（OC-1 選択肢 C、localhost 専用として信頼）** — localhost バインドは外部からの直接呼び出しは防ぐが、XSS 経由のブラウザからのリクエストは防げない。Security by Default に反するため却下
- **コマンド結果をサーバー側 WebSocket でストリーミング** — リアルタイム性は高いが実装複雑度が増大。mspec コマンドは数秒で完了するためポーリング不要であり却下

---

## Constitution Check

| 原則 | Phase 0 | Phase 1 |
|------|---------|---------|
| I — ステップ独立性 | ✅ design-rationale は design/research のみ参照 | ✅ 実装詳細に依存しない |
| II — 決定論的マージ | ✅ | ✅ |
| III — 質問駆動の要件確定 | ✅ OC-1 を選択肢 A で確定 | ✅ |
| IV — 双方向アンカー | ✅ | ✅ |
| V — 強制/拡張ステップの分離 | ✅ | ✅ |
| VI — Security by Default | ✅ 却下オプションでのセキュリティ懸念を明示（shell: true, 制限なし実行を却下） | ✅ |
| VII — 設計意図と実装の対応確認 | ✅ design.md の各決定と Scenario の対応付け済み | ✅ |

### Complexity Tracking

None
