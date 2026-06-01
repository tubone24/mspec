---
doc_type: Reference
---

# Checklist: web-ui-smart-launch

## Delta Spec Coverage

| FR-ID | Capability | Title | verify annotation | Human? |
|-------|-----------|-------|------------------|--------|
| cli-core / FR-007 | cli-core | `mspec new` 実行時の Web UI 自動起動トリガー | `<!-- verify: cli-core/fr-007 -->` | No |
| cli-core / FR-008 | cli-core | `mspec open` 実行時の Web UI 自動起動トリガー | `<!-- verify: cli-core/fr-008 -->` | No |
| web-ui-server / FR-008 | web-ui-server | ポート固定リストからの順次選択 | `<!-- verify: web-ui-server/fr-008 -->` | No |
| web-ui-server / FR-009 | web-ui-server | PID ファイルと HTTP ヘルスチェックによる起動中判定 | `<!-- verify: web-ui-server/fr-009 -->` | No |
| web-ui-server / FR-010 | web-ui-server | ステール PID 自動回復 | `<!-- verify: web-ui-server/fr-010 -->` | No |
| web-ui-server / FR-011 | web-ui-server | ヘルスエンドポイントでのプロジェクト同一性検証 | `<!-- verify: human -->` | Yes (risk_tier: critical) |
| web-ui-server / FR-012 | web-ui-server | 起動完了時の URL 表示 | スキップ (risk_tier: trivial) | — |
| web-ui-server / FR-013 | web-ui-server | 127.0.0.1 への強制バインド | `<!-- verify: human -->` | Yes (risk_tier: critical) |
| web-ui-server / FR-014 | web-ui-server | exec（引数配列）によるプロセス直接 spawn | `<!-- verify: human -->` | Yes (risk_tier: critical) |

## 機能確認

- [x] cli-core / FR-007: `mspec new` 正常終了後に `launchWebUiIfNeeded` が呼び出されることを確認する <!-- verify: cli-core/fr-007 -->
- [x] cli-core / FR-007: Web UI 起動失敗時も `mspec new` の終了コードが 0 であることを確認する <!-- verify: cli-core/fr-007 -->
- [x] cli-core / FR-008: `mspec open` 実行時に `launchWebUiIfNeeded` が呼び出されることを確認する <!-- verify: cli-core/fr-008 -->
- [x] cli-core / FR-008: `mspec open` 実行時に起動済みの場合は既存 URL が表示されることを確認する <!-- verify: cli-core/fr-008 -->
- [x] web-ui-server / FR-008: ポート 3847 が使用中の場合に 3848 で起動されることを確認する <!-- verify: web-ui-server/fr-008 -->
- [x] web-ui-server / FR-008: 候補ポート（3847〜3851）が全て使用中の場合に非致命的エラーが返されることを確認する <!-- verify: web-ui-server/fr-008 -->
- [x] web-ui-server / FR-009: `.mspec/ui.pid` 存在かつ `/__mspec/health` 成功時に新規起動しないことを確認する <!-- verify: web-ui-server/fr-009 -->
- [x] web-ui-server / FR-009: `.mspec/ui.pid` 不在時に新規起動フローに進むことを確認する <!-- verify: web-ui-server/fr-009 -->
- [x] web-ui-server / FR-010: PID ファイル存在かつ HTTP ヘルスチェック失敗時に PID ファイルが削除されて新規起動することを確認する <!-- verify: web-ui-server/fr-010 -->
- [ ] web-ui-server / FR-011: `/__mspec/health` レスポンスの projectRoot と token が PID ファイルと一致する場合のみ再利用されることを確認する（セキュリティ設計判断の妥当性は機械検証不可） <!-- verify: human -->
  - `/__mspec/health` が異なる projectRoot を返すプロセスが同ポートを占有しているとき、別ポートで新規起動することを手動テストで確認する
  - token 照合が実装コードで明示的に行われており、照合スキップのフォールバックが存在しないことをコードレビューで確認する
- [ ] web-ui-server / FR-013: サーバープロセスが `127.0.0.1:<port>` にバインドされ、外部 IP からアクセス不可であることを確認する（ネットワークバインドアドレスの実際の動作は機械検証不可） <!-- verify: human -->
  - `netstat -an` または `lsof -i :<port>` でリッスンアドレスが `127.0.0.1` のみであることを確認する
  - 外部インターフェース（例: LAN IP）からアクセスして接続拒否されることを確認する
