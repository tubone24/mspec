---
doc_type: Explanation
---

# Proposal: 目的別チェンジモード（typo / minor / bugfix）

## Why

mspec のフルワークフローは新機能開発向けに設計されており、Typo修正や軽微なリファクタリングに対してもproposal・research・design・quickstartなど多くのステップが強制される。これにより「1行修正のためにドキュメントを大量に書く」という摩擦が生じ、小さな改善を敬遠させる原因になっている。

変更の規模・種類に応じた「モード」を導入し、不要なステップを自動スキップしつつ必要なステップを強制できる仕組みを設ける。`typo`・`minor` は軽量フロー（proposal/quickstart スキップ）、`bugfix` は独自の調査フロー（research 強制・proposal/quickstart スキップ）として設計する。

## Goals

- `typo` モード：誤字・スペルミス修正向け。`proposal` と `quickstart` を自動スキップ
- `minor` モード：軽微なリファクタリング・設定変更向け。`proposal` と `quickstart` を自動スキップ
- `bugfix` モード：バグ修正向け。`proposal`・`quickstart` をスキップし、`research` を強制（スキップ不可）
- `mspec:new` スキルが `/mspec:new` に渡された説明文からモードを AI 推定し、確認を取ってから `readme.md` に `> Mode: <mode>` を書き込む
- `--mode <mode>` 引数で明示指定した場合は AI 推定をスキップして上書き（フォールバック）
- `readme.md` のフロントマターに `> Mode: <mode>` フィールドが追加される
- スキルがモードを読み取り、該当ステップで自動的にスキップ判定・強制判定を行う

## Non-Goals

- `hotfix` モード（緊急対応は別途検討）
- CLI コマンド（`mspec new`）への `--mode` フラグ追加（スキル側での推定・記録が主体）

## Capabilities (touched)

- `claude-integration`：スキルのステップ分岐ロジック（proposal / quickstart のスキップ判定）
- `cli-workflow-engine`：workflow.yaml へのモード定義・スキップルールの追加

## Open Questions

- `minor` モードで research / design も不要なケース（例：コメント修正）はどう扱うか？将来的に `typo` との粒度差を再考する余地あり
- モードが指定されていない既存チェンジとの後方互換性（モード未指定 = フルフロー維持）
- `bugfix` で research を「強制」する実装をスキル側で行うか、`workflow.yaml` のスキーマ拡張で行うか（設計ステップで決定）

## Constitution Check

> Step: proposal | Constitution Version: 1.0.0

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | — | モードは readme.md に永続化。各スキル起動時に独立して再読み込みする |
| II. 決定論的マージ | ✅ | — | モードフィールドはメタデータのみ。マージロジックへの影響なし |
| III. 質問駆動の要件確定 | ✅ | — | 本 proposal 自体が AskUserQuestion で 1問1答して確定 |
| IV. 双方向アンカー | — | — | スキップステップにはアンカー不要。実装ファイルには通常通り付与 |
| V. 強制ステップと拡張ステップの分離 | ✅ | — | スキップ対象は proposal・quickstart のみ。spec/archive 等の強制ステップは維持 |

### Complexity Tracking

None
