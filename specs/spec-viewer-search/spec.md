<!-- mspec: gaps in FR numbering are intentional. Removed requirements are archived under changes/archive/. -->

# spec-viewer-search Specification

## Purpose

<このスペックがカバーする外部から観測可能な振る舞いの概要>

## Requirements

<!-- archive コマンドが Delta Spec の ADDED/MODIFIED/REMOVED/RENAMED を機械的にマージします -->

### Requirement: FR-001 — Spec Viewer サイドバーへの検索ボックス追加

<!-- risk_tier: standard -->
<!-- blast_radius: local -->

Spec Viewer が表示されているとき、このシステムは SHALL capabilities 一覧の上部にテキスト入力型の検索ボックスを表示する.

#### Scenario: 検索ボックスが常に表示される
- GIVEN ユーザーが `/spec-viewer` にアクセスした
- WHEN ページが読み込まれる
- THEN サイドバーの capabilities 一覧の上部に検索ボックスが表示される

### Requirement: FR-002 — specs ディレクトリのクライアントサイド全文検索インデックス構築

<!-- risk_tier: standard -->
<!-- blast_radius: module -->

Spec Viewer が初期化されたとき、このシステムは SHALL `/api/specs` で取得した全 capability の spec.md 本文を `/api/specs/:capability` から順次フェッチし、capability 名・見出し・本文テキスト・FR 番号をクライアントサイドのメモリ上でインデックス化する.

#### Scenario: 起動時にインデックスが自動構築される
- GIVEN ユーザーが `/spec-viewer` を開いた
- WHEN ページの初期化処理が完了する
- THEN 全 capability の spec.md 本文を含む検索インデックスがメモリ上に構築され、検索が有効化される

### Requirement: FR-003 — インクリメンタルフィルタリング（debounce）

<!-- risk_tier: standard -->
<!-- blast_radius: local -->

ユーザーが検索ボックスにテキストを入力したとき、このシステムは SHALL 入力を debounce（200ms 以内）した後にインデックスを照会し、マッチした capabilities のみをサイドバー一覧に表示する.

#### Scenario: 入力しながら即座に絞り込まれる
- GIVEN Spec Viewer が表示され検索インデックスが構築済みの状態
- WHEN ユーザーが検索ボックスに `full-text` と入力する
- THEN 200ms 以内にサイドバーが `full-text` をタイトル・本文に含む capability のみに絞り込まれる

### Requirement: FR-004 — 検索クエリのマッチ箇所ハイライト

<!-- risk_tier: trivial -->
<!-- blast_radius: local -->

検索クエリがサイドバー上の capability 名に部分一致したとき、このシステムは SHALL 一致した文字列部分を視覚的にハイライト表示する.

#### Scenario: 一致したキーワードが強調表示される
- GIVEN `search` というクエリを入力している状態
- WHEN サイドバーに `spec-viewer-search` が表示される
- THEN `search` の部分がハイライト（例: 背景色強調）で表示される

### Requirement: FR-005 — 大文字小文字を区別しない標準化検索

<!-- risk_tier: trivial -->
<!-- blast_radius: local -->

検索クエリが入力されたとき、このシステムは SHALL クエリとインデックスの両方を小文字に正規化した上で比較し、大文字小文字の違いを区別しない検索結果を返す.

#### Scenario: 大文字クエリでも正しくヒットする
- GIVEN 検索インデックスが構築済みの状態
- WHEN ユーザーが `FR-001` と入力する
- THEN `fr-001` または `FR-001` を含む全ての capability がマッチ結果として表示される

### Requirement: FR-006 — 検索結果ゼロ時の空状態表示

<!-- risk_tier: trivial -->
<!-- blast_radius: local -->

検索クエリが入力されたがいずれの capability にもマッチしない場合、このシステムは SHALL 「該当する Capability が見つかりません」旨のメッセージをサイドバーに表示する.

#### Scenario: マッチなし時にフィードバックが表示される
- GIVEN 検索インデックスが構築済みの状態
- WHEN ユーザーがどの spec.md にも存在しないキーワードを入力する
- THEN 空のリストとともに「該当する Capability が見つかりません」または同等のメッセージが表示される

### Requirement: FR-007 — 検索ボックスのクリア操作

<!-- risk_tier: trivial -->
<!-- blast_radius: local -->

検索ボックスにテキストが入力されている状態のとき、このシステムは SHALL クリアボタン（×）を表示し、クリックすることで検索クエリをリセットして全 capability を再表示する.

#### Scenario: クリアボタンで検索をリセットできる
- GIVEN `design` というクエリが入力されリストが絞り込まれている状態
- WHEN ユーザーがクリアボタン（×）をクリックする
- THEN 検索ボックスが空になり、全 capability 一覧が表示される

### Requirement: FR-008 — Markdown本文ヒット行スニペット表示

<!-- risk_tier: standard -->
<!-- blast_radius: local -->

検索クエリがMarkdown本文にマッチしたとき、このシステムは SHALL マッチした行とその前後2行をプレーンテキスト（textContent）としてスニペット表示する.

#### Scenario: 本文ヒット行がスニペットで表示される
- GIVEN Spec Viewer の検索インデックスが構築済みで、ユーザーが検索ボックスにキーワードを入力した
- WHEN 入力したキーワードがいずれかの spec.md 本文にマッチする
- THEN サイドバーの検索結果にヒット行前後2行のプレーンテキストスニペットが表示される

### Requirement: FR-009 — スペース区切り複数キーワードのAND条件検索

<!-- risk_tier: trivial -->
<!-- blast_radius: local -->

ユーザーがスペース区切りで複数キーワードを入力したとき、このシステムは SHALL すべてのキーワードをリテラルマッチで含むドキュメントのみを結果として返す.

#### Scenario: AND条件で複数キーワードを絞り込む
- GIVEN Spec Viewer の検索インデックスが構築済みの状態
- WHEN ユーザーが「検索 スニペット」と入力する
- THEN 両キーワードを本文または見出しに含む capability のみがサイドバーに表示される


