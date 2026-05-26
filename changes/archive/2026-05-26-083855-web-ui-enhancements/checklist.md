---
doc_type: Reference
---

# Checklist: web-ui-enhancements

## Delta Spec Coverage

### FR-008 — アーカイブフィルター

- [ ] デフォルト状態（URL に `?showArchived` なし）でダッシュボードを開いたとき、`changes/archive/` 内のチェンジが一覧に表示されないこと <!-- verify: fr-008 -->
- [ ] `[data-testid="filter-archived"]` トグルをクリックすると URL が `?showArchived=true` に変化し、アーカイブ済みチェンジが一覧に追加表示されること <!-- verify: fr-008 -->
- [ ] アーカイブ済みチェンジの行に `opacity-60 italic` スタイルおよび「アーカイブ済み」バッジが適用されること <!-- verify: fr-008 -->
- [ ] `GET /api/changes` は `?includeArchived=true` が付いた場合にのみアーカイブ済みチェンジを返し、パラメータなしの場合はアクティブなチェンジのみを返すこと <!-- verify: human -->
- [ ] `ChangeInfo` レスポンスに `isArchived: boolean` フィールドが常に（フィルター ON/OFF 問わず）含まれること <!-- verify: human -->
- [ ] `useChanges(showArchived)` フックが `showArchived=true` のとき `?includeArchived=true` クエリを付与し、`false` のときはクエリを付与しないこと <!-- verify: human -->

### FR-009 — SoT Spec ビューアー

- [ ] ダッシュボードヘッダーに「Spec Viewer」ナビゲーションリンクが表示され、クリックで `/spec-viewer` に遷移すること <!-- verify: fr-009 -->
- [ ] `/spec-viewer` を開いたとき、`GET /api/specs` が返す全 capability 名が左ペインにリスト表示されること <!-- verify: fr-009 -->
- [ ] capability 名をクリックすると URL が `/spec-viewer/:capability` に変化し、右ペインに選択した capability の `spec.md` が Markdown レンダリング済みで表示されること <!-- verify: fr-009 -->
- [ ] `GET /api/specs` エンドポイントが `specs/*/` ディレクトリに対応する capability 名の配列を返すこと <!-- verify: human -->
- [ ] `GET /api/specs/:capability` エンドポイントが `specs/<capability>/spec.md` の生テキストを返すこと <!-- verify: human -->
- [ ] パストラバーサル防止チェック（`fullPath.startsWith(paths.specsDir + path.sep)`）が実装されており、境界外パス・隣接ディレクトリ名コリジョン（例: `specs-evil`）に対して 403 を返すこと <!-- verify: human -->
- [ ] `SpecViewer.tsx` が CSS Grid `grid-cols-[240px_1fr]` のスプリットビューレイアウトで実装されていること <!-- verify: human -->
- [ ] `registerSpecsRoutes` が `packages/cli/src/server/index.ts` で登録されていること <!-- verify: human -->

## Source-of-Truth Regression

### change-dashboard（High Risk）

- [ ] FR-001: アーカイブフィルター OFF 状態でダッシュボードを開いたとき、アクティブなチェンジが引き続き全件正しく表示されること（既存の一覧表示動作が壊れていないこと） <!-- verify: human -->
- [ ] FR-003: モード別フィルター（typo / minor / bugfix / full）がアーカイブフィルターと同時に動作し、両方を適用したとき正しく絞り込まれること <!-- verify: human -->
- [ ] FR-005（critical）: Playwright E2E テストで `http://localhost:5173` のダッシュボードが 10 秒以内に表示され、アクティブなチェンジが 1 件以上リストアップされること。`isArchived` フィールド追加後も既存テストが通過すること <!-- verify: human -->
- [ ] FR-006: Playwright E2E テストでモードフィルター `[data-testid="filter-bugfix"]` をクリックしたとき絞り込みが機能し、URL が変化しないこと <!-- verify: human -->
- [ ] FR-007: `useChanges(showArchived)` への引数追加後も `refetchInterval: 2000` によるポーリングが継続し、リアルタイム進捗更新が 2 秒以内に反映されること <!-- verify: human -->
- [ ] `ChangeInfo` の型拡張（`isArchived: boolean` 追加）が既存フィールドを破壊しない後方互換な追加であること <!-- verify: human -->

### artifact-preview（Medium Risk）

- [ ] FR-001（critical）: `ArtifactFile.docType` フィールド追加後も、Markdown ファイルのプレビュー表示・ダーク/ライトモード切り替えが正常に動作すること <!-- verify: human -->
- [ ] FR-002: Mermaid ダイアグラムのレンダリングが `collectArtifacts` の変更によって影響を受けていないこと <!-- verify: human -->
- [ ] FR-006（critical）: Playwright E2E テストで `[data-testid="mermaid-svg"] svg` セレクターに一致する SVG 要素が引き続き描画されること <!-- verify: human -->
- [ ] FR-010: スプリットビューレイアウト（左ペイン＝アーティファクト一覧、右ペイン＝ビューアー）が `ChangeDetail.tsx` の変更後も正常に機能すること <!-- verify: human -->
- [ ] `collectArtifacts` の `doc_type` 正規表現解析（`/^doc_type:\s*(.+)$/m`）が `.md` 以外のファイル（`.agent-runs.jsonl` 等）に対して `docType: undefined` を返し、エラーを発生させないこと <!-- verify: human -->
- [ ] `ArtifactFile` の型拡張（`docType?: string` 追加）がオプショナルであり、既存コードとの型互換性が保たれること <!-- verify: human -->

## Constitution Check

- [ ] I. ステップ独立性: design.md が前ステップ（research）の成果物を参照するのみで、会話文脈に依存していないこと。`mspec continue` の拡張が後方互換な追加に限られていること <!-- verify: human -->
- [ ] II. 決定論的マージ: 本 change の FR-008・FR-009・FR-011 は全て ADDED のみであり、既存 FR の変更・削除を行っていないこと。マージが CLI パーサーにより機械的に実施可能であること <!-- verify: human -->
- [ ] III. 質問駆動: design.md 内の Open Choices が全て解決済みであり、未解決の決定事項が残っていないこと <!-- verify: human -->
- [ ] IV. 双方向アンカー: 実装ファイルおよび E2E テストに `@mspec-delta` アンカーが付与され、FR-008・FR-009 に対して最低 1 つのアンカーブロックが紐付くこと <!-- verify: human -->
- [ ] V. 強制/拡張分離: SpecViewer などの新規 UI 機能が tasks.md に独立タスクとして分離されており、強制ステップ（Spec / Delta Spec / Archive）の構造に影響を与えていないこと <!-- verify: human -->
- [ ] VI. Security by Default: パストラバーサル防止チェック（FR-009）が design.md に明記されており、`fullPath.startsWith(paths.specsDir)` が実装時に必ず適用されること。Delta Spec の Security Capabilities セクションに権限境界・blast_radius が記載されていること <!-- verify: human -->
