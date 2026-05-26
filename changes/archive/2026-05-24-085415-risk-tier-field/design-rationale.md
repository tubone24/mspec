---
doc_type: Explanation
---

<!-- See also: ./design.md -->

<!-- @mspec-delta 2026-05-24-085415-risk-tier-field/specs/delta-spec/spec.md -->
<!-- Requirements implemented: FR-001, FR-002, FR-003, FR-004, FR-005 -->
<!-- Change: risk-tier-field -->

<!-- @mspec-delta 2026-05-24-085415-risk-tier-field/specs/verify-routing/spec.md -->
<!-- Requirements implemented: FR-001, FR-002, FR-003, FR-004, FR-005 -->
<!-- Change: risk-tier-field -->

# Design Rationale: risk-tier-field

## Context

mspec の現状では、Delta Spec のすべての FR-NNN が同等の verify 負荷を生む。外部 API に影響する critical な変更も、ローカル関数のリネームのような trivial な変更も、同じ checklist 項目と verify アノテーションが付与される。これは「リスクに比例した厳密さ」という原則に反しており、人間のレビュー注意を本当に重要な変更に集中させることを妨げる。

ThoughtWorksのリトリート資料（2026年2月）は「すべての変更を同じ厳密さで扱うことはもはや経済的でない——このコードが間違っていたらブラスト半径はどのくらいか？への転換」を提言している。本設計はこれを mspec のデフォルト動作として組み込む最初のステップである。

今回の変更の難しさは「変更の主体が2つある」点だ: TypeScript CLI（スキーマ・パース・バリデーション）と、エージェントプロンプト（verify アノテーション生成・checklist 項目制御）の両方を同時に変更する必要がある。research ステップで発見したように、verify アノテーションの生成は CLI コードではなくエージェントプロンプト（mspec-checklist-auditor.md）が担っている。

## Decisions

### HTML コメント形式を選んだ理由

Delta Spec は人間とエージェントの両方が読み書きする Markdown ファイルである。YAML front-matter を追加する案は spec.md の既存構造を変える侵襲性が高く、Constitution の「II. 決定論的マージ」に影響するリスクがある。一方、HTML コメントはレンダリング時に非表示で、既存のパーサーロジック（`raw_block` 全体を文字列で保持）と自然に整合する。verify-routing FR-001 がプレースホルダーとして HTML コメント形式を明示的に要件に含めていることも採用の根拠である。

### errors/warnings の2層分離を選んだ理由

「パースが成立するか否か」で分類する。無効な `risk_tier` 値（`risk_tier: unknown` 等）はスキーマ違反であり、後続のすべての処理（verify 分岐・checklist 生成）が誤った前提に基づく。よって `errors[]` → exit code 1 とする。一方、trivial FR が checklist.md に出現するのは「エージェントプロンプトが指示に従わなかった」という artifact 間の不整合であり、パースは成立している。これを `warnings[]` に留めることで proposal の Non-Goal「将来の CI 自動ブロック」との整合性を保つ。

### テンプレート側（templates/claude/）を SoT とする理由

`.claude/skills/` はプロジェクトに `mspec init` を実行した結果生成されるインストール済みディレクトリである。git log の確認により `.claude/skills/` を直接編集するコミットが存在することが判明したが、これは `mspec init` の冪等性を破る運用である。本変更を機に「templates/claude/ が SoT」という原則を design.md に明文化し、将来の混乱を防ぐ。

## Alternatives Considered

- **YAML front-matter として risk_tier を追加**: spec.md のヘッダに `---\nrisk_tier: critical\n---` を追加する案。パーサーが front-matter を既にサポートしていないため、新規パーサーロジックが必要になる。侵襲性が HTML コメントより高い。
- **専用セクション（`## Risk`）を FR ブロックに追加**: Markdown の見出し構造を変える案。既存の H3/H4 構造（Requirement/Scenario）との整合性が取りにくく、`sectionsByDepth` のロジック変更が必要になる。
- **CLI の enforce_flags（`enforce_risk_tier: true`）を先に実装**: フラグを追加してオプトイン方式にする案。フラグ追加は「後方互換ハック」に相当し、デフォルト `standard` で後方互換を確保できる今回の設計では不要。

## Trade-offs

- **プロンプト側の変更は機械的な保証が難しい**: trivial の checklist スキップはエージェントプロンプトの指示で制御するため、100% 機械的な保証ではない。`mspec validate` の warning でサポートするが、エージェントの出力品質に依存する面が残る。
- **blast_radius は今回記録のみ**: データとして保持するが verify 分岐に影響させないため、フィールドを追加したことによる「使われていないデータ」が一時的に生まれる。将来の security capability 連携で価値を発揮する予定。
- **`errors[]` の追加は既存の呼び出し元インターフェースを変更する**: `parseDeltaSpec` の戻り値に `errors` フィールドを追加するため、呼び出し元（`artifact-validator.ts`）でこれを参照する変更が必要になる。既存の `warnings` 配列と対称な構造にすることで変更コストを最小化する。

## Rejected Options

- **risk_tier を propose ステップの質問に組み込む（delta 前に決める）**: FR を書く前に risk_tier を決めることはできない。FR の内容が決まって初めてリスクが評価できる。delta ステップが正しい場所。
- **blast_radius を今回の verify 分岐に含める**: `external` の FR に verify: human を強制する案。スコープを最小化し、まず risk_tier による分岐を安定させることを優先した。
- **trivial の checklist スキップを error で enforce する**: proposal の Non-Goal「将来の CI 自動ブロック」と競合する。warning に留めることで Non-Goals を変更せずに済む。

## Constitution Check

> Step: design | Constitution Version: 1.0.0

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | ✅ | design-rationale.md は design.md と独立して参照可能。前段の会話文脈に依存しない |
| II. 決定論的マージ | ✅ | ✅ | Explanation ドキュメントは SoT spec にマージされない |
| III. 質問駆動の要件確定 | ✅ | ✅ | 設計判断はすべて AskUserQuestion で確定済み。根拠は本ファイルに追跡可能な形で記録 |
| IV. 双方向アンカー | ✅ | ✅ | design-rationale.md に @mspec-delta アンカーを付与済み |
| V. 強制ステップと拡張ステップの分離 | ✅ | ✅ | ステップ構造は変更なし |

### Complexity Tracking

None
