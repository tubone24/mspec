---
name: mspec-visual-mock
description: visual-mock step of mspec workflow — generate UI mock HTML and collect feedback
when_to_use: User runs /mspec:mock, or workflow auto-continues to visual-mock
---

<!-- @mspec-delta 2026-05-21-055911-ui-visual-mock-workflow/specs/cli-workflow-engine/spec.md -->
<!-- Requirements implemented: FR-023 -->
<!-- Change: ui-visual-mock-workflow -->

## Procedure

1. Run `mspec status --change <change-dir> --json` to confirm `current_step: "visual-mock"`.
2. Invoke the `mspec-visual-mock-runner` subagent to generate `changes/<change>/mock/index.html`.
   - Pass: the `## Goals` section from `proposal.md` + the detected `FrameworkInfo.promptHint` (run `mspec mock --change <change-dir>` to get this).
3. Run `mspec mock --change <change-dir>` to start the local server and display the URL.
4. Instruct the user to open `http://localhost:<port>` in their browser.
5. Wait for the user to review and press Ctrl+C. Feedback is automatically saved to `mock-feedback.md`.
6. To skip: `mspec skip visual-mock --change <change-dir> --reason "<reason>"`.
7. `block: true` — stop and ask the user to run `/mspec:continue`.
