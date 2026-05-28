---
doc_type: Reference
---

# Architecture Overview: fix-checklist-ui-sync

## System Diagram

```mermaid
graph TD
    subgraph "Web UI (React)"
        AV["ArtifactViewer.tsx<br/>useEffect: - [x] → Set初期化<br/>onChange: toggle + PATCH呼び出し"]
        CL["client.ts<br/>usePatchChecklistItem<br/>(useMutation)"]
    end

    subgraph "CLI Server (Fastify)"
        AP["artifacts.ts<br/>PATCH /api/changes/:id/artifacts/checklist.md<br/>addContentTypeParser('text/plain')"]
        WF["writeFile(checklist.md, body, 'utf8')"]
    end

    FS[("checklist.md<br/>(ファイルシステム)")]

    AV -->|"1. ユーザーがチェックボックスをトグル"| AV
    AV -->|"2. buildUpdatedChecklist(content, idx, checked)"| AV
    AV -->|"3. patchMutation.mutate(updatedContent)"| CL
    CL -->|"4. PATCH /api/.../checklist.md<br/>Content-Type: text/plain"| AP
    AP -->|"5. findChange(paths, id)"| AP
    AP -->|"6. join(change.dir, 'checklist.md')"| WF
    WF -->|"7. writeFile"| FS
    AP -->|"8. 200 OK"| CL
    CL -->|"9. invalidateQueries<br/>artifact-content"| AV
    FS -->|"10. GET re-fetch → content 更新"| AV
```

---

## Sequence Diagram: チェックボックストグルの完全フロー

```mermaid
sequenceDiagram
    actor User
    participant AV as ArtifactViewer
    participant CL as client.ts (useMutation)
    participant SV as Fastify Server
    participant FS as checklist.md

    Note over AV: 初回表示
    AV->>FS: GET /api/changes/:id/artifacts/checklist.md
    FS-->>AV: Markdown テキスト (content)
    AV->>AV: useEffect: - [x] パターン解析 → Set<number> 初期化
    AV->>User: チェックボックス付きで表示

    Note over User, FS: チェックボックストグル
    User->>AV: クリック (index: idx)
    AV->>AV: setCheckedItems(newSet)
    AV->>AV: buildUpdatedChecklist(content, idx, !prev)
    AV->>CL: patchMutation.mutate(updatedContent)
    CL->>SV: PATCH /api/changes/:id/artifacts/checklist.md<br/>Content-Type: text/plain<br/>body: updatedContent
    SV->>SV: findChange → join(dir, 'checklist.md')
    SV->>FS: writeFile(path, body, 'utf8')
    FS-->>SV: 書き込み完了
    SV-->>CL: 200 OK { ok: true }
    CL->>AV: onSuccess → invalidateQueries
    AV->>SV: GET /api/changes/:id/artifacts/checklist.md (re-fetch)
    SV->>FS: readFile
    FS-->>SV: 更新済み Markdown
    SV-->>AV: 更新済み content
    AV->>AV: useEffect: Set 再初期化（保存済み状態と一致）
```

---

## Data Model: チェックボックス状態

```mermaid
erDiagram
    CHECKLIST_MD {
        string content "Markdown 全文テキスト"
    }
    CHECKBOX_STATE {
        Set_number checkedItems "チェック済みインデックスの集合"
        number checkboxCounter "現在レンダリング中のインデックス (ref)"
    }
    PATCH_REQUEST {
        string body "更新済み Markdown 全文 (text/plain)"
    }

    CHECKLIST_MD ||--o{ CHECKBOX_STATE : "useEffect で - [x] をパース"
    CHECKBOX_STATE ||--|| PATCH_REQUEST : "buildUpdatedChecklist で生成"
    PATCH_REQUEST ||--|| CHECKLIST_MD : "writeFile で上書き"
```

---

## 変更ファイル一覧

| ファイル | 変更内容 |
|---------|---------|
| `packages/cli/src/server/routes/artifacts.ts` | `writeFile` import 追加 + PATCH ルート実装 |
| `packages/web-ui/src/api/client.ts` | `usePatchChecklistItem` mutation フック追加 |
| `packages/web-ui/src/components/ArtifactViewer.tsx` | `useEffect` 初期化 + `onChange` PATCH 呼び出し + `buildUpdatedChecklist` ヘルパー追加 |
| `packages/cli/src/server/__tests__/routes.artifacts.test.ts` | PATCH の正常・404・403 テストケース追加 |

---

## Constitution Check

| 原則 | Phase 0 | Phase 1 |
|------|---------|---------|
| I — ステップ独立性 | ✅ overview は design を参照するのみ | ✅ 実装詳細に依存しない |
| II — 決定論的マージ | ✅ | ✅ |
| III — 質問駆動の要件確定 | ✅ | ✅ |
| IV — 双方向アンカー | ✅ | ✅ |
| V — 強制/拡張ステップの分離 | ✅ | ✅ |
| VI — Security by Default | ✅ PATCH 対象を図中でも明示的に限定 | ✅ |

### Complexity Tracking

None
