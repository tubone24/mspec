---
doc_type: Tutorial
---

# Quickstart: markdown-search-and-quick-access

この機能追加により、SpecViewerとChangesダッシュボードの検索がMarkdown本文テキストにも対応し、⌘K（macOS）/ Ctrl+K（Windows/Linux）でクイックアクセスパレットが使えるようになる。

## Prerequisites

- mspec Web UI が起動済みであること（`mspec serve` または `mspec open`）
- 1件以上の Change または Spec が存在すること

## Setup

追加インストール不要。MiniSearch は既存依存として含まれている。

スニペット抽出のコアロジック（参考）:

```javascript
// extractSnippet: キーワードを含む行と前後2行を返す
function extractSnippet(content, query, context = 2) {
  const needle = query.trim().split(/\s+/)[0].toLowerCase();
  const lines = content.split('\n');
  const hitIndex = lines.findIndex(line => line.toLowerCase().includes(needle));
  if (hitIndex === -1) return null;
  const start = Math.max(0, hitIndex - context);
  const end = Math.min(lines.length, hitIndex + context + 1);
  return lines.slice(start, end).join('\n');
}
```

## Try it — Golden Path

### 1. Markdown本文の全文検索を試す

1. ブラウザで mspec Web UI を開く（デフォルト: http://localhost:3847）
2. Changesダッシュボードの検索ボックスにカーソルを当てる
3. 変更名やタイトルには含まれないが、`proposal.md` や `spec.md` の本文にのみ存在するキーワードを入力する
4. 検索結果の各Changeカードに、マッチした行前後2行のスニペットが表示されることを確認する

**AND条件を試す**:
1. 検索ボックスにスペース区切りで2つ以上のキーワードを入力する（例: `shall snippet`）
2. 両方のキーワードを本文に含むChangeのみが表示されることを確認する

### 2. SpecViewer でのMarkdown本文検索を試す

1. `/spec-viewer` に移動する
2. サイドバーの検索ボックスにキーワードを入力する（spec.md の本文にのみ含まれるFR番号や要件テキスト）
3. 対象Capabilityがサイドバーに絞り込まれ、スニペットが表示されることを確認する

### 3. クイックアクセスパレット（⌘K / Ctrl+K）を試す

1. Web UI上の任意のページで以下のキーを押す：
   - **macOS**: `⌘K`
   - **Windows / Linux**: `Ctrl+K`
2. 画面中央にクイックアクセスパレットが表示されることを確認する
3. パレットに以下が表示されていることを確認する：
   - Specファイル一覧
   - Changes一覧
   - Capability名一覧
   - 直近の未完了Changeの次ステップへのリンク
4. パレット内のテキストボックスに文字を入力して、インクリメンタルにフィルタリングされることを確認する
5. `Escape` キー（またはパレット背景のクリック）でパレットが閉じることを確認する

## Verify

- [ ] Changesダッシュボードの検索でMarkdown本文ヒット行のスニペットが表示される
- [ ] スペース区切り複数キーワードでAND条件が動作する（全キーワードを含むChangeのみ表示）
- [ ] SpecViewer サイドバーの検索でMarkdown本文ヒット行のスニペットが表示される
- [ ] ⌘K（macOS）/ Ctrl+K（Win/Linux）でパレットが開く
- [ ] パレット内テキスト入力でインクリメンタルフィルタリングが動作する
- [ ] Escape キーでパレットが閉じる
- [ ] パレット内の項目クリックで正しいページに遷移する

## Troubleshooting

**スニペットが表示されない**
→ 検索インデックスのビルドが完了していない可能性がある。ページをリロードしてインデックスビルド完了を待つ（インジケーターが消えたら完了）。

**⌘K を押してもパレットが開かない**
→ ブラウザの組み込みショートカットと競合している可能性がある（例: Chrome の ⌘K はアドレスバーにフォーカス）。URL バーではなくページ本文にフォーカスがある状態でショートカットを押す。

**AND条件が効いていない（片方のキーワードのみヒット）**
→ スペース区切りでキーワードを入力すると自動的にAND条件になる。OR検索は不可（仕様外）。

**Ctrl+K がブラウザのリンクフォーカス機能と競合する**
→ ブラウザによっては Ctrl+K がアドレスバーまたは検索バーにフォーカスする場合がある。ページにフォーカスがある状態で実行する。
