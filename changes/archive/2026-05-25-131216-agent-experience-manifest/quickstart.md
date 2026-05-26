---
doc_type: How-to
---

# Quickstart: agent-experience-manifest

## Prerequisites

- mspec CLI がインストール済み（`mspec --version` で確認）
- アクティブな change が 1 つ存在する（`mspec status` で確認）
- `packages/cli/src/commands/agent-run.ts` と `packages/cli/src/lib/agent-run-log.ts` の実装が完了していること

## Setup

新たな依存関係の追加は不要。実装後は CLI を再ビルドするだけ：

```bash
cd packages/cli
pnpm build
```

## Try it (Golden Path)

subagent ステップ（research / checklist / self-review）を実行すると、SKILL.md が自動的にログを記録する。

### 1. research ステップを実行する

```bash
# change を進めて research ステップへ
/mspec:continue
```

SKILL.md の `## Observation` セクションに従い、subagent 完了後に以下が自動実行される：

```bash
mspec agent-run record \
  --step research \
  --change 2026-05-25-my-feature \
  --bytes 4821 \
  --artifacts proposal.md specs/my-capability/spec.md
```

### 2. ログを確認する

```bash
cat changes/2026-05-25-my-feature/.agent-runs.jsonl
```

期待出力：

```jsonl
{"step":"research","change":"2026-05-25-my-feature","started_at":"2026-05-26T03:00:00.000Z","context_size_bytes":4821,"context_size_tokens":null,"required_artifacts":["proposal.md","specs/my-capability/spec.md"],"review_edits_count":null}
```

### 3. self-review ステップ後のログを確認する

self-review 完了後は `review_edits_count`（`[blocker]` 行数）が記録される：

```jsonl
{"step":"self-review","change":"2026-05-25-my-feature","started_at":"2026-05-26T05:00:00.000Z","context_size_bytes":22180,"context_size_tokens":null,"required_artifacts":["proposal.md","design.md","tasks.md"],"review_edits_count":2}
```

## Verify

- **期待ファイル**: `changes/<change>/.agent-runs.jsonl` が存在する
- **期待内容**: subagent ステップごとに 1 行の JSON オブジェクト（JSONL 形式）が追記されている
- **期待フィールド**: `step`, `change`, `started_at`, `context_size_bytes`, `context_size_tokens`（常に `null`）, `required_artifacts`, `review_edits_count`
- **禁止フィールド**: プロンプト本文・ファイル内容・秘密情報は含まれない

## Troubleshooting

| 症状 | 原因 | 対処 |
|------|------|------|
| `.agent-runs.jsonl` が作成されない | SKILL.md の `## Observation` セクションが未追記 | `.claude/skills/mspec-research/SKILL.md` 等に観測義務セクションを追記したか確認 |
| `mspec agent-run record: command not found` | CLI のビルドが古い | `pnpm build` を再実行して CLI を再ビルド |
| JSONL が 1 行でなく複数行の JSON になっている | `JSON.stringify` に indent が付いている | `agent-run-log.ts` で `JSON.stringify(entry)` のみ使用（indent なし）か確認 |
| `review_edits_count` が常に `null` | self-review ステップで `--edits` オプションが未指定 | `mspec-review/SKILL.md` に `--edits <count-of-[blocker]-lines>` が追記されているか確認 |
