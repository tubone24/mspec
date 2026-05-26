---
doc_type: How-to
---

# Quickstart: mspec-web-ui-e2e

Run the MSPEC Web UI Playwright E2E tests end-to-end in under 5 minutes.

## Prerequisites

- Node.js 20 or later
- pnpm installed globally (`npm install -g pnpm`)
- `mspec` CLI built and available (`mspec --version`)
- At least one **active** (non-archived) change in `changes/` — the Dashboard calls `GET /api/changes` which returns only non-archived changes (`includeArchived: false`). The current E2E change itself (`mspec-web-ui-e2e`) counts as test data.
- `packages/web-ui` scaffold in place (from `mspec-web-ui` change)

## Setup

### 1. Install Playwright browsers

```bash
cd packages/web-ui
pnpm exec playwright install chromium
```

### 2. Add `@mspec/cli` as a devDependency in `packages/web-ui`

The E2E API server imports Fastify routes from `packages/cli/src/server/`:

```bash
cd packages/web-ui
pnpm add -D @mspec/cli tsx
```

> **Why `tsx`?** The `api-server.ts` startup script is TypeScript. The `node --import tsx/esm` loader allows running it without a build step.

### 3. Add `test:e2e` script to `packages/web-ui/package.json`

Add the following entry to the `"scripts"` section:

```json
"test:e2e": "playwright test"
```

### 4. Create the API server startup script

Create `packages/web-ui/tests/e2e/setup/api-server.ts`:

```typescript
import Fastify from 'fastify';
import { registerChangesRoutes } from '@mspec/cli/src/server/routes/changes.js';
import { registerArtifactsRoutes } from '@mspec/cli/src/server/routes/artifacts.js';
import { registerTestResultsRoutes } from '@mspec/cli/src/server/routes/testResults.js';
import { writePid, clearPid } from '@mspec/cli/src/server/pidManager.js';

const port = 3847;
const root = process.cwd(); // mspec repo root

const app = Fastify({ logger: false });
await registerChangesRoutes(app, root);
await registerArtifactsRoutes(app, root);
await registerTestResultsRoutes(app, root);

app.get('/api/health', async () => ({ status: 'ok', pid: process.pid, port }));

await app.listen({ port, host: '127.0.0.1' });
await writePid({ pid: process.pid, port });

process.on('SIGTERM', async () => { await clearPid(); await app.close(); process.exit(0); });
process.on('SIGINT',  async () => { await clearPid(); await app.close(); process.exit(0); });
```

### 5. Update `playwright.config.ts`

Add the API server to the `webServer` array:

```typescript
webServer: [
  {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env['CI'],
  },
  {
    command: 'node --import tsx/esm tests/e2e/setup/api-server.ts',
    url: 'http://localhost:3847/api/health',
    reuseExistingServer: !process.env['CI'],
  },
],
```

## Try It (Golden Path)

### 1. Create the Dashboard E2E test

Create `packages/web-ui/tests/e2e/dashboard.e2e.test.ts`:

```typescript
import { test, expect } from '@playwright/test';

test('Dashboard shows archived changes', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('[data-testid^="change-row-"]');
  await expect(page).toHaveTitle('MSPEC Dashboard');
});

test('Mode filter narrows the list', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-testid="filter-bugfix"]');
  // Either bugfix rows exist or "No active changes found." is shown
  const rows = page.locator('[data-testid^="change-row-"]');
  const noResults = page.locator('text=No active changes found.');
  await expect(rows.or(noResults)).toBeVisible();
});
```

### 2. Run the E2E tests

```bash
cd packages/web-ui
pnpm test:e2e
```

Expected output:

```
Running 2 tests using 1 worker

  ✓  dashboard.e2e.test.ts:3:5 › Dashboard shows archived changes (1.2s)
  ✓  dashboard.e2e.test.ts:9:5 › Mode filter narrows the list (0.8s)

2 passed (3.4s)
```

### 3. Run all E2E tests at once

After creating all three test files (`dashboard.e2e.test.ts`, `artifact-preview.e2e.test.ts`, `test-results.e2e.test.ts`):

```bash
cd packages/web-ui
pnpm test:e2e --reporter=list
```

## Verify

- [ ] All Playwright E2E tests pass (exit code 0)
- [ ] `[data-testid^="change-row-"]` is visible in the Dashboard test
- [ ] `[data-testid="mermaid-svg"] svg` appears within 15 seconds in the ArtifactPreview test
- [ ] Theme toggle persists after `page.reload()` — `html.classList.contains('dark')` returns `true`
- [ ] Test result badges (`data-testid="test-case-pass/fail/skip"`) or "No test results found." appear in the TestResults test

## Troubleshooting

### `Cannot find module '@mspec/cli/src/server/routes/changes.js'`

The `@mspec/cli` package needs to be built first:

```bash
cd packages/cli
pnpm build
```

Then re-run the tests.

### `http://localhost:3847/api/health` timeout in `playwright.config.ts`

Ensure the API server can start. Test it manually:

```bash
cd packages/web-ui
node --import tsx/esm tests/e2e/setup/api-server.ts &
curl http://localhost:3847/api/health
# Should return: {"status":"ok","pid":...,"port":3847}
```

### Mermaid SVG test times out (> 15s)

The Mermaid library may be slow to initialize on first load. Add a `page.reload()` before the assertion or increase the timeout:

```typescript
await page.waitForSelector('[data-testid="mermaid-svg"] svg', { timeout: 30000 });
```

### No archived changes — Dashboard E2E fails

The tests use `changes/archive/` as test data. If no changes have been archived yet:

```bash
mspec status --json
# Check if any changes are in "archive" state
```

Either archive an existing change first, or update the test to check for "No active changes found." in both Dashboard and ChangeDetail pages.

### Port 3847 already in use

```bash
lsof -i :3847
kill -9 <PID>
# Or clear stale PID file:
rm ~/.mspec/ui.pid
```
