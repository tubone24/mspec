---
doc_type: Explanation
---

# multi-test-runner-support

## Why

mspec の `mspec test` コマンドは現在 `.mspec/config.yaml` の `test.command` という単一フィールドしかサポートしておらず、バックエンド（pytest 等）とフロントエンド（Playwright / Vitest 等）のように複数のテストランナーを持つプロジェクトでは TDD の red→green サイクルを適切に裏付けられない。すべてのランナーが green になって初めてタスク完了とみなす仕組みを導入することで、複合プロジェクトでも mspec の証跡機構が機能するようにする。

## Goals

- `.mspec/config.yaml` の `test` セクションに複数ランナーを宣言できる `runners:` 配列を追加する
- 各ランナーは `name`・`command`・`expect_red_on_exit`・`expect_green_on_exit` を個別に持ち、それぞれで証跡を保存する
- `mspec test --expect-red <task-id>` / `--expect-green <task-id>` が全ランナーを**順番に**実行し、すべて成功した場合のみ証跡を記録する
- 既存の単一 `test.command` フォーマットは後方互換として維持する（`runners` 未指定時は現在の挙動にフォールバック）
- 失敗したランナー名をエラー出力に含め、デバッグ容易性を確保する

## Non-Goals

- ランナーの**並列実行**（今回のスコープ外）
- CI/CD パイプライン（GitHub Actions 等）の設定ファイル自動生成
- テストランナーの自動検出（FR-007 の方針を踏襲し、未設定時は対話プロンプトを維持）

## Capabilities (touched)

- `cli-test-tdd`

## Configuration Schema (proposed)

```yaml
# .mspec/config.yaml — 拡張後のイメージ
test:
  # --- 後方互換: runners 未指定時はこちらを使用 ---
  command: "npm test"
  expect_red_on_exit: [1, 2]
  expect_green_on_exit: [0]

  # --- 新規: 複数ランナー宣言 ---
  runners:
    - name: backend
      command: "pytest -x"
      expect_red_on_exit: [1, 2]
      expect_green_on_exit: [0]
    - name: frontend
      command: "pnpm exec playwright test"
      expect_red_on_exit: [1, 2]
      expect_green_on_exit: [0]
      results_src: "test-results/results.json"
```

## Open Questions

- `results_src` は各ランナーごとに個別に持たせる設計か、`test` セクション直下の共通フィールドとして残すか？（runners 導入後は各ランナー固有が自然）
- `mspec init` 実行時に対話で複数ランナーを設定できるようにするか、それとも手動編集のみとするか？（後続の design ステップで決定）

## Decisions

| 質問ID | 質問 | 回答 |
|--------|------|------|
| PRP-SEC-001 | 触れる権限境界 | なし |
| PRP-SEC-002 | アクセス範囲増加 | 増加なし |
| PRP-SEC-003 | エージェントへの新規権限付与 | なし |
| PRP-SEC-004 | ロールバック手段 | git revert |

## Constitution Check

| Principle | Phase 0 | Phase 1 |
|-----------|---------|---------|
| I ステップ独立性 | ✅ `cli-test-tdd` のみを拡張。他 capability への副作用なし | — |
| II 決定論的マージ | ✅ `runners` 配列は既存 FR への**追記**で衝突しない | — |
| III 質問駆動の要件確定 | ✅ 5問＋セキュリティ4問でスコープ・Non-Goal・完了基準を確定 | — |
| IV 双方向アンカー | ✅ `cli-test-tdd` を capability として明示 | — |
| V 強制/拡張ステップ分離 | ✅ 強制ステップ（implement）への影響は config スキーマ拡張のみ | — |
| VI Security by Default | ✅ ファイルシステム外へのアクセスなし・ロールバック手段あり | — |
