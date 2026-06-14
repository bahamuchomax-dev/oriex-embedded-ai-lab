# Device Benchmark Results

Measured browser-device results for the Oriex Embedded AI Lab.

## Project purpose

A browser-only embedded AI benchmark lab. Models run fully in the browser via
Transformers.js (WASM). The goal is to measure which candidate models can be
loaded and run on real devices, and how long load/generation take.

## Safety policy

- No external AI APIs (no OpenAI / Anthropic / Gemini, etc.).
- No API keys.
- No `.env` files.
- No Firebase.
- No prompt text or generated text is stored anywhere (not in
  localStorage / sessionStorage / IndexedDB, not in this document).
- Model weights are not committed to the repo; they are fetched at runtime.

## Environment

| Field | Value |
| --- | --- |
| Platform | PC Chrome / Windows |
| Browser | Chrome 149 |
| deviceMemory | 16 |
| hardwareConcurrency | 12 |

## Results

| Model | success | backend | first load | reload | generation | inputLength | outputLength | errorType | note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Xenova/distilgpt2 | true | onnx-wasm | ~5131ms | ~1525ms | ~3082ms | 44 | 52 | - | Stable enough for default PoC test |
| onnx-community/Qwen2.5-0.5B-Instruct | false | unknown | timeout (60s & 180s) | - | - | - | - | load-timeout | loadDurationMs ~180509ms; not recommended for normal browser testing |
| onnx-community/Llama-3.2-1B-Instruct | not tested | - | - | - | - | - | - | - | Heavier than Qwen2.5-0.5B, which already timed out |
| onnx-community/Qwen2.5-1.5B-Instruct | not tested | - | - | - | - | - | - | - | Heavier than Qwen2.5-0.5B, which already timed out |

## Mobile browser results

Scaffold only. Values below are placeholders — no real measurements have been
taken yet. Only the default recommended model (`Xenova/distilgpt2`) is in scope;
heavy / non-default models are not tested here. Fill each cell from the app's
diagnostic log after running on a real device. Do not record prompt text,
generated text, or personal data.

| Device type | Browser | OS | deviceMemory | hardwareConcurrency | modelId | backend | success | loadDurationMs | generationDurationMs | inputLength | outputLength | errorType | note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| iPhone | Safari | not measured | not exposed | not exposed | Xenova/distilgpt2 | not measured | pending measurement | not measured | not measured | not measured | not measured | not measured | pending measurement |
| Android phone | Chrome | not measured | not measured | not measured | Xenova/distilgpt2 | not measured | pending measurement | not measured | not measured | not measured | not measured | not measured | pending measurement |

Placeholder legend:

- `not measured` — not yet run / not yet recorded.
- `not exposed` — the browser does not expose this field (e.g. Safari hides `deviceMemory`).
- `pending measurement` — to be filled after a real-device run.

## Next measurement targets

- iPhone Safari — Xenova/distilgpt2
- Android Chrome — Xenova/distilgpt2
- PC Chrome after cache clear (cold load timing)
- Optional: investigate a lighter / quantized ONNX candidate

## Do not record

- Do not record prompt text.
- Do not record generated text.
- Do not record personal data.
- Only record: lengths, timings, status, model id, backend, and environment info.
