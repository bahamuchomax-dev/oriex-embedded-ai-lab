# Oriex Embedded AI Lab

A minimal proof-of-concept screen for experimenting with **on-device (embedded) AI**
on smartphones. Inference runs entirely in the browser via **Transformers.js**
with a **WASM fallback**. No external AI API is ever called.

## What it shows

- Engine name: `Transformers.js / WASM fallback`
- Model ID (or `model-id-not-configured` when unset)
- Load model button
- Fixed sample input (shown as text)
- Generate button (proposes tomorrow's review tasks in 3 lines or fewer)
- Output area
- Diagnostic log + copy button (lengths and metadata only)
- Safety notes

## Safety design

- **No external AI API**: OpenAI / Anthropic / Gemini are never contacted.
- **No API keys**, no `.env`, no Firebase.
- Input and generated text are **never** written to `localStorage`.
- The diagnostic log **never** contains input or output text - only lengths.
- No `dangerouslySetInnerHTML` / `innerHTML`; values render as React text.
- **Model weights are not bundled** in this repo.
- The transformers package is loaded **only via a runtime dynamic import**,
  never as a top-level import.

See [docs/SECURITY_NOTES.md](docs/SECURITY_NOTES.md) for the full list.

## Configuring a model

`MODEL_ID` in `src/embeddedAi/transformersFallbackLab.ts` is empty by default,
so the lab shows `model-id-not-configured` and fetches nothing. To enable real
inference, set it to a vetted, browser-compatible (ONNX) model id, e.g.
`onnx-community/Qwen2.5-0.5B-Instruct`. Weights are then fetched by the
runtime into the browser cache, not into this repo.

## Scripts

```bash
npm run dev      # start the dev server
npm run build    # type-check + production build
npm run lint     # eslint
npm run test     # vitest (safety + unit tests)
npm run preview  # preview the production build
```

## Deployment

Pushed to `main` (or run manually), GitHub Actions builds and deploys `dist`
to GitHub Pages. The Vite `base` is set to `/oriex-embedded-ai-lab/`.

Pages URL: https://bahamuchomax-dev.github.io/oriex-embedded-ai-lab/

## Docs

- [DEVICE_RESULTS.md](DEVICE_RESULTS.md) — canonical measured browser-device benchmark results
- [DEPLOYMENT_NOTES.md](DEPLOYMENT_NOTES.md) — Pages deployment state and mitigation plan
- [docs/EMBEDDED_AI_LAB_PLAN.md](docs/EMBEDDED_AI_LAB_PLAN.md)
- [docs/SECURITY_NOTES.md](docs/SECURITY_NOTES.md)
