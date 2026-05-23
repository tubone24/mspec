---
doc_type: Explanation
---

<!-- See also: ./design.md -->

# Design Rationale: bump-cli-version-0-1-2

## Context

mspec CLI は `packages/cli/package.json` でバージョンを管理しており、現在 `0.1.1` が定義されている。
ユーザーの要求は `0.1.2` へのバンプで、semver の PATCH 番号インクリメントに該当する（後方互換変更のみ）。

`publish-prep.test.ts` にはバージョン文字列の直値検証が含まれており、`package.json` を更新する際には
同ファイルも一貫して更新する必要がある。また `package-lock.json` が古い `0.1.0-alpha.1` と乖離しているため、
`npm install` による再生成で整合性を回復する。

## Decisions

### 直接編集アプローチの採用

`npm version patch` コマンドを使わず、`package.json` の `version` フィールドを直接編集することを選択した。
理由は、mspec workflow の `implement` ステップが個別ファイル編集タスクとして tasks.md に記述されるため、
コマンド実行ではなく編集操作として管理するほうが一貫性があるためである。

`npm version` コマンドは自動で git tag と commit を作成するオプションがあり、
それが本 workflow の外部で git 履歴を変更するリスクがある。

### テストの直値更新

`publish-prep.test.ts` のバージョン検証を `package.json` の動的読み込みに変更することも可能だが、
本変更の scope（バージョンバンプのみ）を逸脱するため採用しなかった。
直値更新は最小変更の原則に従い、テストの意図（特定バージョンが正しく定義されているか）を維持する。

## Alternatives Considered

- **`npm version patch` コマンドの使用**: 自動バンプが可能だが、git commit/tag の副作用がある。workflow 外での git 操作を避けるため不採用。
- **テストの動的バージョン取得への変更**: `require('../../package.json').version` で比較する方式。将来のバンプでテスト変更が不要になるが、scope 外のリファクタリングが伴うため不採用。
- **package-lock.json の手動編集**: version フィールドだけ書き換えることは可能だが、lock ファイルの整合性が保証されないため不採用。

## Trade-offs

- 直値更新方式を継続するため、次回のバージョンバンプでも `publish-prep.test.ts` の更新が必要になる。

## Rejected Options

- `npm version patch` — git 副作用のリスク
- テストの動的化 — scope 外リファクタリング
- package-lock.json の手動編集 — 整合性の不確実性

## Constitution Check

| Principle | Phase 0 | Phase 1 |
|-----------|---------|---------|
| I. ステップ独立性 | ✅ design-rationale.md のみ生成 | ✅ 実装に関する前提を持たない |
| II. 決定論的マージ | ✅ 新規ファイルのみ | ✅ 代替案の選択基準が明確 |
| III. 質問駆動の要件確定 | ✅ research で解消済み | ✅ 追加判断事項なし |
| IV. 双方向アンカー | ✅ design.md の D-001〜D-003 と相互参照 | ✅ 各決定が FR-005 シナリオに紐づく |
| V. 強制ステップと拡張ステップの分離 | ✅ 強制ステップのみ実行 | ✅ 拡張ステップへの依存なし |

### Complexity Tracking

None
