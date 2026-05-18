---
doc_type: Explanation
---

# Proposal: revise-artifact-taxonomy

## Why

mspec の現行 `artifact-taxonomy`（FR-002）は doc_type を Diátaxis 4 種（`Reference` / `Explanation` / `How-to` / `Tutorial`）に厳格に限定し、`AI-Internal` / `Mixed` などの追加型を明示的に禁じている。しかし運用上、`tasks.md` のように「粒度が細かすぎて人間が直接読まず、もっぱら AI が消化する成果物」が存在することがわかり、これを Reference に分類するのは読者誤認を招く。また `design.md` は本来「構造（Reference）」と「設計判断の根拠（Explanation）」の二重性を持ち、片方しか書けないことで意図と仕様が混ざる事態が起きている。さらに `readme.md` は change ディレクトリの入り口でありフロー学習装置でもあるため `Tutorial` 型に再分類するのが自然で、末尾に「振り返り＝まとめ」を置くことで Tutorial 性が完結する。

本改訂は doc_type 体系に **5 番目の `AI-Internal`** を追加し、`design.md` を **Reference + Explanation の 2 ファイル**に分割、`readme.md` を **Tutorial 型**に変更してフローの締めくくりとしての「まとめ」セクションを archive ステップで自動付加する、という 3 つの構造変更を同時に行う。

## Goals

- doc_type の許容値に `AI-Internal` を加え、`tasks.md` をこれに再分類する（FR-001/FR-002 の改訂）。
- `design` ステップで `design.md`（Reference）と `design-rationale.md`（Explanation）を **両方必須で同時生成**する。
- `readme.md` の doc_type を `Tutorial` に変更し、末尾に「まとめ（Lessons / Next Steps）」セクションの雛型を導入する。
- `archive` ステップで AI が当該 change の振り返りを生成し、`readme.md` 末尾の「まとめ」セクションを埋める。
- `mspec validate` および `template-doc-type-invariant.e2e.test.ts` が新体系（5 doc_type）を正しく受理／拒否できる。

## Non-Goals

- 既存 `changes/*` の遡及移行スクリプト・一括変換コマンドの提供（今回は新規 change のみ新体系を適用し、既存は互換チェックを緩めるのみ）。
- Diátaxis 5 象限に基づく外部ドキュメントサイト（MkDocs / Docusaurus 等）の生成。
- `AI-Internal` ファイルに対するアクセス制御・暗号化・`.gitignore` 等のセキュリティ機構。
- `design.md` ⇔ `design-rationale.md` 間のセクションリンクを CLI が自動生成する仕組み（手書きで参照を貼ることを許容）。

## Capabilities (touched)

- `artifact-taxonomy` — FR-001 / FR-002 を改訂して `AI-Internal` を許容、`tasks.md` の doc_type 割り当てを `AI-Internal` に、`readme.md` の doc_type 既定を `Tutorial` に、`design.md` の分割（+ `design-rationale.md` 追加）を追記する。
- `claude-integration` — `mspec-design` skill を 2 ファイル生成に、`mspec-archive` skill に「`readme.md` 末尾まとめ追記」手順を追加する。
- `cli-workflow-engine` — `design` ステップの `produces` を `design.md, design-rationale.md` の 2 件に、`archive` ステップで `readme.md` 末尾を更新可能にする workflow 定義の改訂。
- `cli-spec-lint`（または `cli-state-engine` のテンプレート検証部分）— validate が 5 doc_type を受理し、`AI-Internal` を禁止していた旧ルールを撤廃するよう更新。

> 各 capability の Requirement は `delta` ステップで FR-NNN を採番し、EARS（SHALL/MUST/SHOULD）＋ Scenario（GIVEN/WHEN/THEN）で記述する。

## Open Questions

- 既存 `changes/archive/*` 配下の readme.md / design.md は遡及対象外だが、`mspec validate` を旧 change に対して走らせた際に「doc_type 不一致」で fail しないよう **既存 change を grandfather** するルールが必要か（migration scope の確認は research で詰める）。
- `design.md` と `design-rationale.md` の **役割境界** をテンプレート段階でどこまで強制するか（章立てを固定するか、自由記述に委ねるか）。
- `archive` ステップで生成する「まとめ」セクションの **章立てと長さ** の基準（読者がチュートリアル的に読めるか）。
- `tasks.md` 以外で `AI-Internal` に再分類すべき既存テンプレートはあるか（例: `checklist.md` の AI 消費側面）。
- `template-doc-type-invariant.e2e.test.ts` の現在の実装で、新 doc_type を追加した際に **どこを最小差分で更新できるか**（research で実コードを読む）。

## Constitution Check

> Step: proposal | Constitution Version: current

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ⚠️ | — | `design` が 2 ファイル生成、`archive` が `readme.md` 末尾を書き換える。同一ステップ内に閉じるが、`archive` が他成果物を更新する初の事例となるため Phase 1 で詳細評価。 |
| II. 決定論的マージ | ✅ | — | Delta Spec のマージ仕様（ADDED/MODIFIED/REMOVED/RENAMED）は変更しない。doc_type 値の追加のみ。 |
| III. 質問駆動の要件確定 | ✅ | — | 本 proposal は AskUserQuestion で 4 問の確定を経て記述。スコープ・AI-Internal 用途・design 分割方針・Non-Goals/完了基準を明示。 |
| IV. 双方向アンカー | — | — | テンプレート構造とフロー定義の変更のみで、アンカーフォーマット自体は変えない。Phase 0 では非該当。 |
| V. 強制ステップと拡張ステップの分離 | ⚠️ | — | `design-rationale.md` を必須化し、`archive` ステップに新たな「readme 追記」を強制要素として加える。強制 / 拡張の境界を変えるため Phase 1 で再評価。 |

### Complexity Tracking

⚠️ が 2 件（原則 I, V）。いずれも単純案で済まない理由は次のとおり:

- **原則 I（⚠️）**: `archive` で `readme.md` を編集する案を取る代わりに「まとめ専用ファイル `summary.md` を新設」する単純化も検討したが、Tutorial 型である `readme.md` の末尾に置くことが「読者がフロー全体を 1 ファイルで通読できる」という Tutorial の目的に直接寄与するため、追加ファイル案では学習効果が削がれる。`archive` ステップ独立性は「他ステップへの依存」ではなく「他成果物への副作用」として Phase 1 で明示する。
- **原則 V（⚠️）**: `design-rationale.md` を任意化する単純案もあるが、ユーザーは「設計意図と構造を 1 ファイルに混在させない」ことを明確に要望しており、両方必須でないと分割の効果（Reference の純度・Explanation の独立読解性）が消える。軽量モード（typo/minor/bugfix）では `design` ステップごとスキップ可能であるため、強制化の実害は限定的。
