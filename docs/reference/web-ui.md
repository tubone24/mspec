---
doc_type: Reference
title: "@mspec/web-ui — Web UI Reference"
description: Complete reference for the mspec visual dashboard SPA
---

<!-- @mspec-delta 2026-05-24-130128-mspec-web-ui/specs/web-ui-server/spec.md -->
<!-- Requirements implemented: FR-001, FR-002, FR-003 -->
<!-- Change: mspec-web-ui -->

# @mspec/web-ui — Web UI Reference

`@mspec/web-ui` is a React SPA dashboard that surfaces every change, artifact, spec, and test result produced by the mspec workflow. It is served automatically by `@mspec/cli` whenever you run `mspec new` or `mspec continue` in a project.

---

## Table of Contents

1. [Installation](#installation)
2. [Starting the server](#starting-the-server)
3. [Configuration](#configuration)
4. [Pages and routes](#pages-and-routes)
   - [Dashboard `/`](#dashboard-)
   - [Change Detail `/changes/:id`](#change-detail-changesid)
   - [Artifact Preview `/changes/:id/artifacts/*`](#artifact-preview-changesidartifacts)
   - [Spec Viewer `/spec-viewer`](#spec-viewer-spec-viewer)
   - [Test Results `/changes/:id/test-results`](#test-results-changesidtest-results)
5. [Theme system](#theme-system)
6. [Markdown rendering pipeline](#markdown-rendering-pipeline)
7. [Step progress states](#step-progress-states)
8. [Change modes](#change-modes)
9. [API endpoints](#api-endpoints)
10. [Data types](#data-types)
11. [Auto-refresh behavior](#auto-refresh-behavior)

---

## Installation

`@mspec/web-ui` is an optional peer dependency of `@mspec/cli`. It is installed automatically when you install the CLI:

```sh
npm install -g @mspec/cli
```

The CLI locates the built static assets via:

```js
require.resolve('@mspec/web-ui/dist/index.html')
```

To install the package on its own:

```sh
npm install @mspec/web-ui
```

---

## Starting the server

The web UI server starts automatically when you run any workflow command:

```sh
mspec new my-feature
mspec continue
```

The server binds to `http://localhost:3847` by default. The port is printed to stdout on startup.

---

## Configuration

Port is configurable in `.mspec/config.yaml`:

```yaml
ui:
  port: 3847  # default
```

---

## Pages and routes

### Dashboard `/`

The main landing page. Lists all changes in the project, sorted by most-recently-updated.

**Layout — two-column grid (260 px sidebar + fluid main area)**

#### Left sidebar

| Section | Controls |
|---------|----------|
| **Status** | Toggle buttons: In progress, Ready to read, Shipped, Archived — each shows a live count |
| **Mode** | Toggle buttons: All, Full, Bugfix, Minor, Typo — each shows a live count |
| **Navigate** | Link to Spec Viewer; Archived toggle with count |

Clicking an active filter a second time deselects it and returns to the "all" view. Status and mode filters compose: both must match for a row to appear.

Status definitions:

| Label | Condition |
|-------|-----------|
| In progress | Not archived and at least one step is not `done` |
| Ready to read | In progress and `currentStep` is `spec` or `plan` |
| Shipped | Not archived and every step is `done` |
| Archived | `isArchived === true` |

#### App bar

- Left: `/dashboard` breadcrumb
- Right: search input (searches `name`, `title`, `summary`, `tags`) + ThemePicker

#### Change list rows

Each row is a three-column grid:

| Column | Contents |
|--------|----------|
| Main info | Serif title (or slug if no separate title), monospace slug (when title differs), optional archived badge, optional summary line, mode chip, counts (`N reqs · N scenarios · N artifacts`), relative timestamp |
| Current step | Label of `currentStep` (e.g., `Impl`, `Test`) |
| Step progress | Color-coded bar per step — see [Step progress states](#step-progress-states) |

Relative timestamp format: `just now` / `Nm ago` / `Nh ago` / `Nd ago` / `Mon D` (>7 days).

The count in the top-left of the main area shows `N of M` (filtered vs. total) and a StepLegend color key.

---

### Change Detail `/changes/:id`

Displays all artifacts for a single change. The URL parameter `:id` is the change slug (e.g., `2026-05-24-130128-mspec-web-ui`).

**Header row**

- Back button → Dashboard
- Change ID in monospace
- Link to Test Results for this change
- ThemePicker

**Two-panel layout (active only when an artifact is selected)**

When no artifact is selected the sidebar occupies the full width. Once a file is clicked the layout switches to a `280 px sidebar + fluid viewer` grid.

#### Artifact list sidebar

Files are grouped by the artifact list returned by the API. Each entry shows:

- Filename (monospace, clickable)
- `type` label in muted text (e.g., `markdown`, `html`)
- Doc-type color coding via a left border on the list item:

| docType | Left border color |
|---------|------------------|
| `Reference` | Blue |
| `Explanation` | Purple |
| `How-to` | Green |
| `Tutorial` | Yellow |
| *(none / other)* | Gray |

Clicking a file that is already selected closes the viewer (toggle behavior).

#### Inline viewer panel

The right panel renders the selected artifact. For `.html` files a sandboxed `<iframe>` is used (prototype viewer). All other files are rendered as markdown — see [Markdown rendering pipeline](#markdown-rendering-pipeline).

A close button (`✕`) in the top-right of the panel collapses back to sidebar-only view.

---

### Artifact Preview `/changes/:id/artifacts/*`

A full-screen standalone viewer for a single artifact. Navigated to by constructing the URL directly; there is no in-app link to this page from the dashboard flow.

**Header row**

- Back button → Change Detail for the same `:id`
- Relative path of the artifact in monospace
- ThemePicker

The artifact is rendered using the same `ArtifactViewer` component as the inline panel in Change Detail.

---

### Spec Viewer `/spec-viewer`

Renders the source-of-truth spec files from the project's `.mspec/specs/` directory.

**Header row**

- Back button → Dashboard
- Title: "Spec Viewer"
- ThemePicker

**Left sidebar (240 px)**

Lists all spec capabilities returned by the API under the heading "Capabilities". Each entry is a monospace link that sets the active capability.

**Main area**

Displays the rendered markdown of the selected capability's spec. Uses the same markdown rendering pipeline as the artifact viewer (GFM, Mermaid, syntax highlighting, EARS/Gherkin keyword highlighting).

When no capability is selected the sidebar spans the full width and a prompt instructs the user to select a capability.

Route: `/spec-viewer/:capability` — the `:capability` segment maps directly to the spec slug returned by `GET /api/specs`.

---

### Test Results `/changes/:id/test-results`

Displays parsed test output for a change. Supports both Playwright JSON and JUnit XML formats.

**Header row**

- Back button → Change Detail for the same `:id`
- Title: "Test Results"
- ThemePicker

**Test case list**

All tests across all suites are flattened into a single sorted list: failures first, then passes and skips.

Each row shows:

| Element | Detail |
|---------|--------|
| Status badge | `PASS` (green), `FAIL` (red), `SKIP` (gray) in monospace |
| Test name | Plain text |
| Duration | Right-aligned, in milliseconds |

Failed tests are clickable to expand a detail panel showing:

- `errorMessage` in red text
- `stackTrace` in a scrollable `<pre>` block with surface background

---

## Theme system

Four themes are available. The active theme is applied by setting `data-theme` on `<html>` and is persisted to `localStorage` under the key `mspec-ui-store` (Zustand persist middleware).

| Theme | Description | Background |
|-------|-------------|------------|
| `light` | Default warm white | `#fbfaf7` |
| `sepia` | Warm parchment | `#f4ead5` |
| `green` | Soft botanical | `#dee9d3` |
| `dark` | Dark reading surface | `#15151a` |

The ThemePicker component renders as a radio group in every page header. Each option shows a small color swatch.

### CSS custom properties

All themes define the same set of tokens:

| Token | Purpose |
|-------|---------|
| `--bg` | Page background |
| `--paper` | Card / reader surface (slightly elevated from bg) |
| `--panel` | Side panels, code block backgrounds |
| `--ink` | Primary foreground text |
| `--ink-soft` | Secondary text (labels, timestamps) |
| `--ink-mute` | Tertiary text, divider labels |
| `--rule` | Hairline borders |
| `--rule-soft` | Lighter hairline / hover background |
| `--accent` | Links, active indicators |
| `--accent-2` | Prose link color |
| `--accent-soft` | Tinted hover / selected surface |
| `--sel` | Text selection highlight |

Status color tokens used by StepProgress:

| Token | State |
|-------|-------|
| `--done` | Step completed |
| `--ready` | Step active / in progress |
| `--blocked` | Step cannot start yet |
| `--skipped` | Step intentionally omitted |
| `--invalid` | Step has an error |

EARS/Gherkin keyword color tokens: `--k-shall`, `--k-must`, `--k-should`, `--k-may`, `--k-given`, `--k-when`, `--k-then`, `--k-and`, `--k-but`.

---

## Markdown rendering pipeline

All markdown artifacts and spec files are rendered with the following plugins applied in order:

| Stage | Plugin | Effect |
|-------|--------|--------|
| remark | `remark-gfm` | GitHub Flavored Markdown (tables, strikethrough, task lists) |
| rehype | `rehype-raw` | Pass raw HTML nodes through (enables `<!-- comment -->` nodes) |
| rehype | `rehypeCommentDim` | Wraps HTML comment nodes in `<span class="md-comment">` (dimmed, italic) |
| rehype | `rehypeGherkinEars` | Wraps EARS / Gherkin keywords in colored `<span>` elements |
| rehype | `rehypeInlineCodeProperty` | Marks inline `<code>` nodes so the code renderer can distinguish them from fenced blocks |

**Code blocks** are routed by language tag:

- ` ```mermaid ` → `MermaidRenderer` component (renders diagram via the Mermaid library)
- All other named languages → `CodeBlock` component (syntax highlighting via Shiki / `react-shiki`)
- Inline code → plain `<code>` element

**HTML artifacts** (`.html` extension) bypass the markdown pipeline entirely and are rendered inside a `PrototypeIframe` component (sandboxed `<iframe>`).

### EARS / Gherkin keyword highlighting

Keywords are highlighted in prose text outside of `<code>` and `<pre>` blocks:

| Keyword class | Keywords |
|--------------|---------|
| `.k-shall` | `SHALL` |
| `.k-must` | `MUST` |
| `.k-must-not` | `MUST NOT` |
| `.k-should` | `SHOULD` |
| `.k-should-not` | `SHOULD NOT` |
| `.k-may` | `MAY` |
| `.k-given` | `GIVEN` |
| `.k-when` | `WHEN` |
| `.k-then` | `THEN` |
| `.k-and` | `AND` |
| `.k-but` | `BUT` |

Each class receives a bold weight and a theme-aware colored background pill (via `color-mix`).

### HTML comment dimming

HTML comments in markdown source (`<!-- … -->`) are rendered as dimmed, italic text at `opacity: var(--comment-opacity)`. The opacity value varies by theme (0.42 light, 0.40 sepia/green, 0.50 dark).

---

## Step progress states

The `StepProgress` component renders one color bar per workflow step. The color is sourced from a CSS custom property named after the state:

| State | CSS var | Visual | Meaning |
|-------|---------|--------|---------|
| `done` | `--done` | Green | Step completed successfully |
| `ready` | `--ready` | Blue, pulsing | Step is the active next step |
| `blocked` | `--blocked` | Gray, 60% opacity | Waiting on a prerequisite |
| `skipped` | `--skipped` | Yellow | Step was intentionally skipped |
| `invalid` | `--invalid` | Red | Step has a validation error |

Steps use the canonical mspec step IDs: `discover`, `spec`, `plan`, `impl`, `test`, `docs`, `ship`.

Human-readable step labels used in the UI:

| ID | Label |
|----|-------|
| `discover` | Discover |
| `spec` | Spec |
| `plan` | Plan |
| `impl` | Impl |
| `test` | Test |
| `docs` | Docs |
| `ship` | Ship |

A `StepLegend` component showing all five states with labels is rendered in the Dashboard header row.

---

## Change modes

The `mode` field on a change controls which workflow steps are required. The UI renders the mode as a pill chip (`ModeChip`).

| Mode value | Display label | Dot color |
|------------|--------------|-----------|
| `full` | Full-flow | Blue |
| `bugfix` | Bugfix | Orange-red |
| `minor` | Minor | Green |
| `typo` | Typo | Yellow |

---

## API endpoints

The API is served by `@mspec/cli` (Fastify) at `http://localhost:3847`. All endpoints are under `/api`.

### `GET /api/health`

Health check. Returns `200 OK` when the server is running.

---

### `GET /api/changes`

List all non-archived changes.

**Query parameters**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `includeArchived` | `true` \| `false` | `false` | Include archived changes in the response |

**Response** — `ChangeInfo[]` (see [Data types](#data-types))

---

### `GET /api/changes/:id/artifacts`

List artifacts for a change.

**Path parameters**

| Parameter | Description |
|-----------|-------------|
| `:id` | Change slug |

**Response** — `ArtifactFile[]`

---

### `GET /api/changes/:id/artifacts/*path`

Get the raw content of an artifact file. The wildcard `*path` is the relative path of the file within the change directory.

**Response** — Raw text (markdown source, HTML, etc.)

---

### `GET /api/specs`

List all spec capabilities.

**Response** — `SpecCapability[]`

---

### `GET /api/specs/:capability`

Get the markdown content of a spec.

**Path parameters**

| Parameter | Description |
|-----------|-------------|
| `:capability` | Spec capability slug |

**Response** — Raw markdown text

---

### `GET /api/changes/:id/test-results`

Get parsed test results for a change. The server parses vitest JSON output and JUnit XML.

**Response** — `TestSuite[]`

---

## Data types

The following TypeScript interfaces describe the shapes returned by the API (defined in `src/api/client.ts`).

### `ChangeInfo`

```ts
interface ChangeInfo {
  id: string;
  name: string;
  title?: string;
  summary?: string;
  author?: string;
  createdAt: string;          // ISO 8601
  updatedAt?: string;         // ISO 8601
  mode: 'typo' | 'minor' | 'bugfix' | 'full';
  currentStep: string;        // e.g. "impl"
  steps: StepState[];
  isArchived: boolean;
  counts?: {
    reqs: number;
    scenarios: number;
    artifacts: number;
  };
  tags?: string[];
}
```

### `StepState`

```ts
interface StepState {
  id: string;                 // e.g. "impl"
  state: 'done' | 'ready' | 'blocked' | 'skipped' | 'invalid';
}
```

### `ArtifactFile`

```ts
interface ArtifactFile {
  name: string;               // display filename
  relativePath: string;       // path used in artifact content requests
  type: 'markdown' | 'html' | 'json' | 'xml' | 'other';
  docType?: 'Reference' | 'Explanation' | 'How-to' | 'Tutorial';
}
```

### `SpecCapability`

```ts
interface SpecCapability {
  capability: string;         // slug, e.g. "change-dashboard"
}
```

### `TestCase`

```ts
interface TestCase {
  name: string;
  status: 'pass' | 'fail' | 'skip';
  duration: number;           // milliseconds
  errorMessage?: string;
  stackTrace?: string;
}
```

### `TestSuite`

```ts
interface TestSuite {
  suiteName: string;
  format: 'playwright-json' | 'junit-xml';
  tests: TestCase[];
}
```

---

## Auto-refresh behavior

The Dashboard and Change Detail pages poll the API automatically while the tab is open:

| Hook | Endpoint | Interval |
|------|----------|---------|
| `useChanges` | `GET /api/changes` | 2 000 ms |
| `useChange` | `GET /api/changes/:id` | 2 000 ms |

All other data (artifacts, spec content, test results) is fetched once on mount and does not auto-refresh. Manually reload the page or navigate away and back to refresh those queries.

---

## Typography

The UI uses three font stacks loaded from Google Fonts:

| Class | Fonts | Used for |
|-------|-------|---------|
| `.serif` | Source Serif 4, Noto Serif JP, Georgia | Article titles, prose content, change titles in rows |
| `.sans` | Geist, Noto Sans JP, system-ui | Body default, navigation, labels |
| `.mono` | JetBrains Mono, ui-monospace, Menlo | Change slugs, step IDs, counts, code, timestamps |
