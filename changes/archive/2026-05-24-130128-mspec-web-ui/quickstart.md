---
doc_type: How-to
---

# Quickstart: mspec-web-ui

Get the MSPEC Web UI running and preview your first change in under 5 minutes.

## Prerequisites

- Node.js 20 or later
- pnpm installed globally (`npm install -g pnpm`)
- `mspec` CLI installed and working (`mspec --version`)
- At least one active (non-archived) change in your repository

## Setup

Install the Web UI package (optional but recommended):

```bash
# From your mspec project root
pnpm add -D @mspec/web-ui
```

> **Without `@mspec/web-ui`**: The CLI will still work normally. When `mspec new` is run, you'll see:
> ```
> ℹ  Web UI not available. Install it with: npm install @mspec/web-ui
> ```

## Try It (Golden Path)

### 1. Auto-start via `mspec new`

The Web UI starts automatically when you create a new change:

```bash
mspec new my-feature
```

Expected output:

```
✓ Created 2026-05-24-HHMMSS-my-feature
  Web UI started at http://localhost:3847
  next: run /mspec:proposal
```

If the server is already running, you'll see:

```
✓ Created 2026-05-24-HHMMSS-my-feature
  Web UI already running at http://localhost:3847
  next: run /mspec:proposal
```

### 2. Open the Dashboard

Open your browser at [http://localhost:3847](http://localhost:3847).

You'll see the **Change Dashboard** listing all non-archived changes with their step progress:

```
MSPEC Dashboard                         [☀ Light] [🌙 Dark]

Filter: [All ▾]  [Full-flow] [bugfix] [minor] [typo]

  Change                       Mode       Current Step     Progress
  ────────────────────────────────────────────────────────────────
  2026-05-24-...-my-feature    full       proposal    ●●○○○○○○○○
  2026-05-24-...-mspec-web-ui  full       quickstart  ●●●●●○○○○○
```

### 3. Preview a Markdown Artifact

Click on any change row, then click on **`design.md`** in the artifact list.

The preview renders:
- Tables and GFM formatting
- **Mermaid diagrams** as interactive SVGs
- **EARS keywords** (`SHALL`, `MUST`, `SHOULD`) highlighted in color
- **Gherkin keywords** (`GIVEN`, `WHEN`, `THEN`) highlighted in green

Toggle dark/light mode using the theme button in the top-right corner.

### 4. View a Prototype HTML

If the change has a `prototype.html`:

1. Click the change in the dashboard
2. Click `prototype.html` in the artifact list
3. The prototype renders inside a sandboxed `<iframe>`

### 5. Check E2E Test Results

If the change has E2E results in `e2e-results/`:

1. Click the change in the dashboard
2. Click **"Test Results"** tab
3. You'll see a color-coded list:

```
✅ green  should display dashboard (234ms)
✅ green  should preview markdown with Mermaid (891ms)
❌ red    should render prototype iframe (FAILED)
         Error: iframe content not loaded
         at ArtifactPreview.tsx:42
⏭ skip   should support language switching
```

Click any **red** test to expand the stack trace.

## Verify

Confirm everything is working:

- [ ] Browser opens `http://localhost:3847` without errors
- [ ] Dashboard lists all non-archived changes
- [ ] Clicking a change shows its artifact list
- [ ] `design.md` renders with Mermaid diagrams as SVGs
- [ ] EARS/Gherkin keywords are highlighted
- [ ] Dark/light mode toggle works and persists on reload
- [ ] `mspec new` with an already-running server shows "already running" message (not a second instance)

## Troubleshooting

### Port 3847 is already in use

Check what's using the port and kill it, or configure a different port:

```bash
# Check what's on port 3847
lsof -i :3847

# Or configure a custom port in ~/.mspecrc
printf 'ui:\n  port: 4000\n' >> ~/.mspecrc
```

### Zombie PID — server appears running but browser can't connect

Delete the stale PID file and run `mspec new` again:

```bash
rm ~/.mspec/ui.pid
mspec new dummy-cleanup
```

The server will restart automatically.

### Mermaid diagrams not rendering

Ensure `@mspec/web-ui` is up to date (Mermaid.js v10+ is required):

```bash
pnpm update @mspec/web-ui
```

### Web UI not starting after `mspec new`

Check if `@mspec/web-ui` is installed:

```bash
pnpm list @mspec/web-ui
```

If not installed, run:

```bash
pnpm add -D @mspec/web-ui
```

### `GET /api/changes` returns empty array

Make sure you have at least one non-archived change:

```bash
mspec status --json
```

Archived changes are not shown in the dashboard by design.
