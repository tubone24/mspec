---
doc_type: Explanation
---

<!-- See also: ./design.md -->

# Design Rationale: multi-test-runner-support

## Context

mspec の `mspec test` コマンドは `.mspec/config.yaml` の `test.command` という単一フィールドを前提として設計されており、バックエンドとフロントエンドのように異なるテストランナーを持つプロジェクトでは、片方しか TDD 証跡を記録できなかった。

この変更では「ランナー配列」を設定できる仕組みを導入するが、既存の単一コマンド設定を使っているプロジェクト（mspec 自身の `.mspec/config.yaml` を含む）を壊さないことが最重要制約として機能した。また `enforce.ts` の TDD 証跡チェックロジックへの影響をゼロにすることが、設計選択の多くを規定した。

## Decisions

### resolveRunners() による抽象化

`runTestEvidence` に直接分岐を書かず、`resolveRunners(cfg)` というヘルパーで「使用するランナーの正規化済み配列」を返す設計を採用した理由は、実行ループを単一化するためである。ループは常に `ResolvedRunner[]` を受け取り、single/multi の違いを意識しない。これにより `runTestEvidence` 本体は追加の分岐なしに動作し、テストも容易になる。

### 単一証跡ファイル + payload 拡張

複数ランナーの証跡を「1 ランナー = 1 ファイル」ではなく「1 タスク = 1 ファイル（payload に全ランナー情報）」とした理由は、`enforce.ts:51-71` の `checkEnforceTdd` が `<change>__<task-id>.json` というファイル名パターンを前提としているためである。ランナー名を含む新しいファイル名（例: `<change>__<task-id>__backend.json`）を導入すると enforce.ts の変更が連鎖し、FR-008 の後方互換保証が崩れる。

### fail-fast の採用

最初のランナー失敗で後続を中断する fail-fast を採用した理由は、後続ランナーの実行に意味がない状況が多いためである。特にバックエンドが fail している状態でフロントエンドを実行しても、出力が混在してデバッグが困難になる。並列実行が Non-Goal であることとも一貫している。

## Alternatives Considered

- **per-runner 証跡ファイル**（`<change>__<task-id>__<runner-name>.json`）: enforce.ts の変更が必要になり影響範囲が拡大するため採用しなかった。
- **全ランナーを並列実行**: Non-Goal として明示的に除外。実装コストと出力の混在問題を避けるため。
- **`runners: []` をエラーにする**: `runners` キーの存在と空配列を区別するのは Zod スキーマ上可能だが、ユーザーが誤って空配列を書いた場合の体験を考えると、legacy フォールバックの方が優しい。

## Trade-offs

- **payload の `command` フィールドが文字列 → 文字列配列に変更**: 証跡 JSON を直接パースしている外部スクリプトがあれば壊れる可能性がある。ただし `.mspec/cache/` は `.gitignore` 対象（FR-005）のため外部スクリプトが依存する可能性は低い。
- **resolveRunners の名前 `__default__`**: legacy モードの内部ランナー名として `__default__` を使用しているため、`results_src` のコピー先が `e2e-results/__default__/` にならないよう `copyTestResults` で特別処理が必要。

## Rejected Options

- **`command` フィールドの完全廃止**: 既存ユーザーへの影響が大きいため却下。legacy フォールバック（FR-013）として維持する。
- **`runners` + `command` 共存時のエラー化**: proposal/research のユーザー決定により「runners 優先・command 無視」を採用。エラーにすると既存 config に `command` が残っているプロジェクトが移行時に詰まる。

## Constitution Check

| 原則 | Phase 0 | Phase 1 |
|------|---------|---------|
| I ステップ独立性 | ✅ design-rationale は Explanation ドキュメントのみ | ✅ コード変更なし |
| II 決定論的マージ | ✅ 判断の根拠を全て記録 | ✅ |
| III 質問駆動の要件確定 | ✅ trade-off を全て文書化 | ✅ |
| IV 双方向アンカー | ✅ design.md と相互参照 | ✅ |
| V 強制/拡張ステップ分離 | ✅ Explanation ドキュメントのみ | ✅ |
| VI Security by Default | ✅ | ✅ |

### Complexity Tracking

None
