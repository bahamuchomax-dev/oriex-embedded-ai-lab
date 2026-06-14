export type EmbeddedAiErrorType =
  | 'transformers-not-installed'
  | 'model-id-not-configured'
  | 'model-fetch-failed'
  | 'wasm-runtime-failed'
  | 'unsupported-browser'
  | 'load-timeout'
  | 'generation-failed'
  | 'unknown-transformers-error'

export type ErrorPhase = 'load' | 'generate' | 'unknown'

export interface ClassifiedError {
  errorType: EmbeddedAiErrorType
  message: string
  suggestedAction: string
}

export const SUGGESTED_ACTIONS: Record<EmbeddedAiErrorType, string> = {
  'transformers-not-installed': 'Install or load the Transformers package.',
  'model-id-not-configured': 'Set a verified browser-compatible model id.',
  'model-fetch-failed': 'Check network access and retry.',
  'wasm-runtime-failed': 'Try another browser or a smaller model.',
  'unsupported-browser': 'Use a modern browser over HTTPS.',
  'load-timeout': 'Retry with a stable connection.',
  'generation-failed': 'Check model load state and input length.',
  'unknown-transformers-error': 'Check the diagnostic log.',
}

export function suggestedActionFor(errorType: EmbeddedAiErrorType): string {
  return SUGGESTED_ACTIONS[errorType]
}

function toMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  try {
    return JSON.stringify(error)
  } catch {
    return String(error)
  }
}

function isEmbeddedAiErrorType(value: string): value is EmbeddedAiErrorType {
  return Object.prototype.hasOwnProperty.call(SUGGESTED_ACTIONS, value)
}

function detectType(message: string, phase: ErrorPhase): EmbeddedAiErrorType {
  const m = message.toLowerCase()

  if (m.includes('model-id-not-configured')) return 'model-id-not-configured'

  if (
    m.includes('failed to resolve module') ||
    m.includes('cannot find module') ||
    m.includes('cannot find package') ||
    m.includes('module specifier') ||
    m.includes('@huggingface/transformers')
  ) {
    return 'transformers-not-installed'
  }

  if (m.includes('timeout') || m.includes('timed out')) return 'load-timeout'

  if (
    m.includes('wasm') ||
    m.includes('webassembly') ||
    m.includes('onnxruntime') ||
    m.includes('ort')
  ) {
    return 'wasm-runtime-failed'
  }

  if (
    m.includes('unsupported') ||
    m.includes('not supported') ||
    m.includes('secure context') ||
    m.includes('securecontext')
  ) {
    return 'unsupported-browser'
  }

  if (
    m.includes('fetch') ||
    m.includes('network') ||
    m.includes('failed to load') ||
    m.includes('404') ||
    m.includes('not found')
  ) {
    return 'model-fetch-failed'
  }

  if (phase === 'generate') return 'generation-failed'

  return 'unknown-transformers-error'
}

export function classifyError(error: unknown, phase: ErrorPhase = 'unknown'): ClassifiedError {
  if (typeof error === 'string' && isEmbeddedAiErrorType(error)) {
    return {
      errorType: error,
      message: error,
      suggestedAction: SUGGESTED_ACTIONS[error],
    }
  }

  const message = toMessage(error)
  const errorType = detectType(message, phase)

  return {
    errorType,
    message,
    suggestedAction: SUGGESTED_ACTIONS[errorType],
  }
}

export function makeClassifiedError(errorType: EmbeddedAiErrorType): Error {
  return new Error(errorType)
}
