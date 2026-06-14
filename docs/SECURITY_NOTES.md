# Security Notes

This PoC is designed to keep all user data on-device and to avoid any external
AI service. The following rules are enforced by code and tests.

## Hard rules

- No external AI API: OpenAI / Anthropic / Gemini are never called.
- No API keys. No `.env` file is created or read.
- No Firebase.
- Input text and generated text are never written to `localStorage`.
- The diagnostic log never contains input text or generated text - only
  lengths (`inputLength`, `outputLength`) and metadata.
- No `dangerouslySetInnerHTML`. No `innerHTML` rendering. All dynamic values are
  rendered as React text nodes.
- Model weights are never committed to the repo.

## Model loading

- The transformers package is loaded only via a runtime dynamic import after an
  explicit user action. There is no top-level import.
- `MODEL_ID` defaults to empty. With no model id the lab shows
  `model-id-not-configured` and performs no network fetch.
- Model weights, when a model id is configured, are fetched by the transformers
  runtime into the browser cache (e.g. IndexedDB), not into this repo.

## Diagnostic log fields

timestamp, userAgent, platform, language, online, secureContext, hasIndexedDb,
deviceMemory, hardwareConcurrency, engine, modelId, backend, loadStartedAt,
loadFinishedAt, loadDurationMs, generationStartedAt, generationFinishedAt,
generationDurationMs, success, errorType, errorMessage, inputLength,
outputLength, storageQuota, storageUsageBefore, storageUsageAfter,
storageUsageDelta.

## Verification

Run the test suite (`npm run test`) which asserts:

- no top-level import of the transformers package; dynamic import only,
- the diagnostic log type stores no input/output text,
- no `localStorage` persistence of the prompt,
- no Firebase usage,
- no OpenAI / Anthropic / Gemini endpoints,
- no `dangerouslySetInnerHTML` / `innerHTML`,
- no model weight files in the repo,
- vite base is `/oriex-embedded-ai-lab/`.
