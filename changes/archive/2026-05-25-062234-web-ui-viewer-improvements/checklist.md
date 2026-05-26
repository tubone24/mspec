---
doc_type: Reference
---

# Checklist: web-ui-viewer-improvements

## Delta Spec Coverage

### artifact-preview / FR-009 — Markdown 見出し・書式の完全レンダリング

- [x] `packages/web-ui/package.json` に `@tailwindcss/typography` が devDependencies に追加されている <!-- verify: fr-009 -->
- [x] `packages/web-ui/tailwind.config.ts` に `plugins: [typography]` が設定されている <!-- verify: fr-009 -->
- [x] `ArtifactPreview.tsx`（または `ArtifactViewer.tsx`）の prose クラスが typography プラグイン有効化後に H1〜H6 を視覚的に階層化してレンダリングすること（Scenario: 見出しが正しくレンダリングされる） <!-- verify: fr-009 -->
- [x] コードフェンスブロックが等幅フォント・背景色付き枠内に表示されること（Scenario: コードブロックが整形されて表示される） <!-- verify: fr-009 -->

### artifact-preview / FR-010 — スプリットビューレイアウト

- [x] `ChangeDetail.tsx` に `useState<string | null>` による選択状態管理が実装されている <!-- verify: fr-010 -->
- [x] アーティファクト行クリック時にページ遷移なしでスプリットビューに切り替わること（Scenario: アーティファクトクリックでスプリットビューが開く） <!-- verify: fr-010 -->
- [x] スプリットビュー表示時、左ペインのアーティファクト一覧が維持されたまま右ペインのみ切り替わること（Scenario: 別アーティファクトへの切り替え） <!-- verify: fr-010 -->
- [x] 閉じるボタンまたは同じアーティファクトの再クリックでスプリットビューが閉じて全幅リスト表示に戻ること（Scenario: スプリットビューを閉じる） <!-- verify: fr-010 -->
- [x] `/changes/:id/artifacts/*` ルートおよび `ArtifactPreview` ページが維持されており URL 直接アクセスが機能すること <!-- verify: human -->
- [x] `ArtifactViewer.tsx` が新規作成され、`ChangeDetail` の右ペインと `ArtifactPreview` の両方から利用されていること <!-- verify: fr-010 -->

### change-dashboard / FR-007 — ステップ実行中のリアルタイム進捗描画

- [x] `client.ts` の `refetchInterval` が 2000 ms に変更されており、2 秒以内の自動更新を達成していること（Scenario: ステップ実行中に進捗が自動更新される） <!-- verify: fr-007 -->
- [x] `StepState` 型に `'skipped'` と `'invalid'` が追加されている <!-- verify: fr-007 -->
- [x] `StepProgress.tsx` の `ready` 状態に `animate-pulse` が付与され、`done`・`blocked` と視覚的に区別されること（Scenario: 実行中ステップにアニメーションが表示される） <!-- verify: fr-007 -->
- [x] ステップ完了時に `animate-pulse` が消えて完了マーク（`done` 状態の色）に切り替わること（Scenario: ステップ完了時に即座に表示が切り替わる） <!-- verify: fr-007 -->
- [x] `skipped` と `invalid` の STATE_COLORS が `blocked` とは異なる色で定義されていること <!-- verify: fr-007 -->

---

## Source-of-Truth Regression

### artifact-preview SoT

