---
doc_type: Explanation
---

<!-- See also: ./design.md -->

# Design Rationale: rename-visual-mock-to-prototype

## Context

mspec の Visual Mock ステップは、AI がプロポーザルを元に HTML/CSS/JS のインタラクティブな UI を生成し、ローカルサーバーで確認・フィードバックを収集する機能である。しかし「mock」という用語は UX の文脈では「静止画・見た目のみ」を意味することが多く、実際にインタラクションを持つ HTML を生成する本機能と意味的に乖離している（UX Stack Exchange の定義では mock = 静止画、prototype = インタラクション付き）。

また、`mspec-visual-mock-runner` サブエージェントは `.claude/skills/` 以下に配置されていたが、Claude Code のエージェント機能は `.claude/agents/` を参照する。`mspec init` を実行してもこのサブエージェントがインストールされず、Visual Prototype ステップが正常に動作しない問題が発生していた。

## Decisions

### step id を `visual-mock` のまま据え置く理由

mspec の state-engine は `readme.md` の `> Status:` フィールドと `changes/<change>/specs/*/spec.md` のファイル存在有無で状態を判定する。step id はこの内部識別子として `done-log.json` や `skip-log.json` にも使われるため、変更すると既存プロジェクトで進行中の change がすべて状態不整合になる。

外向き API（ユーザーが目にするコマンド名 `/mspec:prototype`・スキル名 `mspec-visual-prototype`）のみを変更し、内部識別子は据え置くことで、既存ユーザーへの影響を最小化しながら命名を修正できる。`mapSubagentName()` に `case 'visual-mock': return 'mspec-visual-prototype-runner'` を追加することで、内外の名前の差異を一点で吸収する。

### `mspec-visual-mock-runner` を agents に昇格する理由

Claude Code は `.claude/agents/*.md` 配置のファイルをサブエージェント定義として認識する。skills と agents では呼び出しメカニズムが異なり、`mspec prototype` コマンドが `continue.ts` 経由でサブエージェントを呼び出す際には agents 配置が正しい。`init.ts` の 228–238 行がすでに `templates/claude/agents/` を `.claude/agents/` にコピーする仕組みを持つため、`mspec-visual-prototype-runner.md` をそのディレクトリに追加するだけで自動インストールが実現できる。追加のコード実装は不要。

### `mock-server.ts` を `prototype-server.ts` にリネームする理由

`prototype.ts`（旧 `mock.ts`）が `import { startMockServer } from '../lib/mock-server.js'` というインポートを持つ。ファイル名と関数名を揃えることで、新しい開発者がコードを読む際の認知負荷を減らし、一貫した命名規則を保つ。内部実装（HTTP サーバー・MIME タイプ処理）は変更しない。

### 旧コマンド `mspec mock` を削除する理由

本機能は beta 段階のため既存ユーザーが少なく、deprecated エイリアスを維持するコストが実益を上回る。エイリアスを残すと `help` 出力に重複エントリが出たり、テストケースが倍増するなどの副作用がある。破壊的変更を今のうちに行い、安定版でクリーンな API を提供する方が長期的に望ましい。

## Alternatives Considered

- **step id も `visual-prototype` に変更する**：外向き API と内部識別子の一貫性が高まるが、既存 change の状態ログが壊れる。断念。
- **`mspec mock` を deprecated エイリアスとして残す**：既存ユーザーへの影響を最小化できるが、beta 段階のため実益が少なくコードが複雑化する。ユーザー確認の上で削除を選択。
- **`mock-server.ts` の関数名・ファイル名を変えない**：影響範囲が小さいため変えない選択肢もあったが、ユーザーが一貫性を重視したため変更。

## Trade-offs

- **後方互換の破壊**：`mspec mock` コマンドは beta 段階のため影響は最小限と判断した。
- **内部・外部名の非対称性**：step id `visual-mock` と外部コマンド `prototype` が一致しない。`mapSubagentName()` への case 追加で吸収するが、将来の開発者には説明が必要。

## Rejected Options

- **`visual-mock` capability を `visual-prototype` にリネーム**：SoT spec のマージで archive コマンドが capability 名をキーとして使うため、リネームは大きなリスクを伴う。今回は scope 外。
- **Commander.js のエイリアス機能を使う**：`program.command('prototype').alias('mock')` で旧コマンドを維持できるが、設計をシンプルに保つため却下。

## Constitution Check

| Principle | Phase 0 | Phase 1 |
|-----------|---------|---------|
| I  ステップ独立性 | ✅ design-rationale は research.md を参照するのみ | ✅ `changes/` 以下にのみ配置 |
| II  決定論的マージ | ✅ SoT spec と衝突なし | ✅ — |
| III  質問駆動の要件確定 | ✅ ユーザーへの確認済み（エイリアス・関数名） | ✅ — |
| IV  双方向アンカー | ✅ Delta Spec アンカー存在 | ✅ — |
| V  強制ステップと拡張ステップの分離 | ✅ 任意ステップの変更のみ | ✅ — |
