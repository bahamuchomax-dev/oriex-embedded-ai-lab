# Device Results

Record manual test results per device here. Do NOT paste any input or
generated text. Only metadata and timings (the same fields as the diagnostic
log) should be recorded.

## Template

| Date | Device | OS / Browser | Engine | Model ID | Backend | Load ms | Gen ms | Result | Error type |
| ---- | ------ | ------------ | ------ | -------- | ------- | ------- | ------ | ------ | ---------- |
|      |        |              | Transformers.js / WASM fallback | model-id-not-configured |  |  |  |  |  |

## Notes

- `Load ms` / `Gen ms` come from `loadDurationMs` / `generationDurationMs`.
- `Result` is success / fail.
- `Error type` is one of the values from `errorClassifier.ts`.
- Storage usage deltas can be copied from the diagnostic log if relevant.
