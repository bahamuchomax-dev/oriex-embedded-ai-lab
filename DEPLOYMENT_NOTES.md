# Deployment Notes

Notes on the GitHub Pages deployment for the Oriex Embedded AI Lab.

## Current state

- GitHub Pages deployment currently **succeeds**.
- Latest known successful deployment after a main merge:
  - commit: `d2a4a52`
  - GitHub Pages deployment run: `27515038284`
- GitHub Actions shows a **Node20 deprecation warning** related to the Pages
  deploy action (`actions/deploy-pages`).
  - The warning is currently **non-blocking** (deployments still succeed).
  - The runtime app behavior is **unaffected** by this warning.

## Workflow overview

- Deploy workflow: `.github/workflows/deploy-pages.yml`
  - Triggers: push to `main`, `workflow_dispatch`
  - build job: `actions/checkout` → `actions/setup-node` → `npm ci` → `npm run build`
    → `actions/upload-pages-artifact` (path: `dist`)
  - deploy job: `actions/deploy-pages`
- CI workflow: `.github/workflows/ci.yml`
  - Triggers: push to `main`, pull requests
  - `npm ci` → `npm run security:check` → `npm run build`

## Recommended future mitigation

- Check whether `actions/deploy-pages` can be upgraded to a newer stable major
  version safely (addresses the Node20 deprecation warning).
- Keep the artifact upload step and the Pages deployment permissions unchanged.
- After any workflow update, verify the public Pages URL still returns HTTP 200
  and the app title loads.
- Avoid unrelated build or runtime changes in the same workflow update.

## Applied mitigation (Phase 10)

- Selected mitigation: upgrade the Pages deploy action to the newer stable major
  version that runs on Node24.
- Workflow change: `actions/deploy-pages@v4` → `actions/deploy-pages@v5` in
  `.github/workflows/deploy-pages.yml` (no other workflow changes).
- Left unchanged: Vite base path, build command, `dist` directory, Pages
  artifact path (`upload-pages-artifact@v3`, `path: dist`), permissions,
  concurrency, and all runtime source files.
- Verification steps used:
  - `npm run security:check`, `npm run build`, `npm run test`, `npm run lint`
  - CI passes
  - GitHub Pages deployment succeeds
  - Public URL returns HTTP 200 and the app title loads

## Remaining Node20 warnings after deploy-pages@v5

Phase 10 upgraded `actions/deploy-pages@v4` -> `@v5`, which **resolved the
deploy-pages-specific Node20 warning** (it no longer appears in the warning
list). The remaining Node20 deprecation warnings are **non-blocking** (CI and
Pages deployment both still succeed) and come from the actions below.

Observed in the latest runs after Phase 10:

- CI run `27515246712` (`.github/workflows/ci.yml`, job `safety-and-build`)
- Pages deploy run `27515246718` (`.github/workflows/deploy-pages.yml`, job `build`)

| Action | Current | Latest stable | Workflow file(s) | Blocking? | Recommended next action |
| --- | --- | --- | --- | --- | --- |
| actions/deploy-pages | v5 | v5.0.0 | deploy-pages.yml | no | keep as-is (already updated in Phase 10) |
| actions/checkout | v4 | v6.0.3 | ci.yml, deploy-pages.yml | no | update in a later phase; official version check first (v4 -> v6 is two majors) |
| actions/setup-node | v4 | v6.4.0 | ci.yml, deploy-pages.yml | no | update in a later phase; official version check first (v4 -> v6 is two majors) |
| actions/upload-artifact (internal) | v4 | v7.0.1 | deploy-pages.yml (used internally by upload-pages-artifact@v3) | no | not referenced directly; addressed by updating upload-pages-artifact |
| actions/upload-pages-artifact | v3 | v5.0.0 | deploy-pages.yml | no | update in a later phase; verify v5 still produces a Pages-compatible artifact and emits Node24 internals |

Notes:

- `actions/upload-artifact@v4` is **not referenced directly** in our workflows;
  it is pulled in by `actions/upload-pages-artifact@v3`. Bumping
  `upload-pages-artifact` (v3 -> v5) is the way to remove that warning.
- No change is required right now: the warnings are informational and the June
  16th, 2026 / September 16th, 2026 dates only affect default Node runtime, not
  current success.
- Any future bump should follow the same minimal/safe pattern as Phase 10:
  change one action version at a time, then verify CI passes, Pages deploys, and
  the public URL returns HTTP 200 with the app title.

## Do not change without review

- Pages base path (`base: '/oriex-embedded-ai-lab/'` in `vite.config.ts`).
- Vite build output directory (`dist`).
- GitHub Pages artifact path (`path: dist` in `upload-pages-artifact`).
- Repository / workflow permissions (`contents: read`, `pages: write`,
  `id-token: write`) and the `concurrency` group.
- External AI / API / storage safety constraints:
  - no external AI APIs, no API keys, no `.env`, no Firebase,
  - no prompt/generated text stored in localStorage / sessionStorage / IndexedDB,
  - no model weight files committed to the repo.
