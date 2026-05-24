<!-- mspec: gaps in FR numbering are intentional. Removed requirements are archived under changes/archive/. -->

# visual-mock Specification

## Purpose

<このスペックがカバーする外部から観測可能な振る舞いの概要>

## Requirements

<!-- archive コマンドが Delta Spec の ADDED/MODIFIED/REMOVED/RENAMED を機械的にマージします -->

### Requirement: FR-001 — Visual Prototype ファイル生成

`mspec prototype` コマンドが実行されたとき、このシステムは SHALL `changes/<change>/prototype/` ディレクトリ以下に HTML・CSS・JS ファイルを生成する。

#### Scenario: prototype ディレクトリへの生成

- GIVEN change が active 状態で readme.md が存在する
- WHEN ユーザーが `mspec prototype --change <change>` を実行する
- THEN `changes/<change>/prototype/index.html` が生成されブラウザで表示可能な状態になる

### Requirement: FR-002 — ローカル HTTP サーバー起動

prototype ファイルが生成されたとき、このシステムは SHALL ローカル HTTP サーバーを自動起動してブラウザで閲覧可能な URL（例: `http://localhost:PORT`）を標準出力に表示する。

#### Scenario: サーバー起動と URL 表示

- GIVEN `changes/<change>/prototype/` にファイルが存在する
- WHEN `mspec prototype` コマンドが prototype 生成を完了する
- THEN `Serving prototype at http://localhost:3737 — press Ctrl+C to stop` のようなメッセージが表示され、ブラウザでアクセスできる

### Requirement: FR-003 — フィードバック収集

ユーザーが prototype 確認後にサーバーを停止したとき、このシステムは SHALL フィードバックを対話入力で収集し `changes/<change>/prototype-feedback.md` に保存する。

#### Scenario: フィードバックの保存

- GIVEN ローカル HTTP サーバーが起動中
- WHEN ユーザーが Ctrl+C でサーバーを停止する
- THEN CLI がフィードバック入力プロンプトを表示し、入力内容を `prototype-feedback.md` に Markdown 形式で保存する

### Requirement: FR-004 — tasks.md へのフィードバック反映

`prototype-feedback.md` が存在する場合、このシステムは SHALL tasks ステップ実行時にフィードバックの内容を tasks.md に反映する。

#### Scenario: フィードバックがある状態での tasks 生成

- GIVEN `changes/<change>/prototype-feedback.md` に内容が記載されている
- WHEN `mspec tasks` ステップが実行される
- THEN tasks.md の該当タスクにフィードバック由来の注記または追加タスクが含まれる

### Requirement: FR-005 — スキル・コマンド名のリネーム

このシステムは SHALL `mspec-visual-mock` スキルおよび `mspec-visual-mock-runner` サブエージェントをそれぞれ `mspec-visual-prototype` および `mspec-visual-prototype-runner` に改名し、ユーザー向けコマンドを `/mspec:mock` から `/mspec:prototype` に変更する。

#### Scenario: リネーム後のコマンド実行

- GIVEN mspec がインストールされ `.claude/skills/` にスキルが配置されている
- WHEN ユーザーが `/mspec:prototype` を実行する
- THEN `mspec-visual-prototype` スキルが起動し Visual Prototype ステップが開始される


