---
doc_type: Explanation
---

<!-- See also: ./design.md -->

# Design Rationale: cli-upgrade

## Context

mspec CLI は npm グローバルインストール（`npm install -g @mspec/cli`）で配布されており、バージョンアップ時にユーザーが手動で同コマンドを再実行する必要があった。特にツールの初期ユーザーはアップグレード方法を知らないことが多く、古いバージョンを使い続けるリスクがあった。

コードベースは TypeScript + ESM (`type: module`) で構築されており、Node.js `>=18.0.0` が必須要件として設定されている。外部依存の追加はプロジェクト全体でできる限り抑制する方針が取られており、既存コードに HTTP クライアントや高機能な子プロセス管理ライブラリは導入されていない。

今回の変更は「全く新規の機能追加」として位置づけられており、既存コマンドのアーキテクチャパターンに従うことで、コードベース全体の一貫性を保つことが最優先となった。

## Decisions

### 組み込み `fetch` を HTTP クライアントとして採用

Node.js 18 で `fetch` がグローバルに追加されており、`engines.node: >=18.0.0` が既に宣言されているため、`node-fetch` や `got` などの外部パッケージを追加せずに npm registry へのアクセスが実現できる。タイムアウトは `AbortSignal.timeout(10_000)` で実装でき、これも Node.js 組み込みの機能である。外部依存を追加しないことは将来のメンテナンスコストを下げる観点でも重要な判断であった。

### `spawnSync` + `stdio: 'inherit'` を npm 実行手段として採用

`init.ts` の `ensureGlobalLink()` 関数が既に `spawnSync('npm', [...], { stdio: 'inherit' })` パターンを実装・実証しており、まったく同じパターンを転用することでリスクを最小化できる。`stdio: 'inherit'` により npm のインストール進捗がリアルタイムで表示されるため、ユーザー体験も向上する。非同期の `spawn()` + Promise ラップ (`test.ts` の `runShell()` パターン) は、ライブ出力に加えてストリーム処理が必要な場合に適しているが、今回は npm コマンドの完了を待つだけでよいため `spawnSync` のシンプルさを優先した。

### `ask()` + `--yes/-y` フラグを確認プロンプトとして採用

`src/lib/prompt.ts` の `ask()` は既に全コマンドで使われる共通ライブラリであり、非 TTY 環境（CI 等）での空文字返却も実装済みである。`archive.ts` が `--yes/-y` フラグによる確認スキップを実装しており、同一パターンを採用することで「mspec のコマンドはすべて `-y` でスキップできる」という一貫した UX を提供できる。`inquirer` などのインタラクティブ UI ライブラリは機能過剰であり、今回の単純な y/N 確認には不要と判断した。

## Alternatives Considered

- **`npm view @mspec/cli version` コマンドの利用**: `spawnSync('npm', ['view', '@mspec/cli', 'version'])` で最新バージョンを取得する方法。npm がインストールされている環境では確実に動作するが、コマンド実行のオーバーヘッドがあり、npm の出力形式に依存するため、直接 registry API を叩く方法より脆弱。
- **`latest-version` npm パッケージの利用**: sindresorhus 製の軽量パッケージ。内部実装が `fetch` + JSON parse と同等であり、外部依存を追加するメリットがないため却下。
- **`semver` パッケージによるバージョン比較**: フル機能の semver 実装。今回の判定は「同一か否か」のみであり、文字列等価比較で十分。`0.1.0 < 1.0.0` のような順序比較はアップグレード判定では不要（最新かどうかを確認するだけ）。
- **`execa` / `cross-spawn` の利用**: Promise 対応・クロスプラットフォーム対応の子プロセスライブラリ。Windows 対応が必要な場合は有力候補だが、現プロジェクトの対応プラットフォームは macOS/Linux であり、`spawnSync` で十分。

## Trade-offs

- **文字列等価比較の制限**: 現在バージョンが最新バージョンより新しい（例: ローカル dev ビルドが `1.0.1-dev` で registry 最新が `1.0.0`）場合、「すでに最新バージョン」と表示されず「アップグレード可能」として扱われる可能性がある。ただし通常のユーザー環境では dev ビルドを使うケースは稀であり、この副作用は許容できると判断した。
- **`spawnSync` のブロッキング性**: npm install 中は Node.js イベントループがブロックされる。CLI ツールとしてはこれが自然な動作（他の処理を並行して行う必要がない）であり問題なし。
- **非 TTY + `--yes` なし時の動作**: `ask()` が空文字を返すため、確認なしにキャンセル扱いとなる。CI 環境で意図せずアップグレードがスキップされる可能性があるが、CI での自動アップグレードは Non-Goals に含まれており、`--yes` フラグを明示的に指定させる設計は意図的である。

## Rejected Options

- **Homebrew 対応**: Non-Goals として明示的に除外。Homebrew の formula 更新は別の管理フロー（Homebrew 本体のリポジトリへの PR）が必要であり、`mspec upgrade` コマンドの範囲外。
- **特定バージョンへのダウングレード (`--version` フラグ)**: Non-Goals。バージョン管理の複雑性を避けるため、常に最新 stable バージョンへのアップグレードのみを対象とする。
- **自動アップデート（起動時チェック）**: Non-Goals。ユーザーの意図しない動作を防ぐため、明示的な `mspec upgrade` コマンドでのみアップグレードを実行する。

## Constitution Check

| 原則 | Phase 0 (Design Rationale) | Phase 1 (Design Rationale) |
|------|---------------------------|---------------------------|
| I ステップ独立性 | OK — design-rationale.md は research.md・proposal.md・design.md のみを参照し、後続ステップへの依存なし | OK — Phase 1: 採用理由の記述は実装を参照しておらず、設計フェーズで自己完結している |
| II 決定論的マージ | OK — 採用案・却下案が明示されており、後続の tasks.md 作成で迷いが生じない | OK — Phase 1: 各 Decision は design.md の D-NNN と対応しており、双方向に参照可能 |
| III 質問駆動の要件確定 | OK — `--yes` フラグとタイムアウト値のユーザー確認結果が research.md に記録されており、ここでの判断はそれに基づく | OK — Phase 1: 設計フェーズでの追加未解決事項なし |
| IV 双方向アンカー | OK — design.md の Decision 番号（D-01〜D-06）を参照している | OK — Phase 1: Alternatives / Rejected Options は Delta Spec の Non-Goals と整合している |
| V 強制ステップと拡張ステップの分離 | OK — 実装上の詳細（変数名、ループ処理等）は tasks.md / implement ステップに委ねている | OK — Phase 1: 本ファイルは「なぜか」のみを記述し、「どのように実装するか」は含まない |

### Complexity Tracking

None
