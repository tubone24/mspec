---
doc_type: Reference
---

# Architecture Overview: revise-artifact-taxonomy

本 change が変更する mspec 内部構造を、変更前 (Before) → 変更後 (After) の対比で示す。図は (1) doc_type 体系全体、(2) `design` ステップの 2 ファイル生成フロー、(3) `archive` ステップの readme Summary 追記フローの 3 視点。

## System Diagram — doc_type 体系 (Before → After)

```mermaid
graph LR
  subgraph Before["Before — 4 doc_type"]
    direction TB
    B_R[Reference]
    B_E[Explanation]
    B_H[How-to]
    B_T[Tutorial]
    B_files["proposal.md → Explanation<br/>research.md → Reference<br/>design.md → Reference<br/>architecture-overview.md → Reference<br/>quickstart.md → How-to<br/>checklist.md → Reference<br/>tasks.md → Reference<br/>readme.md → Reference<br/>glossary.md → Reference"]
  end

  subgraph After["After — 5 doc_type (Diátaxis + AI-Internal)"]
    direction TB
    A_R[Reference]
    A_E[Explanation]
    A_H[How-to]
    A_T[Tutorial]
    A_AI[AI-Internal]
    A_files["proposal.md → Explanation<br/>research.md → Reference<br/>design.md → Reference (純化)<br/>design-rationale.md → Explanation ✨新規<br/>architecture-overview.md → Reference<br/>quickstart.md → How-to<br/>checklist.md → Reference<br/>tasks.md → AI-Internal ⚡変更<br/>readme.md → Tutorial ⚡変更<br/>glossary.md → Reference"]
  end

  Before -->|本 change が適用| After
```

## System Diagram — 実装層の変更影響範囲

```mermaid
graph TB
  subgraph Templates["packages/cli/templates/artifacts/"]
    T_design["design.{ja,en}.md<br/>(Decisions 削除)"]
    T_rationale["design-rationale.{ja,en}.md<br/>✨新規"]
    T_tasks["tasks.{ja,en}.md<br/>(doc_type → AI-Internal)"]
    T_readme["readme.{ja,en}.md<br/>(doc_type → Tutorial<br/>+ Summary 雛型)"]
  end

  subgraph Skills["packages/cli/templates/claude/skills/"]
    S_design["mspec-design/SKILL.md<br/>(2 ファイル生成手順)"]
    S_archive["mspec-archive/SKILL.md<br/>(Summary 追記手順)"]
  end

  subgraph Workflow["packages/cli/templates/"]
    W_yaml["workflow.default.yaml<br/>(design produces 拡張)"]
  end

  subgraph CLI["packages/cli/src/"]
    C_new["commands/new.ts<br/>(buildReadmeFallback)"]
    C_validator["lib/artifact-validator.ts<br/>(Summary warning ルール)"]
  end

  subgraph Tests["packages/cli/tests/e2e/"]
    E_doctype["artifact-taxonomy-doc-type.e2e.test.ts<br/>(VALID_DOC_TYPES + 表更新)"]
  end

  Templates --> Skills
  Templates --> Workflow
  Templates --> CLI
  CLI --> Tests
  Templates -.参照.-> Tests
```

## Sequence — `design` ステップでの 2 ファイル生成（After）

```mermaid
sequenceDiagram
  actor User
  participant CLI as mspec CLI
  participant Skill as mspec-design skill
  participant FS as changes/<id>/

  User->>CLI: /mspec:continue
  CLI->>Skill: 起動 (current_step=design)
  Skill->>FS: read research.md / proposal.md / specs/*/spec.md

  Note over Skill: step 3 — design.md (Reference) を書く
  Skill->>FS: write design.md<br/>(Summary / Goals / Project Structure / Constitution)

  Note over Skill: step 3a — design-rationale.md (Explanation) を書く ✨新規
  Skill->>FS: write design-rationale.md<br/>(Context / Decisions / Alternatives / Trade-offs)

  Note over Skill: step 4 — architecture-overview.md を書く
  Skill->>FS: write architecture-overview.md

  Note over Skill: step 5 — 両ファイルに Constitution Check (Phase 0/1) を埋める
  Skill->>FS: update design.md & design-rationale.md

  Skill->>CLI: mspec validate --change <id>
  CLI-->>Skill: ✓ (両ファイル frontmatter + 章存在を確認)
  Skill->>FS: readme.md の checkbox 更新
  Skill->>User: block: true — /mspec:continue 待ち
```

