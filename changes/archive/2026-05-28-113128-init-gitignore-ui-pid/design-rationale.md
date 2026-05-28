---
doc_type: Explanation
---

<!-- See also: ./design.md -->

# Design Rationale: init-gitignore-ui-pid

## Context

`mspec ui` コマンドでローカルの Web UI サーバーを起動すると、`pidManager.ts` が `.mspec/ui.pid` を書き込む。このファイルには起動中プロセスの PID とポート番号が `{pid}:{port}\n` 形式で保存される。

問題は、このファイルが git 管理対象外になっていないため、ユーザーが誤って `git add .` を実行した際にコミットされてしまうことにある。ポート番号が git 履歴に残ることは些細なセキュリティリスクだが、それよりも「サーバーが起動中かどうか」という一時的な状態が git 履歴に混入することが問題である。

既にルートの `.gitignore` には `mspec init` が `.mspec/cache/` を追記しているが、`ui.pid` はキャッシュディレクトリの外（`.mspec/` 直下）に置かれるため、この除外設定では保護されていない。`.mspec/.gitignore` を `mspec init` 時に自動生成することで、ユーザーが手動設定を忘れるヒューマンエラーを防ぐ「Convention over Configuration」のアプローチを採る。

## Decisions

### PlannedFile[] への追加を採用した理由

`mspec init` は `PlannedFile[]` 配列に生成するファイルを宣言し、`collisions` チェックで既存ファイルの上書き防止、`--force` フラグでの再生成を一括管理する設計になっている（`init.ts:186-260`）。

この仕組みに `.mspec/.gitignore` を追加するだけで、以下の複雑なロジックを実装なしに自動的に得られる：
- `--force` なし時: 既存 `.mspec/.gitignore` を保持（ユーザーが編集済みの場合も安全）
- `--force` あり時: テンプレートから再生成
- 冪等性: 同じコマンドを複数回実行しても結果が変わらない

### 静的テンプレートファイルを採用した理由

`config.yaml` や `constitution.md` のように変数置換（`__TEST_COMMAND__` など）が必要な場合は `applyConfigTransforms()` 等の transform 関数が必要だが、`.mspec/.gitignore` の内容は `ui.pid` のみの固定値。transform なしの静的ファイルとして管理することで実装をシンプルに保てる。

## Alternatives Considered

- **`ensureGitignoreEntry` を再利用して `.mspec/.gitignore` に追記する**: `ensureGitignoreEntry` はルートの `.gitignore` への append-only 追記専用関数。新規ファイル生成（存在しない場合）と `--force` 時の再生成には別途ロジックが必要になるため不採用。
- **インラインで `fs.writeFile` を直接呼ぶ**: `PlannedFile[]` パターンの外で書き込むと `--force` フラグの処理を別途実装しなければならない。既存パターンを破るため不採用。
- **ルートの `.gitignore` に `.mspec/ui.pid` を追記する**: `ensureGitignoreEntry` での追記は可能だが、`.mspec/` 内の実行時ファイル管理は `.mspec/.gitignore` に集約するほうが責務が明確。将来的に `.mspec/` 内の ignore パターンが増えた場合も `.mspec/.gitignore` 1ファイルで管理できる。

## Trade-offs

- テンプレートファイルを `packages/cli/templates/` に追加することで、`mspec init` が配布する静的ファイルが1件増える。管理コストはごく小さい。
- `.mspec/.gitignore` が `PlannedFile[]` に含まれると、`--force` 再初期化時にユーザーが手動追記したパターンが失われる可能性がある。ただし `.mspec/.gitignore` を手動編集するユースケースは稀であり、他のアーティファクト（`config.yaml` 等）も同様に `--force` で上書きされる既存挙動と一致しているため許容する。

## Rejected Options

- **`cache/` や `*.log` を追加のパターンとして含める**: ユーザー確認（OC-001）で `ui.pid` のみに絞ることを確認。`cache/` はルートの `.gitignore` で既に管理されており二重管理になる。将来のパターン追加は別チェンジで行う。
- **`workflow.yaml` に gitignore 設定を持つ**: `workflow.yaml` はワークフロー定義の責務を持ち、gitignore 設定を混在させると関心の分離が壊れるため却下。

## Constitution Check

> Step: design-rationale | Constitution Version: 1.0

| Principle | Phase 0 | Phase 1 | Notes |
|-----------|---------|---------|-------|
| I. ステップ独立性 | ✅ | ✅ | 本ファイルは設計判断の説明のみ。実装への影響なし |
| II. 決定論的マージ | ✅ | ✅ | Explanation ドキュメントのため merge の対象外 |
| III. 質問駆動の要件確定 | ✅ | ✅ | Alternatives と Rejected Options に検討した代替案を明示。未確定事項なし |
| IV. 双方向アンカー | ✅ | ✅ | `design.md` との相互参照コメントを冒頭に配置 |
| V. 強制ステップと拡張ステップの分離 | ✅ | ✅ | `workflow.yaml` 不変。説明文書のため直接影響なし |
| VI. Security by Default | ✅ | ✅ | PID ファイルの git 混入リスク排除という Security by Default の具体例を Context で明示 |

### Complexity Tracking

None — 違反 0 件。
