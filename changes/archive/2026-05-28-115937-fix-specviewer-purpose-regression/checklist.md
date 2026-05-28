# Checklist: fix-specviewer-purpose-regression

## Delta Spec Coverage

<!-- verify: fr-005 -->
- [x] FR-005 (Purpose フィールド自動生成): `mspec archive -y` 完了後、対象 capability の `specs/<cap>/spec.md` の `## Purpose` がプレースホルダーのままの場合に 1〜2 文の意味のある記述で上書きされること。プレースホルダー以外が記述済みの場合はスキップされること（べき等性）。

## Source-of-Truth Regression Risk

<!-- verify: human -->
- [x] FR-001 (Lessons 分析フロー起動): step 3d（Purpose 生成ループ）は step 3c（ポストモーテムフック）の後に実行される。step 3d が途中で失敗した場合、step 3c で起動する mspec-lessons-analyzer の起動タイミングや実行結果に影響しないことを確認する。（設計上は独立ステップだが、step 3c→3d のシーケンシャル実行における障害伝搬パスは機械検証不可）

<!-- verify: human -->
- [x] FR-002 (NextAction 評価フロー起動): step 3d が一部の capability で Purpose 生成に失敗した場合でも、mspec-nextaction-planner サブエージェントの起動フローへの影響がないことを確認する。（FR-001 と同様のシーケンス障害リスク）

<!-- verify: human -->
- [x] FR-003 (ユーザー承認なしの自動書き込み禁止): step 3d は `specs/<cap>/spec.md` への書き込みをユーザー承認なしで実行する。FR-003 のスコープは `memory/constitution.md` への書き込みと `mspec new` の実行に限定されており、`specs/` 配下の書き込みは対象外であるため直接的な違反ではない。ただし、アーカイブ後に spec ファイルが無承認で上書きされるというユーザー期待との整合性を人間が評価すること。（ガードレール不在のリスクは設計判断の妥当性であり機械検証不可）

<!-- verify: human -->
- [x] FR-004 (承認済み NextAction の自動チェンジ生成): step 3d は `specs/` 配下のみを対象としており `changes/` 配下のファイル生成とは独立している。FR-004 への影響リスクは低いが、step 3d の失敗が後続の `mspec new` 実行を中断させないことを確認する。（実行フローの分岐条件は機械検証不可）

## Constitution Check

<!-- verify: human -->
- [x] Principle I (ステップ独立性): step 3d は既存の step 3c の後に追加され、他ステップへの副作用はないと設計書に記載されている。実際の SKILL.md 実行時にステップ間の状態漏れがないことを人間がレビューすること。（スキル実行時の動的な副作用は機械検証不可）

<!-- verify: human -->
- [x] Principle II (決定論的マージ): CLI archive（LLM フリー）は変更されておらず、Purpose 生成は SKILL.md の AI 生成ステップに閉じている。LLM による Purpose 生成結果は非決定論的であるが、マージ処理自体への影響がないことを確認すること。（LLM 出力の非決定性が許容範囲内かは機械検証不可）

<!-- verify: human -->
- [x] Principle III (質問駆動の要件確定): FR-005 は Delta Spec に明記されており要件確定済み。design.md に設計決定の根拠が追跡可能な形で記録されていることを確認する。（記録の充足性判断は機械検証不可）

<!-- verify: human -->
- [x] Principle V (強制ステップと拡張ステップの分離): 変更は SKILL.md の拡張ステップ追加のみであり、`workflow.yaml` の強制ステップ定義および `removable` フラグは変更されていない。SKILL.md への追加が強制ステップの定義に間接的に影響しないことを確認する。（強制/拡張の意味的境界判断は機械検証不可）

<!-- verify: human -->
- [x] Principle VI (Security by Default): Delta Spec に `## Security Capabilities` セクションが存在し、権限境界（ローカルファイル書き込みのみ）とロールバック手段（git で元に戻せる）が記載されていることを確認済み。

## Regression Risk Summary

**総合リスク: MEDIUM-LOW**

根拠:
- SKILL.md への additive 追加のみであり、CLI archive ロジック（決定論的マージ）は一切変更されていない（Principle II 維持）
- step 3d は step 3c の後に追加されるシーケンシャルステップであり、既存の Lessons/NextAction フロー（FR-001/FR-002）への干渉リスクは設計上低い

リスクポイント:
- **MEDIUM**: step 3d が複数 capability のうち一部で Purpose 生成に失敗した場合の部分失敗挙動（ロールバック・スキップいずれになるか）が Delta Spec に明記されていない。マージ済みの spec に対して Purpose が半分だけ書き換えられた状態が生じる可能性がある。
- **MEDIUM**: step 3d はユーザー承認なしで `specs/<cap>/spec.md` を上書きする。FR-003 の制約対象外であるが、ユーザー期待とのギャップが将来的な FR 追加を要する可能性がある。
- **LOW**: FR-001〜FR-004（既存要件）への影響は独立ステップ設計により最小化されている。
