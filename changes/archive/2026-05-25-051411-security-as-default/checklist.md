---
doc_type: How-to
change: 2026-05-25-051411-security-as-default
---

# Checklist: security-as-default

## Delta Spec Coverage

- [x] **question-bank / FR-001** — `proposal.yaml` に `security` カテゴリ4問（PRP-SEC-001〜004）が追加され、`mspec questions --phase proposal --json` の出力に `category: security` の質問が4問含まれる <!-- verify: fr-001 -->
- [x] **question-bank / FR-002** — security カテゴリの各質問が `when: always` フィールドを持ち、trivial/minor change でも security 質問がスキップされない <!-- verify: fr-002 -->
- [x] **question-bank / FR-003** — PRP-SEC-001〜004 の4問が存在し、PRP-SEC-001・002 は `multi_select: true`、PRP-SEC-003・004 は `multi_select: false` が設定されている <!-- verify: fr-003 -->
- [x] **delta-spec-template / FR-001** — `delta-spec.ja.md`・`delta-spec.en.md`・`delta-spec.md` の3ファイル全てに `## Security Capabilities` セクションが追加され、PRP-SEC-001〜004 のプレースホルダーが含まれる <!-- verify: fr-001 -->
- [x] **delta-spec-template / FR-002** — proposal ステップで PRP-SEC-001〜004 に回答済みの change の delta spec に `## Security Capabilities` セクションの回答が反映される <!-- verify: fr-002 -->
- [x] **constitution / FR-001** — `memory/constitution.md` に `### VI. Security by Default` が存在し、Version が `1.1.0`、Last Amended が `2026-05-25` に更新されている <!-- verify: fr-001 -->
- [x] **constitution / FR-002** — `packages/cli/templates/constitution.md` に III.〜V. プレースホルダーと VI. Security by Default 実文が追加されており、`mspec init` で作成した新規プロジェクトにVI原則が継承される <!-- verify: fr-002 -->
- [x] **mspec-proposal / FR-001** — mspec-proposal SKILL.md の手順4に PRP-SEC-001〜004 への言及が追記され、proposal ステップで security カテゴリの質問が AskUserQuestion で少なくとも1回呼び出される <!-- verify: fr-001 -->
- [x] **mspec-proposal / FR-002** — proposal ステップで PRP-SEC-001〜004 に回答済みの change の `proposal.md` に security 質問の回答が `## Decisions` テーブルに記述されている <!-- verify: fr-002 -->

## Source-of-Truth Regression Risk

- [x] **proposal.yaml YAML 構文** — `security` カテゴリブロック追加後に YAML パーサーがファイル全体を正常にパースできること。インデント・クオーテーション・`multi_select` 型（boolean）の整合性を確認する <!-- verify: human -->
- [x] **mspec archive マージロジックへの影響** — `## Security Capabilities` セクションは HTML コメントのみで構成されるが、`mspec archive` のマージ処理が ADDED/MODIFIED/REMOVED/RENAMED 以外のセクションを安全にパススルーすることを実際の archive 実行で確認する <!-- verify: human -->
- [x] **constitution.md バージョン文字列の影響** — Version `1.0.0 → 1.1.0` の更新がバージョン文字列を読み取る CLI コマンドに影響しないか確認する <!-- verify: human -->
- [x] **SKILL.md の `@mspec-delta` アンカー解決** — `mspec anchor check` が追加される `@mspec-delta 2026-05-25-051411-security-as-default/specs/mspec-proposal/spec.md` アンカーを正常に解決できること（cli-anchor の双方向検証に通過すること）を確認する <!-- verify: human -->
- [x] **SoT spec が全4 capability で空のままのマージ** — question-bank・constitution・mspec-proposal・delta-spec-template の SoT spec は空の状態。`mspec archive` の新規 capability bootstrap が正常に機能するか確認する <!-- verify: human -->
- [x] **templates/constitution.md のプレースホルダー残存** — III.〜V. プレースホルダーが `mspec init` でコピーされた後も残る挙動が意図通りであるか確認する <!-- verify: human -->

## Constitution Check

- [x] **I. ステップ独立性** — 変更対象はテンプレートファイルと YAML 設定のみ。CLI のステップ間依存を増やしていない。SKILL.md 更新は前ステップ会話文脈に依存しない設計になっているか確認する <!-- verify: human -->
- [x] **II. 決定論的マージ** — `## Security Capabilities` セクションは HTML コメントのみで構成。アーカイブマージ対象（ADDED/MODIFIED/REMOVED/RENAMED）に該当せず、CLIパーサーへの変更もない <!-- verify: human -->
- [x] **III. 質問駆動の要件確定** — PRP-SEC-001〜004 の4問追加で security 要件が質問駆動で確定される。回答が `proposal.md` の追跡可能な形で記録されることを確認する <!-- verify: human -->
- [x] **IV. 双方向アンカー** — SKILL.md への `@mspec-delta` アンカー追加が実施され、`mspec anchor check` でアンカーと Delta Spec の整合性が双方向に検証できることを確認する <!-- verify: human -->
- [x] **V. 強制ステップと拡張ステップの分離** — `workflow.yaml` の強制ステップ定義は変更されない。proposal ステップへのセキュリティ質問追加は内容の拡張のみであることを確認する <!-- verify: human -->
- [x] **mspec-proposal FR-001 強化確認** — SKILL.md手順4がPRP-SEC-001〜004の4問を「functional質問（3〜5問）とは別枠で必ず提示」する文言を含んでいること <!-- verify: human -->
- [x] **mspec validate通過確認** — `## Security Capabilities` セクションを含むdelta-specを使って `mspec delta init` + `mspec validate` が通過することを実行で確認する <!-- verify: human -->
- [x] **PRP-SEC-003の選択肢テキスト整合性** — 選択肢「あり（内容をOpen Questionsに記録）」が示す動作（Open Questions転記）がSKILL.mdの手順に記載されているか確認する <!-- verify: human -->
