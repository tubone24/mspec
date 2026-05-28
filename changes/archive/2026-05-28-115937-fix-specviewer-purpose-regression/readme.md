---
doc_type: Tutorial
---

<!-- @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md -->
<!-- Requirements implemented: FR-005 -->
<!-- Change: revise-artifact-taxonomy -->

# fix-specviewer-purpose-regression

> Status: new
> Created: 2026-05-28
> Mode: bugfix

## Request

SpecViewer に「`<このスペックがカバーする外部から観測可能な振る舞いの概要>`」というテンプレートプレースホルダーが表示されてしまうデグレの修正。
Purpose フィールドはアーカイブ時に自動生成される設計だったが、現状では未記入のまま SpecViewer に露出している。
プレースホルダーを非表示にするか、アーカイブ時に正しく生成・埋め込むよう修正する。

## Artifacts

- [ ] proposal.md
- [x] specs/<capability>/spec.md (Delta Spec)
- [x] research.md
- [x] design.md / design-rationale.md / architecture-overview.md
- [ ] design-rationale.md
- [ ] quickstart.md
- [x] checklist.md
- [x] tasks.md

## Skipped Steps

<!-- `mspec skip <step-id> --reason "..."` 実行時に追記される -->
<!-- 例: - research: typo 修正のみのため省略 (skipped at 2026-05-14T10:30:00Z) -->

## Summary (Lessons / Next Steps)

### Lessons

- `mspec done <step>` コマンドで `produces: []` のステップ（self-review・implement・archive）を完了マークできる。ワークフローが done-log.json で状態を管理していることを初めて把握した。
- SKILL.md のみの変更でも TDD は適用できる。「SKILL.md に step 3d が存在するか」を assertion するテストファイル（`.e2e.test.ts`）を書き、RED → GREEN サイクルで実装の前後を検証できた。
- 今回の問題は「デグレ」ではなく「実装漏れ」だった。`buildSotSkeleton()` がプレースホルダーを埋め込む設計はあったが、archive スキルにそれを埋める手順が最初から実装されていなかった。
- self-reviewer の [blocker] 指摘（System Diagram の step 順序）は誤検知だった。step 3b は SKILL.md で「CLI 実行前に必須」と明記されており、図は正しかった。注記を追加して誤解を防いだ。
- bugfix モードでは proposal・research・quickstart ステップが自動スキップされ、デザインドキュメントの記述が簡略化された。小さな修正でも mspec ワークフローの追跡可能性を維持できることが確認できた。

### Next Steps

- **既存 41 件のプレースホルダーを retroactive に修正する**（FR-005 で新規 archive 時は自動生成されるが既存 spec は未修正）→ `fix-existing-purpose-placeholders` として別チェンジを作成する
- **SpecViewer でプレースホルダーを UI 上で非表示にするフォールバック**（上記 retroactive 修正が完了するまでの暫定対応として検討）→ `fix-specviewer-purpose-regression` 関連 FR-005 フォローアップ
