---
description: Generate a visual UI prototype and collect design feedback
---

<!-- @mspec-delta 2026-05-23-085322-rename-visual-mock-to-prototype/specs/visual-mock/spec.md -->
<!-- Requirements implemented: FR-005 -->
<!-- Change: rename-visual-mock-to-prototype -->

You are running the visual-mock step for the current mspec change.

## Procedure

1. Run `mspec prototype --change <change-dir>` to start the prototype workflow.
   - This generates a UI prototype via the `mspec-visual-prototype-runner` subagent, starts a local HTTP server, and waits for Ctrl+C.
2. Open the displayed URL (`http://localhost:<port>`) in your browser to review the prototype.
3. Press **Ctrl+C** in the terminal to stop the server and enter feedback.
4. Type your feedback (blank line to finish). Your input is saved to `prototype-feedback.md`.
5. To skip this step: run `mspec skip visual-mock --change <change-dir> --reason "<reason>"`.
6. After completing or skipping, run `/mspec:continue` to advance the workflow.
