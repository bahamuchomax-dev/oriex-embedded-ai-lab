// Transformers.js / WASM fallback lab core.
//
// Safety rules enforced here:
// - NO top-level import of the transformers package. It is ONLY loaded via a
//   dynamic import after the user clicks "load model".
// - Model weights are NOT bundled in this repo. They are fetched by the
//   transformers runtime from the Hugging Face Hub at load time.
// - No prompt or generated text is ever sent to any external AI API. The only
//   network traffic is the Hugging Face model-asset download.

import { classifyError, makeClassifiedError } from './errorClassifier'
import type { ClassifiedError } from './errorClassifier'

export const ENGINE_NAME = 'Transformers.js / WASM fallback'

// Small, browser-compatible (ONNX) verification model for the PoC. Weights are
// fetched at runtime from the Hugging Face Hub, never bundled in this repo.
export const MODEL_ID = 'Xenova/distilgpt2'

export const TRANSFORMERS_PACKAGE = '@huggingface/transformers'

export const LOAD_TIMEOUT_MS = 60000

// Fixed sample input shown on screen. Never logged; only its length is logged.
export const SAMPLE_INPUT =
  '今日は英単語を20個覚えた。数学は二次関数のグラフを復習した。明日は確認テストをしたい。'

export function isModelConfigured(): boolean {
  return MODEL_ID.trim().length > 0
}

export function buildPrompt(sample: string): string {
  const lines = [
    'You are a study coach. Read the study log and propose tomorrow review tasks.',
    'Answer in Japanese, at most 3 short lines.',
    'Study log:',
    sample,
  ]
  return lines.join('\n')
}

export interface LoadedModel {
  backend: string
  generate: (prompt: string, signal?: AbortSignal) => Promise<string>
}

type GenerationItem = { generated_text?: unknown }

interface TextGenerationPipeline {
  (input: string, options?: Record<string, unknown>): Promise<unknown>
}

interface TransformersEnv {
  allowLocalModels?: boolean
  allowRemoteModels?: boolean
  useBrowserCache?: boolean
  backends?: { onnx?: { wasm?: unknown } }
}

interface TransformersModule {
  pipeline: (task: string, model: string, options?: Record<string, unknown>) => Promise<unknown>
  env?: TransformersEnv
}

function detectBackend(mod: TransformersModule): string {
  try {
    if (mod.env?.backends?.onnx?.wasm) return 'onnx-wasm'
  } catch {
    // ignore
  }
  return 'wasm'
}

function extractText(output: unknown): string {
  if (typeof output === 'string') return output
  if (Array.isArray(output)) {
    const first = output[0] as GenerationItem | undefined
    if (first && typeof first.generated_text === 'string') {
      return first.generated_text
    }
  }
  if (output && typeof output === 'object') {
    const item = output as GenerationItem
    if (typeof item.generated_text === 'string') return item.generated_text
  }
  return ''
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(makeClassifiedError('load-timeout')), ms)
  })
  try {
    return await Promise.race([promise, timeout])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

export async function loadTransformersModule(): Promise<TransformersModule> {
  // Dynamic import ONLY (never a top-level import). Vite code-splits this into a
  // separate chunk fetched on demand when the user loads the model.
  const mod = (await import('@huggingface/transformers')) as unknown as TransformersModule
  // Only fetch model assets from the Hugging Face Hub; no local model files are
  // bundled in this repo. This library sends no prompt text to any AI API.
  if (mod.env) {
    mod.env.allowLocalModels = false
    mod.env.allowRemoteModels = true
  }
  return mod
}

export async function createPipeline(
  modelId: string = MODEL_ID,
  timeoutMs: number = LOAD_TIMEOUT_MS,
): Promise<LoadedModel> {
  if (!modelId || modelId.trim().length === 0) {
    throw makeClassifiedError('model-id-not-configured')
  }

  let mod: TransformersModule
  try {
    mod = await loadTransformersModule()
  } catch {
    throw makeClassifiedError('transformers-not-installed')
  }

  const pipe = (await withTimeout(
    mod.pipeline('text-generation', modelId),
    timeoutMs,
  )) as TextGenerationPipeline

  const backend = detectBackend(mod)

  return {
    backend,
    generate: async (prompt: string) => {
      const output = await pipe(prompt, {
        max_new_tokens: 64,
        temperature: 0.7,
        do_sample: true,
        return_full_text: false,
      })
      return extractText(output)
    },
  }
}

export function classify(error: unknown, phase: 'load' | 'generate' | 'unknown'): ClassifiedError {
  return classifyError(error, phase)
}
