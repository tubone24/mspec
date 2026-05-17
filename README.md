<!-- @mspec-delta 2026-05-15-063805-fix-command-name-consistency/specs/cli-core/spec.md -->
<!-- Requirements implemented: FR-002 -->
<!-- Change: fix-command-name-consistency -->

# むぎぼースペック (mspec)

> LLM の自律生成 × CLI の決定論的検証 をパイプライン化する、Claude Code 向け仕様駆動開発フレームワーク。

OpenSpec / Spec Kit / Superpowers の良いところを採り入れつつ、**アンカー (`@mspec-delta`) で仕様とコード/E2E を双方向リンク**するのが mspec のオリジナリティ。

## 特徴

| 観点 | mspec の選択 |
|------|--------------|
| ワークフロー | YAML schema + `block` フラグで止め所を宣言 |
| 要件確定 | 全フェーズで AskUserQuestion を強要 (1 問 1 答 / 9 カテゴリ質問 bank) |
| 成果物 | 8 成果物テンプレ + `architecture-overview.md` (Mermaid 必須) |
| Constitution | Spec Kit 互換 Phase 0/1 二段ゲート、全 step で ON/OFF |
| アンカー | `@mspec-delta` 3 行ブロック (path / FR-IDs / Change) |
| アーカイブ | OpenSpec 互換 ADDED/MODIFIED/REMOVED/RENAMED のパーサーマージ (LLM 不使用) |
| TDD | `mspec test --expect-red/green` で red→green 証跡を CLI が記録 |

詳細は [`docs/design/mspec-design.md`](./docs/design/mspec-design.md) を参照。

## クイックスタート

```bash
# 1. ビルド
cd packages/cli && npm install && npm run build

# 2. プロジェクトに init
cd /path/to/your-project
node /path/to/mspec/packages/cli/dist/index.js init

# 3. 新しいチェンジを開始
mspec new add-search

# 4. Claude Code 上でワークフローを進める
# /mspec:proposal → /mspec:continue → /mspec:delta → ...
```

## CLI コマンド一覧 (v0.1)

| コマンド | 役割 |
|----------|------|
| `mspec init` | プロジェクトに `.mspec/`, `memory/`, `.claude/` を一括配置 |
| `mspec new <feature>` | `changes/<YYYY-MM-DD-HHMMSS>-<feature>/` + `readme.md` を生成 |
| `mspec status [--json]` | 全成果物の `done\|ready\|blocked\|skipped\|invalid` を返す |
| `mspec validate [--strict]` | Markdown 構文 + アンカー + Constitution Check 節を検査 (`--strict` 時は `spec lint` も合成) |
| `mspec spec lint [<glob>] [--json] [--allow <ruleId>]` | SoT spec の実装詳細語彙 (shell コマンド/ライブラリ名/コード動詞) を regex で検出するドリフト防止リンタ |
| `mspec continue [--json]` | 次に AI が実行すべき完全なプロンプト (main / subagent) を JSON で返す |
| `mspec delta init --capability <name>` | 既存 spec を読んで次の FR-NNN を自動採番した Delta 雛形を作成 |
| `mspec archive <change>` | Delta を本 spec にパーサーマージし `changes/archive/` へ移動 |
| `mspec anchor check\|extract\|list` | アンカーの整合性検証・抽出 (LLM-ready JSON)・一覧 |
| `mspec test --expect-red\|--expect-green <task>` | TDD red→green の証跡を `.mspec/cache/` に記録 |
| `mspec skip <step> --reason "..."` | typo/docs などの軽微変更で step を省略 |
| `mspec questions --phase <step>` | 9 カテゴリ質問 bank を返す |
| `mspec constitution init\|show` | 憲法ファイルを生成/参照 |
| `mspec schema show\|validate` | workflow.yaml を表示/検証 |

## ディレクトリ構造

```
your-project/
├── .mspec/
│   ├── config.yaml              # test.command, project meta
│   ├── workflow.yaml            # ステップ定義 + block/skippable/enforce_* フラグ
│   ├── questions/<step>.yaml    # プロジェクト固有の質問 (任意)
│   └── cache/                   # red/green-evidence, skip-log (.gitignore 対象)
├── specs/                       # Source of Truth (capability ごと)
│   └── <capability>/spec.md
├── changes/                     # 進行中のチェンジ
│   └── <YYYY-MM-DD-HHMMSS>-<feature>/
│       ├── readme.md
│       ├── proposal.md
│       ├── specs/<capability>/spec.md   # Delta Spec
│       ├── research.md
│       ├── design.md / architecture-overview.md
│       ├── quickstart.md / checklist.md / tasks.md
│       └── (archived → changes/archive/...)
├── memory/constitution.md       # プロジェクト原則
└── .claude/
    ├── commands/mspec/*.md      # /mspec:* スラッシュコマンド
    ├── skills/mspec-*/SKILL.md  # ステップ実行スキル
    └── agents/mspec-*.md        # サブエージェント定義
```

## アンカー仕様

実装ファイル/テストファイルに 3 行ブロックを埋め込み、コード ⇄ 仕様の追跡を担保する。

```ts
/**
 * @mspec-delta 2026-05-14-093015-add-search/specs/search-engine/spec.md
 * Requirements implemented: FR-005, FR-007
 * Change: add-search
 */
export function searchDocs() { ... }
```

`mspec anchor check` で実在検証、`mspec anchor extract <change> --json` で LLM へ「コードが実装している仕様」をそのままコンテキスト投入できる。

## Locale Configuration

<!-- @mspec-delta 2026-05-16-052329-artifact-language-config/specs/language-config/spec.md -->
<!-- Requirements implemented: FR-001, FR-002, FR-004 -->
<!-- Change: artifact-language-config -->

`.mspec/config.yaml` のトップレベルに `locale` を設定すると、成果物テンプレートと質問バンクをそのロケールで解決する。

```yaml
locale: ja   # ISO 639-1 二文字コード（省略時の既定値は ja）
```

| 設定 | 挙動 |
|------|------|
| `locale: ja` | `templates/artifacts/proposal.ja.md` を使用 |
| `locale: en` | `templates/artifacts/proposal.en.md` を使用 |
| 未設定 | `ja` で動作（既定値） |
| 未対応コード | `mspec validate` が exit 1 + stderr に `unsupported locale: <code>` と `supported: ja, en` を出力 |

### 対応言語の追加

`templates/artifacts/*.zh.md` と `templates/questions/*.zh.yaml` を両方配置するだけで `locale: zh` が自動認識される（`mspec init` 不要）。

### EARS キーワードは英語固定

`SHALL` / `WHEN` / `GIVEN` / `THEN` 等の EARS キーワードと `Requirement:` / `Scenario:` の識別子は国際慣行に従い英語固定。翻訳対象外。

## 開発

```bash
cd packages/cli
npm install
npm test            # vitest (44 tests)
npm run build       # tsup → dist/index.js
npm run typecheck   # tsc --noEmit
```

## License

MIT
