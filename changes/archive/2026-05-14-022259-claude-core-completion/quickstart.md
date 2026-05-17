# Quickstart: Claude 向け mspec v0 機能ギャップ充足の動作確認

> 本チェンジで実装する 4 capability (cli-spec-lint / cli-anchor / cli-archive / cli-workflow-engine) の挙動を、`packages/cli` のローカルビルドだけで end-to-end に確認する手順。

## Prerequisites

- Node.js >= 18 (`node -v` で確認、`packages/cli/package.json` の `engines.node` と一致)
- リポジトリのルートで作業すること (`pwd` が `/.../mspec` で終わる)
- `packages/cli/node_modules` がインストール済み (未インストール時は Setup §1 を実行)
- 直近の作業ブランチで `git status` がクリーン、もしくは差分が本チェンジのスコープ内に閉じている

## Setup

```bash
# 1. CLI ローカルビルド
cd packages/cli
npm install            # 初回のみ
npm run build          # dist/index.js を再生成

# 2. リポジトリルートに戻る
cd ../..

# 3. 以降は `node packages/cli/dist/index.js <subcommand>` を `mspec` の代わりに使う
alias mspec="node $(pwd)/packages/cli/dist/index.js"
```

## Try it (Golden Path)

1. **`mspec validate` が本チェンジ自身をパスする**
   ```bash
   mspec validate --change 2026-05-14-022259-claude-core-completion
   mspec validate --change 2026-05-14-022259-claude-core-completion --strict
   ```
   - `architecture-overview.md` が Mermaid フェンスを 1 つ以上含み、Mermaid 強制チェック (FR-017 / cli-workflow-engine) を通る。
2. **`mspec anchor check` の false-positive が 0 件**
   ```bash
   mspec anchor check
   ```
   - 出力に `specs/**/spec.md` 由来や HTML コメント内 `@mspec-delta` 由来の false-positive が含まれないこと (FR-015〜017 / cli-anchor)。
3. **`mspec continue --json` envelope に `constitution_principles[]` が含まれる**
   ```bash
   mspec continue --change 2026-05-14-022259-claude-core-completion --json | \
     node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.stringify(JSON.parse(s).constitution_principles,null,2)))'
   ```
   - 配列に `I. ステップ独立性` 〜 `V. 強制/拡張ステップ分離` の 5 件が抽出されること (FR-015 / cli-workflow-engine)。
4. **`mspec archive --dry-run` がマージサマリを 1 capability 1 行で表示する**
   ```bash
   mspec archive --change 2026-05-14-022259-claude-core-completion --dry-run
   ```
   - 出力末尾に `Summary:` セクションが付き、`+a ~m -r ⇄n` 形式で capability ごとに 1 行 (FR-013 / cli-archive)。
   - `[dry-run preview]` ヘッダで実ファイル変更が起きないこと。
5. **同じ `--dry-run` を再実行してバイト一致を確認する** (決定論性検証)
   ```bash
   mspec archive --change 2026-05-14-022259-claude-core-completion --dry-run > /tmp/mspec-archive-1.txt
   mspec archive --change 2026-05-14-022259-claude-core-completion --dry-run > /tmp/mspec-archive-2.txt
   diff /tmp/mspec-archive-1.txt /tmp/mspec-archive-2.txt
   ```
   - 差分なし (`diff` 終了コード 0) であること (FR-014 / cli-archive)。
6. **`mspec spec lint` が `specs/cli-spec-lint/spec.md` 等の Delta Spec を緑で通す**
   ```bash
   mspec spec lint --change 2026-05-14-022259-claude-core-completion
   ```
   - 4 つの Delta Spec すべて lint エラーなし (FR-001〜010 / cli-spec-lint)。

## Verify

- Expected output:
  - `mspec validate` 系: `OK` 終了、`--strict` でも追加エラーなし。
  - `mspec anchor check`: false-positive 件数が `0` (出力サマリで明示)。
  - `mspec continue --json`: `constitution_principles` 配列長 = 5、各要素が `{ "id": "I" | ... | "V", "name": "<原則名>", "evaluate_in_phase": [...] }` 構造。
  - `mspec archive --dry-run`: `Summary:` ブロック末尾に capability ごとの 1 行サマリ (例: `cli-anchor: +0 ~3 -0 ⇄2`)。
  - `mspec spec lint`: 各 spec で 0 error / 0 warning。
- Expected file changes:
  - Try it 中はリポジトリにファイル変更が発生しないこと (`--dry-run` 経路のみを利用)。
  - 実行後に `git status` がクリーンであること。

## Troubleshooting

| 症状 | 原因 | 対処 |
|------|------|------|
| `node packages/cli/dist/index.js: not found` | `npm run build` 未実行で `dist/` が無い | `cd packages/cli && npm install && npm run build` |
| `mspec anchor check` に `specs/cli-anchor/spec.md` などの false-positive が残る | `anchor-scanner.ts` の除外パスに `specs/**/spec.md` が反映されていない (FR-016 未反映) | 最新ブランチを pull、`dist/` を再ビルド。`packages/cli/src/lib/anchor-scanner.ts` の walker 除外設定を確認 |
| `mspec validate` が `architecture-overview.md must contain at least one mermaid fenced block` で fail | Mermaid フェンスが `architecture-overview.md` に未挿入 (FR-017 / cli-workflow-engine) | 該当ファイルに ` ```mermaid` で始まるブロックを 1 つ以上追加。`design.md §5.6` を参照 |
| `mspec continue --json` の出力に `constitution_principles` キーが無い | `commands/continue.ts` で `constitution_principles.ts` の呼び出しが組まれていない (FR-015 未反映) | 最新ビルドで再実行。それでも欠ける場合は `memory/constitution.md` の H3 (`### I. <Name>`) フォーマットを検査 |
| `mspec archive --dry-run` の再実行で `diff` が差分を出す | サマリ整形が辞書順ソートを通っていない、または非決定論な値 (タイムスタンプ等) が混入 (FR-014 違反) | `archive-summary.ts` の `formatSummary` が `MergeSummary` を `sort()` してから整形しているか確認 |
| `mspec spec lint` が `cli-spec-lint` で FR-001〜010 を落とす | E2E が `spec-lint-formalize.e2e.test.ts` で正式化されていない / Delta Spec 側の FR-ID 欠番 | tasks.md 該当タスクが完了済みか、`specs/cli-spec-lint/spec.md` の FR-ID 連番に欠落が無いかを確認 |
