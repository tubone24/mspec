---
doc_type: Explanation
---

# Proposal: mspec-web-ui

## Why

MSPEC のワークフローは CLI ベースで動作するが、並行チェンジが増えると各変更の進捗・ドキュメント内容を俯瞰するのが困難になる。
専用 Web UI を導入することで、チェンジ一覧・進捗・各種アーティファクトのプレビューを一か所で確認できるようにし、開発体験を大幅に向上させる。
特に Mermaid 図・Gherkin/EARS 記法・E2E 証跡・プロトタイプ HTML など「テキストだけでは視認しづらい成果物」を正しくレンダリングして提供することが核心的な価値である。

## Goals

1. `mspec new` 実行時に Web UI サーバーを自動起動し、既存プロセスがある場合は再利用する（PID ファイルで管理）。
2. アーカイブ前の全チェンジ一覧とステップ進捗をダッシュボード画面で視覚化する。
3. 各アーティファクト（proposal.md / design.md / checklist.md 等）を Mermaid レンダリング・Gherkin/EARS ハイライト付きでダーク/ライトモード切り替え可能な MD プレビューとして提供する。
4. プロトタイプ HTML を iframe 内でレンダリング表示できる Prototype Viewer を提供する。
5. E2E テスト結果（red / green / skip）の証跡を一覧表示する Test Result Viewer を提供する。
6. バグフィックス・マイナー修正・フルフローなどチェンジモードによるドキュメントの出し分けをサポートする。
7. UI は英語ファーストで実装し、将来の言語切り替えに対応できる i18n 構造を設計段階で考慮する。

## Non-Goals

- モバイル（スマートフォン・タブレット）への最適化
- 認証・認可（ログイン機能・アクセス制限）— ローカル専用ツール
- クラウドへのデプロイ対応（Vercel / AWS 等）
- 国際化（i18n）の完全実装 — 英語ファーストで、切り替え機構の骨格のみ考慮

## Capabilities (touched)

- `web-ui-server` — Web サーバー起動・停止・PID ファイルによるプロセス管理
- `change-dashboard` — アーカイブ前チェンジ一覧・ステップ進捗ダッシュボード・モード別フィルター
- `artifact-preview` — Markdown プレビュー（Mermaid レンダリング / EARS・Gherkin ハイライト / ダーク・ライトモード切り替え / プロトタイプ HTML iframe 表示）
- `test-result-viewer` — E2E テスト結果（red / green / skip）一覧・証跡確認
- `cli-integration` — `mspec new` フックによる Web UI 自動起動・ポート/URL 通知

## Open Questions

1. **ポート番号**: デフォルトポートは `3847`（mspec の語呂合わせ）で固定か、`~/.mspecrc` で設定可能にするか？
2. **ファイル監視**: MD ファイルの変更をリアルタイムでプレビューに反映する（ファイルウォッチャー）か、手動リロードのみにするか？
3. **テスト結果の取得元**: E2E 証跡は `changes/<id>/e2e-results/` 配下の JSON/XML ファイルを解析するのか、それとも専用のレポートコマンド（`mspec test-report`）を設けるのか？

---

## Constitution Check

| 原則 | Phase 0 | Phase 1 |
|------|---------|---------|
| I ステップ独立性 | ✅ proposal ステップは readme.md のみを入力とし、proposal.md を独立して生成している | — |
| II 決定論的マージ | ✅ proposal.md は新規ファイルであり、既存ファイルへのマージ競合は発生しない | — |
| III 質問駆動の要件確定 | ✅ 5問の AskUserQuestion で Non-Goals・起動方式・技術制約・完了条件・MVP 機能を明確化した | — |
| IV 双方向アンカー | ✅ Capabilities 節の kebab-case 名が delta ステップでの `mspec delta init` 入力として機能する | — |
| V 強制ステップと拡張ステップの分離 | ✅ proposal は全フロー変更での強制ステップであり、skip 対象外として扱われている | — |
