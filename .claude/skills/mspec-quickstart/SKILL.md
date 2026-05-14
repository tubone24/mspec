---
name: mspec-quickstart
description: quickstart step of mspec workflow — write quickstart.md
when_to_use: User runs /mspec-quickstart, or workflow auto-continues to quickstart
---

## Procedure

1. Run `mspec status --change <change-dir> --json` first.
2. Read `design.md`.
3. Write `quickstart.md` from the artifact template: Prerequisites, Setup, Try it (Golden Path), Verify, Troubleshooting.
4. Run `mspec validate --change <change-dir>`.
5. `block: false` — auto-continue.
