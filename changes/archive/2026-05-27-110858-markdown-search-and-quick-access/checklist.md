---
doc_type: Reference
---

# Checklist: markdown-search-and-quick-access

## Delta Spec Coverage

### spec-viewer-search

- [x] FR-008: `extractSnippet()` がMarkdown本文ヒット行とその前後2行をプレーンテキスト（textContent）として返すこと。SpecViewer のサイドバー検索結果にスニペットが表示されること。 <!-- verify: fr-008 -->
- [x] FR-009: スペース区切り複数キーワードを入力したとき、`combineWith: 'AND'` によりすべてのトークンを含むCapabilityのみが結果に返ること。 <!-- verify: fr-009 -->

### web-ui-search

- [x] FR-004: Changesダッシュボード検索でMarkdown本文にのみ存在するキーワードが入力されたとき、`ChangeRow` にヒット行前後2行のプレーンテキストスニペットが表示されること。 <!-- verify: fr-004 -->
- [x] FR-005: Changesダッシュボードでスペース区切り複数キーワードを入力したとき、すべてのキーワードを含むChangeのみが結果として表示されること。 <!-- verify: fr-005 -->

### quick-access-palette

- [x] FR-001: macOSブラウザで ⌘K を押したときクイックアクセスパレットがオーバーレイとして画面中央に表示されること。Windows/Linuxでは Ctrl+K で同様に表示されること。 <!-- verify: fr-001 -->
- [x] FR-002（キーバインド）: `navigator.userAgentData?.platform` または `navigator.platform` を参照してOSを判定し、macOSでは `metaKey+k`、それ以外では `ctrlKey+k` が登録されること。 <!-- verify: fr-002 -->
- [x] FR-002（ヒントUI）: `Search.tsx` のヒントラベルがmacOSでは「⌘K」、Windows/Linuxでは「Ctrl+K」と動的に表示されること。現状の静的 "⌘K" 固定が解消されていること。 <!-- verify: fr-002 -->
- [x] FR-002（MUST NOT）: UA文字列がいかなるAPIリクエストのヘッダーにも含まれないこと。E2Eテスト内でfetch/XHRインターセプターを用いてネットワークリクエストのヘッダーを検査するか、ブラウザのNetworkパネルで確認すること。 <!-- verify: fr-002 -->
- [x] FR-003（コンテンツ表示）: パレット初期表示時にSpecファイル一覧・変更一覧・Capability名一覧・次のワークフローステップへのリンクが表示されること。 <!-- verify: fr-003 -->
- [x] FR-003（API互換性）: `/api/changes` レスポンスに `currentStep` および `updatedAt` フィールドが含まれること（次Stepナビゲーションの前提条件）。実装前にAPIレスポンス型を確認すること。 <!-- verify: fr-003 -->
- [x] FR-004: パレット内テキスト入力時に部分一致する項目のみがリアルタイムにフィルタリングされて表示されること。 <!-- verify: fr-004 -->
- [x] FR-005: パレット表示中にEscapeキーを押すとパレットが閉じてフォーカスが元の要素に戻ること。オーバーレイ背景クリックでも同様に閉じること。 <!-- verify: fr-005 -->

## Source-of-Truth Regression

| FR-ID | Capability | リスク | 理由 |
|-------|-----------|--------|------|
| FR-001 | spec-viewer-search | LOW | 検索ボックスのDOM構造は変更なし。`combineWith:'AND'` 追加はオプション変更のみ |
| FR-002 | spec-viewer-search | **MEDIUM** | `buildSpecIndex()` の戻り値型を `{index, contentCache}` に変更するため、既存の呼び出し側が型変更に追従しなければ SpecViewer のインデックス構築が壊れる |
| FR-003 | spec-viewer-search | LOW | debounce ロジック自体は変更しない。ただし `useSpecSearchIndex.ts` のフェッチループ内で `contentCache` 構築が加わるため、フェッチ完了タイミングが遅延するリスクあり |
| FR-004 | spec-viewer-search | LOW | ハイライト表示はCapability名に対するもので、スニペット追加とは独立している |
| FR-005 | spec-viewer-search | LOW | 大文字小文字正規化は `extractSnippet` 内でも行うため二重になるが、独立した比較なので既存挙動は変わらない |
| FR-006 | spec-viewer-search | LOW | 空状態メッセージが AND 条件で全キーワード不一致の場合にも正しく表示されるか確認が必要 |
| FR-001 | web-ui-search | **MEDIUM** | `buildIndex()` の戻り値型を `{index, contentCache}` に変更するため、`Dashboard.tsx` の呼び出し側が型変更に追従しなければ全文検索が無効化されるリスクあり |
| FR-002 | web-ui-search | **MEDIUM** | 全アーティファクト本文をフェッチして `contentCache` に蓄積するループが追加される。フェッチ失敗時のエラーハンドリングが欠けると本文検索が部分的にしか機能しなくなる |
| FR-003 | web-ui-search | LOW | AND 条件で件数が減少することで体感上のソート順変化が生じる可能性があるが、スコアベースソート自体は変わらない |

## Constitution

- [ ] Principle I（ステップ独立性）: 3Capability（spec-viewer-search / web-ui-search / quick-access-palette）が独立したモジュール境界で設計されており、共有が `extractSnippet` 純粋関数のみに留まっていること <!-- verify: human -->
- [ ] Principle II（決定論的マージ）: 新規追加ファイルおよび既存ファイルの変更がすべて `git revert` で完全に復元可能であること。`App.tsx` の変更が1行追加のみに限定されていること <!-- verify: human -->
- [ ] Principle III（質問駆動の要件確定）: スニペット行数（line-clamp-3）・contentキャッシュ方式（Map別管理）・次Step表示（直近1件）が research.md に追跡可能な形で記録されていること <!-- verify: human -->
- [ ] Principle IV（双方向アンカー）: tasks.md の実装タスクで各ファイルに `@mspec-delta` アンカーがコードコメントとして付与されることが明記されていること <!-- verify: human -->
- [ ] Principle V（強制ステップと拡張ステップの分離）: `QuickAccessPalette` が `App.tsx` にsidecar的に追加されており、既存ルーター・強制ワークフローフローへの変更がないこと <!-- verify: human -->
- [ ] Principle VI（Security by Default）: Delta Spec の Security Capabilities ブロックに権限境界・アクセス増加・エージェント権限・ロールバック手段の4カテゴリがすべて記載されていること <!-- verify: human -->

## Security

- [ ] XSS対策: スニペット表示が `dangerouslySetInnerHTML` を使用せず `textContent` への代入のみで実装されていること。`ChangeRow` および SpecViewer サイドバーのスニペット表示箇所を実装後にコードレビューで確認すること <!-- verify: human -->
- [ ] ReDoS対策: `extractSnippet()` 内で正規表現を使用していないこと。キーワード検索が `String.prototype.toLowerCase()` と `String.prototype.includes()` によるリテラルマッチのみで実装されていること <!-- verify: human -->
- [x] UAフィンガープリンティング: `navigator.userAgent` / `navigator.platform` の参照がクライアントサイドのキーバインド判定のみに使用され、APIリクエストのヘッダーやボディにUA文字列が含まれないこと <!-- verify: fr-002 -->
- [ ] contentCacheメモリ境界: `contentCache` が `Map<id, content>` として別管理されており（storeFieldsに含まれない）、ブラウザメモリ消費が許容範囲内であることを確認すること <!-- verify: human -->
