---
doc_type: Reference
---

# markdown-search-and-quick-access — Proposal

## Why

SpecViewおよびChangesの検索機能は現状、ファイル名・Capability名・メタデータのみを対象としており、Markdownファイルの本文テキストは検索できない。本文に記述された要件・決定・背景を横断検索できないため、関連するSpecやChangeを発見しづらい状況にある。
また、⌘Kショートカットが現在未使用のため、VSCodeの⌘Pに相当するクイックアクセスパレットを追加することで、Spec・Change・Capability間のナビゲーション速度を大幅に向上させる。

## Goals

- `spec-viewer-search`: SpecViewerサイドバー検索をMarkdown本文テキストの全文検索（AND条件）まで拡張し、マッチした行をスニペット（前後2行程度）でプレーンテキスト表示する
- `web-ui-search`: ChangesダッシュボードのMarkdown本文全文検索対応と、ヒット行スニペット（プレーンテキスト）表示
- `quick-access-palette` (新規): ⌘K（Windows/Linux は Ctrl+K、`navigator.userAgent`/`navigator.platform` でクライアント判定）でVSCode ⌘Pライクなコマンドパレットを表示。表示対象はSpecファイル・Changesディレクトリ・Capability名・次のStepナビゲーション

## Non-Goals

- 検索インデックスの永続化（メモリ上のみで保持、再起動でリセット）
- AI/Semantic Search（意味的類似検索は行わない）
- モバイル対応
- 全キーボードナビゲーション（アクセシビリティ対応は今回のスコープ外）

## Capabilities (touched)

- `spec-viewer-search`
- `web-ui-search`
- `quick-access-palette`

## Open Questions

特になし（全要件はAskUserQuestionで確定済み）

## Decisions

| ID | 質問 | 回答 |
|----|------|------|
| PRP-FS-001 | 主に解決したい課題は？ | 既存機能の拡張（search）＋ 全く新規の機能（quick-access） |
| PRP-NG-001 | Non-Goalとして外したいもの | 検索インデックスの永続化、AI完全検索（Semantic Search）、モバイル対応、全キーボードナビゲーション |
| PRP-UX-001 | 想定する主なユーザータイプ | 開発者（mspec利用者） |
| PRP-NFR-002 | 特に厳しいパフォーマンス要件 | 操作応答時間（INP）— 検索はインクリメンタルかつdebounce済み |
| PRP-CMP-001 | 完了判定の具体的指標 | 全E2EがGreen |
| SEC-DYN-001 | スニペット表示時のXSS対策 | プレーンテキストのみ（textContent使用。HTML未レンダリング） |
| SEC-DYN-002 | 全文検索クエリのDoS対策 | リテラルマッチのみ（正規表現禁止でReDoS回避） |
| SEC-DYN-003 | UserAgent判定の方針 | UAをクライアント内のキーバインド変更のみに使用（サーバー送信なし。プライバシーリスク回避） |

## Completion Criteria

- 全E2EテストがGreen
- SpecViewの検索がMarkdown本文テキストにヒットし、スニペット表示される
- Changesの検索がMarkdown本文テキストにヒットし、スニペット表示される
- ⌘K（Mac）またはCtrl+K（Windows/Linux）でクイックアクセスパレットが開く
- クイックアクセスパレットからSpec・Change・Capability・次Stepへ遷移できる

## Constitution Check

| Principle | Phase 0 | Phase 1 |
|-----------|---------|---------|
| I ステップ独立性 | OK — spec-viewer-search・web-ui-search・quick-access-paletteの3Capabilityを独立したDelta Specとして分割する | — |
| II 決定論的マージ | OK — git revertで確実に元に戻せる変更のみ | — |
| III 質問駆動の要件確定 | OK — AskUserQuestionで全要件を確定済み（検索方式・表示形式・Non-Goals・完了条件・セキュリティ） | — |
| IV 双方向アンカー | OK — @mspec-deltaアンカーをdeltaステップで各spec.mdに付与予定 | — |
| V 強制ステップと拡張ステップの分離 | OK — クイックアクセスは拡張UIに留まり、既存の強制ステップフローを変えない | — |
| VI Security by Default | OK — XSSはtextContentのみ（HTML未レンダリング）、DoSはリテラルマッチ（正規表現禁止）、UA文字列はクライアントでのキーバインド判定のみに使用しサーバー送信しない | — |
