---
doc_type: Explanation
---

# Proposal: web-ui-smart-launch

## Why

`mspec new` や `mspec open` を実行するたびに手動で Web UI を起動する必要があり、操作が煩雑だった。また複数プロジェクトを並行して作業する場合、デフォルトポートが衝突して起動に失敗するケースがある。さらに「すでに起動済みの Web UI がある状態で再度起動してしまう」という二重起動の問題もあった。

これらを解消するため、`mspec new` と `mspec open` 実行時に Web UI を自動起動・ポート衝突回避・二重起動防止する仕組みを導入する。

## Goals

- `mspec new` および `mspec open` 実行時に Web UI を自動起動する
- デフォルトポートが使用中の場合、固定リスト（3847 → 3848 → 3849 ...）から順に空きポートを選択する
- 同プロジェクトの Web UI がすでに起動中（PID ファイル + HTTP ヘルスチェック）なら再起動せず既存 URL を表示する
- ステール PID（プロセスは死んでいるが PID ファイルが残存）の場合は HTTP 確認失敗後にクリーンアップして再起動する
- 起動完了時にアクセス可能な URL を CLI 出力に表示する

## Non-Goals

- Web UI 自体の新機能開発（画面追加・既存 UI 変更など）
- `mspec new` / `mspec open` 以外のコマンドでの自動起動
- リモートアクセス対応（localhost のみ想定）
- 複数プロジェクトの Web UI を一元管理するダッシュボード機能

## Capabilities (touched)

- `cli-core`（`mspec new` / `mspec open` コマンドへの起動トリガー追加）
- `web-ui-server`（プロセス起動管理・ポート選択・PID ファイル管理・ヘルスチェック）

## Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| ポートが使用中の場合の選択方法 | 固定リストから順に試す（3847→3848→3849...） | 予測しやすく、デバッグしやすい |
| プロジェクト固有 Web UI の起動中判定 | PID ファイル + HTTP ヘルスチェックの二重確認 | PID 単独だとゾンビ・PID 再利用で誤判定するため |
| ステール PID の処理 | HTTP ヘルスチェック失敗時はクリーンアップして再起動 | ユーザーの手動介入なしに自動回復する |
| 起動トリガーとなるコマンド | `mspec new` と `mspec open` | 他コマンドへの自動起動は今回スコープ外 |
| ヘルスチェック応答元の同一性検証 | 専用エンドポイント（`/__mspec/health`）でプロジェクト ID と起動トークンを照合 | 他プロセスがポートを先取りしても誤再利用を防止（SEC-001） |
| バインドアドレスと認証 | 127.0.0.1 強制バインドのみ（書き込み API へのトークン認証は今回不要） | localhost のみ想定のため外部露出なし（SEC-002） |
| プロセス spawn 方法 | シェルを介さず exec（引数配列）で直接 spawn、ポートは整数バリデーション後に使用 | コマンドインジェクションをアーキテクチャレベルで排除（SEC-005） |

## Open Questions

（なし。全決定事項を Decisions に記録済み）

## Constitution Check

> Step: proposal | Constitution Version: 1.1.0

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | — | 本 proposal は他ステップの成果物に依存しない |
| II. 決定論的マージ | ✅ | — | 要件・決定事項が明確に定義されており、delta マージで衝突しない |
| III. 質問駆動の要件確定 | ✅ | — | ポート選択・起動検知・ステール処理・セキュリティを質問で確定済み |
| IV. 双方向アンカー | ✅ | — | delta ステップで cli-core / web-ui-server へのアンカーを付与予定 |
| V. 強制ステップと拡張ステップの分離 | ✅ | — | 既存コマンドへのフック追加のみ。新規 SKILL.md や workflow.yaml の変更なし |
| VI. Security by Default | ✅ | — | 127.0.0.1 強制・exec 直接 spawn・トークン照合を決定済み（SEC-001, SEC-002, SEC-005） |
| VII. 設計意図と実装の対応確認 | ✅ | — | Goals の各項目が Decisions と 1:1 で対応している |

### Complexity Tracking

None
