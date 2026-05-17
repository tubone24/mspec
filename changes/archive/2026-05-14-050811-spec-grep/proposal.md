# Proposal: spec サブコマンドへの grep/list 系 CLI 追加

## Why

mspec ワークフロー中に AI エージェントが `for f in specs/*/spec.md; do grep -E "^### Requirement:" "$f"; done` のようなシェルの grep/for ループで既存 spec を調査するケースが発生している。シェルコマンドへの依存は再現性・可搬性の低下を招き、エージェントが OS 環境差異や権限の問題に直面するリスクがある。また、同じ情報を取得するための標準手段が存在しないため、AI が毎回アドホックなシェル操作を行う。

既存の `spec` サブコマンド（`spec lint`）に Requirements 一覧・FR-ID 検索・capability 一覧の 3 コマンドを追加し、シェルスクリプト依存をゼロにする。

## Goals

- `mspec spec list-requirements [glob]` — `specs/*/spec.md` の `### Requirement:` 見出しを capability ごとにまとめて出力する
- `mspec spec grep <fr-id>` — FR-NNN 形式の ID で Delta Spec と SoT spec を横断して該当 FR ブロックを返す
- `mspec spec list-capabilities` — `specs/` 配下の capability 名（ディレクトリ名）を一覧表示する
- 上記 3 コマンドすべてに `--json` フラグを追加し、AI エージェントが機械判読できる形で出力する
- AI エージェントが mspec ワークフロー中にシェルの grep コマンドを使わなくなる

## Non-Goals

- フリーワードによる全文 grep 検索（`mspec spec grep <keyword>` の keyword が FR-ID でない場合）
- ファジー検索（チルダイスタンス・類似度マッチ）
- `changes/` 配下（research.md・tasks.md 等）の成果物検索

## Capabilities (touched)

- `cli-spec-lint` — **既存 capability の拡張**。`spec lint` コマンドが存在する capability に `list-requirements` / `grep` / `list-capabilities` の 3 サブコマンドを ADDED として追加する。

## Open Questions

- `mspec spec grep <fr-id>` の出力スコープ: `specs/*/spec.md` のみか、`changes/*/specs/*/spec.md`（Delta Spec）も含めるか。→ research 段階でユースケースを確認する。
- `list-requirements` の出力フォーマット: capability ヘッダ付きのセクション形式か、フラットなテーブルか。→ design で確定。

## Constitution Check

> Step: proposal | Constitution Version: 1.0.0

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | — | 既存 `spec` サブコマンド群との独立性を維持。新コマンドは参照専用で副作用なし。 |
| II. 決定論的マージ | ✅ | — | archive 時に `cli-spec-lint` spec.md へ FR-ADDED を追記するのみ。LLM 非介在。 |
| III. 質問駆動の要件確定 | ✅ | — | AskUserQuestion で対象操作・出力形式・Non-Goal を確定済み。 |
| IV. 双方向アンカー | ✅ | — | 実装ファイルと E2E に `@mspec-delta` アンカーを付与する。 |
| V. 強制ステップと拡張ステップの分離 | ✅ | — | ワークフロー構造は変更しない。`removable: false` 維持。 |

### Complexity Tracking

None — 違反 0 件。参照専用コマンドの追加であり、既存ステップ・spec 構造に破壊的変更を加えない。
