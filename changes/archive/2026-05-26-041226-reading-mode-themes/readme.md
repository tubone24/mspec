---
doc_type: Tutorial
---

<!-- @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md -->
<!-- Requirements implemented: FR-005 -->
<!-- Change: revise-artifact-taxonomy -->

# reading-mode-themes

> Status: archived
> Created: 2026-05-26

## Request

Web UI の表示テーマを Kindle 風に拡張する。現在のライト・ダーク 2 モードに加え、セピア・グリーンを追加し計 4 テーマを提供する。あわせて可読性の高いフォントへの変更と、コードブロックのシンタックスハイライト対応も実施する。

## Artifacts

- [x] proposal.md
- [x] specs/<capability>/spec.md (Delta Spec)
- [x] research.md
- [x] design.md / design-rationale.md / architecture-overview.md
- [ ] design-rationale.md
- [x] quickstart.md
- [x] checklist.md
- [x] tasks.md

## Skipped Steps

<!-- `mspec skip <step-id> --reason "..."` 実行時に追記される -->
<!-- 例: - research: typo 修正のみのため省略 (skipped at 2026-05-14T10:30:00Z) -->

## Summary (Lessons / Next Steps)

### Lessons

- **CSS カスタムプロパティへの全体移行は影響範囲が広い**: `dark:` クラスが 4 ページ + GherkinHighlight に散在しており、self-review サブエージェントが変更ファイル表の漏れを `[blocker]` として指摘した。設計段階で全ファイルを明示的に列挙することが重要。
- **Tailwind `darkMode` の selector 戦略と `.dark` クラスの共存**: `['selector', '[data-theme="dark"]']` 単独では `prose-invert` が機能しないエッジケースがあり、`['selector', '[data-theme="dark"], .dark']` に修正が必要だった。Tailwind のモード設定はシステム全体への影響があるため早期に確定すべき。
- **`mspec done <step>` の存在**: `produces: []` のステップ（self-review 等）は `mspec continue` だけでは完了しない。`mspec done <step-id>` コマンドが必要。ワークフロー初回利用時のつまずきポイント。
- **GherkinHighlight のスコープ拡張**: 当初 spec.md 限定だったが、ユーザーの追加フィードバックにより全 Markdown に適用範囲を拡大。変更コストはゼロで要件を上方修正できた（`isSpec` フラグの削除のみ）。
- **Shiki の `rehypeInlineCodeProperty` が必須**: インラインコード（`backtick`）とフェンスブロックの区別に `rehypeInlineCodeProperty` プラグインが必要。これを使わないとインラインコードにも Shiki が適用されてしまう。

### Next Steps

- **フォント確定（web-ui-themes FR-004）**: Visual Prototype ステップで Literata / Source Serif 4 / Inter / Noto Serif JP を比較し、`index.html` の placeholder を実際の Google Fonts URL に差し替える。
- **Green テーマのカラー確定（web-ui-themes FR-002）**: 暫定値 `#C5E8C5` / `#1A3D1A` を Visual Prototype で Kindle 実機と比較して確定する。
- **Visual Prototype ステップの実施**: フォント・Green カラー・全テーマの実際の見た目を確認する。`/mspec:prototype` で起動。
- **Playwright E2E の実際の実行**: `mspec test expect-red` は mspec CLI の vitest を実行するため、web-ui Playwright テストの実際の Red/Green サイクルは手動実行で確認が必要（`pnpm test:e2e`）。
