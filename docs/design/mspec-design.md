<!-- @mspec-delta 2026-05-15-063805-fix-command-name-consistency/specs/cli-core/spec.md -->
<!-- Requirements implemented: FR-002 -->
<!-- Change: fix-command-name-consistency -->

# むぎぼースペック (mspec) 設計ドキュメント

> Spec-Driven Development フレームワーク `mspec` の初版設計。Claude Code を一次ターゲットとし、将来 Codex / Copilot にも展開する。
>
> 参考: [Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec) / [github/spec-kit](https://github.com/github/spec-kit) / [obra/superpowers](https://github.com/obra/superpowers)

---

## 1. コンセプトと設計原則

### 1.1 ひとことで

**「LLM の自律生成 × CLI の決定論的検証」をパイプライン化し、仕様 (spec) と実装 (code) と検証 (E2E) を双方向リンクで縫い合わせる仕様駆動開発フレームワーク。**

### 1.2 5 つの設計原則

| # | 原則 | 説明 |
|---|---|---|
| P1 | **ステップ独立性** | 各ワークフローステップはコンテキスト独立。再開時は必ず `mspec status` で前ステップ成果物を再読込してから動く。 |
| P2 | **決定論的マージ** | Delta Spec → Source-of-Truth Spec のマージは LLM を使わず CLI のパーサーで実施 (OpenSpec 方式)。 |
| P3 | **質問駆動の要件確定** | Markdown を人に書かせず、AI が AskUserQuestion で 1 問 1 答する (Superpowers 方式)。 |
| P4 | **双方向アンカー** | 実装ファイル / E2E テストに Delta Spec へのアンカーを必ず打ち、CLI で整合性を検証する。 |
| P5 | **強制ステップと拡張ステップの分離** | Spec / Delta Spec / Archive は YAML スキーマから削除不可。それ以外はユーザーが追加・削除・並べ替え可能。 |

### 1.3 参考フレームワークとの位置づけ

| 観点 | OpenSpec | Spec Kit | Superpowers | **mspec の選択** |
|------|----------|----------|-------------|------------------|
| ワークフロー定義 | YAML schema (固定) | スラッシュコマンド単位 | 直列スキル | **YAML schema + `block` フラグで止め所を宣言** |
| 要件確定 | proposal.md 手書き | `/clarify` で 5 問 | 1 問 1 答ハードゲート | **全フェーズで AskUserQuestion を強要** |
| 成果物 | spec / change / design / tasks | spec / plan / tasks / research / quickstart / data-model | design.md 1 本 | **8 成果物 + ArchitectureOverview.md (Mermaid)** |
| Constitution | なし | あり (Phase0/Phase1 二段) | なし | **あり (Spec Kit 方式を踏襲)** |
| アンカー | なし | なし | なし | **`@mspec:` アンカー (mspec 独自)** |
| アーカイブ | パーサーで本specマージ | なし (リネーム運用) | なし | **OpenSpec 方式を完全踏襲** |
| TDD/E2E | tasks.md 内で記述 | tasks-template に Tests-first | TDD スキル別 | **E2E 必須 + アンカーで仕様直結** |

> mspec のオリジナリティは「**YAML ワークフロー × block フラグ**」「**アンカー (`@mspec:`)**」「**ArchitectureOverview の Mermaid 強制**」「**E2E と仕様の双方向リンク**」の 4 点に集約される。

---

## 2. リポジトリ構造

### 2.1 mspec 導入後のターゲットプロジェクトのレイアウト

```
<project-root>/
├── .mspec/
│   ├── config.yaml              # プロジェクト設定 (mspec init で生成、test.command 等)
│   ├── workflow.yaml            # ワークフロー定義 (デフォルトのコピー)
│   ├── questions/<step>.yaml    # 任意: プロジェクト固有の質問テンプレ追加 (Q10)
│   └── cache/                   # status 計算 / red-green-evidence / qa ログ / skip-log (.gitignore 対象, O4)
├── specs/                       # Source of Truth (capability ごと)
│   └── <capability-kebab>/
│       └── spec.md
├── changes/                     # 進行中のチェンジ
│   ├── <YYYY-MM-DD-HHMMSS>-<feature-kebab>/   # 例: 2026-05-14-093015-apply-css
│   │   ├── readme.md            # 入口ドキュメント (成果物リンク)
│   │   ├── proposal.md
│   │   ├── research.md
│   │   ├── design.md
│   │   ├── architecture-overview.md
│   │   ├── quickstart.md
│   │   ├── checklist.md
│   │   ├── tasks.md
│   │   └── specs/<capability>/spec.md   # Delta Spec (OpenSpec 互換、複数 capability 可)
│   └── archive/<YYYY-MM-DD-HHMMSS>-<feature-kebab>/   # archive 後の移動先
├── memory/
│   └── constitution.md          # 憲法ファイル (mspec constitution で生成)
└── .claude/                     # Claude Code 連携 (init --tools claude で配置)
    ├── skills/mspec-*/SKILL.md
    ├── commands/mspec/*.md
    └── agents/mspec-*.md
```

### 2.2 mspec CLI 本体のリポジトリ構造 (この `mspec/` リポジトリ)

```
mspec/
├── packages/
│   └── cli/                     # TypeScript CLI
│       ├── src/
│       │   ├── commands/        # init / status / archive / anchor / ...
│       │   ├── parser/          # markdown / delta-spec / anchor パーサー
│       │   ├── workflow/        # YAML schema / loader / status engine
│       │   ├── integrations/
│       │   │   ├── claude/      # .claude/ 一括配置
│       │   │   ├── codex/       # 後日
│       │   │   └── copilot/     # 後日
│       │   └── templates/       # 8 成果物の MD テンプレート
│       └── package.json
├── templates/
│   ├── workflow.default.yaml
│   ├── constitution.md.hbs
│   └── markdown/*.md.hbs
├── docs/
│   ├── design/mspec-design.md   # この文書
│   ├── concepts.md              # コンセプト解説
│   └── cli.md                   # CLI リファレンス
└── README.md
```

---

## 3. CLI コマンド仕様

### 3.1 コマンド一覧 (v0)

| コマンド | 目的 | 終了コード |
|---|---|---|
| `mspec init [--tools claude\|codex\|copilot] [--no-subagents] [--force]` | プロジェクトに `.mspec/` と `.claude/` を一括投入。`--no-subagents` で `.claude/agents/mspec-*.md` の配置を抑止 | 0/1 |
| `mspec status [--change <name>] [--json]` | 現在のチェンジの全成果物の `done\|ready\|blocked\|skipped\|invalid` を返す | 0 |
| `mspec delta init [--capability <name>] [--change <name>]` | 既存 `specs/<capability>/spec.md` を走査し、次の `FR-NNN` を自動採番した Delta Spec の雛形を `changes/<change-dir>/specs/<capability>/spec.md` に作成 | 0/1 |
| `mspec test --expect-red <task-id> [--change <name>]` | `.mspec/config.yaml` の `test.command` を実行し**失敗を期待**。失敗観測時に `.mspec/cache/red-evidence/<task-id>.json` に証跡保存。成功したら fail (= TDD 違反)。runner 自動推定は**しない** (O2 確定) | 0/1 |
| `mspec test --expect-green <task-id> [--change <name>]` | 同じ `test.command` で今度は **成功**を期待し `.mspec/cache/green-evidence/<task-id>.json` 保存。red→green の遷移を CLI が裏付ける | 0/1 |
| `mspec validate [--all\|--change <name>] [--strict]` | Markdown 構文 + アンカー + Scenario 構造 + Constitution Check 必須節を検査。`--strict` 時は SoT spec の `spec lint` も合成 | 0/1 |
| `mspec spec lint [<glob>] [--json] [--allow <ruleId>]` | SoT spec (`specs/<capability>/spec.md`) から実装詳細語彙 (shell コマンド / ライブラリ名 / コードレベル動詞) を regex で検出するドリフト防止リンタ | 0/1 |
| `mspec archive <change-name> [-y] [--dry-run]` | Delta を本 spec にパーサーマージし `changes/archive/` へ移動 | 0/1 |
| `mspec anchor check [--change <name>]` | コード/E2E のアンカーが実在する Delta Spec を指しているか検証 | 0/1 |
| `mspec anchor extract <change-name> [--json]` | アンカーと該当 Delta Spec の組をまとめて出力 (LLM 入力用) | 0 |
| `mspec anchor list [--orphans]` | 全アンカーを列挙、孤立 (`--orphans`) も検出 | 0 |
| `mspec constitution [init\|edit\|show]` | `memory/constitution.md` を生成/編集 | 0 |
| `mspec schema [show\|validate]` | `.mspec/workflow.yaml` の検証と可視化 | 0/1 |
| `mspec new <feature-kebab>` | `changes/<YYYY-MM-DD-HHMMSS>-<feature>/` と `readme.md` を生成 | 0/1 |
| `mspec continue [--change <name>] [--json]` | **status を取った上で、次に AI エージェントが実行すべきプロンプト (テンプレート展開済) を組み立てて返す**。LLM 側スキルはこの出力をそのまま読んで動く (Q3 確定) | 0 |
| `mspec skip <step-id> [--change <name>] [--reason <text>]` | typo / docs 変更などで明らかに不要なステップをスキップ。`workflow.yaml` で `skippable: true` のステップのみ可能。理由を `readme.md` の `## Skipped Steps` に追記 | 0/1 |
| `mspec questions [--phase <step-id>] [--json]` | そのフェーズで AI が聞くべき質問テンプレ (デフォルト + ユーザー追加) を返す。Q10 のカスタム質問機能の入口 | 0 |

### 3.2 主要コマンドの仕様詳細

#### `mspec init`
- `.mspec/config.yaml`、`.mspec/workflow.yaml` (デフォルト workflow をコピー)、`memory/constitution.md` (空のテンプレ) を作成
- `--tools claude` で `.claude/skills/mspec-*/` と `.claude/commands/mspec/*.md` を一括配置
- `--no-subagents` を付けない限り `.claude/agents/mspec-*.md` も配置 (Q4 確定)
- `.gitignore` に `.mspec/cache/` 行を追記 (既存に無ければ) — O4 確定
- 初期化時に対話で `test.command` を聞く (O2 確定。スキップした場合は config.yaml に空欄で生成、`mspec test` 実行時に再度確認)
- 既存ファイルがあれば `--force` がない限り中断
- 成功時に `next: run /mspec:new <feature>` を出力

##### `.mspec/config.yaml` 構造 (v0.1)

```yaml
version: 1

# テスト実行コマンド (O2 確定: 自動推定せず明示必須)
test:
  command: "npm test --"           # placeholder の %TASK_ID% を CLI が置換可
  expect_red_on_exit: [1, 2]       # 異常終了コード (これらを「red」と判定)
  expect_green_on_exit: [0]        # 0 のみ「green」

# プロジェクト全体メタ
project:
  default_capability: ""           # 未指定時の delta init 対象
  language: "typescript"           # 任意、テンプレ生成のヒント

# 統合設定 (init で配置済みのもの)
integrations:
  claude:
    enabled: true
    subagents: true                # init --no-subagents で false
```

#### `mspec status --change <name> --json`
出力 JSON 例:
```json
{
  "change": "2026-05-14-093015-apply-css",
  "current_step": "design",
  "steps": [
    {"id": "new",      "produces": ["readme.md"],                                     "state": "done"},
    {"id": "proposal", "produces": ["proposal.md"],                                   "state": "done"},
    {"id": "delta",    "produces": ["specs/theme-engine/spec.md"],                    "state": "done"},
    {"id": "research", "produces": ["research.md"],                                   "state": "done"},
    {"id": "design",   "produces": ["design.md","architecture-overview.md"],          "state": "ready"},
    {"id": "tasks",    "produces": ["tasks.md"],                                      "state": "blocked"},
    {"id": "implement","produces": [],                                                "state": "blocked"},
    {"id": "archive",  "produces": [],                                                "state": "blocked"}
  ],
  "blockers": ["design.md is missing", "architecture-overview.md is missing"]
}
```

`state` の判定:
- `done`: 該当 `produces` の全ファイルが存在し、`validate` が通る
- `ready`: 前ステップが `done` (または `skipped`) で、自分のファイルがまだ無い
- `invalid`: ファイルは存在するが `validate` が fail (例: Scenario の見出しレベルが H4 でない / FR-ID 重複 / アンカー不整合)。`mspec continue` はこの state を見たら **`validate_failed` を返して停止** し、勝手に次へ進まない
- `blocked`: 前ステップが `done`/`skipped`/`invalid` のいずれでもない (= まだ着手不可)
- `skipped`: `mspec skip` で明示的に省略された (§3.2 `mspec skip` 参照)

#### `mspec delta init` (O3 反映)

責務: 既存 `specs/<capability>/spec.md` を読んで次の FR-NNN を自動採番した Delta Spec 雛形を作る。

動作:
1. `--capability <name>` で指定された capability の `specs/<name>/spec.md` の存在を確認
2. **既存あり**: 全 Requirement ヘッダから `FR-NNN` を抽出、最大値 + 1 を起点として ADDED セクションに `### Requirement: FR-NNN — <Title placeholder>` の雛形を生成
3. **既存なし**: 新規 capability と判定し、`FR-001` から開始。`specs/<name>/spec.md` 本体も空の "Purpose" / "Requirements" 節付きで自動生成 (archive 時のマージ先がないと壊れるため)
4. 出力先: `changes/<change-dir>/specs/<capability>/spec.md`
5. 既存なし判定で誤検出を避けるため、CLI は判定結果をログ出力 (`note: treating as NEW capability`)

> ユーザーは同じコマンドで両ケースに対応できる。LLM スキルは「採番された雛形にタイトルと振る舞いを埋めるだけ」になる。

#### `mspec archive <change-name>`
1. `validate` を実行 (失敗で中断)
2. `delta-spec.md` の `### Requirement: <Name>` ブロックを `ADDED/MODIFIED/REMOVED/RENAMED` セクションごとに抽出
3. 対象 `specs/<capability>/spec.md` を読み込み、Requirement 名で差分適用
4. `git diff --stat` 相当のレポートを出力 (LLM 不使用)
5. `-y` なしならユーザー確認を求める
6. `changes/<name>/` を `changes/archive/<name>/` へ `git mv`
7. `mspec anchor check` を最後に再実行 (アンカーが arvhive 後のパスを指しているか確認)

#### `mspec continue` (Q3 + Bonus #6,#8 反映)

責務: **status を取って、次に実行すべきステップの「実行プロンプト一式」を組み立てて返す**。LLM 側スキルはこの出力を読んでそのまま動ける = ステップ独立性 (P1) を CLI が能動的に支える。

**呼び出しが即承認**: `block: true` の step 完了後でも、ユーザーが `/mspec:continue` を打った時点で「承認」とみなし、次の prompt を返す。`wait_user` を返すのは「block 完了後にまだ continue が呼ばれていない初期状態」ではなく、`status` 段階で fail やユーザー入力待ちが残っている時だけ。

出力 JSON 例:
```json
{
  "change": "2026-05-14-093015-apply-css",
  "current_step": "research",
  "next_action": "execute",
  "skill": "mspec-research",
  "main_prompt": "## Step: research\n\nYou are in the research step of the mspec workflow.\nRead the following artifacts (already produced) before proceeding:\n- changes/2026-05-14-093015-apply-css/proposal.md\n- changes/2026-05-14-093015-apply-css/specs/theme-engine/spec.md\n\nProduce: research.md\nAsk questions if ambiguous (ask_questions: true).\nUse subagent for execution (subagent: true).\nConstitution check: true (all principles to be evaluated, append the standard table to research.md).\n\nWhen done, run `mspec validate --change 2026-05-14-093015-apply-css` then `mspec continue`.",
  "subagent_prompt": "You are mspec-researcher. Your job: read proposal.md and the delta spec, then perform web search and codebase analysis to produce research.md. Return only the research.md content. Context: ...",
  "subagent_name": "mspec-researcher",
  "upstream_skipped": [],
  "questions_to_ask": [
    {"category": "Integration", "question": "Which library...", "options": ["A","B","C"]},
    {"category": "NFR",         "question": "...",              "options": [...]}
  ],
  "constitution_principles": [
    {"id": "I",  "name": "Library-First", "evaluate_in_phase": ["0"]},
    {"id": "II", "name": "CLI Interface", "evaluate_in_phase": ["0"]}
  ],
  "required_artifacts": [
    {"path": "changes/.../proposal.md",                "exists": true},
    {"path": "changes/.../specs/theme-engine/spec.md", "exists": true}
  ],
  "produces": ["research.md"],
  "block_after": true
}
```

#### フィールド意味論

| フィールド | 意味 |
|---|---|
| `main_prompt` | LLM スキルがメインで実行するプロンプト本文 |
| `subagent_prompt` | `subagent: true` の時のみ含まれる。LLM スキルは Task tool で `subagent_name` のエージェントを起動し、このプロンプトを渡す (Bonus #6) |
| `subagent_name` | 起動対象の agent 名 (`.claude/agents/mspec-*.md`) |
| `upstream_skipped` | この step より上で skipped された step 一覧 (Bonus #7) |
| `questions_to_ask` | 質問 bank (`.mspec/questions/<step-id>.yaml`) から AI が選別すべき候補 (Q10) |
| `constitution_principles` | この step で評価対象となる原則一覧 (Q6) |
| `required_artifacts` | プロンプトに読み込ませるべき前ステップ成果物 |
| `produces` | この step が生成すべきファイル |
| `block_after` | 完了後にユーザー確認待ちになるか (`block: true` の値) |

`next_action` 値:
- `"execute"` — 次ステップを実行可能 (`main_prompt` を使う)
- `"wait_user"` — 何らかの入力待ちが status 上残っている (例: askquestions の未回答)
- `"validate_failed"` — 直前ステップの validate が fail、修正が必要
- `"complete"` — 全ステップ完了 (archive まで)

#### `mspec skip` (追加要件 + Bonus #7 反映)

責務: typo/docs 等の軽微変更で明らかに不要なステップをスキップ。

動作:
1. `workflow.yaml` で対象 step が `skippable: true` か確認 (false なら fail)
2. `--reason <text>` 必須 (10 文字以上)
3. `readme.md` の `## Skipped Steps` セクションに `- <step-id>: <reason> (skipped at <timestamp>)` を追記
4. `.mspec/cache/skip-log.json` にも記録 (status 算出で `state: "skipped"` 扱い)
5. **対象 step の `produces` ファイルそれぞれにプレースホルダ MD を自動生成** (Bonus #7 反映):
   ```markdown
   <!-- mspec: skipped step -->
   # Skipped: <step-id>

   Reason: <reason>
   Skipped at: <timestamp>
   See: ../readme.md → ## Skipped Steps
   ```
   後続ステップは普通に `requires` で参照できる (空ファイル fail を回避)
6. `mspec continue` 出力の `upstream_skipped[]` にも `<step-id>` を追加し、LLM が文脈を補える
7. **プレースホルダ MD は Constitution Check 表を含めない** (O1 確定)。`mspec validate` は skipped step の constitution_check 検証をスキップする

ガード:
- `removable: false` かつ `skippable: false` のステップ (= `new`, `proposal`, `delta`, `tasks`, `implement`, `archive`) は絶対にスキップ不可
- `--reason` が 10 文字未満なら fail
- 1 チェンジで実装系全ステップ skip した場合は強制 fail (実装ステップは絶対残る)

#### `mspec spec lint` (ドリフト防止リンタ)

**目的**: Source-of-Truth spec (`specs/<capability>/spec.md`) は BDD で「振る舞い」を記述する場所であり、実装詳細 (採用ライブラリ名、shell コマンド、関数呼び出し) を漏らしてはいけない。Spec Kit / OpenSpec / Superpowers のいずれも「LLM が生成した SoT spec に design doc 違反の実装語彙が混入する」ドリフトを CLI で防げていない。`mspec` はこれを **regex ベースの決定論的リンタ** で塞ぐ。

**動作**:
- デフォルト辞書 (`packages/cli/src/lib/spec-forbidden.ts`) に 3 カテゴリの禁止語彙を持つ
  - `shell-command`: `git mv` / `git add` / `git commit` / `rm -rf` / `fs.rename` / `child_process` / `fetch(` / `axios.` など
  - `library-name`: `commander` / `js-yaml` / `remark` / `zod` / `vitest` / `jest` / `tsup` / `picocolors` / `minisearch` など (採用ライブラリの実名)
  - `impl-verb`: `calls foo()` / `invokes foo()` / `imports "..."` / `uses the X library` など、関数呼び出しレベルの動詞
- HTML コメント `<!-- ... -->` と fenced code block ` ``` ` 内は無視 (ヘッダーや例示コードを誤検出しない)
- 1 行に複数違反があれば全て報告。列位置 (column) も返すので IDE 統合可能
- `--allow <ruleId>` でルールを個別無効化、`--json` で CI 用出力
- `mspec validate --strict` から自動合成され、違反が 1 件でもあれば validate 全体を fail にする

**典型的な置換指針**:
- 「`git mv` を使って移動する」→「ディレクトリ名を保ったまま filesystem-level でリネームする」
- 「`commander` でパースする」→「CLI 引数パーサが解釈する」
- 「`fs.rename` を呼ぶ」→「ファイルをリネームする」
- 「`uses the remark library`」→「Markdown パーサが解析する」

#### `mspec anchor`
アンカー仕様は §6 参照。`extract --json` の出力:
```json
[
  {
    "anchor": "2026-05-14-add-search",
    "file": "src/search/index.ts",
    "line": 1,
    "delta_spec_path": "changes/2026-05-14-add-search/delta-spec.md",
    "exists": true,
    "is_archived": false
  }
]
```

---

## 4. ワークフロー YAML スキーマ

### 4.1 デフォルト workflow.yaml

```yaml
# .mspec/workflow.yaml
version: 1
name: mspec-default
description: むぎぼースペックの標準パイプライン

steps:
  - id: new
    command: /mspec:new
    skill: mspec-new
    produces: [readme.md]
    block: true                # 次ステップに進む前にユーザー確認を要求
    removable: false           # スキーマから削除不可 (強制ステップ)
    ask_questions: false       # この step では質問しない

  - id: proposal
    command: /mspec:proposal
    skill: mspec-proposal
    requires: [readme.md]
    produces: [proposal.md]
    block: true
    removable: false
    ask_questions: true        # AskUserQuestion を必須化
    subagent: false

  - id: delta
    command: /mspec:delta
    skill: mspec-delta
    requires: [proposal.md]
    produces: [specs/*/spec.md]   # capability ごとに 1 ファイル (glob)
    block: false                  # 自動継続
    removable: false              # 強制ステップ
    ask_questions: false          # 機械的な変換が中心
    enforce_fr_ids: true          # FR-NNN の連番・重複検証を必須化
    # 手順: skill 内で `mspec delta init --capability <name>` を呼び、CLI に既存 spec を読ませて
    # 次の FR-NNN を自動採番した雛形を作る。LLM は採番済み雛形に振る舞いを埋めるだけ。

  - id: research
    command: /mspec:research
    skill: mspec-research
    requires: [proposal.md, specs/*/spec.md]
    produces: [research.md]
    block: true
    removable: true
    ask_questions: true        # 複数選択肢が出たら質問
    subagent: true             # 必ずサブエージェントで実行

  - id: design
    command: /mspec:design
    skill: mspec-design
    requires: [research.md]
    produces: [design.md, architecture-overview.md]
    block: true
    removable: true
    ask_questions: true
    constitution_check: true   # Spec Kit 方式の Phase0/Phase1 二段ゲート

  - id: quickstart
    command: /mspec:quickstart
    skill: mspec-quickstart
    requires: [design.md]
    produces: [quickstart.md]
    block: false
    removable: true

  - id: checklist
    command: /mspec:checklist
    skill: mspec-checklist
    requires: [specs/*/spec.md, design.md]
    produces: [checklist.md]
    block: false
    removable: true
    subagent: true             # 関連 SoT spec も漁る

  - id: self-review
    command: /mspec:review
    skill: mspec-review
    requires: [checklist.md, design.md, architecture-overview.md, quickstart.md]
    produces: []                # 成果物は既存 MD への追記のみ
    block: true
    removable: true
    enabled: true               # yml で false にすればこの step を全体スキップ (Q5 反映)
    subagent: true              # 必ずサブエージェントで自己レビュー

  - id: tasks
    command: /mspec:tasks
    skill: mspec-tasks
    requires: [design.md, checklist.md]
    produces: [tasks.md]
    block: true                # 実装前の必須ストップポイント (強制)
    removable: false           # 削除不可

  - id: implement
    command: /mspec:implement
    skill: mspec-implement
    requires: [tasks.md]
    produces: []                # 実装は外部コード。アンカーで追跡
    block: true
    removable: false
    ask_questions: true
    enforce_anchor: true        # アンカー無しは fail
    enforce_e2e: true           # 各 Scenario に対する E2E が無いと fail
    enforce_tdd: true           # 全 task に red 証跡 + green 証跡が揃わないと fail (.mspec/cache/{red,green}-evidence/)
    constitution_check: false   # 実装フェーズではデフォルト off (yml で ON 可能)

  - id: archive
    command: /mspec:archive
    skill: mspec-archive
    requires: [implement]
    produces: []                # CLI が archive ディレクトリへ移動
    block: false
    removable: false
```

### 4.2 スキーマフィールド意味論

| フィールド | 型 | 必須 | 意味 |
|---|---|---|---|
| `id` | string | ✅ | ステップ識別子 (kebab-case) |
| `command` | string | ✅ | LLM 側で呼ぶスラッシュコマンド |
| `skill` | string | ✅ | Claude スキル名 (実体: `.claude/skills/<skill>/SKILL.md`) |
| `requires` | string[] | – | 前ステップの成果物ファイル名 (`changes/<name>/` からの相対) |
| `produces` | string[] | – | このステップで生成するファイル |
| `block` | bool | ✅ | true なら完了後ユーザー確認待ち / false なら自動継続 |
| `removable` | bool | ✅ | false ならスキーマから削除不可 |
| `ask_questions` | bool | – | true なら AskUserQuestion を最低 1 回実行する義務 |
| `subagent` | bool | – | true ならサブエージェントで実行 |
| `constitution_check` | bool | – | true なら Constitution Check を実施 |
| `enforce_anchor` | bool | – | true なら `mspec anchor check` を pass しないと完了不可 |
| `enforce_e2e` | bool | – | true なら全 Scenario に対する E2E ファイルが必要 |
| `enforce_fr_ids` | bool | – | true なら FR-NNN の連番・重複検証を必須化 |
| `enforce_tdd` | bool | – | true なら全 task に red 証跡 + green 証跡 (`mspec test --expect-red/green`) が揃わないと完了不可 |
| `skippable` | bool | – | true なら `mspec skip <step-id>` で省略可能 (typo/docs 等の軽微変更向け) |
| `enabled` | bool | – | false ならこの step を無効化 (workflow から除外、self-review 等の任意ステップ用)。デフォルト true |
| `constitution_check` | bool | – | true ならこの step の成果物 MD 末尾に Constitution Check 表を必須化。design 以外でも yml で ON 可能 (Q6 反映) |

> `removable: false` のステップを削除しようとすると `mspec schema validate` がエラーを返す。

---

## 5. 成果物 Markdown テンプレート (8 種)

### 5.1 readme.md (チェンジ入口)

```markdown
# <feature-kebab>

> Status: <new|in-progress|archived>
> Created: 2026-05-14

## Request

<ユーザーの元の要求を 1-3 行で要約>

## Artifacts

- [ ] proposal.md
- [ ] specs/<capability>/spec.md (Delta Spec)
- [ ] research.md
- [ ] design.md / architecture-overview.md
- [ ] quickstart.md
- [ ] checklist.md
- [ ] tasks.md

## Skipped Steps

<!-- `mspec skip <step-id> --reason "..."` 実行時に追記される -->
<!-- 例: - research: typo 修正のみのため省略 (skipped at 2026-05-14T10:30:00Z) -->
```

### 5.2 proposal.md (Superpowers 方式の問答結果)

```markdown
# Proposal: <タイトル>

## Why
<背景・動機。3 段落以内>

## Goals
- <ユーザーから引き出した達成目標>

## Non-Goals
- <スコープ外と確認できたもの>

## Capabilities (touched)
- <影響する capability 名のリスト>

## Open Questions
- <次ステップに持ち越す質問>
```

### 5.3 delta-spec.md (OpenSpec 互換 + Spec Kit 風 FR-ID)

物理パスは `changes/<change-dir>/specs/<capability>/spec.md` に置く (アンカーが参照するため)。

```markdown
# Delta Spec: <capability-kebab>

## ADDED Requirements

### Requirement: FR-005 — <Short Title>
The system MUST <behavior>.

#### Scenario: <Scenario Name>
- GIVEN <前提>
- WHEN <操作>
- THEN <結果>

### Requirement: FR-006 — <Short Title>
The system SHALL <behavior>.

#### Scenario: <Scenario Name>
- GIVEN ...
- WHEN ...
- THEN ...

## MODIFIED Requirements

### Requirement: FR-002 — <既存タイトル>
The system MUST <new behavior>.

#### Scenario: <Scenario Name>
- GIVEN ...
- WHEN ...
- THEN ...

## REMOVED Requirements

### Requirement: FR-001 — <既存タイトル>
(理由を1行で)

## RENAMED Requirements

### Requirement: FR-003 — <旧タイトル> -> FR-003 — <新タイトル>
```

> **構文ルール**:
> - `### Requirement:` は H3、`#### Scenario:` は **必ず H4** (OpenSpec 互換、パーサーの硬い前提)
> - Requirement のヘッダは `### Requirement: <FR-NNN> — <Short Title>` 形式。`<FR-NNN>` はアンカーから参照される ID
> - RFC 2119 キーワード (MUST/SHALL/SHOULD/MAY) を使う
> - 各 Requirement に最低 1 つの Scenario
> - 新規 FR-ID は capability 内で連番管理 (重複時 validate が fail)

### 5.4 research.md

```markdown
# Research: <タイトル>

## Decisions
| 論点 | 採用案 | 代替案 | 根拠 |
|------|--------|--------|------|
| ... | ... | ... | ... |

## Web References
- [<title>](<url>) — <要約>

## Codebase Findings
- `path/to/file:line` — <発見事項>

## Open Choices (要ユーザー判断)
- <選択肢が残ったもの>
```

### 5.5 design.md (Spec Kit plan.md + OpenSpec design.md 統合)

```markdown
# Design: <タイトル>

## Summary
<2-3 行>

## Goals
- ...

## Non-Goals
- ...

## Technical Context
- Language / Runtime:
- Dependencies (new):
- Storage:
- Testing framework:
- Target platform:
- Performance / Constraints:

## Constitution Check (Phase 0)
| Principle | Compliant? | Notes |
|-----------|-----------|-------|
| ... | ✅/❌ | ... |

## Project Structure (changes)
- 新規: `path/to/new.ts`
- 修正: `path/to/existing.ts`
- 削除: `path/to/old.ts`

## Decisions
### <意思決定 1>
- 採用: ...
- 代替: ...
- トレードオフ: ...

## Constitution Check (Phase 1, 計画詳細後)
(同上、再評価)

## Complexity Tracking
(憲法違反がある場合のみ、なぜ単純案では足りないか)

## Migration Plan / Rollout
- ...
```

### 5.6 architecture-overview.md (Mermaid 必須)

```markdown
# Architecture Overview: <タイトル>

## System Diagram
\`\`\`mermaid
graph LR
  A[Client] --> B[mspec CLI]
  B --> C[Parser]
  B --> D[Workflow Engine]
\`\`\`

## Sequence (該当する場合)
\`\`\`mermaid
sequenceDiagram
  User->>+CLI: mspec status
  CLI-->>-User: JSON
\`\`\`

## Data Model (該当する場合)
\`\`\`mermaid
erDiagram
  CHANGE ||--o{ ARTIFACT : produces
\`\`\`

## UI Mockup (画面変更がある場合のみ、SVG 推奨)
<inline SVG または PNG リンク>
```

> 画面変更が無いチェンジでも、System Diagram は必須。Mermaid で表現不能な意思決定がある時のみ SVG。

### 5.7 quickstart.md (Spec Kit 形式)

```markdown
# Quickstart: <タイトル>

## Prerequisites
- ...

## Setup
\`\`\`bash
...
\`\`\`

## Try it (Golden Path)
1. ...

## Verify
- Expected output: ...
- Expected file changes: ...

## Troubleshooting
| 症状 | 原因 | 対処 |
```

### 5.8 checklist.md

```markdown
# Checklist: <タイトル>

## Delta Spec Coverage
- [ ] ADDED Requirement <Name> が design.md でカバーされている
- [ ] ADDED Requirement <Name> の Scenario が tasks.md の E2E に展開されている
- [ ] MODIFIED Requirement <Name> の旧挙動が壊れていない (回帰テスト)

## Source-of-Truth Regression
- [ ] `specs/<capability>/spec.md` の他 Requirement にデグレが無いか
- [ ] 関連 capability `specs/<other>/spec.md` の Scenario が壊れない確認をした

## Constitution
- [ ] 全 Principle に対する Constitution Check が design.md にある
```

### 5.9 tasks.md (Spec Kit 形式)

```markdown
# Tasks: <タイトル>

## Phase 1: Setup
- [ ] T001 [P] <task> — files: `path/...`

## Phase 2: Foundational
- [ ] T010 ...

## Phase 3: User Story 1 (P1)
### Tests-first (E2E)
- [ ] T101 E2E for FR-005 "<Scenario Name>" — files: `e2e/apply-css.spec.ts`
      anchor:
        @mspec-delta 2026-05-14-093015-apply-css/specs/theme-engine/spec.md
        Requirements implemented: FR-005
        Change: apply-css
### Implementation
- [ ] T102 Implement applyCss() — files: `src/theme/applyCss.ts`
      anchor:
        @mspec-delta 2026-05-14-093015-apply-css/specs/theme-engine/spec.md
        Requirements implemented: FR-005, FR-007
        Change: apply-css

## Phase 4: Polish
- [ ] T201 ...

## Dependencies
- T101 blocks T102
```

> 実装タスク・E2E タスクには **必ず 3 行アンカーブロック** を `anchor:` 配下に記載する。LLM がコード/テスト生成時に対象ファイル先頭のコメントへ転記する義務を持つ (§6 参照)。`mspec validate` は tasks.md のアンカーと、生成された実ファイルのアンカーの一致を検証する。

---

## 6. アンカー仕様

### 6.1 フォーマット (確定版)

アンカーは **3 行ブロック** で構成される。プレフィックスは `@mspec-delta` のみ受け付ける (OpenSpec 互換は v0 ではサポートしない)。

```
@mspec-delta <change-dir>/specs/<capability>/spec.md
Requirements implemented: <FR-ID>[, <FR-ID>, ...]
Change: <feature-kebab>
```

#### フィールド意味論

| フィールド | 意味 | 例 |
|---|---|---|
| `<change-dir>` | チェンジディレクトリ名。**`YYYY-MM-DD-HHMMSS-<feature-kebab>` 固定**。archive 後も維持されるためアンカー書き換え不要 | `2026-05-14-093015-apply-css` |
| `<capability>` | Delta Spec が属する capability (kebab-case) | `theme-engine` |
| `<FR-ID>` | Delta Spec 内の Requirement ID。Spec Kit 互換の `FR-NNN` 形式。複数あればカンマ区切り | `FR-005` / `FR-005, FR-007` |
| `<feature-kebab>` | チェンジディレクトリ名から `YYYY-MM-DD-HHMMSS-` を除いた短縮名 | `apply-css` |

#### 完全な例

```
@mspec-delta 2026-05-14-093015-apply-css/specs/theme-engine/spec.md
Requirements implemented: FR-005, FR-007
Change: apply-css
```

> **重要な設計判断**: アンカーは「**ファイルへの相対パスを持つが、ルートが change-dir 名で archive 後も維持される構造**」を取ることで、検索性 (どの delta spec を満たしているか即座に分かる) と追跡性 (archive で壊れない) を両立する。CLI 側は `changes/<change-dir>/...` と `changes/archive/<change-dir>/...` の両方を探索する。

### 6.2 配置ルール

- **実装ファイル**: 言語標準の docstring / モジュールトップコメントの **先頭 10 行以内**
- **E2E テストファイル**: テストファイル冒頭の docstring、または各テストケース直前
- 1 ファイルに **複数アンカーブロック可** (複数の Delta Spec を満たす場合は 1 ブロックずつ追加)

#### 言語別配置例

**TypeScript / JavaScript:**
```ts
/**
 * @mspec-delta 2026-05-14-093015-apply-css/specs/theme-engine/spec.md
 * Requirements implemented: FR-005, FR-007
 * Change: apply-css
 */
export function applyCss(...) { ... }
```

**Python:**
```python
"""
@mspec-delta 2026-05-14-093015-apply-css/specs/theme-engine/spec.md
Requirements implemented: FR-005
Change: apply-css
"""
```

**Rust / Go:**
```rust
// @mspec-delta 2026-05-14-093015-apply-css/specs/theme-engine/spec.md
// Requirements implemented: FR-005
// Change: apply-css
```

### 6.3 パーサー仕様

アンカーブロックは **3 行が連続している** ことを必須とする。コメント記号 (`//`, `#`, `*`, `<!--`) は行ごとに剥がしてから判定。

```regex
# 1 行目 (path)
^\s*[#/\*]*\s*@mspec-delta\s+(?<change_dir>\d{4}-\d{2}-\d{2}-\d{6}-[a-z0-9-]+)\/specs\/(?<capability>[a-z0-9-]+)\/spec\.md\s*$

# 2 行目 (requirements)
^\s*[#/\*]*\s*Requirements implemented:\s+(?<fr_ids>FR-\d+(?:\s*,\s*FR-\d+)*)\s*$

# 3 行目 (change)
^\s*[#/\*]*\s*Change:\s+(?<change>[a-z0-9-]+)\s*$
```

- ファイル先頭から最大 30 行までしか走査しない (誤検出防止)
- 3 行が揃わないと「不完全アンカー」として警告 (validate でエラー)

### 6.4 検証ロジック (`mspec anchor check`)

1. プロジェクト全コード/テストを走査してアンカーブロックを抽出
2. 各アンカーの `<change-dir>` が `changes/<change-dir>/` または `changes/archive/<change-dir>/` に実在するか確認
3. 各アンカーの `<capability>/spec.md` (Delta Spec) が当該 change-dir 内に実在するか確認
4. `<FR-ID>` が Delta Spec 内の Requirement として実在するか確認
5. `<change>` フィールドが `<change-dir>` の末尾と一致するか整合性チェック
6. `enforce_anchor: true` の step がある時、`tasks.md` で指定された対象ファイルに 1 つ以上の有効アンカーが無いと fail
7. `enforce_e2e: true` の時、全 `FR-ID` に対し、対応するアンカーを持つ E2E ファイルが最低 1 つ存在しなければ fail

### 6.5 archive 後の追跡性

- アンカー内の `<change-dir>` は不変。archive コマンドが `changes/<change-dir>/` を `changes/archive/<change-dir>/` へ `git mv` しても、ディレクトリ名自体は変わらないためアンカーは無修正で追跡可能
- `mspec anchor extract` / `mspec anchor check` は `changes/` と `changes/archive/` の両方を検索パスとする
- **重要**: archive 後は Delta Spec の内容自体は本 spec にマージ済みなので、アンカー追跡時は「マージ元の履歴」を見る意味になる。CLI は `is_archived: true` フラグで明示する

### 6.6 LLM 入力用フォーマット (`anchor extract --json`)

```json
[
  {
    "change_dir": "2026-05-14-093015-apply-css",
    "capability": "theme-engine",
    "delta_spec_path": "changes/archive/2026-05-14-093015-apply-css/specs/theme-engine/spec.md",
    "requirements": ["FR-005", "FR-007"],
    "change": "apply-css",
    "source_file": "src/theme/applyCss.ts",
    "source_line": 1,
    "exists": true,
    "is_archived": true,
    "spec_excerpts": {
      "FR-005": "### Requirement: FR-005 — Stylesheet must be applied on init\nThe system MUST apply the user stylesheet ...\n\n#### Scenario: Apply on first load\n- GIVEN ...\n- WHEN ...\n- THEN ...",
      "FR-007": "### Requirement: FR-007 — Hot reload of stylesheet\n..."
    }
  }
]
```

> このフォーマットを `--json` で吐くことで、Claude スキルが LLM 呼び出し時に「コードが実装している仕様」をそのままコンテキストへ流し込める。レビュー時の根拠提示に直結する。

---

## 7. ステータス判定アルゴリズム

`mspec status --change <name>` の内部処理:

```
1. .mspec/workflow.yaml を読む (enabled: false の step は除外)
2. changes/<name>/ または changes/archive/<name>/ のファイル一覧を取得
3. .mspec/cache/skip-log.json で skipped step を取得
4. 各 step を上から順に評価:
   a. skip-log にあれば state = skipped
   b. 直前 step が done/skipped でなければ state = blocked
   c. 自分の produces の全ファイルが存在し、validate を pass → done
   d. ファイルは存在するが validate fail → invalid (blockers に詳細)
   e. 直前 done/skipped かつ自分未生成 → ready
   f. それ以外 → blocked
5. enforce_anchor / enforce_e2e / enforce_tdd フラグがある step は、
   対応する CLI チェック (mspec anchor check / E2E ファイル存在 / red&green evidence) を加味
   どれか fail なら state = invalid
6. constitution_check: true の step は produces MD 末尾に Constitution Check 表があるか確認
   無ければ state = invalid
7. current_step = 最初の ready/invalid の step
8. blockers = state を blocked/invalid にしている原因リスト
```

> validate は MD 構文 (見出しレベル、Scenario の H4 ルール、Constitution Check 表の存在) のチェックのみ。意味妥当性 (例: Scenario が本当に Requirement を満たすか) は LLM 側 self-review に任せる。
>
> **重要**: `invalid` state は `mspec continue` で `next_action: "validate_failed"` を返し、勝手に次へ進まない。LLM スキルは fail 原因を blockers から読み、対応する MD を修正してから再度 continue を呼ぶ。

---

## 8. アーカイブマージ仕様 (OpenSpec 完全踏襲)

### 8.1 入力

- `changes/<change-dir>/specs/<capability>/spec.md` (capability ごとに 1 ファイル、複数 capability 可)
- 対象: 同名 capability のルート `specs/<capability>/spec.md`

### 8.2 マージアルゴリズム

```
for section in [ADDED, MODIFIED, REMOVED, RENAMED]:
  for req_block in parse_requirement_blocks(delta, section):
    name = req_block.name
    target = find_requirement(spec, name)
    match section:
      ADDED:    spec.append(req_block)         # 同名既存ならエラー
      MODIFIED: spec.replace(target, req_block) # 既存無しならエラー
      REMOVED:  spec.delete(target)             # 既存無しならエラー
      RENAMED:  target.rename(req_block.new_name)
```

### 8.3 出力

- 更新済み `specs/<capability>/spec.md`
- `mspec archive` レポート (CLI に表示):
  ```
  Capability: search
    + ADDED:    Empty query handling
    ~ MODIFIED: Pagination
    - REMOVED:  Legacy sort
  Moved: changes/2026-05-14-add-search → changes/archive/2026-05-14-add-search
  ```

### 8.4 安全装置

- `--dry-run` で実マージせず diff のみ表示
- 既存に同名 Requirement が無いのに MODIFIED/REMOVED を指定したら fail
- アーカイブ後に `mspec anchor check` を自動再実行

### 8.5 FR-NNN の renumber ポリシー (O5 確定)

archive で本 spec に Delta をマージする際、**FR-NNN は不変** とする:

- ADDED の Requirement は Delta で付与された FR-NNN をそのまま本 spec に書き込む
- REMOVED で消えた FR-NNN は **欠番**として残す (renumber せず空ける)
- これにより、過去にコードコメントへ書かれたアンカー `Requirements implemented: FR-005` は **永続的に同じ Requirement を指し続ける** ことが保証される
- 欠番は本 spec ヘッダコメントで明示:
  ```markdown
  <!-- mspec: gaps in FR numbering are intentional. Removed in changes/archive/<change-dir>/ -->
  ```
- 将来 renumber したい場合は v0.4+ で `mspec archive --renumber` を opt-in 提供する余地を残す (現状未実装)

---

## 9. Constitution 仕様

### 9.1 ファイル

`memory/constitution.md` (Spec Kit と同じパス)。`mspec constitution init` で生成。

### 9.2 テンプレート

```markdown
# Project Constitution

> Version: 1.0.0
> Ratified: 2026-05-14
> Last Amended: 2026-05-14

## Core Principles

### I. <Principle Name>
<本文>

### II. <Principle Name>
<本文>

## Additional Constraints
- セキュリティ:
- パフォーマンス:
- コンプライアンス:

## Development Workflow & Governance
<改訂手順、レビュー方針>
```

### 9.3 Constitution Check (Q6 反映: 全ステップ ON 可能)

#### 配置場所

**`constitution_check: true` の各ステップは、自身の `produces` 成果物 MD の末尾に Constitution Check セクションを必須で含める** (例: `design.md`, `proposal.md`, `research.md`, `tasks.md` の各末尾)。`mspec validate --strict` がこの存在を検証する。

#### 共通テンプレ (全成果物 MD の末尾に貼り付け)

```markdown
## Constitution Check

> Step: <step-id> | Constitution Version: <ver>

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. <Name>   | ✅/❌/—  | ✅/❌/—  | <一行コメント> |
| II. <Name>  | ✅/❌/—  | ✅/❌/—  | ... |
| III. <Name> | ✅/❌/—  | ✅/❌/—  | ... |

### Complexity Tracking
<❌があった場合、なぜ単純案では足りないかを記述。違反 0 なら "None">
```

- `—` は「このフェーズではまだ評価不能」を意味する
- `design` ステップは **Phase 0 / Phase 1 両方** を埋める (二段ゲート、Spec Kit 互換)
- `design` 以外のステップは Phase 0 のみ埋めれば validate を pass (Phase 1 列は `—`)

#### ステップ別デフォルト ON/OFF

| Step | デフォルト `constitution_check` | 理由 |
|------|------------------------------|------|
| new       | false | ユーザー要求記録のみ |
| proposal  | true  | 要求段階で憲法に反していないか早期検出 |
| delta     | false | 機械的な変換のみ |
| research  | true  | 採用候補ライブラリが憲法に反していないか確認 |
| design    | **true (Phase 0/1 両方)** | Spec Kit 互換のメインゲート |
| quickstart | false | 検証手順のみ |
| checklist | false | 確認項目のみ |
| self-review | true | レビュー目線で全項目再評価 |
| tasks     | true  | タスク粒度で違反が紛れ込まないか |
| implement | false | 物理コード生成。違反は anchor/test 経由で検出 |
| archive   | false | 機械処理 |

> `.mspec/workflow.yaml` でこれを上書き可能 (yml で ON/OFF) — Q6 確定事項。

#### Constitution Check の機械検証

`mspec validate` は以下を確認:
1. `constitution_check: true` の step の produces MD 末尾に `## Constitution Check` 節がある
2. 表の列 `Phase 0` / `Phase 1` / `Notes` が揃っている
3. ❌ がある場合、`### Complexity Tracking` が `"None"` 以外で埋まっている
4. 全原則 (`memory/constitution.md` の `### I.` 〜) が表に列挙されている
5. **例外: `state == skipped` の step は Constitution Check 検証を完全スキップ** (O1 確定)。プレースホルダ MD は `<!-- mspec: skipped step -->` ヘッダで判定

意味妥当性 (本当に違反していないか) は self-review ステップ (subagent) に任せる。

---

## 10. Claude Code 統合

### 10.1 配置 (`mspec init --tools claude`)

```
.claude/
├── skills/
│   ├── mspec-new/SKILL.md
│   ├── mspec-proposal/SKILL.md
│   ├── mspec-delta/SKILL.md
│   ├── mspec-research/SKILL.md
│   ├── mspec-design/SKILL.md
│   ├── mspec-quickstart/SKILL.md
│   ├── mspec-checklist/SKILL.md
│   ├── mspec-review/SKILL.md
│   ├── mspec-tasks/SKILL.md
│   ├── mspec-implement/SKILL.md
│   └── mspec-archive/SKILL.md
├── commands/mspec/
│   ├── new.md
│   ├── proposal.md
│   ├── continue.md
│   └── ...
└── agents/
    ├── mspec-researcher.md        # research ステップ用 subagent
    ├── mspec-self-reviewer.md     # self-review ステップ用 subagent
    └── mspec-checklist-auditor.md
```

### 10.2 SKILL.md の共通骨子

```markdown
---
name: mspec-<id>
description: <id> step of mspec workflow
when_to_use: User runs /mspec:<id>, or workflow auto-continues to <id>
---

## Procedure

1. Run `mspec status --change <name> --json`  ← まず必ず
2. Read all `requires` artifacts (paths returned in status output)
3. <step 固有の手順>
4. If `ask_questions: true`, use AskUserQuestion (1 question per call, multi-select preferred)
5. Write `produces` artifacts using the template at `.mspec/templates/<artifact>.md`
6. Run `mspec validate --change <name>` to confirm
7. If `block: true`, stop and ask user to run `/mspec:continue`
   Else, automatically invoke next step
```

### 10.3 役割分担

| 主体 | 担当 |
|------|------|
| **Claude (skill)** | テキスト生成 (proposal/design/research/tasks)、質問、サブエージェント呼び出し |
| **subagent (agent)** | リサーチ、自己レビュー、チェックリスト監査 (コンテキスト独立化) |
| **mspec CLI** | 構造検証、アーカイブマージ、ステータス算出、アンカー検証 (決定論) |

---

## 11. AskUserQuestion パターン (Q10 + Bonus #5 確定: bank 階層化)

### 11.1 アーキテクチャ

質問は **2 階層で管理** する (Bonus #5 確定案):

```
<cli-pkg>/templates/questions/<step-id>.yaml   # mspec CLI に同梱されるデフォルト bank
        └── マージ ──→ AI が選別
.mspec/questions/<step-id>.yaml                # プロジェクト固有の追加・上書き (任意)
```

- `mspec init` は **コピーしない** (デフォルト bank はパッケージ内に置いたままにする)
- プロジェクト側で `.mspec/questions/<step-id>.yaml` を追加すると、CLI が同 ID の質問を上書き、新規 ID を追加マージ
- `mspec questions --phase <step-id> --json` でマージ済み bank を取得可能

### 11.2 質問の 9 カテゴリ (Spec Kit `/clarify` 互換)

各 step の bank YAML は以下 9 カテゴリで階層化する。AI は step / 文脈に応じて最大 5 問を選別。

| カテゴリ | 説明 | 主に問う step |
|---|---|---|
| `functional_scope` | 機能スコープの境界 | proposal |
| `data_model` | データ構造・永続化 | research / design |
| `ux` | UX・画面挙動 | proposal / design |
| `nfr` | 非機能要件 (性能 / 可用性 / 監査性 等) | proposal / design |
| `integration` | 外部システム・API・既存連携 | research |
| `edge_cases` | エラー / 競合 / 境界条件 | design / implement |
| `constraints` | 技術 / 組織 / ライセンス制約 | research / design |
| `terminology` | 用語の意味合わせ | proposal |
| `completion` | 完了条件 / 合格基準 | proposal / checklist |

### 11.3 bank YAML スキーマ例 (`<cli-pkg>/templates/questions/proposal.yaml`)

```yaml
version: 1
step: proposal
questions:
  - id: PRP-FS-001
    category: functional_scope
    when: always                       # 常に検討候補
    question: 主に解決したい課題は次のどれですか?
    options:
      - 既存機能の置き換え
      - 既存機能の拡張
      - 全く新規の機能
      - 不具合修正
    multi_select: false
    recommend_first: false

  - id: PRP-FS-002
    category: functional_scope
    when: "answers.PRP-FS-001 == '全く新規の機能'"   # 条件付き表示
    question: 新規機能は既存どの capability に属しますか? (既存無しなら新規 capability を提案)
    options: dynamic                   # capability 一覧から動的生成
    multi_select: false

  - id: PRP-NG-001
    category: functional_scope
    when: always
    question: Non-Goal として明示的に外したいものは?
    options:
      - パフォーマンス最適化
      - 国際化対応
      - アクセシビリティ
      - モバイル対応
    multi_select: true                 # 多選択可

  - id: PRP-NFR-001
    category: nfr
    when: always
    question: 想定される最大ユーザー同時アクセス数は?
    options:
      - 〜10 (社内ツール)
      - 〜100
      - 〜1,000
      - 〜10,000 以上
    multi_select: false

  - id: PRP-CMP-001
    category: completion
    when: always
    question: 「完了した」と判定する具体的指標は?
    options:
      - 全 E2E が green
      - ユーザー受入テスト合格
      - 本番投入後 24h 無障害
      - 開発者レビュー合格のみ
    multi_select: true
  # ... 各カテゴリ 1-3 問ずつ、合計 10-20 問
```

> **「Superpowers の 1% でも可能性があったら考慮」原則**: bank には**取りこぼしのリスクがあるすべての論点**を入れる。AI が「今回は明らかに不要」と判断した質問を skip する自由は持つが、bank 自体には常に列挙しておく。

### 11.4 AI による選別ロジック (LLM スキル側)

`mspec continue` の `questions_to_ask` には bank がフィルタ済み (when 条件評価後) で渡される。LLM スキルは:

1. 上から **`when: always`** の質問を必ず候補にする
2. ユーザーの初期要求 (`readme.md` の Request) を読み、明らかに該当する質問を優先
3. **最大 5 問** に絞って 1 問ずつ AskUserQuestion で対話
4. 「これは絶対外せない」と判断した質問が 5 問超ならユーザーに「次フェーズで聞きます」と告げて持ち越し

### 11.5 共通ルール

- **1 メッセージ 1 質問** (Superpowers ルール厳守) — AskUserQuestion 自体は 4 つ同時提示可能だが、設計上は「論点ごとに分けて1問ずつ」を推奨
- 可能な限り **多肢選択** にして Markdown 編集を回避
- `Other` は AskUserQuestion が自動付与
- 回答は対応する成果物 MD の該当セクションに **AI が転記** する (ユーザーは MD を書かない)
- 回答ログは `.mspec/cache/qa/<change-dir>/<step-id>.json` に保存 (再開時に復元可能)

---

## 12. ユニットコマンド (TypeScript CLI) 実装の参考スタック

| レイヤ | 候補ライブラリ |
|--------|--------------|
| CLI フレームワーク | `commander` または `cac` |
| YAML パース | `yaml` (eemeli/yaml) |
| Markdown パース | `remark` + `unified` + `remark-parse` |
| frontmatter | `gray-matter` |
| schema validation | `zod` |
| カラー出力 | `picocolors` |
| プロンプト | `@inquirer/prompts` (CLI 単体用、AskUserQuestion とは別物) |
| テスト | `vitest` |
| パッケージング | `tsup` または `unbuild` |

> `remark` を使うと Requirement/Scenario の Heading ノードに正確にアクセスでき、OpenSpec 互換のマージロジックが書きやすい。

---

## 13. 決定事項サマリ (全質問への回答結果)

### 13.1 一次質問 Q1-Q10 の確定状況

| # | 論点 | 確定内容 |
|---|------|---------|
| Q1 | Delta Spec の物理配置 | ✅ `changes/<change-dir>/specs/<capability>/spec.md` (OpenSpec 互換ディレクトリ構造) |
| Q2 | アンカープレフィックス | ✅ `@mspec-delta` のみ (OpenSpec 後方互換は v0 不要) |
| Q3 | `mspec continue` の責務 | ✅ status を取った上で「次に AI が実行すべき完全なプロンプト一式」を JSON で返す |
| Q4 | サブエージェントの実体 | ✅ `.claude/agents/mspec-*.md` に独自で配置。`mspec init --no-subagents` で省略可 |
| Q5 | `self-review` ステップ | ✅ デフォルト ON。`workflow.yaml` の `enabled: true/false` で ON/OFF |
| Q6 | Constitution Check の範囲 | ✅ 全ステップで ON 可能 (`constitution_check: true`)。`workflow.yaml` で ON/OFF |
| Q7 | Codex / Copilot 統合優先度 | ✅ v0 では Claude のみ。Claude で成果が出てから着手 |
| Q8 | `architecture-overview.md` の SVG | ✅ inline (SVG タグを MD 内に直接埋め込む) |
| Q9 | E2E フレームワーク | ✅ プロジェクトに委任 (mspec は推奨を持たない) |
| Q10 | 質問テンプレのカスタム性 | ✅ 可能。デフォルト bank を最大限充実 (Superpowers の 1% 思想) |

### 13.2 二次質問 Bonus #1-#8 (フロー精度リスク) の確定状況

| # | 論点 | 確定内容 |
|---|------|---------|
| #1 | validate fail 時の state | ✅ `invalid` state を新規追加 (state は 5 値: `done\|ready\|blocked\|skipped\|invalid`) |
| #2 | TDD red→green の保証 | ✅ `mspec test --expect-red/green <task-id>` で証跡記録、`enforce_tdd: true` で必須化 |
| #3 | FR-NNN の採番タイミング | ✅ `mspec delta init` が既存 spec を読んで自動採番、LLM は雛形に振る舞いを埋めるだけ |
| #4 | Constitution Check 物理配置 | ✅ 各成果物 MD の末尾に共通テンプレを埋め込む (§9.3) |
| #5 | 質問 bank の所在 | ✅ 2 階層: `<cli-pkg>/templates/questions/<step-id>.yaml` (デフォルト) + `.mspec/questions/<step-id>.yaml` (上書き)、Spec Kit 9 カテゴリ |
| #6 | subagent 起動 protocol | ✅ `mspec continue` の出力 JSON に `subagent_prompt` / `subagent_name` を含める |
| #7 | skip 時の `requires` 整合性 | ✅ skip 時にプレースホルダ MD (`<!-- mspec: skipped step -->` ヘッダ付き) を自動生成 |
| #8 | `block: true` 後の continue 挙動 | ✅ ユーザーが `/mspec:continue` を打った時点で承認とみなし、次の prompt を返す |

### 13.3 三次質問 O1-O5 (フロー精度の追加検討事項) の確定状況

| # | 論点 | 確定内容 |
|---|------|---------|
| O1 | skipped step の Constitution Check 表 | ✅ **要求しない**。プレースホルダ MD は Check 免除、`mspec validate` も `state == skipped` の step を Check 検証スキップ |
| O2 | `mspec test` のテストランナー識別 | ✅ **`.mspec/config.yaml` の `test.command` 明示必須** (自動推定なし)。init 時に対話で聞く |
| O3 | `mspec delta init` の使い分け | ✅ **1 コマンドで両対応**。`--capability <name>` が既存と一致したら最大 FR-ID +1、一致しなかったら新規と判定し `specs/<name>/spec.md` 本体も生成して FR-001 開始 |
| O4 | `.mspec/cache/` の Git 管理 | ✅ **全体を `.gitignore`**。`mspec init` 時に `.gitignore` へ `.mspec/cache/` 行を自動追記 |
| O5 | archive 時の FR-NNN renumber | ✅ **不変** (renumber しない、欠番許容)。本 spec ヘッダに `<!-- mspec: gaps in FR numbering are intentional -->` を明示。アンカーの永続追跡性を最優先 |

### 13.4 設計確定状態

**全 23 論点 (Q1-Q10 + Bonus #1-#8 + O1-O5) が確定済み。** 実装着手可能な状態 (v0.1 スコープは §14)。

---

## 14. ロードマップ

| バージョン | スコープ |
|-----------|--------|
| **v0.1** | `init` / `status` / `validate` / `archive` / `anchor` の主要 CLI、Claude Code 統合 (skills + commands)、デフォルト workflow.yaml、8 成果物テンプレ、Constitution Check (design step のみ) |
| **v0.2** | サブエージェント定義 (`.claude/agents/`)、`schema validate`、ユーザー定義 workflow のサポート強化、E2E enforcement の細粒度設定 |
| **v0.3** | Codex / Copilot 統合 |
| **v0.4** | TUI (`mspec view`)、`anchor` の双方向グラフ可視化、`status --json` の CI 連携サンプル |

---

## 15. 開発を始める前のチェックリスト (この設計ドキュメントへのレビュー観点)

- [ ] 5 つの設計原則 (§1.2) に異論はないか
- [ ] CLI コマンドの粒度 (§3.1) は妥当か (足りない/多すぎ)
- [ ] ワークフロー YAML の `block` / `removable` / `subagent` / `ask_questions` のフィールド名と意味論 (§4.2)
- [ ] 強制ステップ (new / proposal / delta / tasks / implement / archive) の選定 (§4.1)
- [ ] アンカーフォーマット `@mspec: YYYY-MM-DD-<feature>` の決め (§6.1)
- [ ] 8 成果物テンプレの構成 (§5)、特に `architecture-overview.md` の Mermaid 強制
- [ ] アーカイブマージの安全装置 (§8.4)
- [ ] §13 のオープン質問 Q1-Q10 への方針判断
- [ ] §14 ロードマップの v0.1 スコープが「最小限の動く mspec」になっているか