- [x] ⚠️ HIGH RISK **FR-001（Markdown プレビュー / risk_tier: critical）**: `ArtifactPreview.tsx` の rendering ロジックが `ArtifactViewer.tsx` に移譲されることで、既存の Markdown → HTML レンダリングが壊れていないか確認する。`prose dark:prose-invert max-w-none` クラスが `ArtifactViewer` 側にも引き継がれていること <!-- verify: human -->
- [x] ⚠️ HIGH RISK **FR-002（Mermaid ダイアグラムレンダリング）**: `ArtifactViewer` リファクタリング後も `MermaidRenderer` が正常に動作し、`data-testid="mermaid-svg"` の SVG が描画されること（FR-006 E2E テスト通過で検証可） <!-- verify: human -->
- [x] **FR-003（EARS/Gherkin シンタックスハイライト）**: `ArtifactViewer` に `GherkinHighlight` が引き継がれており、spec.md のシンタックスハイライトが機能すること（FR-008 E2E テスト通過で検証可） <!-- verify: human -->
- [x] **FR-004（ダーク/ライトモード切り替え / risk_tier: trivial）**: trivial のためチェックリスト項目をスキップ <!-- verify: human -->
- [x] **FR-005（prototype.html の iframe 表示）**: `ArtifactViewer` が iframe レンダリングパスを含む場合、`sandbox="allow-scripts"` 属性が維持されていること <!-- verify: human -->
- [x] ⚠️ HIGH RISK **FR-006（E2E Mermaid SVG レンダリング確認 / risk_tier: critical）**: リファクタリング後も Playwright E2E が `[data-testid="mermaid-svg"] svg` セレクターを検出できること <!-- verify: human -->
- [x] **FR-007（E2E ダーク/ライトモード永続化確認）**: テーマトグルの `data-testid="theme-toggle"` や Zustand store キー `mspec-ui-store` が変更されていないこと <!-- verify: human -->
- [x] **FR-008（E2E EARS/Gherkin ハイライト確認）**: `data-testid="gherkin-highlight"` 要素が `ArtifactViewer` に引き継がれていること <!-- verify: human -->

### change-dashboard SoT

- [x] **FR-001（チェンジ一覧表示）**: `client.ts` の `refetchInterval` 変更がチェンジ一覧の降順表示に影響しないこと <!-- verify: human -->
- [x] **FR-002（ステップ進捗ビジュアライゼーション）**: `StepState` 型に `'skipped'` / `'invalid'` を追加したことで既存 `'done' | 'ready' | 'blocked'` の判定ロジックや UI 表示が壊れていないこと。SoT FR-002 の「最大 5 秒以内」要件に対し、2000 ms に短縮した後も反映されること（要件強化であり後退ではないが確認要） <!-- verify: human -->
- [x] ⚠️ HIGH RISK **FR-005（E2E ダッシュボード画面の表示確認 / risk_tier: critical）**: `StepProgress.tsx` の STATE_COLORS 変更後も Playwright E2E がチェンジ一覧を正常に表示できること <!-- verify: human -->
- [x] **FR-006（E2E モードフィルター動作確認）**: `StepProgress.tsx` / `client.ts` 変更がフィルター機能に影響しないこと <!-- verify: human -->

### web-ui-server SoT（関連ケイパビリティ）

- [x] **FR-001（サーバー起動）**: Web UI の変更によりビルドが壊れてサーバーが起動しなくなるリスクがないか確認する（TypeScript コンパイルエラー・Vite ビルドエラー） <!-- verify: human -->

---

## Constitution

- [x] **原則 I ステップ独立性**: 本チェンジの design.md は research.md を読むのみで実装ファイルに依存しておらず、ステップ独立性を満たしている <!-- verify: human -->
- [x] **原則 II 決定論的マージ**: Delta Spec に ADDED 要件のみが含まれており、MODIFIED/REMOVED/RENAMED セクションが空であるため、archive 時のマージが決定論的であること <!-- verify: human -->
- [x] **原則 III 質問駆動の要件確定**: 深リンク非対応・ルート維持・型修正範囲の 3 点がユーザー確認済みであり、決定根拠が design-rationale.md に追跡可能な形で記録されている <!-- verify: human -->
- [x] **原則 IV 双方向アンカー**: design.md 冒頭に `@mspec-delta` アンカーが記載されており、実装後に `ArtifactViewer.tsx` / `ChangeDetail.tsx` / `StepProgress.tsx` / `client.ts` の各ファイルに対応する `@mspec-delta` アンカーが付与されること <!-- verify: human -->
- [x] **原則 V 強制/拡張ステップの分離**: minor モードで proposal / quickstart がスキップされており、強制ステップ（Spec / Delta Spec / Archive）は維持されている <!-- verify: human -->
- [x] **Additional Constraints — セキュリティ**: 変更対象はすべて `packages/web-ui/` 配下のフロントエンドファイルであり、`changes/` / `specs/` / `memory/` の範囲への影響はない <!-- verify: human -->
- [x] **Additional Constraints — パフォーマンス**: `refetchInterval` を 3000 → 2000 ms に短縮することはサーバー負荷増加（ポーリング頻度 50% 増）を伴うが、ローカル開発ツールの用途では許容範囲か確認する <!-- verify: human -->
