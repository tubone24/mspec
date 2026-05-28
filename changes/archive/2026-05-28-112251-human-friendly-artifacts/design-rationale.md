---
doc_type: Explanation
---

<!-- See also: ./design.md -->

# Design Rationale: human-friendly-artifacts

このドキュメントは human-friendly-artifacts の変更について「なぜその設計を選んだか」を説明する Explanation ドキュメントです。「何を変えるか」は [design.md](./design.md) を参照してください。

## Context

mspec が生成する checklist.md・design.md・proposal.md は、エンジニアとプロダクトオーナーが変更内容に合意するために読む文書だ。しかし現行の成果物には 2 つの問題がある。

第一に、**テンプレートのセクション見出しが英語の技術用語（Delta Spec Coverage、Source-of-Truth Regression）のままであり**、日本語環境のチームには直感的でない。さらに各セクションに何を確認すればよいかの説明がなく、チェックリストを開いた人は「これは何の確認か？」と戸惑う。

第二に、**design.md には読者向けの導入文がなく**、文書を開いたとたん技術的な決定テーブルや構造情報が始まる。誰がなんのために読む文書なのかが不明なため、認知コストが高い。Google Developer Style Guide が示す「conversational but not casual」のアプローチは、文書の冒頭で読者を定位させることで以降の内容の理解を助けることを示している。

## Decisions

### なぜ見出し名を変更し auditor も更新するのか（FR-007）

checklist.md の実体は mspec-checklist-auditor.md エージェント定義が生成する。テンプレートファイルはスケルトンに過ぎないため、テンプレートだけを変更しても既存の change で実行される checklist.md には反映されない。この認識をもとに、テンプレートと auditor 定義の両方を変更する設計を採用した。

見出し名は Smashing Magazine のチェックリスト UX 研究と checklist.design の実例集が示す「カテゴリ別グループ化＋自然語見出し」のパターンに基づいて「機能確認」「リグレッションリスク」「デプロイ前確認」に変更する。これにより、確認フェーズごとに担当者が自分の担当箇所に直接ジャンプできる。

### なぜコメントではなく本文に説明文を置くのか（FR-006）

HTML コメント（`<!-- -->`）は生成後の Markdown レンダリングで不可視になる。レビュアーが GitHub や Web UI でドキュメントを閲覧するとき、コメント内の説明は全く目に入らない。したがって説明文は本文（散文）として各 H2 直下に配置する必要がある。プレースホルダ形式にすることで実際のチェンジで書き替えられることを前提とした設計にする。

### なぜ `## Summary` 構造を維持してリード文を追加するのか（FR-008）

Delta Spec FR-008 は「Purpose セクション直後」と記述しているが、現行の design テンプレートには `## Summary` が使われており `## Purpose` は存在しない。ユーザー確認（OC-1）の結果、`## Summary` 構造を維持しつつその直下にリード文プレースホルダを追加する方針を採用した。`## Summary` → `## Purpose` のリネームは既存の archive 済み change のテンプレートからコピー済みファイルとの一貫性を失わせるため最小変更を優先した。

## Alternatives Considered

- **HTML コメントで説明文を追加する**: 生成後のレンダリングで不可視になるため却下。
- **全セクションの文体を大幅に書き直す**: 破壊的変更が大きく、既存の change で生成済みのファイルとの整合性を保つのが困難なため最小変更を優先。
- **`## Summary` を `## Purpose` にリネームする**: ユーザーが現行構造の維持を選択したため却下。
- **auditor を変更せずテンプレートのみ変更する**: checklist の実体は auditor が生成するため効果がない。

## Trade-offs

- auditor 定義を変更するため、**この変更以降の checklist.md 生成結果が変わる**。既存の archive 済み change には影響しないが、進行中の change で checklist ステップが未実行の場合は新しいセクション名で生成される。
- テンプレートへのリード文追加は **プレースホルダ文がそのままのケースが生じる可能性** がある（書き替えを忘れた場合）。これは validate では検出しない。

## Rejected Options

- **proposal.md の全文書き直し**: スコープが過大で他の変更とのリスクバランスが取れない。各 H2 直下への一文追加で FR-006 Scenario を満たせる。
- **Constitution 改訂手続きを踏む**: テンプレートのコンテンツ改善であり、強制ステップ定義（workflow.yaml）は変更しないため、Constitution Additional Constraints の適用外と判断。

## Constitution Check (Phase 0 / Phase 1)

| Principle | Phase 0 | Phase 1 | 備考 |
|-----------|---------|---------|------|
| I. ステップ独立性 | ✅ | ✅ | テンプレート変更は各ステップ独立動作に影響しない |
| II. 決定論的マージ | ✅ | ✅ | Delta Spec FR が明確で機械的マージが可能 |
| III. 質問駆動の要件確定 | ✅ | ✅ | OC-1〜OC-4 ユーザー確認済み |
| IV. 双方向アンカー | ✅ | ✅ | FR-006〜FR-008 との対応が明確 |
| V. 強制ステップと拡張ステップの分離 | ✅ | ✅ | workflow.yaml への変更なし |
| VI. Security by Default | ✅ | ✅ | ローカルファイル変更のみ |

### Complexity Tracking

None
