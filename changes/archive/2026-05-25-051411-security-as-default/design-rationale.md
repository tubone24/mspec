---
doc_type: Explanation
change: 2026-05-25-051411-security-as-default
---

<!-- See also: ./design.md -->

# Design Rationale: security-as-default

## Context

mspecはエージェント駆動開発における「ミドルループOS」として機能しているが、2026年2月時点のThoughtWorksレポートが指摘したように、セキュリティは10テーマ中最も遅れている領域であった。具体的には「メールアクセス一つでアカウント乗っ取りまで到達した事例」が示すように、エージェントが自律的にコードを生成する環境では権限境界への無自覚が重大なインシデントを引き起こす。

現在のmspecにはsecurity質問カテゴリがなく、deltaテンプレートにsecurity capabilitiesの記録欄もなく、Constitutionにもsecurityを第一級原則として扱う条文がない。この「デフォルト機能としての欠落」を修正することが本changeの動機である。変更は純粋なテンプレートとYAMLの追記であり、新しいCLIコードや新しいワークフローステップを必要としない。

## Decisions

### テンプレート追記アプローチを選んだ理由

新しいCLIコマンド（`mspec security check`等）を追加する案もあったが、issue.mdの「ステップ追加病」警告に従い既存ステップへの追加にとどめた。`mspec questions`コマンドがYAMLを動的に読み込む設計のため、proposal.yamlにsecurityカテゴリを追加するだけでCLI変更なしに質問が追加される。これが最小変更・最大効果の実装形態である。

Constitution原則は `memory/constitution.md`（現プロジェクト）と `packages/cli/templates/constitution.md`（新規プロジェクト雛形）の2箇所に反映する。`mspec init` が後者をコピーして前者を生成する仕組み（cli-init FR-002）があるため、テンプレート更新が新規プロジェクトへの自動継承を保証する。

### VI番号（VIIではなく）を選んだ理由

issue.mdは「VII. Security by Default」と記述していたが、実際の `memory/constitution.md` を読むとI〜Vの5原則の直後にAdditional Constraintsが続く構造である。VIIを直接追加するとVIが欠番になり、番号の空白が後の原則追加で混乱を招く。VIを使用することで連番を維持し、将来の原則追加でVII以降を自然に使えるよう予約する。

### Security Capabilitiesセクションをコメントのみにした理由

deltaテンプレートに`## Security Capabilities`セクションを追加する際、セクション内容をHTMLコメントのみにした。これにより`mspec archive`のマージロジック（ADDED/MODIFIED/REMOVED/RENAMEDセクションのみ処理）との干渉を完全に回避する。コメントはSoTマージに含まれないため、決定論的マージ（Constitution II）への違反ゼロで情報記録が実現できる。

## Alternatives Considered

- **新規CLIコマンド `mspec security` を追加する**: 実装コストが高く、新ステップを増やすことになる。issue.mdの「ステップ追加病」警告に違反する。却下。
- **security質問を `when: "risk_tier != 'trivial'"` にする**: ユーザー決定「全changeで必須」に反する。trivialなchangeでも権限境界を確認すべきケースがある。却下。
- **VII番号を使用する**: VIが欠番になり将来の混乱を招く。却下。
- **Security Capabilitiesセクションをarchiveマージ対象にする**: archiveのCLIパーサー修正が必要になり変更範囲が大幅拡大する。却下。
- **SKILL.mdへの変更のみでsecurity質問を実装する**: question-bank.yamlを経由しないため`mspec questions --json`の出力に反映されず、将来のCLI拡張（lint検出等）と統合できない。却下。

## Trade-offs

- **受け入れたトレードオフ**: SKILL.mdの変更はagentプロンプトへの依存であり、CLIによる強制ではない。security質問への回答がproposal.mdに記録されるかどうかはagentの実行に依存する。
- **受け入れたトレードオフ**: Security Capabilitiesセクションはarchiveマージ対象外のため、SoT spec.mdには反映されない。セキュリティ情報はchange/のdelta specにのみ残る。

## Rejected Options

| 選択肢 | 却下理由 |
|--------|---------|
| SAST自動検出の追加 | 外部ツール依存が生まれ、CLIのゼロ外部ネットワーク依存原則に違反 |
| validate errorへの昇格 | 設計段階での過剰拘束。まず質問を「ある状態」にすることが先決 |
| 既存changeへの遡及適用 | 決定論的マージ原則に反する。過去のarchive済みchangeは変更しない |

---

## Constitution Check

| 原則 | Phase 0 評価 | Phase 1 評価 |
|------|-------------|-------------|
| I. ステップ独立性 | ✅ PASS | ✅ PASS — 設計の実装が既存ステップの文脈依存を増やさないことを確認 |
| II. 決定論的マージ | ✅ PASS | ✅ PASS — Security Capabilitiesをコメントのみにすることでマージ干渉ゼロを確認 |
| III. 質問駆動の要件確定 | ✅ PASS | ✅ PASS — PRP-SEC-001〜004の全質問が設計に反映されている |
| IV. 双方向アンカー | ✅ PASS | ✅ PASS — SKILL.md修正時にアンカーを打つ設計。他の変更ファイルはテンプレートのため通常アンカー不要 |
| V. 強制ステップと拡張ステップの分離 | ✅ PASS | ✅ PASS — workflow.yaml定義変更なし |

### Complexity Tracking

None
