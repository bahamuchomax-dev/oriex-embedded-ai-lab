// Diagnostic log for the embedded AI lab.
// IMPORTANT: this log NEVER stores the input text or the generated text.
// Only lengths (inputLength / outputLength) are recorded.

export interface DiagnosticLogEntry {
  timestamp: string
  userAgent: string
  platform: string
  language: string
  online: boolean
  secureContext: boolean
  hasIndexedDb: boolean
  deviceMemory: number | null
  hardwareConcurrency: number | null
  engine: string
  modelId: string
  backend: string
  loadStartedAt: number | null
  loadFinishedAt: number | null
  loadDurationMs: number | null
  generationStartedAt: number | null
  generationFinishedAt: number | null
  generationDurationMs: number | null
  success: boolean
  errorType: string | null
  errorMessage: string | null
  inputLength: number
  outputLength: number
  storageQuota: number | null
  storageUsageBefore: number | null
  storageUsageAfter: number | null
  storageUsageDelta: number | null
}

export interface EnvironmentInfo {
  userAgent: string
  platform: string
  language: string
  online: boolean
  secureContext: boolean
  hasIndexedDb: boolean
  deviceMemory: number | null
  hardwareConcurrency: number | null
}

interface ExtendedNavigator extends Navigator {
  deviceMemory?: number
}

export function collectEnvironment(): EnvironmentInfo {
  const hasNavigator = typeof navigator !== 'undefined'
  const nav = hasNavigator ? (navigator as ExtendedNavigator) : null
  return {
    userAgent: nav?.userAgent ?? 'unknown',
    platform: nav?.platform ?? 'unknown',
    language: nav?.language ?? 'unknown',
    online: nav?.onLine ?? false,
    secureContext: typeof isSecureContext !== 'undefined' ? isSecureContext : false,
    hasIndexedDb: typeof indexedDB !== 'undefined',
    deviceMemory: nav?.deviceMemory ?? null,
    hardwareConcurrency: nav?.hardwareConcurrency ?? null,
  }
}

export interface StorageEstimateResult {
  quota: number | null
  usage: number | null
}

export async function estimateStorage(): Promise<StorageEstimateResult> {
  try {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      const est = await navigator.storage.estimate()
      return { quota: est.quota ?? null, usage: est.usage ?? null }
    }
  } catch {
    // ignore storage estimate failures
  }
  return { quota: null, usage: null }
}

export type DiagnosticLogInput = Partial<DiagnosticLogEntry> & {
  engine: string
  modelId: string
  inputLength: number
  outputLength: number
}

function diff(after: number | null, before: number | null): number | null {
  if (after === null || before === null) return null
  return after - before
}

export function createDiagnosticLogEntry(input: DiagnosticLogInput): DiagnosticLogEntry {
  const env = collectEnvironment()
  const timestamp =
    input.timestamp ?? (typeof Date !== 'undefined' ? new Date().toISOString() : '')
  return {
    timestamp,
    userAgent: input.userAgent ?? env.userAgent,
    platform: input.platform ?? env.platform,
    language: input.language ?? env.language,
    online: input.online ?? env.online,
    secureContext: input.secureContext ?? env.secureContext,
    hasIndexedDb: input.hasIndexedDb ?? env.hasIndexedDb,
    deviceMemory: input.deviceMemory ?? env.deviceMemory,
    hardwareConcurrency: input.hardwareConcurrency ?? env.hardwareConcurrency,
    engine: input.engine,
    modelId: input.modelId,
    backend: input.backend ?? 'unknown',
    loadStartedAt: input.loadStartedAt ?? null,
    loadFinishedAt: input.loadFinishedAt ?? null,
    loadDurationMs:
      input.loadDurationMs ?? diff(input.loadFinishedAt ?? null, input.loadStartedAt ?? null),
    generationStartedAt: input.generationStartedAt ?? null,
    generationFinishedAt: input.generationFinishedAt ?? null,
    generationDurationMs:
      input.generationDurationMs ??
      diff(input.generationFinishedAt ?? null, input.generationStartedAt ?? null),
    success: input.success ?? false,
    errorType: input.errorType ?? null,
    errorMessage: input.errorMessage ?? null,
    inputLength: input.inputLength,
    outputLength: input.outputLength,
    storageQuota: input.storageQuota ?? null,
    storageUsageBefore: input.storageUsageBefore ?? null,
    storageUsageAfter: input.storageUsageAfter ?? null,
    storageUsageDelta:
      input.storageUsageDelta ??
      diff(input.storageUsageAfter ?? null, input.storageUsageBefore ?? null),
  }
}

export function formatDiagnosticLog(entries: DiagnosticLogEntry[]): string {
  return JSON.stringify(entries, null, 2)
}
