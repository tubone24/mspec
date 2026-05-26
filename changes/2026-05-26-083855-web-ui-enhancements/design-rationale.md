---
doc_type: Explanation
---

<!-- See also: ./design.md -->

# Design Rationale: web-ui-enhancements

## Context

mspec の Web UI は Fastify + React + Tailwind CSS で構成されており、既存の `ChangeDetail.tsx` がスプリットビューレイアウト（CSS Grid `grid-cols-[280px_1fr]`）を実装済みである。今回の3機能はそれぞれ「フィルター状態の永続化」「アーティファクト表示の情報密度向上」「SoT Spec への直接アクセス」という異なる課題を解決するが、共通して「既存コードパターンの最大限の再利用」と「新規 npm 依存ゼロ」を設計方針とした。

バックエンドでは `ChangeLocation.isArchived` と `listChanges({ includeArchived })` が実装済みであり、フロントエンドから「見えていなかっただけ」の状態である。同様に `projectPaths.specsDir` も既存で、`specs/**/spec.md` へのアクセス経路はインフラとして完成している。設計の大部分は「配線する」作業であり、新規ロジックの追加は最小限に抑えられる。

## Decisions

### URL クエリパラメータによるフィルター状態管理

アーカイブフィルターの状態を `useSearchParams`（URL クエリパラメータ）で管理することを選択した。主な理由は「URL 共有可能性」と「ページリロード後の状態保持」である。ユーザーがアーカイブを表示した状態の URL を同僚に送れる。LocalStorage では URL が状態を反映しないため共有できず、Zustand store ではリロードで状態が消える。

`isArchived` フィールドはフィルター ON/OFF に関わらず常に API レスポンスに含めることにした。これにより、将来的にアーカイブ行をグレーアウトしつつ表示する「ソフトフィルター」モードを追加する際にも型変更が不要になる。レスポンスサイズへの影響は boolean 1 フィールドのため無視できる。

### サーバーサイドでの `doc_type` 解析

アーティファクトの `doc_type` を読み取る処理をサーバーサイドに置いた。これは `gray-matter` 等の YAML パーサーが Node.js の `Buffer` API に依存しており、Vite のブラウザ向けバンドルでビルドエラーを引き起こすためである。正規表現 `/^doc_type:\s*(.+)$/m` はシンプルな YAML frontmatter（mspec 成果物の実際の形式）を確実に解析でき、マルチライン値や複雑なネスト構造は mspec の `doc_type` フィールドには存在しない。

### CSS Grid によるスプリットビュー

SoT Spec ビューアーのレイアウトとして `react-split-pane` 等のリサイズ可能なスプリットペインライブラリではなく CSS Grid を選択した。`ChangeDetail.tsx` が同じ `grid-cols-[280px_1fr]` パターンをすでに採用しており、コードの一貫性とゼロ依存追加が達成できる。capability 一覧パネルの幅は 240px 固定とする（capability 名は最長でも 30 文字程度のため十分）。

## Alternatives Considered

- **クライアントサイドでの `doc_type` 解析**: `gray-matter` または `js-yaml` をブラウザ bundle に含める案。Node Buffer 依存のビルドエラーリスクがあり却下。正規表現で十分なシンプルさのため不要。
- **`react-split-pane` によるリサイズ可能パネル**: ユーザビリティ向上の可能性があるが、新規 npm dep の追加と既存パターンとの乖離が発生するため却下。
- **LocalStorage によるフィルター状態管理**: リロード後も保持されるが URL 共有不可。`useSearchParams` がより優れた UX を提供するため却下。
- **モーダルによる SoT Spec 表示**: ブラウザ履歴・深リンクが使えないため却下。専用ルートの方が既存ナビゲーションパターンと整合する。

## Trade-offs

- **`doc_type` の正規表現解析**: YAML 仕様の全エッジケースには対応しない。ただし mspec の frontmatter は単純な `key: value` 形式のみを使用するため、実用上の問題はない。複雑な YAML が混入した場合は `docType: undefined`（グレー色）にフォールバックする。
- **固定幅の左ペイン**: リサイズ不可のため、非常に長い capability 名がある場合に切れる可能性がある。現在の capability 名の最大長（`artifact-templates-i18n` = 23 文字）は 240px で問題ない。
- **常に `isArchived` を返す API**: アーカイブが数百件になった場合、フィルター OFF 時もアーカイブ件数に比例してレスポンスが増大する可能性がある。現在のプロジェクト規模では無視できる。

## Rejected Options

- **アーカイブフィルターを `ModeFilter` コンポーネントに統合**: Mode フィルターは排他的な選択肢（All/full/bugfix/...）であり、アーカイブ表示は独立した boolean トグルのため、UI の意味論が異なる。独立ボタンで実装する。
- **`GET /api/specs` を既存 artifacts ルートで代用**: `specs/` は `changes/` 配下にないため、既存の `findChange` ベースのルートでは対応不可。専用ルート `specs.ts` が必要。
- **`docType` を `ArtifactFile.type` フィールドの拡張として実装**: `type` は `'markdown' | 'html' | ...` で「ファイル形式」を示す。`docType` は「Diátaxis 分類」であり意味が異なるため別フィールドとする。
