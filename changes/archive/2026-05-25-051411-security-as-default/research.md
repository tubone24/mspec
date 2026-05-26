---
doc_type: Reference
change: 2026-05-25-051411-security-as-default
---

# Research: security-as-default

## Decisions

| 決定事項 | 結論 | 根拠 |
|---------|------|------|
| security質問のIDプレフィックス | `PRP-SEC-001`〜`PRP-SEC-004` | 既存の全質問IDは `PRP-<CAT>-<NNN>` 形式（PRP-FS-001, PRP-NFR-001...）。`SEC-` 単体はCLIパーサーの破壊リスクあり。Delta Spec本文の `SEC-001`〜`SEC-004` 参照も合わせて修正する |
| Constitution原則番号 | `### VI. Security by Default` | I〜Vの連番を維持し、Additional Constraintsとの混在をなくす。番号の空白なし |
| `templates/constitution.md` の扱い | プレースホルダーIII.〜VI.を追加してVI.を実文で埋める | memory/constitution.mdと同一構造にし、`mspec init`で新規プロジェクトにVI原則が自動継承されることを保証 |
| Security Capabilitiesセクションのarchive扱い | 情報セクションとして扱い、archiveマージ対象外 | archiveのマージロジックはADDED/MODIFIED/REMOVED/RENAMEDセクションのみを処理する。`## Security Capabilities`はHTMLコメントと同様にメタ情報として通過する |
| security質問の必須性 | 全4問必須表示（`when: always`）。「なし/該当しない」は有効な回答として受理 | ユーザー決定「全changeで必須」。4問全ての回答をproposal.mdに記録する |
| constitutionバージョン | `1.0.0 → 1.1.0`、`Last Amended: 2026-05-25` | `memory/constitution.md`のガバナンス規定「原則の追加はMINOR以上」に明記 |
| `delta-spec.md`（第3テンプレート）への対応 | ja/enと同様に`## Security Capabilities`セクションを追加 | バイリンガル混在の現役テンプレートとして存在しており、ja/enと同等に扱う |

## Web References

