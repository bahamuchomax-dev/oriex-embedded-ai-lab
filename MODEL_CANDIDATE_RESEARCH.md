# Model Candidate Research

Documentation-only research (Phase 12) on lightweight, browser-only text
generation candidates compatible with `@huggingface/transformers` (Transformers.js).
No model is added to the runtime in this phase. Sizes/claims are taken from
official or primary sources; where a value is not clearly stated, it says
"not clearly stated".

## 1. Purpose

Find browser-only text-generation candidates that are:

- more feasible (lighter / loadable) than `onnx-community/Qwen2.5-0.5B-Instruct`,
  which times out in PC Chrome, and
- potentially better than the current default `Xenova/distilgpt2`.

Very small models are acceptable even if quality is weak. The default safe PoC
model stays `Xenova/distilgpt2` unless measured evidence clearly proves a
replacement is safer and better.

## 2. Baseline status

- `Xenova/distilgpt2`
  - Works on PC Chrome (default PoC model).
  - 82M parameters (per official model card).
  - Low quality, English base LM, but useful and reliably loadable.
- `onnx-community/Qwen2.5-0.5B-Instruct`
  - PC Chrome: load-timeout at 60s and 180s (~180509ms), backend unknown.
  - Non-default; not recommended for normal browser testing.
  - ~0.5B parameters (Qwen2.5 0.5B class).

## 3. Candidate table

| Model id | Source | Task | Official params / size | Expected browser feasibility | Risks | Consider in later runtime phase? | Reason |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Xenova/distilgpt2 | https://huggingface.co/distilbert/distilgpt2 | text-generation | 82M params (model card) | Good (already verified on PC Chrome) | English only; weak quality | Already in use (default) | Baseline; reliably loads |
| HuggingFaceTB/SmolLM2-135M-Instruct | https://huggingface.co/HuggingFaceTB/SmolLM2-135M-Instruct | text-generation | 135M params (SmolLM2 family: 135M / 360M / 1.7B) | Likely good — official ONNX builds incl. quantized (model_int8 ~137MB, model_q4); smaller than Qwen2.5-0.5B | Primarily English (FineWeb-Edu/DCLM/The Stack); weak Japanese; instruct quality still small | Yes (one candidate) | Instruct-tuned, official ONNX + Transformers.js support, lighter than Qwen2.5-0.5B but a step up from distilgpt2 |
| HuggingFaceTB/SmolLM2-360M-Instruct | https://huggingface.co/HuggingFaceTB/SmolLM2-360M-Instruct | text-generation | 360M params (SmolLM2 family) | Uncertain — larger than 135M, still under 0.5B; heavier download/memory | Heavier than 135M; primarily English | Maybe (only after 135M is measured) | Possible step-up if 135M loads well |
| onnx-community/gemma-3-270m-it-ONNX | https://huggingface.co/onnx-community/gemma-3-270m-it-ONNX | text-generation | ~270M (per model name; exact count not clearly stated on this research pass) | Uncertain — small, ONNX build exists; Transformers.js support reportedly needs a recent version | Gemma Terms of Use (license) must be reviewed before any production use | Maybe (license review first) | Very small instruct model, but license/compat need confirmation |
| onnx-community/Qwen2.5-0.5B-Instruct | https://huggingface.co/onnx-community/Qwen2.5-0.5B-Instruct | text-generation | ~0.5B params | Poor — timed out in PC Chrome | Heavy for browser; multilingual (incl. Japanese) | No (already non-default, timeout) | Kept for comparison only |

Notes:

- SmolLM2 family official sizes (135M / 360M / 1.7B) and the presence of official
  ONNX + Transformers.js builds are from the Hugging Face model card and ONNX
  directory listing.
- distilgpt2 = 82M and the parent GPT-2 = 124M are from the official distilgpt2
  model card.
- Quantized ONNX variants (int8 / q4) materially reduce download size and are the
  realistic path for browser feasibility.

## 4. Do not add yet

- No model is added in Phase 12 (this is research only).
- `Xenova/distilgpt2` remains the default.
- Heavy models (Qwen2.5-0.5B / Llama-3.2-1B / Qwen2.5-1.5B) stay non-default.
- Any new model must be added as **non-default first** and measured before any
  default change.

## 5. Recommended next experiment

- Choose **at most one** candidate for Phase 13:
  - **`HuggingFaceTB/SmolLM2-135M-Instruct`** — the clearest safe lightweight
    option: officially 135M params, official ONNX (incl. quantized) +
    Transformers.js support, lighter than Qwen2.5-0.5B, instruct-tuned.
- It must be added as **non-default / experimental**, with a conservative
  timeout and an honest "not measured yet" note. Its Japanese quality is
  expected to be weak (English-focused), so this is a feasibility experiment,
  not a quality decision.
- If, during Phase 13, this candidate cannot be confirmed as safe/compatible,
  add no new model and instead proceed with device-compatibility guidance
  (Phase 13B).

## Sources

- DistilGPT2 model card: https://huggingface.co/distilbert/distilgpt2
- SmolLM2-135M-Instruct model card: https://huggingface.co/HuggingFaceTB/SmolLM2-135M-Instruct
- SmolLM2-360M-Instruct model card: https://huggingface.co/HuggingFaceTB/SmolLM2-360M-Instruct
- Gemma 3 270M IT (ONNX): https://huggingface.co/onnx-community/gemma-3-270m-it-ONNX
- Qwen2.5-0.5B-Instruct (ONNX): https://huggingface.co/onnx-community/Qwen2.5-0.5B-Instruct
- Transformers.js docs: https://huggingface.co/docs/transformers.js/en/index
