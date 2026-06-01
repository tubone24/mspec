---
doc_type: Tutorial
---

<!-- @mspec-delta 2026-05-18-044538-revise-artifact-taxonomy/specs/artifact-taxonomy/spec.md -->
<!-- Requirements implemented: FR-005 -->
<!-- Change: revise-artifact-taxonomy -->

# fix-mermaid-error-display

> Status: new
> Created: 2026-05-30
> Mode: bugfix

## Request

Web UI で Mermaid 図を表示する際、シンタックスエラー時に「Syntax error in text / mermaid version 11.15.0」という文字列が大きく目立つ形で画面に表示される。
Mermaid の構文チェックを行い、エラーがある場合でも上記のエラーメッセージを大きく表示しないよう抑制・改善してほしい。
具体的には、レンダリング前の構文バリデーションと、エラー表示のコンパクト化（非表示または小さいメッセージへの変更）を実現したい。

## Artifacts

- [ ] proposal.md
- [x] specs/<capability>/spec.md (Delta Spec)
- [x] research.md
- [x] design.md / design-rationale.md / architecture-overview.md
- [ ] quickstart.md
- [x] checklist.md
- [x] tasks.md

## Skipped Steps

<!-- `mspec skip <step-id> --reason "..."` 実行時に追記される -->
<!-- 例: - research: typo 修正のみのため省略 (skipped at 2026-05-14T10:30:00Z) -->

## Summary (Lessons / Next Steps)

### Lessons

- **Mermaid v11 の resolve 挙動の変化が根本原因**: `mermaid.render()` はエラー時に reject せずエラー SVG を resolve するケースがあり、`catch` では捕捉できない。`suppressErrorRendering: true` + `mermaid.parse()` の2層防御が有効。
- **TDD Red→Green が問題の実証に有効**: `page.route` で API レスポンスを差し替えるテスト手法により、実ファイルを用意せずに「エラー SVG がレンダリングされる」状態を再現・証明できた。
- **`useEffect` の非同期クリーンアップ必須**: async な Mermaid API を `useEffect` 内で呼ぶ際、`cancelled` フラグでアンマウント後の state 更新を防止するパターンが重要。
- **Security Capabilities セクションは空欄NG**: セキュリティ中立でも「なぜ中立か」（例: dangerouslySetInnerHTML はライブラリ生成 SVG のみ受け取る）を明示することで Constitution VI の証跡として機能する。
- **`mspec done <step-id>` は produces:[] のステップに必要**: self-review や implement のようにファイルを生成しないステップはファイルの存在による自動完了判定ができず、手動マークが必要。

### Next Steps

- **Mermaid エラーのユーザー向けガイダンス追加**: エラーバッジにツールチップや「構文ガイドへのリンク」を追加してデバッグ体験を向上させる（FR-015 の拡張）
- **`mermaid.parse()` の Mermaid v12+ 互換性確認**: v12 では API シグネチャが変わる可能性があるため、アップグレード時に `MermaidRenderer.tsx` の動作確認が必要
