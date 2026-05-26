---
doc_type: Tutorial
---

<!-- @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md -->
<!-- Requirements implemented: FR-005 -->
<!-- Change: revise-artifact-taxonomy -->

# webui-keyword-badge-style

> Status: new
> Created: 2026-05-26
> Mode: minor

## Request

Web UI のスペック表示において、GIVEN・WHEN・SHALL などのガーキン／EARS キーワードに現在テキスト色の着色のみ行っているが、より目立つようにテキスト背景に色を付けてラベル（バッジ）風のスタイルに変更する。
また、コードハイライトブロックの周囲に表示されている黒枠（border）が太すぎるため、細くして視覚的に軽くする。

## Artifacts

- [ ] proposal.md
- [x] specs/<capability>/spec.md (Delta Spec)
- [x] research.md
- [x] design.md / design-rationale.md / architecture-overview.md
- [x] design-rationale.md
- [ ] quickstart.md
- [x] checklist.md
- [x] tasks.md

## Skipped Steps

<!-- `mspec skip <step-id> --reason "..."` 実行時に追記される -->
<!-- 例: - research: typo 修正のみのため省略 (skipped at 2026-05-14T10:30:00Z) -->

## Summary (Lessons / Next Steps)

### Lessons

- **`color-mix()` はテーマ対応バッジ背景の決定打**：`oklch` ベースの CSS カスタムプロパティと `color-mix(in oklch, var(--k-*) 15%, var(--paper))` を組み合わせることで、4 テーマ全てに対応するバッジ背景色を 1 行で表現できた。テーマ変数を活用した CSS-only アプローチは変数数を増やさずに済む。
- **Self-Review が設計の事実誤認を検出**：`design.md` が「`GherkinHighlight.tsx` も `.k-*` を出力する」と誤記していたことを mspec-self-reviewer が発見。`GherkinHighlight.tsx` は Tailwind クラスを直接使う別経路であり、FR-004 の実際のスコープは `rehypeGherkinEars` のみであることが明確になった。
- **TDD 記録ランナーとテスト環境のミスマッチ**：`.mspec/config.yaml` の test コマンドが CLI vitest 向けで、web-ui の Playwright E2E テストと乖離していた。CSS-only 変更では `expect-red` の自動記録ができないため、expect-green のみで記録した。web-ui 専用の test コマンド設定の検討余地がある。
- **FR-005 の実装は outline → border-color に設計変更**：research.md は outline override を想定したが、実際には `index.html` の `.prose pre` が `border: 1px solid var(--rule)` をすでに持っていた。`border-color: var(--rule-soft)` に変更するだけで "softer" な見た目を実現できた。

### Next Steps

- **`GherkinHighlight.tsx` のバッジ対応**：standalone コンポーネント経由のキーワードは今回未対応。Tailwind クラスへの `bg-*` 追加が別チェンジの候補（関連: FR-004）
- **web-ui 向け mspec test コマンドの設定**：`.mspec/config.yaml` に `test_runners` の切り替え、または web-ui 専用 change の設定サポートを検討（関連: FR-005 TDD 証拠）
- **runtime-template-sync テスト修正**：`mspec-design/SKILL.md` に余分な Verification/Learning セクションが残っておりテストが failing。別チェンジで修正が必要
