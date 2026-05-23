---
doc_type: Reference
---

# Diátaxis `doc_type:` Reference

mspec adopts the [Diátaxis](https://diataxis.fr/) framework as the taxonomy for every artifact a change produces. The single source of truth is `specs/artifact-taxonomy/spec.md` (FR-001 / FR-002).

## Rule

Every artifact template carries a `doc_type:` field in its YAML frontmatter, and that value MUST be exactly one of:

| `doc_type` | Diátaxis quadrant | Reader's question |
|---|---|---|
| `Tutorial` | Learning-oriented | "Teach me by walking me through it." |
| `How-to` | Task-oriented | "How do I get this *specific* thing done?" |
| `Reference` | Information-oriented | "What are the exact parameters / structure?" |
| `Explanation` | Understanding-oriented | "Why was it built this way?" |

Custom or compound types (e.g. `AI-Internal`, `Mixed`) are explicitly forbidden — see `specs/artifact-taxonomy/spec.md` FR-002.

## Current per-artifact mapping

| Artifact | `doc_type` | Reader-intent rationale |
|---|---|---|
| `readme.md` | `Reference` | Lists the change scope, request, and step checkboxes. |
| `proposal.md` | `Explanation` | Captures *why* — goals, capabilities, Constitution Phase 0. |
| `research.md` | `Reference` | Trade-off matrix written in tabular form for later lookup. |
| `design.md` | `Reference` | Decisions, Constitution Phase 1, and acceptance criteria laid out for reference. |
| `architecture-overview.md` | `Reference` | Mermaid diagrams + module map. |
| `quickstart.md` | `How-to` | Golden path / verify / troubleshooting steps. |
| `checklist.md` | `Reference` | Auditor-produced FR / regression check items. |
| `tasks.md` | `Reference` | Numbered task list with anchor blocks — exhaustive and indexable. |
| `glossary.md` | `Reference` | Per-change term sheet. |

## Known classification debates

The mspec team has had ongoing discussion on a few entries:

- **`tasks.md`** is labeled `Reference` rather than `How-to` because its readers are AI agents executing the workflow, not humans following a sequential tutorial. It is the densest, most exhaustive artifact in the change and serves as a lookup table during the `implement` step.
- **`design.md`** is labeled `Reference` but functionally carries strong `Explanation` content — it is where the user and the AI converge on intent. A future revision may split it into `design.md` (Reference) + `design-rationale.md` (Explanation).
- **No `Tutorial`-typed artifact exists** inside a change directory today. The reasoning: the mspec workflow itself is the tutorial — each step's slash command teaches the reader by guiding them through it. End-user-facing tutorials live in [`../tutorials/`](../tutorials/) at the docs level instead.

## Validating `doc_type` in your templates

`mspec validate` will flag any artifact template whose `doc_type` is missing or set to an unsupported value. The check is enforced by `tests/e2e/template-doc-type-invariant.e2e.test.ts`.

## Roadmap

~~A 5th `doc_type` (e.g. `AI-Internal`) for AI-only operational artifacts has been discussed.~~ **`AI-Internal` was introduced and then abolished** (change `deprecate-ai-internal-doc-type`, 2026-05-23) because classifying artifacts by consumer identity (AI vs. human) violates the Diátaxis philosophy. The allowed set is permanently fixed to the four Diátaxis types. `tasks.md` uses `Reference` as its canonical type.
