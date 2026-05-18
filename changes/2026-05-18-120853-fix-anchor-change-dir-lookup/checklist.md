# Checklist: fix-anchor-change-dir-lookup

## Delta Spec Coverage

### FR-018 — JS/TS文字列リテラル内のアンカー出現をスキャン対象外にする

- [ ] `anchor.test.ts` がテンプレートリテラル内に `@mspec-delta` を含む状態で `mspec anchor-check` を実行したとき、`change_dir not found` エラーが報告されない <!-- verify: fr-018 -->
- [ ] `archive.test.ts` 先頭の `// @mspec-delta ...` 行コメントアンカーが `mspec anchor-check` で正常に認識され、検証対象として扱われる <!-- verify: fr-018 -->
- [ ] `blankOutStringLiterals` がバッククォートで囲まれた内容を空白化し、その中の `@mspec-delta` が認識されないこと（`text-mask.test.ts` のユニットテストで確認） <!-- verify: fr-018 -->
- [ ] `blankOutStringLiterals` が行コメント内の `@mspec-delta` をマスクしないこと（`text-mask.test.ts` のユニットテストで確認） <!-- verify: fr-018 -->
- [ ] `blankOutStringLiterals` がテンプレートリテラル内の改行を保持すること（`text-mask.test.ts` のユニットテストで確認） <!-- verify: fr-018 -->
- [ ] `blankOutStringLiterals` がエスケープされたバッククォート（`` \` ``）を正しく処理すること（`text-mask.test.ts` のユニットテストで確認） <!-- verify: fr-018 -->
- [ ] `parseAnchors` のマスクチェーン順が `blankOutFences` → `blankOutHtmlComments` → `blankOutStringLiterals` になっていること <!-- verify: fr-018 -->
- [ ] `anchor.test.ts` の先頭に FR-018 を指す `@mspec-delta` アンカーブロックが追記されていること <!-- verify: fr-018 -->

## Source-of-Truth Regression

### cli-anchor

| FR-ID | タイトル | リグレッションリスク | 理由 |
|-------|----------|---------------------|------|
| FR-001 | Three-line `@mspec-delta` anchor block format | Medium | `//` 行コメント内にバッククォートが含まれる場合、そのコメント以降の行がマスクされ、実アンカーのブロック検出が SCAN_LINES_MAX=30 範囲内でサイレントに失敗する可能性がある |
| FR-002 | Strict `change_dir` token format | Low | マスクチェーン追加はフォーマット検証ロジックに影響しない |
| FR-003 | Comment-prefix stripping across languages | Low | コメント接頭辞剥離は `stripCommentPrefix` に委譲されており、マスク処理とは独立 |
| FR-004 | Scan only the first 30 lines of each file | Low | SCAN_LINES_MAX の制御ロジックに変更なし |
| FR-005 | 不完全なアンカーブロックはハードフェイル | Medium | `//`-with-backtick の行が `Requirements implemented:` 行の直前にある場合、当該行がマスクされてブロック形状判定が偽陰性となり、不完全アンカーの警告が発生しない可能性がある |
| FR-006 | `change_dir` existence verification | Low | 存在検証ロジックはマスク処理と独立 |
| FR-007 | Capability Delta Spec existence verification | Low | Delta Spec パス検証ロジックはマスク処理と独立 |
| FR-008 | FR-ID resolution against the Delta Spec | Low | FR-ID 解決ロジックはマスク処理と独立 |
| FR-009 | `Change:` field equals the change-dir feature suffix | Low | フィールド一致検証ロジックはマスク処理と独立 |
| FR-010 | Anchors resolve through archive without rewrite | Low | アーカイブパス解決ロジックはマスク処理と独立 |
| FR-011 | `is_archived` flag in extract / list output | Low | フラグ付与ロジックはマスク処理と独立 |
| FR-012 | `anchor extract --json` LLM-ready schema with spec excerpts | Low | JSON 出力スキーマ生成ロジックはマスク処理と独立 |
| FR-013 | `anchor list` enumerates and `--orphans` filters | Low | リスト/フィルタロジックはマスク処理と独立 |
| FR-014 | Multiple anchor blocks per file | Medium | `//`-with-backtick の行がブロック間に存在すると、2 つ目のブロックの行がマスクされ、複数アンカー検出が失敗する可能性がある |
| FR-015 | アンカースキャナは HTML コメントとフェンス付きコードブロックを無視する | Low | `blankOutStringLiterals` は既存の `blankOutFences` / `blankOutHtmlComments` と同一の契約（改行保持・同一長置換）を持ち、これらの機能を破壊しない |
| FR-016 | アンカースキャナは SoT スペックと Delta Spec ファイルをスキップする | Low | ファイルフィルタリングロジックはマスク処理と独立 |
| FR-017 | ブロック形状でない単発言及は沈黙する | Medium | `//`-with-backtick の直後の行がマスクされ、ブロック形状の `Requirements implemented:` 判定がサイレントに失敗して単発言及と誤判定される可能性がある |

## Constitution

- [ ] Phase 1 Constitution Check が design.md に記載されている <!-- verify: human -->
- [ ] Phase 1 Constitution Check が design-rationale.md に記載されている <!-- verify: human -->
- [ ] Phase 1 Constitution Check が architecture-overview.md に記載されている <!-- verify: human -->
- [ ] FR-018 アンカーが実装ファイルに付与されている（anchor.test.ts） <!-- verify: human -->
