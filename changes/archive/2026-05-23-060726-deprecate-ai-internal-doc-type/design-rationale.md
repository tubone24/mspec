---
doc_type: Explanation
---

<!-- See also: ./design.md -->

# Design Rationale: deprecate-ai-internal-doc-type

## Context

mspec は 2026-05-18 の `revise-artifact-taxonomy` change で `AI-Internal` という 5 番目の doc_type を導入した。その動機は「`tasks.md` の主な消費者が AI エージェントであり、人間向けの 4 Diátaxis 型のどれにも当てはまらない」という観察だった。しかし、Diátaxis フレームワークは文書を「読者が何を必要としているか（認知ニーズ）」で分類するものであり、消費者が人間か AI かという軸は Diátaxis の設計軸に含まれない。

`AI-Internal` はこの軸を導入することで Diátaxis の哲学的一貫性を損なう。mspec のドキュメントが Diátaxis を採用した目的は「任意の読者（AI・人間問わず）が文書に対して持つ認知的なゴールに合った構造」を保証することであり、消費者属性を分類軸に混入させることは設計の一貫性を破壊する。

## Decisions

### AI-Internal を完全廃止し 4 種に戻す理由

`tasks.md` は「番号付きタスク一覧・アンカーブロックの索引」であり、読者が特定の情報をルックアップするために参照する文書である。Diátaxis の `Reference` 型の定義（"accurate, complete, reliable information — facts"）に合致する。したがって `tasks.md` には `Reference` が適切であり、「AI しか読まない」という属性を独立した型として立てる理由はない。

`AI-Internal` を維持する場合、将来的に「AI が主に読む文書」のすべてに `AI-Internal` を付与するという運用圧力が生まれる。これは Diátaxis の 4 象限を意味のない形で拡張し続けるスリッパリースロープに至る。

### `Reference` を tasks.md の代替として選んだ理由

`How-to` も検討した。`How-to` は「特定の目標を達成するための手順ガイド」であり、実行順序が重要な文書に向く。しかし `tasks.md` はアンカーブロックによる参照ルックアップが主目的であり、「順番に実行する手順書」ではない。`Reference` は「マップのように構造を反映した、distraction のない事実の記述」であり、`tasks.md` の役割に近い。

### E2E テストを削除せず反転する理由

`'accepts AI-Internal'` テストを `'rejects AI-Internal'` に反転することで、廃止された振る舞いが明示的にテストスイートに記録される。削除した場合は、将来の開発者が「なぜ AI-Internal を拒否するのか」を理解するコンテキストを失う。反転コストは低く（期待値の変更のみ）、ドキュメント価値が高い。

## Alternatives Considered

- **AI-Internal を How-to に変更**: `tasks.md` は順序付き手順書ではないため不適切。棄却。
- **AI-Internal を Explanation に変更**: `tasks.md` は「なぜそう設計したか」ではなくタスク一覧であるため不適切。棄却。
- **AI-Internal を Tutorial に変更**: Tutorial は学習者が手を動かしながら学ぶ文書。`tasks.md` は学習体験を提供しない。棄却。
- **AI-Internal を deprecated フラグ付きで維持**: バリデーター実装が複雑化し、将来の削除コストを高める。今回のスコープで完全に廃止する方が清潔。棄却。
- **移行スクリプトの提供**: アクティブな変更ディレクトリに `doc_type: AI-Internal` を持つ `tasks.md` は存在しないため不要。棄却。

## Trade-offs

- **廃止後にアーカイブ済み変更ディレクトリ内の `tasks.md` が古い `AI-Internal` を持ち続ける**: `mspec validate` はアーカイブ済みディレクトリをスキャンしないため実害なし。確認・移行のコストを払わない判断をした（ユーザー確認済み）。
- **E2E テスト反転の実装コスト**: 削除よりもわずかに手間がかかるが、廃止の意図を永続的に文書化する価値がある。

## Rejected Options

- `AI-Internal` 型の存続: Diátaxis 哲学との不整合を永続させるため棄却
- 5 番目の型として別名（例: `Operational`）での再定義: 分類軸の問題は名称変更では解決しない。消費者属性は Diátaxis の軸ではないため棄却

---

## Constitution Check

| 原則 | Phase 0 | Phase 1 |
|---|---|---|
| I: ステップ独立性 | ✅ design-rationale は他ステップ成果物を変更しない | ✅ rationale は design.md の補完文書であり独立している |
| II: 決定論的マージ | ✅ Delta Spec の変更と競合しない | ✅ 採用理由の記述は SoT spec のマージに影響しない |
| III: 質問駆動の要件確定 | ✅ research ステップで確定済み | ✅ 未解決事項なし |
| IV: 双方向アンカー | ✅ design.md の D-1〜D-3 と相互参照を明記 | ✅ 各 Decision が Delta Spec の FR に対応 |
| V: 強制ステップと拡張ステップの分離 | ✅ design は拡張ステップ。新たな要件追加なし | ✅ rationale は設計の「なぜ」のみを記述 |

### Complexity Tracking

None
