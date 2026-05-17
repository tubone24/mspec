---
doc_type: How-to
---

# Quickstart: 目的別チェンジモード（typo / minor / bugfix）

## Prerequisites

- mspec CLI がインストール済みであること（`npx mspec --version` で確認）
- `.mspec/workflow.yaml` に `modes:` セクションが追加済みであること

## Setup

```bash
# workflow.yaml に modes セクションが追加されていることを確認
cat .mspec/workflow.yaml | grep -A 10 "modes:"
```

期待出力：
```yaml
modes:
  typo:
    skip: [proposal, quickstart]
  minor:
    skip: [proposal, quickstart]
  bugfix:
    skip: [proposal, quickstart]
    force: [research]
```

### modes: セクションが存在しない場合の手動追加

既存プロジェクトで `modes:` が未追加の場合は `.mspec/workflow.yaml` に以下を手動追記する：

```yaml
modes:
  typo:
    skip: [proposal, quickstart]
  minor:
    skip: [proposal, quickstart]
  bugfix:
    skip: [proposal, quickstart]
    force: [research]
```

## Try it (Golden Path)

### typo モードで軽量フローを体験する

1. 新しいチェンジを開始する：
   ```
   /mspec:new README のスペルミスを修正したい
   ```

2. スキルが自動推定した結果を確認：
   ```
   スキル: 「typo モードと判断しました。正しいですか？」
   → 承認する
   ```

3. `readme.md` にモードが記録されたことを確認：
   ```bash
   grep "Mode:" changes/*/readme.md
   # > Mode: typo
   ```

4. ワークフローを進める：
   ```
   /mspec:continue
   ```
   → `proposal` ステップが **自動スキップ** されて research ステップへ進む（typo.skip は `[proposal, quickstart]` のみ）

5. 実装が完了したらアーカイブ：
   ```
   /mspec:continue
   ```
   → `quickstart` ステップも **自動スキップ** されて checklist に進む

### bugfix モードで調査フローを体験する

1. 新しいチェンジを開始する：
   ```
   /mspec:new ログ出力が欠落している不具合を修正したい
   ```

2. スキルの推定を確認・承認：
   ```
   スキル: 「bugfix モードと判断しました。正しいですか？」
   → 承認する
   ```

3. research スキップを試みる（拒否されることを確認）：
   ```bash
   mspec skip research --reason "調査不要"
   # Error: bugfix モードでは research は必須です
   ```

4. research を実施して次へ進む：
   ```
   /mspec:continue
   # → research ステップが強制実行される
   ```

## Verify

- **期待されるファイル変化**：
  - `changes/<timestamp>-<feature>/readme.md` に `> Mode: typo` が含まれる
  - typo / minor モードで `changes/.../readme.md` の `## Skipped Steps` に `proposal` と `quickstart` が記録される
  - bugfix モードで `mspec skip research` を実行するとエラーが返る

- **期待される出力**（typo モード、mspec continue）：
  ```
  Change: <feature>
  Next action: execute
  Current step: delta   ← proposal がスキップされて delta に直行
  ```

## Troubleshooting

| 症状 | 原因 | 対処 |
|------|------|------|
| `> Mode:` が readme.md に書き込まれない | スキルが説明文からモードを判定できなかった | 明示的に `/mspec:new --mode typo <説明文>` で指定する |
| proposal がスキップされずに実行される | `workflow.yaml` に `modes:` セクションがない | `workflow.yaml` に modes 定義を追加して再実行 |
| `bugfix モードでは research は必須です` が出ない | CLI が古いバージョン | `npx mspec@latest` で最新版を使用する |
| モードを変更したい | readme.md を直接編集 | `readme.md` の `> Mode:` 行を書き換えて `mspec continue` を再実行 |
