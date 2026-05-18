---
doc_type: Reference
---

<!-- See also: ./design-rationale.md for採用理由・代替案 -->

# Design: cli-upgrade

## Summary

`packages/cli/src/commands/upgrade.ts` を新規作成し、`packages/cli/src/index.ts` にトップレベルの `mspec upgrade` サブコマンドとして登録する。
コマンドは npm registry から最新安定バージョンを取得し、現在バージョンと比較した後、ユーザーの確認を経て `npm install -g @mspec/cli@latest` を実行する。

## Technical Context

| 項目 | 値 |
|------|----|
| 言語 | TypeScript (ESM, `type: module`) |
| CLI フレームワーク | Commander.js `^12.1.0` |
| Node.js 要件 | `>=18.0.0` |
| パッケージ名 | `@mspec/cli` |
| エントリポイント | `packages/cli/src/index.ts` |
| コマンドディレクトリ | `packages/cli/src/commands/` |

## Project Structure

### 新規ファイル

```
packages/cli/src/commands/upgrade.ts
```

### 変更ファイル

```
packages/cli/src/index.ts   ← upgradeCommand の import と program.command('upgrade') 登録を追加
```

## API / Interface

### `upgrade.ts` のエクスポート

```typescript
export interface UpgradeOptions {
  yes?: boolean;      // -y/--yes: 確認プロンプトをスキップ
  cwd?: string;       // テスト用上書き
}

export async function upgradeCommand(opts: UpgradeOptions): Promise<void>
```

### フロー

```
1. getCurrentVersion()   ← createRequire(import.meta.url) で package.json を読む
2. fetchLatestVersion()  ← fetch('https://registry.npmjs.org/@mspec/cli/latest', { signal: AbortSignal.timeout(10_000) })
3. バージョン比較
   - current === latest → "すでに最新バージョンです" メッセージを表示して正常終了
   - current !== latest → current / latest を表示し確認プロンプト
4. 確認応答 (--yes の場合はスキップ)
   - "y" または "Y" のみ → spawnSync('npm', ['install', '-g', '@mspec/cli@latest'], { stdio: 'inherit' })
   - その他（"" を含む非 TTY の空文字・N・その他）→ キャンセルして正常終了 (exit 0)
```

### エラーハンドリング

| ケース | 出力先 | 終了コード |
|--------|--------|-----------|
| fetch タイムアウト (10 秒) | stderr | 1 |
| fetch 失敗 (ネットワーク断) | stderr | 1 |
| npm install 失敗 (`status !== 0`) | (npm が stdout/stderr に出力済み) | 1 |
| 非 TTY + `--yes` なし | stdout (キャンセル旨) | 0 |

## Decisions

### D-01: コマンド登録位置
`index.ts` に `program.command('upgrade')` としてフラットに登録する。
受け入れ基準: `mspec upgrade` が認識されバージョン確認フローが起動する（cli-upgrade FR-001 Scenario: upgrade コマンドが認識される）。

### D-02: バージョン表示フォーマット
```
現在のバージョン: 0.1.0
最新バージョン:   1.0.0
```
2 行表示で両バージョンを並べる。受け入れ基準: 「現在のバージョン: x.y.z」「最新バージョン: a.b.c」の形式が表示される（cli-upgrade FR-002 Scenario: バージョン情報が表示される）。

### D-03: 確認プロンプト
`ask('アップグレードしますか？ [y/N] ')` を呼び出し、戻り値が `'y'` または `'Y'` の場合のみ実行する。`--yes/-y` フラグが指定された場合は ask() を呼ばずにそのまま実行する。受け入れ基準: 確認同意後に npm install が実行される（cli-upgrade FR-003 Scenario）。

### D-04: already up-to-date の判定
`currentVersion === latestVersion`（文字列等価比較）。メッセージ形式（権威定義）:
```
すでに最新バージョンです (x.y.z)
```
バージョン文字列を括弧付きで表示する。受け入れ基準: 同一バージョン時にアップグレード不実行でメッセージ表示（cli-upgrade FR-004 Scenario）。

### D-05: npm registry エンドポイント
`https://registry.npmjs.org/@mspec/cli/latest` の `version` フィールドを使用。`latest` タグは stable のみを返すため beta/RC を自動除外する。受け入れ基準: fetch 成功で最新 stable バージョン文字列が取得できる（version-check FR-001, FR-003 Scenario）。

### D-06: タイムアウト
`AbortSignal.timeout(10_000)` を fetch の signal に渡す。タイムアウト・ネットワーク断時は catch して stderr にメッセージを出力し `process.exit(1)` する。受け入れ基準: ネットワーク障害時にエラーメッセージが表示され非ゼロ終了（version-check FR-002 Scenario）。

## Constitution Check

