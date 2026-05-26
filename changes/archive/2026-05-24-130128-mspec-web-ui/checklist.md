---
doc_type: Reference
---

# Checklist: mspec-web-ui

## Delta Spec Coverage

### web-ui-server

- [ ] FR-001 — サーバー起動: `mspec new` 実行時に既存プロセスが存在しない場合、ポート 3847 で HTTP サーバーが起動し PID ファイルが生成されること <!-- verify: fr-001 -->
- [x] FR-002 — プロセス再利用: 有効な PID ファイルが存在する場合、新規起動をせず既存サーバーの URL をコンソールに表示すること <!-- verify: fr-002 -->
- [x] FR-003 — PID ファイル管理: PID ファイルが存在するがプロセスが終了している（ゾンビ PID）場合、古いファイルを削除して新規起動すること <!-- verify: fr-003 -->
- [ ] FR-004 — ポート設定: `~/.mspecrc` の `ui.port` 設定でデフォルトポート 3847 を上書きできること <!-- verify: fr-004 -->

### change-dashboard

- [x] FR-001 — チェンジ一覧表示: 未アーカイブの全チェンジが作成日降順で一覧表示され、各行にステップ進捗バーが表示されること <!-- verify: fr-001 -->
- [ ] FR-002 — ステップ進捗ビジュアライゼーション: 完了済みステップに完了マーク、未完了ステップに未完了マークが付いた進捗バーが表示されること <!-- verify: fr-002 -->
- [ ] FR-003 — モード別フィルター: チェンジモード（typo / minor / bugfix / フルフロー）でフィルタリングできる UI 要素が提供されること <!-- verify: fr-003 -->
- [ ] FR-004 — チェンジ詳細への遷移: チェンジ行クリック時にアーティファクト一覧ページへ遷移すること <!-- verify: fr-004 -->

### artifact-preview