- [ ] web-ui-server / FR-014: spawn 呼び出しに `shell: false` が明示されており、ポート値が整数バリデーション後に引数配列として渡されることを確認する（シェルインジェクション防止の実装妥当性は機械検証不可） <!-- verify: human -->
  - `spawn` 呼び出し箇所のコードで `{ shell: false }` オプションが明示されていることをコードレビューで確認する
  - ポート引数に非整数値（例: `3848; rm -rf /`）を与えたとき、バリデーションエラーで起動が拒否されることを確認する

## リグレッションリスク

| Existing FR | Risk | Reason |
|------------|------|--------|
| web-ui-server / FR-001 (サーバー起動) | high | `mspec new` での起動ロジックを変更するため、既存の「初回起動」フローが影響を受ける可能性がある。`launchWebUiIfNeeded` が FR-001 の初回起動 Scenario を引き続きカバーするか確認が必要 |
| web-ui-server / FR-002 (プロセス再利用) | high | 起動済み判定が PID 存在確認から PID + HTTP 二重確認に変わるため、旧 FR-002「有効な PID ファイルが存在し、プロセスが動作中」という前提が変わる。新判定ロジックが旧 Scenario を包含しているか確認が必要 |
| web-ui-server / FR-003 (PID ファイル管理) | high | PID ファイルの形式が plain text から JSON に変更される。旧フォーマット読み込み失敗時の `null` 扱いは Migration Plan に明記されているが、`pidManager.ts` の `readPid` / `writePid` 双方が新形式に対応していることを確認が必要 |
| web-ui-server / FR-004 (ポート設定) | medium | `~/.mspecrc` の `ui.port` 設定によるポート上書きが、新しいポート固定リスト選択（FR-008）と共存できるかの動作仕様が未明確。固定リストの先頭ポートと `ui.port` の優先順位を確認が必要 |
| cli-core / FR-001 (コロン形式メッセージ) | low | `mspec open` 新設コマンドが出力するメッセージがコロン形式に準拠しているか確認が必要 |
| cli-core / FR-003 (done-log 記録) | low | `mspec new` への post-hook として Web UI 起動が追加されるが、`recordDone` の呼び出し順序・例外伝播ルールに影響がないか確認が必要 |

- [x] web-ui-server / FR-001 リグレッション: `mspec new` 初回起動時（PID ファイルなし）に HTTP サーバーが起動し PID ファイルが生成されることを確認する <!-- verify: web-ui-server/fr-001 -->
- [x] web-ui-server / FR-002 リグレッション: 有効な PID ファイルが存在し HTTP ヘルスチェックが成功する場合に新規起動しないことを確認する <!-- verify: web-ui-server/fr-002 -->
- [x] web-ui-server / FR-003 リグレッション: 旧フォーマット（plain text）の PID ファイルが存在する場合に `readPid` が `null` を返し新規起動することを確認する <!-- verify: web-ui-server/fr-003 -->
- [ ] web-ui-server / FR-004 リグレッション: `~/.mspecrc` の `ui.port` 設定と FR-008 のポートリスト選択の優先順位が明確であることを確認する（設計の優先順位仕様は機械検証不可） <!-- verify: human -->
  - `ui.port` が設定されている場合にポートリストの先頭を上書きするか、別の動作をするかをコードまたは設計ドキュメントで確認する
  - `ui.port` 設定時のテストケースが tasks.md または実装コードに存在することを確認する
- [x] cli-core / FR-001 リグレッション: `mspec open` コマンドの出力メッセージにハイフン形式のコマンド参照が含まれないことを確認する <!-- verify: cmd:grep -r "mspec-" packages/cli/src/commands/open.ts -->
- [x] cli-core / FR-003 リグレッション: `mspec new` 後処理で Web UI 起動失敗時に `recordDone` の呼び出しが妨げられないことを確認する <!-- verify: cli-core/fr-003 -->

## Source-of-Truth Regression Risk

| Existing FR | Risk | Reason |
|------------|------|--------|
| web-ui-server / FR-001 | high | `mspec new` 起動ロジック改修により初回起動フローが変化 |
| web-ui-server / FR-002 | high | PID + HTTP 二重確認への変更により再利用判定ロジックが変化 |
| web-ui-server / FR-003 | high | PID ファイル形式変更（plain text → JSON）により既存ファイルとの後方互換性が問題となる可能性 |
| web-ui-server / FR-004 | medium | ポートリスト選択（FR-008）との優先順位が未定義 |
| cli-core / FR-001 | low | `mspec open` 新コマンドの出力メッセージがコロン形式に準拠しているか未確認 |
| cli-core / FR-003 | low | `mspec new` への post-hook 追加により done-log 記録の呼び出し順に影響する可能性 |

