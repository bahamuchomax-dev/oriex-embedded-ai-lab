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
  /** Per-model load timeout in ms. Heavier models need a longer timeout. */
  timeoutMs: number
  /** Whether this is recommended for the normal default smoke test. */
  recommendedForDefaultTest: boolean
  /** Benchmarked load/run status from real-device testing. */
  measuredStatus: 'works' | 'timeout' | 'untested-heavy'
  /** Human-readable note about the measurement. */
  measuredNote: string
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
    timeoutMs: 60000,
    recommendedForDefaultTest: true,
    measuredStatus: 'works',
    measuredNote: 'PC Chrome (deviceMemory 16, 12 cores): load ~5.1s, generate ~3.1s.',
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
    timeoutMs: 180000,
    recommendedForDefaultTest: false,
    measuredStatus: 'timeout',
    measuredNote: 'PC Chrome: load-timeout even at 180s (~180.5s, backend unknown). Not usable yet.',
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
    timeoutMs: 240000,
    recommendedForDefaultTest: false,
    measuredStatus: 'untested-heavy',
    measuredNote: 'Heavier than Qwen2.5-0.5B (which timed out at 180s); not validated. Expect long load or failure.',
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
    timeoutMs: 300000,
    recommendedForDefaultTest: false,
    measuredStatus: 'untested-heavy',
    measuredNote: 'Heaviest candidate; not validated. Likely to time out or exhaust memory.',
  },
]

/** Default candidate id (current PoC model). */
export const DEFAULT_CANDIDATE_ID = MODEL_CANDIDATES[0].id

export function getCandidate(id: string): ModelCandidate {
  return MODEL_CANDIDATES.find((c) => c.id === id) ?? MODEL_CANDIDATES[0]
}