- [ ] FR-001 — Markdown プレビュー: チェンジ内の `.md` ファイルが HTML にレンダリングされてプレビュー表示されること <!-- verify: fr-001 -->
- [ ] FR-002 — Mermaid ダイアグラムのレンダリング: Markdown 内の ` ```mermaid ` ブロックが SVG ダイアグラムとして描画されること <!-- verify: fr-002 -->
- [ ] FR-003 — EARS / Gherkin シンタックスハイライト: spec.md 内の SHALL/MUST（赤系）、SHOULD/MAY（黄系）、GIVEN/WHEN/THEN（緑系）が色分け表示されること <!-- verify: fr-003 -->
- [ ] FR-004 — ダーク / ライトモード切り替え: テーマトグルでダーク・ライトを即座に切り替えられ、選択状態が LocalStorage に永続化されること <!-- verify: fr-004 -->
- [ ] FR-005 — プロトタイプ HTML の iframe 表示: `prototype.html` が `sandbox="allow-scripts"` 属性付き iframe でレンダリングされること <!-- verify: fr-005 -->

### test-result-viewer

- [x] FR-001 — E2E テスト結果一覧: Playwright XML 結果ファイルが解析され、テストケースごとに green / red / skip のバッジ付きで一覧表示されること <!-- verify: fr-001 -->
- [ ] FR-002 — テスト結果バッジ表示: 失敗テストが赤バッジで上部にハイライト表示されること <!-- verify: fr-002 -->
- [ ] FR-003 — テスト失敗の詳細トレース表示: 失敗テストケースのクリックでエラーメッセージ・スタックトレースが折りたたみパネルで展開されること <!-- verify: fr-003 -->
- [ ] FR-004 — スキップテストの明示表示: スキップテストが gray バッジ付きで表示され、理由がある場合はツールチップで表示されること <!-- verify: fr-004 -->

### cli-integration

- [ ] FR-001 — mspec new フック起動: `mspec new` 完了後に Web UI サーバーが未起動であれば自動起動し、URL がコンソールに出力されること <!-- verify: fr-001 -->
- [ ] FR-002 — 既存プロセスへの URL 通知: 既存サーバーが動作中の場合、新規起動せずに「Web UI already running at http://localhost:3847」がコンソールに表示されること <!-- verify: fr-002 -->
- [ ] FR-003 — 非同期起動による CLI ブロッキング回避: Web UI サーバー起動処理が開始されても `mspec new` コマンドが数秒以内に完了し CLI がブロックされないこと <!-- verify: fr-003 -->

## Source-of-Truth Regression Risk

| 既存ケイパビリティ | リスクレベル | 回帰仮説 |
|-------------------|------------|---------|
| `packages/cli/src/commands/new.ts` | HIGH | `launchWebUiIfNeeded()` の追加により `mspec new` の実行フローが変更される。`@mspec/web-ui` が未インストールの場合に `MODULE_NOT_FOUND` 以外のエラーが throw され CLI がクラッシュするリスクがある <!-- verify: human --> |
| `packages/core`（ステップ管理・ファイル I/O） | MEDIUM | REST API エンドポイント `/api/changes` がコアのファイルスキャンロジックを呼び出す際、コアの内部 API 変更（未検出のもの）によってチェンジ一覧が空になるリスクがある <!-- verify: human --> |
| `~/.mspec/` ディレクトリ（既存設定） | MEDIUM | `~/.mspec/ui.pid` の新規作成が既存の `~/.mspec/` 配下ファイル（設定・キャッシュ）と競合する可能性がある。特に同名ファイルが既存フローで使われていないか確認が必要 <!-- verify: human --> |
| `~/.mspecrc` 設定ファイル | LOW | `ui.port` キーの追加が既存の `.mspecrc` パーサーで未知キーとして無視される保証が必要。厳格パーサーの場合は既存設定読み込みが失敗するリスクがある <!-- verify: human --> |
| pnpm workspaces / monorepo 構成 | LOW | `packages/web-ui` の新規追加により `pnpm install` 時のワークスペース解決が変化し、既存パッケージのビルドやテストに副作用が生じる可能性がある <!-- verify: human --> |
| `packages/cli` の既存テスト | MEDIUM | `new.ts` への hook 追加により、既存の `mspec new` コマンドの単体テスト・統合テストが非同期処理のタイムアウトや副作用で失敗するリスクがある <!-- verify: human --> |

## Design Decision Coverage

- [ ] Decision 1: Fastify を `packages/cli/src/server/` に統合する設計が `design.md` に記載され、`cli-integration FR-003` の受け入れ基準（5 秒以内完了）と対応付けられていること <!-- verify: human -->
- [ ] Decision 2: PID ファイルを `~/.mspec/ui.pid` に配置する設計が `design.md` の PID Manager Contract として型定義済みであること <!-- verify: human -->
- [ ] Decision 3: `@mspec/web-ui` を独立パッケージとして `optionalDependencies` に定義し、未インストール時のグレースフルデグレードコードが `design.md` の Optional Dependency Contract に記載されていること <!-- verify: human -->
- [ ] Decision 4: React Router v7 で URL 管理し `/changes/:id` がブラウザ履歴に残ることが設計として明示されていること <!-- verify: human -->
- [ ] Decision 5: TanStack Query `refetchInterval: 3000` によるポーリングが `change-dashboard FR-002` の「5 秒以内に UI に反映」要件を満たすことが設計上で検証されていること <!-- verify: human -->
- [ ] Decision 6: Playwright JSON と JUnit XML 両フォーマットに対応するパーサーが `TestSuite[]` に正規化する実装として計画されていること <!-- verify: human -->
- [ ] Decision 7: デフォルトポート 3847 の選択理由（ポート競合リスク）が `design-rationale.md` に記載されていること <!-- verify: human -->
- [ ] Decision 8: `sandbox="allow-scripts"` による iframe 分離が `artifact-preview FR-005` のセキュリティ要件を満たし、`allow-same-origin` を意図的に除外していること <!-- verify: human -->
- [ ] Decision 9: `@mspec/web-ui` 未インストール時の案内メッセージ（`npm install @mspec/web-ui`）が `cli-integration FR-001` の要件と整合していること <!-- verify: human -->

## Constitution Checklist

- [ ] 原則 I（ステップ独立性）: `design.md` が `research.md` のみを入力とし、他ステップ成果物（tasks.md 等）に依存していないこと <!-- verify: human -->
- [ ] 原則 II（決定論的マージ）: Data Models・REST API・PID Contract の全型定義が曖昧さなく記述されており、アーカイブ時に SoT spec へのマージ競合が発生しないこと <!-- verify: human -->
- [ ] 原則 III（質問駆動の要件確定）: 全 Decisions テーブルの各行が対応する Delta Spec の Scenario（GIVEN/WHEN/THEN）にトレース可能であること <!-- verify: human -->
- [ ] 原則 IV（双方向アンカー）: REST API エンドポイント・Data Models・React Router ルートが tasks.md の各実装タスクのアンカーとして機能すること <!-- verify: human -->
- [ ] 原則 V（強制ステップと拡張ステップの分離）: `design-rationale.md` が `design.md` から分離された拡張ドキュメントとして独立して管理されていること <!-- verify: human -->
- [ ] `design.md` の Constitution Check テーブルに全 5 原則（I〜V）の Phase 0 / Phase 1 が記入されており、未記入行がないこと <!-- verify: human -->
- [ ] 全 Delta Spec（5 ケイパビリティ）で `## ADDED Requirements` セクションに FR 番号が連番で割り当てられており、欠番・重複がないこと <!-- verify: human -->
- [ ] 全 Requirement に `risk_tier`（critical / standard / trivial）と `blast_radius` のアノテーションが付与されていること <!-- verify: human -->
- [ ] `design.md` の `doc_type: Reference` が設定されており、成果物として参照可能な状態であること <!-- verify: human -->
