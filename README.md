<!-- @mspec-delta 2026-05-15-063805-fix-command-name-consistency/specs/cli-core/spec.md -->
<!-- Requirements implemented: FR-002 -->
<!-- Change: fix-command-name-consistency -->

# むぎぼースペック (mspec)

> **LLM の自律生成 × CLI の決定論的検証 をパイプライン化する、Claude Code 向け仕様駆動開発フレームワーク。**
>
> 「AI が書いた仕様とコードが、いつの間にか食い違っている」をゼロにする。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![Node](https://img.shields.io/badge/node-%E2%89%A518.0.0-brightgreen)
![Status](https://img.shields.io/badge/status-v0.1-blue)

---

## なぜ mspec なのか

LLM を使った仕様駆動開発 (Spec-Driven Development) は強力だけど、運用していると必ず以下に直面する。

- **仕様ドリフト** — 実装を急ぐうちに仕様書がコードと乖離していき、いつしか「正」がどちらか分からなくなる
- **仕様への実装漏れの混入** — LLM が生成した仕様書に「Bash で `xxx` を実行」「`pnpm` を使う」などの実装詳細が紛れ込み、Source-of-Truth として機能しなくなる
- **トレーサビリティの喪失** — 「この関数はどの要件を実装しているのか？」が誰にも分からなくなる
- **LLM 任せのレビュー** — 検証まで LLM に任せると、生成と評価のループが閉じてしまい品質保証が幻想化する

mspec はこの 4 つを、**アンカー (`@mspec-delta`) で仕様⇄コードを双方向リンク**し、**CLI による決定論的検証**で品質ゲートを通し、**`AskUserQuestion` の強制**で要件を 1 問 1 答で確定させることで解決する。

---

## 他フレームワークとの違い

| 観点 | **mspec** | OpenSpec | Spec Kit (GitHub) | Superpowers | Kiro (Amazon) |
|------|-----------|----------|-------------------|-------------|---------------|
| アンカー (仕様⇄コード双方向) | ✅ `@mspec-delta` 3 行ブロック + `mspec anchor check` | ❌ | ❌ tasks 内の片方向参照のみ | ❌ | ❌ |
| CLI 決定論的検証 | ✅ `validate` / `spec lint` / `anchor check` / `test --expect-red/green` | △ archive のみ決定論 | △ ほぼ LLM 評価 | ❌ | ❌ |
| AskUserQuestion 強制 (1 問 1 答) | ✅ 全フェーズ強制 + 9 カテゴリ質問バンク | ❌ | △ `clarify` は任意 | △ skill 推奨 | ❌ |
| Constitution Check (二段ゲート) | ✅ Phase 0/1 を step ごとに ON/OFF | ❌ | ✅ | ❌ | △ steering files (検証ゲートではない) |
| TDD red→green 証跡 | ✅ CLI が `.mspec/cache/` に記録 | ❌ | ❌ | △ skill のみ | ❌ |
| Delta マージ | ✅ OpenSpec 互換 ADDED/MODIFIED/REMOVED/RENAMED パーサーマージ | ✅ 同方式 | ❌ | ❌ | ❌ |
| 多言語対応 | ✅ `locale: ja/en` (ISO 639-1) | △ コミュニティ | ❌ | ❌ | ❌ |
| 対象 IDE | Claude Code 専用 | 25+ ツール | 30+ ツール | Claude Code / Cursor / Codex 他 | Kiro IDE 専用 |

**mspec のオリジナリティ** は「アンカー × CLI 決定論検証 × 質問駆動」の **3 点同時装備**。Claude Code 専用に絞ることで、ワークフローを `/mspec:*` スラッシュコマンド + サブエージェントとして深く統合している。

---

## クイックスタート

```bash
# 1. mspec CLI をビルド
git clone <this-repo> ~/tools/mspec
cd ~/tools/mspec/packages/cli
npm install && npm run build

# 2. シェルから mspec として呼べるようにエイリアス（任意）
alias mspec="node ~/tools/mspec/packages/cli/dist/index.js"

# 3. あなたのプロジェクトに init
cd /path/to/your-project
mspec init

# 4. 新しい変更を開始
mspec new add-search-feature

# 5. Claude Code 上でワークフローを進める
#    /mspec:proposal を起動し、あとは /mspec:continue で次へ
```

ワークフローは **手動ゲート (`block: true`)** で要所要所に止まる設計。Claude が暴走して全成果物を一気に書き散らすことはなく、ユーザーが各フェーズの出来を確認してから `/mspec:continue` で進める。

---

## ワークフロー全体像

mspec は 1 つの変更 (change) を **11 ステップ** に分解する。各ステップは独立したコンテキストで実行され、前ステップの成果物を再読込してから着手する。

```
new ─▶ proposal ─▶ delta ─▶ research ─▶ design ─▶ quickstart
                                                       │
        ┌──────────────────────────────────────────────┘
        ▼
   checklist ─▶ self-review ─▶ tasks ─▶ implement ─▶ archive
```

| # | ステップ | スラッシュコマンド | 成果物 | 主な仕事 |
|---|---------|--------------------|--------|----------|
| 1 | new | `/mspec:new` | `changes/<ts>-<feature>/readme.md` | 変更ディレクトリ作成・チェックボックス初期化 |
| 2 | proposal | `/mspec:proposal` | `proposal.md` | 3〜5 問の明確化質問 → Why / Goals / Capabilities / Phase 0 Constitution Check |
| 3 | delta | `/mspec:delta` | `specs/<capability>/spec.md` | FR-NNN 自動採番で Delta Spec 雛形生成 (auto-continue) |
| 4 | research | `/mspec:research` | `research.md` | `mspec-researcher` subagent が Web 検索 + コード分析、trade-off を表形式で提示 |
| 5 | design | `/mspec:design` | `design.md` + `architecture-overview.md` | 技術決定 + Mermaid 図 + Phase 0/1 Constitution Check |
| 6 | quickstart | `/mspec:quickstart` | `quickstart.md` | Golden Path / Verify / Troubleshooting |
| 7 | checklist | `/mspec:checklist` | `checklist.md` | `mspec-checklist-auditor` subagent が Delta カバレッジ + 既存 spec の regression risk を検証 |
| 8 | self-review | `/mspec:review` | `design.md` に追記 | `mspec-self-reviewer` subagent が全成果物を独立監査 |
| 9 | tasks | `/mspec:tasks` | `tasks.md` | アンカーブロック付きタスク。E2E が実装より先 (tests-first) |
| 10 | implement | `/mspec:implement` | コード + テスト | `mspec test --expect-red` → `--expect-green` で TDD 証跡を記録、アンカー強制 |
| 11 | archive | `/mspec:archive` | `changes/archive/<ts>-<feature>/` | Delta を SoT spec に CLI でパーサーマージ・change を退避 |

### サブエージェント（精度と速度の使い分け）

| サブエージェント | 担当ステップ | やること |
|------------------|--------------|----------|
| `mspec-researcher` | research | Web 検索 + codebase grep で代替案と trade-off を表形式で出す |
| `mspec-checklist-auditor` | checklist | SoT spec と Delta を対照し regression risk を含む `<!-- verify: fr-NNN -->` 付き未チェック項目を出力 |
| `mspec-self-reviewer` | self-review | 全成果物を独立コンテキストで再審査、Phase 1 Constitution Check を完了 |

> Tip: `.mspec/config.yaml` の `integrations.claude.subagents: false` でサブエージェント呼び出しを無効化できる。

---

## 主要 CLI コマンド

| コマンド | 役割 |
|----------|------|
| `mspec init` | `.mspec/`, `memory/`, `.claude/` を一括配置 (`--no-subagents` でサブエージェント除外) |
| `mspec new <feature>` | `changes/<YYYY-MM-DD-HHMMSS>-<feature>/` + `readme.md` を生成 |
| `mspec status [--json]` | 全成果物の `done\|ready\|blocked\|skipped\|invalid` を返す |
| `mspec validate [--strict]` | Markdown 構文 + アンカー + Constitution Check 節 + EARS Scenario を検査 |
| `mspec spec lint [<glob>] [--json] [--allow <ruleId>]` | SoT spec への実装詳細（shell コマンド / ライブラリ名 / コード動詞）混入を regex で検出 |
| `mspec continue [--json]` | 次に LLM が実行すべき完全プロンプトを JSON で返す |
| `mspec delta init --capability <name>` | 既存 spec を読んで次の FR-NNN を自動採番した Delta 雛形を生成 |
| `mspec archive <change>` | Delta を本 spec にパーサーマージし `changes/archive/` へ移動 |
| `mspec anchor check\|extract\|list` | アンカー整合性検証 / 抽出 (LLM-ready JSON) / 一覧表示 |
| `mspec test --expect-red\|--expect-green <task>` | TDD red→green の証跡を `.mspec/cache/` に記録 |
| `mspec skip <step> --reason "..."` | typo / docs 等の軽微変更で step を省略 |
| `mspec questions --phase <step>` | 9 カテゴリ質問バンクを返す |
| `mspec constitution init\|show` | 憲法ファイル生成 / 参照 |
| `mspec schema show\|validate` | `workflow.yaml` を表示 / 検証 |
| `mspec done <step>` | step 完了を `.mspec/cache/` に記録 |

> `mspec status --json` と `mspec continue --json` を組み合わせれば、外部スクリプトからワークフロー進行を自動制御できる。

---

## ディレクトリ構造

```
your-project/
├── .mspec/
│   ├── config.yaml              # locale, test.command, project meta, integrations
│   ├── workflow.yaml            # ステップ定義 + block/skippable/enforce_* フラグ
│   ├── questions/<step>.yaml    # プロジェクト固有質問 (任意・既定の 9 カテゴリを上書き)
│   └── cache/                   # red/green-evidence, skip-log, done-log (.gitignore 対象)
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
├── memory/constitution.md       # プロジェクト原則 (5 原則)
└── .claude/
    ├── commands/mspec/*.md      # /mspec:* スラッシュコマンド (11 個)
    ├── skills/mspec-*/SKILL.md  # ステップ実行スキル (11 個)
    └── agents/mspec-*.md        # サブエージェント (3 個)
```

---

## 設定ファイル詳細

### `.mspec/config.yaml`

```yaml
version: 1

# 成果物テンプレートと質問バンクの言語 (ISO 639-1)
# ja / en が標準同梱。他言語は templates/artifacts/*.<code>.md と
# templates/questions/*.<code>.yaml を配置すれば自動認識される。
locale: ja

# テスト実行コマンド (mspec test --expect-red/green が呼ぶ)
test:
  command: "vitest run"
  expect_red_on_exit: [1, 2]   # 失敗とみなす exit code
  expect_green_on_exit: [0]    # 成功とみなす exit code

# プロジェクトメタ
project:
  default_capability: ""        # mspec new で省略時に使う capability 名
  language: "typescript"

# 統合設定
integrations:
  claude:
    enabled: true               # /mspec:* スラッシュコマンドを使うか
    subagents: true             # mspec-researcher 等のサブエージェントを使うか
```

> **重要**: `locale` は **トップレベル**で指定する。`project.locale` ではない。

### `.mspec/workflow.yaml`

各ステップは以下のフラグでカスタマイズできる。

| フラグ | 意味 |
|--------|------|
| `block: true` | このステップ完了後、ユーザーが `/mspec:continue` を実行するまで停止 |
| `block: false` | 自動的に次ステップへ進む (auto-continue) |
| `skippable: true` | `mspec skip <step>` でスキップ可能 |
| `removable: true` | 成果物を削除して前段階に戻れる |
| `subagent: true` | Task tool 経由でサブエージェントが実行 |
| `constitution_check: true` | このステップで Constitution Check 表を記入 / 検証 |
| `enforce_fr_ids: true` | Delta Spec の FR-ID 一意性と H4 Scenario 構造を強制 |
| `enforce_anchor: true` | 実装後、全タスクにアンカーブロックが付いているか検証 |
| `enforce_tdd: true` | E2E → 実装の順序 (tests-first) を強制 |
| `enforce_e2e: true` | 全 Scenario に対応する E2E タスクが存在するか検証 |
| `ask_questions: true` | `AskUserQuestion` によるユーザー入力を許可 |

**実行モード** で軽微変更を効率化:

```yaml
modes:
  typo:    { skip: [proposal, quickstart] }
  minor:   { skip: [proposal, quickstart] }
  bugfix:  { skip: [proposal, quickstart], force: [research] }
```

---

## アンカー仕様

実装ファイル / E2E テストに 3 行ブロックを埋め込み、コード ⇄ 仕様の追跡を担保する。

```ts
/**
 * @mspec-delta 2026-05-14-093015-add-search/specs/search-engine/spec.md
 * Requirements implemented: FR-005, FR-007
 * Change: add-search
 */
export function searchDocs() { /* ... */ }
```

検証ルール:

- パス形式: `YYYY-MM-DD-HHMMSS-<feature>/specs/<capability>/spec.md`
- ファイル先頭 30 行内に配置
- 次行は `Requirements implemented:` で開始
- FR-ID はカンマ区切り

CLI による検証:

- `mspec anchor check` — アンカーが実在する Delta Spec / FR-ID を指しているか
- `mspec anchor extract <change> --json` — LLM へ「コードが実装している仕様」をそのまま投入できる形で抽出
- `mspec anchor list [--orphans]` — 全アンカー / 孤立アンカー一覧

---

## Constitution（プロジェクト原則）

`memory/constitution.md` に 5 原則が定義され、各ステップで二段ゲート (Phase 0 / Phase 1) で評価される。

1. **ステップ独立性** — 各ステップはコンテキスト独立。再開時は必ず前ステップ成果物を再読込
2. **決定論的マージ** — Delta → SoT のマージは LLM 不使用、CLI パーサーで実施。同一入力でバイト単位一致
3. **質問駆動の要件確定** — Markdown 手書きさせず、AI が `AskUserQuestion` で 1 問 1 答
4. **双方向アンカー** — 実装 / E2E に `@mspec-delta` を必須、CLI が双方向検証
5. **強制ステップと拡張ステップの分離** — Spec / Delta Spec / Archive は削除不可、他は自由

`mspec constitution init` で雛形生成、`mspec constitution show` で参照。

---

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

---

## どんなプロジェクトに向いているか

### 向いている

- 複数 capability を分割管理する **中〜大規模 CLI / SDK / バックエンド**
- 仕様の **履歴管理・変分追跡** が重要（プラットフォーム / フレームワーク開発など）
- LLM 生成コードの **品質保証ゲート** を機械的に通したい
- チーム横断で **要件共有のドリフト** が懸念事項
- **Claude Code を主力 IDE** として運用しているチーム

### 向いていない

- 単一ファイルで完結する小規模スクリプト・PoC
- Markdown + CLI 作業を嫌う / テスト整備に投資できない短命プロジェクト
- Claude Code 以外を主力にしているチーム（v0.1 時点では Claude Code 専用）

---

## 開発

```bash
cd packages/cli
npm install
npm test            # vitest (37 ファイル, unit + e2e)
npm run build       # tsup → dist/index.js
npm run typecheck   # tsc --noEmit
```

**動作要件**: Node.js >= 18.0.0 / TypeScript 5.6+ (ES2022)

**主要依存**: commander, zod, remark/unified, yaml, gray-matter

詳細な設計判断は [`docs/design/mspec-design.md`](./docs/design/mspec-design.md) を参照。

---

## License

MIT