## Sequence — `archive` ステップでの readme Summary 追記（After）

```mermaid
sequenceDiagram
  actor User
  participant CLI as mspec CLI
  participant Skill as mspec-archive skill
  participant FS as changes/<id>/
  participant SoT as specs/<capability>/spec.md
  participant Archive as changes/archive/

  User->>CLI: /mspec:continue (current_step=archive)
  CLI->>Skill: 起動
  Skill->>FS: step 1 — read 全成果物 (proposal, delta, research, design, design-rationale, tasks, checklist)
  Skill->>SoT: step 2 — Delta Spec を SoT に決定論的マージ

  Note over Skill: step 3 — マージ結果検証
  Skill->>SoT: read merged spec
  Skill->>Skill: 差分・FR 採番一貫性確認

  Note over Skill: step 3b — readme Summary を AI 生成 ✨新規
  Skill->>FS: read change diff / 確定 Delta Spec / research D1-D6
  Skill->>Skill: ### Lessons (3-5 bullet) と ### Next Steps (2-4 bullet) を生成
  Skill->>FS: append to readme.md<br/>(プレースホルダコメント削除 + 本文挿入)

  Note over Skill: step 4 — archive 移動
  Skill->>Archive: mv changes/<id>/ changes/archive/<id>/

  Skill->>CLI: mspec validate
  CLI-->>Skill: ✓ (Summary 本文を検出、warning なし)
  Skill->>User: complete
```

## Data Model — readme.md Summary セクションの構造（After）

```mermaid
erDiagram
  README_MD ||--o| FRONTMATTER : has
  README_MD ||--|{ SECTION : contains
  FRONTMATTER {
    string doc_type "Tutorial (was: Reference)"
  }
  SECTION {
    string heading
    string content
    int order
  }
  SECTION ||--o| SUMMARY_SECTION : "is (when heading == '## Summary')"
  SUMMARY_SECTION ||--|| LESSONS : "has sub-section"
  SUMMARY_SECTION ||--|| NEXT_STEPS : "has sub-section"
  LESSONS {
    string heading "### Lessons"
    string bullets "3-5 件 × 1-2 行"
  }
  NEXT_STEPS {
    string heading "### Next Steps"
    string bullets "2-4 件 × 1 行 + FR-ID リンク"
  }
```

## UI Mockup

該当なし（CLI ツール / ドキュメントテンプレ変更のみで UI 影響なし）。

## Constitution Check

> Step: design (architecture-overview.md) | Constitution Version: current

architecture-overview.md は design.md の補助図示であり、原則評価は design.md と同一結果となる。差分は「図示の責務範囲が同一 change 内に閉じているか（原則 I）」「複数 capability 間の依存表現が決定論的マージを阻害しないか（原則 II）」の 2 点に集中する。

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ⚠️ | ✅ | 図示する全ノード（templates / skills / workflow / CLI / tests）は本 change 内で完結し、他 change の成果物には依存しない。design.md と同様 Phase 1 で ✅ に格上げ。 |
| II. 決定論的マージ | ✅ | ✅ | System Diagram で示す capability 横断の影響は Delta Spec に分解済み（artifact-taxonomy / claude-integration / cli-workflow-engine / cli-spec-lint の 4 spec.md）。archive 時の SoT マージは各 spec 独立に進行し、図の依存矢印は実装順序を強制しない。 |
| III. 質問駆動の要件確定 | ✅ | ✅ | architecture-overview.md は research D1-D6 と design Decisions に基づく図示であり、新たな要件確定は発生しない。 |
| IV. 双方向アンカー | — | — | 図はアンカー対象（Delta Spec ↔ tasks ↔ 実装）の構造を示すのみで、アンカー仕組み自体には影響しない。 |
| V. 強制ステップと拡張ステップの分離 | ⚠️ | ⚠️ | design Sequence Diagram の step 3a（design-rationale 生成）と archive Sequence Diagram の step 3b（readme Summary 追記）は強制ステップ内のサブ成果物追加を視覚化している。design.md と同様 Phase 1 でも ⚠️ を保持し、Constitution 改訂議題として残す。 |

### Complexity Tracking

⚠️ 1 件（原則 V）。design.md の Complexity Tracking と同根拠（`design-rationale.md` 任意化はユーザー要求と矛盾、軽量モードでの design 全体スキップにより実害限定的）。本ファイルでの追加根拠なし。