| 原則 | Phase 0 (Design) | Phase 1 (Design) |
|------|-----------------|-----------------|
| I ステップ独立性 | OK — design.md は research.md と Delta Spec のみを入力とし、後続ステップへの依存なし | OK — Phase 1: 設計判断は design.md に自己完結しており、tasks.md や実装コードを参照していない |
| II 決定論的マージ | OK — 新規ファイル 1 本・変更ファイル 1 本が明示されており、後続の tasks.md 作成が一意に定まる | OK — Phase 1: Decisions D-01〜D-06 は各 FR Scenario にトレースされており、曖昧さなし |
| III 質問駆動の要件確定 | OK — `--yes` フラグとタイムアウト値はユーザー確認済み（research Open Choices で解決）| OK — Phase 1: 設計フェーズで追加の未解決要件なし |
| IV 双方向アンカー | OK — 各 Decision は Delta Spec の FR 番号と Scenario 名に明示的に対応付けられている | OK — Phase 1: architecture-overview.md のシーケンス図も FR 番号を参照している |
| V 強制ステップと拡張ステップの分離 | OK — テストコード・実装は tasks.md / implement ステップに委ねている | OK — Phase 1: design.md は契約のみ記述し、実装詳細（for ループ、変数名等）は含まない |
| Additional Constraints — 外部ネットワーク依存 | OK — Node.js 組み込み `fetch` を使用し外部 HTTP ライブラリを追加しない。npm registry (`registry.npmjs.org`) への依存は本コマンドの本質的な要件であり許容済み | OK — Phase 1: タイムアウト (10 秒) とエラーハンドリングを明示し、ネットワーク不可時でも CLI が正常終了する経路を設計している |
| Additional Constraints — RFC 2119 キーワード | OK — Delta Spec 全 FR は機能要件に `SHALL` を使用。`MUST` は使用しておらず絶対的制約要件は現時点では存在しない | OK — Phase 1: D-01〜D-06 の受け入れ基準は `SHALL` ベースの FR Scenario と整合 |

### Complexity Tracking

外部ネットワーク依存（npm registry）を新たに導入するが、Node.js 組み込み `fetch` を使用し外部ライブラリを追加しないこと、および 10 秒タイムアウトでエラーハンドリングを明示していることから、複雑性は許容範囲内と判断する。

## Self-Review

> Reviewed at: 2026-05-19

### Findings

| # | Area | Finding | Severity | Action |
|---|------|---------|----------|--------|
| 1 | design.md — Flow step 4 vs エラー表の非 TTY 挙動矛盾 | ISSUE → **修正済み** — Flow step 4 の `"" (非 TTY)` を進行条件から除外し、`"y"/"Y"` のみが進むよう修正。エラー表の「非 TTY + --yes なし → キャンセル exit 0」と整合。FR-003 の明示的同意要件とも一致 | HIGH | 修正済み |
| 2 | design.md — Constitution Check に Additional Constraints 行が欠落 | ISSUE → **修正済み** — 外部ネットワーク依存と RFC 2119 キーワードセマンティクスの 2 行を追加。Complexity Tracking も更新 | HIGH | 修正済み |
| 3 | architecture-overview.md vs quickstart.md — already-up-to-date メッセージ形式の揺れ | WARNING → **修正済み** — D-04 に権威フォーマット `すでに最新バージョンです (x.y.z)` を明記。quickstart.md も同形式に統一 | MED | 修正済み |
| 4 | quickstart.md — Troubleshooting に npm install 失敗と非 TTY キャンセルが欠落 | WARNING → **修正済み** — npm install 失敗パスと非 TTY キャンセルの説明を Troubleshooting セクションに追記 | MED | 修正済み |
| 5 | checklist.md — `latest` タグリスクに具体的な対処手順なし | WARNING → **修正済み** — 404/空レスポンス時のエラーハンドリング確認と `npm dist-tag add` による事前対処手順を明記 | MED | 修正済み |
| 6 | 全 7 FR のカバレッジとトレーサビリティ | OK — cli-upgrade FR-001〜FR-004、version-check FR-001〜FR-003 すべてにチェックリスト項目と設計決定（D-01〜D-06）が対応付けられている | LOW | none |
| 7 | バージョン表示フォーマットの一貫性 | OK — design.md D-02、architecture-overview.md、quickstart.md の 2 行表示形式が統一されている | LOW | none |
| 8 | Non-Goals の遵守 | OK — Homebrew・ダウングレード・beta チャンネルを記述する成果物なし | LOW | none |
| 9 | upgrade.ts への `@mspec-delta` アンカーが checklist.md に明記されている | OK — checklist.md に正形式 3 行アンカーの要件が具体的に記載済み | LOW | none |
| 10 | Mermaid System Diagram の存在 | OK — architecture-overview.md に System Context 図 + 4 シーケンス図 + ER 図 | LOW | none |

### Summary

自己レビュー時点で HIGH 2 件・MED 3 件の問題を検出し、すべて同セッション内で修正済み。最も重要な修正は「非 TTY 環境での挙動」の内部矛盾解消（明示的 `y`/`Y` のみ進行、それ以外はキャンセル）と Constitution Check への Additional Constraints 行追加。全 7 FR のトレーサビリティ、Mermaid 図、Non-Goals 遵守は問題なし。`latest` タグの beta 公開問題はリリースチェックリストで対処する運用上の注意点として記録済み。
