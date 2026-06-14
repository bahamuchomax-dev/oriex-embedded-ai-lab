// Transformers.js / WASM fallback lab core.
//
// Safety rules enforced here:
// - NO top-level import of the transformers package. It is ONLY loaded via a
//   dynamic import after the user clicks "load model".
// - Model weights are NOT bundled in this repo. They would be fetched by the
//   transformers runtime at load time from its configured source.
// - MODEL_ID is empty by default, so the lab stays offline-safe and shows
//   "model-id-not-configured" instead of auto-fetching anything.

import { classifyError, makeClassifiedError } from './errorClassifier'
import type { ClassifiedError } from './errorClassifier'

export const ENGINE_NAME = 'Transformers.js / WASM fallback'

// Set a vetted, browser-compatible (ONNX) model id to enable real loading,
// e.g. 'onnx-community/Qwen2.5-0.5B-Instruct'. Left empty on purpose.
export const MODEL_ID = ''

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

interface TransformersModule {
  pipeline: (task: string, model: string, options?: Record<string, unknown>) => Promise<unknown>
  env?: { backends?: { onnx?: { wasm?: unknown } } }
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
  // Dynamic import ONLY. @vite-ignore keeps the package external so the build
  // never needs it bundled and a missing package surfaces as a runtime error
  // we can classify as transformers-not-installed.
  const mod = (await import(/* @vite-ignore */ '@huggingface/transformers')) as TransformersModule
  return mod
}

export async function createPipeline(timeoutMs: number = LOAD_TIMEOUT_MS): Promise<LoadedModel> {
  if (!isModelConfigured()) {
    throw makeClassifiedError('model-id-not-configured')
  }

  let mod: TransformersModule
  try {
    mod = await loadTransformersModule()
  } catch {
    throw makeClassifiedError('transformers-not-installed')
  }

  const pipe = (await withTimeout(
    mod.pipeline('text-generation', MODEL_ID),
    timeoutMs,
  )) as TextGenerationPipeline

  const backend = detectBackend(mod)

  return {
    backend,
    generate: async (prompt: string) => {
      const output = await pipe(prompt, { max_new_tokens: 96, temperature: 0.7 })
      return extractText(output)
    },
  }
}

export function classify(error: unknown, phase: 'load' | 'generate' | 'unknown'): ClassifiedError {
  return classifyError(error, phase)
}
