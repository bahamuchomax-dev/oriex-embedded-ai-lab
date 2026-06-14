// Model candidates for the embedded AI lab comparison mode.
//
// These are browser-compatible (ONNX) text-generation models loadable by
// Transformers.js. Weights are fetched at runtime from the Hugging Face Hub and
// are NEVER bundled in this repo. Heavier candidates are flagged in riskNote so
// they are not selected blindly on low-end phones.

export interface ModelCandidate {
  /** Stable internal id used for selection (not the Hugging Face id). */
  id: string
  /** Human-friendly label shown in the UI. */
  label: string
  /** Hugging Face model id passed to the transformers pipeline. */
  modelId: string
  /** Transformers.js task. */
  task: 'text-generation'
  /** Primary language coverage. */
  language: string
  /** Rough size / download note. */
  sizeNote: string
  /** Expected output quality note. */
  qualityNote: string
  /** Risk / caveat note (heavy download, memory, suitability). */
  riskNote: string
}

export const MODEL_CANDIDATES: ModelCandidate[] = [
  {
    id: 'distilgpt2',
    label: 'distilgpt2 (PoC / English)',
    modelId: 'Xenova/distilgpt2',
    task: 'text-generation',
    language: 'English',
    sizeNote: '~82M params, small download',
    qualityNote: 'PoC baseline. English base LM; weak/garbled Japanese output.',
    riskNote: 'Not suitable for Japanese review suggestions; use only to verify inference works.',
  },
  {
    id: 'qwen2.5-0.5b-instruct',
    label: 'Qwen2.5-0.5B-Instruct (multilingual)',
    modelId: 'onnx-community/Qwen2.5-0.5B-Instruct',
    task: 'text-generation',
    language: 'Multilingual (incl. Japanese)',
    sizeNote: '~0.5B params; several hundred MB download',
    qualityNote: 'Instruct-tuned; usable short Japanese suggestions for a small model.',
    riskNote: 'Moderate download/memory; may be slow on low-end phones. First load can take a while.',
  },
  {
    id: 'llama-3.2-1b-instruct',
    label: 'Llama-3.2-1B-Instruct (multilingual)',
    modelId: 'onnx-community/Llama-3.2-1B-Instruct',
    task: 'text-generation',
    language: 'Multilingual (incl. Japanese)',
    sizeNote: '~1.2B params; large download',
    qualityNote: 'Better Japanese coherence than 0.5B; still small overall.',
    riskNote: 'Heavy: large download and high memory; may be slow or fail to load on many phones. Check model license before production use.',
  },
  {
    id: 'qwen2.5-1.5b-instruct',
    label: 'Qwen2.5-1.5B-Instruct (multilingual, heavy)',
    modelId: 'onnx-community/Qwen2.5-1.5B-Instruct',
    task: 'text-generation',
    language: 'Multilingual (incl. Japanese)',
    sizeNote: '~1.5B params; very large download',
    qualityNote: 'Best Japanese quality of these candidates.',
    riskNote: 'Very heavy: likely too large for most phones; may exhaust memory or fail to load. Desktop/testing only.',
  },
]

/** Default candidate id (current PoC model). */
export const DEFAULT_CANDIDATE_ID = MODEL_CANDIDATES[0].id

export function getCandidate(id: string): ModelCandidate {
  return MODEL_CANDIDATES.find((c) => c.id === id) ?? MODEL_CANDIDATES[0]
}
