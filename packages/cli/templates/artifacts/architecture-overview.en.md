---
doc_type: Reference
---

# Architecture Overview: <title>

## System Diagram
```mermaid
graph LR
  A[Client] --> B[Service]
  B --> C[Storage]
```

## Sequence (if applicable)
```mermaid
sequenceDiagram
  User->>+System: request
  System-->>-User: response
```

## Data Model (if applicable)
```mermaid
erDiagram
  ENTITY_A ||--o{ ENTITY_B : has
```

## UI Mockup (only if UI changes are involved; SVG preferred)
<inline SVG or PNG link>

## Constitution Check

| Principle | Phase 0 | Phase 1 |
|-----------|---------|---------|
| I. Step Independence | — | — |
| II. Deterministic Merge | — | — |
| III. Question-Driven Requirements | — | — |
| IV. Bidirectional Anchor | — | — |
| V. Mandatory vs Optional Steps | — | — |