## Constitution

- [x] Phase 0 Constitution Check complete in design.md <!-- verify: cmd:grep "Constitution Check (Phase 0)" /Users/kagadminmac/project/mspec/changes/2026-05-29-070058-web-ui-smart-launch/design.md -->
- [x] Phase 1 Constitution Check complete in design.md <!-- verify: cmd:grep "Constitution Check (Phase 1)" /Users/kagadminmac/project/mspec/changes/2026-05-29-070058-web-ui-smart-launch/design.md -->
- [x] Phase 0 Constitution Check complete in design-rationale.md <!-- verify: cmd:grep "Constitution Check (Phase 0)" /Users/kagadminmac/project/mspec/changes/2026-05-29-070058-web-ui-smart-launch/design-rationale.md -->
- [x] Phase 1 Constitution Check complete in design-rationale.md <!-- verify: cmd:grep "Constitution Check (Phase 1)" /Users/kagadminmac/project/mspec/changes/2026-05-29-070058-web-ui-smart-launch/design-rationale.md -->
- [x] Constitution Check complete in architecture-overview.md (Phase 0/1 ラベル未分離のため統合確認) <!-- verify: cmd:grep "Constitution Check" /Users/kagadminmac/project/mspec/changes/2026-05-29-070058-web-ui-smart-launch/architecture-overview.md -->
- [x] Constitution IV 双方向アンカー: `mspec anchor check` パス（561 アンカー, 0 エラー） <!-- verify: cmd:mspec anchor check -->
- [x] Constitution VI Security by Default: `## Security Capabilities` セクションが両 Delta Spec に存在する <!-- verify: cmd:grep "## Security Capabilities" /Users/kagadminmac/project/mspec/changes/2026-05-29-070058-web-ui-smart-launch/specs/cli-core/spec.md -->

## デプロイ前確認

- [x] `mspec anchor check` がエラーなしでパスすること <!-- verify: cmd:mspec anchor check -->
- [x] `mspec spec lint` がエラーなしでパスすること <!-- verify: cmd:mspec spec lint -->
- [x] `mspec validate` がエラーなしでパスすること <!-- verify: cmd:mspec validate -->
- [ ] web-ui-server / FR-013 (127.0.0.1 強制バインド) の実装が `0.0.0.0` を使用していないことを確認する（外部露出防止の最終確認は機械検証不可） <!-- verify: human -->
  - 実装コードで listen アドレスが `127.0.0.1` にハードコードされていることをコードレビューで確認する
  - 環境変数や設定ファイルでバインドアドレスを上書きできる抜け道がないことを確認する
- [ ] web-ui-server / FR-014 (shell:false) の実装が `spawn` の全呼び出し箇所で適用されていることを確認する（全 spawn 呼び出し箇所の網羅は機械検証不可） <!-- verify: human -->
  - `grep -r "spawn(" packages/cli/src/server/` の全件で `shell: false` または `shell: undefined` が設定されていることを確認する
  - 新規追加された `open.ts` が `spawn` を直接使用していないことを確認する

## Manual Verification Items

- [ ] FR-011: `/__mspec/health` エンドポイントのプロジェクト同一性検証が正しく動作することを手動テストで確認する（セキュリティ設計判断の妥当性は機械検証不可） <!-- verify: human -->
  - 異なる projectRoot を持つプロセスが同ポートを占有した状態で `mspec new` を実行し、別ポートで起動されることを確認する
  - token が PID ファイルと不一致の場合に再利用されず新規起動されることを確認する
- [ ] FR-013: サーバーが `127.0.0.1` にのみバインドされ外部アクセス不可であることを確認する（ネットワークバインドアドレスの実際の動作は機械検証不可） <!-- verify: human -->
  - `netstat -an | grep 3847` でリッスンアドレスが `127.0.0.1:3847` であることを確認する
  - LAN IP または `0.0.0.0` からのアクセスが拒否されることを確認する
- [ ] FR-014: `spawn` が `shell: false` で呼び出され、ポート値が整数バリデーション後に引数配列として渡されることをコードレビューで確認する（シェルインジェクション防止の実装妥当性は機械検証不可） <!-- verify: human -->
  - `packages/cli/src/server/index.ts` の spawn 呼び出しで `{ shell: false }` が明示されていることを確認する
  - ポート引数の整数バリデーションが spawn 呼び出し直前に行われていることを確認する
