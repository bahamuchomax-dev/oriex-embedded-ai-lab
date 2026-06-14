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