- [OWASP Security by Design Principles](https://owasp.org/www-project-developer-guide/draft/design/security_principles/) — Least Privilege / Fail Securely / Defense in Depthの原則定義。SEC質問の選択肢設計の根拠
- [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119) — SHALL/MUST/SHOULD/MAYのセマンティクス。Constitution VI原則の本文記述で遵守

## Codebase Findings

### packages/cli/templates/questions/proposal.yaml

- version/step/questions の3フィールド構成
- 全質問IDは `PRP-<CATEGORY>-<NNN>` パターン（PRP-FS-001, PRP-NFR-001, PRP-CST-001）
- `when: always` と `when: "answers.PRP-FS-001 == '全く新規の機能'"` の2パターン存在
- `multi_select` フィールドは任意（省略時はsingle-select）、`options: dynamic` もサポート
- **追加先**: ファイル末尾。新カテゴリ `security` として4問（PRP-SEC-001〜004）

追加するYAMLブロック:
```yaml
  - id: PRP-SEC-001
    category: security
    when: always
    question: この変更が触れる権限境界は? (複数可)
    options:
      - ファイルシステムアクセス
      - ネットワーク/外部API
      - メール/通知
      - 秘密情報 (Secrets/環境変数)
      - 認証/認可
      - なし
    multi_select: true
    recommend_first: false

  - id: PRP-SEC-002
    category: security
    when: always
    question: この変更でアクセス範囲が増加するものは? (複数可)
    options:
      - メール送信
      - 認証情報の取得・保存
      - ファイル読み書き範囲の拡大
      - 外部APIコール追加
      - 秘密情報へのアクセス追加
      - 増加なし
    multi_select: true
    recommend_first: false

  - id: PRP-SEC-003
    category: security
    when: always
    question: エージェント/自動化処理への新規権限付与はありますか?
    options:
      - あり (内容をOpen Questionsに記録)
      - なし
      - 該当しない
    multi_select: false
    recommend_first: false

  - id: PRP-SEC-004
    category: security
    when: always
    question: この変更のロールバック手段は?
    options:
      - git revert
      - マイグレーション down
      - フィーチャーフラグ
      - ロールバック不可
    multi_select: false
    recommend_first: false
```

### packages/cli/templates/artifacts/delta-spec.ja.md / .en.md / delta-spec.md

- 現構成: ADDED/MODIFIED/REMOVED/RENAMEDの4セクション
- `## Security Capabilities`セクションは未存在
- **追加先**: `## ADDED Requirements` の直前に `## Security Capabilities` セクションを挿入
- archiveマージはこのセクションを処理せず通過する（安全）

追加するMarkdown（ja版）:
```markdown
## Security Capabilities

<!-- proposalのsecurity質問（PRP-SEC-001〜004）の回答からmspec-proposalスキルが記述する -->
<!-- 権限境界: <PRP-SEC-001の回答> -->
<!-- アクセス増加: <PRP-SEC-002の回答> -->
<!-- エージェント権限: <PRP-SEC-003の回答> -->
<!-- ロールバック手段: <PRP-SEC-004の回答> -->
```

### memory/constitution.md

- 現在I〜Vの5原則 + 非ナンバリングのAdditional Constraints
- バージョン: `1.0.0`
- **変更**: `### VI. Security by Default` を V原則の直後・Additional Constraintsの直前に追加
- **バージョン更新**: `1.0.0 → 1.1.0`、`Last Amended: 2026-05-25`

VI原則の文言（案）:
```markdown
### VI. Security by Default

すべてのchangeのproposalステップにおいて、権限境界・外部API・メール/通知・秘密情報・認証に関するセキュリティ質問（PRP-SEC-001〜004）への回答を必須とする。エージェントが自律的にコードを生成・変更する際、セキュリティを後付けの考慮事項ではなく設計の一部として扱い、すべての変更がblast_radiusと権限変更の影響範囲を明示した状態でdelta specに記録されることを要求する。
```

### packages/cli/templates/constitution.md

- 現在: `### I. <Principle Name>` / `### II. <Principle Name>` の2プレースホルダーのみ
- **変更**: III.〜V.のプレースホルダーを追加し、VI.を実文で埋める
- memory/constitution.mdと同一のVI.原則テキストを使用

### packages/cli/templates/claude/skills/mspec-proposal/SKILL.md

- Procedure手順4でAskUserQuestionを3〜5問実施する記述あり
- **変更**: 手順4の説明文に「securityカテゴリ（PRP-SEC-001〜004）の4問を含む」を明記
- 手順5または6aでsecurity回答をproposal.mdのDecisionsテーブルに記録する旨を追加
- このchangeの`@mspec-delta`アンカーを追記

### FR-ID競合確認

- `specs/question-bank/spec.md` — Requirementsセクション空、FR-001から開始可
- `specs/constitution/spec.md` — 同上
- `specs/mspec-proposal/spec.md` — 同上
- `specs/delta-spec-template/spec.md` — 同上

## Implementation Notes

1. Delta Specの `SEC-001`〜`SEC-004` 参照を `PRP-SEC-001`〜`PRP-SEC-004` に修正が必要（question-bank spec FR-003本文）
2. `memory/constitution.md` はVI原則追加後にVersion/Last Amendedも更新する
3. `delta-spec.md`（第3テンプレート）も忘れずにSecurity Capabilitiesセクションを追加する

---

## Constitution Check

| 原則 | Phase 0 評価 | Phase 1 評価 |
|------|-------------|-------------|
| I. ステップ独立性 | ✅ PASS — proposal.yamlへの質問追加・SKILL.mdの手順追記はステップ間依存を増やさない。`mspec questions`で動的に読み込むため前ステップ文脈依存なし | — |
| II. 決定論的マージ | ✅ PASS — YAML/Markdownへの純粋な追記のみ。CLIパーサーへの変更なし。Security Capabilitiesセクションはarchiveマージ対象外 | — |
| III. 質問駆動の要件確定 | ✅ PASS — この変更自体がIII原則をsecurityドメインへ拡張する。AskUserQuestionで4問追加 | — |
| IV. 双方向アンカー | ⚠️ 要注意 — SKILL.md変更時にこのchangeの@mspec-deltaアンカーを追記する必要あり | — |
| V. 強制ステップと拡張ステップの分離 | ✅ PASS — workflow.yamlの強制ステップ定義は変更しない。proposalステップの内容拡張のみ | — |
