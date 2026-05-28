---
doc_type: Explanation
---

<!-- See also: ./design.md -->

# Design Rationale: fix-existing-purpose-placeholders

## Context

FR-005（`fix-specviewer-purpose-regression` チェンジ）により、`mspec archive` 実行時にアーカイブ対象 capability の Purpose が自動生成されるようになった。しかし FR-005 は新規 archive 時のみ動作するため、それ以前に作成された 39 件の capability spec にはプレースホルダーが残っている。

このチェンジは「設計意図と実装の対応確認（Constitution Principle VII）」に従い、FR-005 の設計意図（「全 spec の Purpose が意味のある記述になること」）を既存スペックにも retroactive に適用する。

## Decisions

### Claude Code アドホック実行を選択した理由

これは一回限りの retroactive 修正であり、繰り返し実行される機能ではない。専用の CLI コマンド（`mspec fix-purpose`）や SKILL.md の変更は恒久的な機能追加を意味するが、このチェンジのスコープ外である。Claude Code が Edit ツールで直接ファイルを修正する方式により、最小限の実装コストで目的を達成できる。`design.md` の Project Structure も参照。

### 正規表現でプレースホルダー行のみを置換する理由

`## Purpose` と `## Requirements` の間に存在するプレースホルダー行のみを対象にすることで、Requirements・FR 番号・Scenario などの重要なコンテンツへの誤影響を完全に排除できる。全セクション再生成の代替案と比較して、リスクが大幅に低い。

## Alternatives Considered

- **専用 CLI コマンド `mspec fix-purpose` の実装**: 一回限りの処理のために新規 CLI を実装するのは過剰。Constitution Principle II（決定論的マージ）との兼ね合いで LLM 呼び出しを CLI に持ち込むことへの懸念もある。却下。
- **SKILL.md に「一括バックフィル手順」を追加**: 定期的に実行される機能ではないため SKILL.md への恒久的な追加は不適切。却下。
- **1 capability ずつ手動実行**: 39 件を手動で 1 件ずつ行うのは非現実的。却下。

## Trade-offs

- Purpose は AI 生成のため非決定論的（実行毎に文言が異なる可能性）。ただし Purpose は補助情報であり厳密な再現性は不要
- アドホック実行なので将来的な再実行時に一部ファイルで Purpose が上書きされる可能性があるが、冪等チェックで防止している

## Rejected Options

- **CLI コマンドの新設**: 一回限りの処理への過剰実装。Constitution II への副作用懸念。
- **手動実行**: 39 件を人間が手動で Purpose を書くのは非現実的かつ品質にばらつきが出る。

## Constitution Check

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | ✅ | 他ステップへの副作用なし |
| II. 決定論的マージ | ✅ | ✅ | CLI マージは変更なし |
| III. 質問駆動の要件確定 | ✅ | ✅ | 全決定事項を proposal で確認 |
| IV. 双方向アンカー | N/A | N/A | アドホック実行 |
| V. 強制ステップと拡張ステップの分離 | ✅ | ✅ | SKILL.md・workflow.yaml 変更なし |
| VI. Security by Default | ✅ | ✅ | ローカル書き込みのみ |
| VII. 設計意図と実装の対応確認 | ✅ | ✅ | FR-005 の設計意図を FR-006 で明示的に実装 |
