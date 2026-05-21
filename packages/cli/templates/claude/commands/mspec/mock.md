---
description: Generate a visual UI mock and collect design feedback
---

<!-- @mspec-delta 2026-05-21-055911-ui-visual-mock-workflow/specs/cli-core/spec.md -->
<!-- Requirements implemented: FR-004 -->
<!-- Change: ui-visual-mock-workflow -->

You are running the visual-mock step for the current mspec change.

## Procedure

1. Run `mspec mock --change <change-dir>` to start the mock workflow.
   - This generates a UI mock via the `mspec-visual-mock-runner` subagent, starts a local HTTP server, and waits for Ctrl+C.
2. Open the displayed URL (`http://localhost:<port>`) in your browser to review the mock.
3. Press **Ctrl+C** in the terminal to stop the server and enter feedback.
4. Type your feedback (blank line to finish). Your input is saved to `mock-feedback.md`.
5. To skip this step: run `mspec skip visual-mock --change <change-dir> --reason "<reason>"`.
6. After completing or skipping, run `/mspec:continue` to advance the workflow.
