# Embedded AI Lab Plan

## Goal

A minimal screen to experiment with embedded (on-device) AI on smartphones.
Inference runs entirely in the browser via Transformers.js with a WASM fallback.
No external AI API is ever called.

## Scope

- Single page (`src/App.tsx`) showing:
  - Engine name: Transformers.js / WASM fallback
  - Model ID (or `model-id-not-configured` when not set)
  - Load model button
  - Fixed sample input (shown as text)
  - Generate button
  - Output area
  - Diagnostic log + copy button
  - Safety notes
- Core logic in `src/embeddedAi/`:
  - `transformersFallbackLab.ts` - dynamic-import-only model loading + generation
  - `diagnosticLog.ts` - environment + timing log (lengths only, no text)
  - `errorClassifier.ts` - stable error types + suggested actions

## Output objective

From the fixed study log, propose tomorrow's review tasks in 3 lines or fewer.

## Model loading

- The transformers package is loaded ONLY via `await import(...)` after the
  user presses "Load model". There is no top-level import.
- `MODEL_ID` is empty by default. When empty the lab shows
  `model-id-not-configured` and does not fetch anything (no white screen).
- To enable real inference, set `MODEL_ID` to a vetted, browser-compatible
  (ONNX) model id, e.g. `onnx-community/Qwen2.5-0.5B-Instruct`.

## Non-goals

- No server, no backend, no cloud inference.
- No model weights stored in the repo.
- No persistence of user input or generated text.
