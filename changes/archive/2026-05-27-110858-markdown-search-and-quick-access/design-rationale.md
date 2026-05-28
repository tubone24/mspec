---
doc_type: Explanation
---

<!-- See also: ./design.md -->

# Design Rationale: markdown-search-and-quick-access

## Context

mspecのSpecViewerとChangesダッシュボードは既にMiniSearch 7.2.0による全文検索インデックスを構築しており、`content`フィールドをインデックスに含めている（`packages/web-ui/src/lib/searchIndex.ts:1-45`）。しかし`storeFields`に`content`が含まれておらず、検索結果オブジェクトから本文を直接取得できない設計になっていた。スニペット表示のためには本文を何らかの形で保持する必要があり、`storeFields`追加とMap別管理という2つの選択肢が存在した。

クイックアクセスパレット（⌘K）については、`packages/web-ui/src/components/Search.tsx:57-59` に既にヒント表示（装飾）として⌘Kが表示されていたが、実際のキーバインドは未実装だった。コードベース全体にキーバインド登録パターンが一切存在しないため、完全新規実装が必要な状況だった。これはUIの「意図」が先に設計されており、実装が追いついていなかった状態を示している。

## Decisions

### contentキャッシュ方式: Map別管理を採用

`storeFields`に`content`を追加するとMiniSearchがインデックス内に本文を2重保持（インデックス用とstore用）するため、メモリ消費が倍増する。社内ツールとしてのChange数は数十〜数百件程度を想定しているが、全アーティファクトの本文を合算すると数MB〜数十MBになり得る。ユーザーの明示的な判断（メモリ消費抑制優先）に基づき、`buildIndex()`フェッチ時に`Map<changeId, content>`を並行構築する方式を採用した。

`createSearchIndex()`の戻り値型に`contentCache`を追加することで、既存の呼び出し側（Dashboard.tsx、SpecViewer.tsx）への影響を最小限に抑えつつ、スニペット抽出に必要な本文を利用可能にする。この変更は型安全に行えるため、TypeScriptのコンパイラが変更漏れを検出できる。

### AND条件: `combineWith: 'AND'` の採用

MiniSearchの`combineWith: 'AND'`オプションは、スペース区切りの全トークンを含む文書のみを返却する。正規表現を使用しないリテラルマッチのみを使用することで、ReDoS攻撃を根本的に回避できる。これはproposalのセキュリティ決定（DoS対策：リテラルマッチのみ）と完全に整合する。既存の`index.search(query)`呼び出しに`{ combineWith: 'AND' }`を追加するだけの最小変更で実現できるため、実装リスクが低い。

### パレット配置: App.tsx QueryClientProvider 直下

クイックアクセスパレットは全ページで機能する必要があるため、ルーター外のルートレベルに配置する。`App.tsx`の`QueryClientProvider`直下に`<QuickAccessPalette>`を追加することで、`useChanges()`と`useSpecs()`フックが同一の`QueryClient`コンテキストを利用でき、データの重複フェッチが発生しない。`BrowserRouter`の外側に配置するため、ルート遷移時にもパレットのstateが保持される。

## Alternatives Considered

- **`storeFields: ['content']` を searchIndex に追加**: シンプルだが、メモリ消費が倍増する。ユーザーが明示的に却下。
- **スニペット表示時に都度APIフェッチ**: ネットワーク遅延が発生しUXが悪化する。`buildIndex()`で既にフェッチ済みのコンテンツを再取得するのは非効率。
- **全ページに`<QuickAccessPalette>`を個別実装**: 重複コードが増え、状態管理が分散する。
- **Zustand storeでパレット状態管理**: グローバル状態として管理する価値があるが、単一コンポーネントの`isOpen`ステートはローカル`useState`で十分。`useQuickAccess`hookに閉じることでテスタビリティも維持できる。
- **cmdk ライブラリの採用**: 外部依存を避ける方針のため、プロポーザルで明示的に除外。

## Trade-offs

- **Map別管理 vs storeFields**: 実装が若干複雑になる（`buildIndex()`の戻り値型変更、`contentCache`の引き回し）が、メモリ消費を抑制できる。Change数が増加しても線形的なメモリ増加のみで済む。
- **グローバルキーバインド登録**: `document.addEventListener`はコンポーネント外からのイベント登録であり、cleanup漏れのリスクがある。`useEffect`のreturnで必ず`removeEventListener`を呼ぶことで対処。
- **textContentのみ使用**: ハイライト（`<mark>`タグ）によるリッチ表示ができないが、XSSリスクをゼロにする。スニペット表示の主目的は「どの箇所でマッチしたか」を確認することであり、プレーンテキストで十分。

## Rejected Options

- **Fuse.js / Lunr への移行**: MiniSearchが既に導入済みのため、追加依存は不要。
- **サーバーサイド全文検索（Elasticsearch等）**: プロポーザルで明示的に除外（クライアントサイドのみ）。
- **Semantic Search（ベクトル検索）**: プロポーザルで明示的にNon-Goalとして除外。
- **`navigator.userAgent`文字列パース**: スプーフィング可能・プライバシーリスクあり。`navigator.userAgentData?.platform`（低エントロピー）を優先し、非対応ブラウザは`navigator.platform`フォールバック。

## Constitution Check

| Principle | Phase 0 | Phase 1 |
|-----------|---------|---------|
| I ステップ独立性 | OK — design-rationale は design/research と独立した説明ドキュメント | OK — 実装への変更を含まない純粋な説明ドキュメント。他のステップに影響しない |
| II 決定論的マージ | OK — 新規ファイル追加のみ | OK — git revert で確実に元に戻せる。他アーティファクトへの副作用なし |
| III 質問駆動の要件確定 | OK — 全決定はresearchのOpen Choicesで確定済み | OK — contentキャッシュ方式・スニペット行数・次Step表示の3件が全て確認済み。本ドキュメントはその決定の根拠を記録 |
| IV 双方向アンカー | OK — 参照するFR-IDはdeltaステップで付与済み | OK — tasks.md実装時にコードへアンカーが付与される |
| V 強制ステップと拡張ステップの分離 | OK — 説明ドキュメントはワークフローに影響しない | OK — design-rationaleは参照ドキュメント。強制ステップを変更しない |
| VI Security by Default | OK — textContent使用・ReDoS回避・UA文字列クライアント利用のみの合理的根拠を記載 | OK — セキュリティ決定の根拠が明文化されており、独立したレビューが可能 |

### Complexity Tracking

None
